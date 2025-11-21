#!/usr/bin/env python3
"""
Conversational AI Shopping Assistant
Responds naturally like ChatGPT with context and memory
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
from ai_assistant import AIShoppingAssistant


class ConversationalAssistant:
    """ChatGPT-like conversational shopping assistant"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if OPENAI_AVAILABLE and self.api_key else None
        
        self.shopping_assistant = AIShoppingAssistant()
        self.db = ProductDatabase()
        
        # Conversation history
        self.conversation_history = []
        
        # System prompt for natural conversation
        self.system_prompt = """You are a friendly, helpful AI shopping assistant named ShopAI. 

Your personality:
- Conversational and natural like ChatGPT
- Helpful and enthusiastic about shopping
- You understand context and remember the conversation
- You can chat about anything but specialize in helping with shopping lists
- You're knowledgeable about party planning, cooking, and events

Your capabilities:
- Create smart shopping lists for any event (BBQ, parties, dinners, etc.)
- Calculate quantities based on number of people
- Find products from Walmart and other stores
- Help with budget planning
- Give advice on party planning and cooking

When users greet you or chat casually:
- Respond naturally and friendly
- Introduce your shopping assistant capabilities
- Ask how you can help

When users request shopping help:
- Understand their event type and guest count
- Ask clarifying questions if needed
- Create detailed shopping lists
- Provide helpful suggestions

Be conversational, friendly, and helpful! You're like a smart friend who loves helping with shopping."""
    
    def chat(self, user_message: str, store_name: Optional[str] = None) -> Dict[str, Any]:
        """Main conversational interface"""
        
        # Add to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Detect if this is a shopping request
        is_shopping_request = self._is_shopping_request(user_message)
        
        if is_shopping_request:
            # Handle shopping request
            return self._handle_shopping_request(user_message, store_name)
        else:
            # Handle general conversation
            return self._handle_conversation(user_message)
    
    def _is_shopping_request(self, message: str) -> bool:
        """Detect if message is a shopping request"""
        message_lower = message.lower()
        
        shopping_keywords = [
            'shopping', 'list', 'buy', 'need', 'want', 'party', 'bbq', 
            'dinner', 'lunch', 'breakfast', 'event', 'people', 'guests',
            'budget', 'items', 'products', 'get me', 'find me'
        ]
        
        # Check if it's asking for help or general chat
        general_chat = ['hi', 'hello', 'hey', 'how are you', 'what can you', 
                       'who are you', 'help', 'what do you do']
        
        # If it's general chat, not shopping
        if any(message_lower.strip().startswith(g) for g in general_chat):
            return False
        
        # If contains shopping keywords and numbers (for people count)
        has_numbers = any(char.isdigit() for char in message)
        has_shopping_keyword = any(keyword in message_lower for keyword in shopping_keywords)
        
        return has_shopping_keyword or (has_numbers and len(message.split()) > 3)
    
    def _handle_conversation(self, user_message: str) -> Dict[str, Any]:
        """Handle general conversation"""
        
        if not self.client:
            # Fallback responses
            return self._basic_conversation(user_message)
        
        try:
            # Build conversation with history
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add recent history (last 5 messages)
            for msg in self.conversation_history[-5:]:
                if msg["role"] != "system":
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            # Get AI response
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.8,
                max_tokens=300
            )
            
            ai_message = response.choices[0].message.content.strip()
            
            # Add to history
            self.conversation_history.append({
                "role": "assistant",
                "content": ai_message,
                "timestamp": datetime.now().isoformat()
            })
            
            return {
                "success": True,
                "message": ai_message,
                "type": "conversation",
                "shopping_list": {"items": [], "total_cost": 0}
            }
            
        except Exception as e:
            print(f"Conversation error: {e}")
            return self._basic_conversation(user_message)
    
    def _basic_conversation(self, user_message: str) -> Dict[str, Any]:
        """Fallback conversation without OpenAI"""
        
        message_lower = user_message.lower().strip()
        
        # Greeting responses
        if any(g in message_lower for g in ['hi', 'hello', 'hey']):
            responses = [
                "👋 Hey there! I'm ShopAI, your intelligent shopping assistant. I can help you create perfect shopping lists for any event! Just tell me what you're planning - like 'BBQ for 14 people' or 'dinner party for 8' - and I'll handle the rest!",
                "Hi! 😊 I'm here to make your shopping easier. Whether it's a BBQ, party, or weekly groceries, just describe what you need and I'll create a complete shopping list with real prices from Walmart!",
                "Hello! I'm ShopAI, and I love helping with shopping! 🛒 Tell me about your event or what you need, and I'll calculate everything - quantities, items, and total cost. Try asking me something like 'BBQ for 20 people'!"
            ]
            import random
            message = random.choice(responses)
        
        # What can you do
        elif 'what' in message_lower and ('you' in message_lower or 'can' in message_lower):
            message = """I'm an AI shopping assistant that helps you:

🛒 **Create Smart Shopping Lists**
   - Just tell me your event (BBQ, party, dinner, etc.)
   - I calculate quantities based on guest count
   - Get complete lists with real Walmart prices

🎯 **Smart Features:**
   - Budget optimization
   - Quantity calculations per person
   - Real product prices
   - Category organization

💬 **Just chat naturally!**
Try: "I need food for a BBQ with 14 people"
Or: "Dinner party for 8, budget $100"

What would you like help with?"""
        
        # Who are you
        elif 'who' in message_lower:
            message = "I'm ShopAI, an AI-powered shopping assistant! 🤖 I help you create perfect shopping lists for any occasion. I use smart algorithms (and OpenAI when available) to understand what you need and calculate the right quantities. Think of me as your personal shopping expert! How can I help you today?"
        
        # Help
        elif 'help' in message_lower:
            message = """Sure! Here's how to use me:

**For Shopping Lists:**
   • "BBQ for 14 people"
   • "Dinner party for 8, budget $100"
   • "Need snacks for 20 guests"
   • "Shopping for family of 4"

**I'll create:**
   ✅ Complete product list
   ✅ Quantities calculated per person
   ✅ Real prices from Walmart
   ✅ Total cost

**Just chat naturally!** Tell me what you're planning and I'll take care of the rest. What do you need help with?"""
        
        # Default
        else:
            message = "I'm here to help with shopping! 🛍️ Tell me about an event you're planning (like a BBQ, party, or dinner), how many people are coming, and I'll create the perfect shopping list for you. Or just ask me anything - I'm here to chat!"
        
        return {
            "success": True,
            "message": message,
            "type": "conversation",
            "shopping_list": {"items": [], "total_cost": 0}
        }
    
    def _handle_shopping_request(self, user_message: str, store_name: Optional[str] = None) -> Dict[str, Any]:
        """Handle shopping list creation"""
        
        # Use the shopping assistant
        result = self.shopping_assistant.chat(user_message, store_name)
        
        # Add conversational wrapper
        if result.get('success') and result.get('shopping_list', {}).get('items'):
            shopping_list = result['shopping_list']
            
            # Create natural response
            if self.client:
                response_text = self._generate_natural_response(user_message, shopping_list)
            else:
                response_text = result.get('message', 'Shopping list created!')
            
            # Add to history
            self.conversation_history.append({
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.now().isoformat()
            })
            
            return {
                "success": True,
                "message": response_text,
                "type": "shopping",
                "shopping_list": shopping_list,
                "request_info": result.get('request', {})
            }
        else:
            return result
    
    def _generate_natural_response(self, request: str, shopping_list: Dict) -> str:
        """Generate natural ChatGPT-like response"""
        
        try:
            num_items = len(shopping_list.get('items', []))
            total = shopping_list.get('total_cost', 0)
            num_people = shopping_list.get('num_people', 0)
            
            prompt = f"""User requested: "{request}"

You created a shopping list with:
- {num_items} items
- Total cost: ${total:.2f}
- For: {num_people} people

Write a natural, friendly response (2-3 sentences) as if you're ChatGPT helping a friend.
Be enthusiastic, helpful, and conversational. Mention key details naturally."""
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a friendly shopping assistant. Respond naturally and conversationally."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
            
        except:
            return f"Perfect! I've created your shopping list with {num_items} items totaling ${total:.2f} for {num_people} people. You're all set! 🎉"
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []


if __name__ == "__main__":
    print("🤖 Testing Conversational AI\n")
    
    assistant = ConversationalAssistant()
    
    # Test conversation
    tests = [
        "Hi!",
        "What can you do?",
        "I want to have a BBQ for 14 people"
    ]
    
    for test in tests:
        print(f"\nUser: {test}")
        result = assistant.chat(test)
        print(f"AI: {result['message'][:200]}...")

