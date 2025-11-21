#!/usr/bin/env python3
"""
AI Shopping Assistant
Uses OpenAI to understand shopping requests and build smart shopping lists
"""

import os
import json
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

try:
    from openai import OpenAI
except ImportError:
    print("⚠️  OpenAI package not installed. Run: pip install openai")
    OpenAI = None

from product_database import ProductDatabase


@dataclass
class ShoppingRequest:
    """User's shopping request"""
    event_type: str  # e.g., "bbq", "dinner", "party"
    num_people: int
    preferences: List[str]  # dietary restrictions, preferences
    budget: Optional[float] = None


class ShoppingAssistant:
    """AI-powered shopping assistant"""
    
    def __init__(self, api_key: Optional[str] = None, db_path: str = "products.db"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key and OpenAI:
            print("⚠️  Warning: OPENAI_API_KEY not set. AI features will be limited.")
        
        self.client = OpenAI(api_key=self.api_key) if OpenAI and self.api_key else None
        self.db = ProductDatabase(db_path)
        
        # Knowledge base for different event types
        self.event_templates = {
            "bbq": {
                "categories": ["meat", "grill", "bbq", "charcoal", "vegetables", "drinks", "condiments"],
                "items_per_person": {
                    "meat": 0.5,  # kg
                    "vegetables": 0.3,  # kg
                    "drinks": 2,  # units
                    "bread": 0.2  # kg
                }
            },
            "dinner": {
                "categories": ["main course", "sides", "dessert", "drinks"],
                "items_per_person": {
                    "main": 0.3,
                    "sides": 0.2,
                    "dessert": 0.15
                }
            },
            "party": {
                "categories": ["snacks", "drinks", "decorations", "plates", "cups"],
                "items_per_person": {
                    "snacks": 0.2,
                    "drinks": 3
                }
            }
        }
    
    def parse_request(self, user_message: str) -> ShoppingRequest:
        """Parse user's shopping request using AI"""
        
        if self.client:
            return self._parse_with_ai(user_message)
        else:
            return self._parse_simple(user_message)
    
    def _parse_with_ai(self, user_message: str) -> ShoppingRequest:
        """Use OpenAI to parse the request"""
        
        prompt = f"""
        Parse this shopping request and extract key information:
        "{user_message}"
        
        Return a JSON object with:
        - event_type: type of event (bbq, dinner, party, etc.)
        - num_people: number of people
        - preferences: list of dietary restrictions or preferences
        - budget: budget if mentioned (number only)
        
        Example:
        {{"event_type": "bbq", "num_people": 14, "preferences": [], "budget": null}}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a shopping assistant. Parse user requests and return JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return ShoppingRequest(
                    event_type=data.get('event_type', 'general'),
                    num_people=int(data.get('num_people', 1)),
                    preferences=data.get('preferences', []),
                    budget=float(data['budget']) if data.get('budget') else None
                )
        except Exception as e:
            print(f"⚠️  AI parsing failed: {e}, using fallback")
        
        return self._parse_simple(user_message)
    
    def _parse_simple(self, user_message: str) -> ShoppingRequest:
        """Simple regex-based parsing"""
        
        # Extract number of people
        num_people = 1
        people_match = re.search(r'(\d+)\s*(?:people|persons|guests|pax)', user_message, re.I)
        if people_match:
            num_people = int(people_match.group(1))
        
        # Extract event type
        event_type = "general"
        message_lower = user_message.lower()
        
        for event in ["bbq", "barbecue", "dinner", "party", "breakfast", "lunch"]:
            if event in message_lower:
                event_type = event.replace("barbecue", "bbq")
                break
        
        # Extract budget (only if explicitly mentioned with $ or "budget")
        budget = None
        if 'budget' in user_message.lower() or '$' in user_message:
            budget_match = re.search(r'\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)', user_message)
            if budget_match:
                budget = float(budget_match.group(1).replace(',', ''))
            else:
                # Try to find "budget 100" or "budget of 100"
                budget_match = re.search(r'budget\s+(?:of\s+)?\$?(\d+(?:,\d{3})*(?:\.\d{2})?)', user_message, re.I)
                if budget_match:
                    budget = float(budget_match.group(1).replace(',', ''))
        
        return ShoppingRequest(
            event_type=event_type,
            num_people=num_people,
            preferences=[],
            budget=budget
        )
    
    def build_shopping_list(
        self, 
        request: ShoppingRequest, 
        store_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build a shopping list based on the request"""
        
        print(f"\n🤖 Building shopping list for {request.event_type} ({request.num_people} people)...")
        
        # Get template for event type
        template = self.event_templates.get(request.event_type, self.event_templates["party"])
        
        shopping_list = {
            "event_type": request.event_type,
            "num_people": request.num_people,
            "items": [],
            "total_cost": 0.0,
            "store": store_name
        }
        
        # Search for products in each category
        for category in template["categories"]:
            print(f"  🔍 Searching for {category}...")
            
            products = self.db.search_products(
                query=category,
                store_name=store_name,
                limit=10
            )
            
            print(f"     Found {len(products)} products")
            
            if products:
                # Pick top products from this category
                # Equipment items (grill, tools): only 1 needed
                # Consumables (meat, drinks, etc): scaled by people
                is_equipment = category.lower() in ['grill', 'bbq', 'charcoal']
                max_products = 1 if is_equipment else 2  # Limit products per category
                
                for product in products[:max_products]:
                    # Equipment items always quantity 1
                    if is_equipment or 'grill' in product['name'].lower() or 'tool' in product['name'].lower():
                        quantity = 1
                    else:
                        quantity = self._calculate_quantity(
                            category, 
                            request.num_people, 
                            template
                        )
                    
                    item = {
                        "product_name": product['name'],
                        "category": category,
                        "quantity": quantity,
                        "unit_price": product.get('price', 0),
                        "total_price": product.get('price', 0) * quantity,
                        "product_url": product.get('product_url'),
                        "image_url": product.get('image_url')
                    }
                    
                    shopping_list["items"].append(item)
                    shopping_list["total_cost"] += item["total_price"]
        
        # Check budget
        if request.budget and shopping_list["total_cost"] > request.budget:
            print(f"  ⚠️  Over budget! ${shopping_list['total_cost']:.2f} > ${request.budget:.2f}")
            shopping_list = self._optimize_for_budget(shopping_list, request.budget)
        
        return shopping_list
    
    def _calculate_quantity(
        self, 
        category: str, 
        num_people: int, 
        template: Dict
    ) -> int:
        """Calculate quantity needed"""
        
        items_per_person = template.get("items_per_person", {})
        
        # Try to find matching category
        for key, amount in items_per_person.items():
            if key in category.lower():
                return max(1, int(num_people * amount))
        
        # Default: 1 per 2 people
        return max(1, num_people // 2)
    
    def _optimize_for_budget(
        self, 
        shopping_list: Dict[str, Any], 
        budget: float
    ) -> Dict[str, Any]:
        """Optimize shopping list to fit budget"""
        
        # Sort items by price (most expensive first)
        items = sorted(
            shopping_list["items"], 
            key=lambda x: x["total_price"], 
            reverse=True
        )
        
        # Remove expensive items until under budget
        optimized_items = []
        total = 0.0
        
        for item in items:
            if total + item["total_price"] <= budget:
                optimized_items.append(item)
                total += item["total_price"]
        
        shopping_list["items"] = optimized_items
        shopping_list["total_cost"] = total
        shopping_list["optimized"] = True
        
        return shopping_list
    
    def chat(self, user_message: str, store_name: Optional[str] = None) -> str:
        """Main chat interface"""
        
        # Parse the request
        request = self.parse_request(user_message)
        
        # Build shopping list
        shopping_list = self.build_shopping_list(request, store_name)
        
        # Format response
        response = self._format_response(shopping_list)
        
        return response
    
    def _format_response(self, shopping_list: Dict[str, Any]) -> str:
        """Format shopping list as readable text"""
        
        response = f"🛒 **Shopping List for {shopping_list['event_type'].upper()}**\n"
        response += f"👥 For {shopping_list['num_people']} people\n\n"
        
        if shopping_list.get("store"):
            response += f"🏪 Store: {shopping_list['store']}\n\n"
        
        # Group by category
        by_category = {}
        for item in shopping_list["items"]:
            cat = item["category"]
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(item)
        
        # Print items
        for category, items in by_category.items():
            response += f"**{category.upper()}:**\n"
            for item in items:
                response += f"  • {item['product_name']}\n"
                response += f"    Quantity: {item['quantity']} | "
                response += f"${item['unit_price']:.2f} each | "
                response += f"Total: ${item['total_price']:.2f}\n"
            response += "\n"
        
        response += f"💰 **Total Cost: ${shopping_list['total_cost']:.2f}**\n"
        
        if shopping_list.get("optimized"):
            response += "\n⚠️  *List optimized to fit your budget*\n"
        
        return response
    
    def export_to_json(self, shopping_list: Dict[str, Any], filename: str):
        """Export shopping list to JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(shopping_list, f, indent=2, ensure_ascii=False)
        print(f"💾 Shopping list saved to {filename}")


if __name__ == "__main__":
    print("🤖 AI Shopping Assistant Test\n")
    
    # Create assistant
    assistant = ShoppingAssistant()
    
    # Test query
    query = "I want to have a BBQ for 14 people"
    print(f"User: {query}\n")
    
    response = assistant.chat(query)
    print(response)

