#!/usr/bin/env python3
"""
Web Interface for Shopping Assistant
Flask app with web scraping and AI chatbot
"""

import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS

from store_scraper import create_scraper
from product_database import ProductDatabase
from shopping_assistant import ShoppingAssistant


app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# Initialize components
db = ProductDatabase()
assistant = ShoppingAssistant()


@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')


@app.route('/api/stores', methods=['GET'])
def get_stores():
    """Get list of available stores"""
    stores = db.get_stores()
    return jsonify({"stores": stores})


@app.route('/api/scrape', methods=['POST'])
def scrape_store():
    """Scrape a new store"""
    data = request.json
    store_url = data.get('store_url')
    store_name = data.get('store_name')
    
    if not store_url:
        return jsonify({"error": "Store URL required"}), 400
    
    try:
        # Create scraper
        scraper = create_scraper(store_url, store_name)
        
        # Scrape products
        products = scraper.scrape_all()
        
        # Save to database
        count = 0
        for product in products:
            product_dict = product.__dict__ if hasattr(product, '__dict__') else product
            if db.add_product(product_dict):
                count += 1
        
        return jsonify({
            "success": True,
            "store_name": scraper.store_name,
            "products_scraped": len(products),
            "products_saved": count
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/products/search', methods=['GET'])
def search_products():
    """Search products"""
    query = request.args.get('q')
    store = request.args.get('store')
    category = request.args.get('category')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    limit = request.args.get('limit', default=50, type=int)
    
    products = db.search_products(
        query=query,
        store_name=store,
        category=category,
        min_price=min_price,
        max_price=max_price,
        limit=limit
    )
    
    return jsonify({"products": products, "count": len(products)})


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get categories"""
    store = request.args.get('store')
    categories = db.get_categories(store_name=store)
    return jsonify({"categories": categories})


@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat with AI assistant"""
    data = request.json
    message = data.get('message')
    store = data.get('store')
    
    if not message:
        return jsonify({"error": "Message required"}), 400
    
    try:
        # Get response from assistant
        response = assistant.chat(message, store_name=store)
        
        # Parse the request for shopping list
        request_obj = assistant.parse_request(message)
        shopping_list = assistant.build_shopping_list(request_obj, store_name=store)
        
        return jsonify({
            "response": response,
            "shopping_list": shopping_list
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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


# HTML Templates (if templates folder doesn't exist)
if not os.path.exists('templates'):
    os.makedirs('templates')

INDEX_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Shopping Assistant</title>
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
            max-width: 1200px;
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
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .card h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            width: 100%;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .chat-container {
            height: 400px;
            overflow-y: auto;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: #f9f9f9;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px 15px;
            border-radius: 8px;
            max-width: 80%;
        }
        
        .message.user {
            background: #667eea;
            color: white;
            margin-left: auto;
        }
        
        .message.bot {
            background: white;
            color: #333;
            border: 1px solid #e0e0e0;
        }
        
        .shopping-list {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .shopping-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .shopping-item:last-child {
            border-bottom: none;
        }
        
        .total {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
            margin-top: 15px;
            text-align: right;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #667eea;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .stat-card .number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-card .label {
            color: #666;
            margin-top: 5px;
        }
        
        @media (max-width: 768px) {
            .main-grid {
                grid-template-columns: 1fr;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 AI Shopping Assistant</h1>
            <p>Scrape any store, chat with AI, get instant shopping lists</p>
        </div>
        
        <div class="stats" id="stats">
            <div class="stat-card">
                <div class="number" id="totalProducts">0</div>
                <div class="label">Total Products</div>
            </div>
            <div class="stat-card">
                <div class="number" id="totalStores">0</div>
                <div class="label">Stores Scraped</div>
            </div>
            <div class="stat-card">
                <div class="number" id="totalCategories">0</div>
                <div class="label">Categories</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="card">
                <h2>🕷️ Scrape New Store</h2>
                <div class="form-group">
                    <label for="storeUrl">Store URL</label>
                    <input type="url" id="storeUrl" placeholder="https://www.walmart.com">
                </div>
                <div class="form-group">
                    <label for="storeName">Store Name (Optional)</label>
                    <input type="text" id="storeName" placeholder="Walmart">
                </div>
                <button class="btn" onclick="scrapeStore()">Start Scraping</button>
                <div id="scrapeStatus"></div>
            </div>
            
            <div class="card">
                <h2>🤖 AI Chat Assistant</h2>
                <div class="form-group">
                    <label for="storeSelect">Select Store</label>
                    <select id="storeSelect">
                        <option value="">All Stores</option>
                    </select>
                </div>
                <div class="chat-container" id="chatContainer"></div>
                <div class="form-group">
                    <input type="text" id="chatInput" placeholder="I want to have a BBQ for 14 people...">
                </div>
                <button class="btn" onclick="sendMessage()">Send Message</button>
            </div>
        </div>
        
        <div class="shopping-list" id="shoppingList" style="display: none;">
            <h2>📋 Shopping List</h2>
            <div id="shoppingItems"></div>
        </div>
    </div>
    
    <script>
        let currentShoppingList = null;
        
        // Load stats and stores on page load
        window.onload = function() {
            loadStats();
            loadStores();
        };
        
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                document.getElementById('totalProducts').textContent = data.total_products;
                document.getElementById('totalStores').textContent = data.total_stores;
                
                let totalCategories = 0;
                data.stores.forEach(store => {
                    totalCategories += store.categories.length;
                });
                document.getElementById('totalCategories').textContent = totalCategories;
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
        
        async function loadStores() {
            try {
                const response = await fetch('/api/stores');
                const data = await response.json();
                
                const select = document.getElementById('storeSelect');
                select.innerHTML = '<option value="">All Stores</option>';
                
                data.stores.forEach(store => {
                    const option = document.createElement('option');
                    option.value = store;
                    option.textContent = store;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading stores:', error);
            }
        }
        
        async function scrapeStore() {
            const url = document.getElementById('storeUrl').value;
            const name = document.getElementById('storeName').value;
            const status = document.getElementById('scrapeStatus');
            
            if (!url) {
                alert('Please enter a store URL');
                return;
            }
            
            status.innerHTML = '<div class="loading">🔄 Scraping... This may take a few minutes...</div>';
            
            try {
                const response = await fetch('/api/scrape', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({store_url: url, store_name: name})
                });
                
                const data = await response.json();
                
                if (data.success) {
                    status.innerHTML = `<div style="color: green; margin-top: 10px;">
                        ✅ Successfully scraped ${data.products_saved} products from ${data.store_name}
                    </div>`;
                    loadStats();
                    loadStores();
                } else {
                    status.innerHTML = `<div style="color: red; margin-top: 10px;">
                        ❌ Error: ${data.error}
                    </div>`;
                }
            } catch (error) {
                status.innerHTML = `<div style="color: red; margin-top: 10px;">
                    ❌ Error: ${error.message}
                </div>`;
            }
        }
        
        async function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            const store = document.getElementById('storeSelect').value;
            
            if (!message) return;
            
            // Add user message to chat
            addMessageToChat('user', message);
            input.value = '';
            
            // Show loading
            addMessageToChat('bot', '🤖 Thinking...');
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: message, store: store})
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
                addMessageToChat('bot', '❌ Error: ' + error.message);
            }
        }
        
        function addMessageToChat(type, message) {
            const chatContainer = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = message;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function displayShoppingList(shoppingList) {
            currentShoppingList = shoppingList;
            const container = document.getElementById('shoppingList');
            const itemsDiv = document.getElementById('shoppingItems');
            
            itemsDiv.innerHTML = '';
            
            // Group by category
            const byCategory = {};
            shoppingList.items.forEach(item => {
                if (!byCategory[item.category]) {
                    byCategory[item.category] = [];
                }
                byCategory[item.category].push(item);
            });
            
            // Display items
            for (const [category, items] of Object.entries(byCategory)) {
                const categoryDiv = document.createElement('div');
                categoryDiv.innerHTML = `<h3 style="margin-top: 15px; color: #667eea;">${category.toUpperCase()}</h3>`;
                itemsDiv.appendChild(categoryDiv);
                
                items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'shopping-item';
                    itemDiv.innerHTML = `
                        <div>
                            <strong>${item.product_name}</strong><br>
                            <small>Qty: ${item.quantity} × $${item.unit_price.toFixed(2)}</small>
                        </div>
                        <div style="text-align: right;">
                            <strong>$${item.total_price.toFixed(2)}</strong>
                        </div>
                    `;
                    itemsDiv.appendChild(itemDiv);
                });
            }
            
            // Add total
            const totalDiv = document.createElement('div');
            totalDiv.className = 'total';
            totalDiv.textContent = `Total: $${shoppingList.total_cost.toFixed(2)}`;
            itemsDiv.appendChild(totalDiv);
            
            container.style.display = 'block';
        }
        
        // Allow Enter key to send message
        document.getElementById('chatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
"""

# Save index.html template
with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(INDEX_HTML)


if __name__ == "__main__":
    print("🚀 Starting AI Shopping Assistant Web App...")
    print("📍 Open http://localhost:5000 in your browser\n")
    app.run(debug=True, host='0.0.0.0', port=5000)

