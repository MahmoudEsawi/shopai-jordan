#!/usr/bin/env python3
"""
Update Product Images
Fetches real images for all products using multiple sources
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from talabat_image_scraper import TalabatImageScraper
from product_database import ProductDatabase
import sqlite3
import time


def update_all_product_images():
    """Update all products with real images"""
    
    db = ProductDatabase('products.db')
    scraper = TalabatImageScraper()
    
    # Get all products
    products = db.search_products(limit=1000)
    
    print(f"📦 Found {len(products)} products")
    print("🖼️  Fetching images...\n")
    
    updated = 0
    skipped = 0
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    for i, product in enumerate(products):
        product_name = product.get('name', '')
        current_image = product.get('image_url', '')
        product_id = product.get('id')
        
        # Skip if already has a real image
        if current_image and 'placeholder' not in current_image.lower() and 'via.placeholder' not in current_image:
            print(f"[{i+1}/{len(products)}] ✅ {product_name[:40]} - Already has image")
            skipped += 1
            continue
        
        print(f"[{i+1}/{len(products)}] 🔍 {product_name[:40]}...")
        
        category = product.get('category', '')
        image_url = scraper.get_product_image(product_name, category)
        
        # Update in database
        cursor.execute(
            "UPDATE products SET image_url = ? WHERE id = ?",
            (image_url, product_id)
        )
        conn.commit()
        
        updated += 1
        print(f"  ✅ Updated: {image_url[:60]}...")
        
        # Rate limiting
        time.sleep(1.0)
    
    conn.close()
    
    print(f"\n✅ Complete!")
    print(f"  Updated: {updated} products")
    print(f"  Skipped: {skipped} products (already had images)")


if __name__ == "__main__":
    print("=" * 70)
    print("🖼️  Update Product Images")
    print("=" * 70)
    print()
    
    update_all_product_images()

