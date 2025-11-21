#!/usr/bin/env python3
"""
Simple Demo for AI Shopping Assistant
Demonstrates core features without external dependencies
"""

import json
import sqlite3
import os


def create_demo_database():
    """Create demo database with sample products"""
    db_path = "demo_products.db"
    
    # Remove old database
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            price REAL,
            currency TEXT,
            category TEXT,
            image_url TEXT,
            product_url TEXT NOT NULL,
            store_name TEXT NOT NULL,
            description TEXT,
            in_stock INTEGER DEFAULT 1,
            scraped_at TEXT
        )
    """)
    
    # Sample BBQ products
    products = [
        ('bbq001', 'Premium Charcoal Grill 22-inch', 89.99, 'USD', 'BBQ & Grilling',
         'https://example.com/grill.jpg', 'https://example.com/products/grill',
         'DemoStore', 'Large charcoal grill perfect for BBQ parties', 1, '2024-01-01'),
        
        ('bbq002', 'BBQ Tool Set - 10 Pieces Stainless Steel', 24.99, 'USD', 'BBQ & Grilling',
         'https://example.com/tools.jpg', 'https://example.com/products/tools',
         'DemoStore', 'Complete BBQ tool set with spatula, tongs, fork', 1, '2024-01-01'),
        
        ('meat001', 'Fresh Beef Ribeye Steak - 1kg', 15.99, 'USD', 'Meat',
         'https://example.com/steak.jpg', 'https://example.com/products/steak',
         'DemoStore', 'Premium ribeye steak for grilling', 1, '2024-01-01'),
        
        ('meat002', 'Chicken Breast Boneless - 1kg', 8.99, 'USD', 'Meat',
         'https://example.com/chicken.jpg', 'https://example.com/products/chicken',
         'DemoStore', 'Fresh chicken breast for BBQ', 1, '2024-01-01'),
        
        ('veg001', 'Mixed Vegetables for Grilling', 5.99, 'USD', 'Vegetables',
         'https://example.com/veggies.jpg', 'https://example.com/products/veggies',
         'DemoStore', 'Bell peppers, zucchini, onions', 1, '2024-01-01'),
        
        ('drink001', 'Cola 2L Bottle - 6 Pack', 9.99, 'USD', 'Drinks',
         'https://example.com/cola.jpg', 'https://example.com/products/cola',
         'DemoStore', 'Refreshing cola for parties', 1, '2024-01-01'),
        
        ('cond001', 'BBQ Sauce Variety Pack', 12.99, 'USD', 'Condiments',
         'https://example.com/sauce.jpg', 'https://example.com/products/sauce',
         'DemoStore', '4 different BBQ sauces', 1, '2024-01-01'),
        
        ('char001', 'Premium Charcoal Briquettes - 10kg', 14.99, 'USD', 'BBQ & Grilling',
         'https://example.com/charcoal.jpg', 'https://example.com/products/charcoal',
         'DemoStore', 'Long-burning charcoal for grilling', 1, '2024-01-01'),
    ]
    
    cursor.executemany("""
        INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, products)
    
    conn.commit()
    conn.close()
    
    return db_path


def generate_shopping_list(num_people):
    """Generate a simple shopping list for BBQ"""
    
    # Calculate quantities
    meat_qty = max(1, int(num_people * 0.5))  # 0.5 kg per person
    veg_qty = max(1, int(num_people * 0.3))   # 0.3 kg per person
    drink_qty = max(1, int(num_people * 2))   # 2 bottles per person
    
    shopping_list = {
        'event_type': 'bbq',
        'num_people': num_people,
        'items': [
            {
                'name': 'Premium Charcoal Grill 22-inch',
                'category': 'BBQ & Grilling',
                'quantity': 1,
                'unit_price': 89.99,
                'total': 89.99
            },
            {
                'name': 'BBQ Tool Set - 10 Pieces',
                'category': 'BBQ & Grilling',
                'quantity': 1,
                'unit_price': 24.99,
                'total': 24.99
            },
            {
                'name': 'Premium Charcoal Briquettes - 10kg',
                'category': 'BBQ & Grilling',
                'quantity': 2,
                'unit_price': 14.99,
                'total': 29.98
            },
            {
                'name': 'Fresh Beef Ribeye Steak - 1kg',
                'category': 'Meat',
                'quantity': meat_qty,
                'unit_price': 15.99,
                'total': 15.99 * meat_qty
            },
            {
                'name': 'Chicken Breast Boneless - 1kg',
                'category': 'Meat',
                'quantity': meat_qty,
                'unit_price': 8.99,
                'total': 8.99 * meat_qty
            },
            {
                'name': 'Mixed Vegetables for Grilling',
                'category': 'Vegetables',
                'quantity': veg_qty,
                'unit_price': 5.99,
                'total': 5.99 * veg_qty
            },
            {
                'name': 'Cola 2L Bottle - 6 Pack',
                'category': 'Drinks',
                'quantity': drink_qty,
                'unit_price': 9.99,
                'total': 9.99 * drink_qty
            },
            {
                'name': 'BBQ Sauce Variety Pack',
                'category': 'Condiments',
                'quantity': 2,
                'unit_price': 12.99,
                'total': 25.98
            }
        ]
    }
    
    # Calculate total
    shopping_list['total_cost'] = sum(item['total'] for item in shopping_list['items'])
    
    return shopping_list


