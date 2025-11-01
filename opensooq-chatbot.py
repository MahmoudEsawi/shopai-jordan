
#!/usr/bin/env python3
# chatbot.py - Fixed version with better URL handling
# OpenSooq search: strict price-range mode, preserves brand+model in q= param,
# robust merging of filters (price/year/city/q) into final OpenSooq URLs.

import re
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse, quote_plus, unquote

# === CONFIG ===
TAVILY_API_KEY = ""
NUM_RESULTS = 40
PRICE_CURRENCY = 10
SINGLE_PRICE_TOL_PCT = 8

# === TEXTS / MARKERS ===
P_MARKERS = [
    "This listing is no longer available",
    "Discover similar listings",
    "This listing has been removed",
    "هذا الاعلان غير متوفر",
    "تم حذف الإعلان",
    "الاعلان غير موجود"
]
EXPIRED_TERMS = [m.lower() for m in [
    "هذا الاعلان غير متوفر", "الإعلان غير متوفر", "الإعلان غير موجود",
    "تم حذف الإعلان", "يمكنك تصفح الإعلانات المشابهة",
    "No results found", "There are no results available for your search criteria",
    "Notify me when new listings match this search", "Page not found", "اعلان غير متاح"
]]

ARABIC_INDIC_DIGITS = str.maketrans({
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '٬': ',', '٫': '.', '،': ','
})

def normalize_arabic_digits(s):
    if not s:
        return s
    return s.translate(ARABIC_INDIC_DIGITS)

_NUMBER_RE = re.compile(r'(?:\d{1,3}(?:[,\.\u066B\u066C]\d{3})+|\d+)(?:\.\d+)?')

SYNONYMS = {
    "avante": "elantra",
    "hundai": "hyundai",
    "ifinix": "infinix",
}

def slugify_product(text):
    if not text:
        return ""
    s = text.lower()
    s = normalize_arabic_digits(s)
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"\s+", "-", s).strip("-")
    return s

def clean_product_text_for_dork(s, location_hint=None):
    if not s:
        return s
    t = s.strip()
    t = re.sub(r'(?i)\bprice\b', '', t)
    t = re.sub(r'سعر', '', t)
    if location_hint:
        try:
            lh = location_hint.strip().lower()
            t = re.sub(r'(?i)\b' + re.escape(lh) + r'\b', '', t)
        except:
            pass
    t = re.sub(r'[:\-—]+$', '', t).strip()
    t = re.sub(r'\s+', ' ', t).strip()
    for wrong, correct in SYNONYMS.items():
        t = re.sub(r'(?i)\b' + re.escape(wrong) + r'\b', correct, t)
    return t

def product_text_keep_numbers(query):
    return query.strip() if query else ""

def extract_price_range_from_query(query):
    if not query:
        return (None, None, None)
    q = normalize_arabic_digits(query)
    m = re.search(r'(\d{1,7})\s*(?:-|–|—|to|TO|الى|حتى)\s*(\d{1,7})', q, flags=re.IGNORECASE)
    if m:
        try:
            a = int(m.group(1))
            b = int(m.group(2))
            lo, hi = min(a, b), max(a, b)
            return (lo, hi, "range")
        except:
            pass
    if 'سعر' in q or re.search(r'(?i)\bprice\b', q):
        nums = re.findall(r'(\d{1,7})', q)
        if nums:
            p = int(nums[-1])
            return (p, p, "single")
    return (None, None, None)

def extract_years_from_query(query):
    if not query:
        return (None, None)
    q = normalize_arabic_digits(query)
    m = re.search(r'(\b20\d{2}\b)\s*[-–—]\s*(\b20\d{2}\b)', q)
    if m:
        try:
            a = int(m.group(1))
            b = int(m.group(2))
            return (min(a, b), max(a, b))
        except:
            pass
    m = re.search(r'(\b20\d{2}\b)\s*(?:to|TO|حتى|الى)\s*(\b20\d{2}\b)', q, flags=re.IGNORECASE)
    if m:
        try:
            a = int(m.group(1))
            b = int(m.group(2))
            return (min(a, b), max(a, b))
        except:
            pass
    m = re.search(r'\b(19|20)\d{2}\b', q)
    if m:
        try:
            y = int(m.group(0))
            return (y, y)
        except:
            pass
    return (None, None)

