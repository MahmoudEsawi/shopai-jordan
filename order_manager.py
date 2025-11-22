#!/usr/bin/env python3
"""
Order Manager
Handles order creation, management, and tracking
"""

import sqlite3
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum


class OrderStatus(Enum):
    """Order status enumeration"""
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    PROCESSING = "Processing"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


class DeliveryMethod:
    """Delivery method constants"""
    STANDARD = 1  # 2-3 days
    EXPRESS = 2   # Same day
    PICKUP = 3    # Store pickup


class OrderManager:
    """Manages orders in SQLite database"""
    
    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path
        self.conn = None
        self.init_database()
    
    def init_database(self):
        """Initialize order database schema"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        cursor = self.conn.cursor()
        
        # Delivery methods table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS delivery_methods (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price REAL DEFAULT 0,
                estimated_days INTEGER,
                is_active INTEGER DEFAULT 1
            )
        """)
        
        # Check if delivery methods exist, if not, insert defaults
        cursor.execute("SELECT COUNT(*) FROM delivery_methods")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
                INSERT INTO delivery_methods (id, name, description, price, estimated_days)
                VALUES (?, ?, ?, ?, ?)
            """, [
                (1, "Standard Delivery", "2-3 business days", 2.0, 3),
                (2, "Express Delivery", "Same day delivery", 5.0, 1),
                (3, "Store Pickup", "Pick up from store", 0.0, 0)
            ])
        
        # Orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                order_number TEXT UNIQUE NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                subtotal REAL NOT NULL,
                delivery_fee REAL DEFAULT 0,
                total REAL NOT NULL,
                delivery_method_id INTEGER,
                payment_intent_id TEXT,
                payment_status TEXT DEFAULT 'Pending',
                shipping_address TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                delivered_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (delivery_method_id) REFERENCES delivery_methods(id)
            )
        """)
        
        # Order items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id TEXT NOT NULL,
                product_name TEXT NOT NULL,
                product_image TEXT,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        """)
        
        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)
        """)
        
        self.conn.commit()
    
    def get_delivery_methods(self) -> List[Dict[str, Any]]:
        """Get all available delivery methods"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT id, name, description, price, estimated_days
            FROM delivery_methods
            WHERE is_active = 1
            ORDER BY id
        """)
        return [dict(row) for row in cursor.fetchall()]
    
    def create_order(
        self,
        user_id: int,
        cart_items: List[Dict[str, Any]],
        delivery_method_id: int,
        shipping_address: Dict[str, str],
        payment_intent_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new order from cart items"""
        cursor = self.conn.cursor()
        
        # Calculate totals
        subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
        
        # Get delivery method
        cursor.execute("SELECT price FROM delivery_methods WHERE id = ?", (delivery_method_id,))
        delivery_row = cursor.fetchone()
        delivery_fee = delivery_row['price'] if delivery_row else 0.0
        
        total = subtotal + delivery_fee
        
        # Generate order number
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{user_id}-{datetime.now().strftime('%H%M%S')}"
        
        # Create order
        created_at = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO orders (
                user_id, order_number, status, subtotal, delivery_fee, total,
                delivery_method_id, payment_intent_id, shipping_address,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, order_number, OrderStatus.PENDING.value, subtotal,
            delivery_fee, total, delivery_method_id, payment_intent_id,
            json.dumps(shipping_address), created_at, created_at
        ))
        
        order_id = cursor.lastrowid
        
        # Add order items
        for item in cart_items:
            cursor.execute("""
                INSERT INTO order_items (
                    order_id, product_id, product_name, product_image,
                    price, quantity, subtotal
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                order_id,
                item.get('product_id', ''),
                item.get('name', ''),
                item.get('image_url', ''),
                item['price'],
                item['quantity'],
                item['price'] * item['quantity']
            ))
        
        self.conn.commit()
        
        return self.get_order_by_id(order_id)
    
    def get_order_by_id(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Get order by ID with items"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT o.*, dm.name as delivery_method_name, dm.description as delivery_method_description
            FROM orders o
            LEFT JOIN delivery_methods dm ON o.delivery_method_id = dm.id
            WHERE o.id = ?
        """, (order_id,))
        order_row = cursor.fetchone()
        
        if not order_row:
            return None
        
        order = dict(order_row)
        
        # Get order items
        cursor.execute("""
            SELECT * FROM order_items WHERE order_id = ?
        """, (order_id,))
        order['items'] = [dict(row) for row in cursor.fetchall()]
        
        # Parse shipping address
        if order['shipping_address']:
            order['shipping_address'] = json.loads(order['shipping_address'])
        
        return order
    
    def get_user_orders(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all orders for a user"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT o.*, dm.name as delivery_method_name
            FROM orders o
            LEFT JOIN delivery_methods dm ON o.delivery_method_id = dm.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            LIMIT ?
        """, (user_id, limit))
        
        orders = [dict(row) for row in cursor.fetchall()]
        
        # Get items for each order
        for order in orders:
            cursor.execute("""
                SELECT * FROM order_items WHERE order_id = ?
            """, (order['id'],))
            order['items'] = [dict(row) for row in cursor.fetchall()]
            
            # Parse shipping address
            if order['shipping_address']:
                order['shipping_address'] = json.loads(order['shipping_address'])
        
        return orders
    
    def update_order_status(self, order_id: int, status: str) -> bool:
        """Update order status"""
        cursor = self.conn.cursor()
        updated_at = datetime.now().isoformat()
        
        # If delivered, set delivered_at
        delivered_at = None
        if status == OrderStatus.DELIVERED.value:
            delivered_at = updated_at
        
        cursor.execute("""
            UPDATE orders
            SET status = ?, updated_at = ?, delivered_at = ?
            WHERE id = ?
        """, (status, updated_at, delivered_at, order_id))
        
        self.conn.commit()
        return cursor.rowcount > 0
    
    def update_payment_status(self, order_id: int, payment_status: str, payment_intent_id: Optional[str] = None) -> bool:
        """Update order payment status"""
        cursor = self.conn.cursor()
        updated_at = datetime.now().isoformat()
        
        if payment_status == "Succeeded":
            # Update order status to confirmed
            cursor.execute("""
                UPDATE orders
                SET payment_status = ?, payment_intent_id = ?, status = ?, updated_at = ?
                WHERE id = ?
            """, (payment_status, payment_intent_id, OrderStatus.CONFIRMED.value, updated_at, order_id))
        else:
            cursor.execute("""
                UPDATE orders
                SET payment_status = ?, payment_intent_id = ?, updated_at = ?
                WHERE id = ?
            """, (payment_status, payment_intent_id, updated_at, order_id))
        
        self.conn.commit()
        return cursor.rowcount > 0
    
    def get_order_by_payment_intent(self, payment_intent_id: str) -> Optional[Dict[str, Any]]:
        """Get order by payment intent ID"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT id FROM orders WHERE payment_intent_id = ?", (payment_intent_id,))
        row = cursor.fetchone()
        if row:
            return self.get_order_by_id(row['id'])
        return None

