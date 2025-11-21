#!/usr/bin/env python3
"""
Shopping List Sharing
Enables sharing shopping lists via URL, export, and social media
"""

import json
import base64
import hashlib
from typing import Dict, Optional
from datetime import datetime, timedelta


class ListSharing:
    """Handle shopping list sharing functionality"""
    
    def __init__(self):
        # In-memory storage (in production, use Redis or database)
        self.shared_lists = {}
    
    def generate_share_url(self, shopping_list: Dict) -> str:
        """Generate a shareable URL for the shopping list"""
        
        # Create a unique ID
        list_id = hashlib.md5(
            f"{shopping_list.get('num_people')}{shopping_list.get('total_cost')}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]
        
        # Store the list (expires in 7 days)
        self.shared_lists[list_id] = {
            "list": shopping_list,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        return f"/share/{list_id}"
    
    def get_shared_list(self, list_id: str) -> Optional[Dict]:
        """Retrieve a shared shopping list by ID"""
        if list_id not in self.shared_lists:
            return None
        
        shared = self.shared_lists[list_id]
        
        # Check if expired
        expires_at = datetime.fromisoformat(shared["expires_at"])
        if datetime.now() > expires_at:
            del self.shared_lists[list_id]
            return None
        
        return shared["list"]
    
    def export_to_json(self, shopping_list: Dict) -> str:
        """Export shopping list as JSON string"""
        export_data = {
            "title": f"Shopping List for {shopping_list.get('num_people', 0)} people",
            "created_at": datetime.now().isoformat(),
            "event_type": shopping_list.get("event_type", "event"),
            "num_people": shopping_list.get("num_people", 0),
            "budget": shopping_list.get("budget"),
            "total_cost": shopping_list.get("total_cost", 0),
            "items": shopping_list.get("items", []),
            "currency": "JOD"
        }
        
        return json.dumps(export_data, indent=2, ensure_ascii=False)
    
    def export_to_text(self, shopping_list: Dict) -> str:
        """Export shopping list as plain text"""
        lines = []
        lines.append("=" * 50)
        lines.append(f"SHOPPING LIST - {shopping_list.get('event_type', 'Event').upper()}")
        lines.append("=" * 50)
        lines.append(f"For: {shopping_list.get('num_people', 0)} people")
        if shopping_list.get('budget'):
            lines.append(f"Budget: {shopping_list.get('budget')} JOD")
        lines.append("")
        
        # Group by category
        by_category = {}
        for item in shopping_list.get("items", []):
            category = item.get("category", "Other")
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(item)
        
        for category, items in by_category.items():
            lines.append(f"\n{category.upper()}:")
            lines.append("-" * 30)
            for item in items:
                lines.append(
                    f"  • {item.get('product_name')} "
                    f"(Qty: {item.get('quantity')}) "
                    f"- {item.get('total_price', 0):.2f} JOD"
                )
        
        lines.append("")
        lines.append("=" * 50)
        lines.append(f"TOTAL: {shopping_list.get('total_cost', 0):.2f} JOD")
        lines.append("=" * 50)
        
        return "\n".join(lines)
    
    def get_social_share_text(self, shopping_list: Dict) -> str:
        """Generate text for social media sharing"""
        num_people = shopping_list.get('num_people', 0)
        total_cost = shopping_list.get('total_cost', 0)
        items_count = len(shopping_list.get('items', []))
        event_type = shopping_list.get('event_type', 'event')
        
        text = (
            f"🛒 Shopping list for {event_type}!\n"
            f"👥 {num_people} people\n"
            f"📦 {items_count} items\n"
            f"💰 {total_cost:.2f} JOD\n"
            f"\nCreated with ShopAI Jordan 🇯🇴"
        )
        
        return text
    
    def generate_qr_data(self, share_url: str) -> str:
        """Generate QR code data for sharing"""
        # In production, use a QR code library
        # For now, return the URL
        return share_url