def page_is_unavailable_by_p_html(raw_html):
    if not raw_html:
        return False
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
        for p in soup.find_all("p"):
            txt = (p.get_text(strip=True) or "").strip().lower()
            for marker in P_MARKERS:
                if marker.lower() in txt:
                    return True
    except:
        return False
    return False

def extract_price_from_text(text):
    if not text:
        return None
    t = normalize_arabic_digits(text)
    patterns = [
        r'((?:' + _NUMBER_RE.pattern + r')\s*(?:دينار|JOD|JD|د\.))',
        r'((?:' + _NUMBER_RE.pattern + r')\s*(?:din|jod|jd|د\.))',
        r'(' + _NUMBER_RE.pattern + r')'
    ]
    for pat in patterns:
        m = re.search(pat, t, flags=re.IGNORECASE)
        if m:
            candidate = m.group(1)
            nums = re.search(r'(' + _NUMBER_RE.pattern + r')', candidate)
            if nums:
                raw = nums.group(1)
                cleaned = re.sub(r'[,\.\u066B\u066C]', '', raw)
                try:
                    return int(float(cleaned))
                except:
                    continue
    return None

def is_listing_url(url):
    return bool(re.search(r"/\d{6,}", url))

def normalize_opensooq_category_path(url):
    if not url:
        return url
    try:
        url_dec = unquote(url)
    except:
        url_dec = url
    url_dec = url_dec.replace("/mobile-tablet-prices-specs/mobile/", "/mobile-phones-tablets/mobile-phones/")
    url_dec = url_dec.replace("/mobile-tablet-prices-specs/mobile-phones/", "/mobile-phones-tablets/mobile-phones/")
    if "/tags/" in url_dec and "سيارات" in url_dec:
        return "https://jo.opensooq.com/ar/cars/cars-for-sale"
    return url_dec

def remove_page_param(url):
    if not url:
        return url
    try:
        parts = urlparse(url)
        qs = dict(parse_qsl(parts.query, keep_blank_values=True))
        qs.pop('page', None)
        new_query = urlencode(qs, doseq=True)
        new_parts = parts._replace(query=new_query)
        return urlunparse(new_parts)
    except Exception:
        return re.sub(r'([&?])page=\d+(&?)', lambda m: m.group(1) if m.group(2) else '', url).rstrip('?&')

def get_category_depth(url):
    if not url:
        return 0
    parsed = urlparse(url)
    path = parsed.path.strip('/')
    path = path.split('?')[0].split('#')[0]
    segments = [s for s in path.split('/') if s and not s.isdigit()]
    return len(segments)

def has_year_in_query(query, year_from=None, year_to=None):
    if year_from is not None or year_to is not None:
        return True
    if not query:
        return False
    q = query.lower()
    return bool(re.search(r'\b(19|20)\d{2}\b', q))

def remove_year_from_url(url):
    if not url:
        return url
    parsed = urlparse(url)
    path = parsed.path
    path = re.sub(r'/\b(19|20)\d{2}\b(?=/|$)', '', path)
    path = re.sub(r'/+', '/', path)
    if path != '/' and path.endswith('/'):
        path = path.rstrip('/')
    new_parts = parsed._replace(path=path)
    return urlunparse(new_parts)

def has_storage_in_query(query):
    if not query:
        return False
    q = query.lower()
    return bool(re.search(r'\b\d+\s*(gb|tb)\b', q, re.IGNORECASE))

def remove_storage_from_url(url):
    if not url:
        return url
    parsed = urlparse(url)
    path = parsed.path
    path = re.sub(r'/\d+[-\s]?(gb|tb)\b', '', path, flags=re.IGNORECASE)
    path = re.sub(r'/+', '/', path)
    new_parts = parsed._replace(path=path)
    return urlunparse(new_parts)

def extract_product_keywords(query):
    if not query:
        return []
    q = query.lower().strip()
    q = normalize_arabic_digits(q)
    q = re.sub(r'\b(price|سعر|the|a|an)\b', '', q, flags=re.IGNORECASE)
    words = re.findall(r'\b[\w]+\b', q)
    keywords = [w for w in words if len(w) >= 2 or w.isdigit()]
    return keywords

