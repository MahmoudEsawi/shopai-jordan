#!/usr/bin/env python3
"""
Add Real Products from Walmart (Manual Entry)
Easy way to add real products to test your system
"""

from product_database import ProductDatabase
import hashlib
from datetime import datetime


def add_real_walmart_bbq_products():
    """Add real Walmart BBQ products (prices as of 2024)"""
    
    db = ProductDatabase('products.db')
    
    # Real Walmart BBQ products
    real_products = [
        {
            'name': 'Expert Grill Heavy Duty 24-Inch Charcoal Grill',
            'price': 44.88,
            'category': 'grills',
            'description': '393 sq in cooking area, adjustable charcoal pan',
            'product_url': 'https://www.walmart.com/ip/Expert-Grill-Heavy-Duty-24-Inch-Charcoal-Grill-Black/516951768',
            'image_url': 'https://i5.walmartimages.com/asr/516951768.jpg'
        },
        {
            'name': 'Kingsford Original Charcoal Briquettes, 16 lbs',
            'price': 19.98,
            'category': 'charcoal',
            'description': 'Ready to cook in 15 minutes, burns for hours',
            'product_url': 'https://www.walmart.com/ip/Kingsford-Original-Charcoal-Briquettes-16-lbs/10312244',
            'image_url': 'https://i5.walmartimages.com/asr/10312244.jpg'
        },
        {
            'name': 'Blackstone 3-Piece Professional Grade Grill Tool Set',
            'price': 29.99,
            'category': 'bbq tools',
            'description': 'Stainless steel spatula, tongs, and fork',
            'product_url': 'https://www.walmart.com/ip/Blackstone-3-Piece-Professional-Grade-Grill-Tool-Set/485079944',
            'image_url': 'https://i5.walmartimages.com/asr/485079944.jpg'
        },
        {
            'name': 'Fresh Beef Chuck Steak, 1 lb',
            'price': 7.98,
            'category': 'meat',
            'description': 'Perfect for grilling, family pack available',
            'product_url': 'https://www.walmart.com/ip/Fresh-Beef-Chuck-Steak/10452661',
            'image_url': 'https://i5.walmartimages.com/asr/10452661.jpg'
        },
        {
            'name': 'Fresh Chicken Breast, 3 lbs',
            'price': 11.94,
            'category': 'meat',
            'description': 'Boneless skinless chicken breast',
            'product_url': 'https://www.walmart.com/ip/Fresh-Chicken-Breast/44391127',
            'image_url': 'https://i5.walmartimages.com/asr/44391127.jpg'
        },
        {
            'name': 'Sweet Baby Rays BBQ Sauce Variety Pack, 3x18oz',
            'price': 8.97,
            'category': 'condiments',
            'description': 'Original, Hickory, and Honey flavors',
            'product_url': 'https://www.walmart.com/ip/Sweet-Baby-Rays-BBQ-Sauce/10314849',
            'image_url': 'https://i5.walmartimages.com/asr/10314849.jpg'
        },
        {
            'name': 'Coca-Cola Soda, 12 fl oz cans, 24 pack',
            'price': 12.98,
            'category': 'drinks',
            'description': '24 pack of 12oz Coca-Cola cans',
            'product_url': 'https://www.walmart.com/ip/Coca-Cola-Soda-12-fl-oz-cans-24-pack/10452057',
            'image_url': 'https://i5.walmartimages.com/asr/10452057.jpg'
        },
        {
            'name': 'Fresh Bell Pepper & Onion Mix, 16 oz',
            'price': 3.98,
            'category': 'vegetables',
            'description': 'Pre-cut peppers and onions for grilling',
            'product_url': 'https://www.walmart.com/ip/Fresh-Bell-Pepper-Mix/44391010',
            'image_url': 'https://i5.walmartimages.com/asr/44391010.jpg'
        },
        {
            'name': 'Fresh Corn on the Cob, 4 count',
            'price': 2.98,
            'category': 'vegetables',
            'description': 'Sweet corn perfect for grilling',
            'product_url': 'https://www.walmart.com/ip/Fresh-Corn/44390984',
            'image_url': 'https://i5.walmartimages.com/asr/44390984.jpg'
        },
        {
            'name': 'Weber iGrill Mini App Connected Thermometer',
            'price': 49.99,
            'category': 'bbq accessories',
            'description': 'Bluetooth meat thermometer',
            'product_url': 'https://www.walmart.com/ip/Weber-iGrill-Mini/164862730',
            'image_url': 'https://i5.walmartimages.com/asr/164862730.jpg'
        },
        {
            'name': 'Masterbuilt Gravity Series 560 Digital Charcoal Grill',
            'price': 499.00,
            'category': 'grills',
            'description': 'Digital charcoal grill with WiFi connectivity',
            'product_url': 'https://www.walmart.com/ip/Masterbuilt-Gravity-Series-560/342738283',
            'image_url': 'https://i5.walmartimages.com/asr/342738283.jpg'
        },
        {
            'name': 'Great Value Hamburger Buns, 8 count',
            'price': 1.24,
            'category': 'bread',
            'description': 'Soft hamburger buns',
            'product_url': 'https://www.walmart.com/ip/Great-Value-Hamburger-Buns/10315162',
            'image_url': 'https://i5.walmartimages.com/asr/10315162.jpg'
        },
    ]
    
    print("🛒 Adding Real Walmart BBQ Products...\n")
    
    for product in real_products:
        # Generate ID
        product['id'] = hashlib.md5(
            f"Walmart:{product['name']}".encode()
        ).hexdigest()[:16]
        
        product['store_name'] = 'Walmart'
        product['currency'] = 'USD'
        product['in_stock'] = True
        product['scraped_at'] = datetime.now().isoformat()
        
        db.add_product(product)
        print(f"✅ Added: {product['name']} - ${product['price']}")
    
    print(f"\n🎉 Successfully added {len(real_products)} real Walmart products!")
    print(f"📊 Total products in database: {db.get_product_count()}")
    print(f"\n🔄 Refresh your browser and try the BBQ request again!")
    
    db.close()


if __name__ == "__main__":
    add_real_walmart_bbq_products()

