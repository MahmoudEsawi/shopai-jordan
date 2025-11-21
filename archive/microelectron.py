#!/usr/bin/env python3
# chatbot_strict_tavily_SECURED.py
# OpenSooq search with security hardening against injection attacks

import re
import json
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse, quote_plus, unquote
from typing import Optional, Tuple, List, Dict, Any

# === SECURE CONFIG ===
TAVILY_API_KEY = "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"  # Put the tavily api key in here and let it do the rest
NUM_RESULTS = 40
PRICE_CURRENCY = 10
SINGLE_PRICE_TOL_PCT = 8

# Security: Whitelist allowed domains
ALLOWED_DOMAINS = ["jo.opensooq.com"]
MAX_QUERY_LENGTH = 500
MAX_PRICE = 10000000  # 10 million JOD max price
MIN_PRICE = 0
MAX_YEAR = 2030
MIN_YEAR = 1900

# === TEXTS / MARKERS ===
P_MARKERS = [
    "This listing is no longer available",
    "Discover similar listings",
    "This listing has been removed",
    "هذا الاعلان غير متوفر",
    "تم حذف الإعلان",
    "الاعلان غير موجود"
]

ARABIC_INDIC_DIGITS = str.maketrans({
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '٬': ',', '٫': '.', '،': ','
})


def normalize_arabic_digits(s: str) -> str:
    """Safely normalize Arabic digits to Western digits."""
    if not s or not isinstance(s, str):
        return ""
    return s.translate(ARABIC_INDIC_DIGITS)


_NUMBER_RE = re.compile(r'(?:\d{1,3}(?:[,\.\u066B\u066C]\d{3})+|\d+)(?:\.\d+)?')

SYNONYMS = {
    "avante": "elantra",
    "hundai": "hyundai",
    "ifinix": "infinix",
}


# === SECURITY FUNCTIONS ===

def sanitize_input(text: str, max_length: int = MAX_QUERY_LENGTH) -> str:
    """
    Sanitize user input to prevent injection attacks.
    - Remove dangerous characters
    - Limit length
    - Strip HTML/Script tags
    """
    if not text or not isinstance(text, str):
        return ""

    # Truncate to max length
    text = text[:max_length]

    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # Remove script/dangerous patterns
    text = re.sub(r'(?i)<script[^>]*>.*?</script>', '', text)
    text = re.sub(r'(?i)javascript:', '', text)
    text = re.sub(r'(?i)on\w+\s*=', '', text)  # Remove event handlers

    # Remove null bytes
    text = text.replace('\x00', '')

    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text


def validate_url(url: str, allowed_domains: List[str] = ALLOWED_DOMAINS) -> bool:
    """
    Validate URL is from allowed domains only.
    Prevents SSRF and malicious redirects.
    """
    if not url or not isinstance(url, str):
        return False

    try:
        parsed = urlparse(url)

        # Must have http/https scheme
        if parsed.scheme not in ['http', 'https']:
            return False

        # Must have a netloc
        if not parsed.netloc:
            return False

        # Check if domain is in allowed list
        domain = parsed.netloc.lower()

        # Remove port if present
        domain = domain.split(':')[0]

        # Check exact match or subdomain
        for allowed in allowed_domains:
            if domain == allowed or domain.endswith('.' + allowed):
                return True

        return False
    except Exception:
        return False


def validate_price(price: Optional[int]) -> bool:
    """Validate price is within acceptable range."""
    if price is None:
        return True
    if not isinstance(price, (int, float)):
        return False
    return MIN_PRICE <= price <= MAX_PRICE


def validate_year(year: Optional[int]) -> bool:
    """Validate year is within acceptable range."""
    if year is None:
        return True
    if not isinstance(year, int):
        return False
    return MIN_YEAR <= year <= MAX_YEAR


def safe_int_parse(value: str, default: Optional[int] = None) -> Optional[int]:
    """Safely parse integer from string."""
    if not value or not isinstance(value, str):
        return default
    try:
        # Remove non-digit characters except minus
        cleaned = re.sub(r'[^\d-]', '', normalize_arabic_digits(value))
        if not cleaned or cleaned == '-':
            return default
        result = int(cleaned)
        return result
    except (ValueError, OverflowError):
        return default


# === ORIGINAL FUNCTIONS WITH SECURITY ENHANCEMENTS ===

