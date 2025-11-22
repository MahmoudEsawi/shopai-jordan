#!/usr/bin/env python3
"""
ShopAI Enhanced - With Budget, Questionnaire, Images, and Smart Search
"""

import os
import json
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, date, timedelta

# Load environment variables from .env file
load_dotenv()

from product_database import ProductDatabase
from groq_assistant import GroqAIAssistant
from smart_list_builder import SmartListBuilder
from recipe_suggestions import RecipeSuggestions
from list_sharing import ListSharing
from cart_manager import CartManager
from user_database import UserDatabase
from food_analyzer import FoodAnalyzer
from calorie_calculator import CalorieCalculator

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

db = ProductDatabase()
assistant = GroqAIAssistant()
list_builder = SmartListBuilder()
recipe_suggestions = RecipeSuggestions()
list_sharing = ListSharing()
user_db = UserDatabase()
food_analyzer = FoodAnalyzer()
calorie_calculator = CalorieCalculator()

# Cart storage (in production, use session or database)
user_carts = {}  # {session_id: CartManager}
user_last_ai_responses = {}  # {session_id: last_ai_message}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/auth')
def auth():
    """Authentication page"""
    return render_template('auth.html')

@app.route('/loseit')
def loseit():
    """Lose It section - requires authentication"""
    return render_template('loseit.html')

@app.route('/api/recipes', methods=['POST'])
def get_recipes():
    """Get recipe suggestions for a shopping list"""
    data = request.json
    shopping_list = data.get('shopping_list', {})
    
    if not shopping_list or not shopping_list.get('items'):
        return jsonify({"error": "Shopping list required"}), 400
    
    recipes = recipe_suggestions.get_suggestions(
        shopping_list.get('event_type', 'bbq'),
        shopping_list.get('num_people', 4),
        shopping_list.get('items', [])
    )
    
    return jsonify({"recipes": recipes})

@app.route('/api/share', methods=['POST'])
def share_list():
    """Generate share URL for shopping list"""
    data = request.json
    shopping_list = data.get('shopping_list', {})
    
    if not shopping_list:
        return jsonify({"error": "Shopping list required"}), 400
    
    share_url = list_sharing.generate_share_url(shopping_list)
    full_url = request.host_url.rstrip('/') + share_url
    
    return jsonify({
        "share_url": share_url,
        "full_url": full_url,
        "text": list_sharing.get_social_share_text(shopping_list)
    })

@app.route('/api/export', methods=['POST'])
def export_list():
    """Export shopping list in different formats"""
    data = request.json
    shopping_list = data.get('shopping_list', {})
    format_type = data.get('format', 'json')  # json, text
    
    if not shopping_list:
        return jsonify({"error": "Shopping list required"}), 400
    
    if format_type == 'text':
        exported = list_sharing.export_to_text(shopping_list)
        return jsonify({"content": exported, "format": "text"})
    else:
        exported = list_sharing.export_to_json(shopping_list)
        return jsonify({"content": exported, "format": "json"})

