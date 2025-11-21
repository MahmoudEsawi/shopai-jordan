#!/usr/bin/env python3
"""
Simple Web Scraper for Real Stores (without Selenium)
Works with Walmart, Amazon, and other major retailers
"""

import re
import json
import time
import hashlib
from typing import List, Dict, Optional
from urllib.parse import urlparse, urljoin
from datetime import datetime

import requests
from bs4 import BeautifulSoup


class SimpleStoreScraper:
    """Simple scraper that works without Selenium"""
    
    def __init__(self, store_url: str):
        self.store_url = store_url
        self.domain = urlparse(store_url).netloc
        self.store_name = self._extract_store_name()
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
    
    def _extract_store_name(self) -> str:
        """Extract store name from domain"""
        domain_parts = self.domain.replace('www.', '').split('.')
        return domain_parts[0].capitalize()
    
    def scrape_search_results(self, search_term: str, max_products: int = 50) -> List[Dict]:
        """Scrape products from search results"""
        print(f"\n🔍 Searching {self.store_name} for: {search_term}")
        
        products = []
        
        # Try different search URL patterns
        search_urls = self._build_search_urls(search_term)
        
        for search_url in search_urls:
            try:
                print(f"   Trying: {search_url[:80]}...")
                response = self.session.get(search_url, timeout=15)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    products = self._extract_products_from_page(soup, search_url)
                    
                    if products:
                        print(f"   ✅ Found {len(products)} products!")
                        break
                    
            except Exception as e:
                print(f"   ⚠️  Error: {str(e)[:50]}")
                continue
        
        return products[:max_products]
    
    def _build_search_urls(self, search_term: str) -> List[str]:
        """Build search URLs for different stores"""
        encoded_term = search_term.replace(' ', '+')
        
        if 'walmart' in self.domain.lower():
            return [
                f"https://www.walmart.com/search?q={encoded_term}",
            ]
        elif 'amazon' in self.domain.lower():
            return [
                f"https://www.amazon.com/s?k={encoded_term}",
            ]
        elif 'target' in self.domain.lower():
            return [
                f"https://www.target.com/s?searchTerm={encoded_term}",
            ]
        else:
            # Generic search patterns
            return [
                f"{self.store_url}/search?q={encoded_term}",
                f"{self.store_url}/s?k={encoded_term}",
                f"{self.store_url}/products?search={encoded_term}",
            ]
    
    def _extract_products_from_page(self, soup: BeautifulSoup, page_url: str) -> List[Dict]:
        """Extract products from page - works for most e-commerce sites"""
        products = []
        
        # Common product container selectors
        selectors = [
            '[data-item-id]',  # Walmart
            '[data-asin]',  # Amazon
            '.search-result-gridview-item',  # Walmart
            'div[data-component-type="s-search-result"]',  # Amazon
            '[class*="product"]',  # Generic
            'article',  # Generic
        ]
        
        containers = []
        for selector in selectors:
            containers = soup.select(selector)
            if containers:
                print(f"   Found {len(containers)} items using selector: {selector}")
                break
        
        for container in containers[:50]:  # Limit per page
            try:
                product = self._extract_product_data(container, page_url)
                if product and product.get('name') and product.get('price'):
                    products.append(product)
            except Exception as e:
                continue
        
        return products
    
    def _extract_product_data(self, container, page_url: str) -> Optional[Dict]:
        """Extract product data from container"""
        
        # Extract name
        name = None
        name_selectors = [
            'span[data-automation-id="product-title"]',  # Walmart
            'h2 a span',  # Amazon
            '[class*="product-title"]',
            '[class*="product-name"]',
            'h2', 'h3', 'h4',
        ]
        
        for selector in name_selectors:
            elem = container.select_one(selector)
            if elem:
                name = elem.get_text(strip=True)
                break
        
        if not name:
            # Try any link text
            link = container.find('a')
            if link:
                name = link.get_text(strip=True)
        
        if not name or len(name) < 3:
            return None
        
        # Extract price
        price = None
        currency = 'USD'
        
        price_selectors = [
            '[class*="price"]',
            'span[data-automation-id="product-price"]',
            '.a-price-whole',  # Amazon
            '[aria-label*="price"]',
        ]
        
        for selector in price_selectors:
            elem = container.select_one(selector)
            if elem:
                price_text = elem.get_text(strip=True)
                price, currency = self._parse_price(price_text)
                if price:
                    break
        
        # Extract product URL
        product_url = None
        link = container.find('a', href=True)
        if link:
            product_url = link['href']
            if not product_url.startswith('http'):
                product_url = urljoin(page_url, product_url)
        
        # Extract image
        image_url = None
        img = container.find('img')
        if img:
            image_url = img.get('src') or img.get('data-src')
            if image_url and not image_url.startswith('http'):
                image_url = urljoin(page_url, image_url)
        
        # Generate ID
        product_id = hashlib.md5(
            f"{self.store_name}:{name}".encode()
        ).hexdigest()[:16]
        
        return {
            'id': product_id,
            'name': name,
            'price': price,
            'currency': currency,
            'category': 'General',
            'image_url': image_url,
            'product_url': product_url or page_url,
            'store_name': self.store_name,
            'description': None,
            'in_stock': True,
            'scraped_at': datetime.now().isoformat()
        }
    
    def _parse_price(self, price_text: str) -> tuple:
        """Parse price from text"""
        if not price_text:
            return None, 'USD'
        
        # Remove common words
        price_text = re.sub(r'(?i)(now|current|was|save|from)', '', price_text)
        
        # Extract currency
        currency = 'USD'
        if '$' in price_text:
            currency = 'USD'
        elif '€' in price_text:
            currency = 'EUR'
        elif '£' in price_text:
            currency = 'GBP'
        
        # Extract number
        # Match patterns like: $19.99, 19.99, $1,299.99
        match = re.search(r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', price_text)
        if match:
            try:
                price_str = match.group(1).replace(',', '')
                price = float(price_str)
                return price, currency
            except:
                pass
        
        return None, currency
    
    def scrape_category(self, category_name: str, max_products: int = 30) -> List[Dict]:
        """Scrape products from a category"""
        return self.scrape_search_results(category_name, max_products)


def scrape_store_for_bbq(store_url: str = "https://www.walmart.com") -> List[Dict]:
    """Scrape BBQ-related products from a store"""
    
    scraper = SimpleStoreScraper(store_url)
    
    all_products = []
    
    # Search terms for BBQ party
    search_terms = [
        'bbq grill',
        'charcoal',
        'bbq tools',
        'steak',
        'chicken breast',
        'vegetables',
        'bbq sauce',
        'cola drinks',
    ]
    
    for term in search_terms:
        products = scraper.scrape_search_results(term, max_products=5)
        all_products.extend(products)
        time.sleep(1)  # Be polite to the server
    
    return all_products


if __name__ == "__main__":
    print("🛒 Simple Store Scraper - Testing\n")
    print("=" * 70)
    
    store_url = input("Enter store URL (press Enter for Walmart): ").strip()
    if not store_url:
        store_url = "https://www.walmart.com"
    
    search_term = input("What to search for (press Enter for 'bbq grill'): ").strip()
    if not search_term:
        search_term = "bbq grill"
    
    scraper = SimpleStoreScraper(store_url)
    products = scraper.scrape_search_results(search_term, max_products=10)
    
    print(f"\n✅ Found {len(products)} products\n")
    
    for i, product in enumerate(products, 1):
        print(f"{i}. {product['name']}")
        print(f"   Price: ${product['price']:.2f}")
        if product['image_url']:
            print(f"   Image: {product['image_url'][:60]}...")
        print()
    
    # Save to JSON
    if products:
        output_file = f"{scraper.store_name.lower()}_products.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved to: {output_file}")