def slugify_product(text: str) -> str:
    """Slugify product text safely."""
    if not text or not isinstance(text, str):
        return ""
    text = sanitize_input(text)
    s = text.lower()
    s = normalize_arabic_digits(s)
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"\s+", "-", s).strip("-")
    return s[:200]  # Limit slug length


def clean_product_text_for_dork(s: str, location_hint: Optional[str] = None) -> str:
    """Clean product text with input sanitization."""
    if not s:
        return ""

    t = sanitize_input(s)
    t = re.sub(r'(?i)\bprice\b', '', t)
    t = re.sub(r'سعر', '', t)

    if location_hint:
        try:
            lh = sanitize_input(location_hint).strip().lower()
            t = re.sub(r'(?i)\b' + re.escape(lh) + r'\b', '', t)
        except:
            pass

    t = re.sub(r'[:\-—]+$', '', t).strip()
    t = re.sub(r'\s+', ' ', t).strip()

    for wrong, correct in SYNONYMS.items():
        t = re.sub(r'(?i)\b' + re.escape(wrong) + r'\b', correct, t)

    return t[:MAX_QUERY_LENGTH]


def product_text_keep_numbers(query: str) -> str:
    """Keep numbers in query with sanitization."""
    return sanitize_input(query.strip() if query else "")


def extract_price_range_from_query(query: str) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    """Extract price range with validation."""
    if not query:
        return (None, None, None)

    q = sanitize_input(normalize_arabic_digits(query))

    # Range pattern
    m = re.search(r'(\d{1,7})\s*(?:-|–|—|to|TO|الى|حتى)\s*(\d{1,7})', q, flags=re.IGNORECASE)
    if m:
        try:
            a = int(m.group(1))
            b = int(m.group(2))
            if validate_price(a) and validate_price(b):
                lo, hi = min(a, b), max(a, b)
                return (lo, hi, "range")
        except:
            pass

    # Single price
    if 'سعر' in q or re.search(r'(?i)\bprice\b', q):
        nums = re.findall(r'(\d{1,7})', q)
        if nums:
            try:
                p = int(nums[-1])
                if validate_price(p):
                    return (p, p, "single")
            except:
                pass

    return (None, None, None)


def extract_years_from_query(query: str) -> Tuple[Optional[int], Optional[int]]:
    """Extract year range with validation."""
    if not query:
        return (None, None)

    q = sanitize_input(normalize_arabic_digits(query))

    # Year range patterns
    m = re.search(r'(\b20\d{2}\b)\s*[-–—]\s*(\b20\d{2}\b)', q)
    if m:
        try:
            a = int(m.group(1))
            b = int(m.group(2))
            if validate_year(a) and validate_year(b):
                return (min(a, b), max(a, b))
        except:
            pass

    m = re.search(r'(\b20\d{2}\b)\s*(?:to|TO|حتى|الى)\s*(\b20\d{2}\b)', q, flags=re.IGNORECASE)
    if m:
        try:
            a = int(m.group(1))
            b = int(m.group(2))
            if validate_year(a) and validate_year(b):
                return (min(a, b), max(a, b))
        except:
            pass

    m = re.search(r'\b(19|20)\d{2}\b', q)
    if m:
        try:
            y = int(m.group(0))
            if validate_year(y):
                return (y, y)
        except:
            pass

    return (None, None)


def page_is_unavailable_by_p_html(raw_html: str) -> bool:
    """Check if page is unavailable (XSS safe)."""
    if not raw_html or not isinstance(raw_html, str):
        return False
    try:
        # Limit parsing size to prevent DoS
        soup = BeautifulSoup(raw_html[:100000], "html.parser")
        for p in soup.find_all("p"):
            txt = (p.get_text(strip=True) or "").strip().lower()
            for marker in P_MARKERS:
                if marker.lower() in txt:
                    return True
    except:
        return False
    return False


def extract_price_from_text(text: str) -> Optional[int]:
    """Extract price from text safely."""
    if not text or not isinstance(text, str):
        return None

    t = normalize_arabic_digits(sanitize_input(text))

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
                    price = int(float(cleaned))
                    if validate_price(price):
                        return price
                except:
                    continue
    return None


def is_listing_url(url: str) -> bool:
    """Check if URL is a listing page."""
    if not url or not isinstance(url, str):
        return False
    return bool(re.search(r"/\d{6,}", url))


