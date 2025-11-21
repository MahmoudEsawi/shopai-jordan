#!/usr/bin/env python3
"""
Demo script for AI Shopping Assistant
Demonstrates all features without needing a web browser
"""

import json
from store_scraper import GenericScraper
from product_database import ProductDatabase
from shopping_assistant import ShoppingAssistant


def demo_scraper():
    """Demo 1: Web Scraping"""
    print("\n" + "="*60)
    print("📦 DEMO 1: WEB SCRAPER")
    print("="*60)
    
    print("\n🕷️  This scraper can extract products from any online store:")
    print("   - Product names")
    print("   - Prices")
    print("   - Categories")
    print("   - Images")
    print("   - Product URLs")
    
    print("\n✨ Supported stores:")
    print("   • Walmart")
    print("   • Carrefour")
    print("   • Talabat")
    print("   • OpenSooq (already in microelectron.py)")
    print("   • Any generic e-commerce site")
    
    print("\n💡 To scrape a store, use:")
    print("   python store_scraper.py")
    print("   (Then enter the store URL)")


def demo_database():
    """Demo 2: Product Database"""
    print("\n" + "="*60)
    print("🗄️  DEMO 2: PRODUCT DATABASE")
    print("="*60)
    
    db = ProductDatabase("demo_products.db")
    
    # Add sample products for BBQ
    sample_products = [
        {
            'id': 'bbq001',
            'name': 'Premium Charcoal Grill 22-inch',
            'price': 89.99,
            'currency': 'USD',
            'category': 'BBQ & Grilling',
            'image_url': 'https://example.com/grill.jpg',
            'product_url': 'https://example.com/products/grill',
            'store_name': 'DemoStore',
            'description': 'Large charcoal grill perfect for BBQ parties'
        },
        {
            'id': 'bbq002',
            'name': 'BBQ Tool Set - 10 Pieces Stainless Steel',
            'price': 24.99,
            'currency': 'USD',
            'category': 'BBQ & Grilling',
            'image_url': 'https://example.com/tools.jpg',
            'product_url': 'https://example.com/products/tools',
            'store_name': 'DemoStore',
            'description': 'Complete BBQ tool set with spatula, tongs, fork'
        },
        {
            'id': 'meat001',
            'name': 'Fresh Beef Ribeye Steak - 1kg',
            'price': 15.99,
            'currency': 'USD',
            'category': 'Meat',
            'image_url': 'https://example.com/steak.jpg',
            'product_url': 'https://example.com/products/steak',
            'store_name': 'DemoStore',
            'description': 'Premium ribeye steak for grilling'
        },
        {
            'id': 'meat002',
            'name': 'Chicken Breast Boneless - 1kg',
            'price': 8.99,
            'currency': 'USD',
            'category': 'Meat',
            'image_url': 'https://example.com/chicken.jpg',
            'product_url': 'https://example.com/products/chicken',
            'store_name': 'DemoStore',
            'description': 'Fresh chicken breast for BBQ'
        },
        {
            'id': 'veg001',
            'name': 'Mixed Vegetables for Grilling',
            'price': 5.99,
            'currency': 'USD',
            'category': 'Vegetables',
            'image_url': 'https://example.com/veggies.jpg',
            'product_url': 'https://example.com/products/veggies',
            'store_name': 'DemoStore',
            'description': 'Bell peppers, zucchini, onions'
        },
        {
            'id': 'drink001',
            'name': 'Cola 2L Bottle - 6 Pack',
            'price': 9.99,
            'currency': 'USD',
            'category': 'Drinks',
            'image_url': 'https://example.com/cola.jpg',
            'product_url': 'https://example.com/products/cola',
            'store_name': 'DemoStore',
            'description': 'Refreshing cola for parties'
        },
        {
            'id': 'cond001',
            'name': 'BBQ Sauce Variety Pack',
            'price': 12.99,
            'currency': 'USD',
            'category': 'Condiments',
            'image_url': 'https://example.com/sauce.jpg',
            'product_url': 'https://example.com/products/sauce',
            'store_name': 'DemoStore',
            'description': '4 different BBQ sauces'
        },
        {
            'id': 'char001',
            'name': 'Premium Charcoal Briquettes - 10kg',
            'price': 14.99,
            'currency': 'USD',
            'category': 'BBQ & Grilling',
            'image_url': 'https://example.com/charcoal.jpg',
            'product_url': 'https://example.com/products/charcoal',
            'store_name': 'DemoStore',
            'description': 'Long-burning charcoal for grilling'
        }
    ]
    
    print("\n📥 Adding sample products to database...")
    count = db.add_products_bulk(sample_products)
    print(f"✅ Added {count} products")
    
    print(f"\n📊 Database Statistics:")
    print(f"   Total products: {db.get_product_count()}")
    print(f"   Categories: {', '.join(db.get_categories())}")
    
    print(f"\n🔍 Search Example - Finding 'bbq' products:")
    results = db.search_products(query='bbq', limit=5)
    for product in results:
        print(f"   • {product['name']} - ${product['price']}")
    
    db.close()
    return "demo_products.db"


