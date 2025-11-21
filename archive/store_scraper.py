#!/usr/bin/env python3
"""
Multi-Store Web Scraper
Scrapes products from various online stores (Walmart, Carrefour, Talabat, etc.)
"""

import re
import json
import time
import hashlib
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse, urljoin
from dataclasses import dataclass, asdict
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@dataclass
class Product:
    """Product data model"""
    id: str
    name: str
    price: Optional[float]
    currency: str
    category: str
    image_url: Optional[str]
    product_url: str
    store_name: str
    description: Optional[str] = None
    in_stock: bool = True
    scraped_at: str = None
    
    def __post_init__(self):
        if self.scraped_at is None:
            self.scraped_at = datetime.now().isoformat()
        
        # Generate unique ID based on store + URL
        if not self.id:
            self.id = hashlib.md5(
                f"{self.store_name}:{self.product_url}".encode()
            ).hexdigest()[:16]


class StoreScraper:
    """Base class for store scrapers"""
    
    def __init__(self, store_url: str, store_name: str):
        self.store_url = store_url
        self.store_name = store_name
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
    def get_driver(self, headless: bool = True) -> webdriver.Chrome:
        """Initialize Selenium WebDriver"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument(
            'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    
    def fetch_page(self, url: str, use_selenium: bool = False) -> Optional[str]:
        """Fetch page HTML"""
        try:
            if use_selenium:
                driver = self.get_driver()
                driver.get(url)
                time.sleep(2)  # Wait for dynamic content
                html = driver.page_source
                driver.quit()
                return html
            else:
                response = self.session.get(url, timeout=15)
                response.raise_for_status()
                return response.text
        except Exception as e:
            print(f"❌ Error fetching {url}: {e}")
            return None
    
    def extract_categories(self) -> List[Dict[str, str]]:
        """Extract categories from store - to be implemented by subclasses"""
        raise NotImplementedError
    
    def scrape_category(self, category_url: str) -> List[Product]:
        """Scrape products from a category - to be implemented by subclasses"""
        raise NotImplementedError
    
    def scrape_all(self) -> List[Product]:
        """Scrape all products from all categories"""
        all_products = []
        categories = self.extract_categories()
        
        print(f"\n🏪 Scraping {self.store_name}...")
        print(f"📦 Found {len(categories)} categories\n")
        
        for i, category in enumerate(categories, 1):
            print(f"[{i}/{len(categories)}] Scraping: {category['name']}")
            products = self.scrape_category(category['url'])
            all_products.extend(products)
            print(f"  ✓ Found {len(products)} products")
            time.sleep(1)  # Be polite to the server
        
        return all_products


class GenericScraper(StoreScraper):
    """Generic scraper that attempts to work with any e-commerce site"""
    
    def __init__(self, store_url: str, store_name: str):
        super().__init__(store_url, store_name)
        self.domain = urlparse(store_url).netloc
    
    def extract_categories(self) -> List[Dict[str, str]]:
        """Extract categories using common patterns"""
        html = self.fetch_page(self.store_url, use_selenium=True)
        if not html:
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        categories = []
        
        # Common category selectors
        selectors = [
            'nav a[href*="category"]',
            'nav a[href*="categories"]',
            '.category a',
            '.categories a',
            '[class*="category"] a',
            '[class*="nav"] a[href*="/"]',
            'header a[href*="/"]'
        ]
        
        seen_urls = set()
        
        for selector in selectors:
            links = soup.select(selector)
            for link in links:
                url = link.get('href')
                if not url:
                    continue
                
                # Make absolute URL
                if not url.startswith('http'):
                    url = urljoin(self.store_url, url)
                
                # Skip non-category links
                if url in seen_urls:
                    continue
                if not self._is_category_url(url):
                    continue
                
                seen_urls.add(url)
                name = link.get_text(strip=True) or "Unknown"
                
                categories.append({
                    'name': name,
                    'url': url
                })
        
        return categories[:20]  # Limit to 20 categories
    
    def _is_category_url(self, url: str) -> bool:
        """Check if URL looks like a category"""
        parsed = urlparse(url)
        
        # Must be from same domain
        if self.domain not in parsed.netloc:
            return False
        
        # Common category patterns
        category_patterns = [
            r'/category/',
            r'/categories/',
            r'/shop/',
            r'/products/',
            r'/browse/',
            r'/c/',
        ]
        
        path = parsed.path.lower()
        return any(re.search(pattern, path) for pattern in category_patterns)
    
    def scrape_category(self, category_url: str) -> List[Product]:
        """Scrape products from category page"""
        html = self.fetch_page(category_url, use_selenium=True)
        if not html:
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        products = []
        
        # Try to find product containers
        product_containers = self._find_product_containers(soup)
        
        for container in product_containers[:50]:  # Limit per category
            try:
                product = self._extract_product_from_container(container, category_url)
                if product:
                    products.append(product)
            except Exception as e:
                print(f"  ⚠️  Error extracting product: {e}")
                continue
        
        return products
    
    def _find_product_containers(self, soup: BeautifulSoup) -> List:
        """Find product containers on page"""
        # Common product container patterns
        selectors = [
            '[class*="product-item"]',
            '[class*="product-card"]',
            '[class*="product"]',
            '[data-product]',
            '.product',
            'article[class*="product"]',
            '[itemtype*="Product"]',
        ]
        
        for selector in selectors:
            containers = soup.select(selector)
            if containers:
                return containers
        
        return []
    
    def _extract_product_from_container(
        self, 
        container: BeautifulSoup, 
        category_url: str
    ) -> Optional[Product]:
        """Extract product data from container"""
        
        # Extract product URL
        link = container.find('a', href=True)
        if not link:
            return None
        
        product_url = link['href']
        if not product_url.startswith('http'):
            product_url = urljoin(category_url, product_url)
        
        # Extract name
        name_elem = (
            container.find(class_=re.compile(r'product.*title', re.I)) or
            container.find(class_=re.compile(r'product.*name', re.I)) or
            container.find('h2') or
            container.find('h3') or
            link
        )
        name = name_elem.get_text(strip=True) if name_elem else "Unknown Product"
        
        # Extract price
        price = None
        currency = "USD"
        
        price_elem = (
            container.find(class_=re.compile(r'price', re.I)) or
            container.find(attrs={'data-price': True})
        )
        
        if price_elem:
            price_text = price_elem.get_text(strip=True)
            price, currency = self._parse_price(price_text)
        
        # Extract image
        image_url = None
        img = container.find('img')
        if img:
            image_url = img.get('src') or img.get('data-src')
            if image_url and not image_url.startswith('http'):
                image_url = urljoin(category_url, image_url)
        
        # Category from URL
        category = self._extract_category_from_url(category_url)
        
        return Product(
            id="",
            name=name,
            price=price,
            currency=currency,
            category=category,
            image_url=image_url,
            product_url=product_url,
            store_name=self.store_name
        )
    
    def _parse_price(self, price_text: str) -> tuple[Optional[float], str]:
        """Parse price from text"""
        if not price_text:
            return None, "USD"
        
        # Extract currency
        currency_map = {
            '$': 'USD',
            '€': 'EUR',
            '£': 'GBP',
            'JOD': 'JOD',
            'AED': 'AED',
            'SAR': 'SAR',
        }
        
        currency = "USD"
        for symbol, code in currency_map.items():
            if symbol in price_text:
                currency = code
                break
        
        # Extract number
        numbers = re.findall(r'[\d,]+\.?\d*', price_text)
        if numbers:
            try:
                price = float(numbers[0].replace(',', ''))
                return price, currency
            except:
                pass
        
        return None, currency
    
    def _extract_category_from_url(self, url: str) -> str:
        """Extract category name from URL"""
        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.split('/') if p]
        
        if path_parts:
            # Return last meaningful part
            for part in reversed(path_parts):
                if not part.isdigit():
                    return part.replace('-', ' ').replace('_', ' ').title()
        
        return "General"


class WalmartScraper(GenericScraper):
    """Walmart-specific scraper"""
    
    def __init__(self):
        super().__init__("https://www.walmart.com", "Walmart")


class CarrefourScraper(GenericScraper):
    """Carrefour-specific scraper"""
    
    def __init__(self, country_code: str = "ae"):
        url = f"https://www.carrefour{country_code}.com"
        super().__init__(url, "Carrefour")


class TalabatScraper(StoreScraper):
    """Talabat-specific scraper"""
    
    def __init__(self, country: str = "uae"):
        url = f"https://www.talabat.com/{country}"
        super().__init__(url, "Talabat")
    
    def extract_categories(self) -> List[Dict[str, str]]:
        """Talabat uses restaurant categories"""
        # This would need API integration or dynamic scraping
        # For now, return common food categories
        return [
            {'name': 'Restaurants', 'url': f"{self.store_url}/restaurants"},
            {'name': 'Groceries', 'url': f"{self.store_url}/groceries"},
            {'name': 'Pharmacy', 'url': f"{self.store_url}/pharmacy"},
        ]
    
    def scrape_category(self, category_url: str) -> List[Product]:
        """Scrape Talabat category - requires API or advanced scraping"""
        print("  ⚠️  Talabat requires API access or advanced scraping")
        return []


# Factory function
def create_scraper(store_url: str, store_name: Optional[str] = None) -> StoreScraper:
    """Create appropriate scraper based on URL"""
    domain = urlparse(store_url).netloc.lower()
    
    if 'walmart' in domain:
        return WalmartScraper()
    elif 'carrefour' in domain:
        country = 'ae' if '.ae' in domain else 'sa' if '.sa' in domain else 'ae'
        return CarrefourScraper(country)
    elif 'talabat' in domain:
        return TalabatScraper()
    else:
        # Use generic scraper
        if not store_name:
            store_name = domain.split('.')[0].capitalize()
        return GenericScraper(store_url, store_name)


if __name__ == "__main__":
    # Test scraper
    print("🛒 Multi-Store Scraper Test\n")
    
    store_url = input("Enter store URL (e.g., https://www.walmart.com): ").strip()
    if not store_url:
        print("No URL provided")
        exit(0)
    
    scraper = create_scraper(store_url)
    products = scraper.scrape_all()
    
    print(f"\n✅ Scraped {len(products)} products")
    
    # Save to JSON
    output_file = f"{scraper.store_name.lower()}_products.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump([asdict(p) for p in products], f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved to: {output_file}")
    
    # Show sample
    if products:
        print(f"\n📦 Sample product:")
        print(json.dumps(asdict(products[0]), indent=2, ensure_ascii=False))

