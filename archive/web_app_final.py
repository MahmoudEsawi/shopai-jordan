#!/usr/bin/env python3
"""
ShopAI - Professional Shopping Assistant for Jordan
Modern dashboard with Talabat integration
"""

import os
import json
from flask import Flask, render_template_string, request, jsonify
from flask_cors import CORS

from product_database import ProductDatabase
from groq_assistant import GroqAIAssistant

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

db = ProductDatabase()
assistant = GroqAIAssistant()

# Ultra-Modern Professional HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShopAI Jordan - AI Shopping Assistant</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --secondary: #8b5cf6;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --info: #3b82f6;
            --dark: #1e293b;
            --light: #f1f5f9;
            --white: #ffffff;
            --jordan-green: #00843d;
            --jordan-red: #ce1126;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: var(--dark);
        }
        
        /* Modern Navigation */
        .navbar {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            position: sticky;
            top: 0;
            z-index: 1000;
            border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }
        
        .nav-content {
            max-width: 1600px;
            margin: 0 auto;
            padding: 1.2rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.6rem;
            font-weight: 800;
        }
        
        .logo-icon {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.4rem;
        }
        
        .logo-text {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .jordan-flag {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, rgba(0, 132, 61, 0.1), rgba(206, 17, 38, 0.1));
            border-radius: 20px;
            font-weight: 600;
            color: var(--dark);
        }
        
        /* Container */
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        /* Hero Section */
        .hero {
            text-align: center;
            color: white;
            padding: 3rem 0 2rem;
        }
        
        .hero h1 {
            font-size: 4rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            line-height: 1.2;
        }
        
        .hero-subtitle {
            font-size: 1.4rem;
            opacity: 0.95;
            margin-bottom: 0.5rem;
        }
        
        .hero-tagline {
            font-size: 1.1rem;
            opacity: 0.85;
        }
        
        /* Dashboard Stats */
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }
        
        .stat-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.12);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
        }
        
        .stat-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.18);
        }
        
        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .stat-icon {
            width: 60px;
            height: 60px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            color: white;
        }
        
        .stat-icon.products {
            background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .stat-icon.stores {
            background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .stat-icon.categories {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        
        .stat-icon.value {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: 800;
            color: var(--dark);
            line-height: 1;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: var(--gray);
            font-size: 1rem;
            font-weight: 500;
        }
        
        .stat-trend {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            font-size: 0.85rem;
            color: var(--success);
            margin-top: 0.5rem;
        }
        
        /* Main Grid */
        .main-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        /* Card */
        .card {
            background: white;
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.12);
            transition: all 0.3s;
        }
        
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid var(--light);
        }
        
        .card-title-group {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .card-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
        }
        
        .card-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--dark);
        }
        
        .badge {
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-success {
            background: rgba(16, 185, 129, 0.15);
            color: var(--success);
        }
        
        .badge-info {
            background: rgba(59, 130, 246, 0.15);
            color: var(--info);
        }
        
        /* Chat Interface */
        .chat-container {
            height: 550px;
            overflow-y: auto;
            padding: 1.5rem;
            background: linear-gradient(to bottom, #f8fafc, #ffffff);
            border-radius: 20px;
            margin-bottom: 1.5rem;
            border: 2px solid var(--light);
        }
        
        .chat-container::-webkit-scrollbar {
            width: 10px;
        }
        
        .chat-container::-webkit-scrollbar-track {
            background: var(--light);
            border-radius: 10px;
        }
        
        .chat-container::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 10px;
        }
        
        .message {
            margin-bottom: 1.5rem;
            padding: 1.25rem 1.75rem;
            border-radius: 18px;
            max-width: 85%;
            animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            line-height: 1.6;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(15px);
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
            border-bottom-right-radius: 6px;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        
        .message.bot {
            background: white;
            color: var(--dark);
            border: 2px solid var(--light);
            border-bottom-left-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .message-time {
            font-size: 0.7rem;
            opacity: 0.6;
            margin-top: 0.5rem;
            font-weight: 500;
        }
        
        /* Input Section */
        .input-section {
            background: var(--light);
            padding: 1.5rem;
            border-radius: 20px;
        }
        
        .input-group {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .input-group input {
            flex: 1;
            padding: 1.1rem 1.5rem;
            border: 2px solid transparent;
            background: white;
            border-radius: 15px;
            font-size: 1rem;
            transition: all 0.3s;
            font-family: 'Poppins', sans-serif;
        }
        
        .input-group input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        
        /* Buttons */
        .btn {
            padding: 1.1rem 2.5rem;
            border: none;
            border-radius: 15px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            font-family: 'Poppins', sans-serif;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }
        
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
        }
        
        .btn-success {
            background: linear-gradient(135deg, var(--success), #059669);
            color: white;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }
        
        .btn-success:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
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
        
        .btn-sm {
            padding: 0.6rem 1.2rem;
            font-size: 0.9rem;
        }
        
        /* Quick Actions */
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .quick-action {
            padding: 1rem;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
            border: 2px solid transparent;
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: left;
        }
        
        .quick-action:hover {
            border-color: var(--primary);
            transform: translateX(5px);
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
        }
        
        .quick-action i {
            color: var(--primary);
            margin-right: 0.5rem;
            font-size: 1.1rem;
        }
        
        .quick-action-text {
            font-size: 0.95rem;
            color: var(--dark);
            font-weight: 500;
        }
        
        /* Info Panel */
        .info-panel {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.08));
            border-left: 4px solid var(--success);
            padding: 1.5rem;
            border-radius: 15px;
            margin-bottom: 2rem;
        }
        
        .info-panel h4 {
            color: var(--success);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .feature-list {
            display: grid;
            gap: 0.75rem;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--dark);
        }
        
        .feature-item i {
            color: var(--success);
            font-size: 1.1rem;
        }
        
        /* Shopping List */
        .shopping-list {
            background: white;
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 15px 50px rgba(0,0,0,0.15);
            margin-top: 2rem;
            border: 2px solid rgba(99, 102, 241, 0.1);
        }
        
        .list-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 3px solid var(--light);
        }
        
        .list-title {
            font-size: 2rem;
            font-weight: 800;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .list-meta {
            color: var(--gray);
            margin-top: 0.5rem;
            font-size: 1rem;
        }
        
        .list-actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .category-section {
            margin-bottom: 2.5rem;
        }
        
        .category-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.2rem 1.5rem;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
            border-radius: 15px;
            margin-bottom: 1.2rem;
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--primary);
        }
        
        .category-icon {
            font-size: 1.8rem;
        }
        
        .category-count {
            margin-left: auto;
            background: white;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            color: var(--primary);
        }
        
        .shopping-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            margin-bottom: 1rem;
            background: white;
            border: 2px solid var(--light);
            border-radius: 15px;
            transition: all 0.3s;
        }
        
        .shopping-item:hover {
            border-color: var(--primary);
            transform: translateX(8px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        
        .item-main {
            flex: 1;
        }
        
        .item-name {
            font-weight: 600;
            color: var(--dark);
            margin-bottom: 0.5rem;
            font-size: 1.05rem;
        }
        
        .item-details {
            display: flex;
            gap: 1.5rem;
            color: var(--gray);
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
        }
        
        .item-link {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            color: var(--primary);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s;
        }
        
        .item-link:hover {
            gap: 0.7rem;
        }
        
        .item-actions {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.75rem;
        }
        
        .item-price {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--primary);
        }
        
        .currency {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--gray);
        }
        
        /* Total Section */
        .total-section {
            margin-top: 2.5rem;
            padding: 2.5rem;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border-radius: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }
        
        .total-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .total-label {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .total-items {
            font-size: 0.95rem;
            opacity: 0.85;
        }
        
        .total-amount {
            font-size: 3.5rem;
            font-weight: 900;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        /* Loading */
        .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 0.8s linear infinite;
            display: inline-block;
            margin-right: 0.5rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--gray);
        }
        
        .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.3;
        }
        
        /* Responsive */
        @media (max-width: 1200px) {
            .main-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5rem;
            }
            
            .dashboard {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .quick-actions {
                grid-template-columns: 1fr;
            }
            
            .list-actions {
                flex-direction: column;
                width: 100%;
            }
            
            .btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-content">
            <div class="logo">
                <div class="logo-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <span class="logo-text">ShopAI</span>
            </div>
            <div class="jordan-flag">
                <span>🇯🇴</span>
                <span>Jordan Edition</span>
            </div>
        </div>
    </nav>
    
    <div class="container">
        <!-- Hero -->
        <div class="hero">
            <h1>🤖 AI Shopping Assistant</h1>
            <div class="hero-subtitle">Powered by Groq AI • Talabat Jordan Integration</div>
            <div class="hero-tagline">Chat naturally, get instant shopping lists with real prices!</div>
        </div>
        
        <!-- Dashboard Stats -->
        <div class="dashboard">
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-number" id="totalProducts">0</div>
                        <div class="stat-label">Products Available</div>
                        <div class="stat-trend">
                            <i class="fas fa-arrow-up"></i>
                            <span>From Talabat Jordan</span>
                        </div>
                    </div>
                    <div class="stat-icon products">
                        <i class="fas fa-boxes"></i>
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-number" id="totalCategories">0</div>
                        <div class="stat-label">Categories</div>
                        <div class="stat-trend">
                            <i class="fas fa-check"></i>
                            <span>Fresh & Ready</span>
                        </div>
                    </div>
                    <div class="stat-icon categories">
                        <i class="fas fa-layer-group"></i>
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-number">
                            <span id="currency">JOD</span>
                        </div>
                        <div class="stat-label">Jordan Currency</div>
                        <div class="stat-trend">
                            <i class="fas fa-globe-asia"></i>
                            <span>Talabat Jordan</span>
                        </div>
                    </div>
                    <div class="stat-icon stores">
                        <i class="fas fa-store"></i>
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-number" style="font-size: 2rem;">FREE</div>
                        <div class="stat-label">AI Powered by Groq</div>
                        <div class="stat-trend">
                            <i class="fas fa-bolt"></i>
                            <span>Lightning Fast</span>
                        </div>
                    </div>
                    <div class="stat-icon value">
                        <i class="fas fa-brain"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-grid">
            <!-- Chat Section -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title-group">
                        <div class="card-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div>
                            <div class="card-title">AI Chat Assistant</div>
                            <div style="font-size: 0.9rem; color: var(--gray); margin-top: 0.25rem;">
                                Chat in English or Arabic style
                            </div>
                        </div>
                    </div>
                    <span class="badge badge-success">LIVE</span>
                </div>
                
                <div class="chat-container" id="chatContainer">
                    <div class="message bot">
                        <div><strong>مرحبا! Marhaba!</strong> 👋</div>
                        <div style="margin-top: 0.75rem;">
                            I'm your AI shopping assistant for Jordan. Tell me what you're planning - 
                            a BBQ, party, dinner - and I'll create the perfect shopping list with 
                            real prices from Talabat Jordan!
                        </div>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
                
                <div class="input-section">
                    <div class="input-group">
                        <input type="text" id="chatInput" 
                               placeholder="Type your request... (e.g., BBQ for 14 people)">
                        <button class="btn btn-primary" onclick="sendMessage()">
                            <i class="fas fa-paper-plane"></i> Send
                        </button>
                    </div>
                    
                    <div class="quick-actions">
                        <div class="quick-action" onclick="fillInput('I want a BBQ for 14 people')">
                            <i class="fas fa-fire"></i>
                            <div class="quick-action-text">BBQ for 14 people</div>
                        </div>
                        <div class="quick-action" onclick="fillInput('Family dinner for 6, budget 50 JOD')">
                            <i class="fas fa-users"></i>
                            <div class="quick-action-text">Family dinner, 50 JOD</div>
                        </div>
                        <div class="quick-action" onclick="fillInput('Party snacks for 20 guests')">
                            <i class="fas fa-birthday-cake"></i>
                            <div class="quick-action-text">Party for 20 guests</div>
                        </div>
                        <div class="quick-action" onclick="fillInput('Traditional Jordanian meal for 8')">
                            <i class="fas fa-utensils"></i>
                            <div class="quick-action-text">Jordanian meal for 8</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Info Section -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title-group">
                        <div class="card-icon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="card-title">How It Works</div>
                    </div>
                    <span class="badge badge-info">SMART AI</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.3rem;">1</div>
                            <h3 style="color: var(--dark); font-weight: 600; font-size: 1.1rem;">Tell Us Your Plan</h3>
                        </div>
                        <p style="color: var(--gray); margin-left: 66px; line-height: 1.6;">
                            Describe your event naturally - "BBQ for 14 people" or "Dinner for family of 6"
                        </p>
                    </div>
                    
                    <div>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, var(--success), #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.3rem;">2</div>
                            <h3 style="color: var(--dark); font-weight: 600; font-size: 1.1rem;">AI Calculates</h3>
                        </div>
                        <p style="color: var(--gray); margin-left: 66px; line-height: 1.6;">
                            Our AI determines quantities, selects products, and optimizes for your budget
                        </p>
                    </div>
                    
                    <div>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.3rem;">3</div>
                            <h3 style="color: var(--dark); font-weight: 600; font-size: 1.1rem;">Order on Talabat</h3>
                        </div>
                        <p style="color: var(--gray); margin-left: 66px; line-height: 1.6;">
                            Click "Add to Cart" to open Talabat Jordan and order directly!
                        </p>
                    </div>
                </div>
                
                <div class="info-panel" style="margin-top: 2rem;">
                    <h4>
                        <i class="fas fa-star"></i>
                        Why ShopAI?
                    </h4>
                    <div class="feature-list">
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Real Talabat Jordan products & prices</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Smart quantity calculations per person</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>FREE AI powered by Groq</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Jordanian food culture aware</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Direct Talabat ordering links</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Shopping List Section -->
        <div id="shoppingList"></div>
    </div>
    
    <script>
        window.onload = function() {
            loadStats();
        };
        
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                document.getElementById('totalProducts').textContent = data.total_products;
                
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
            
            addMessageToChat('user', message);
            input.value = '';
            
            const loadingMsg = addMessageToChat('bot', '<div class="spinner"></div> AI is thinking...');
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: message})
                });
                
                const data = await response.json();
                
                loadingMsg.remove();
                
                addMessageToChat('bot', data.message || data.response);
                
                if (data.shopping_list && data.shopping_list.items && data.shopping_list.items.length > 0) {
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
            const time = new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
            messageDiv.innerHTML = message + `<div class="message-time">${time}</div>`;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            return messageDiv;
        }
        
        function displayShoppingList(shoppingList) {
            const container = document.getElementById('shoppingList');
            
            const byCategory = {};
            shoppingList.items.forEach(item => {
                if (!byCategory[item.category]) {
                    byCategory[item.category] = [];
                }
                byCategory[item.category].push(item);
            });
            
            const categoryIcons = {
                'meat': '🥩', 'vegetables': '🥬', 'drinks': '🥤',
                'bread': '🍞', 'condiments': '🧂', 'salads': '🥗',
                'snacks': '🍿', 'dessert': '🍰', 'charcoal': '⚫',
                'supplies': '🎉', 'default': '📦'
            };
            
            let html = '<div class="shopping-list">';
            html += '<div class="list-header">';
            html += '<div>';
            html += '<div class="list-title"><i class="fas fa-clipboard-list"></i> Your Shopping List</div>';
            html += `<div class="list-meta">For ${shoppingList.num_people} people • ${shoppingList.items.length} items • ${shoppingList.event_type || 'Event'}</div>`;
            html += '</div>';
            html += '<div class="list-actions">';
            html += '<button class="btn btn-success btn-sm" onclick="openAllOnTalabat()"><i class="fas fa-shopping-bag"></i> Open All on Talabat</button>';
            html += '<button class="btn btn-secondary btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button>';
            html += '</div>';
            html += '</div>';
            
            for (const [category, items] of Object.entries(byCategory)) {
                const icon = categoryIcons[category.toLowerCase()] || categoryIcons['default'];
                html += `<div class="category-section">`;
                html += `<div class="category-header">`;
                html += `<span class="category-icon">${icon}</span>`;
                html += `<span>${category.toUpperCase()}</span>`;
                html += `<span class="category-count">${items.length} items</span>`;
                html += `</div>`;
                
                items.forEach((item, idx) => {
                    html += `<div class="shopping-item">`;
                    html += `<div class="item-main">`;
                    html += `<div class="item-name">${item.product_name}</div>`;
                    html += `<div class="item-details">`;
                    html += `<span><i class="fas fa-box"></i> Qty: ${item.quantity}</span>`;
                    html += `<span><i class="fas fa-tag"></i> ${item.unit_price.toFixed(2)} JOD each</span>`;
                    html += `</div>`;
                    
                    if (item.product_url) {
                        html += `<a href="${item.product_url}" target="_blank" class="item-link">`;
                        html += `<i class="fas fa-external-link-alt"></i> View on Talabat Jordan</a>`;
                    }
                    
                    html += `</div>`;
                    html += `<div class="item-actions">`;
                    html += `<div class="item-price">${item.total_price.toFixed(2)} <span class="currency">JOD</span></div>`;
                    
                    if (item.product_url) {
                        html += `<button class="btn btn-success btn-sm" onclick="window.open('${item.product_url}', '_blank')">`;
                        html += `<i class="fas fa-cart-plus"></i> Add to Cart</button>`;
                    }
                    
                    html += `</div>`;
                    html += `</div>`;
                });
                
                html += `</div>`;
            }
            
            html += `<div class="total-section">`;
            html += `<div class="total-info">`;
            html += `<div class="total-label">Total Cost</div>`;
            html += `<div class="total-items">${shoppingList.items.length} items • Ready to order on Talabat</div>`;
            html += `</div>`;
            html += `<div class="total-amount">${shoppingList.total_cost.toFixed(2)} <span style="font-size: 1.5rem;">JOD</span></div>`;
            html += `</div>`;
            html += '</div>';
            
            container.innerHTML = html;
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        function openAllOnTalabat() {
            const links = document.querySelectorAll('.item-link');
            let count = 0;
            links.forEach((link, idx) => {
                if (idx < 5) {
                    setTimeout(() => {
                        window.open(link.href, '_blank');
                    }, idx * 600);
                    count++;
                }
            });
            if (count > 0) {
                alert(`Opening ${count} products on Talabat Jordan! 🇯🇴`);
            }
        }
        
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

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    
    if not message:
        return jsonify({"error": "Message required"}), 400
    
    try:
        result = assistant.chat(message)
        
        return jsonify({
            "success": result.get('success', True),
            "message": result.get('message', ''),
            "response": result.get('message', ''),
            "shopping_list": result.get('shopping_list', {}),
            "type": result.get('type', 'response')
        })
    
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("=" * 70)
    print("🇯🇴 ShopAI Jordan - Professional Shopping Assistant")
    print("=" * 70)
    print(f"\n📊 Database:")
    print(f"   Products: {db.get_product_count()}")
    print(f"   Currency: JOD (Jordanian Dinar)")
    print(f"   Store: Talabat Jordan")
    print(f"\n🌐 Open in browser:")
    print(f"   http://localhost:8080")
    print(f"\n✨ Features:")
    print(f"   • FREE Groq AI integration")
    print(f"   • 30 Jordan products")
    print(f"   • Direct Talabat links")
    print(f"   • Modern dashboard")
    print(f"   • Real-time chat")
    print(f"\n🇯🇴 Ahlan wa Sahlan!")
    print(f"\n🛑 Press Ctrl+C to stop\n")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=8080, use_reloader=False)

