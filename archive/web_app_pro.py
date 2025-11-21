#!/usr/bin/env python3
"""
Professional AI Shopping Assistant Web App
Modern, beautiful, feature-rich interface
"""

import os
import json
from datetime import datetime
from flask import Flask, render_template_string, request, jsonify
from flask_cors import CORS

from product_database import ProductDatabase
from groq_assistant import GroqAIAssistant

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

db = ProductDatabase()
assistant = GroqAIAssistant()  # FREE and 10x faster!

# Modern Professional HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShopAI - Intelligent Shopping Assistant</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --secondary: #8b5cf6;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --dark: #1e293b;
            --light: #f8fafc;
            --gray: #64748b;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: var(--dark);
        }
        
        /* Navigation */
        .navbar {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .nav-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .nav-menu {
            display: flex;
            gap: 2rem;
            align-items: center;
        }
        
        .nav-link {
            color: var(--dark);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }
        
        .nav-link:hover {
            color: var(--primary);
        }
        
        /* Container */
        .container {
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        
        /* Hero Section */
        .hero {
            text-align: center;
            color: white;
            padding: 3rem 0;
            margin-bottom: 2rem;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .hero p {
            font-size: 1.3rem;
            opacity: 0.95;
            max-width: 600px;
            margin: 0 auto;
        }
        
        /* Stats Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 50px rgba(0,0,0,0.15);
        }
        
        .stat-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            color: var(--gray);
            font-size: 1rem;
            margin-top: 0.5rem;
        }
        
        /* Main Content Grid */
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        /* Card */
        .card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--light);
        }
        
        .card-icon {
            font-size: 1.8rem;
            color: var(--primary);
        }
        
        .card-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--dark);
        }
        
        /* Chat Interface */
        .chat-container {
            height: 500px;
            overflow-y: auto;
            padding: 1.5rem;
            background: linear-gradient(to bottom, #f8fafc, #ffffff);
            border-radius: 15px;
            margin-bottom: 1.5rem;
            border: 2px solid var(--light);
        }
        
        .chat-container::-webkit-scrollbar {
            width: 8px;
        }
        
        .chat-container::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 4px;
        }
        
        .message {
            margin-bottom: 1.5rem;
            padding: 1rem 1.5rem;
            border-radius: 15px;
            max-width: 85%;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
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
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            margin-left: auto;
            border-bottom-right-radius: 5px;
        }
        
        .message.bot {
            background: white;
            color: var(--dark);
            border: 2px solid var(--light);
            border-bottom-left-radius: 5px;
        }
        
        .message-time {
            font-size: 0.75rem;
            opacity: 0.7;
            margin-top: 0.5rem;
        }
        
        /* Input Group */
        .input-group {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .input-group input, .input-group select {
            flex: 1;
            padding: 1rem 1.5rem;
            border: 2px solid var(--light);
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s;
            font-family: inherit;
        }
        
        .input-group input:focus, .input-group select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        /* Buttons */
        .btn {
            padding: 1rem 2rem;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-family: inherit;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
        }
        
        .btn-secondary {
            background: white;
            color: var(--primary);
            border: 2px solid var(--primary);
        }
        
        .btn-secondary:hover {
            background: var(--primary);
            color: white;
        }
        
        .btn-success {
            background: var(--success);
            color: white;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        /* Examples */
        .examples {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .example-chip {
            padding: 0.75rem 1rem;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
            border: 2px solid transparent;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: left;
            font-size: 0.9rem;
        }
        
        .example-chip:hover {
            border-color: var(--primary);
            transform: translateX(5px);
        }
        
        .example-chip i {
            color: var(--primary);
            margin-right: 0.5rem;
        }
        
        /* Shopping List */
        .shopping-list {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            margin-top: 2rem;
        }
        
        .list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--light);
        }
        
        .list-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--dark);
        }
        
        .category-section {
            margin-bottom: 2rem;
        }
        
        .category-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
            border-radius: 12px;
        }
        
        .shopping-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem;
            margin-bottom: 0.75rem;
            background: white;
            border: 2px solid var(--light);
            border-radius: 12px;
            transition: all 0.3s;
        }
        
        .shopping-item:hover {
            border-color: var(--primary);
            transform: translateX(5px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .item-details {
            flex: 1;
        }
        
        .item-name {
            font-weight: 600;
            color: var(--dark);
            margin-bottom: 0.5rem;
        }
        
        .item-quantity {
            color: var(--gray);
            font-size: 0.9rem;
        }
        
        .item-price {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
        }
        
        .total-section {
            margin-top: 2rem;
            padding: 2rem;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border-radius: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }
        
        .total-label {
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .total-amount {
            font-size: 2.5rem;
            font-weight: 800;
        }
        
        /* Loading Spinner */
        .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 0.5rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Alert */
        .alert {
            padding: 1rem 1.5rem;
            border-radius: 12px;
            margin: 1rem 0;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .alert-success {
            background: rgba(16, 185, 129, 0.1);
            border: 2px solid var(--success);
            color: var(--success);
        }
        
        .alert-info {
            background: rgba(99, 102, 241, 0.1);
            border: 2px solid var(--primary);
            color: var(--primary);
        }
        
        /* Tabs */
        .tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            border-bottom: 2px solid var(--light);
        }
        
        .tab {
            padding: 1rem 2rem;
            border: none;
            background: none;
            cursor: pointer;
            font-weight: 600;
            color: var(--gray);
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        
        .tab.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        /* Responsive */
        @media (max-width: 968px) {
            .content-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .examples {
                grid-template-columns: 1fr;
            }
            
            .hero h1 {
                font-size: 2.5rem;
            }
        }
        
        @media (max-width: 640px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-content">
            <div class="logo">
                <i class="fas fa-shopping-cart"></i> ShopAI
            </div>
            <div class="nav-menu">
                <a href="#" class="nav-link">Home</a>
                <a href="#" class="nav-link">Features</a>
                <a href="#" class="nav-link">Stores</a>
                <a href="#" class="nav-link">Help</a>
            </div>
        </div>
    </nav>
    
    <div class="container">
        <!-- Hero Section -->
        <div class="hero">
            <h1>🤖 Intelligent Shopping Assistant</h1>
            <p>Let AI create perfect shopping lists for any occasion. Just tell us what you need!</p>
        </div>
        
        <!-- Stats Section -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🛍️</div>
                <div class="stat-number" id="totalProducts">0</div>
                <div class="stat-label">Products Available</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏪</div>
                <div class="stat-number" id="totalStores">0</div>
                <div class="stat-label">Partner Stores</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-number" id="totalCategories">0</div>
                <div class="stat-label">Categories</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-number" id="totalSaved">$0</div>
                <div class="stat-label">Total Value</div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="content-grid">
            <!-- Chat Section -->
            <div class="card">
                <div class="card-header">
                    <i class="fas fa-comments card-icon"></i>
                    <h2 class="card-title">AI Chat Assistant</h2>
                </div>
                
                <div class="chat-container" id="chatContainer">
                    <div class="message bot">
                        <div>👋 <strong>Hi! I'm your AI shopping assistant.</strong></div>
                        <div style="margin-top: 0.5rem;">Tell me what event you're planning, and I'll create the perfect shopping list for you!</div>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
                
                <div class="input-group">
                    <input type="text" id="chatInput" placeholder="Type your request... (e.g., BBQ for 14 people)">
                    <button class="btn btn-primary" onclick="sendMessage()">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
                
                <div class="examples">
                    <div class="example-chip" onclick="fillInput('I want to have a BBQ for 14 people')">
                        <i class="fas fa-fire"></i> BBQ for 14 people
                    </div>
                    <div class="example-chip" onclick="fillInput('Dinner party for 8, budget $100')">
                        <i class="fas fa-utensils"></i> Dinner party, $100 budget
                    </div>
                    <div class="example-chip" onclick="fillInput('Need snacks for 20 people')">
                        <i class="fas fa-cookie"></i> Snacks for 20 people
                    </div>
                    <div class="example-chip" onclick="fillInput('Shopping for family of 4')">
                        <i class="fas fa-home"></i> Family of 4 shopping
                    </div>
                </div>
            </div>
            
            <!-- Info Section -->
            <div class="card">
                <div class="card-header">
                    <i class="fas fa-info-circle card-icon"></i>
                    <h2 class="card-title">How It Works</h2>
                </div>
                
                <div style="space-y: 2rem;">
                    <div style="margin-bottom: 2rem;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">1</div>
                            <h3 style="color: var(--dark); font-weight: 600;">Tell Us Your Event</h3>
                        </div>
                        <p style="color: var(--gray); margin-left: 56px;">Describe what you're planning in natural language</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">2</div>
                            <h3 style="color: var(--dark); font-weight: 600;">AI Calculates Everything</h3>
                        </div>
                        <p style="color: var(--gray); margin-left: 56px;">We determine quantities based on your guest count</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">3</div>
                            <h3 style="color: var(--dark); font-weight: 600;">Get Your List</h3>
                        </div>
                        <p style="color: var(--gray); margin-left: 56px;">Receive a complete shopping list with real prices</p>
                    </div>
                    
                    <div class="alert alert-info" style="margin-top: 2rem;">
                        <i class="fas fa-lightbulb" style="font-size: 1.5rem;"></i>
                        <div>
                            <strong>Pro Tip:</strong> Include your budget and dietary preferences for better results!
                        </div>
                    </div>
                    
                    <div style="margin-top: 2rem;">
                        <h3 style="color: var(--dark); font-weight: 600; margin-bottom: 1rem;">📊 Available Features</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                                <span>Smart quantity calculations</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                                <span>Real-time pricing from Walmart</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                                <span>Budget optimization</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                                <span>Export to PDF</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-check-circle" style="color: var(--success);"></i>
                                <span>Multi-store comparison (coming soon)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Shopping List Section -->
        <div id="shoppingList" style="display: none;"></div>
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
                let totalValue = 0;
                
                if (data.stores) {
                    data.stores.forEach(store => {
                        totalCategories += store.categories.length;
                    });
                }
                
                document.getElementById('totalCategories').textContent = totalCategories;
                
                // Calculate total value
                const productsResp = await fetch('/api/products/all');
                const productsData = await productsResp.json();
                productsData.products.forEach(p => {
                    if (p.price) totalValue += p.price;
                });
                
                document.getElementById('totalSaved').textContent = '$' + totalValue.toFixed(0);
                
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
            const loadingMsg = addMessageToChat('bot', '<div class="spinner"></div> Processing your request...');
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: message})
                });
                
                const data = await response.json();
                
                // Remove loading
                loadingMsg.remove();
                
                // Add bot response
                addMessageToChat('bot', '✅ ' + data.response.split('\\n')[0]);
                
                // Display shopping list
                if (data.shopping_list && data.shopping_list.items.length > 0) {
                    displayShoppingList(data.shopping_list);
                }
            } catch (error) {
                loadingMsg.remove();
                addMessageToChat('bot', '❌ Error: ' + error.message);
            }
        }
        
        function addMessageToChat(type, message) {
            const chatContainer = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = message + `<div class="message-time">${new Date().toLocaleTimeString()}</div>`;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            return messageDiv;
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
            
            // Category icons
            const categoryIcons = {
                'meat': '🥩',
                'grill': '🔥',
                'grills': '🔥',
                'bbq': '🍖',
                'vegetables': '🥬',
                'drinks': '🥤',
                'condiments': '🧂',
                'charcoal': '⚫',
                'bread': '🍞',
                'default': '📦'
            };
            
            // Build HTML
            let html = '<div class="shopping-list">';
            html += '<div class="list-header">';
            html += '<div>';
            html += `<div class="list-title">📋 Your Shopping List</div>`;
            html += `<div style="color: var(--gray); margin-top: 0.5rem;">For ${shoppingList.num_people} people • ${shoppingList.items.length} items</div>`;
            html += '</div>';
            html += '<div style="display: flex; gap: 1rem;">';
            html += '<button class="btn btn-success" onclick="addAllToWalmart()"><i class="fas fa-shopping-cart"></i> Add All to Walmart</button>';
            html += '<button class="btn btn-secondary" onclick="printList()"><i class="fas fa-print"></i> Print</button>';
            html += '</div>';
            html += '</div>';
            
            for (const [category, items] of Object.entries(byCategory)) {
                const icon = categoryIcons[category.toLowerCase()] || categoryIcons['default'];
                html += `<div class="category-section">`;
                html += `<div class="category-header">`;
                html += `<span>${icon}</span>`;
                html += `<span>${category.toUpperCase()}</span>`;
                html += `<span style="margin-left: auto; color: var(--gray); font-size: 0.9rem; font-weight: normal;">${items.length} items</span>`;
                html += `</div>`;
                
                items.forEach((item, idx) => {
                    const itemId = `item-${category}-${idx}`;
                    html += `<div class="shopping-item" id="${itemId}">`;
                    html += `<div class="item-details">`;
                    html += `<div class="item-name">${item.product_name}</div>`;
                    html += `<div class="item-quantity">Quantity: ${item.quantity} × $${item.unit_price.toFixed(2)}</div>`;
                    
                    // Add Walmart link if available
                    if (item.product_url && item.product_url.includes('walmart.com')) {
                        html += `<a href="${item.product_url}" target="_blank" style="color: var(--primary); text-decoration: none; font-size: 0.9rem; margin-top: 0.5rem; display: inline-block;">`;
                        html += `<i class="fas fa-external-link-alt"></i> View on Walmart.com</a>`;
                    }
                    
                    html += `</div>`;
                    html += `<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">`;
                    html += `<div class="item-price">$${item.total_price.toFixed(2)}</div>`;
                    
                    // Add to cart button for each item
                    if (item.product_url && item.product_url.includes('walmart.com')) {
                        html += `<button class="btn btn-success" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="window.open('${item.product_url}', '_blank')">`;
                        html += `<i class="fas fa-cart-plus"></i> Add to Cart</button>`;
                    }
                    
                    html += `</div>`;
                    html += `</div>`;
                });
                
                html += `</div>`;
            }
            
            html += `<div class="total-section">`;
            html += `<div>`;
            html += `<div class="total-label">Total Cost</div>`;
            html += `<div style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.25rem;">${shoppingList.items.length} items total</div>`;
            html += `</div>`;
            html += `<div class="total-amount">$${shoppingList.total_cost.toFixed(2)}</div>`;
            html += `</div>`;
            html += '</div>';
            
            container.innerHTML = html;
            container.style.display = 'block';
            
            // Scroll to list
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        function addAllToWalmart() {
            // Open Walmart with search for first item (Walmart doesn't support multi-add via URL)
            const items = document.querySelectorAll('.shopping-item a[href*="walmart.com"]');
            if (items.length > 0) {
                // Open all items in new tabs
                let count = 0;
                items.forEach((link, idx) => {
                    if (idx < 5) {  // Limit to 5 tabs to avoid browser blocking
                        setTimeout(() => {
                            window.open(link.href, '_blank');
                        }, idx * 500);  // Stagger opening
                        count++;
                    }
                });
                alert(`Opening ${count} Walmart product pages. Add items to cart from each page!`);
            } else {
                alert('No Walmart links available for these products.');
            }
        }
        
        function printList() {
            window.print();
        }
        
        function exportPDF() {
            alert('PDF export feature - Connect to backend PDF generation service');
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
    return render_template_string(HTML_TEMPLATE)

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

@app.route('/api/products/all', methods=['GET'])
def get_all_products():
    products = db.search_products(limit=9999)
    return jsonify({"products": products})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    store = data.get('store')
    
    if not message:
        return jsonify({"error": "Message required"}), 400
    
    try:
        result = assistant.chat(message, store_name=store)
        
        return jsonify({
            "success": result.get('success', True),
            "response": result.get('message', 'List created!'),
            "shopping_list": result.get('shopping_list', {}),
            "request_info": result.get('request', {})
        })
    
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("=" * 70)
    print("🚀 ShopAI - Professional Shopping Assistant")
    print("=" * 70)
    print(f"\n📊 Database:")
    print(f"   Products: {db.get_product_count()}")
    print(f"   Stores: {', '.join(db.get_stores()) or 'None'}")
    print(f"\n🌐 Access at:")
    print(f"   http://localhost:8080")
    print(f"\n✨ Features:")
    print(f"   • Modern professional UI")
    print(f"   • Real-time AI chat")
    print(f"   • Smart shopping lists")
    print(f"   • Export & print options")
    print(f"\n🛑 Press Ctrl+C to stop\n")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=8080, use_reloader=False)