@app.route('/share/<list_id>', methods=['GET'])
def view_shared_list(list_id):
    """View a shared shopping list"""
    shared_list = list_sharing.get_shared_list(list_id)
    
    if not shared_list:
        return render_template('index.html', error="Shopping list not found or expired")
    
    # Render the list in the template
    return render_template('index.html', shared_list=shared_list)

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

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products for browsing"""
    try:
        # Get filter parameters
        healthy_only = request.args.get('healthy', 'false').lower() == 'true'
        gluten_free = request.args.get('gluten_free', 'false').lower() == 'true'
        min_protein = request.args.get('min_protein', type=float)
        max_calories = request.args.get('max_calories', type=float)
        category = request.args.get('category')
        search_query = request.args.get('q')
        
        # Search products with filters
        products = db.search_products(
            query=search_query,
            category=category,
            healthy_only=healthy_only,
            gluten_free=gluten_free,
            min_protein=min_protein,
            max_calories=max_calories,
            limit=500
        )
        
        # Convert to JSON-serializable format
        products_list = []
        for product in products:
            # Handle both integer (0/1) and boolean values
            is_gluten_free = product.get('is_gluten_free')
            is_vegetarian = product.get('is_vegetarian')
            is_vegan = product.get('is_vegan')
            is_healthy = product.get('is_healthy')
            is_organic = product.get('is_organic')
            
            products_list.append({
                'id': product.get('id'),
                'name': product.get('name'),
                'price': float(product.get('price', 0)) if product.get('price') else 0,
                'currency': product.get('currency', 'JOD'),
                'category': product.get('category', 'general'),
                'image_url': product.get('image_url', ''),
                'product_url': product.get('product_url', ''),
                'store_name': product.get('store_name', 'Talabat Mart Jordan'),
                'description': product.get('description', ''),
                'calories_per_100g': float(product.get('calories_per_100g')) if product.get('calories_per_100g') else None,
                'protein_per_100g': float(product.get('protein_per_100g')) if product.get('protein_per_100g') else None,
                'carbs_per_100g': float(product.get('carbs_per_100g')) if product.get('carbs_per_100g') else None,
                'fats_per_100g': float(product.get('fats_per_100g')) if product.get('fats_per_100g') else None,
                'fiber_per_100g': float(product.get('fiber_per_100g')) if product.get('fiber_per_100g') else None,
                'is_gluten_free': bool(is_gluten_free) if is_gluten_free is not None else False,
                'is_vegetarian': bool(is_vegetarian) if is_vegetarian is not None else False,
                'is_vegan': bool(is_vegan) if is_vegan is not None else False,
                'is_healthy': bool(is_healthy) if is_healthy is not None else False,
                'is_organic': bool(is_organic) if is_organic is not None else False,
                'is_halal': bool(product.get('is_halal', 1)) if product.get('is_halal') is not None else True
            })
        
        return jsonify({
            "success": True,
            "products": products_list,
            "count": len(products_list)
        })
    except Exception as e:
        import traceback
        print(f"Error getting products: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e), "success": False}), 500

def is_shopping_request(message: str) -> bool:
    """Check if message is a shopping request (not just greeting or simple cart)"""
    message_lower = message.lower().strip()
    
    # Greetings - no shopping list
    greetings = ['hi', 'hello', 'hey', 'hey there', 'what\'s up', 'sup', 'yo', 
                 'how are you', 'who are you', 'what can you do', 'help', 
                 'what do you do', 'who made you', 'what are you']
    
    if message_lower in greetings or any(message_lower.startswith(g) for g in greetings):
        return False
    
    # Simple cart requests (single meal) - should NOT create full shopping list
    simple_cart_patterns = [
        r'breakfast.*for.*\d+\s*(?:person|people)',
        r'lunch.*for.*\d+\s*(?:person|people)',
        r'dinner.*for.*\d+\s*(?:person|people)',
        r'meal.*for.*\d+\s*(?:person|people)',
        r'snack.*for.*\d+\s*(?:person|people)',
        r'breakfast\s*$',  # Just "breakfast"
        r'one\s+person\s+breakfast',  # "one person breakfast"
        r'breakfast\s+for\s+one',  # "breakfast for one"
    ]
    
    import re
    for pattern in simple_cart_patterns:
        if re.search(pattern, message_lower):
            # This is a simple cart request, not a full shopping list
            return False
    
    # If message is very short and just mentions a meal type, it's likely a simple request
    if len(message.split()) <= 3 and any(word in message_lower for word in ['breakfast', 'lunch', 'dinner', 'meal', 'snack']):
        return False
    
    # Shopping keywords for full shopping lists (events with multiple people)
    shopping_keywords = [
        'bbq', 'barbecue', 'party', 'event', 'guests',
        'shopping list', 'full list', 'complete list',
        'items', 'products', 'make', 'prepare', 'include'
    ]
    
    # Check if it has shopping keywords AND numbers (for people count > 1 usually)
    has_shopping_word = any(keyword in message_lower for keyword in shopping_keywords)
    has_numbers = any(char.isdigit() for char in message)
    
    # If it's just a greeting or question, no shopping list
    if not has_shopping_word:
        return False
    
    # If it has shopping words but no numbers and is short, might be question
    if not has_numbers and len(message.split()) < 5:
        return False
    
    # If it mentions "for one person" or "for 1 person", it's a simple request
    if re.search(r'for\s+(?:one|1)\s*(?:person|people)', message_lower):
        return False
    
    return True

def get_user_cart(session_id: str = None) -> CartManager:
    """Get or create cart for user session"""
    if not session_id:
        session_id = request.headers.get('X-Session-ID', 'default')
    
    if session_id not in user_carts:
        user_carts[session_id] = CartManager()
    
    return user_carts[session_id]

def get_session_id() -> str:
    """Get or create session ID"""
    return request.headers.get('X-Session-ID', 'default')

@app.route('/api/cart', methods=['GET'])
def get_cart():
    """Get current cart"""
    try:
        session_id = get_session_id()
        cart = get_user_cart(session_id)
        cart_summary = cart.get_cart_summary()
        return jsonify({
            "success": True,
            "cart": cart_summary
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    """Add product to cart"""
    try:
        data = request.json
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        if not product_id:
            return jsonify({"error": "Product ID required"}), 400
        
        session_id = get_session_id()
        cart = get_user_cart(session_id)
        result = cart.add_to_cart(product_id, quantity)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart/remove', methods=['POST'])
def remove_from_cart():
    """Remove product from cart"""
    try:
        data = request.json
        product_id = data.get('product_id')
        
        if not product_id:
            return jsonify({"error": "Product ID required"}), 400
        
        session_id = get_session_id()
        cart = get_user_cart(session_id)
        result = cart.remove_from_cart(product_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart/update', methods=['POST'])
def update_cart_item():
    """Update cart item quantity"""
    try:
        data = request.json
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        if not product_id:
            return jsonify({"error": "Product ID required"}), 400
        
        session_id = get_session_id()
        cart = get_user_cart(session_id)
        result = cart.update_quantity(product_id, quantity)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/cart/clear', methods=['POST'])
def clear_cart():
    """Clear entire cart"""
    try:
        session_id = get_session_id()
        cart = get_user_cart(session_id)
        result = cart.clear_cart()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    
    if not message:
        return jsonify({"error": "Message required"}), 400
    
    try:
        # Get user's cart and session
        session_id = get_session_id()
        cart = get_user_cart(session_id)
        
        # Check for cart commands
        message_lower = message.lower().strip()
        cart_command = None
        
        # Special case: "add it" or "add them" - use last AI response
        # Check for variations like "add it", "add them", "add them to cart", etc.
        add_commands = ['add it', 'add them', 'add all', 'add everything', 'yes', 'ok', 'okay', 
                       'add it to cart', 'add them to cart', 'add all to cart', 'add to cart']
        is_add_command = any(cmd in message_lower for cmd in add_commands) or \
                        (message_lower.startswith('add') and ('it' in message_lower or 'them' in message_lower or 'all' in message_lower))
        
        if is_add_command:
            if session_id in user_last_ai_responses:
                last_ai_message = user_last_ai_responses[session_id]
                # Extract products from last AI response
                products = db.search_products(limit=200)
                added_to_cart = []
                
                import re
                # Product aliases for better matching
                product_aliases = {
                    'arabic bread': ['bread', 'khubz', 'arabic bread'],
                    'hummus': ['hummus', 'humus'],
                    'tomatoes': ['tomato', 'tomatoes'],
                    'mint': ['mint', 'fresh mint'],
                    'ayran': ['ayran', 'laban'],
                    'falafel': ['falafel'],
                    'tahini': ['tahini', 'tahini sauce'],
                    'fruit': ['fruit', 'fresh fruit']
                }
                
                # Extract products from last AI message
                lines = last_ai_message.split('\n')
                mentioned_products = []
                
                for line in lines:
                    line_lower = line.lower().strip()
                    if not line_lower or len(line_lower) < 5:
                        continue
                    if 'total' in line_lower and 'jod' in line_lower:
                        continue
                    
                    best_match = None
                    best_score = 0
                    quantity = 1
                    
                    for product in products:
                        product_name = product.get('name', '').lower()
                        
                        # Remove common suffixes for matching (e.g., "- 500g", "- Pack of 10")
                        product_base = re.sub(r'\s*-\s*\d+.*$', '', product_name).strip()
                        product_base = re.sub(r'\s*\(.*?\)', '', product_base).strip()
                        
                        # Direct match (full product name)
                        if product_name in line_lower:
                            score = len(product_name.split())
                            if score > best_score:
                                best_match = product
                                best_score = score
                        
                        # Base name match (without weight/pack info)
                        if product_base in line_lower and len(product_base) > 3:
                            score = len(product_base.split())
                            if score > best_score:
                                best_match = product
                                best_score = score
                        
                        # Alias match
                        for alias_key, alias_terms in product_aliases.items():
                            if alias_key in product_name or alias_key in product_base:
                                if any(term in line_lower for term in alias_terms):
                                    score = len(alias_terms) + 2  # Bonus for alias match
                                    if score > best_score:
                                        best_match = product
                                        best_score = score
                        
                        # Keyword match (at least 2 significant words)
                        product_key_words = [w for w in product_base.split() if len(w) > 3]
                        if product_key_words:
                            matches = sum(1 for word in product_key_words if word in line_lower)
                            if matches >= 2 and matches > best_score:
                                best_match = product
                                best_score = matches
                        
                        # Single word match for short product names (like "hummus", "falafel")
                        if len(product_key_words) == 1 and product_key_words[0] in line_lower:
                            if len(product_key_words[0]) > 4:  # Only for words longer than 4 chars
                                score = 1
                                if score > best_score:
                                    best_match = product
                                    best_score = score
                    
                    if best_match:
                        # Extract quantity
                        qty_patterns = [
                            rf'(\d+)\s*(?:x|×|pieces?|units?|kg|g|pack|ml|l|piece)?',
                            rf'(\d+)-(\d+)',  # Range like "2-3 pieces"
                        ]
                        
                        for pattern in qty_patterns:
                            match = re.search(pattern, line_lower)
                            if match:
                                try:
                                    if match.lastindex == 2:  # Range
                                        qty = int(match.group(2))  # Take higher number
                                    else:
                                        qty = int(match.group(1))
                                    if 0 < qty < 100:
                                        quantity = qty
                                        break
                                except:
                                    pass
                        
                        if not any(p['id'] == best_match['id'] for p in mentioned_products):
                            mentioned_products.append({
                                'id': best_match['id'],
                                'name': best_match.get('name', ''),
                                'quantity': quantity
                            })
                
                # Add all mentioned products to cart
                for item in mentioned_products:
                    result = cart.add_to_cart(item['id'], item['quantity'])
                    if result.get('success'):
                        added_to_cart.append(f"{item['name']} (x{item['quantity']})")
                
                cart_summary = cart.get_cart_summary()
                
                if added_to_cart:
                    return jsonify({
                        "success": True,
                        "message": f"✅ Added to cart: {', '.join(added_to_cart)}\n\n🛒 Cart total: {cart_summary['total_cost']:.2f} JOD ({cart_summary['total_items']} items)",
                        "cart": cart_summary,
                        "cart_command": "add_all"
                    })
                else:
                    # Debug: show what we found
                    debug_info = f"Found {len(mentioned_products)} products mentioned: {[p['name'] for p in mentioned_products]}"
                    return jsonify({
                        "success": False,
                        "message": f"I couldn't find the products from my last suggestion. {debug_info}\n\nPlease try saying the product names directly, like 'add hummus' or 'add arabic bread'.",
                        "cart": cart_summary
                    })
            else:
                return jsonify({
                    "success": False,
                    "message": "I don't have a previous suggestion to add. Please ask me for a meal or shopping list first!",
                    "cart": cart.get_cart_summary()
                })
        
        # Check if this is a conversational "add" request (like "add something with protein")
        # These should go to AI first, not be treated as direct product commands
        conversational_add_patterns = [
            'add something', 'add some', 'add a', 'add an',
            'add something with', 'add something for', 'add something that',
            'add some', 'add a', 'add an', 'add one',
            'something with', 'something for', 'something that has'
        ]
        is_conversational_add = any(pattern in message_lower for pattern in conversational_add_patterns)
        
        # Detect cart commands with better pattern matching
        cart_keywords = {
            'add': ['add', 'put', 'cart', 'include', 'get'],
            'remove': ['remove', 'delete', 'take out', 'drop'],
            'update': ['update', 'change', 'edit', 'modify', 'set'],
            'clear': ['clear', 'empty', 'remove all', 'delete all']
        }
        
        for command, keywords in cart_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                cart_command = command
                break
        
        # Skip direct cart command handling for conversational requests
        # Let AI handle them first, then extract products from AI response
        if cart_command and not is_conversational_add:
            import re
            
            # Search for product in message - try multiple strategies
            products = db.search_products(limit=200)
            matched_product = None
            quantity = 1
            
            # Strategy 1: Direct product name search
            for product in products:
                product_name = product.get('name', '').lower()
                # Check if significant words from product name are in message
                product_words = [w for w in product_name.split() if len(w) > 3]
                if product_words and any(word in message_lower for word in product_words):
                    matched_product = product
                    break
            
            # Strategy 2: Search by category keywords
            if not matched_product:
                category_keywords = {
                    'chicken': 'meat',
                    'beef': 'meat',
                    'lamb': 'meat',
                    'tomato': 'vegetables',
                    'onion': 'vegetables',
                    'pepper': 'vegetables',
                    'bread': 'bread',
                    'hummus': 'condiments',
                    'cola': 'drinks',
                    'water': 'drinks'
                }
                
                for keyword, category in category_keywords.items():
                    if keyword in message_lower:
                        category_products = [p for p in products if p.get('category') == category]
                        if category_products:
                            matched_product = category_products[0]
                            break
            
            # Extract quantity
            quantity_match = re.search(r'(\d+)\s*(?:x|×|pieces?|units?|kg|g|pack)?', message_lower)
            if quantity_match:
                quantity = int(quantity_match.group(1))
            
            # Handle commands
            if cart_command == 'add':
                if matched_product:
                    result = cart.add_to_cart(matched_product['id'], quantity)
                    return jsonify({
                        "success": True,
                        "message": f"✅ {result['message']}\n\n🛒 Cart now has {result['cart']['item_count']} items totaling {result['cart']['total_cost']:.2f} JOD",
                        "cart": result['cart'],
                        "cart_command": "add"
                    })
                else:
                    return jsonify({
                        "success": False,
                        "message": "I couldn't find that product. Try: 'add chicken breast' or 'add tomatoes'",
                        "cart": cart.get_cart_summary()
                    })
            elif cart_command == 'remove':
                if matched_product:
                    result = cart.remove_from_cart(matched_product['id'])
                    return jsonify({
                        "success": True,
                        "message": f"✅ {result['message']}\n\n🛒 Cart now has {result['cart']['item_count']} items",
                        "cart": result['cart'],
                        "cart_command": "remove"
                    })
                else:
                    return jsonify({
                        "success": False,
                        "message": "I couldn't find that product in your cart. Check your cart to see what's there.",
                        "cart": cart.get_cart_summary()
                    })
            elif cart_command == 'clear':
                result = cart.clear_cart()
                return jsonify({
                    "success": True,
                    "message": f"✅ {result['message']}",
                    "cart": result['cart'],
                    "cart_command": "clear"
                })
            elif cart_command == 'update':
                if matched_product:
                    result = cart.update_quantity(matched_product['id'], quantity)
                    return jsonify({
                        "success": True,
                        "message": f"✅ {result['message']}\n\n🛒 Cart total: {result['cart']['total_cost']:.2f} JOD",
                        "cart": result['cart'],
                        "cart_command": "update"
                    })
                else:
                    return jsonify({
                        "success": False,
                        "message": "I couldn't find that product. Try: 'change chicken to 2' or 'update tomatoes to 3'",
                        "cart": cart.get_cart_summary()
                    })
        
        # Check if this is a shopping request (full list) or just cart addition
        is_shopping = is_shopping_request(message)
        # Simple cart request: meal requests for 1 person, or just mentioning a meal type
        is_simple_cart_request = (
            any(word in message_lower for word in ['breakfast', 'lunch', 'dinner', 'meal', 'snack']) and 
            ('for' in message_lower and ('person' in message_lower or 'people' in message_lower)) or
            (len(message.split()) <= 3 and any(word in message_lower for word in ['breakfast', 'lunch', 'dinner', 'meal', 'snack']))
        )
        
        # Get AI response for conversation
        ai_result = assistant.chat(message)
        ai_message = ai_result.get('message', '')
        
        # Store last AI response for "add it" command
        user_last_ai_responses[session_id] = ai_message
        
        # Get current cart
        cart_summary = cart.get_cart_summary()
        
        # If it's a conversational "add" request (like "add something with protein"), 
        # extract products from AI response and add to cart automatically
        if is_conversational_add:
            import re
            products = db.search_products(limit=200)
            added_to_cart = []
            
            # Product aliases for better matching
            product_aliases = {
                'arabic bread': ['bread', 'khubz', 'arabic bread'],
                'hummus': ['hummus', 'humus'],
                'tomatoes': ['tomato', 'tomatoes'],
                'mint': ['mint', 'fresh mint'],
                'ayran': ['ayran', 'laban'],
                'falafel': ['falafel'],
                'tahini': ['tahini', 'tahini sauce'],
                'fruit': ['fruit', 'fresh fruit'],
                'chicken': ['chicken', 'chicken breast', 'chicken shish', 'shish tawook'],
                'eggs': ['egg', 'eggs'],
                'cheese': ['cheese', 'feta', 'halloumi'],
                'yogurt': ['yogurt', 'yoghurt', 'labneh']
            }
            
            # Extract products from AI response
            lines = ai_message.split('\n')
            mentioned_products = []
            
            for line in lines:
                line_lower = line.lower().strip()
                if not line_lower or len(line_lower) < 5:
                    continue
                if 'total' in line_lower and 'jod' in line_lower:
                    continue
                if 'budget' in line_lower and 'left' in line_lower:
                    continue
                
                best_match = None
                best_score = 0
                quantity = 1
                
                for product in products:
                    product_name = product.get('name', '').lower()
                    product_base = re.sub(r'\s*-\s*\d+.*$', '', product_name).strip()
                    product_base = re.sub(r'\s*\(.*?\)', '', product_base).strip()
                    
                    # Direct match
                    if product_name in line_lower:
                        score = len(product_name.split())
                        if score > best_score:
                            best_match = product
                            best_score = score
                    
                    # Base name match
                    if product_base in line_lower and len(product_base) > 3:
                        score = len(product_base.split())
                        if score > best_score:
                            best_match = product
                            best_score = score
                    
                    # Alias match
                    for alias_key, alias_terms in product_aliases.items():
                        if alias_key in product_name or alias_key in product_base:
                            if any(term in line_lower for term in alias_terms):
                                score = len(alias_terms) + 2
                                if score > best_score:
                                    best_match = product
                                    best_score = score
                    
                    # Keyword match
                    product_key_words = [w for w in product_base.split() if len(w) > 3]
                    if product_key_words:
                        matches = sum(1 for word in product_key_words if word in line_lower)
                        if matches >= 2 and matches > best_score:
                            best_match = product
                            best_score = matches
                
                if best_match:
                    # Extract quantity
                    qty_patterns = [
                        rf'(\d+)\s*(?:x|×|pieces?|units?|kg|g|pack|ml|l|piece)?',
                        rf'(\d+)-(\d+)',
                    ]
                    
                    for pattern in qty_patterns:
                        match = re.search(pattern, line_lower)
                        if match:
                            try:
                                if match.lastindex == 2:
                                    qty = int(match.group(2))
                                else:
                                    qty = int(match.group(1))
                                if 0 < qty < 100:
                                    quantity = qty
                                    break
                            except:
                                pass
                    
                    if not any(p['id'] == best_match['id'] for p in mentioned_products):
                        mentioned_products.append({
                            'id': best_match['id'],
                            'name': best_match.get('name', ''),
                            'quantity': quantity
                        })
            
            # Add mentioned products to cart
            for item in mentioned_products:
                result = cart.add_to_cart(item['id'], item['quantity'])
                if result.get('success'):
                    added_to_cart.append(f"{item['name']} (x{item['quantity']})")
            
            cart_summary = cart.get_cart_summary()
            
            if added_to_cart:
                ai_message += f"\n\n✅ Added to cart: {', '.join(added_to_cart)}\n🛒 Cart total: {cart_summary['total_cost']:.2f} JOD ({cart_summary['total_items']} items)"
        
        # Extract products mentioned by AI and add ONLY those to cart (not full shopping list)
        if is_simple_cart_request or ('budget' in message_lower and 'for' in message_lower and ('person' in message_lower or 'people' in message_lower)):
            # Parse AI response to find mentioned products - look for bullet points or specific mentions
            import re
            products = db.search_products(limit=200)
            added_to_cart = []
            ai_message_lower = ai_message.lower()
            
            # Look for product mentions in AI response - be more precise
            # Check for bullet points or list items (lines starting with * or - or numbers)
            lines = ai_message.split('\n')
            mentioned_products = []
            
            # Common product name mappings for better matching
            product_aliases = {
                'chicken shish tawook': ['chicken', 'shish', 'tawook', 'shish tawook'],
                'arabic bread': ['bread', 'khubz', 'arabic bread', 'khubz'],
                'ayran': ['ayran', 'laban'],
                'hummus': ['hummus', 'humus'],
                'falafel': ['falafel', 'ta\'ameya'],
                'tabbouleh': ['tabbouleh', 'tabouleh'],
                'kofta': ['kofta', 'kafta'],
                'kebab': ['kebab', 'kabab'],
                'mansaf': ['mansaf'],
                'kunafa': ['kunafa', 'knafeh'],
                'baklava': ['baklava'],
                'tomatoes': ['tomato', 'tomatoes', 'fresh tomatoes'],
                'parsley': ['parsley', 'fresh parsley'],
                'mint': ['mint', 'fresh mint'],
                'tahini': ['tahini', 'tahini sauce'],
                'fruit': ['fruit', 'fresh fruit']
            }
            
            for line in lines:
                line_lower = line.lower().strip()
                # Skip empty lines or summary lines
                if not line_lower or len(line_lower) < 5:
                    continue
                if 'total' in line_lower and 'jod' in line_lower:
                    continue
                if 'budget' in line_lower and 'left' in line_lower:
                    continue
                
                # Look for product names in this line
                best_match = None
                best_score = 0
                quantity = 1
                
                for product in products:
                    product_name = product.get('name', '')
                    product_name_lower = product_name.lower()
                    
                    # Remove common suffixes for matching (e.g., "- 500g", "- Pack of 10")
                    product_base = re.sub(r'\s*-\s*\d+.*$', '', product_name_lower).strip()
                    product_base = re.sub(r'\s*\(.*?\)', '', product_base).strip()
                    
                    # Check direct name match (full product name)
                    if product_name_lower in line_lower:
                        score = len(product_name_lower.split())
                        if score > best_score:
                            best_match = product
                            best_score = score
                    
                    # Check base name match (without weight/pack info)
                    if product_base in line_lower and len(product_base) > 3:
                        score = len(product_base.split())
                        if score > best_score:
                            best_match = product
                            best_score = score
                    
                    # Check alias matches
                    for alias_key, alias_terms in product_aliases.items():
                        if alias_key in product_name_lower or alias_key in product_base:
                            if any(term in line_lower for term in alias_terms):
                                score = len(alias_terms) + 2  # Bonus for alias match
                                if score > best_score:
                                    best_match = product
                                    best_score = score
                    
                    # Check key word matches (at least 2 significant words)
                    product_key_words = [w for w in product_base.split() if len(w) > 3]
                    if product_key_words:
                        matches = sum(1 for word in product_key_words if word in line_lower)
                        if matches >= 2 and matches > best_score:
                            best_match = product
                            best_score = matches
                
                # Extract quantity from line if we found a match
                if best_match:
                    qty_patterns = [
                        rf'(\d+)\s*(?:x|×|pieces?|units?|kg|g|pack|ml|l|piece)?\s*(?:of\s*)?{re.escape(best_match.get("name", "")[:20].lower())}',
                        rf'{re.escape(best_match.get("name", "")[:20].lower())}\s*[-\s]*(\d+)',
                        rf'(\d+)\s*(?:g|kg|ml|l|piece|pack)',
                        rf'(\d+)\s*x\s*',
                        rf'x\s*(\d+)'
                    ]
                    
                    for pattern in qty_patterns:
                        match = re.search(pattern, line_lower)
                        if match:
                            try:
                                qty = int(match.group(1))
                                if qty > 0 and qty < 100:  # Reasonable quantity
                                    quantity = qty
                                    break
                            except:
                                pass
                    
                    # Check if already added
                    if not any(p['id'] == best_match['id'] for p in mentioned_products):
                        mentioned_products.append({
                            'id': best_match['id'],
                            'name': best_match.get('name', ''),
                            'quantity': quantity
                        })
            
            # Add mentioned products to cart
            for item in mentioned_products:
                result = cart.add_to_cart(item['id'], item['quantity'])
                if result.get('success'):
                    added_to_cart.append(f"{item['name']} (x{item['quantity']})")
            
            # Update cart summary
            cart_summary = cart.get_cart_summary()
            
            if added_to_cart:
                ai_message += f"\n\n✅ Added to cart: {', '.join(added_to_cart)}\n🛒 Cart total: {cart_summary['total_cost']:.2f} JOD ({cart_summary['total_items']} items)"
            elif is_simple_cart_request:
                ai_message += f"\n\n💡 Tip: I can add items to your cart. Just say 'add [product name]' or mention specific products!"
        
        # Only build shopping list if it's a full shopping request (not simple cart)
        shopping_list = {"items": [], "total_cost": 0, "num_people": 0, "event_type": "none"}
        recipes = []
        share_url = None
        
        if is_shopping and not is_simple_cart_request:
            # Build accurate shopping list
            shopping_list = list_builder.build_list(message)
            
            # Get recipe suggestions
            if shopping_list.get('items'):
                recipes = recipe_suggestions.get_suggestions(
                    shopping_list.get('event_type', 'bbq'),
                    shopping_list.get('num_people', 4),
                    shopping_list.get('items', [])
                )
                
                # Generate share URL
                share_url = list_sharing.generate_share_url(shopping_list)
            
            # Enhance AI message with shopping details if needed
            # BUT ONLY if it's actually a shopping request (not a simple cart request)
            if shopping_list.get('items') and is_shopping and not is_simple_cart_request:
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
            "recipes": recipes,
            "share_url": share_url,
            "is_shopping": is_shopping and not is_simple_cart_request,
            "cart": cart_summary
        })
    
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Authentication Routes
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User registration"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not username or not email or not password:
            return jsonify({"success": False, "error": "All fields are required"}), 400
        
        result = user_db.create_user(username, email, password)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/signin', methods=['POST'])
def signin():
    """User authentication"""
    try:
        data = request.json
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({"success": False, "error": "Username and password are required"}), 400
        
        user = user_db.authenticate_user(username, password)
        
        if user:
            return jsonify({
                "success": True,
                "user_id": user['id'],
                "username": user['username'],
                "email": user['email']
            })
        else:
            return jsonify({"success": False, "error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/signout', methods=['POST'])
def signout():
    """User sign out"""
    return jsonify({"success": True, "message": "Signed out successfully"})

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    user_id = request.headers.get('X-User-ID')
    if user_id:
        try:
            profile = user_db.get_user_profile(int(user_id))
            return jsonify({"success": True, "authenticated": True, "user_id": int(user_id), "profile": profile})
        except:
            pass
    return jsonify({"success": False, "authenticated": False})

# Lose It / Food Tracking Routes
@app.route('/api/loseit/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        profile = user_db.get_user_profile(int(user_id))
        return jsonify({"success": True, "profile": profile})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/profile', methods=['POST'])
def update_profile():
    """Update user profile"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        data = request.json
        success = user_db.update_user_profile(int(user_id), **data)
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/analyze-food', methods=['POST'])
def analyze_food():
    """Analyze food using AI"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        data = request.json
        food_description = data.get('food_description', '')
        quantity_g = data.get('quantity_g')
        
        if not food_description:
            return jsonify({"success": False, "error": "Food description required"}), 400
        
        result = food_analyzer.analyze_food(food_description, quantity_g)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/log-food', methods=['POST'])
def log_food():
    """Log food entry"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        data = request.json
        result = user_db.log_food(
            int(user_id),
            data.get('food_name', ''),
            data.get('meal_type', 'snack'),
            data.get('quantity_g', 100),
            data.get('calories'),
            data.get('protein_g'),
            data.get('carbs_g'),
            data.get('fats_g'),
            data.get('fiber_g'),
            data.get('notes')
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/food-logs', methods=['GET'])
def get_food_logs():
    """Get food logs"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        date_str = request.args.get('date')
        logs = user_db.get_food_logs(int(user_id), date_str)
        return jsonify({"success": True, "logs": logs})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/daily-summary', methods=['GET'])
def get_daily_summary():
    """Get daily nutrition summary"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        date_str = request.args.get('date')
        summary = user_db.get_daily_summary(int(user_id), date_str)
        profile = user_db.get_user_profile(int(user_id))
        
        # Calculate AI-based goals if profile exists
        if profile:
            # If no goals set, calculate them
            if not profile.get('daily_calorie_goal'):
                calculated = calorie_calculator.calculate_calories_with_ai(profile)
                # Update profile with calculated goals
                user_db.update_user_profile(int(user_id), **calculated)
                profile.update(calculated)
            
            summary['calorie_goal'] = profile.get('daily_calorie_goal', 2000)
            summary['protein_goal'] = profile.get('daily_protein_goal', 0)
            summary['carbs_goal'] = profile.get('daily_carbs_goal', 0)
            summary['fats_goal'] = profile.get('daily_fats_goal', 0)
            summary['bmr'] = profile.get('bmr', 0)
            summary['tdee'] = profile.get('tdee', 0)
        else:
            summary['calorie_goal'] = 2000
            summary['protein_goal'] = 0
            summary['carbs_goal'] = 0
            summary['fats_goal'] = 0
        
        # Calculate deficit/surplus
        summary['calorie_deficit'] = summary['calorie_goal'] - summary['calories']
        summary['exercise_calories'] = 0  # TODO: Add exercise calories
        
        return jsonify({"success": True, "summary": summary})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/log-weight', methods=['POST'])
def log_weight():
    """Log weight entry"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        data = request.json
        result = user_db.log_weight(int(user_id), data.get('weight_kg'), data.get('notes'))
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/weight-logs', methods=['GET'])
def get_weight_logs():
    """Get weight logs"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        limit = int(request.args.get('limit', 30))
        logs = user_db.get_weight_logs(int(user_id), limit)
        return jsonify({"success": True, "logs": logs})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/log-water', methods=['POST'])
def log_water():
    """Log water intake"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        data = request.json
        result = user_db.log_water(int(user_id), data.get('amount_ml', 250))
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/delete-food-log', methods=['POST'])
def delete_food_log():
    """Delete a food log entry"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        data = request.json
        success = user_db.delete_food_log(int(user_id), data.get('log_id'))
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/loseit/weekly-summary', methods=['GET'])
def get_weekly_summary():
    """Get weekly calorie summary with deficit"""
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    
    try:
        # Get start date (default: 7 days ago)
        start_date_str = request.args.get('start_date')
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str).date()
        else:
            start_date = date.today() - timedelta(days=6)  # Last 7 days (including today)
        
        # Get profile for goals
        profile = user_db.get_user_profile(int(user_id))
        calorie_goal = profile.get('daily_calorie_goal', 2000) if profile else 2000
        
        # Get summaries for each day
        days_data = []
        total_calories = 0
        total_deficit = 0
        
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.isoformat()
            
            day_summary = user_db.get_daily_summary(int(user_id), date_str)
            day_calories = day_summary.get('calories', 0)
            day_deficit = calorie_goal - day_calories
            
            days_data.append({
                'date': date_str,
                'day_name': current_date.strftime('%A'),
                'day_short': current_date.strftime('%a'),
                'calories': day_calories,
                'goal': calorie_goal,
                'deficit': day_deficit,
                'protein_g': day_summary.get('protein_g', 0),
                'carbs_g': day_summary.get('carbs_g', 0),
                'fats_g': day_summary.get('fats_g', 0)
            })
            
            total_calories += day_calories
            total_deficit += day_deficit
        
        return jsonify({
            "success": True,
            "weekly": {
                "start_date": start_date.isoformat(),
                "end_date": (start_date + timedelta(days=6)).isoformat(),
                "total_calories": total_calories,
                "total_deficit": total_deficit,
                "average_daily_calories": round(total_calories / 7, 0),
                "average_daily_deficit": round(total_deficit / 7, 0),
                "calorie_goal": calorie_goal,
                "days": days_data
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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

