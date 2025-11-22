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
                -- Nutritional information (per 100g)
                calories_per_100g REAL,
                protein_per_100g REAL,
                carbs_per_100g REAL,
                fats_per_100g REAL,
                fiber_per_100g REAL,
                -- Dietary facts
                is_gluten_free INTEGER DEFAULT 0,
                is_vegetarian INTEGER DEFAULT 0,
                is_vegan INTEGER DEFAULT 0,
                is_halal INTEGER DEFAULT 1,
                is_organic INTEGER DEFAULT 0,
                is_healthy INTEGER DEFAULT 0,
                -- Additional info
                weight_grams REAL,
                brand TEXT,
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
        
        # Create product_brands table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL
            )
        """)
        
        # Create product_types table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL
            )
        """)
        
        # Add product_type_id column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN product_type_id INTEGER")
            cursor.execute("ALTER TABLE products ADD COLUMN product_brand_id INTEGER")
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_store ON products(store_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_category ON products(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_price ON products(price)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_brand ON products(product_brand_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_type ON products(product_type_id)")
        
        # Insert default brands and types if they don't exist
        self._seed_brands_and_types(cursor)
        
        self.conn.commit()
    
    def _seed_brands_and_types(self, cursor):
        """Seed default brands and types"""
        # Default brands
        brands = [
            ('Almarai', 'Leading dairy and food products brand'),
            ('Nestle', 'Global food and beverage company'),
            ('Coca-Cola', 'Beverage company'),
            ('Pepsi', 'Beverage company'),
            ('Danone', 'Food products company'),
            ('Unilever', 'Consumer goods company'),
            ('Local Brand', 'Local Jordanian brand')
        ]
        
        for brand_name, description in brands:
            cursor.execute("""
                INSERT OR IGNORE INTO product_brands (name, description, created_at)
                VALUES (?, ?, ?)
            """, (brand_name, description, datetime.now().isoformat()))
        
        # Default types
        types = [
            ('Dairy', 'Milk, cheese, yogurt products'),
            ('Meat', 'Fresh and processed meat products'),
            ('Beverages', 'Drinks and juices'),
            ('Fruits & Vegetables', 'Fresh produce'),
            ('Bakery', 'Bread and baked goods'),
            ('Snacks', 'Chips, crackers, snacks'),
            ('Frozen', 'Frozen food products'),
            ('Pantry', 'Canned and dry goods'),
            ('Personal Care', 'Health and beauty products'),
            ('Household', 'Cleaning and household items')
        ]
        
        for type_name, description in types:
            cursor.execute("""
                INSERT OR IGNORE INTO product_types (name, description, created_at)
                VALUES (?, ?, ?)
            """, (type_name, description, datetime.now().isoformat()))
    
    def add_product(self, product: Dict[str, Any]) -> bool:
        """Add a product to the database"""
        try:
            cursor = self.conn.cursor()
            
            # Check if columns exist, if not add them (for migration)
            try:
                cursor.execute("SELECT calories_per_100g FROM products LIMIT 1")
            except sqlite3.OperationalError:
                # Add new columns if they don't exist
                self._migrate_database()
            
            cursor.execute("""
                INSERT OR REPLACE INTO products 
                (id, name, price, currency, category, image_url, product_url, 
                 store_name, description, in_stock, scraped_at,
                 calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, fiber_per_100g,
                 is_gluten_free, is_vegetarian, is_vegan, is_halal, is_organic, is_healthy,
                 weight_grams, brand)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                product.get('id'),
                product.get('name'),
                product.get('price'),
                product.get('currency', 'JOD'),
                product.get('category'),
                product.get('image_url'),
                product.get('product_url'),
                product.get('store_name'),
                product.get('description'),
                1 if product.get('in_stock', True) else 0,
                product.get('scraped_at', datetime.now().isoformat()),
                product.get('calories_per_100g'),
                product.get('protein_per_100g'),
                product.get('carbs_per_100g'),
                product.get('fats_per_100g'),
                product.get('fiber_per_100g'),
                1 if product.get('is_gluten_free', False) else 0,
                1 if product.get('is_vegetarian', False) else 0,
                1 if product.get('is_vegan', False) else 0,
                1 if product.get('is_halal', True) else 0,
                1 if product.get('is_organic', False) else 0,
                1 if product.get('is_healthy', False) else 0,
                product.get('weight_grams'),
                product.get('brand')
            ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"❌ Error adding product: {e}")
            return False
    
    def _migrate_database(self):
        """Migrate existing database to add new columns"""
        cursor = self.conn.cursor()
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN calories_per_100g REAL")
            cursor.execute("ALTER TABLE products ADD COLUMN protein_per_100g REAL")
            cursor.execute("ALTER TABLE products ADD COLUMN carbs_per_100g REAL")
            cursor.execute("ALTER TABLE products ADD COLUMN fats_per_100g REAL")
            cursor.execute("ALTER TABLE products ADD COLUMN fiber_per_100g REAL")
            cursor.execute("ALTER TABLE products ADD COLUMN is_gluten_free INTEGER DEFAULT 0")
            cursor.execute("ALTER TABLE products ADD COLUMN is_vegetarian INTEGER DEFAULT 0")
            cursor.execute("ALTER TABLE products ADD COLUMN is_vegan INTEGER DEFAULT 0")
            cursor.execute("ALTER TABLE products ADD COLUMN is_halal INTEGER DEFAULT 1")
            cursor.execute("ALTER TABLE products ADD COLUMN is_organic INTEGER DEFAULT 0")
            cursor.execute("ALTER TABLE products ADD COLUMN is_healthy INTEGER DEFAULT 0")
            cursor.execute("ALTER TABLE products ADD COLUMN weight_grams REAL")
            cursor.execute("ALTER TABLE products ADD COLUMN brand TEXT")
            self.conn.commit()
            print("✅ Database migrated successfully")
        except sqlite3.OperationalError as e:
            # Column might already exist
            pass
    
    def add_products_bulk(self, products: List[Dict[str, Any]]) -> int:
        """Add multiple products"""
        count = 0
        for product in products:
            if self.add_product(product):
                count += 1
        return count
    
    def get_brands(self) -> List[Dict[str, Any]]:
        """Get all product brands"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM product_brands ORDER BY name")
        return [dict(row) for row in cursor.fetchall()]
    
    def get_types(self) -> List[Dict[str, Any]]:
        """Get all product types"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM product_types ORDER BY name")
        return [dict(row) for row in cursor.fetchall()]
    
    def search_products(
        self,
        query: Optional[str] = None,
        store_name: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 50,
        offset: int = 0,
        sort: Optional[str] = None,
        brand_id: Optional[int] = None,
        type_id: Optional[int] = None,
        healthy_only: bool = False,
        gluten_free: bool = False,
        vegetarian: bool = False,
        vegan: bool = False,
        organic: bool = False,
        halal: bool = False,
        min_protein: Optional[float] = None,
        max_calories: Optional[float] = None
    ) -> Dict[str, Any]:
        """Search products with filters and pagination"""
        
        cursor = self.conn.cursor()
        
        # Build base query
        if query:
            # Full-text search
            base_sql = """
                SELECT p.* FROM products p
                JOIN products_fts fts ON p.rowid = fts.rowid
                WHERE products_fts MATCH ?
            """
            params = [query]
        else:
            base_sql = "SELECT * FROM products WHERE 1=1"
            params = []
        
        # Add filters
        if store_name:
            base_sql += " AND store_name = ?"
            params.append(store_name)
        
        if category:
            base_sql += " AND category LIKE ?"
            params.append(f"%{category}%")
        
        if brand_id:
            base_sql += " AND product_brand_id = ?"
            params.append(brand_id)
        
        if type_id:
            base_sql += " AND product_type_id = ?"
            params.append(type_id)
        
        if min_price is not None:
            base_sql += " AND price >= ?"
            params.append(min_price)
        
        if max_price is not None:
            base_sql += " AND price <= ?"
            params.append(max_price)
        
        if healthy_only:
            base_sql += " AND is_healthy = 1"
        
        if gluten_free:
            base_sql += " AND is_gluten_free = 1"
        
        if vegetarian:
            base_sql += " AND is_vegetarian = 1"
        
        if vegan:
            base_sql += " AND is_vegan = 1"
        
        if organic:
            base_sql += " AND is_organic = 1"
        
        if halal:
            base_sql += " AND is_halal = 1"
        
        if min_protein is not None:
            base_sql += " AND protein_per_100g >= ?"
            params.append(min_protein)
        
        if max_calories is not None:
            base_sql += " AND calories_per_100g <= ?"
            params.append(max_calories)
        
        # Get total count for pagination
        count_sql = f"SELECT COUNT(*) FROM ({base_sql})"
        cursor.execute(count_sql, params)
        total_count = cursor.fetchone()[0]
        
        # Add sorting
        if sort:
            if sort == 'price_asc' or sort == 'price_low':
                base_sql += " ORDER BY price ASC"
            elif sort == 'price_desc' or sort == 'price_high':
                base_sql += " ORDER BY price DESC"
            elif sort == 'name_asc':
                base_sql += " ORDER BY name ASC"
            elif sort == 'name_desc':
                base_sql += " ORDER BY name DESC"
            elif sort == 'calories_low':
                base_sql += " ORDER BY calories_per_100g ASC"
            elif sort == 'protein_high':
                base_sql += " ORDER BY protein_per_100g DESC"
        else:
            base_sql += " ORDER BY name ASC"
        
        # Add pagination
        base_sql += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(base_sql, params)
        rows = cursor.fetchall()
        
        products = [dict(row) for row in rows]
        
        return {
            "products": products,
            "total": total_count,
            "page": (offset // limit) + 1 if limit > 0 else 1,
            "page_size": limit,
            "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1
        }
    
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

