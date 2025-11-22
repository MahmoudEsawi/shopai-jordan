#!/usr/bin/env python3
"""
Cart Manager - Handle shopping cart operations
"""

from typing import Dict, List, Optional
from product_database import ProductDatabase


class CartManager:
    """Manage shopping cart operations"""
    
    def __init__(self):
        self.db = ProductDatabase()
        self.cart = []  # List of cart items
    
    def add_to_cart(self, product_id: str, quantity: int = 1) -> Dict:
        """Add product to cart"""
        products = self.db.search_products(limit=1000)
        product = next((p for p in products if p.get('id') == product_id), None)
        
        if not product:
            return {"success": False, "message": "Product not found"}
        
        # Check if already in cart
        existing_item = next((item for item in self.cart if item['product_id'] == product_id), None)
        
        if existing_item:
            existing_item['quantity'] += quantity
            existing_item['total_price'] = existing_item['unit_price'] * existing_item['quantity']
            return {
                "success": True,
                "message": f"Updated {product['name']} quantity to {existing_item['quantity']}",
                "cart": self.get_cart_summary()
            }
        else:
            cart_item = {
                "product_id": product_id,
                "product_name": product.get('name'),
                "category": product.get('category', 'general'),
                "quantity": quantity,
                "unit_price": float(product.get('price', 0)),
                "total_price": float(product.get('price', 0)) * quantity,
                "image_url": product.get('image_url'),
                "product_url": product.get('product_url'),
                "calories_per_100g": product.get('calories_per_100g'),
                "protein_per_100g": product.get('protein_per_100g'),
                "is_gluten_free": bool(product.get('is_gluten_free', 0)),
                "is_vegetarian": bool(product.get('is_vegetarian', 0)),
                "is_vegan": bool(product.get('is_vegan', 0)),
                "is_healthy": bool(product.get('is_healthy', 0))
            }
            self.cart.append(cart_item)
            return {
                "success": True,
                "message": f"Added {product['name']} to cart",
                "cart": self.get_cart_summary()
            }
    
    def remove_from_cart(self, product_id: str) -> Dict:
        """Remove product from cart"""
        initial_count = len(self.cart)
        self.cart = [item for item in self.cart if item['product_id'] != product_id]
        
        if len(self.cart) < initial_count:
            return {
                "success": True,
                "message": "Item removed from cart",
                "cart": self.get_cart_summary()
            }
        else:
            return {
                "success": False,
                "message": "Item not found in cart"
            }
    
    def update_quantity(self, product_id: str, quantity: int) -> Dict:
        """Update product quantity in cart"""
        item = next((item for item in self.cart if item['product_id'] == product_id), None)
        
        if not item:
            return {"success": False, "message": "Item not found in cart"}
        
        if quantity <= 0:
            return self.remove_from_cart(product_id)
        
        item['quantity'] = quantity
        item['total_price'] = item['unit_price'] * quantity
        
        return {
            "success": True,
            "message": f"Updated {item['product_name']} quantity to {quantity}",
            "cart": self.get_cart_summary()
        }
    
    def clear_cart(self) -> Dict:
        """Clear entire cart"""
        count = len(self.cart)
        self.cart = []
        return {
            "success": True,
            "message": f"Cleared {count} items from cart",
            "cart": self.get_cart_summary()
        }
    
    def get_cart(self) -> List[Dict]:
        """Get current cart items"""
        return self.cart.copy()
    
    def get_cart_summary(self) -> Dict:
        """Get cart summary"""
        total_cost = sum(item['total_price'] for item in self.cart)
        total_items = sum(item['quantity'] for item in self.cart)
        
        return {
            "items": self.cart,
            "total_cost": round(total_cost, 2),
            "total_items": total_items,
            "item_count": len(self.cart)
        }
    
    def search_product_by_name(self, product_name: str) -> Optional[Dict]:
        """Search for product by name"""
        products = self.db.search_products(query=product_name, limit=10)
        if products:
            return products[0]
        return None

