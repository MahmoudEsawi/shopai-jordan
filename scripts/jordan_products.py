#!/usr/bin/env python3
"""
Jordan Market Products
Talabat Jordan + Local Markets
Prices in JOD (Jordanian Dinar)
"""

import hashlib
from datetime import datetime
from product_database import ProductDatabase


def add_jordan_products():
    """Add Jordan-specific products with JOD pricing"""
    
    db = ProductDatabase('products.db')
    
    # Clear old products
    print("🗑️  Clearing old products...")
    import sqlite3
    conn = sqlite3.connect('products.db')
    conn.execute("DELETE FROM products")
    conn.commit()
    conn.close()
    
    # Jordan products (Talabat Jordan + Local markets)
    jordan_products = [
        # BBQ Meats (Jordan prices)
        {
            'name': 'Fresh Beef Ribeye Steak - 1kg',
            'price': 12.50,
            'category': 'meat',
            'description': 'Premium local beef ribeye',
            'product_url': 'https://www.talabat.com/jordan/search?q=ribeye+steak',
            'image_url': 'https://images.unsplash.com/photo-1558030006-450675393462?w=300',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Fresh Chicken Breast - 1kg',
            'price': 4.50,
            'category': 'meat',
            'description': 'Fresh boneless chicken breast',
            'product_url': 'https://www.talabat.com/jordan/search?q=chicken+breast',
            'image_url': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Lamb Chops - 1kg',
            'price': 15.00,
            'category': 'meat',
            'description': 'Fresh Jordanian lamb chops',
            'product_url': 'https://www.talabat.com/jordan/search?q=lamb+chops',
            'image_url': 'https://images.unsplash.com/photo-1588347818036-4b2c63e83d0f?w=300',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Beef Kofta - 1kg',
            'price': 6.00,
            'category': 'meat',
            'description': 'Seasoned beef kofta for grilling',
            'product_url': 'https://www.talabat.com/jordan/search?q=beef+kofta',
            'image_url': 'https://via.placeholder.com/300x300?text=Kofta',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Chicken Shish Tawook - 1kg',
            'price': 5.50,
            'category': 'meat',
            'description': 'Marinated chicken for BBQ',
            'product_url': 'https://www.talabat.com/jordan/search?q=shish+tawook',
            'image_url': 'https://via.placeholder.com/300x300?text=Tawook',
            'store_name': 'Talabat Jordan'
        },
        
        # Fresh Vegetables
        {
            'name': 'Fresh Tomatoes - 1kg',
            'price': 0.80,
            'category': 'vegetables',
            'description': 'Local fresh tomatoes',
            'product_url': 'https://www.talabat.com/jordan/search?q=tomatoes',
            'image_url': 'https://via.placeholder.com/300x300?text=Tomatoes',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Fresh Onions - 1kg',
            'price': 0.60,
            'category': 'vegetables',
            'description': 'Local white onions',
            'product_url': 'https://www.talabat.com/jordan/search?q=onions',
            'image_url': 'https://via.placeholder.com/300x300?text=Onions',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Bell Peppers Mix - 1kg',
            'price': 1.50,
            'category': 'vegetables',
            'description': 'Mixed colored peppers',
            'product_url': 'https://www.talabat.com/jordan/search?q=bell+peppers',
            'image_url': 'https://via.placeholder.com/300x300?text=Peppers',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Fresh Parsley - Bunch',
            'price': 0.25,
            'category': 'vegetables',
            'description': 'Fresh local parsley',
            'product_url': 'https://www.talabat.com/jordan/search?q=parsley',
            'image_url': 'https://via.placeholder.com/300x300?text=Parsley',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Fresh Mint - Bunch',
            'price': 0.25,
            'category': 'vegetables',
            'description': 'Fresh mint leaves',
            'product_url': 'https://www.talabat.com/jordan/search?q=mint',
            'image_url': 'https://via.placeholder.com/300x300?text=Mint',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Lettuce - Head',
            'price': 0.50,
            'category': 'vegetables',
            'description': 'Fresh lettuce head',
            'product_url': 'https://www.talabat.com/jordan/search?q=lettuce',
            'image_url': 'https://via.placeholder.com/300x300?text=Lettuce',
            'store_name': 'Talabat Jordan'
        },
        
        # Drinks
        {
            'name': 'Coca Cola - 2L',
            'price': 1.20,
            'category': 'drinks',
            'description': 'Coca Cola 2 liter bottle',
            'product_url': 'https://www.talabat.com/jordan/search?q=coca+cola+2l',
            'image_url': 'https://via.placeholder.com/300x300?text=Cola',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Mineral Water - 1.5L (6 Pack)',
            'price': 2.00,
            'category': 'drinks',
            'description': 'Local mineral water',
            'product_url': 'https://www.talabat.com/jordan/search?q=mineral+water',
            'image_url': 'https://via.placeholder.com/300x300?text=Water',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Fresh Orange Juice - 1L',
            'price': 2.50,
            'category': 'drinks',
            'description': 'Freshly squeezed orange juice',
            'product_url': 'https://www.talabat.com/jordan/search?q=orange+juice',
            'image_url': 'https://via.placeholder.com/300x300?text=Juice',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Ayran (Laban) - 1L',
            'price': 1.00,
            'category': 'drinks',
            'description': 'Traditional yogurt drink',
            'product_url': 'https://www.talabat.com/jordan/search?q=ayran+laban',
            'image_url': 'https://via.placeholder.com/300x300?text=Ayran',
            'store_name': 'Talabat Jordan'
        },
        
        # Bread & Sides
        {
            'name': 'Arabic Bread (Khubz) - 10 pieces',
            'price': 0.50,
            'category': 'bread',
            'description': 'Fresh Arabic pita bread',
            'product_url': 'https://www.talabat.com/jordan/search?q=arabic+bread',
            'image_url': 'https://via.placeholder.com/300x300?text=Khubz',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Taboon Bread - 5 pieces',
            'price': 1.00,
            'category': 'bread',
            'description': 'Traditional taboon bread',
            'product_url': 'https://www.talabat.com/jordan/search?q=taboon+bread',
            'image_url': 'https://via.placeholder.com/300x300?text=Taboon',
            'store_name': 'Talabat Jordan'
        },
        
        # Sauces & Condiments
        {
            'name': 'Tahini Sauce - 500g',
            'price': 2.00,
            'category': 'condiments',
            'description': 'Pure tahini paste',
            'product_url': 'https://www.talabat.com/jordan/search?q=tahini',
            'image_url': 'https://via.placeholder.com/300x300?text=Tahini',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Garlic Sauce (Toum) - 250ml',
            'price': 1.50,
            'category': 'condiments',
            'description': 'Lebanese garlic sauce',
            'product_url': 'https://www.talabat.com/jordan/search?q=garlic+sauce+toum',
            'image_url': 'https://via.placeholder.com/300x300?text=Toum',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Hummus - 500g',
            'price': 2.50,
            'category': 'condiments',
            'description': 'Fresh hummus',
            'product_url': 'https://www.talabat.com/jordan/search?q=hummus',
            'image_url': 'https://source.unsplash.com/400x400/?hummus,food',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Falafel - 20 pieces',
            'price': 3.50,
            'category': 'condiments',
            'description': 'Fresh falafel balls',
            'product_url': 'https://www.talabat.com/jordan/search?q=falafel',
            'image_url': 'https://source.unsplash.com/400x400/?falafel,food',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'BBQ Sauce - 500ml',
            'price': 2.00,
            'category': 'condiments',
            'description': 'BBQ sauce',
            'product_url': 'https://www.talabat.com/jordan/search?q=bbq+sauce',
            'image_url': 'https://via.placeholder.com/300x300?text=BBQ+Sauce',
            'store_name': 'Talabat Jordan'
        },
        
        # Salads & Sides
        {
            'name': 'Tabbouleh Salad - 500g',
            'price': 3.00,
            'category': 'salads',
            'description': 'Fresh tabbouleh salad',
            'product_url': 'https://www.talabat.com/jordan/search?q=tabbouleh',
            'image_url': 'https://via.placeholder.com/300x300?text=Tabbouleh',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Fattoush Salad - 500g',
            'price': 2.50,
            'category': 'salads',
            'description': 'Traditional fattoush',
            'product_url': 'https://www.talabat.com/jordan/search?q=fattoush',
            'image_url': 'https://via.placeholder.com/300x300?text=Fattoush',
            'store_name': 'Talabat Jordan'
        },
        
        # Snacks
        {
            'name': 'Mixed Nuts - 500g',
            'price': 4.00,
            'category': 'snacks',
            'description': 'Roasted mixed nuts',
            'product_url': 'https://www.talabat.com/jordan/search?q=mixed+nuts',
            'image_url': 'https://via.placeholder.com/300x300?text=Nuts',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Potato Chips - Large Pack',
            'price': 1.50,
            'category': 'snacks',
            'description': 'Crispy potato chips',
            'product_url': 'https://www.talabat.com/jordan/search?q=potato+chips',
            'image_url': 'https://via.placeholder.com/300x300?text=Chips',
            'store_name': 'Talabat Jordan'
        },
        
        # Desserts
        {
            'name': 'Kunafa - 1kg',
            'price': 8.00,
            'category': 'dessert',
            'description': 'Traditional Jordanian kunafa',
            'product_url': 'https://www.talabat.com/jordan/search?q=kunafa',
            'image_url': 'https://via.placeholder.com/300x300?text=Kunafa',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Baklava Mix - 1kg',
            'price': 10.00,
            'category': 'dessert',
            'description': 'Assorted baklava',
            'product_url': 'https://www.talabat.com/jordan/search?q=baklava',
            'image_url': 'https://via.placeholder.com/300x300?text=Baklava',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Fresh Fruit Platter',
            'price': 5.00,
            'category': 'dessert',
            'description': 'Seasonal fresh fruits',
            'product_url': 'https://www.talabat.com/jordan/search?q=fruit+platter',
            'image_url': 'https://via.placeholder.com/300x300?text=Fruits',
            'store_name': 'Talabat Jordan'
        },
        
        # BBQ Supplies
        {
            'name': 'Charcoal - 5kg',
            'price': 3.00,
            'category': 'charcoal',
            'description': 'Premium BBQ charcoal',
            'product_url': 'https://www.talabat.com/jordan/search?q=charcoal',
            'image_url': 'https://via.placeholder.com/300x300?text=Charcoal',
            'store_name': 'Talabat Jordan'
        },
        {
            'name': 'Disposable Plates & Cups - Set',
            'price': 2.50,
            'category': 'supplies',
            'description': 'Party supplies for 20 people',
            'product_url': 'https://www.talabat.com/jordan/search?q=disposable+plates',
            'image_url': 'https://via.placeholder.com/300x300?text=Supplies',
            'store_name': 'Talabat Jordan'
        },
    ]
    
    print("🇯🇴 Adding Jordan Products...\n")
    
    for product in jordan_products:
        # Generate ID
        product['id'] = hashlib.md5(
            f"Jordan:{product['name']}".encode()
        ).hexdigest()[:16]
        
        product['currency'] = 'JOD'
        product['in_stock'] = True
        product['scraped_at'] = datetime.now().isoformat()
        
        db.add_product(product)
        print(f"✅ Added: {product['name']} - {product['price']} JOD")
    
    print(f"\n🎉 Successfully added {len(jordan_products)} Jordan products!")
    print(f"📊 Total products in database: {db.get_product_count()}")
    print(f"🏪 Store: Talabat Jordan")
    print(f"💰 Currency: JOD (Jordanian Dinar)")
    print(f"\n🔗 All products link to Talabat Jordan!")
    print(f"🇯🇴 Perfect for Amman, Irbid, Zarqa, Aqaba!")
    
    db.close()


if __name__ == "__main__":
    add_jordan_products()

