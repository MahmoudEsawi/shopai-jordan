






#!/usr/bin/env python3
"""
Mikroelectron product URL finder

Takes a product name and price, automatically builds a Google dork,
tries to fetch the real mikroelectron.com product URL, and falls back
to constructing a probable one if Google blocks or fails.
"""

import re
import time
import random
import html
from urllib.parse import quote_plus, parse_qs, urlparse, unquote_plus
import requests
from bs4 import BeautifulSoup


USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]


def get_headers():
    return {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }


def save_debug_html(content, fname='debug_response.html'):
    try:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[*] Saved debug HTML to {fname}")
    except Exception as e:
        print(f"[!] Unable to save debug HTML: {e}")


def extract_urls_from_google_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    candidates = []

    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith('/url?'):
            parsed_qs = parse_qs(urlparse(href).query)
            q = parsed_qs.get('q')
            if q:
                url = html.unescape(q[0])
                if url not in candidates:
                    candidates.append(url)
        elif href.startswith('http') and 'mikroelectron.com' in href:
            if href not in candidates:
                candidates.append(href)

    if not candidates:
        for m in re.finditer(r'/url\?q=(https?://[^&"<>]+)', html_content):
            u = unquote_plus(m.group(1))
            if u not in candidates:
                candidates.append(u)
    return candidates


def looks_like_product_url(u):
    if not u:
        return False
    try:
        p = urlparse(u)
        if 'mikroelectron.com' not in p.netloc:
            return False
        path = p.path.lower()
        if '/product' in path or re.search(r'product', path):
            return True
        if 'p=' in p.query or 'product' in p.query:
            return True
    except Exception:
        return False
    return False


def slugify_product_name(name):
    s = name.strip().lower()
    s = s.replace('–', '-').replace('—', '-')
    s = re.sub(r'[^a-z0-9\-\s\.]', '-', s)
    s = re.sub(r'\.(?=\d)', '-', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-{2,}', '-', s)
    return s.strip('-')


def build_dork(product_name, price=None):
    dork = (
        f'site:mikroelectron.com inurl:product "{product_name}" '
        f'(JD OR JOD OR "د.أ" OR "د.ا" OR "Add to Cart" OR "Out of Stock")'
    )
    if price:
        dork += f' {price}'
    return dork


def transform_dork_to_listing(product_name, price=None, try_google=True):
    """
    Automatically builds the Google dork and tries to get the product URL.
    """
    dork = build_dork(product_name, price)
    google_base = 'https://www.google.com/search'
    encoded = quote_plus(dork)
    search_url = f"{google_base}?q={encoded}&num=10"

    print(f"\n[*] Built Google Dork:\n{dork}")
    print(f"[*] Search URL:\n{search_url}\n")

    if try_google:
        try:
            session = requests.Session()
            time.sleep(random.uniform(0.5, 1.5))
            resp = session.get(search_url, headers=get_headers(), timeout=15)
            print(f"[*] Google returned HTTP {resp.status_code}")

            if resp.status_code == 200:
                html_content = resp.text
                if 'captcha' in html_content.lower() or 'unusual traffic' in html_content.lower():
                    print("[!] Google blocked the request, fallback mode.")
                    save_debug_html(html_content)
                else:
                    candidates = extract_urls_from_google_html(html_content)
                    print(f"[*] Extracted {len(candidates)} candidate(s)")

                    for c in candidates:
                        if looks_like_product_url(c):
                            print("[+] Found product link from Google:")
                            return c
                    for c in candidates:
                        if 'mikroelectron.com' in c:
                            print("[*] Found mikroelectron link (fallback):")
                            return c
                    print("[!] No mikroelectron product links in search results.")
            else:
                print(f"[!] Non-200 status: {resp.status_code}")
                save_debug_html(resp.text)
        except Exception as e:
            print(f"[!] Error querying Google: {e}")

    # fallback
    slug = slugify_product_name(product_name)
    fallback_url = f"https://mikroelectron.com/product/{slug}"
    print("[*] Fallback constructed URL:")
    return fallback_url


def main():
    print("=" * 80)
    print("MIKROELECTRON PRODUCT URL FINDER")
    print("=" * 80)

    product_name = input("\nEnter product name: ").strip()
    price = input("Enter price (optional): ").strip() or None

    final_url = transform_dork_to_listing(product_name, price)
    print("\n=== FINAL RESULT ===")
    print(final_url)
    print("=" * 80)


if __name__ == "__main__":
    main()
