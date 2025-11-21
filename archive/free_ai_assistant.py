#!/usr/bin/env python3
"""
FREE AI Chat APIs Integration
Multiple free alternatives to OpenAI
"""

import os
import json
import requests
from typing import Dict, List, Optional, Any

from product_database import ProductDatabase


class FreeAIAssistant:
    """Shopping assistant using FREE AI APIs"""
    
    def __init__(self):
        self.db = ProductDatabase()
        self.conversation_history = []
        
        # Try different free AI providers in order
        self.providers = [
            self._try_huggingface,
            self._try_cohere,
            self._try_anthropic_free,
            self._try_groq,
        ]
        
        self.system_prompt = """You are ShopAI, a helpful shopping assistant. 
You help users create shopping lists for events like BBQ, parties, dinners.
You have access to real Walmart products and can calculate quantities per person.
Be friendly, conversational, and helpful!"""
    
    def chat(self, user_message: str, store_name: Optional[str] = None) -> Dict[str, Any]:
        """Chat using free AI providers"""
        
        # Get products from database
        products = self.db.search_products(store_name=store_name, limit=50)
        products_info = self._format_products(products)
        
        # Build the prompt
        full_prompt = f"""{self.system_prompt}

Available products in database:
{products_info}

User: {user_message}
