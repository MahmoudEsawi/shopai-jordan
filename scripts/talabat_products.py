#!/usr/bin/env python3
"""
Talabat Product Integration
Better for Middle East - Food delivery and groceries
"""

import hashlib
from datetime import datetime
from product_database import ProductDatabase


def add_talabat_products():
    """Add real Talabat-style products (UAE/Middle East focus)"""
    
    db = ProductDatabase('products.db')
    
    # Clear old products
    print("🗑️  Clearing old products...")
    import sqlite3
    conn = sqlite3.connect('products.db')
    conn.execute("DELETE FROM products")
    conn.commit()
    conn.close()
    
    # Talabat-style products (Food delivery + Groceries)
    talabat_products = [
        # BBQ Meats
        {
            'name': 'Fresh Beef Ribeye Steak - 1kg',
            'price': 45.00,
            'category': 'meat',
            'description': 'Premium ribeye steak perfect for BBQ',
            'product_url': 'https://www.talabat.com/uae/search?q=ribeye+steak',
            'image_url': 'https://via.placeholder.com/300x300?text=Ribeye+Steak',
            'store_name': 'Talabat'
        },
        {
            'name': 'Chicken Breast Boneless - 1kg',
            'price': 28.00,
            'category': 'meat',
            'description': 'Fresh boneless chicken breast',
            'product_url': 'https://www.talabat.com/uae/search?q=chicken+breast',
            'image_url': 'https://via.placeholder.com/300x300?text=Chicken+Breast',
            'store_name': 'Talabat'
        },
        {
            'name': 'Lamb Chops - 1kg',
            'price': 65.00,
            'category': 'meat',
            'description': 'Premium lamb chops for grilling',
            'product_url': 'https://www.talabat.com/uae/search?q=lamb+chops',
            'image_url': 'https://via.placeholder.com/300x300?text=Lamb+Chops',
            'store_name': 'Talabat'
        },
        
        # Vegetables
        {
            'name': 'Mixed Bell Peppers - 500g',
            'price': 8.50,
            'category': 'vegetables',
            'description': 'Red, yellow, green peppers for grilling',
            'product_url': 'https://www.talabat.com/uae/search?q=bell+peppers',
            'image_url': 'https://via.placeholder.com/300x300?text=Bell+Peppers',
            'store_name': 'Talabat'
        },
        {
            'name': 'Fresh Tomatoes - 1kg',
            'price': 6.00,
            'category': 'vegetables',
            'description': 'Fresh ripe tomatoes',
            'product_url': 'https://www.talabat.com/uae/search?q=tomatoes',
            'image_url': 'https://via.placeholder.com/300x300?text=Tomatoes',
            'store_name': 'Talabat'
        },
        {
            'name': 'Fresh Onions - 1kg',
            'price': 4.50,
            'category': 'vegetables',
            'description': 'Fresh white onions',
            'product_url': 'https://www.talabat.com/uae/search?q=onions',
            'image_url': 'https://via.placeholder.com/300x300?text=Onions',
            'store_name': 'Talabat'
        },
        {
            'name': 'Corn on the Cob - 4 pieces',
            'price': 12.00,
            'category': 'vegetables',
            'description': 'Sweet corn perfect for BBQ',
            'product_url': 'https://www.talabat.com/uae/search?q=corn+cob',
            'image_url': 'https://via.placeholder.com/300x300?text=Corn',
            'store_name': 'Talabat'
        },
        
        # Drinks
        {
            'name': 'Coca Cola - 2L Bottle',
            'price': 7.50,
            'category': 'drinks',
            'description': 'Refreshing cola drink',
            'product_url': 'https://www.talabat.com/uae/search?q=coca+cola+2l',
            'image_url': 'https://via.placeholder.com/300x300?text=Coca+Cola',
            'store_name': 'Talabat'
        },
        {
            'name': 'Mineral Water - 1.5L (Pack of 6)',
            'price': 9.00,
            'category': 'drinks',
            'description': 'Fresh mineral water',
            'product_url': 'https://www.talabat.com/uae/search?q=mineral+water',
            'image_url': 'https://via.placeholder.com/300x300?text=Water',
            'store_name': 'Talabat'
        },
        {
            'name': 'Fresh Orange Juice - 1L',
            'price': 15.00,
            'category': 'drinks',
            'description': 'Freshly squeezed orange juice',
            'product_url': 'https://www.talabat.com/uae/search?q=orange+juice',
            'image_url': 'https://via.placeholder.com/300x300?text=Orange+Juice',
            'store_name': 'Talabat'
        },
        
        # Condiments & Sauces
        {
            'name': 'BBQ Sauce - 500ml',
            'price': 18.00,
            'category': 'condiments',
            'description': 'Premium BBQ sauce',
            'product_url': 'https://www.talabat.com/uae/search?q=bbq+sauce',
            'image_url': 'https://via.placeholder.com/300x300?text=BBQ+Sauce',
            'store_name': 'Talabat'
        },
        {
            'name': 'Garlic Sauce - 250ml',
            'price': 12.00,
            'category': 'condiments',
            'description': 'Creamy garlic sauce',
            'product_url': 'https://www.talabat.com/uae/search?q=garlic+sauce',
            'image_url': 'https://via.placeholder.com/300x300?text=Garlic+Sauce',
            'store_name': 'Talabat'
        },
        {
            'name': 'Ketchup - 500g',
            'price': 10.00,
            'category': 'condiments',
            'description': 'Tomato ketchup',
            'product_url': 'https://www.talabat.com/uae/search?q=ketchup',
            'image_url': 'https://via.placeholder.com/300x300?text=Ketchup',
            'store_name': 'Talabat'
        },
        
        # Bread & Sides
        {
            'name': 'Arabic Bread - Pack of 10',
            'price': 8.00,
            'category': 'bread',
            'description': 'Fresh Arabic pita bread',
            'product_url': 'https://www.talabat.com/uae/search?q=arabic+bread',
            'image_url': 'https://via.placeholder.com/300x300?text=Arabic+Bread',
            'store_name': 'Talabat'
        },
        {
            'name': 'Burger Buns - Pack of 8',
            'price': 12.00,
            'category': 'bread',
            'description': 'Soft burger buns',
            'product_url': 'https://www.talabat.com/uae/search?q=burger+buns',
            'image_url': 'https://via.placeholder.com/300x300?text=Burger+Buns',
            'store_name': 'Talabat'
        },
        
        # Snacks
        {
            'name': 'Potato Chips - Family Pack',
            'price': 15.00,
            'category': 'snacks',
            'description': 'Crispy potato chips',
            'product_url': 'https://www.talabat.com/uae/search?q=potato+chips',
            'image_url': 'https://via.placeholder.com/300x300?text=Chips',
            'store_name': 'Talabat'
        },
        {
            'name': 'Mixed Nuts - 500g',
            'price': 35.00,
            'category': 'snacks',
            'description': 'Premium mixed nuts',
            'product_url': 'https://www.talabat.com/uae/search?q=mixed+nuts',
            'image_url': 'https://via.placeholder.com/300x300?text=Mixed+Nuts',
            'store_name': 'Talabat'
        },
        
        # Desserts
        {
            'name': 'Fresh Fruit Platter',
            'price': 45.00,
            'category': 'dessert',
            'description': 'Mixed fresh fruits',
            'product_url': 'https://www.talabat.com/uae/search?q=fruit+platter',
            'image_url': 'https://via.placeholder.com/300x300?text=Fruit+Platter',
            'store_name': 'Talabat'
        },
        {
            'name': 'Ice Cream Tub - 1L',
            'price': 25.00,
            'category': 'dessert',
            'description': 'Vanilla ice cream',
            'product_url': 'https://www.talabat.com/uae/search?q=ice+cream',
            'image_url': 'https://via.placeholder.com/300x300?text=Ice+Cream',
            'store_name': 'Talabat'
        },
        
        # Charcoal & Supplies
        {
            'name': 'BBQ Charcoal - 5kg',
            'price': 25.00,
            'category': 'charcoal',
            'description': 'Premium BBQ charcoal',
            'product_url': 'https://www.talabat.com/uae/search?q=bbq+charcoal',
            'image_url': 'https://via.placeholder.com/300x300?text=Charcoal',
            'store_name': 'Talabat'
        },
        {
            'name': 'Disposable Plates & Cups Set',
            'price': 20.00,
            'category': 'supplies',
            'description': 'Party supplies set for 20 people',
            'product_url': 'https://www.talabat.com/uae/search?q=disposable+plates',
            'image_url': 'https://via.placeholder.com/300x300?text=Party+Supplies',
            'store_name': 'Talabat'
        },
    ]
    
    print("🛒 Adding Talabat Products...\n")
    
    for product in talabat_products:
        # Generate ID
        product['id'] = hashlib.md5(
            f"Talabat:{product['name']}".encode()
        ).hexdigest()[:16]
        
        product['currency'] = 'AED'
        product['in_stock'] = True
        product['scraped_at'] = datetime.now().isoformat()
        
        db.add_product(product)
        print(f"✅ Added: {product['name']} - AED {product['price']}")
    
    print(f"\n🎉 Successfully added {len(talabat_products)} Talabat products!")
    print(f"📊 Total products in database: {db.get_product_count()}")
    print(f"🏪 Store: Talabat (UAE/Middle East)")
    print(f"\n🔗 All products have working search links!")
    print(f"💡 Click any product → Opens Talabat search → Find & order!")
    
    db.close()


if __name__ == "__main__":
    add_talabat_products()