def normalize_opensooq_category_path(url: str) -> str:
    """Normalize category path with URL validation."""
    if not url or not isinstance(url, str):
        return url

    # Validate before processing
    if not validate_url(url):
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


def remove_page_param(url: str) -> str:
    """Remove page parameter from URL safely."""
    if not url or not isinstance(url, str):
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


def get_category_depth(url: str) -> int:
    """Get category depth from URL."""
    if not url or not isinstance(url, str):
        return 0

    parsed = urlparse(url)
    path = parsed.path.strip('/')
    path = path.split('?')[0].split('#')[0]
    segments = [s for s in path.split('/') if s and not s.isdigit()]
    return len(segments)


def has_year_in_query(query: str, year_from: Optional[int] = None, year_to: Optional[int] = None) -> bool:
    """Check if query has year specification."""
    if year_from is not None or year_to is not None:
        return True
    if not query:
        return False
    q = sanitize_input(query.lower())
    return bool(re.search(r'\b(19|20)\d{2}\b', q))


def remove_year_from_url(url: str) -> str:
    """Remove year from URL safely."""
    if not url or not isinstance(url, str):
        return url

    parsed = urlparse(url)
    path = parsed.path
    path = re.sub(r'/\b(19|20)\d{2}\b(?=/|$)', '', path)
    path = re.sub(r'/+', '/', path)

    if path != '/' and path.endswith('/'):
        path = path.rstrip('/')

    new_parts = parsed._replace(path=path)
    return urlunparse(new_parts)


def has_storage_in_query(query: str) -> bool:
    """Check if query has storage specification."""
    if not query:
        return False
    q = sanitize_input(query.lower())
    return bool(re.search(r'\b\d+\s*(gb|tb)\b', q, re.IGNORECASE))


def remove_storage_from_url(url: str) -> str:
    """Remove storage from URL safely."""
    if not url or not isinstance(url, str):
        return url

    parsed = urlparse(url)
    path = parsed.path
    path = re.sub(r'/\d+[-\s]?(gb|tb)\b', '', path, flags=re.IGNORECASE)
    path = re.sub(r'/+', '/', path)
    new_parts = parsed._replace(path=path)
    return urlunparse(new_parts)


def extract_product_keywords(query: str) -> List[str]:
    """Extract keywords from query safely."""
    if not query:
        return []

    q = sanitize_input(query.lower().strip())
    q = normalize_arabic_digits(q)
    q = re.sub(r'\b(price|سعر|the|a|an)\b', '', q, flags=re.IGNORECASE)
    words = re.findall(r'\b[\w]+\b', q)
    keywords = [w for w in words if len(w) >= 2 or w.isdigit()]
    return keywords[:20]  # Limit keywords


def url_matches_product(url: str, product_keywords: List[str]) -> int:
    """Calculate URL match score."""
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


def is_malformed_opensooq_url(url: str) -> bool:
    """Check if URL is malformed."""
    if not url or not isinstance(url, str):
        return True

    url_lower = url.lower()

    if '?/' in url or '?%2f' in url_lower:
        return True
    if '%2f' in url_lower and '?' not in url.split('%2f')[0]:
        return True
    if 'listing-serp' in url_lower:
        return True

    return False


def find_best_category_url(urls: List[str], product_text: Optional[str] = None,
                           original_query: Optional[str] = None,
                           year_from: Optional[int] = None,
                           year_to: Optional[int] = None) -> Optional[str]:
    """Find best category URL with validation."""
    if not urls:
        return None

    candidates = []
    product_slug = slugify_product(product_text) if product_text else ""
    product_keywords = extract_product_keywords(original_query or product_text or "")
    user_specified_storage = has_storage_in_query(original_query)
    user_specified_year = has_year_in_query(original_query, year_from, year_to)

    for url in urls:
        # Validate URL first
        if not url or not validate_url(url) or is_listing_url(url) or is_malformed_opensooq_url(url):
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

    print(f"\n📊 Top 3 URL candidates:")
    for i, (url, score, has_storage, kw_score) in enumerate(candidates[:3], 1):
        print(f"   {i}. Score: {score} (keywords: {kw_score}) - {url[:80]}...")

    return candidates[0][0]


def validate_category_url(url: str) -> bool:
    """Validate category URL with security check."""
    if not url or not validate_url(url):
        return False

    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except:
        return False


