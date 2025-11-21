#!/usr/bin/env python3
"""
Groq AI Integration - FREE and 10x FASTER than OpenAI!
https://console.groq.com
"""

import os
import json
from typing import Dict, List, Optional, Any

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("💡 Install Groq: pip install groq")

from product_database import ProductDatabase


class GroqAIAssistant:
    """FREE AI assistant using Groq (faster than OpenAI!)"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key) if GROQ_AVAILABLE and self.api_key else None
        
        self.db = ProductDatabase()
        self.conversation_history = []
        
        self.system_prompt = """You are ShopAI, an intelligent shopping assistant for Jordan.

You help users create shopping lists for events like BBQs, parties, dinners, etc.

YOUR CAPABILITIES:
- Access to Talabat Jordan products with prices in JOD (Jordanian Dinar)
- Calculate quantities intelligently based on number of people
- Understand budgets and optimize accordingly
- Natural conversation with Jordanian context

AVAILABLE PRODUCTS:
- Fresh meats (beef, chicken, lamb, kofta, shish tawook)
- Fresh vegetables and herbs (parsley, mint)
- Traditional breads (khubz, taboon)
- Jordanian favorites (kunafa, baklava, hummus, tabbouleh)
- Drinks (cola, water, juice, ayran/laban)
- Sauces (tahini, toum/garlic sauce, BBQ)
- BBQ supplies and charcoal

PERSONALITY:
- Friendly and conversational like ChatGPT
- Helpful and enthusiastic
- Understanding of Jordanian food culture
- Familiar with local traditions (mansaf, BBQ culture)
- Clear and concise

When creating shopping lists:
1. Understand event type and guest count
2. Select appropriate products from Talabat Jordan database
3. Calculate smart quantities (e.g., 0.5kg meat per person)
4. Consider Jordanian preferences (kofta, tabbouleh, kunafa)
5. Present the list naturally with prices in JOD
6. Include traditional items when appropriate

Be genuinely helpful and culturally aware of Jordan! 🇯🇴"""
    
    def chat(self, user_message: str, store_name: Optional[str] = None) -> Dict[str, Any]:
        """Chat using FREE Groq AI"""
        
        if not self.client:
            return {
                "success": False,
                "message": """🆓 Want FREE AI (faster than OpenAI)?

**Setup Groq in 2 minutes:**

1. Go to: https://console.groq.com
2. Sign up (FREE, no card needed!)  
3. Get API key
4. Run: export GROQ_API_KEY="your-key"
5. Restart app

**Why Groq?**
✅ 100% FREE forever
✅ 10x faster than OpenAI
✅ 14,400 requests/day free
✅ Same quality as ChatGPT

