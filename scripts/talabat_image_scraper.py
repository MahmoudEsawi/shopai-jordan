#!/usr/bin/env python3
"""
Talabat Image Scraper
Fetches real product images from Talabat Mart
"""

import requests
from bs4 import BeautifulSoup
import re
import time
from urllib.parse import quote


class TalabatImageScraper:
    """Scrape product images from Talabat"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Referer': 'https://www.talabat.com/'
        })
    
    def search_product(self, product_name: str) -> str:
        """
        Search for product on Talabat and get image URL
        Returns image URL or None
        """
        try:
            # Try different Talabat URL formats
            search_query = quote(product_name.lower())
            
            # Try Talabat Mart (grocery) search
            search_urls = [
                f"https://www.talabat.com/jordan/restaurants?q={search_query}",
                f"https://www.talabat.com/jordan/groceries?q={search_query}",
                f"https://www.talabat.com/jordan/search?query={search_query}",
                f"https://www.talabat.com/jordan/mart?q={search_query}",
            ]
            
            print(f"🔍 Searching Talabat for: {product_name}")
            
            for search_url in search_urls:
                try:
                    response = self.session.get(search_url, timeout=10, allow_redirects=True)
                    if response.status_code == 200:
                        break
                except:
                    continue
            else:
                # If all URLs fail, try using Google Images as fallback
                return self._get_google_image(product_name)
            
            if response.status_code != 200:
                return self._get_google_image(product_name)
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try multiple selectors for product images
            image_selectors = [
                'img[src*="product"]',
                'img[src*="item"]',
                'img[data-src*="product"]',
                'img[data-src*="item"]',
                '.product-image img',
                '.item-image img',
                '[class*="product"] img',
                '[class*="item"] img'
            ]
            
            for selector in image_selectors:
                images = soup.select(selector)
                for img in images[:3]:  # Check first 3 images
                    src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                    if src and self._is_valid_image(src):
                        # Convert relative URLs to absolute
                        if src.startswith('//'):
                            src = 'https:' + src
                        elif src.startswith('/'):
                            src = 'https://www.talabat.com' + src
                        
                        print(f"✅ Found image: {src[:80]}...")
                        return src
            
            # Try to find images in JSON data
            scripts = soup.find_all('script', type='application/json')
            for script in scripts:
                try:
                    import json
                    data = json.loads(script.string)
                    image_url = self._extract_image_from_json(data, product_name)
                    if image_url:
                        return image_url
                except:
                    continue
            
            print(f"⚠️  No image found for: {product_name}")
            return None
            
        except Exception as e:
            print(f"❌ Error searching {product_name}: {e}")
            return None
    
    def _is_valid_image(self, url: str) -> bool:
        """Check if URL is a valid product image"""
        if not url:
            return False
        
        # Exclude common non-product images
        excluded = ['logo', 'icon', 'avatar', 'banner', 'placeholder', 'default']
        if any(ex in url.lower() for ex in excluded):
            return False
        
        # Check for image extensions
        image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        if any(ext in url.lower() for ext in image_extensions):
            return True
        
        # Check for image-like patterns
        if 'image' in url.lower() or 'img' in url.lower():
            return True
        
        return False
    
    def _extract_image_from_json(self, data: dict, product_name: str) -> str:
        """Recursively search JSON for image URLs"""
        if isinstance(data, dict):
            for key, value in data.items():
                if 'image' in key.lower() or 'photo' in key.lower() or 'picture' in key.lower():
                    if isinstance(value, str) and self._is_valid_image(value):
                        return value
                elif isinstance(value, (dict, list)):
                    result = self._extract_image_from_json(value, product_name)
                    if result:
                        return result
        elif isinstance(data, list):
            for item in data:
                result = self._extract_image_from_json(item, product_name)
                if result:
                    return result
        
        return None
    
    def get_product_image(self, product_name: str, category: str = None) -> str:
        """
        Get product image URL from Talabat
        Returns image URL or placeholder
        """
        # Try direct search
        image_url = self.search_product(product_name)
        
        if image_url:
            return image_url
        
        # Try category-specific search
        if category:
            category_search = f"{product_name} {category}"
            image_url = self.search_product(category_search)
            if image_url:
                return image_url
        
        # Return placeholder if not found
        return f"https://via.placeholder.com/300x300?text={quote(product_name)}"
    
    def batch_fetch_images(self, products: list, delay: float = 1.0) -> dict:
        """
        Fetch images for multiple products
        Returns dict mapping product names to image URLs
        """
        results = {}
        
        for i, product in enumerate(products):
            product_name = product.get('name', '')
            category = product.get('category', '')
            
            print(f"\n[{i+1}/{len(products)}] Fetching image for: {product_name}")
            
            image_url = self.get_product_image(product_name, category)
            results[product_name] = image_url
            
            # Rate limiting
            if i < len(products) - 1:
                time.sleep(delay)
        
        return results


def update_products_with_images():
    """Update product database with real Talabat images"""
    from product_database import ProductDatabase
    
    db = ProductDatabase('products.db')
    scraper = TalabatImageScraper()
    
    # Get all products
    products = db.search_products(limit=1000)
    
    print(f"📦 Found {len(products)} products to update")
    print("🖼️  Fetching images from Talabat...\n")
    
    updated_count = 0
    
    for i, product in enumerate(products):
        product_name = product.get('name', '')
        current_image = product.get('image_url', '')
        
        # Skip if already has a real image (not placeholder)
        if current_image and 'placeholder' not in current_image.lower():
            print(f"[{i+1}/{len(products)}] ✅ {product_name} - Already has image")
            continue
        
        print(f"[{i+1}/{len(products)}] 🔍 Fetching image for: {product_name}")
        
        category = product.get('category', '')
        image_url = scraper.get_product_image(product_name, category)
        
        if image_url and 'placeholder' not in image_url.lower():
            # Update product in database
            import sqlite3
            conn = sqlite3.connect('products.db')
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE products SET image_url = ? WHERE id = ?",
                (image_url, product['id'])
            )
            conn.commit()
            conn.close()
            
            updated_count += 1
            print(f"  ✅ Updated with image: {image_url[:60]}...")
        else:
            print(f"  ⚠️  No image found, keeping placeholder")
        
        # Rate limiting
        time.sleep(1.5)
    
    print(f"\n✅ Updated {updated_count} products with real images!")


if __name__ == "__main__":
    print("=" * 70)
    print("🖼️  Talabat Image Scraper")
    print("=" * 70)
    print()
    
    # Test with a single product
    scraper = TalabatImageScraper()
    
    test_products = [
        "Hummus",
        "Falafel",
        "Chicken Breast",
        "Bread"
    ]
    
    print("🧪 Testing image fetching...\n")
    for product in test_products:
        image = scraper.get_product_image(product)
        print(f"{product}: {image[:80] if len(image) > 80 else image}")
        print()
    
    # Uncomment to update all products
    # print("\n" + "=" * 70)
    # print("📦 Updating all products with real images...")
    # print("=" * 70)
    # update_products_with_images()

