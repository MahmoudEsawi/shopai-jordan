#!/usr/bin/env python3
"""
Product Database Manager
Stores and indexes scraped products for fast searching
"""

import json
import sqlite3
from typing import List, Dict, Optional, Any
from datetime import datetime
import os


class ProductDatabase:
    """SQLite database for products"""
    
    def __init__(self, db_path: str = "products.db"):
        self.db_path = db_path
        self.conn = None
        self.init_database()
    
    def init_database(self):
        """Initialize database schema"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        
        cursor = self.conn.cursor()
        
        # Create products table
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
                scraped_at TEXT,
                UNIQUE(store_name, product_url)
            )
        """)
        
        # Create full-text search virtual table
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
                name,
                category,
                description,
                content='products',
                content_rowid='rowid'
            )
        """)
        
        # Create triggers to keep FTS in sync
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
                INSERT INTO products_fts(rowid, name, category, description)
                VALUES (new.rowid, new.name, new.category, new.description);
            END
        """)
        
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
                DELETE FROM products_fts WHERE rowid = old.rowid;
            END
        """)
        
        cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
                UPDATE products_fts SET 
                    name = new.name,
                    category = new.category,
                    description = new.description
                WHERE rowid = new.rowid;
            END
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_store ON products(store_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_category ON products(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_price ON products(price)")
        
        self.conn.commit()
    
    def add_product(self, product: Dict[str, Any]) -> bool:
        """Add a product to the database"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO products 
                (id, name, price, currency, category, image_url, product_url, 
                 store_name, description, in_stock, scraped_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                product.get('id'),
                product.get('name'),
                product.get('price'),
                product.get('currency', 'USD'),
                product.get('category'),
                product.get('image_url'),
                product.get('product_url'),
                product.get('store_name'),
                product.get('description'),
                1 if product.get('in_stock', True) else 0,
                product.get('scraped_at', datetime.now().isoformat())
            ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"❌ Error adding product: {e}")
            return False
    
    def add_products_bulk(self, products: List[Dict[str, Any]]) -> int:
        """Add multiple products"""
        count = 0
        for product in products:
            if self.add_product(product):
                count += 1
        return count
    
    def search_products(
        self,
        query: Optional[str] = None,
        store_name: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search products with filters"""
        
        cursor = self.conn.cursor()
        
        if query:
            # Full-text search
            sql = """
                SELECT p.* FROM products p
                JOIN products_fts fts ON p.rowid = fts.rowid
                WHERE products_fts MATCH ?
            """
            params = [query]
        else:
            sql = "SELECT * FROM products WHERE 1=1"
            params = []
        
        # Add filters
        if store_name:
            sql += " AND store_name = ?"
            params.append(store_name)
        
        if category:
            sql += " AND category LIKE ?"
            params.append(f"%{category}%")
        
        if min_price is not None:
            sql += " AND price >= ?"
            params.append(min_price)
        
        if max_price is not None:
            sql += " AND price <= ?"
            params.append(max_price)
        
        sql += f" LIMIT {limit}"
        
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    
    def get_categories(self, store_name: Optional[str] = None) -> List[str]:
        """Get all categories"""
        cursor = self.conn.cursor()
        
        if store_name:
            cursor.execute(
                "SELECT DISTINCT category FROM products WHERE store_name = ? ORDER BY category",
                (store_name,)
            )
        else:
            cursor.execute("SELECT DISTINCT category FROM products ORDER BY category")
        
        return [row[0] for row in cursor.fetchall() if row[0]]
    
    def get_stores(self) -> List[str]:
        """Get all stores"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT DISTINCT store_name FROM products ORDER BY store_name")
        return [row[0] for row in cursor.fetchall()]
    
    def get_product_count(self, store_name: Optional[str] = None) -> int:
        """Get total product count"""
        cursor = self.conn.cursor()
        
        if store_name:
            cursor.execute("SELECT COUNT(*) FROM products WHERE store_name = ?", (store_name,))
        else:
            cursor.execute("SELECT COUNT(*) FROM products")
        
        return cursor.fetchone()[0]
    
    def clear_store(self, store_name: str):
        """Clear all products from a store"""
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM products WHERE store_name = ?", (store_name,))
        self.conn.commit()
    
    def export_to_json(self, output_file: str, store_name: Optional[str] = None):
        """Export products to JSON"""
        products = self.search_products(store_name=store_name, limit=999999)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Exported {len(products)} products to {output_file}")
    
    def import_from_json(self, input_file: str) -> int:
        """Import products from JSON"""
        if not os.path.exists(input_file):
            print(f"❌ File not found: {input_file}")
            return 0
        
        with open(input_file, 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        count = self.add_products_bulk(products)
        print(f"✅ Imported {count} products from {input_file}")
        return count
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def __del__(self):
        self.close()


if __name__ == "__main__":
    # Test database
    db = ProductDatabase("test_products.db")
    
    # Add sample products
    sample_products = [
        {
            'id': 'test1',
            'name': 'Charcoal Grill',
            'price': 89.99,
            'currency': 'USD',
            'category': 'BBQ & Grilling',
            'image_url': 'https://example.com/grill.jpg',
            'product_url': 'https://example.com/products/grill',
            'store_name': 'TestStore',
            'description': 'Large charcoal grill for outdoor cooking'
        },
        {
            'id': 'test2',
            'name': 'BBQ Tool Set',
            'price': 24.99,
            'currency': 'USD',
            'category': 'BBQ & Grilling',
            'image_url': 'https://example.com/tools.jpg',
            'product_url': 'https://example.com/products/tools',
            'store_name': 'TestStore',
            'description': '10-piece stainless steel BBQ tool set'
        }
    ]
    
    db.add_products_bulk(sample_products)
    
    print(f"\n📊 Database Statistics:")
    print(f"Total products: {db.get_product_count()}")
    print(f"Stores: {db.get_stores()}")
    print(f"Categories: {db.get_categories()}")
    
    print(f"\n🔍 Search test (query='grill'):")
    results = db.search_products(query='grill')
    for product in results:
        print(f"  - {product['name']}: ${product['price']}")
    
    db.close()
    print("\n✅ Database test completed")