def demo_ai_assistant(db_path):
    """Demo 3: AI Shopping Assistant"""
    print("\n" + "="*60)
    print("🤖 DEMO 3: AI SHOPPING ASSISTANT")
    print("="*60)
    
    assistant = ShoppingAssistant(db_path=db_path)
    
    print("\n💬 Example Request:")
    user_request = "I want to have a BBQ for 14 people"
    print(f'   User: "{user_request}"')
    
    print("\n🧠 Parsing request...")
    request = assistant.parse_request(user_request)
    print(f"   Event Type: {request.event_type}")
    print(f"   Number of People: {request.num_people}")
    print(f"   Budget: {request.budget or 'No limit'}")
    
    print("\n🛒 Building shopping list...")
    shopping_list = assistant.build_shopping_list(request)
    
    print(f"\n📋 Shopping List Generated!")
    print(f"   Total Items: {len(shopping_list['items'])}")
    print(f"   Total Cost: ${shopping_list['total_cost']:.2f}")
    
    # Display by category
    by_category = {}
    for item in shopping_list['items']:
        cat = item['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(item)
    
    print("\n📦 Items by Category:")
    for category, items in by_category.items():
        print(f"\n   {category.upper()}:")
        for item in items:
            print(f"      • {item['product_name']}")
            print(f"        Qty: {item['quantity']} × ${item['unit_price']:.2f} = ${item['total_price']:.2f}")
    
    print(f"\n💰 TOTAL: ${shopping_list['total_cost']:.2f}")
    
    # Save to file
    output_file = "demo_shopping_list.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(shopping_list, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Shopping list saved to: {output_file}")


def main():
    """Run all demos"""
    print("\n" + "🛒"*30)
    print("   AI SHOPPING ASSISTANT - DEMO")
    print("🛒"*30)
    
    print("\nThis demo shows how the system works:")
    print("1. Web scraping to extract products")
    print("2. Database storage with full-text search")
    print("3. AI-powered shopping list generation")
    
    # Run demos
    demo_scraper()
    db_path = demo_database()
    demo_ai_assistant(db_path)
    
    print("\n" + "="*60)
    print("✨ DEMO COMPLETE!")
    print("="*60)
    
    print("\n🚀 Next Steps:")
    print("\n1. Run the Web App:")
    print("   python web_app.py")
    print("   (Then open http://localhost:5000)")
    
    print("\n2. Or use the quick start script:")
    print("   ./run.sh")
    
    print("\n3. Scrape a real store:")
    print("   python store_scraper.py")
    print("   (Enter a store URL like https://www.walmart.com)")
    
    print("\n4. Try different requests:")
    print("   • 'BBQ for 20 people'")
    print("   • 'Dinner party for 8, budget $100'")
    print("   • 'Shopping for family of 4'")
    
    print("\n📖 Read the documentation:")
    print("   • README_SHOPPING_ASSISTANT.md - Full guide")
    print("   • QUICKSTART.md - Quick start guide")
    
    print("\n🎉 Happy Shopping!")
    print()


if __name__ == "__main__":
    main()

