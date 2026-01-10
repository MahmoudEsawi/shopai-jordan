require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { MongoClient } = require('mongodb');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// MongoDB connection
let db;
let client;

async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopai-jordan';
        client = new MongoClient(uri);
        await client.connect();
        db = client.db('shopai-jordan');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Continue without MongoDB for basic functionality
    }
}

// Groq SDK initialization
let groq;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Load products from JSON file
let products = [];
async function loadProducts() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'jordan_products.json'), 'utf8');
        products = JSON.parse(data);
        console.log(`Loaded ${products.length} products`);
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
    }
}

// Serve home page (convert Flask template syntax to Express)
app.get('/', async (req, res) => {
    try {
        let html = await fs.readFile(path.join(__dirname, 'templates', 'index.html'), 'utf8');
        
        // Replace Flask url_for syntax with static paths
        html = html.replace(/\{\{\s*url_for\(['"]static['"],\s*filename=['"]([^'"]+)['"]\)\s*\}\}/g, '/static/$1');
        
        res.send(html);
    } catch (error) {
        console.error('Error serving index:', error);
        res.status(500).send('Error loading page');
    }
});

// API Routes

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const categories = [...new Set(products.map(p => p.category))];
        const stores = [...new Set(products.map(p => p.store_name))];
        
        // Group products by store
        const storesData = stores.map(store => {
            const storeProducts = products.filter(p => p.store_name === store);
            const storeCategories = [...new Set(storeProducts.map(p => p.category))];
            return {
                name: store,
                categories: storeCategories
            };
        });
        
        res.json({
            total_products: products.length,
            total_categories: categories.length,
            stores: storesData
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Error getting statistics' });
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const { category, store, search, minPrice, maxPrice } = req.query;
        let filteredProducts = [...products];
        
        if (category) {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        
        if (store) {
            filteredProducts = filteredProducts.filter(p => p.store_name === store);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchLower) ||
                p.name_en?.toLowerCase().includes(searchLower) ||
                p.name_ar?.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower)
            );
        }
        
        if (minPrice) {
            filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
        }
        
        if (maxPrice) {
            filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
        }
        
        res.json(filteredProducts);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Error getting products' });
    }
});

// Chat endpoint (AI chatbot)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversation_history = [] } = req.body;
        
        if (!groq) {
            return res.status(500).json({ error: 'Groq API key not configured' });
        }
        
        // Build conversation context with products info
        const systemPrompt = `You are a helpful shopping assistant for ShopAI Jordan. 
You help users find products, answer questions about items, and provide shopping recommendations.
Available product categories: ${[...new Set(products.map(p => p.category))].join(', ')}.
Be friendly, helpful, and concise. Respond in the language the user uses.`;
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversation_history.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];
        
        const completion = await groq.chat.completions.create({
            messages: messages,
            model: 'llama-3.1-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024
        });
        
        const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        
        res.json({ response });
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Error processing chat message' });
    }
});

// Cart endpoints
app.get('/api/cart', async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'default';
        
        if (db) {
            const cartCollection = db.collection('carts');
            const cart = await cartCollection.findOne({ sessionId });
            return res.json(cart?.items || []);
        }
        
        // Fallback: return empty cart if no DB
        res.json([]);
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ error: 'Error getting cart' });
    }
});

app.post('/api/cart/add', async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'default';
        
        const product = products.find(p => p.id === productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (db) {
            const cartCollection = db.collection('carts');
            const cart = await cartCollection.findOne({ sessionId });
            
            const cartItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                quantity: quantity,
                image_url: product.image_url
            };
            
            if (cart) {
                const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
                if (existingItemIndex >= 0) {
                    cart.items[existingItemIndex].quantity += quantity;
                } else {
                    cart.items.push(cartItem);
                }
                await cartCollection.updateOne({ sessionId }, { $set: { items: cart.items, updatedAt: new Date() } });
            } else {
                await cartCollection.insertOne({ sessionId, items: [cartItem], createdAt: new Date(), updatedAt: new Date() });
            }
        }
        
        res.json({ success: true, message: 'Product added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Error adding to cart' });
    }
});

app.post('/api/cart/remove', async (req, res) => {
    try {
        const { productId } = req.body;
        const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'default';
        
        if (db) {
            const cartCollection = db.collection('carts');
            await cartCollection.updateOne(
                { sessionId },
                { $pull: { items: { productId } }, $set: { updatedAt: new Date() } }
            );
        }
        
        res.json({ success: true, message: 'Product removed from cart' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Error removing from cart' });
    }
});

app.post('/api/cart/update', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'default';
        
        if (db) {
            const cartCollection = db.collection('carts');
            await cartCollection.updateOne(
                { sessionId, 'items.productId': productId },
                { $set: { 'items.$.quantity': quantity, updatedAt: new Date() } }
            );
        }
        
        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Error updating cart' });
    }
});

app.post('/api/cart/clear', async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'default';
        
        if (db) {
            const cartCollection = db.collection('carts');
            await cartCollection.updateOne(
                { sessionId },
                { $set: { items: [], updatedAt: new Date() } }
            );
        }
        
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Error clearing cart' });
    }
});

// Export endpoint
app.post('/api/export', async (req, res) => {
    try {
        const { format = 'json', cartItems } = req.body;
        const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'default';
        
        let items = cartItems;
        if (!items && db) {
            const cartCollection = db.collection('carts');
            const cart = await cartCollection.findOne({ sessionId });
            items = cart?.items || [];
        }
        
        if (format === 'json') {
            res.json({ items, exported_at: new Date().toISOString() });
        } else if (format === 'csv') {
            const csv = [
                'Product,Quantity,Price,Total',
                ...items.map(item => `${item.name},${item.quantity},${item.price},${item.quantity * item.price}`)
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=cart.csv');
            res.send(csv);
        } else {
            res.status(400).json({ error: 'Invalid format. Use json or csv' });
        }
    } catch (error) {
        console.error('Error exporting:', error);
        res.status(500).json({ error: 'Error exporting cart' });
    }
});

// Initialize and start server
async function startServer() {
    await loadProducts();
    await connectDB();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Products loaded: ${products.length}`);
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    if (client) {
        await client.close();
    }
    process.exit(0);
});

startServer().catch(console.error);