def url_matches_product(url, product_keywords):
    if not url or not product_keywords:
        return 0
    url_lower = url.lower()
    score = 0
    for keyword in product_keywords:
        if keyword in url_lower:
            parsed = urlparse(url)
            if keyword in parsed.path.lower():
                score += 10
            else:
                score += 5
    return score

def is_malformed_opensooq_url(url):
    if not url:
        return True
    url_lower = url.lower()
    if '?/' in url or '?%2f' in url_lower:
        return True
    if '%2f' in url_lower and '?' not in url.split('%2f')[0]:
        return True
    if 'listing-serp' in url_lower:
        return True
    return False

def find_best_category_url(urls, product_text=None, original_query=None, year_from=None, year_to=None):
    if not urls:
        return None
    candidates = []
    product_slug = slugify_product(product_text) if product_text else ""
    product_keywords = extract_product_keywords(original_query or product_text or "")
    user_specified_storage = has_storage_in_query(original_query)
    user_specified_year = has_year_in_query(original_query, year_from, year_to)

    for url in urls:
        if not url or is_listing_url(url) or is_malformed_opensooq_url(url):
            continue
        url_lower = url.lower()
        has_storage = bool(re.search(r'/\d+[-\s]?(gb|tb)', url_lower))
        has_year = bool(re.search(r'/\b(19|20)\d{2}\b', url_lower))
        processed_url = url
        if has_storage and not user_specified_storage:
            processed_url = remove_storage_from_url(processed_url)
        if has_year and user_specified_year:
            processed_url = remove_year_from_url(processed_url)
        if processed_url in [c[0] for c in candidates]:
            continue
        depth = get_category_depth(processed_url)
        score = 0
        keyword_score = url_matches_product(processed_url, product_keywords)
        score += keyword_score
        if 3 <= depth <= 6:
            score += 10
        elif depth < 3:
            score += 5
        elif depth > 8:
            score -= 10
        if product_slug and product_slug in processed_url.lower():
            score += 15
        if not user_specified_storage:
            if has_storage:
                score -= 20
            else:
                score += 5
        elif user_specified_storage and has_storage:
            score += 15
        if user_specified_year and has_year:
            score -= 15
        candidates.append((processed_url, score, has_storage, keyword_score))

    if not candidates:
        return None
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[0][0]

def validate_category_url(url):
    if not url:
        return False
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def tavily_search(query, num_results=NUM_RESULTS):
    if not TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY must be set.")
    r = requests.post(
        "https://api.tavily.com/search",
        headers={"Authorization": f"Bearer {TAVILY_API_KEY}"},
        json={"query": query, "num_results": num_results, "include_domains": ["jo.opensooq.com"]},
        timeout=30
    )
    r.raise_for_status()
    raw_results = r.json().get("results", []) or []
    urls_tried = []
    seen = set()
    filtered = []
    for res in raw_results:
        if isinstance(res, str):
            u = res
            res_obj = {"url": res}
        elif isinstance(res, dict):
            u = res.get("url") or res.get("link") or ""
            res_obj = dict(res)
        else:
            continue
        if not u:
            continue
        urls_tried.append(u)
        try:
            norm = normalize_opensooq_category_path(u)
            norm = remove_page_param(norm)
        except Exception:
            norm = u
        if not norm:
            continue
        if norm in seen:
            continue
        seen.add(norm)
        res_copy = dict(res_obj)
        res_copy["url"] = norm
        filtered.append(res_copy)
    return {"results": filtered, "urls_tried": urls_tried}

def tavily_extract(urls):
    if not TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY must be set.")
    r = requests.post(
        "https://api.tavily.com/extract",
        headers={"Authorization": f"Bearer {TAVILY_API_KEY}"},
        json={"urls": urls, "include_raw_html": True, "include_images": False},
        timeout=60
    )
    r.raise_for_status()
    return r.json().get("results", [])

