#!/usr/bin/env python3
"""
Simple Web Interface for Shopping Assistant (without scraper dependency)
"""

import os
import json
from datetime import datetime
from flask import Flask, render_template_string, request, jsonify
from flask_cors import CORS

from product_database import ProductDatabase
from shopping_assistant import ShoppingAssistant
from simple_scraper import SimpleStoreScraper


app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# Initialize components
db = ProductDatabase()
assistant = ShoppingAssistant()


# HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛒 AI Shopping Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card .number {
            font-size: 3em;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-card .label {
            color: #666;
            margin-top: 10px;
            font-size: 1.1em;
        }
        
        .main-content {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        .card h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 2em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .chat-container {
            height: 500px;
            overflow-y: auto;
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            background: linear-gradient(to bottom, #f9f9f9, #ffffff);
        }
        
        .message {
            margin-bottom: 20px;
            padding: 15px 20px;
            border-radius: 15px;
            max-width: 80%;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message.user {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin-left: auto;
            border-bottom-right-radius: 5px;
        }
        
        .message.bot {
            background: white;
            color: #333;
            border: 2px solid #e0e0e0;
            border-bottom-left-radius: 5px;
        }
        
        .input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .input-group input {
            flex: 1;
            padding: 15px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 25px;
            font-size: 16px;
            transition: all 0.3s;
        }
        
        .input-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .shopping-list {
            margin-top: 20px;
            padding: 25px;
            background: linear-gradient(to bottom, #f9f9f9, #ffffff);
            border-radius: 15px;
            border: 2px solid #e0e0e0;
        }
        
        .shopping-list h3 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .category-section {
            margin-bottom: 25px;
        }
        
        .category-title {
            font-size: 1.3em;
            color: #764ba2;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .shopping-item {
            display: flex;
            justify-content: space-between;
            padding: 15px;
            margin-bottom: 10px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            transition: all 0.3s;
        }
        
        .shopping-item:hover {
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            transform: translateX(5px);
        }
        
        .item-details {
            flex: 1;
        }
        
        .item-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        
        .item-quantity {
            color: #666;
            font-size: 0.9em;
        }
        
        .item-price {
            text-align: right;
            font-weight: bold;
            color: #667eea;
            font-size: 1.2em;
        }
        
        .total {
            margin-top: 25px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            text-align: right;
            font-size: 1.8em;
            font-weight: bold;
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .examples {
            margin-top: 20px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        
        .examples h4 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .examples ul {
            list-style: none;
            padding-left: 0;
        }
        
        .examples li {
            padding: 8px 0;
            color: #666;
            cursor: pointer;
            transition: color 0.3s;
        }
        
        .examples li:hover {
            color: #667eea;
        }
        
        .examples li:before {
            content: "💬 ";
        }
        
        @media (max-width: 768px) {
            .stats {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 AI Shopping Assistant</h1>
            <p>Chat naturally, get smart shopping lists instantly!</p>
        </div>
        
        <div class="stats" id="stats">
            <div class="stat-card">
                <div class="number" id="totalProducts">0</div>
                <div class="label">Products Available</div>
            </div>
            <div class="stat-card">
                <div class="number" id="totalStores">0</div>
                <div class="label">Stores</div>
            </div>
            <div class="stat-card">
                <div class="number" id="totalCategories">0</div>
                <div class="label">Categories</div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="card">
                <h2>🤖 Chat with AI Assistant</h2>
                <div class="chat-container" id="chatContainer">
                    <div class="message bot">
                        👋 Hi! I'm your AI shopping assistant. Tell me what you need!
                        <br><br>
                        Try: "I want to have a BBQ for 14 people"
                    </div>
                </div>
                <div class="input-group">
                    <input type="text" id="chatInput" placeholder="Type your request here... (e.g., BBQ for 14 people)">
                    <button class="btn" onclick="sendMessage()">Send</button>
                </div>
                
                <div class="examples">
                    <h4>💡 Try these examples:</h4>
                    <ul>
                        <li onclick="fillInput('I want to have a BBQ for 14 people')">I want to have a BBQ for 14 people</li>
                        <li onclick="fillInput('Dinner party for 8, budget $100')">Dinner party for 8, budget $100</li>
                        <li onclick="fillInput('Need snacks for 20 people')">Need snacks for 20 people</li>
                        <li onclick="fillInput('Shopping for family of 4')">Shopping for family of 4</li>
                    </ul>
                </div>
                
                <div id="shoppingList"></div>
            </div>
        </div>
    </div>
    
    <script>
        // Load stats on page load
        window.onload = function() {
            loadStats();
        };
        
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                document.getElementById('totalProducts').textContent = data.total_products;
                document.getElementById('totalStores').textContent = data.total_stores;
                
                let totalCategories = 0;
                if (data.stores) {
                    data.stores.forEach(store => {
                        totalCategories += store.categories.length;
                    });
                }
                document.getElementById('totalCategories').textContent = totalCategories;
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
        
        function fillInput(text) {
            document.getElementById('chatInput').value = text;
            document.getElementById('chatInput').focus();
        }
        
        async function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            addMessageToChat('user', message);
            input.value = '';
            
            // Show loading
            addMessageToChat('bot', '🤖 Thinking...');
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: message})
                });
                
                const data = await response.json();
                
                // Remove loading message
                const chatContainer = document.getElementById('chatContainer');
                chatContainer.removeChild(chatContainer.lastChild);
                
                // Add bot response
                addMessageToChat('bot', data.response);
                
                // Display shopping list
                if (data.shopping_list && data.shopping_list.items.length > 0) {
                    displayShoppingList(data.shopping_list);
                }
            } catch (error) {
                const chatContainer = document.getElementById('chatContainer');
                chatContainer.removeChild(chatContainer.lastChild);
                addMessageToChat('bot', '❌ Error: ' + error.message);
            }
        }
        
        function addMessageToChat(type, message) {
            const chatContainer = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = message.replace(/\\n/g, '<br>');
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function displayShoppingList(shoppingList) {
            const container = document.getElementById('shoppingList');
            
            // Group by category
            const byCategory = {};
            shoppingList.items.forEach(item => {
                if (!byCategory[item.category]) {
                    byCategory[item.category] = [];
                }
                byCategory[item.category].push(item);
            });
            
            // Build HTML
            let html = '<div class="shopping-list">';
            html += '<h3>📋 Your Shopping List</h3>';
            
            for (const [category, items] of Object.entries(byCategory)) {
                html += `<div class="category-section">`;
                html += `<div class="category-title">${category.toUpperCase()}</div>`;
                
                items.forEach(item => {
                    html += `<div class="shopping-item">`;
                    html += `<div class="item-details">`;
                    html += `<div class="item-name">${item.product_name}</div>`;
                    html += `<div class="item-quantity">Qty: ${item.quantity} × $${item.unit_price.toFixed(2)}</div>`;
                    html += `</div>`;
                    html += `<div class="item-price">$${item.total_price.toFixed(2)}</div>`;
                    html += `</div>`;
                });
                
                html += `</div>`;
            }
            
            html += `<div class="total">Total: $${shoppingList.total_cost.toFixed(2)}</div>`;
            html += '</div>';
            
            container.innerHTML = html;
        }
        
        // Allow Enter key
        document.getElementById('chatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
"""


@app.route('/')
def index():
    """Main page"""
    return render_template_string(HTML_TEMPLATE)


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
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


@app.route('/api/scrape', methods=['POST'])
def scrape_store():
    """Scrape products from a store"""
    data = request.json
    store_url = data.get('store_url', 'https://www.walmart.com')
    search_term = data.get('search_term', 'bbq')
    
    try:
        scraper = SimpleStoreScraper(store_url)
        products = scraper.scrape_search_results(search_term, max_products=20)
        
        # Save to database
        saved_count = 0
        for product in products:
            if db.add_product(product):
                saved_count += 1
        
        return jsonify({
            "success": True,
            "store_name": scraper.store_name,
            "products_found": len(products),
            "products_saved": saved_count,
            "message": f"Scraped {saved_count} products from {scraper.store_name}"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat with AI assistant"""
    data = request.json
    message = data.get('message')
    
    if not message:
        return jsonify({"error": "Message required"}), 400
    
    try:
        # Get response from assistant
        response = assistant.chat(message)
        
        # Parse the request for shopping list
        request_obj = assistant.parse_request(message)
        shopping_list = assistant.build_shopping_list(request_obj)
        
        return jsonify({
            "response": response,
            "shopping_list": shopping_list
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 70)
    print("🚀 AI Shopping Assistant - Starting...")
    print("=" * 70)
    print(f"\n📊 Database Stats:")
    print(f"   Products: {db.get_product_count()}")
    print(f"   Stores: {len(db.get_stores())}")
    print(f"\n🌐 Open in your browser:")
    print(f"   http://localhost:8080")
    print(f"\n💡 Tip: Run demo_simple.py first to add sample products")
    print(f"\n🛑 Press Ctrl+C to stop\n")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=8080, use_reloader=False)

