#!/usr/bin/env python3
"""
ShopAI Enhanced - With Budget, Questionnaire, Images, and Smart Search
"""

import os
import json
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

from product_database import ProductDatabase
from groq_assistant import GroqAIAssistant
from smart_list_builder import SmartListBuilder

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

db = ProductDatabase()
assistant = GroqAIAssistant()
list_builder = SmartListBuilder()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stats', methods=['GET'])
def get_stats():
    stores = db.get_stores()
    stats = {
        "total_products": db.get_product_count(),
        "total_stores": len(stores),
        "stores": []
    }
    
    for store in stores:
        stats["stores"].append({
            "name": store,
            "product_count": db.get_product_count(store),
            "categories": db.get_categories(store)
        })
    
    return jsonify(stats)

def is_shopping_request(message: str) -> bool:
    """Check if message is a shopping request (not just greeting)"""
    message_lower = message.lower().strip()
    
    # Greetings - no shopping list
    greetings = ['hi', 'hello', 'hey', 'hey there', 'what\'s up', 'sup', 'yo', 
                 'how are you', 'who are you', 'what can you do', 'help', 
                 'what do you do', 'who made you', 'what are you']
    
    if message_lower in greetings or any(message_lower.startswith(g) for g in greetings):
        return False
    
    # Shopping keywords
    shopping_keywords = [
        'bbq', 'barbecue', 'dinner', 'lunch', 'party', 'event', 'people',
        'guests', 'shopping', 'list', 'buy', 'need', 'want', 'get me',
        'budget', 'jod', 'items', 'products', 'food for', 'meal for',
        'breakfast', 'make', 'prepare', 'include', 'hummus', 'falafel'
    ]
    
    # Check if it has shopping keywords AND numbers (for people count)
    has_shopping_word = any(keyword in message_lower for keyword in shopping_keywords)
    has_numbers = any(char.isdigit() for char in message)
    
    # If it's just a greeting or question, no shopping list
    if not has_shopping_word:
        return False
    
    # If it has shopping words but no numbers and is short, might be question
    if not has_numbers and len(message.split()) < 5:
        return False
    
    return True

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    
    if not message:
        return jsonify({"error": "Message required"}), 400
    
    try:
        # Check if this is a shopping request
        is_shopping = is_shopping_request(message)
        
        # Get AI response for conversation
        ai_result = assistant.chat(message)
        ai_message = ai_result.get('message', '')
        
        # Only build shopping list if it's a shopping request
        shopping_list = {"items": [], "total_cost": 0, "num_people": 0, "event_type": "none"}
        
        if is_shopping:
            # Build accurate shopping list
            shopping_list = list_builder.build_list(message)
            
            # Enhance AI message with shopping details if needed
            if shopping_list.get('items'):
                event = shopping_list.get('event_type', 'event')
                people = shopping_list.get('num_people', 0)
                total = shopping_list.get('total_cost', 0)
                items_count = len(shopping_list.get('items', []))
                budget = shopping_list.get('budget')
                
                # Add shopping summary to AI message
                if budget and total <= budget:
                    summary = f"\n\n📋 I've created your shopping list: {items_count} items for {people} people, totaling {total:.2f} JOD (within your {budget} JOD budget). Scroll down to see the full list! 🛒"
                elif budget:
                    summary = f"\n\n📋 Shopping list ready: {items_count} items totaling {total:.2f} JOD. Scroll down to see details! 🛒"
                else:
                    summary = f"\n\n📋 Your shopping list is ready below with {items_count} items totaling {total:.2f} JOD! 🛒"
                
                ai_message = ai_message + summary
        
        return jsonify({
            "success": True,
            "message": ai_message,
            "response": ai_message,
            "shopping_list": shopping_list,
            "is_shopping": is_shopping
        })
    
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("=" * 70)
    print("🇯🇴 ShopAI Jordan - Enhanced Edition")
    print("=" * 70)
    print(f"\n✨ NEW FEATURES:")
    print(f"   ✅ Budget input & tracking")
    print(f"   ✅ Smart questionnaire")
    print(f"   ✅ Product images")
    print(f"   ✅ Dietary preferences")
    print(f"   ✅ Real Talabat links")
    print(f"   ✅ JOD pricing")
    print(f"\n📊 Database: {db.get_product_count()} products")
    print(f"🌐 Open: http://localhost:8080")
    print(f"\n🇯🇴 Ahlan wa Sahlan!")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=8080, use_reloader=False)