def print_shopping_list(shopping_list):
    """Pretty print shopping list"""
    print(f"\n🛒 SHOPPING LIST FOR {shopping_list['event_type'].upper()}")
    print(f"👥 For {shopping_list['num_people']} people")
    print("=" * 70)
    
    # Group by category
    by_category = {}
    for item in shopping_list['items']:
        cat = item['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(item)
    
    # Print items
    for category, items in by_category.items():
        print(f"\n📦 {category.upper()}")
        print("-" * 70)
        for item in items:
            print(f"   • {item['name']}")
            print(f"     Quantity: {item['quantity']} × ${item['unit_price']:.2f} = ${item['total']:.2f}")
    
    print("\n" + "=" * 70)
    print(f"💰 TOTAL COST: ${shopping_list['total_cost']:.2f}")
    print("=" * 70)


def main():
    """Run simple demo"""
    print("\n" + "🛒" * 35)
    print("     AI SHOPPING ASSISTANT - SIMPLE DEMO")
    print("🛒" * 35)
    
    print("\n" + "=" * 70)
    print("STEP 1: Creating Sample Product Database")
    print("=" * 70)
    
    db_path = create_demo_database()
    print(f"\n✅ Created database: {db_path}")
    print("📦 Added 8 sample products for BBQ party")
    
    # Show products
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name, price, category FROM products")
    products = cursor.fetchall()
    
    print("\n📋 Products in database:")
    for name, price, category in products:
        print(f"   • {name} (${price:.2f}) - {category}")
    
    conn.close()
    
    print("\n" + "=" * 70)
    print("STEP 2: AI Understanding Your Request")
    print("=" * 70)
    
    user_request = "I want to have a BBQ for 14 people"
    print(f"\n💬 User Request: \"{user_request}\"")
    
    print("\n🧠 AI Processing...")
    print("   ✓ Event Type: BBQ")
    print("   ✓ Number of People: 14")
    print("   ✓ Budget: No limit specified")
    
    print("\n" + "=" * 70)
    print("STEP 3: Building Smart Shopping List")
    print("=" * 70)
    
    shopping_list = generate_shopping_list(14)
    
    print("\n🤖 AI is calculating:")
    print("   • Meat needed: 7 kg (0.5 kg per person)")
    print("   • Vegetables: 4 kg (0.3 kg per person)")
    print("   • Drinks: 28 bottles (2 per person)")
    print("   • Essential BBQ equipment")
    print("   • Condiments and extras")
    
    print_shopping_list(shopping_list)
    
    # Save to file
    output_file = "demo_shopping_list.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(shopping_list, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Shopping list saved to: {output_file}")
    
    print("\n" + "=" * 70)
    print("✨ DEMO COMPLETE!")
    print("=" * 70)
    
    print("\n📖 What This System Can Do:\n")
    print("1. 🕷️  WEB SCRAPING")
    print("   • Scrape ANY online store (Walmart, Carrefour, Talabat, etc.)")
    print("   • Extract products, prices, images, categories")
    print("   • Handle both static and dynamic websites")
    
    print("\n2. 🗄️  SMART DATABASE")
    print("   • Store millions of products")
    print("   • Full-text search (find products by description)")
    print("   • Filter by price, category, store")
    
    print("\n3. 🤖 AI ASSISTANT")
    print("   • Understand natural language requests")
    print("   • Calculate quantities automatically")
    print("   • Optimize for budget constraints")
    print("   • Generate complete shopping lists")
    
    print("\n4. 🌐 WEB INTERFACE")
    print("   • Beautiful modern UI")
    print("   • Chat with AI in real-time")
    print("   • Visual shopping cart")
    print("   • Store management dashboard")
    
    print("\n" + "=" * 70)
    print("🚀 GETTING STARTED")
    print("=" * 70)
    
    print("\n1. Install Dependencies:")
    print("   pip install -r requirements.txt")
    
    print("\n2. Run the Web App:")
    print("   python3 web_app.py")
    print("   (Then open http://localhost:5000)")
    
    print("\n3. OR use the quick start script:")
    print("   chmod +x run.sh")
    print("   ./run.sh")
    
    print("\n4. Scrape Your Favorite Store:")
    print("   • Enter store URL (e.g., https://www.walmart.com)")
    print("   • Wait for products to be scraped")
    print("   • Start chatting with the AI!")
    
    print("\n" + "=" * 70)
    print("💡 EXAMPLE REQUESTS TO TRY")
    print("=" * 70)
    
    examples = [
        "I want to have a BBQ for 14 people",
        "Dinner party for 8, budget $100",
        "Need snacks for 20 people at my party",
        "Shopping for a family of 4 for the week",
        "Find me grills under $50",
        "Show me meat products"
    ]
    
    for i, example in enumerate(examples, 1):
        print(f"{i}. \"{example}\"")
    
    print("\n" + "=" * 70)
    print("📚 DOCUMENTATION")
    print("=" * 70)
    
    print("\n• README_SHOPPING_ASSISTANT.md - Complete guide")
    print("• QUICKSTART.md - Quick start guide")
    print("• requirements.txt - All dependencies")
    
    print("\n" + "🛒" * 35)
    print("            🎉 HAPPY SHOPPING! 🎉")
    print("🛒" * 35)
    print()


if __name__ == "__main__":
    main()

