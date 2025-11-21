#!/usr/bin/env python3
"""
Update Product Images with Unsplash
Uses Unsplash for high-quality food/product images
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from product_database import ProductDatabase
import sqlite3
from urllib.parse import quote


def get_unsplash_image(product_name: str, category: str = None) -> str:
    """Get Unsplash image URL for product"""
    # Clean product name
    clean_name = product_name.lower()
    
    # Remove common suffixes
    for suffix in [' - 1kg', ' - 500g', ' - 250ml', ' - 500ml', ' - 1l', ' - 20 pieces']:
        clean_name = clean_name.replace(suffix, '')
    
    # Map to food keywords
    food_keywords = {
        'hummus': 'hummus',
        'falafel': 'falafel',
        'chicken': 'chicken breast',
        'beef': 'beef steak',
        'lamb': 'lamb chops',
        'bread': 'arabic bread',
        'khubz': 'arabic bread',
        'tomatoes': 'tomatoes',
        'cucumbers': 'cucumbers',
        'peppers': 'bell peppers',
        'onions': 'onions',
        'lettuce': 'lettuce',
        'charcoal': 'charcoal',
        'sauce': 'sauce',
        'toum': 'garlic sauce',
        'tabbouleh': 'tabbouleh salad',
        'fattoush': 'fattoush salad',
        'labneh': 'labneh',
        'zaatar': 'zaatar',
        'olives': 'olives',
        'eggs': 'eggs',
        'cheese': 'cheese',
        'tea': 'tea',
        'coffee': 'coffee',
        'drinks': 'soft drinks',
        'dessert': 'dessert',
        'ice cream': 'ice cream',
    }
    
    # Find matching keyword
    search_term = clean_name
    for key, value in food_keywords.items():
        if key in clean_name:
            search_term = value
            break
    
    # Use Unsplash
    return f"https://source.unsplash.com/400x400/?{quote(search_term)},food"


def update_all_images():
    """Update all products with Unsplash images"""
    
    db = ProductDatabase('products.db')
    products = db.search_products(limit=1000)
    
    print(f"📦 Found {len(products)} products")
    print("🖼️  Updating with Unsplash images...\n")
    
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()
    
    updated = 0
    
    for i, product in enumerate(products):
        product_name = product.get('name', '')
        product_id = product.get('id')
        category = product.get('category', '')
        
        # Get Unsplash image
        image_url = get_unsplash_image(product_name, category)
        
        # Update in database
        cursor.execute(
            "UPDATE products SET image_url = ? WHERE id = ?",
            (image_url, product_id)
        )
        conn.commit()
        
        updated += 1
        print(f"[{i+1}/{len(products)}] ✅ {product_name[:40]} - {image_url[:60]}...")
    
    conn.close()
    
    print(f"\n✅ Updated {updated} products with Unsplash images!")


if __name__ == "__main__":
    print("=" * 70)
    print("🖼️  Update Product Images with Unsplash")
    print("=" * 70)
    print()
    
    update_all_images()