Or add OpenAI billing for GPT.""",
                "shopping_list": {"items": [], "total_cost": 0},
                "type": "setup_needed"
            }
        
        try:
            # Get products
            products = self.db.search_products(store_name=store_name, limit=50)
            products_info = self._format_products(products)
            
            # Build messages
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "system", "content": f"Available products:\n{products_info}"}
            ]
            
            # Add history
            messages.extend(self.conversation_history[-10:])
            
            # Add current message
            messages.append({"role": "user", "content": user_message})
            
            # Call Groq API (FREE and FAST!)
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Latest free model!
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Update history
            self.conversation_history.append({"role": "user", "content": user_message})
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            # Extract shopping list
            shopping_list = self._extract_shopping_list(ai_response, products, user_message)
            
            return {
                "success": True,
                "message": ai_response,
                "shopping_list": shopping_list,
                "type": "groq_ai",
                "model": "llama-3.1-70b (FREE!)",
                "provider": "Groq"
            }
            
        except Exception as e:
            error_msg = str(e)
            
            if "api_key" in error_msg.lower() or "auth" in error_msg.lower():
                return {
                    "success": False,
                    "message": f"🔑 Groq API key issue.\n\nGet free key at: https://console.groq.com\n\nThen: export GROQ_API_KEY='your-key'",
                    "shopping_list": {"items": [], "total_cost": 0},
                    "type": "auth_error"
                }
            else:
                return {
                    "success": False,
                    "message": f"Groq API error: {error_msg}",
                    "shopping_list": {"items": [], "total_cost": 0},
                    "type": "api_error"
                }
    
    def _format_products(self, products: List[Dict]) -> str:
        """Format products for AI"""
        if not products:
            return "No products in database."
        
        formatted = ""
        for p in products[:30]:  # Limit for token efficiency
            formatted += f"- {p['name']}: ${p.get('price', 0):.2f}\n"
        return formatted
    
    def _extract_shopping_list(self, ai_response: str, products: List[Dict], user_request: str) -> Dict:
        """Extract shopping list from AI response"""
        
        import re
        
        # Try to extract number of people
        num_people = 1
        people_match = re.search(r'(\d+)\s*(?:people|persons|guests)', user_request, re.I)
        if people_match:
            num_people = int(people_match.group(1))
        
        # Extract event type
        event_type = "shopping"
        for event in ["bbq", "barbecue", "dinner", "party", "lunch", "breakfast"]:
            if event in user_request.lower():
                event_type = event
                break
        
        shopping_list = {
            "items": [],
            "total_cost": 0.0,
            "num_people": num_people,
            "event_type": event_type
        }
        
        # Find products mentioned by AI
        for product in products:
            if product['name'].lower() in ai_response.lower():
                # Try to extract quantity
                quantity = 1
                patterns = [
                    rf'(\d+)\s*(?:x\s*)?{re.escape(product["name"][:20])}',
                    rf'{re.escape(product["name"][:20])}\s*(?:x\s*)?(\d+)'
                ]
                
                for pattern in patterns:
                    match = re.search(pattern, ai_response, re.IGNORECASE)
                    if match:
                        try:
                            quantity = int(match.group(1))
                        except:
                            pass
                        break
                
                # Smart quantity defaults
                if quantity == 1:
                    if 'grill' in product['name'].lower() or 'tool' in product['name'].lower():
                        quantity = 1
                    elif 'meat' in product.get('category', '').lower():
                        quantity = max(1, int(num_people * 0.5))
                    elif 'drink' in product.get('category', '').lower():
                        quantity = max(1, int(num_people * 2))
                    elif 'vegetable' in product.get('category', '').lower():
                        quantity = max(1, int(num_people * 0.3))
                
                item = {
                    "product_name": product['name'],
                    "category": product.get('category', 'general'),
                    "quantity": quantity,
                    "unit_price": product.get('price', 0),
                    "total_price": product.get('price', 0) * quantity,
                    "product_url": product.get('product_url'),
                    "image_url": product.get('image_url')
                }
                
                shopping_list["items"].append(item)
                shopping_list["total_cost"] += item["total_price"]
        
        return shopping_list
    
    def clear_history(self):
        """Clear conversation"""
        self.conversation_history = []
    
    def get_status(self) -> Dict:
        """Get API status"""
        return {
            "provider": "Groq (FREE)",
            "has_api": bool(self.client),
            "model": "llama-3.1-70b-versatile",
            "cost": "$0 forever!",
            "speed": "10x faster than OpenAI"
        }


if __name__ == "__main__":
    print("🚀 Testing Groq FREE AI\n")
    
    assistant = GroqAIAssistant()
    status = assistant.get_status()
    
    print(f"Provider: {status['provider']}")
    print(f"Model: {status['model']}")
    print(f"Cost: {status['cost']}")
    print(f"Speed: {status['speed']}")
    print(f"Active: {'YES ✅' if status['has_api'] else 'NO - Need API key'}")
    
    if not status['has_api']:
        print("\n🎯 Setup Instructions:")
        print("1. Visit: https://console.groq.com")
        print("2. Sign up (FREE!)")
        print("3. Get API key")
        print("4. Run: export GROQ_API_KEY='your-key'")
        print("5. pip install groq")