def build_final_filters(base_url, price_from=None, price_to=None, year_from=None, year_to=None,
                        price_currency=PRICE_CURRENCY, city=None, product_query=None):
    if not base_url:
        return base_url
    parts = urlparse(base_url)
    qs = dict(parse_qsl(parts.query, keep_blank_values=True))
    qs.pop('page', None)
    if price_from is not None:
        qs["price_from"] = str(price_from)
    if price_to is not None:
        qs["price_to"] = str(price_to)
    if (price_from is not None) or (price_to is not None):
        qs["price_currency"] = str(price_currency)
    if year_from is not None:
        qs["Car_Year_from"] = str(year_from)
    if year_to is not None:
        qs["Car_Year_to"] = str(year_to)
    if city:
        qs["city"] = city
    if product_query:
        qs["q"] = product_query
    qs["search"] = "true"
    new_query = urlencode(qs, doseq=True)
    new_parts = parts._replace(query=new_query)
    return urlunparse(new_parts)

def strip_price_tokens(text):
    if not text:
        return ""
    t = normalize_arabic_digits(text).strip()
    t = re.sub(r'(?i)\b(price|سعر)\b', '', t)
    t = re.sub(r'\b\d{1,7}\s*[-–—]\s*\d{1,7}\b', '', t)
    t = re.sub(r'\b\d{1,7}\s*(?:JOD|JD|دينار|د\.أ|d\.)\b', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def build_google_dorks(product_text, location=None, price_from=None, price_to=None, price_mode=None):
    pt = (product_text or "").strip()
    base_parts = [pt] if pt else []
    price_from_r = price_to_r = None
    if price_mode == "single" and price_from is not None:
        tol = int(price_from * (SINGLE_PRICE_TOL_PCT / 100.0))
        price_from_r = max(0, price_from - tol)
        price_to_r = price_from + tol
    elif price_mode == "range" and price_from is not None and price_to is not None:
        price_from_r, price_to_r = min(price_from, price_to), max(price_from, price_to)
    if price_from_r is not None and price_to_r is not None:
        base_parts.append(f"{int(price_from_r)}..{int(price_to_r)}")
    if location:
        base_parts.append(location.strip())
    base = " ".join(base_parts).strip()
    cat_dork = f"{base} site:jo.opensooq.com"
    listing_dork = f"{base} site:jo.opensooq.com"
    cat_dork = re.sub(r'\s+', ' ', cat_dork).strip()
    listing_dork = re.sub(r'\s+', ' ', listing_dork).strip()
    return cat_dork, listing_dork

def search_opensooq_strict(product_query, price_from=None, price_to=None, price_mode=None,
                           year_from=None, year_to=None, ask_location=True):
    raw_query = (product_query or "").strip()
    if not raw_query:
        return {"results": [], "summary": "Empty query provided."}
    if year_from is None and year_to is None:
        year_from_extracted, year_to_extracted = extract_years_from_query(raw_query)
        if year_from_extracted or year_to_extracted:
            year_from = year_from_extracted
            year_to = year_to_extracted
    product_text_raw = product_text_keep_numbers(raw_query)
    product_text_clean = clean_product_text_for_dork(product_text_raw)
    product_text = strip_price_tokens(product_text_clean)
    product_text_for_q = product_text
    location = ""
    if ask_location:
        ans = input("Would you like to narrow by location? (y/n): ").strip().lower()
        if ans in ("y", "yes"):
            location = input("Enter location (e.g. Amman): ").strip()
    cat_dork, listing_dork = build_google_dorks(product_text_for_q, location=location,
                                                price_from=price_from, price_to=price_to,
                                                price_mode=price_mode)
    cat_urls_tried = []
    try:
        cat_search = tavily_search(cat_dork, num_results=30)
        cat_results = cat_search.get("results", []) if isinstance(cat_search, dict) else cat_search
        cat_urls_tried = cat_search.get("urls_tried", []) if isinstance(cat_search, dict) else []
    except Exception as e:
        return {"results": [], "summary": f"Search error (category): {e}", "dork": cat_dork}
    potential_categories = []
    for r in cat_results:
        u = r.get("url") if isinstance(r, dict) else (r if isinstance(r, str) else None)
        if not u:
            continue
        nu = normalize_opensooq_category_path(u)
        if nu and not is_listing_url(nu):
            potential_categories.append(nu)
    category_url = find_best_category_url(potential_categories, product_text_for_q, raw_query,
                                         year_from, year_to)
    final_url = None
    if category_url:
      #  print(f"\n✓ Found category: {category_url}")
        final_url = build_final_filters(
            category_url,
            price_from=price_from,
            price_to=price_to,
            year_from=year_from,
            year_to=year_to,
            price_currency=PRICE_CURRENCY,
            city=location or None,
            product_query=product_text_for_q
        )
       # print(f"🔗 Final URL with filters: {final_url}")
    return {
        "results": [],
        "summary": f"Found category URL. Use the final_url to browse listings on OpenSooq.",
        "price_from": price_from,
        "price_to": price_to,
        "price_mode": price_mode,
        "year_from": year_from,
        "year_to": year_to,
        "product_text": product_text,
        "dork_category": cat_dork,
        "dork_listing": listing_dork,
        "category_url": category_url,
        "final_url": final_url,
        "urls_tried": cat_urls_tried,
        "filters": {
            "Car_Year_from": year_from,
            "Car_Year_to": year_to,
            "price_from": price_from,
            "price_to": price_to,
            "price_currency": PRICE_CURRENCY,
            "q": product_text_for_q or None,
            "city": location or None
        }
    }

if __name__ == "__main__":
    q = input("Search query (e.g. 'Nissan Micra 2010-2014 price 1000-6000'): ").strip()
    if not q:
        print("No query provided. Exiting.")
        exit(0)
    price_from, price_to, price_mode = extract_price_range_from_query(q)
    if price_mode is None:
        print("\nYou did not provide a price in your query. Enter a strict price range if you want to filter.")
        min_in = input("Min price (JOD) — press Enter to skip price filtering: ").strip()
        max_in = input("Max price (JOD) — press Enter to skip price filtering: ").strip()
        if min_in == "" and max_in == "":
            price_from, price_to, price_mode = (None, None, None)
        else:
            try:
                min_parsed = int(re.sub(r'[,\.\u066B\u066C]', '', normalize_arabic_digits(min_in)))
                max_parsed = int(re.sub(r'[,\.\u066B\u066C]', '', normalize_arabic_digits(max_in)))
                if min_parsed > max_parsed:
                    print("Min must be <= Max. Exiting.")
                    exit(1)
                price_from, price_to, price_mode = (min_parsed, max_parsed, "range")
            except Exception:
                print("Couldn't parse those numbers. Exiting.")
                exit(1)
    year_from, year_to = extract_years_from_query(q)
    if year_from is None and year_to is None:
        ans = input("\nWould you like to filter by year? (y/n): ").strip().lower()
        if ans in ("y", "yes"):
            while True:
                ymin = input("Min year (e.g. 2010) — press Enter to skip: ").strip()
                ymax = input("Max year (e.g. 2016) — press Enter to skip: ").strip()
                if ymin == "" and ymax == "":
                    break
                if ymin == "" or ymax == "":
                    print("Provide BOTH min and max year, or press Enter twice to skip.")
                    continue
                try:
                    ymin_i = int(normalize_arabic_digits(ymin))
                    ymax_i = int(normalize_arabic_digits(ymax))
                    if ymin_i > ymax_i:
                        print("Min year must be <= Max year. Try again.")
                        continue
                    year_from, year_to = ymin_i, ymax_i
                    break
                except:
                    print("Invalid year format. Try again.")
                    continue
    product_text = product_text_keep_numbers(q)
    product_text = clean_product_text_for_dork(product_text)
    product_text_for_q = strip_price_tokens(product_text)
    out = search_opensooq_strict(
        product_text_for_q,
        price_from=price_from,
        price_to=price_to,
        price_mode=price_mode,
        year_from=year_from,
        year_to=year_to,
        ask_location=True
    )
    print("\n" + "="*80)
    if out.get("final_url"):
        print("\n✅ Click on this link to get what you want:\n")
        print(f"   {out['final_url']}\n")
    elif out.get("category_url"):
        print("\n⚠️  Click on this link to get what you want:\n")
        print(f"   {out['category_url']}\n")
    else:
        print("\n❌ Sorry, we couldn't find a matching category. Please try a different search.\n")
    print("="*80)