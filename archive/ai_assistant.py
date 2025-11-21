#!/usr/bin/env python3
"""
OpenAI-Powered Shopping Assistant
Uses GPT to understand shopping requests intelligently
"""

import os
import json
import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️  OpenAI not installed. Run: pip install openai")

from product_database import ProductDatabase


@dataclass
class ShoppingRequest:
    """Parsed shopping request"""
    event_type: str
    num_people: int
    preferences: List[str]
    budget: Optional[float] = None
    dietary_restrictions: List[str] = None


class AIShoppingAssistant:
    """AI-powered shopping assistant using OpenAI"""
    
    def __init__(self, api_key: Optional[str] = None, db_path: str = "products.db"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key and OPENAI_AVAILABLE:
            print("⚠️  No OpenAI API key found. Using basic mode.")
            print("   Set OPENAI_API_KEY environment variable for AI features.")
        
        self.client = OpenAI(api_key=self.api_key) if OPENAI_AVAILABLE and self.api_key else None
        self.db = ProductDatabase(db_path)
        
        # Event templates for quantity calculations
        self.event_templates = {
            "bbq": {
                "categories": ["meat", "grill", "bbq", "charcoal", "vegetables", "drinks", "condiments", "bread"],
                "multipliers": {
                    "meat": 0.5,  # kg per person
                    "vegetables": 0.3,
                    "drinks": 2,  # bottles per person
                    "bread": 0.15
                }
            },
            "dinner": {
                "categories": ["meat", "vegetables", "sides", "dessert", "drinks"],
                "multipliers": {
                    "meat": 0.3,
                    "vegetables": 0.2,
                    "drinks": 1.5
                }
            },
            "party": {
                "categories": ["snacks", "drinks", "chips", "dips", "appetizers"],
                "multipliers": {
                    "snacks": 0.2,
                    "drinks": 3
                }
            }
        }
    
    def chat(self, user_message: str, store_name: Optional[str] = None) -> Dict[str, Any]:
        """Main chat interface with OpenAI"""
        
        if not self.client:
            return self._basic_chat(user_message, store_name)
        
        # Use OpenAI to understand the request
        try:
            # Step 1: Parse the user's request
            request = self._parse_with_openai(user_message)
            
            # Step 2: Get available products
            available_products = self._get_available_products(store_name)
            
            # Step 3: Use AI to create shopping list
            shopping_list = self._create_smart_shopping_list(
                request, 
                available_products, 
                user_message
            )
            
            # Step 4: Generate friendly response
            response_text = self._generate_response(request, shopping_list)
            
            return {
                "success": True,
                "message": response_text,
                "shopping_list": shopping_list,
                "request": {
                    "event_type": request.event_type,
                    "num_people": request.num_people,
                    "budget": request.budget
                }
            }
            
        except Exception as e:
            print(f"AI Error: {e}")
            return self._basic_chat(user_message, store_name)
    
    def _parse_with_openai(self, user_message: str) -> ShoppingRequest:
        """Use OpenAI to parse user's shopping request"""
        
        prompt = f"""
Parse this shopping request and extract key information in JSON format:

User message: "{user_message}"

Extract:
- event_type: type of event (bbq, dinner, party, breakfast, lunch, shopping, etc.)
- num_people: number of people (default to 1 if not specified)
- preferences: list of preferences or special requests
- budget: budget amount in dollars (only if explicitly mentioned, otherwise null)
- dietary_restrictions: list of dietary restrictions if any

Return ONLY valid JSON, no explanation.

Example:
{{"event_type": "bbq", "num_people": 14, "preferences": [], "budget": null, "dietary_restrictions": []}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful shopping assistant. Parse user requests and return JSON only."},
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
                    event_type=data.get('event_type', 'shopping'),
                    num_people=int(data.get('num_people', 1)),
                    preferences=data.get('preferences', []),
                    budget=float(data['budget']) if data.get('budget') else None,
                    dietary_restrictions=data.get('dietary_restrictions', [])
                )
        except Exception as e:
            print(f"Parsing error: {e}")
        
        # Fallback to regex parsing
        return self._parse_simple(user_message)
    
    def _parse_simple(self, user_message: str) -> ShoppingRequest:
        """Simple regex-based parsing as fallback"""
        
        num_people = 1
        people_match = re.search(r'(\d+)\s*(?:people|persons|guests|pax)', user_message, re.I)
        if people_match:
            num_people = int(people_match.group(1))
        
        event_type = "shopping"
        message_lower = user_message.lower()
        for event in ["bbq", "barbecue", "dinner", "party", "breakfast", "lunch"]:
            if event in message_lower:
                event_type = event.replace("barbecue", "bbq")
                break
        
        budget = None
        if 'budget' in message_lower or '$' in user_message:
            budget_match = re.search(r'\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)', user_message)
            if budget_match:
                budget = float(budget_match.group(1).replace(',', ''))
        
        return ShoppingRequest(
            event_type=event_type,
            num_people=num_people,
            preferences=[],
            budget=budget,
            dietary_restrictions=[]
        )
    
    def _get_available_products(self, store_name: Optional[str] = None) -> List[Dict]:
        """Get available products from database"""
        return self.db.search_products(store_name=store_name, limit=100)
    
    def _create_smart_shopping_list(
        self, 
        request: ShoppingRequest, 
        available_products: List[Dict],
        original_message: str
    ) -> Dict[str, Any]:
        """Use OpenAI to create an intelligent shopping list"""
        
        if not self.client:
            return self._create_basic_shopping_list(request, available_products)
        
        # Prepare product list for AI
        products_summary = []
        for p in available_products[:50]:  # Limit to prevent token overflow
            products_summary.append({
                "name": p['name'],
                "price": p.get('price', 0),
                "category": p.get('category', 'general')
            })
        
        prompt = f"""
You are a professional shopping assistant. Create a shopping list for this request:

Request: "{original_message}"
Event: {request.event_type}
Number of people: {request.num_people}
Budget: {f"${request.budget}" if request.budget else "No limit"}

Available products:
{json.dumps(products_summary, indent=2)}

Create a shopping list with appropriate quantities for {request.num_people} people.

Rules:
- For equipment (grills, tools): quantity 1 regardless of people count
- For meat: approximately 0.5 kg per person
- For vegetables: approximately 0.3 kg per person  
- For drinks: 2-3 bottles per person
- For consumables: scale with number of people
- Stay within budget if specified

Return JSON format:
{{
  "items": [
    {{"product_name": "...", "category": "...", "quantity": X, "reason": "why this quantity"}}
  ]
}}

Return ONLY valid JSON.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional shopping list creator. Return JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                ai_list = json.loads(json_match.group())
                
                # Match AI suggestions with actual products
                shopping_list = {
                    "event_type": request.event_type,
                    "num_people": request.num_people,
                    "items": [],
                    "total_cost": 0.0
                }
                
                for item in ai_list.get('items', []):
                    # Find matching product
                    product = self._find_matching_product(
                        item['product_name'], 
                        available_products
                    )
                    
                    if product:
                        list_item = {
                            "product_name": product['name'],
                            "category": item.get('category', product.get('category', 'general')),
                            "quantity": item['quantity'],
                            "unit_price": product.get('price', 0),
                            "total_price": product.get('price', 0) * item['quantity'],
                            "product_url": product.get('product_url'),
                            "image_url": product.get('image_url'),
                            "reason": item.get('reason', '')
                        }
                        
                        shopping_list["items"].append(list_item)
                        shopping_list["total_cost"] += list_item["total_price"]
                
                return shopping_list
                
        except Exception as e:
            print(f"AI shopping list error: {e}")
        
        # Fallback
        return self._create_basic_shopping_list(request, available_products)
    
    def _find_matching_product(self, product_name: str, available_products: List[Dict]) -> Optional[Dict]:
        """Find the best matching product"""
        product_name_lower = product_name.lower()
        
        # Try exact match first
        for p in available_products:
            if p['name'].lower() == product_name_lower:
                return p
        
        # Try partial match
        for p in available_products:
            if product_name_lower in p['name'].lower() or p['name'].lower() in product_name_lower:
                return p
        
        # Try keyword match
        keywords = product_name_lower.split()
        best_match = None
        best_score = 0
        
        for p in available_products:
            score = sum(1 for kw in keywords if kw in p['name'].lower())
            if score > best_score:
                best_score = score
                best_match = p
        
        return best_match if best_score > 0 else None
    
    def _create_basic_shopping_list(
        self, 
        request: ShoppingRequest, 
        available_products: List[Dict]
    ) -> Dict[str, Any]:
        """Create basic shopping list without AI"""
        
        template = self.event_templates.get(request.event_type, self.event_templates.get("party", {}))
        categories = template.get("categories", ["general"])
        multipliers = template.get("multipliers", {})
        
        shopping_list = {
            "event_type": request.event_type,
            "num_people": request.num_people,
            "items": [],
            "total_cost": 0.0
        }
        
        for category in categories:
            # Search for products in this category
            matching_products = [
                p for p in available_products
                if category.lower() in p.get('name', '').lower() or 
                   category.lower() in p.get('category', '').lower()
            ]
            
            if not matching_products:
                continue
            
            # Pick top products
            for product in matching_products[:2]:
                # Calculate quantity
                is_equipment = any(word in product['name'].lower() for word in ['grill', 'tool', 'set'])
                
                if is_equipment:
                    quantity = 1
                else:
                    multiplier = multipliers.get(category, 1)
                    quantity = max(1, int(request.num_people * multiplier))
                
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
        
        return shopping_list
    
    def _generate_response(self, request: ShoppingRequest, shopping_list: Dict) -> str:
        """Generate friendly response"""
        
        num_items = len(shopping_list['items'])
        total = shopping_list['total_cost']
        num_people = request.num_people
        event = request.event_type.upper() if request.event_type != 'shopping' else 'your event'
        
        # Better response messages
        if num_items == 0:
            return "I couldn't find matching products in the database. Try adding more products or rephrasing your request!"
        
        people_text = f"{num_people} people" if num_people > 1 else "1 person"
        
        responses = [
            f"🎉 Perfect! I've prepared a complete shopping list for your {event}! Found {num_items} items totaling ${total:.2f} for {people_text}. You're all set!",
            f"✨ Great choice! I've created your {event} shopping list with {num_items} essential items (${total:.2f}) for {people_text}. Ready to shop!",
            f"🛒 Done! Your {event} shopping list is ready with {num_items} items totaling ${total:.2f} for {people_text}. Everything you need!",
            f"🎯 Awesome! I've built your complete {event} shopping list: {num_items} items for {people_text}, total ${total:.2f}. Let's make it happen!"
        ]
        
        # Use different response based on number of items
        import random
        return random.choice(responses)
    
    def _basic_chat(self, user_message: str, store_name: Optional[str] = None) -> Dict[str, Any]:
        """Basic chat without OpenAI"""
        
        # Handle greetings and non-shopping requests
        message_lower = user_message.lower().strip()
        
        greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'what\'s up']
        if any(message_lower == g or message_lower.startswith(g + ' ') for g in greetings):
            return {
                "success": True,
                "message": "👋 Hey there! I'm your AI shopping assistant. Tell me what you're planning - like 'BBQ for 14 people' or 'Dinner party for 8, budget $100' - and I'll create the perfect shopping list for you!",
                "shopping_list": {"items": [], "total_cost": 0, "num_people": 0, "event_type": "none"},
                "request": {"event_type": "greeting", "num_people": 0, "budget": None}
            }
        
        # Process shopping request
        request = self._parse_simple(user_message)
        available_products = self._get_available_products(store_name)
        shopping_list = self._create_basic_shopping_list(request, available_products)
        
        # Generate response
        message = self._generate_response(request, shopping_list)
        
        return {
            "success": True,
            "message": message,
            "shopping_list": shopping_list,
            "request": {
                "event_type": request.event_type,
                "num_people": request.num_people,
                "budget": request.budget
            }
        }


if __name__ == "__main__":
    print("🤖 Testing AI Shopping Assistant\n")
    
    assistant = AIShoppingAssistant()
    
    test_message = "I want to have a BBQ for 14 people"
    print(f"User: {test_message}\n")
    
    result = assistant.chat(test_message)
    
    print(f"AI: {result['message']}\n")
    print(f"Items: {len(result['shopping_list']['items'])}")
    print(f"Total: ${result['shopping_list']['total_cost']:.2f}")