# === TAVILY SEARCH WITH SECURITY ===

def tavily_search(query: str, num_results: int = NUM_RESULTS,
                  enforce_exact: bool = False,
                  required_tokens: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Secure Tavily search with input validation.
    """
    if not TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY environment variable must be set.")

    # Sanitize query
    query = sanitize_input(query)
    if not query:
        return {"results": [], "urls_tried": []}

    # Limit number of results
    num_results = min(max(1, num_results), 100)

    # Clean up query
    q = re.sub(r'\bsite:jo\.opensooq\.com\b', '', query, flags=re.IGNORECASE).strip()
    q = re.sub(r'\s+', ' ', q).strip()

    # Build stricter query when requested
    q_to_send = q
    if enforce_exact:
        tokens = extract_product_keywords(q)
        first_tok = tokens[0] if tokens else None
        q_quoted = f'"{q}" site:jo.opensooq.com'
        if first_tok:
            q_quoted = f'{q_quoted} inurl:{quote_plus(first_tok)}'
        q_to_send = q_quoted

    payload = {
        "query": q_to_send,
        "num_results": num_results,
        "include_domains": ALLOWED_DOMAINS
    }

    try:
        r = requests.post(
            "https://api.tavily.com/search",
            headers={
                "Authorization": f"Bearer {TAVILY_API_KEY}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=30
        )
        r.raise_for_status()
        resp_json = r.json()
    except requests.exceptions.RequestException as e:
        print(f"⚠️  API request failed: {e}")
        return {"results": [], "urls_tried": []}

    raw_results = resp_json.get("results", []) or []

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

        # Security: Validate URL domain
        if not validate_url(u):
            continue

        urls_tried.append(u)

        try:
            norm = normalize_opensooq_category_path(u)
            norm = remove_page_param(norm)
        except Exception:
            norm = u

        if not norm or norm in seen:
            continue

        seen.add(norm)

        # Filter by required tokens
        if required_tokens:
            url_lower = norm.lower()
            title_lower = (res_obj.get("title") or "").lower()
            all_present = True

            for tok in required_tokens:
                tok_l = sanitize_input(tok.lower())
                if tok_l not in url_lower and tok_l not in title_lower:
                    all_present = False
                    break

            if not all_present:
                continue

        res_copy = dict(res_obj)
        res_copy["url"] = norm
        filtered.append(res_copy)

    return {"results": filtered, "urls_tried": urls_tried}


def tavily_extract(urls: List[str]) -> List[Dict[str, Any]]:
    """Secure Tavily extract with URL validation."""
    if not TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY environment variable must be set.")

    # Validate all URLs
    validated_urls = [u for u in urls if validate_url(u)]

    if not validated_urls:
        return []

    try:
        r = requests.post(
            "https://api.tavily.com/extract",
            headers={"Authorization": f"Bearer {TAVILY_API_KEY}"},
            json={
                "urls": validated_urls,
                "include_raw_html": True,
                "include_images": False
            },
            timeout=60
        )
        r.raise_for_status()
        return r.json().get("results", [])
    except requests.exceptions.RequestException as e:
        print(f"⚠️  Extract request failed: {e}")
        return []


def build_final_filters(base_url: str, price_from: Optional[int] = None,
                        price_to: Optional[int] = None, year_from: Optional[int] = None,
                        year_to: Optional[int] = None, price_currency: int = PRICE_CURRENCY,
                        city: Optional[str] = None, product_query: Optional[str] = None) -> str:
    """Build final URL with filters (with validation)."""
    if not base_url or not validate_url(base_url):
        return base_url

    parts = urlparse(base_url)
    qs = dict(parse_qsl(parts.query, keep_blank_values=True))
    qs.pop('page', None)

    # Validate and add price filters
    if price_from is not None and validate_price(price_from):
        qs["price_from"] = str(int(price_from))

    if price_to is not None and validate_price(price_to):
        qs["price_to"] = str(int(price_to))

    if (price_from is not None) or (price_to is not None):
        qs["price_currency"] = str(price_currency)

    # Validate and add year filters
    if year_from is not None and validate_year(year_from):
        qs["Car_Year_from"] = str(year_from)

    if year_to is not None and validate_year(year_to):
        qs["Car_Year_to"] = str(year_to)

    # Sanitize city input
    if city:
        city_clean = sanitize_input(city)
        if city_clean:
            qs["city"] = city_clean

    # Sanitize product query
    if product_query:
        pq_clean = sanitize_input(product_query)
        if pq_clean:
            qs["q"] = pq_clean

    qs["search"] = "true"

    new_query = urlencode(qs, doseq=True)
    new_parts = parts._replace(query=new_query)
    return urlunparse(new_parts)


def strip_price_tokens(text: str) -> str:
    """Strip price tokens from text safely."""
    if not text:
        return ""

    t = normalize_arabic_digits(sanitize_input(text)).strip()
    t = re.sub(r'(?i)\b(price|سعر)\b', '', t)
    t = re.sub(r'\b\d{1,7}\s*[-–—]\s*\d{1,7}\b', '', t)
    t = re.sub(r'\b\d{1,7}\s*(?:JOD|JD|دينار|د\.أ|d\.)\b', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def build_google_dorks(product_text: str, location: Optional[str] = None,
                       price_from: Optional[int] = None, price_to: Optional[int] = None,
                       price_mode: Optional[str] = None) -> Tuple[str, str]:
    """Build search dorks with input sanitization."""
    pt = sanitize_input(product_text or "").strip()
    base_parts = [pt] if pt else []

    price_from_r = price_to_r = None

    if price_mode == "single" and price_from is not None and validate_price(price_from):
        tol = int(price_from * (SINGLE_PRICE_TOL_PCT / 100.0))
        price_from_r = max(0, price_from - tol)
        price_to_r = price_from + tol
    elif price_mode == "range" and price_from is not None and price_to is not None:
        if validate_price(price_from) and validate_price(price_to):
            price_from_r, price_to_r = min(price_from, price_to), max(price_from, price_to)

    if price_from_r is not None and price_to_r is not None:
        base_parts.append(f"{int(price_from_r)}..{int(price_to_r)}")

    if location:
        loc_clean = sanitize_input(location).strip()
        if loc_clean:
            base_parts.append(loc_clean)

    base = " ".join(base_parts).strip()
    cat_dork = f"{base} site:jo.opensooq.com"
    listing_dork = f"{base} site:jo.opensooq.com"

    cat_dork = re.sub(r'\s+', ' ', cat_dork).strip()
    listing_dork = re.sub(r'\s+', ' ', listing_dork).strip()

    return cat_dork, listing_dork


def search_opensooq_strict(product_query: str, price_from: Optional[int] = None,
                           price_to: Optional[int] = None, price_mode: Optional[str] = None,
                           year_from: Optional[int] = None, year_to: Optional[int] = None,
                           ask_location: bool = True) -> Dict[str, Any]:
    """
    Main search function with comprehensive security.
    """
    raw_query = sanitize_input(product_query or "").strip()

    if not raw_query:
        return {"results": [], "summary": "Empty query provided."}

    # Extract years if not provided
    if year_from is None and year_to is None:
        year_from_extracted, year_to_extracted = extract_years_from_query(raw_query)
        if year_from_extracted or year_to_extracted:
            year_from = year_from_extracted
            year_to = year_to_extracted

    # Validate years
    if year_from is not None and not validate_year(year_from):
        return {"results": [], "summary": f"Invalid year_from: {year_from}"}

    if year_to is not None and not validate_year(year_to):
        return {"results": [], "summary": f"Invalid year_to: {year_to}"}

    # Validate prices
    if price_from is not None and not validate_price(price_from):
        return {"results": [], "summary": f"Invalid price_from: {price_from}"}

    if price_to is not None and not validate_price(price_to):
        return {"results": [], "summary": f"Invalid price_to: {price_to}"}

    product_text_raw = product_text_keep_numbers(raw_query)
    product_text_clean = clean_product_text_for_dork(product_text_raw)
    product_text = strip_price_tokens(product_text_clean)
    product_text_for_q = product_text

    location = ""
    if ask_location:
        ans = input("Would you like to narrow by location? (y/n): ").strip().lower()
        if ans in ("y", "yes"):
            location_input = input("Enter location (e.g. Amman): ").strip()
            location = sanitize_input(location_input)

    # Build search dorks
    cat_dork, listing_dork = build_google_dorks(
        product_text_for_q,
        location=location,
        price_from=price_from,
        price_to=price_to,
        price_mode=price_mode
    )

    print(f"\n🔍 Searching with dork: {cat_dork}")
    if year_from or year_to:
        print(f"📅 Year filter: {year_from or 'any'} to {year_to or 'any'}")

    cat_urls_tried = []

    try:
        # Extract required tokens for strict matching
        required_tokens = extract_product_keywords(product_text_for_q)

        # Perform search with security
        cat_search = tavily_search(
            cat_dork,
            num_results=30,
            enforce_exact=True,
            required_tokens=required_tokens
        )

        cat_results = cat_search.get("results", []) if isinstance(cat_search, dict) else cat_search
        cat_urls_tried = cat_search.get("urls_tried", []) if isinstance(cat_search, dict) else []

    except Exception as e:
        return {
            "results": [],
            "summary": f"Search error (category): {e}",
            "dork": cat_dork
        }

    # Filter valid category URLs
    potential_categories = []
    for r in cat_results:
        u = r.get("url") if isinstance(r, dict) else (r if isinstance(r, str) else None)
        if not u:
            continue

        # Security check
        if not validate_url(u):
            continue

        nu = normalize_opensooq_category_path(u)
        if nu and not is_listing_url(nu):
            potential_categories.append(nu)

    # Find best category URL
    category_url = find_best_category_url(
        potential_categories,
        product_text_for_q,
        raw_query,
        year_from,
        year_to
    )

    final_url = None

    if category_url:
        print(f"\n✓ Found category: {category_url}")

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

        print(f"🔗 Final URL with filters: {final_url}")

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
    # Check if API key is set
    if not TAVILY_API_KEY:
        print("❌ ERROR: TAVILY_API_KEY environment variable is not set!")
        print("\nTo fix this, run:")
        print("  export TAVILY_API_KEY='your-api-key-here'")
        print("\nOr on Windows:")
        print("  set TAVILY_API_KEY=your-api-key-here")
        exit(1)

    q = input("Search query (e.g. 'Nissan Micra 2010-2014 price 1000-6000'): ").strip()

    if not q:
        print("No query provided. Exiting.")
        exit(0)

    # Extract price range
    price_from, price_to, price_mode = extract_price_range_from_query(q)

    if price_mode is None:
        print("\nYou did not provide a price in your query. Enter a strict price range if you want to filter.")
        min_in = input("Min price (JOD) — press Enter to skip price filtering: ").strip()
        max_in = input("Max price (JOD) — press Enter to skip price filtering: ").strip()

        if min_in == "" and max_in == "":
            price_from, price_to, price_mode = (None, None, None)
        else:
            min_parsed = safe_int_parse(min_in)
            max_parsed = safe_int_parse(max_in)

            if min_parsed is None or max_parsed is None:
                print("❌ Invalid price input. Exiting.")
                exit(1)

            if not validate_price(min_parsed) or not validate_price(max_parsed):
                print(f"❌ Price must be between {MIN_PRICE} and {MAX_PRICE}. Exiting.")
                exit(1)

            if min_parsed > max_parsed:
                print("❌ Min must be <= Max. Exiting.")
                exit(1)

            price_from, price_to, price_mode = (min_parsed, max_parsed, "range")

    # Extract year range
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
                    print("⚠️  Provide BOTH min and max year, or press Enter twice to skip.")
                    continue

                ymin_i = safe_int_parse(ymin)
                ymax_i = safe_int_parse(ymax)

                if ymin_i is None or ymax_i is None:
                    print("❌ Invalid year format. Try again.")
                    continue

                if not validate_year(ymin_i) or not validate_year(ymax_i):
                    print(f"❌ Year must be between {MIN_YEAR} and {MAX_YEAR}. Try again.")
                    continue

                if ymin_i > ymax_i:
                    print("❌ Min year must be <= Max year. Try again.")
                    continue

                year_from, year_to = ymin_i, ymax_i
                break

    # Perform search
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

    print("\n🤖 Chatbot:\n")
    print(out.get("summary", "No summary available."))

    if out.get("final_url"):
        print(f"\n✅ Open this URL in your browser:")
        print(f"   {out['final_url']}")
    elif out.get("category_url"):
        print(f"\n⚠️  Found category but couldn't build filtered URL:")
        print(f"   {out['category_url']}")
    else:
        print("\n❌ Could not find a suitable category URL.")

    print("\n\nDEBUG JSON:\n")
    try:
        print(json.dumps(out, ensure_ascii=False, indent=2))
    except Exception:
        print(out)
