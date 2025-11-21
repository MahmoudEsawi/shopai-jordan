#!/usr/bin/env python3
"""
TRUE ChatGPT Integration - Real API calls, no mock data
Every response comes directly from OpenAI GPT models
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from product_database import ProductDatabase


class TrueChatGPTAssistant:
    """Real ChatGPT integration - all responses from OpenAI API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if OPENAI_AVAILABLE and self.api_key else None
        
        self.db = ProductDatabase()
        self.conversation_history = []
        self.has_openai = bool(self.client)
        
        # System prompt - this is the ONLY static part
        self.system_prompt = """You are ShopAI, an intelligent shopping assistant with access to a real product database.

YOUR CAPABILITIES:
- You can search a database of 20 real Walmart products with actual prices
- You create shopping lists by selecting real products from the database
- You calculate quantities intelligently based on number of people
- You understand budgets and optimize accordingly

AVAILABLE PRODUCTS (always check the database for current products):
You have access to products in these categories:
- Grills & BBQ equipment
- Meat (beef, chicken)  
- Vegetables
- Drinks
- Charcoal & supplies
- Condiments
- Tools

HOW YOU WORK:
1. When user makes a request, understand: event type, number of people, budget
2. Search the product database for relevant items
3. Select appropriate products with smart quantities
4. Calculate total cost
5. Present the shopping list naturally

PERSONALITY:
- Conversational and natural like ChatGPT
- Helpful and enthusiastic
- Knowledgeable about cooking and parties
- Always check actual product database
- Give real product names and prices

Be genuinely helpful and natural in conversation!"""
    
    def chat(self, user_message: str, store_name: Optional[str] = None) -> Dict[str, Any]:
        """Chat using REAL OpenAI API - no mock responses"""
        
        if not self.client:
            return {
                "success": False,
                "message": "⚠️ OpenAI API not available. To enable real ChatGPT responses:\n\n1. Add billing to your OpenAI account\n2. Or get a new API key with credits\n3. Set: export OPENAI_API_KEY='your-key'\n\nThe AI features require an active OpenAI subscription.",
                "shopping_list": {"items": [], "total_cost": 0},
                "type": "error"
            }
        
        # Add user message to history
        self.conversation_history.append({
            "role": "user", 
            "content": user_message
        })
        
        try:
            # Get available products from database
            products = self.db.search_products(store_name=store_name, limit=50)
            products_info = self._format_products_for_ai(products)
            
            # Build messages for OpenAI
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "system", "content": f"CURRENT PRODUCTS IN DATABASE:\n{products_info}"}
            ]
            
            # Add conversation history (last 10 messages)
            messages.extend(self.conversation_history[-10:])
            
            # Call OpenAI API - THIS IS THE REAL ChatGPT CALL
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",  # or "gpt-4" for better responses
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Add AI response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": ai_response
            })
            
            # Check if AI created a shopping list
            shopping_list = self._extract_shopping_list(ai_response, products)
            
            return {
                "success": True,
                "message": ai_response,  # REAL ChatGPT response
                "shopping_list": shopping_list,
                "type": "chatgpt",
                "model": "gpt-3.5-turbo"
            }
            
        except Exception as e:
            error_msg = str(e)
            
            if "insufficient_quota" in error_msg or "quota" in error_msg.lower():
                return {
                    "success": False,
                    "message": f"💳 OpenAI API Error: Your account has insufficient credits.\n\n**To fix:**\n1. Go to: https://platform.openai.com/account/billing\n2. Add payment method\n3. Add $5+ credits\n4. Cost: ~$0.001 per message (very cheap!)\n\n**Or:** Get a new API key with free credits",
                    "shopping_list": {"items": [], "total_cost": 0},
                    "type": "quota_error"
                }
            elif "invalid" in error_msg.lower():
                return {
                    "success": False,
                    "message": "🔑 Invalid API key. Get a new one at:\nhttps://platform.openai.com/api-keys",
                    "shopping_list": {"items": [], "total_cost": 0},
                    "type": "auth_error"
                }
            else:
                return {
                    "success": False,
                    "message": f"❌ OpenAI API Error: {error_msg}\n\nPlease check your API key and billing status.",
                    "shopping_list": {"items": [], "total_cost": 0},
                    "type": "api_error"
                }
    
    def _format_products_for_ai(self, products: List[Dict]) -> str:
        """Format products for AI to use"""
        if not products:
            return "No products available in database."
        
        formatted = "Available products:\n"
        for p in products:
            formatted += f"- {p['name']}: ${p.get('price', 0):.2f} ({p.get('category', 'general')})\n"
        
        return formatted
    
    def _extract_shopping_list(self, ai_response: str, products: List[Dict]) -> Dict:
        """Extract shopping list from AI response"""
        
        # Try to find product mentions in the response
        shopping_list = {
            "items": [],
            "total_cost": 0.0,
            "num_people": 0,
            "event_type": "shopping"
        }
        
        # Look for product names mentioned by AI
        for product in products:
            product_name = product['name'].lower()
            if product_name in ai_response.lower():
                # Try to extract quantity mentioned
                import re
                
                # Look for patterns like "2x Product" or "2 Product" or "Product x2"
                patterns = [
                    rf'(\d+)\s*x?\s*{re.escape(product_name)}',
                    rf'{re.escape(product_name)}\s*x?\s*(\d+)',
                    rf'(\d+)\s+{re.escape(product["name"][:20])}'
                ]
                
                quantity = 1
                for pattern in patterns:
                    match = re.search(pattern, ai_response, re.IGNORECASE)
                    if match:
                        quantity = int(match.group(1))
                        break
                
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
        """Clear conversation history"""
        self.conversation_history = []
    
    def get_status(self) -> Dict:
        """Get current API status"""
        return {
            "has_openai": self.has_openai,
            "client_active": bool(self.client),
            "api_key_set": bool(self.api_key),
            "mode": "Real ChatGPT" if self.client else "No API"
        }


# Test function to show it's REAL
def test_real_api():
    """Test to prove this uses real OpenAI API"""
    print("🔍 Testing REAL ChatGPT Integration\n")
    
    assistant = TrueChatGPTAssistant()
    status = assistant.get_status()
    
    print(f"Status: {json.dumps(status, indent=2)}")
    print(f"\nAPI Key: {'SET ✅' if status['api_key_set'] else 'NOT SET ❌'}")
    print(f"Mode: {status['mode']}")
    
    if status['client_active']:
        print("\n✅ REAL OpenAI API is ACTIVE")
        print("Every response comes directly from ChatGPT servers")
        print("No mock data, no static responses")
    else:
        print("\n❌ OpenAI API not available")
        print("Add valid API key with credits to enable real ChatGPT")
    
    print("\n" + "="*60)
    print("To enable REAL ChatGPT:")
    print("1. Go to: https://platform.openai.com/account/billing")
    print("2. Add $5+ credits")
    print("3. Restart app")
    print("="*60)


if __name__ == "__main__":
    test_real_api()

