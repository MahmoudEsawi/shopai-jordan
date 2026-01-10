require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { MongoClient } = require('mongodb');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/background', express.static(path.join(__dirname, 'background')));

// MongoDB connection
let db;
let client;

async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopai';
        client = new MongoClient(uri);
        await client.connect();
        db = client.db('shopai');
        console.log('Connected to MongoDB - Database: shopai');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Continue without MongoDB for basic functionality
    }
}

// HuggingFace API configuration
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
// Using a text generation model that's more reliable
const CHAT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

// Load products from MongoDB or JSON file
let products = [];
async function loadProducts() {
    try {
        // Try to load from MongoDB first
        if (db) {
            const productsCollection = db.collection('prouducts'); // Note: collection name is 'prouducts' in MongoDB
            const count = await productsCollection.countDocuments();
            console.log(`📊 MongoDB collection 'prouducts' has ${count} documents`);
            
            const mongoProducts = await productsCollection.find({}).toArray();
            if (mongoProducts && mongoProducts.length > 0) {
                console.log(`📦 Raw MongoDB products: ${JSON.stringify(mongoProducts[0]).substring(0, 200)}...`);
                products = mongoProducts;
                console.log(`✅ Loaded ${products.length} raw products from MongoDB collection 'prouducts'`);
                
                // Map MongoDB fields to expected format if needed
                products = products.map(p => ({
                    id: p._id || p.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
                    _id: p._id,
                    // Use name_ar if name doesn't exist, fallback to name_en or description
                    name: p.name || p.name_ar || p.name_en || p.description || 'منتج بدون اسم',
                    name_en: p.name_en || p.name || p.description || 'Product without name',
                    name_ar: p.name_ar || p.name || p.description || 'منتج بدون اسم',
                    price: parseFloat(p.price) || 0,
                    currency: p.currency || 'JOD',
                    category: p.category || 'general',
                    description: p.description || '',
                    store_name: p.store_name || 'Unknown Store',
                    product_url: p.product_url || '#',
                    image_url: p.image_url || 'https://via.placeholder.com/300?text=No+Image',
                    in_stock: p.in_stock !== undefined ? p.in_stock : true,
                    calories_per_100g: p.calories_per_100g || null,
                    protein_per_100g: p.protein_per_100g || null,
                    carbs_per_100g: p.carbs_per_100g || null,
                    fats_per_100g: p.fats_per_100g || null,
                    fiber_per_100g: p.fiber_per_100g || null,
                    is_gluten_free: p.is_gluten_free || false,
                    is_vegetarian: p.is_vegetarian || false,
                    is_vegan: p.is_vegan || false,
                    is_halal: p.is_halal || false,
                    is_organic: p.is_organic || false,
                    is_healthy: p.is_healthy || false,
                    weight_grams: p.weight_grams || null,
                    brand: p.brand || null
                }));
                return;
            } else {
                console.log('⚠️  MongoDB collection "prouducts" is empty, falling back to JSON file');
            }
        }
        
        // Fallback to JSON file if MongoDB is not available or empty
        const data = await fs.readFile(path.join(__dirname, 'data', 'jordan_products.json'), 'utf8');
        products = JSON.parse(data);
        console.log(`📄 Loaded ${products.length} products from JSON file`);
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
        
        let filteredProducts;
        
        // Try to get from MongoDB first if available
        if (db) {
            try {
                const productsCollection = db.collection('prouducts'); // Note: collection name is 'prouducts'
                let query = {};
                
                if (category) {
                    query.category = category;
                }
                if (store) {
                    query.store_name = store;
                }
                if (search) {
                    const searchLower = search.toLowerCase();
                    query.$or = [
                        { name: { $regex: searchLower, $options: 'i' } },
                        { name_en: { $regex: searchLower, $options: 'i' } },
                        { name_ar: { $regex: searchLower, $options: 'i' } },
                        { description: { $regex: searchLower, $options: 'i' } }
                    ];
                }
                if (minPrice || maxPrice) {
                    query.price = {};
                    if (minPrice) query.price.$gte = parseFloat(minPrice);
                    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
                }
                
                const mongoProducts = await productsCollection.find(query).toArray();
                
                // Map MongoDB fields to expected format
                filteredProducts = mongoProducts.map(p => ({
                    id: p._id || p.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
                    _id: p._id,
                    // Use name_ar if name doesn't exist, fallback to name_en or description
                    name: p.name || p.name_ar || p.name_en || p.description || 'منتج بدون اسم',
                    name_en: p.name_en || p.name || p.description || 'Product without name',
                    name_ar: p.name_ar || p.name || p.description || 'منتج بدون اسم',
                    price: parseFloat(p.price) || 0,
                    currency: p.currency || 'JOD',
                    category: p.category || 'general',
                    description: p.description || '',
                    store_name: p.store_name || 'Unknown Store',
                    product_url: p.product_url || '#',
                    image_url: p.image_url || 'https://via.placeholder.com/300?text=No+Image',
                    in_stock: p.in_stock !== undefined ? p.in_stock : true,
                    calories_per_100g: p.calories_per_100g || null,
                    protein_per_100g: p.protein_per_100g || null,
                    carbs_per_100g: p.carbs_per_100g || null,
                    fats_per_100g: p.fats_per_100g || null,
                    fiber_per_100g: p.fiber_per_100g || null,
                    is_gluten_free: p.is_gluten_free || false,
                    is_vegetarian: p.is_vegetarian || false,
                    is_vegan: p.is_vegan || false,
                    is_halal: p.is_halal || false,
                    is_organic: p.is_organic || false,
                    is_healthy: p.is_healthy || false,
                    weight_grams: p.weight_grams || null,
                    brand: p.brand || null
                }));
            } catch (mongoError) {
                console.error('Error fetching from MongoDB, falling back to in-memory:', mongoError);
                filteredProducts = [...products];
            }
        } else {
            filteredProducts = [...products];
        }
        
        // Apply filters if not using MongoDB query
        if (!db || (category || store || search || minPrice || maxPrice)) {
            if (category) {
                filteredProducts = filteredProducts.filter(p => p.category === category);
            }
            
            if (store) {
                filteredProducts = filteredProducts.filter(p => p.store_name === store);
            }
            
            if (search) {
                const searchLower = search.toLowerCase();
                filteredProducts = filteredProducts.filter(p => 
                    p.name?.toLowerCase().includes(searchLower) ||
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
        }
        
        res.json(filteredProducts);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Error getting products' });
    }
});

// Map query keywords to product categories
function getCategoriesFromQuery(query) {
    const queryLower = query.toLowerCase();
    const categoryMap = {
        // Arabic keywords - comprehensive list
        'عشاء': ['meat', 'vegetables', 'bread', 'dairy', 'salads'],
        'غداء': ['meat', 'vegetables', 'bread', 'rice', 'grains'],
        'فطور': ['bread', 'dairy', 'eggs', 'jam', 'honey'],
        'شواء': ['meat', 'charcoal', 'vegetables', 'supplies'],
        'شوي': ['meat', 'charcoal', 'vegetables', 'supplies'],
        'دجاج': ['meat'],
        'جاج': ['meat'], // Common misspelling
        'فراخ': ['meat'], // Chickens
        'لحم': ['meat'],
        'لحمة': ['meat'],
        'لحوم': ['meat'],
        'خروف': ['meat'],
        'عجل': ['meat'],
        'خضار': ['vegetables'],
        'خضروات': ['vegetables'],
        'طماطم': ['vegetables'],
        'بندورة': ['vegetables'],
        'بصل': ['vegetables'],
        'فلفل': ['vegetables'],
        'خيار': ['vegetables'],
        'خس': ['vegetables'],
        'فواكه': ['fruits'],
        'فاكهة': ['fruits'],
        'موز': ['fruits'],
        'تفاح': ['fruits'],
        'برتقال': ['fruits'],
        'خبز': ['bread'],
        'ألبان': ['dairy'],
        'حليب': ['dairy'],
        'لبن': ['dairy'],
        'جبن': ['dairy'],
        'زبدة': ['dairy'],
        'مشروبات': ['drinks'],
        'مشروب': ['drinks'],
        'عصير': ['drinks'],
        'ماء': ['drinks'],
        'فحم': ['charcoal', 'supplies'],
        'charcoal': ['charcoal', 'supplies'],
        // English keywords
        'dinner': ['meat', 'vegetables', 'bread', 'dairy', 'salads'],
        'lunch': ['meat', 'vegetables', 'bread', 'rice', 'grains'],
        'breakfast': ['bread', 'dairy', 'eggs', 'jam', 'honey'],
        'bbq': ['meat', 'charcoal', 'vegetables', 'supplies'],
        'grill': ['meat', 'charcoal', 'vegetables', 'supplies'],
        'chicken': ['meat'],
        'meat': ['meat'],
        'beef': ['meat'],
        'lamb': ['meat'],
        'vegetables': ['vegetables'],
        'fruits': ['fruits'],
        'bread': ['bread'],
        'dairy': ['dairy'],
        'milk': ['dairy'],
        'cheese': ['dairy'],
        'drinks': ['drinks'],
        'juice': ['drinks'],
        'water': ['drinks']
    };
    
    const matchedCategories = [];
    for (const [keyword, categories] of Object.entries(categoryMap)) {
        if (queryLower.includes(keyword)) {
            matchedCategories.push(...categories);
        }
    }
    
    return [...new Set(matchedCategories)]; // Remove duplicates
}

// Helper function to search products intelligently based on user query
async function searchProductsIntelligently(query, productsList = null) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1); // Changed to length > 1 for better matching
    
    // Use provided list or fetch from MongoDB
    let searchProducts = productsList;
    if (!searchProducts || searchProducts.length === 0) {
        // Always try to get from MongoDB if available
        if (db) {
            try {
                const productsCollection = db.collection('prouducts');
                let mongoQuery = {};
                
                // Get relevant categories from query
                const relevantCategories = getCategoriesFromQuery(query);
                
        // Build MongoDB query - broader search
        if (relevantCategories.length > 0) {
            // If we have category matches, search by categories (this is most important)
            mongoQuery.category = { $in: relevantCategories };
            console.log(`🔍 Searching MongoDB by categories: ${relevantCategories.join(', ')}`);
        } else if (queryWords.length > 0) {
            // Otherwise, search by keywords
            const searchConditions = [];
            
            // Search in all name fields
            queryWords.forEach(word => {
                if (word.length > 2) {
                    searchConditions.push({ name: { $regex: word, $options: 'i' } });
                    searchConditions.push({ name_ar: { $regex: word, $options: 'i' } });
                    searchConditions.push({ name_en: { $regex: word, $options: 'i' } });
                    searchConditions.push({ description: { $regex: word, $options: 'i' } });
                }
            });
            
            // Also try full query match
            if (queryLower.length > 3) {
                searchConditions.push({ name: { $regex: queryLower, $options: 'i' } });
                searchConditions.push({ name_ar: { $regex: queryLower, $options: 'i' } });
                searchConditions.push({ description: { $regex: queryLower, $options: 'i' } });
            }
            
            if (searchConditions.length > 0) {
                mongoQuery.$or = searchConditions;
            }
            console.log(`🔍 Searching MongoDB by keywords: ${queryWords.join(', ')}`);
        }
        
        // Get products from MongoDB - get more to ensure diversity
        let mongoProducts = [];
        if (Object.keys(mongoQuery).length > 0) {
            mongoProducts = await productsCollection.find(mongoQuery).limit(100).toArray();
        }
        
        // If no specific matches, get diverse products from all categories
        if (mongoProducts.length === 0 && relevantCategories.length > 0) {
            // Try each category separately to get diverse results
            for (const cat of relevantCategories.slice(0, 5)) {
                const catProducts = await productsCollection.find({ category: cat }).limit(10).toArray();
                mongoProducts.push(...catProducts);
                if (mongoProducts.length >= 50) break;
            }
        }
        
        // If still no results or too few, get random diverse products
        if (mongoProducts.length < 10) {
            const allProducts = await productsCollection.find({}).limit(100).toArray();
            // Shuffle and take diverse sample
            const shuffled = allProducts.sort(() => Math.random() - 0.5);
            mongoProducts = [...mongoProducts, ...shuffled.slice(0, 50 - mongoProducts.length)];
        }
                
                if (mongoProducts && mongoProducts.length > 0) {
                    searchProducts = mongoProducts.map(p => ({
                        id: p._id || p.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
                        _id: p._id,
                        name: p.name || p.name_ar || p.name_en,
                        name_ar: p.name_ar || p.name,
                        name_en: p.name_en || p.name,
                        price: parseFloat(p.price) || 0,
                        currency: p.currency || 'JOD',
                        category: p.category || 'general',
                        description: p.description || '',
                        store_name: p.store_name || '',
                        product_url: p.product_url || '#',
                        image_url: p.image_url || '',
                        calories_per_100g: p.calories_per_100g || null,
                        protein_per_100g: p.protein_per_100g || null,
                        carbs_per_100g: p.carbs_per_100g || null,
                        fats_per_100g: p.fats_per_100g || null,
                        is_gluten_free: p.is_gluten_free || false,
                        is_vegetarian: p.is_vegetarian || false,
                        is_vegan: p.is_vegan || false,
                        is_halal: p.is_halal || false,
                        is_organic: p.is_organic || false,
                        is_healthy: p.is_healthy || false
                    }));
                    console.log(`🔍 Found ${searchProducts.length} products from MongoDB for query: "${query}"`);
                } else {
                    // If no MongoDB results, get all products
                    const allMongoProducts = await productsCollection.find({}).limit(100).toArray();
                    if (allMongoProducts && allMongoProducts.length > 0) {
                        searchProducts = allMongoProducts.map(p => ({
                            id: p._id || p.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
                            _id: p._id,
                            name: p.name || p.name_ar || p.name_en,
                            name_ar: p.name_ar || p.name,
                            name_en: p.name_en || p.name,
                            price: parseFloat(p.price) || 0,
                            currency: p.currency || 'JOD',
                            category: p.category || 'general',
                            description: p.description || '',
                            store_name: p.store_name || '',
                            product_url: p.product_url || '#',
                            image_url: p.image_url || '',
                            calories_per_100g: p.calories_per_100g || null,
                            protein_per_100g: p.protein_per_100g || null,
                            carbs_per_100g: p.carbs_per_100g || null,
                            fats_per_100g: p.fats_per_100g || null,
                            is_gluten_free: p.is_gluten_free || false,
                            is_vegetarian: p.is_vegetarian || false,
                            is_vegan: p.is_vegan || false,
                            is_halal: p.is_halal || false,
                            is_organic: p.is_organic || false,
                            is_healthy: p.is_healthy || false
                        }));
                        console.log(`📦 Using all ${searchProducts.length} products from MongoDB (no specific matches)`);
                    } else {
                        searchProducts = productsList || products;
                    }
                }
            } catch (error) {
                console.error('Error searching MongoDB:', error);
                searchProducts = productsList || products;
            }
        } else {
            searchProducts = productsList || products;
        }
    }
    
    if (!searchProducts || searchProducts.length === 0) {
        console.warn('⚠️ No products available for search');
        return [];
    }
    
    // Get relevant categories from query
    const relevantCategories = getCategoriesFromQuery(query);
    
    // Score products based on relevance
    const scoredProducts = searchProducts.map(product => {
        let score = 0;
        const productText = `${product.name || ''} ${product.name_en || ''} ${product.name_ar || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
        
        // Category match from query (highest priority)
        if (relevantCategories.length > 0 && product.category) {
            if (relevantCategories.includes(product.category)) {
                score += 200; // Very high score for category match
            }
        }
        
        // Exact match bonus
        if (productText.includes(queryLower)) {
            score += 100;
        }
        
        // Word matching with better Arabic support
        queryWords.forEach(word => {
            if (word.length > 1) { // Changed to > 1 to match single character Arabic words
                // Exact word match (highest priority)
                const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
                if (productText.match(wordRegex)) {
                    score += 20;
                }
                
                // Partial match
                if (productText.includes(word)) {
                    score += 10;
                }
                
                // Category match
                if (product.category && product.category.toLowerCase().includes(word)) {
                    score += 50;
                }
                
                // Name match (highest priority for product names)
                const nameAr = (product.name_ar || '').toLowerCase();
                const nameEn = (product.name_en || '').toLowerCase();
                const name = (product.name || '').toLowerCase();
                
                if (nameAr.includes(word) || nameEn.includes(word) || name.includes(word)) {
                    score += 60; // Increased from 40 to 60
                }
                
                // Exact name match (even higher priority)
                if (nameAr === word || nameEn === word || name === word) {
                    score += 100; // Very high score for exact name match
                }
                
                // Arabic synonyms mapping (e.g., "جاج" = "دجاج" = "chicken")
                const arabicSynonyms = {
                    'جاج': ['دجاج', 'chicken', 'فراخ'],
                    'حليب': ['milk', 'لبن', 'ألبان'],
                    'لحم': ['meat', 'لحوم', 'لحمة'],
                    'خضار': ['vegetables', 'خضروات'],
                    'فواكه': ['fruits', 'فاكهة'],
                    'خبز': ['bread'],
                    'ألبان': ['dairy', 'حليب', 'لبن'],
                    'مشروبات': ['drinks', 'مشروب'],
                    'فحم': ['charcoal']
                };
                
                // Check synonyms
                if (arabicSynonyms[word]) {
                    arabicSynonyms[word].forEach(synonym => {
                        if (productText.includes(synonym.toLowerCase())) {
                            score += 50; // High score for synonym match
                        }
                    });
                }
                
                // Description match
                if (product.description && product.description.toLowerCase().includes(word)) {
                    score += 15;
                }
            }
        });
        
        // Give base score to all products so they can be returned
        // This ensures we always return products even if no exact match
        if (score === 0 && relevantCategories.length === 0) {
            score = 1; // Base score for unrelated products
        }
        
        return { ...product, relevanceScore: score };
    });
    
    // Sort by relevance
    scoredProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // If we have category matches, prioritize them, otherwise return diverse products
    if (relevantCategories.length > 0) {
        // Return top matches from relevant categories
        const categoryMatches = scoredProducts.filter(p => relevantCategories.includes(p.category));
        const otherMatches = scoredProducts.filter(p => !relevantCategories.includes(p.category));
        
        // Mix: category matches first, then others
        const result = [...categoryMatches.slice(0, 15), ...otherMatches.slice(0, 5)].slice(0, 20);
        console.log(`✅ Returning ${result.length} products (${categoryMatches.length} from relevant categories, ${otherMatches.length} others)`);
        return result;
    } else {
        // Return diverse products from different categories
        // Group by category for better diversity
        const byCategory = {};
        scoredProducts.forEach(p => {
            const cat = p.category || 'general';
            if (!byCategory[cat]) {
                byCategory[cat] = [];
            }
            byCategory[cat].push(p);
        });
        
        // Sort categories by highest score product
        const sortedCategories = Object.keys(byCategory).sort((a, b) => {
            const scoreA = byCategory[a][0]?.relevanceScore || 0;
            const scoreB = byCategory[b][0]?.relevanceScore || 0;
            return scoreB - scoreA;
        });
        
        // Take products from each category to ensure diversity
        const result = [];
        const maxPerCategory = Math.ceil(20 / Math.max(1, sortedCategories.length));
        
        sortedCategories.forEach(cat => {
            const categoryProducts = byCategory[cat].slice(0, maxPerCategory);
            result.push(...categoryProducts);
        });
        
        // Sort by score and return top 20
        const finalResult = result
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 20);
        
        console.log(`✅ Returning ${finalResult.length} diverse products from ${sortedCategories.length} categories: ${sortedCategories.join(', ')}`);
        return finalResult;
    }
}

// Generate intelligent response based on user query (without external API)
function generateIntelligentResponse(message, relevantProducts, categories) {
    const messageLower = message.toLowerCase();
    const isArabic = /[\u0600-\u06FF]/.test(message);
    
    // Extract key information from message
    const numPeopleMatch = message.match(/(\d+)\s*(?:شخص|أشخاص|person|people|pcs|قطعة|وحدة)/i) || 
                          message.match(/(?:لـ|ل|for)\s*(\d+)/i) || 
                          message.match(/(\d+)/);
    const numPeople = numPeopleMatch ? parseInt(numPeopleMatch[1]) : null;
    
    const eventTypeMatch = message.match(/\b(فطور|غداء|عشاء|شواء|bbq|breakfast|lunch|dinner|party)\b/i);
    const eventType = eventTypeMatch ? eventTypeMatch[1].toLowerCase() : null;
    
    const budgetMatch = message.match(/(\d+)\s*(?:دينار|jod|jd|dinar)/i);
    const budget = budgetMatch ? parseFloat(budgetMatch[1]) : null;
    
    // Greeting responses
    if (messageLower.match(/\b(hello|hi|hey|السلام|أهلا|مرحبا|اهلين|صباح|مساء)\b/i)) {
        return isArabic 
            ? `أهلاً وسهلاً! أنا مساعدك الذكي للتسوق في ShopAI Jordan. يمكنني مساعدتك في:\n• البحث عن المنتجات\n• إنشاء قائمة تسوق\n• اقتراح المنتجات\n• حساب الميزانية\n\nماذا تحتاج؟`
            : `Hello! I'm your smart shopping assistant for ShopAI Jordan. I can help you with:\n• Finding products\n• Creating shopping lists\n• Product recommendations\n• Budget calculations\n\nWhat do you need?`;
    }
    
    // Product search results - make response dynamic based on query
    if (relevantProducts.length > 0) {
        const productsToShow = relevantProducts.slice(0, 15);
        const productList = productsToShow.map((p, index) => {
            const productName = isArabic ? (p.name_ar || p.name || 'منتج') : (p.name_en || p.name || 'product');
            const price = parseFloat(p.price) || 0;
            const currency = p.currency || 'JOD';
            const category = p.category || 'عام';
            
            if (isArabic) {
                return `${index + 1}. ${productName.trim()}\n   💰 السعر: ${price.toFixed(2)} ${currency}\n   📂 الفئة: ${category}`;
            } else {
                return `${index + 1}. ${productName.trim()}\n   💰 Price: ${price.toFixed(2)} ${currency}\n   📂 Category: ${category}`;
            }
        }).join('\n\n');
        
        const productWord = productsToShow.length === 1 ? (isArabic ? 'منتج' : 'product') : (isArabic ? 'منتجات' : 'products');
        const moreText = relevantProducts.length > 15 ? (isArabic ? `\n\n... و ${relevantProducts.length - 15} منتج آخر` : `\n\n... and ${relevantProducts.length - 15} more products`) : '';
        
        // Dynamic response based on query type
        let responsePrefix = '';
        if (numPeople && eventType) {
            const eventNames = {
                'فطور': 'فطور',
                'breakfast': 'فطور',
                'غداء': 'غداء',
                'lunch': 'غداء',
                'عشاء': 'عشاء',
                'dinner': 'عشاء',
                'شواء': 'شواء',
                'bbq': 'شواء',
                'party': 'حفلة',
                'حفلة': 'حفلة'
            };
            const eventName = eventNames[eventType] || eventType;
            responsePrefix = isArabic 
                ? `✅ وجدت ${productsToShow.length} ${productWord} مناسبة لـ ${eventName} لـ ${numPeople} أشخاص${budget ? ` بميزانية ${budget} دينار` : ''}${moreText}:\n\n`
                : `✅ Found ${productsToShow.length} ${productWord} suitable for ${eventType} for ${numPeople} people${budget ? ` with budget ${budget} JOD` : ''}${moreText}:\n\n`;
        } else if (messageLower.match(/\b(بدي|أريد|I want|I need|أحتاج)\b/i)) {
            // Direct product request (e.g., "بدي جاج" or "I want chicken")
            responsePrefix = isArabic
                ? `✅ وجدت ${productsToShow.length} ${productWord} حسب طلبك${moreText}:\n\n`
                : `✅ Found ${productsToShow.length} ${productWord} as requested${moreText}:\n\n`;
        } else {
            // General search
            responsePrefix = isArabic
                ? `✅ وجدت ${productsToShow.length} ${productWord} ذات صلة ببحثك${moreText}:\n\n`
                : `✅ Found ${productsToShow.length} relevant ${productWord}${moreText}:\n\n`;
        }
        
        return `${responsePrefix}${productList}\n\n💡 ${isArabic ? 'سأقوم بإنشاء قائمة تسوق منطقية ومناسبة بناءً على طلبك. يمكنك تعديل الكميات قبل الإضافة للسلة.' : 'I\'ll create a logical and suitable shopping list based on your request. You can edit quantities before adding to cart.'}`;
    }
    
    // Category inquiry
    if (messageLower.match(/\b(categories|أصناف|فئات|أنواع|categories)\b/i)) {
        const categoryList = categories.slice(0, 10).join(', ');
        return isArabic
            ? `نوفر المنتجات في الفئات التالية: ${categoryList}.\n\nأيهما يهمك؟ يمكنك البحث عن منتج معين أو استخدام Smart Shopping Planner لإنشاء قائمة تسوق كاملة.`
            : `We have products in these categories: ${categoryList}.\n\nWhich interests you? You can search for a specific product or use the Smart Shopping Planner to create a complete shopping list.`;
    }
    
    // Help request
    if (messageLower.match(/\b(help|مساعدة|help me|ساعدني|ماذا|what can)\b/i)) {
        return isArabic
            ? `يمكنني مساعدتك في:\n• البحث عن المنتجات (مثلاً: "بدي جاج" أو "بدي حليب")\n• إنشاء قائمة تسوق (مثلاً: "بدي فطور ل10 أشخاص")\n• معرفة الفئات المتاحة\n• حساب الميزانية المقترحة\n• التوصية بالمنتجات\n\n💡 يمكنك التحدث معي بشكل عادي أو استخدام Smart Shopping Planner لإدخال التفاصيل.`
            : `I can help you with:\n• Finding products (e.g., "I want chicken" or "I need milk")\n• Creating shopping lists (e.g., "breakfast for 10 people")\n• Finding available categories\n• Calculating suggested budgets\n• Product recommendations\n\n💡 You can chat with me naturally or use the Smart Shopping Planner to enter details.`;
    }
    
    // No results found - but suggest alternatives
    const suggestedCategories = categories.slice(0, 5).join(', ');
    if (isArabic) {
        return `❌ لم أجد منتجات تطابق بحثك "${message}".\n\n💡 جرب:\n• البحث بكلمات مختلفة (مثلاً: "جاج" بدلاً من "دجاج")\n• استخدام الفئات المتاحة: ${suggestedCategories}\n• كتابة اسم المنتج بالعربية أو الإنجليزية\n• استخدام Smart Shopping Planner لإنشاء قائمة تسوق\n\nمثال: "بدي جاج" أو "بدي حليب" أو "بدي فطور ل10 أشخاص"`;
    } else {
        return `❌ I couldn't find products matching "${message}".\n\n💡 Try:\n• Different search keywords\n• Using available categories: ${suggestedCategories}\n• Searching in Arabic or English\n• Using the Smart Shopping Planner to create a shopping list\n\nExamples: "I want chicken" or "I need milk" or "breakfast for 10 people"`;
    }
}

// Chat endpoint (AI chatbot with intelligent product search)
app.post('/api/chat', async (req, res) => {
    try {
        const { 
            message, 
            conversation_history = [],
            // Smart Shopping Planner parameters
            eventType: plannerEventType,
            numPeople: plannerNumPeople,
            budget: plannerBudget,
            dietary,
            filterHealthy,
            filterGlutenFree,
            minProtein,
            maxCalories,
            additionalRequests,
            fromSmartPlanner
        } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Log Smart Shopping Planner data if provided
        if (fromSmartPlanner) {
            console.log('📋 Smart Shopping Planner data received in req.body:', {
                eventType: plannerEventType,
                numPeople: plannerNumPeople,
                budget: plannerBudget,
                budgetType: typeof plannerBudget,
                budgetIsNull: plannerBudget === null,
                budgetIsUndefined: plannerBudget === undefined,
                budgetIsEmptyString: plannerBudget === '',
                budgetStringValue: String(plannerBudget),
                dietary: dietary,
                filterHealthy: filterHealthy,
                filterGlutenFree: filterGlutenFree
            });
        }
        
        // First, search for relevant products based on user query (with MongoDB support)
        let relevantProducts = await searchProductsIntelligently(message, products);
        
        // Apply filters from Smart Shopping Planner
        if (fromSmartPlanner) {
            if (filterHealthy) {
                relevantProducts = relevantProducts.filter(p => p.is_healthy === true);
            }
            if (filterGlutenFree) {
                relevantProducts = relevantProducts.filter(p => p.is_gluten_free === true);
            }
            if (dietary === 'vegetarian') {
                relevantProducts = relevantProducts.filter(p => p.is_vegetarian === true);
            } else if (dietary === 'vegan') {
                relevantProducts = relevantProducts.filter(p => p.is_vegan === true);
            } else if (dietary === 'halal') {
                relevantProducts = relevantProducts.filter(p => p.is_halal === true);
            }
            if (minProtein) {
                relevantProducts = relevantProducts.filter(p => p.protein_per_100g && p.protein_per_100g >= minProtein);
            }
            if (maxCalories) {
                relevantProducts = relevantProducts.filter(p => p.calories_per_100g && p.calories_per_100g <= maxCalories);
            }
        }
        
        // Get categories
        const categories = [...new Set(products.map(p => p.category))];
        
        // Generate intelligent response using fallback (works without external API)
        let aiResponse = generateIntelligentResponse(message, relevantProducts, categories);
        
        // Try HuggingFace API if available (optional enhancement)
        if (HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY !== 'your_api_key_here') {
            try {
                // Extract key info from message for better context
                const numPeopleMatch = message.match(/(\d+)\s*(?:شخص|أشخاص|person|people|pcs|قطعة|وحدة)/i) || message.match(/(\d+)/);
                const numPeople = numPeopleMatch ? parseInt(numPeopleMatch[1]) : null;
                const eventTypeMatch = message.match(/\b(فطور|غداء|عشاء|شواء|bbq|breakfast|lunch|dinner|party)\b/i);
                const eventType = eventTypeMatch ? eventTypeMatch[1] : null;
                const budgetMatch = message.match(/(\d+)\s*(?:دينار|jod|jd|dinar)/i);
                const budget = budgetMatch ? parseFloat(budgetMatch[1]) : null;
                
                const contextInfo = [];
                if (numPeople) contextInfo.push(`${numPeople} people`);
                if (eventType) contextInfo.push(`event: ${eventType}`);
                if (budget) contextInfo.push(`budget: ${budget} JOD`);
                
                const systemPrompt = `You are a helpful shopping assistant for ShopAI Jordan, an online grocery store.
You help users find products, answer questions about items, and provide shopping recommendations.
Available product categories: ${categories.join(', ')}.
${relevantProducts.length > 0 ? `Relevant products found: ${relevantProducts.slice(0, 5).map(p => `${p.name_ar || p.name} (${p.price} JOD, ${p.category})`).join(', ')}` : 'No specific products found yet.'}
${contextInfo.length > 0 ? `User context: ${contextInfo.join(', ')}.` : ''}

User message: "${message}"

Respond naturally and helpfully in the same language the user uses (Arabic or English).
${relevantProducts.length > 0 ? 'Mention the relevant products and suggest creating a shopping list.' : 'Suggest searching for specific products or using categories.'}
Be friendly, concise, and focus on being helpful.`;
                
                const response = await axios.post(
                    `${HUGGINGFACE_API_URL}/${CHAT_MODEL}`,
                    {
                        inputs: systemPrompt,
                        parameters: {
                            max_new_tokens: 250,
                            temperature: 0.8,
                            return_full_text: false,
                            top_p: 0.9
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 20000
                    }
                );
                
                if (response.data) {
                    let hfResponse = '';
                    if (Array.isArray(response.data)) {
                        hfResponse = response.data[0]?.generated_text || response.data[0]?.text || '';
                    } else if (typeof response.data === 'string') {
                        hfResponse = response.data;
                    } else if (response.data.generated_text) {
                        hfResponse = response.data.generated_text;
                    } else if (response.data[0]?.generated_text) {
                        hfResponse = response.data[0].generated_text;
                    }
                    
                    // Clean up the response
                    if (hfResponse && hfResponse.trim().length > 20) {
                        // Remove system prompt if present
                        hfResponse = hfResponse.replace(systemPrompt, '').trim();
                        // Take first paragraph or first 400 characters
                        const cleanedResponse = hfResponse.split('\n')[0].substring(0, 400).trim();
                        if (cleanedResponse.length > 20) {
                            aiResponse = cleanedResponse;
                            console.log('✅ Using HuggingFace AI response');
                        }
                    }
                }
            } catch (hfError) {
                // Silently fall back to intelligent response
                console.log('⚠️ Using fallback response (HuggingFace API unavailable or error)');
                if (hfError.response) {
                    console.log(`   Error: ${hfError.response.status} - ${hfError.response.statusText}`);
                }
            }
        }
        
        // Always create shopping list if we have relevant products (not just for explicit shopping requests)
        const messageLower = message.toLowerCase();
        const isShoppingRequest = messageLower.match(/\b(bbq|grill|شوي|شواء|أريد|I want|I need|shopping list|قائمة|تسوق|add|أضف|إضافة)\b/i);
        
        let shoppingList = null;
        // Create shopping list if we have relevant products (even without explicit shopping request)
        if (relevantProducts.length > 0) {
            // Use data from Smart Shopping Planner if available, otherwise extract from message
            let numPeople = 1;
            let eventType = 'general';
            let budget = null;
            
            // Priority 1: Use Smart Shopping Planner data if available
            if (fromSmartPlanner) {
                numPeople = parseInt(plannerNumPeople) || 1;
                eventType = plannerEventType || 'general';
                
                // Use budget from Smart Planner - check if it's provided and valid
                console.log(`🔍 Processing plannerBudget: value="${plannerBudget}", type=${typeof plannerBudget}, null=${plannerBudget === null}, undefined=${plannerBudget === undefined}, emptyString=${plannerBudget === ''}`);
                
                // plannerBudget can be null, undefined, empty string, or a valid number/string
                if (plannerBudget !== null && plannerBudget !== undefined && plannerBudget !== '') {
                    // Parse budget - handle both string and number types
                    let parsedBudget = null;
                    
                    if (typeof plannerBudget === 'string') {
                        const trimmed = String(plannerBudget).trim();
                        if (trimmed !== '' && trimmed !== '0') {
                            parsedBudget = parseFloat(trimmed);
                            console.log(`🔢 Parsed string budget: "${trimmed}" → ${parsedBudget}`);
                        }
                    } else if (typeof plannerBudget === 'number') {
                        parsedBudget = plannerBudget;
                        console.log(`🔢 Using number budget directly: ${parsedBudget}`);
                    }
                    
                    // Validate parsed budget
                    if (parsedBudget !== null && !isNaN(parsedBudget) && parsedBudget > 0 && parsedBudget < 100000) {
                        budget = parsedBudget;
                        console.log(`✅ Using Smart Shopping Planner budget: ${budget} JOD`);
                    } else {
                        budget = null;
                        console.log(`⚠️ Invalid budget in Smart Shopping Planner: "${plannerBudget}" (parsed: ${parsedBudget}), will calculate automatically`);
                    }
                } else {
                    budget = null;
                    console.log(`📋 No budget specified in Smart Shopping Planner (value: ${plannerBudget}), will calculate automatically`);
                }
                
                console.log(`📋 Final Smart Shopping Planner data: ${eventType} for ${numPeople} people, budget: ${budget !== null ? budget + ' JOD' : 'auto (will calculate)'}`);
            } else {
                // Priority 2: Extract from message
                // Extract quantity hints from message (number of people, quantity, etc.)
                const quantityPatterns = [
                    /(?:for|لـ|ل)\s*(\d+)\s*(?:person|people|شخص|أشخاص|pcs|قطعة|وحدة)/i,
                    /(\d+)\s*(?:person|people|شخص|أشخاص|pcs|قطعة|وحدة)/i,
                    /(?:number|عدد|كمية)\s*(?:of|من)?\s*(\d+)/i
                ];
                
                for (const pattern of quantityPatterns) {
                    const quantityMatch = message.match(pattern);
                    if (quantityMatch) {
                        numPeople = parseInt(quantityMatch[1]);
                        console.log(`👥 Extracted ${numPeople} people from message`);
                        break;
                    }
                }
                
                // If no match found, try to find any number in the message (fallback)
                if (numPeople === 1) {
                    const anyNumberMatch = message.match(/(\d+)/);
                    if (anyNumberMatch && parseInt(anyNumberMatch[1]) > 1 && parseInt(anyNumberMatch[1]) <= 100) {
                        numPeople = parseInt(anyNumberMatch[1]);
                        console.log(`👥 Using fallback: ${numPeople} people from message`);
                    }
                }
                
                // Extract event type from message (more comprehensive)
                if (messageLower.includes('bbq') || messageLower.includes('شوي') || messageLower.includes('شواء') || messageLower.includes('grill')) {
                    eventType = 'bbq';
                    console.log(`🎯 Detected event type: BBQ/شواء from message`);
                } else if (messageLower.includes('party') || messageLower.includes('حفلة') || messageLower.includes('party')) {
                    eventType = 'party';
                    console.log(`🎯 Detected event type: Party/حفلة from message`);
                } else if (messageLower.includes('dinner') || messageLower.includes('عشاء')) {
                    eventType = 'dinner';
                    console.log(`🎯 Detected event type: Dinner/عشاء from message`);
                } else if (messageLower.includes('lunch') || messageLower.includes('غداء')) {
                    eventType = 'lunch';
                    console.log(`🎯 Detected event type: Lunch/غداء from message`);
                } else if (messageLower.includes('breakfast') || messageLower.includes('فطور')) {
                    eventType = 'breakfast';
                    console.log(`🎯 Detected event type: Breakfast/فطور from message`);
                } else if (messageLower.includes('family') || messageLower.includes('عائلة')) {
                    eventType = 'family';
                    console.log(`🎯 Detected event type: Family/عائلة from message`);
                } else if (messageLower.includes('traditional') || messageLower.includes('تقليدي')) {
                    eventType = 'traditional';
                    console.log(`🎯 Detected event type: Traditional/تقليدي from message`);
                } else {
                    console.log(`🎯 No specific event type detected, using 'general'`);
                }
            }
            
            console.log(`👥 Final numPeople: ${numPeople}, eventType: ${eventType}, budget: ${budget || 'auto'}`);
            
            // Function to calculate automatic budget based on Jordanian market prices
            function calculateBudgetForJordan(numPeople, eventType) {
                // Cost per person in JOD based on event type (realistic Jordanian prices for home cooking)
                // Increased amounts to be more generous and realistic
                const costPerPerson = {
                    'bbq': 7.0,        // BBQ ~7 JOD per person (meat is expensive)
                    'dinner': 7.0,     // Dinner ~7 JOD per person (balanced, generous meal)
                    'lunch': 5.0,      // Lunch ~5 JOD per person (lighter meal)
                    'breakfast': 4.0,  // Breakfast ~4 JOD per person (simpler meal)
                    'party': 8.0,      // Party ~8 JOD per person (more variety and quantity)
                    'family': 6.0,     // Family meal ~6 JOD per person (traditional portions)
                    'traditional': 7.0, // Traditional ~7 JOD per person (authentic dishes)
                    'general': 6.0     // General ~6 JOD per person (standard meal)
                };
                
                const baseCost = costPerPerson[eventType] || costPerPerson['general'];
                
                // Calculate total budget (no discount for large groups - keep it generous)
                let budget = baseCost * numPeople;
                
                // For very small groups (1-2), increase slightly (minimum viable meals cost more per person)
                if (numPeople <= 2) {
                    budget = budget * 1.2; // 20% increase for small groups
                }
                
                // Round to nearest 5 JOD for cleaner numbers
                budget = Math.ceil(budget / 5) * 5;
                
                // Ensure minimum budget (at least 15 JOD for a decent meal)
                if (budget < 15) {
                    budget = 15;
                }
                
                return Math.round(budget);
            }
            
            // Extract or use budget
            // Only extract from message if NOT from Smart Planner and budget not already set
            if (!fromSmartPlanner && (budget === null || budget === undefined)) {
                const budgetPatterns = [
                    /(?:budget|ميزانية|حدود|maximum|أقل من|على|لـ|for)\s*(\d+)\s*(?:jod|jd|دينار|dinar)?/i,
                    /(\d+)\s*(?:jod|jd|دينار|dinar)\s*(?:budget|ميزانية|حدود)?/i,
                    /(?:limit|حد|to|إلى)\s*(\d+)\s*(?:jod|jd|دينار|dinar)?/i
                ];
                
                for (const pattern of budgetPatterns) {
                    const budgetMatch = message.match(pattern);
                    if (budgetMatch) {
                        const extractedBudget = parseFloat(budgetMatch[1]);
                        if (!isNaN(extractedBudget) && extractedBudget > 0) {
                            budget = extractedBudget;
                            console.log(`💰 User specified budget from message: ${budget} JOD`);
                            break;
                        }
                    }
                }
            }
            
            // If no budget found (null or undefined), calculate automatic budget
            // IMPORTANT: Only calculate if budget is null/undefined, NOT if it's already set from Smart Planner or message
            console.log(`🔍 Final budget check: budget=${budget}, type=${typeof budget}, isNull=${budget === null}, isUndefined=${budget === undefined}, isNaN=${typeof budget === 'number' && isNaN(budget)}, isPositive=${typeof budget === 'number' && budget > 0}`);
            
            if (budget === null || budget === undefined || (typeof budget === 'number' && isNaN(budget))) {
                const autoBudget = calculateBudgetForJordan(numPeople, eventType);
                budget = autoBudget;
                console.log(`💰 Calculated automatic budget for ${numPeople} people (${eventType}): ${budget} JOD (~${(budget/numPeople).toFixed(2)} per person)`);
            } else if (typeof budget === 'number' && budget > 0) {
                console.log(`✅ FINAL BUDGET CONFIRMED: ${budget} JOD (${fromSmartPlanner ? 'from Smart Shopping Planner' : 'extracted from message'}) - WILL BE USED`);
            } else {
                console.log(`⚠️ Budget has unexpected value: ${budget}, type: ${typeof budget} - calculating automatic budget`);
                budget = calculateBudgetForJordan(numPeople, eventType);
                console.log(`💰 Calculated automatic budget: ${budget} JOD`);
            }
            
            // Function to calculate logical quantity based on product type, number of people, and budget
            // If budget is specified, calculate based on budget allocation per category
            // If no budget, calculate based on number of people (realistic portions)
            function calculateQuantity(product, numPeople, eventType, availableBudget = null, categoryBudgetAllocation = null) {
                const category = product.category || 'general';
                const price = parseFloat(product.price) || 0;
                
                if (price <= 0) {
                    return 1;
                }
                
                // If budget is specified and we have category allocation, calculate based on budget
                if (availableBudget && categoryBudgetAllocation && categoryBudgetAllocation[category]) {
                    const categoryBudget = categoryBudgetAllocation[category];
                    // Calculate how many units we can afford for this category
                    const maxQuantityByBudget = Math.floor(categoryBudget / price);
                    
                    // Still consider number of people for minimum logic, but prioritize budget
                    let minQuantity = 1;
                    if (numPeople > 1) {
                        // Minimum based on number of people (reduced)
                        switch(category) {
                            case 'meat':
                                minQuantity = Math.max(1, Math.min(2, Math.ceil(numPeople / 10))); // At least 1-2 units
                                break;
                            case 'vegetables':
                            case 'salads':
                                minQuantity = Math.max(1, Math.min(3, Math.ceil(numPeople / 5)));
                                break;
                            default:
                                minQuantity = 1;
                        }
                    }
                    
                    // Use budget-based quantity, but respect minimum
                    const quantity = Math.max(minQuantity, Math.min(maxQuantityByBudget, minQuantity + 2));
                    console.log(`💰 ${product.name}: Budget-based quantity: ${quantity} units (category budget: ${categoryBudget.toFixed(2)}, price: ${price.toFixed(2)})`);
                    return quantity;
                }
                
                // If no budget specified, calculate based on number of people (original logic)
                let quantity = 1;
                
                if (numPeople <= 1) {
                    return 1;
                }
                
                // Calculate based on category with realistic portions
                switch(category) {
                    case 'meat':
                        // For meat: ~200-250g per person for dinner, ~150-200g for BBQ
                        // Assume product is ~1kg, so for 14 people we need ~3-4kg total = 3-4 units
                        if (eventType === 'bbq') {
                            quantity = Math.max(1, Math.min(5, Math.ceil(numPeople * 0.15))); // ~150g per person
                        } else {
                            quantity = Math.max(1, Math.min(6, Math.ceil(numPeople * 0.2))); // ~200g per person
                        }
                        break;
                        
                    case 'vegetables':
                    case 'salads':
                        // For vegetables: ~100-150g per person, assume 500g per unit
                        quantity = Math.max(1, Math.min(8, Math.ceil(numPeople * 0.3))); // ~150g per person
                        break;
                        
                    case 'fruits':
                        // For fruits: ~100g per person, assume 1kg per unit
                        quantity = Math.max(1, Math.min(6, Math.ceil(numPeople * 0.1))); // ~100g per person
                        break;
                        
                    case 'bread':
                        // For bread: ~1-2 pieces per person, assume 10 pieces per unit
                        quantity = Math.max(1, Math.min(5, Math.ceil(numPeople / 10)));
                        break;
                        
                    case 'drinks':
                        // For drinks: ~2-3 drinks per person, assume 6-pack per unit
                        quantity = Math.max(1, Math.min(8, Math.ceil(numPeople / 2)));
                        break;
                        
                    case 'dairy':
                        // For dairy: ~100-150g per person, assume 500g per unit
                        quantity = Math.max(1, Math.min(6, Math.ceil(numPeople * 0.3)));
                        break;
                        
                    case 'charcoal':
                        // For charcoal: 1 bag per 4-6 people
                        quantity = Math.max(1, Math.min(3, Math.ceil(numPeople / 5)));
                        break;
                        
                    case 'supplies':
                        // For supplies: 1 unit usually enough
                        quantity = 1;
                        break;
                        
                    default:
                        // For other items: minimal quantity
                        quantity = Math.max(1, Math.min(4, Math.ceil(numPeople / 4)));
                }
                
                // If price is very high, reduce quantity
                if (price > 50 && numPeople > 10) {
                    quantity = Math.max(1, Math.min(2, quantity)); // Max 2 units for expensive items
                } else if (price > 20 && numPeople > 10) {
                    quantity = Math.max(1, Math.min(3, quantity)); // Max 3 units for moderately expensive items
                }
                
                return quantity;
            }
            
            // Get more diverse products based on event type
            // For BBQ, we need: meat, charcoal, vegetables, bread, drinks, supplies
            // For dinner, we need: meat, vegetables, bread, dairy, salads, drinks
            let selectedProducts = [];
            
            // Get products from all relevant categories for the event type
            const eventCategories = {
                'bbq': ['meat', 'charcoal', 'vegetables', 'bread', 'drinks', 'supplies', 'salads'],
                'dinner': ['meat', 'vegetables', 'bread', 'dairy', 'salads', 'drinks'],
                'lunch': ['meat', 'vegetables', 'bread', 'salads', 'drinks'],
                'breakfast': ['bread', 'dairy', 'fruits', 'drinks'],
                'party': ['meat', 'vegetables', 'bread', 'dairy', 'drinks', 'snacks', 'fruits'],
                'family': ['meat', 'vegetables', 'bread', 'dairy', 'salads', 'drinks'],
                'traditional': ['meat', 'vegetables', 'bread', 'dairy', 'salads', 'drinks'],
                'general': ['meat', 'vegetables', 'bread', 'dairy', 'drinks']
            };
            
            const requiredCategories = eventCategories[eventType] || eventCategories['general'];
            
            // Get products from MongoDB if available, otherwise use in-memory products
            let allAvailableProducts = products;
            if (db && products.length < 50) {
                try {
                    const productsCollection = db.collection('prouducts');
                    const mongoProducts = await productsCollection.find({}).limit(200).toArray();
                    if (mongoProducts && mongoProducts.length > 0) {
                        allAvailableProducts = mongoProducts.map(p => ({
                            id: p._id || p.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
                            _id: p._id,
                            name: p.name || p.name_ar || p.name_en,
                            name_ar: p.name_ar || p.name,
                            name_en: p.name_en || p.name,
                            price: parseFloat(p.price) || 0,
                            currency: p.currency || 'JOD',
                            category: p.category || 'general',
                            description: p.description || '',
                            store_name: p.store_name || '',
                            product_url: p.product_url || '#',
                            image_url: p.image_url || '',
                            calories_per_100g: p.calories_per_100g || null,
                            protein_per_100g: p.protein_per_100g || null,
                            carbs_per_100g: p.carbs_per_100g || null,
                            fats_per_100g: p.fats_per_100g || null,
                            is_gluten_free: p.is_gluten_free || false,
                            is_vegetarian: p.is_vegetarian || false,
                            is_vegan: p.is_vegan || false,
                            is_halal: p.is_halal || false,
                            is_organic: p.is_organic || false,
                            is_healthy: p.is_healthy || false
                        }));
                        console.log(`📦 Loaded ${allAvailableProducts.length} products from MongoDB for selection`);
                    }
                } catch (error) {
                    console.error('Error loading products from MongoDB:', error);
                }
            }
            
            // Select products from required categories, ensuring variety
            // IMPORTANT: Priority-based selection - essential products first!
            const selectedByCategory = {};
            
            // Define category priorities and quantities based on event type
            // Essential categories get more products and higher priority
            const categoryConfig = {
                'bbq': {
                    'meat': { priority: 1, count: 5, essential: true },      // Meat is ESSENTIAL for BBQ - get 5 products
                    'charcoal': { priority: 2, count: 2, essential: true },   // Charcoal is ESSENTIAL for BBQ
                    'vegetables': { priority: 3, count: 3, essential: false }, // Vegetables important but not essential
                    'bread': { priority: 4, count: 2, essential: false },
                    'drinks': { priority: 5, count: 2, essential: false },
                    'supplies': { priority: 6, count: 1, essential: false },
                    'salads': { priority: 7, count: 2, essential: false }
                },
                'dinner': {
                    'meat': { priority: 1, count: 4, essential: true },      // Meat is ESSENTIAL for dinner
                    'vegetables': { priority: 2, count: 3, essential: true }, // Vegetables important
                    'bread': { priority: 3, count: 2, essential: false },
                    'dairy': { priority: 4, count: 2, essential: false },
                    'salads': { priority: 5, count: 2, essential: false },
                    'drinks': { priority: 6, count: 2, essential: false }
                },
                'lunch': {
                    'meat': { priority: 1, count: 3, essential: true },
                    'vegetables': { priority: 2, count: 3, essential: true },
                    'bread': { priority: 3, count: 2, essential: false },
                    'salads': { priority: 4, count: 2, essential: false },
                    'drinks': { priority: 5, count: 2, essential: false }
                },
                'breakfast': {
                    'bread': { priority: 1, count: 3, essential: true },
                    'dairy': { priority: 2, count: 3, essential: true },
                    'fruits': { priority: 3, count: 2, essential: false },
                    'drinks': { priority: 4, count: 2, essential: false }
                },
                'party': {
                    'meat': { priority: 1, count: 4, essential: true },
                    'vegetables': { priority: 2, count: 3, essential: true },
                    'bread': { priority: 3, count: 2, essential: false },
                    'dairy': { priority: 4, count: 2, essential: false },
                    'drinks': { priority: 5, count: 3, essential: false },
                    'snacks': { priority: 6, count: 2, essential: false },
                    'fruits': { priority: 7, count: 2, essential: false }
                },
                'general': {
                    'meat': { priority: 1, count: 3, essential: true },
                    'vegetables': { priority: 2, count: 3, essential: true },
                    'bread': { priority: 3, count: 2, essential: false },
                    'dairy': { priority: 4, count: 2, essential: false },
                    'drinks': { priority: 5, count: 2, essential: false }
                }
            };
            
            const eventConfig = categoryConfig[eventType] || categoryConfig['general'];
            
            // Sort required categories by priority (essential categories first)
            const sortedCategories = [...requiredCategories].sort((a, b) => {
                const configA = eventConfig[a.toLowerCase()] || { priority: 99, essential: false };
                const configB = eventConfig[b.toLowerCase()] || { priority: 99, essential: false };
                
                // Essential categories first
                if (configA.essential && !configB.essential) return -1;
                if (!configA.essential && configB.essential) return 1;
                
                // Then by priority
                return configA.priority - configB.priority;
            });
            
            // Special handling for BBQ: Must have chicken, meat (non-chicken), and shish/kebab skewers
            const bbqEssentialProducts = {
                chicken: null,
                meat: null,
                shish: null
            };
            
            // Select products from each category based on priority and config
            sortedCategories.forEach(cat => {
                const config = eventConfig[cat.toLowerCase()] || { priority: 99, count: 2, essential: false };
                const count = config.count || 2;
                
                // For meat category (especially for BBQ), search by name/keywords too, not just category
                const meatKeywords = ['دجاج', 'جاج', 'فراخ', 'لحم', 'لحمة', 'لحوم', 'خروف', 'عجل', 'chicken', 'meat', 'beef', 'lamb', 'veal', 'grill'];
                const chickenKeywords = ['دجاج', 'جاج', 'فراخ', 'chicken', 'ديجاج'];
                const shishKeywords = ['شيش', 'شيشة', 'كبات', 'كبة', 'كاب', 'kebab', 'kabab', 'kabob', 'shish', 'shish kebab', 'skewer', 'سيخ', 'سيخ مشوي'];
                const nonChickenMeatKeywords = ['لحم', 'لحمة', 'لحوم', 'خروف', 'عجل', 'beef', 'lamb', 'veal', 'steak', 'كفته', 'كفتة'];
                const charcoalKeywords = ['فحم', 'charcoal', 'coal'];
                
                // Get products from this category OR by name/keywords (for meat and charcoal especially)
                let categoryProducts = allAvailableProducts.filter(p => {
                    const category = (p.category || 'general').toLowerCase();
                    const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''} ${p.description || ''}`.toLowerCase();
                    
                    // Match by category
                    if (category === cat.toLowerCase()) {
                        return true;
                    }
                    
                    // For meat category, also match by keywords in product name
                    if (cat === 'meat' && meatKeywords.some(keyword => productName.includes(keyword.toLowerCase()))) {
                        // Fix category for meat products found by keywords
                        if (p.category && (p.category || 'general').toLowerCase() !== 'meat') {
                            p.category = 'meat'; // Ensure it's categorized as meat
                        }
                        return true;
                    }
                    
                    // For charcoal category, also match by keywords
                    if (cat === 'charcoal' && charcoalKeywords.some(keyword => productName.includes(keyword.toLowerCase()))) {
                        return true;
                    }
                    
                    return false;
                }).filter(p => {
                    const price = parseFloat(p.price) || 0;
                    // For essential categories (especially meat), prefer mid-range prices
                    // For non-essential, prefer cheaper options
                    if (config.essential && cat === 'meat') {
                        // For meat: filter out extremely cheap (likely low quality) or extremely expensive
                        return price > 5 && price < 100; // Reasonable meat prices in Jordan (5-100 JOD)
                    }
                    // For other categories, prefer affordable but not the absolute cheapest
                    return price > 0 && price < (budget ? budget * 0.3 : 50);
                });
                
                if (categoryProducts.length > 0) {
                    // For BBQ meat category: Ensure we get chicken, non-chicken meat, and shish
                    if (eventType === 'bbq' && cat === 'meat') {
                        // Separate into: chicken, shish/kebab, other meat
                        const chickenProducts = categoryProducts.filter(p => {
                            const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                            return chickenKeywords.some(k => productName.includes(k.toLowerCase()));
                        });
                        
                        const shishProducts = categoryProducts.filter(p => {
                            const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                            return shishKeywords.some(k => productName.includes(k.toLowerCase()));
                        });
                        
                        const otherMeatProducts = categoryProducts.filter(p => {
                            const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                            const isChicken = chickenKeywords.some(k => productName.includes(k.toLowerCase()));
                            const isShish = shishKeywords.some(k => productName.includes(k.toLowerCase()));
                            return !isChicken && !isShish && nonChickenMeatKeywords.some(k => productName.includes(k.toLowerCase()));
                        });
                        
                        // Prioritize: 1. Chicken, 2. Shish, 3. Other meat
                        categoryProducts = [
                            ...chickenProducts.slice(0, 2),  // At least 1-2 chicken products
                            ...shishProducts.slice(0, 1),     // At least 1 shish product
                            ...otherMeatProducts.slice(0, 2), // At least 1-2 other meat products
                            ...categoryProducts.filter(p => {
                                const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                                const isChicken = chickenKeywords.some(k => productName.includes(k.toLowerCase()));
                                const isShish = shishKeywords.some(k => productName.includes(k.toLowerCase()));
                                const isOtherMeat = nonChickenMeatKeywords.some(k => productName.includes(k.toLowerCase()));
                                return !isChicken && !isShish && !isOtherMeat;
                            }).slice(0, 2) // Other products if needed
                        ].slice(0, count);
                        
                        // Store essential BBQ products
                        if (chickenProducts.length > 0 && !bbqEssentialProducts.chicken) {
                            bbqEssentialProducts.chicken = chickenProducts[0];
                        }
                        if (shishProducts.length > 0 && !bbqEssentialProducts.shish) {
                            bbqEssentialProducts.shish = shishProducts[0];
                        }
                        if (otherMeatProducts.length > 0 && !bbqEssentialProducts.meat) {
                            bbqEssentialProducts.meat = otherMeatProducts[0];
                        }
                    }
                    
                    // Sort products: prioritize exact category match, then by name keywords, then by price
                    categoryProducts.sort((a, b) => {
                        const categoryA = (a.category || 'general').toLowerCase();
                        const categoryB = (b.category || 'general').toLowerCase();
                        const productNameA = `${a.name || ''} ${a.name_ar || ''} ${a.name_en || ''}`.toLowerCase();
                        const productNameB = `${b.name || ''} ${b.name_ar || ''} ${b.name_en || ''}`.toLowerCase();
                        
                        // First: prioritize products with correct category
                        if (categoryA === cat.toLowerCase() && categoryB !== cat.toLowerCase()) return -1;
                        if (categoryA !== cat.toLowerCase() && categoryB === cat.toLowerCase()) return 1;
                        
                        // Second: for meat, prioritize chicken/djaj (most common for BBQ)
                        if (cat === 'meat' && eventType !== 'bbq') {
                            const hasChickenA = chickenKeywords.some(k => productNameA.includes(k));
                            const hasChickenB = chickenKeywords.some(k => productNameB.includes(k));
                            if (hasChickenA && !hasChickenB) return -1;
                            if (!hasChickenA && hasChickenB) return 1;
                        }
                        
                        // For BBQ meat: prioritize order: chicken > shish > other meat
                        if (cat === 'meat' && eventType === 'bbq') {
                            const hasChickenA = chickenKeywords.some(k => productNameA.includes(k));
                            const hasChickenB = chickenKeywords.some(k => productNameB.includes(k));
                            const hasShishA = shishKeywords.some(k => productNameA.includes(k));
                            const hasShishB = shishKeywords.some(k => productNameB.includes(k));
                            
                            // Chicken first
                            if (hasChickenA && !hasChickenB) return -1;
                            if (!hasChickenA && hasChickenB) return 1;
                            
                            // Then shish
                            if (hasShishA && !hasShishB) return -1;
                            if (!hasShishA && hasShishB) return 1;
                        }
                        
                        // Third: sort by price (mid-range for essential meat, cheapest for others)
                        if (config.essential && cat === 'meat') {
                            // For meat: prefer mid-range prices (better quality/value balance)
                            const priceA = parseFloat(a.price) || 0;
                            const priceB = parseFloat(b.price) || 0;
                            // Sort by distance from median price (prefer middle range)
                            const medianPrice = (Math.max(...categoryProducts.map(p => parseFloat(p.price) || 0)) + 
                                                Math.min(...categoryProducts.map(p => parseFloat(p.price) || 0))) / 2;
                            const distA = Math.abs(priceA - medianPrice);
                            const distB = Math.abs(priceB - medianPrice);
                            if (Math.abs(distA - distB) < 5) {
                                // If similar distance, prefer slightly cheaper
                                return priceA - priceB;
                            }
                            return distA - distB;
                        } else {
                            // For other categories, sort by price (affordable first)
                            return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
                        }
                    });
                    
                    // Take specified count (more for essential categories like meat)
                    selectedByCategory[cat] = categoryProducts.slice(0, count);
                    const meatNames = selectedByCategory[cat].slice(0, 3).map(p => p.name_ar || p.name || p.name_en).join(', ');
                    console.log(`✅ Selected ${selectedByCategory[cat].length} ${config.essential ? 'ESSENTIAL' : ''} products from category: ${cat} (priority: ${config.priority}) - Examples: ${meatNames}`);
                } else {
                    console.log(`⚠️ No products found for category: ${cat} - trying broader search...`);
                    // Fallback: search more broadly for meat (even without category)
                    if (cat === 'meat' && config.essential) {
                        const meatProducts = allAvailableProducts.filter(p => {
                            const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''} ${p.description || ''}`.toLowerCase();
                            return meatKeywords.some(keyword => productName.includes(keyword.toLowerCase()));
                        }).filter(p => {
                            const price = parseFloat(p.price) || 0;
                            return price > 5 && price < 100;
                        }).sort((a, b) => {
                            const priceA = parseFloat(a.price) || 0;
                            const priceB = parseFloat(b.price) || 0;
                            // Prioritize chicken
                            const productNameA = `${a.name || ''} ${a.name_ar || ''} ${a.name_en || ''}`.toLowerCase();
                            const productNameB = `${b.name || ''} ${b.name_ar || ''} ${b.name_en || ''}`.toLowerCase();
                            const chickenKeywords = ['دجاج', 'جاج', 'فراخ', 'chicken'];
                            const hasChickenA = chickenKeywords.some(k => productNameA.includes(k));
                            const hasChickenB = chickenKeywords.some(k => productNameB.includes(k));
                            if (hasChickenA && !hasChickenB) return -1;
                            if (!hasChickenA && hasChickenB) return 1;
                            return priceA - priceB;
                        }).slice(0, count);
                        
                        if (meatProducts.length > 0) {
                            // Fix category for meat products found by keywords (ensure they're categorized as 'meat')
                            meatProducts.forEach(p => {
                                if ((p.category || 'general').toLowerCase() !== 'meat') {
                                    p.category = 'meat';
                                    console.log(`🔧 Fixed category for product: ${p.name_ar || p.name || p.name_en} -> meat`);
                                }
                            });
                            selectedByCategory[cat] = meatProducts;
                            const meatNames = meatProducts.slice(0, 3).map(p => p.name_ar || p.name || p.name_en).join(', ');
                            console.log(`✅ Found ${meatProducts.length} meat products by name/keywords (ESSENTIAL) - Examples: ${meatNames}`);
                        }
                    }
                }
            });
            
            // For BBQ: Ensure essential products (chicken, meat, shish) are always included
            if (eventType === 'bbq') {
                const shishSearchKeywords = ['شيش', 'شيشة', 'كبات', 'كبة', 'كاب', 'kebab', 'kabab', 'kabob', 'shish', 'shish kebab', 'skewer', 'سيخ', 'سيخ مشوي'];
                const chickenSearchKeywords = ['دجاج', 'جاج', 'فراخ', 'chicken', 'ديجاج'];
                const nonChickenMeatSearchKeywords = ['لحم', 'لحمة', 'لحوم', 'خروف', 'عجل', 'beef', 'lamb', 'veal', 'steak', 'كفته', 'كفتة'];
                
                // Search for shish/kebab if not already found in selectedByCategory
                if (!bbqEssentialProducts.shish || !selectedByCategory['meat'] || !selectedByCategory['meat'].some(p => {
                    const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                    return shishSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                })) {
                    const allShishProducts = allAvailableProducts.filter(p => {
                        const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''} ${p.description || ''}`.toLowerCase();
                        return shishSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                    }).filter(p => {
                        const price = parseFloat(p.price) || 0;
                        return price > 5 && price < 100;
                    });
                    
                    if (allShishProducts.length > 0) {
                        const shishProduct = allShishProducts[0];
                        if (shishProduct.category && (shishProduct.category || 'general').toLowerCase() !== 'meat') {
                            shishProduct.category = 'meat';
                        }
                        if (!selectedByCategory['meat']) {
                            selectedByCategory['meat'] = [];
                        }
                        selectedByCategory['meat'].unshift(shishProduct); // Add at beginning
                        console.log(`🍢 Added essential shish/kebab product to BBQ list: ${shishProduct.name_ar || shishProduct.name || shishProduct.name_en}`);
                    }
                }
                
                // Ensure chicken is included if not already
                if (!selectedByCategory['meat'] || !selectedByCategory['meat'].some(p => {
                    const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                    return chickenSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                })) {
                    const allChickenProducts = allAvailableProducts.filter(p => {
                        const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''} ${p.description || ''}`.toLowerCase();
                        return chickenSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                    }).filter(p => {
                        const price = parseFloat(p.price) || 0;
                        return price > 5 && price < 100;
                    });
                    
                    if (allChickenProducts.length > 0) {
                        const chickenProduct = allChickenProducts[0];
                        if (chickenProduct.category && (chickenProduct.category || 'general').toLowerCase() !== 'meat') {
                            chickenProduct.category = 'meat';
                        }
                        if (!selectedByCategory['meat']) {
                            selectedByCategory['meat'] = [];
                        }
                        selectedByCategory['meat'].unshift(chickenProduct);
                        console.log(`🍗 Added essential chicken product to BBQ list: ${chickenProduct.name_ar || chickenProduct.name || chickenProduct.name_en}`);
                    }
                }
                
                // Ensure non-chicken meat is included if not already
                if (!selectedByCategory['meat'] || !selectedByCategory['meat'].some(p => {
                    const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                    const isChicken = chickenSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                    const isShish = shishSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                    return !isChicken && !isShish && nonChickenMeatSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                })) {
                    const allOtherMeatProducts = allAvailableProducts.filter(p => {
                        const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''} ${p.description || ''}`.toLowerCase();
                        const isChicken = chickenSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                        const isShish = shishSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                        return !isChicken && !isShish && nonChickenMeatSearchKeywords.some(k => productName.includes(k.toLowerCase()));
                    }).filter(p => {
                        const price = parseFloat(p.price) || 0;
                        return price > 5 && price < 100;
                    });
                    
                    if (allOtherMeatProducts.length > 0) {
                        const meatProduct = allOtherMeatProducts[0];
                        if (meatProduct.category && (meatProduct.category || 'general').toLowerCase() !== 'meat') {
                            meatProduct.category = 'meat';
                        }
                        if (!selectedByCategory['meat']) {
                            selectedByCategory['meat'] = [];
                        }
                        selectedByCategory['meat'].push(meatProduct);
                        console.log(`🥩 Added essential meat product to BBQ list: ${meatProduct.name_ar || meatProduct.name || meatProduct.name_en}`);
                    }
                }
            }
            
            // Combine products from all categories
            Object.values(selectedByCategory).forEach(products => {
                selectedProducts.push(...products);
            });
            
            // Combine relevant products (shown in chat) with products from categories
            // IMPORTANT: Include ALL relevant products shown in chat message
            const combinedProducts = [];
            const productIdsAdded = new Set();
            
            // First priority: Add ALL relevant products (these match the search and are shown in chat)
            relevantProducts.forEach(p => {
                if (!productIdsAdded.has(p.id || p._id)) {
                    combinedProducts.push(p);
                    productIdsAdded.add(p.id || p._id);
                }
            });
            
            // Second priority: For BBQ, add essential products first (chicken, shish, meat)
            if (eventType === 'bbq' && selectedByCategory['meat']) {
                const meatProducts = selectedByCategory['meat'];
                const chickenProducts = meatProducts.filter(p => {
                    const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                    return ['دجاج', 'جاج', 'فراخ', 'chicken', 'ديجاج'].some(k => productName.includes(k.toLowerCase()));
                });
                const shishProducts = meatProducts.filter(p => {
                    const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                    return ['شيش', 'شيشة', 'كبات', 'كبة', 'كاب', 'kebab', 'kabab', 'kabob', 'shish', 'shish kebab', 'skewer', 'سيخ', 'سيخ مشوي'].some(k => productName.includes(k.toLowerCase()));
                });
                const otherMeatProducts = meatProducts.filter(p => {
                    const productName = `${p.name || ''} ${p.name_ar || ''} ${p.name_en || ''}`.toLowerCase();
                    const isChicken = ['دجاج', 'جاج', 'فراخ', 'chicken', 'ديجاج'].some(k => productName.includes(k.toLowerCase()));
                    const isShish = ['شيش', 'شيشة', 'كبات', 'كبة', 'كاب', 'kebab', 'kabab', 'kabob', 'shish', 'shish kebab', 'skewer', 'سيخ', 'سيخ مشوي'].some(k => productName.includes(k.toLowerCase()));
                    return !isChicken && !isShish;
                });
                
                // Add in priority order: chicken first, then shish, then other meat
                [...chickenProducts, ...shishProducts, ...otherMeatProducts].forEach(p => {
                    if (!productIdsAdded.has(p.id || p._id)) {
                        combinedProducts.push(p);
                        productIdsAdded.add(p.id || p._id);
                    }
                });
            }
            
            // Add products from other categories
            Object.entries(selectedByCategory).forEach(([cat, categoryProducts]) => {
                if (eventType === 'bbq' && cat === 'meat') {
                    // Already added above, skip
                    return;
                }
                categoryProducts.forEach(p => {
                    if (!productIdsAdded.has(p.id || p._id)) {
                        combinedProducts.push(p);
                        productIdsAdded.add(p.id || p._id);
                    }
                });
            });
            
            // Sort by priority and price (relevant products are already first)
            // Use event-specific category priorities from config (already defined above)
            
            combinedProducts.sort((a, b) => {
                // Keep relevant products first (they're already first, but ensure it)
                const aIsRelevant = relevantProducts.some(rp => (rp.id || rp._id) === (a.id || a._id));
                const bIsRelevant = relevantProducts.some(rp => (rp.id || rp._id) === (b.id || b._id));
                if (aIsRelevant && !bIsRelevant) return -1;
                if (!aIsRelevant && bIsRelevant) return 1;
                
                // Then sort by category priority based on event type
                const categoryA = (a.category || 'general').toLowerCase();
                const categoryB = (b.category || 'general').toLowerCase();
                const configA = eventConfig[categoryA] || { priority: 99, essential: false };
                const configB = eventConfig[categoryB] || { priority: 99, essential: false };
                
                // Essential categories first (especially meat)
                if (configA.essential && !configB.essential) return -1;
                if (!configA.essential && configB.essential) return 1;
                
                // Then by priority number
                if (configA.priority !== configB.priority) {
                    return configA.priority - configB.priority;
                }
                
                // For same priority, sort by price (affordable first)
                return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
            });
            
            // Pre-filter products by price if budget is specified
            // This ensures we only consider affordable products
            let affordableProducts = [...combinedProducts];
            
            if (budget) {
                // Filter out products that are too expensive even for 1 unit
                // Consider a product too expensive if 1 unit is more than 40% of total budget
                const maxSingleProductPrice = budget * 0.4;
                
                affordableProducts = affordableProducts.filter(p => {
                    const price = parseFloat(p.price) || 0;
                    // Keep products that are reasonably priced
                    // Or if they're relevant products, keep them even if expensive (we'll reduce quantity)
                    const isRelevant = relevantProducts.some(rp => (rp.id || rp._id) === (p.id || p._id));
                    
                    if (price <= maxSingleProductPrice) {
                        return true; // Affordable
                    } else if (isRelevant && price <= budget) {
                        return true; // Relevant but expensive - we'll handle with quantity reduction
                    } else {
                        console.log(`⚠️ Filtering out ${p.name} - too expensive (${price.toFixed(2)} JOD > ${maxSingleProductPrice.toFixed(2)} JOD)`);
                        return false; // Too expensive
                    }
                });
                
                // Sort by price (cheaper first) to maximize items within budget
                affordableProducts.sort((a, b) => {
                    const priceA = parseFloat(a.price) || 0;
                    const priceB = parseFloat(b.price) || 0;
                    return priceA - priceB;
                });
                
                console.log(`💰 Pre-filtered ${affordableProducts.length} affordable products (from ${combinedProducts.length} total) for budget ${budget} JOD`);
            }
            
            // Limit to reasonable number - but ensure all relevant products are included
            const maxProducts = budget 
                ? Math.min(relevantProducts.length + 10, numPeople > 10 ? 20 : numPeople > 5 ? 15 : 12)
                : Math.max(relevantProducts.length, numPeople > 10 ? 20 : numPeople > 5 ? 15 : 12);
            const finalProducts = affordableProducts.slice(0, maxProducts);
            
            console.log(`🛒 Final ${finalProducts.length} products for list (${relevantProducts.length} relevant from chat + ${finalProducts.length - relevantProducts.length} additional from categories) for ${eventType} event`);
            
            // If budget is specified, allocate budget across categories based on event type
            let categoryBudgetAllocation = null;
            if (budget) {
                // Allocate budget percentage by category based on event type
                const categoryAllocations = {
                    'bbq': {
                        'meat': 0.35,      // 35% for BBQ - meat is main focus
                        'vegetables': 0.15, // 15% for vegetables/salads
                        'bread': 0.10,     // 10% for bread
                        'drinks': 0.15,    // 15% for drinks
                        'charcoal': 0.05,  // 5% for charcoal/supplies
                        'supplies': 0.05,
                        'fruits': 0.10,    // 10% for fruits
                        'dairy': 0.05      // 5% for dairy
                    },
                    'dinner': {
                        'meat': 0.30,
                        'vegetables': 0.20,
                        'bread': 0.10,
                        'drinks': 0.15,
                        'fruits': 0.15,
                        'dairy': 0.10
                    },
                    'lunch': {
                        'meat': 0.25,
                        'vegetables': 0.25,
                        'bread': 0.15,
                        'drinks': 0.15,
                        'fruits': 0.15,
                        'dairy': 0.05
                    },
                    'party': {
                        'meat': 0.30,
                        'vegetables': 0.20,
                        'bread': 0.10,
                        'drinks': 0.20,
                        'fruits': 0.15,
                        'dairy': 0.05
                    },
                    'general': {
                        'meat': 0.30,
                        'vegetables': 0.20,
                        'bread': 0.10,
                        'drinks': 0.15,
                        'fruits': 0.15,
                        'dairy': 0.10
                    }
                };
                
                const allocation = categoryAllocations[eventType] || categoryAllocations['general'];
                categoryBudgetAllocation = {};
                for (const [category, percentage] of Object.entries(allocation)) {
                    categoryBudgetAllocation[category] = budget * percentage;
                }
                
                console.log(`💰 Budget allocation for ${eventType}:`, categoryBudgetAllocation);
            }
            
            // Create shopping list items with calculated quantities
            const listItems = [];
            let runningTotal = 0;
            const categorySpent = {}; // Track spending per category
            
            // Build list item by item, STRICTLY respecting budget
            console.log(`💰 Building shopping list with budget: ${budget ? budget + ' JOD' : 'no limit'}, ${budget ? 'budget-based quantities' : 'people-based quantities'}`);
            
            for (const p of finalProducts) {
                const unitPrice = parseFloat(p.price) || 0;
                
                // Skip products with invalid price
                if (!unitPrice || unitPrice <= 0) {
                    console.log(`⚠️ Skipping product ${p.name} - invalid price: ${unitPrice}`);
                    continue;
                }
                
                const category = (p.category || 'general').toLowerCase();
                
                // Calculate quantity based on budget if specified, otherwise based on number of people
                let quantity;
                let categoryBudget = categoryBudgetAllocation ? (categoryBudgetAllocation[category] || categoryBudgetAllocation['general'] || (budget ? budget * 0.15 : null)) : null;
                let categoryRemaining = categoryBudget ? (categoryBudget - (categorySpent[category] || 0)) : null;
                const overallRemaining = budget ? (budget - runningTotal) : null;
                
                if (budget && categoryBudget) {
                    // BUDGET-BASED: Calculate quantity based on category budget allocation
                    if (categoryRemaining > 0 && overallRemaining > 0) {
                        // Use category budget to calculate quantity (don't exceed overall budget)
                        const maxCategoryQuantity = Math.floor(categoryRemaining / unitPrice);
                        const maxOverallQuantity = Math.floor(overallRemaining / unitPrice);
                        const maxQuantity = Math.min(maxCategoryQuantity, maxOverallQuantity);
                        
                        if (maxQuantity > 0) {
                            // Calculate reasonable quantity based on category budget
                            // Allocate 50-70% of category remaining budget for this product (for diversity)
                            const allocatedForProduct = categoryRemaining * 0.6; // 60% for this product
                            quantity = Math.max(1, Math.min(maxQuantity, Math.floor(allocatedForProduct / unitPrice)));
                            
                            // Ensure we don't exceed category or overall budget
                            quantity = Math.min(quantity, maxQuantity);
                            
                            console.log(`💰 ${p.name} (${category}): Quantity ${quantity} based on category budget ${categoryRemaining.toFixed(2)} JOD (remaining: ${(categoryRemaining - (quantity * unitPrice)).toFixed(2)})`);
                        } else {
                            console.log(`⚠️ Skipping ${p.name} - cannot afford even 1 unit (category remaining: ${categoryRemaining.toFixed(2)}, overall remaining: ${overallRemaining.toFixed(2)})`);
                            continue;
                        }
                    } else {
                        // Category or overall budget exhausted
                        console.log(`⚠️ Skipping ${p.name} - budget exhausted (category: ${categoryRemaining?.toFixed(2) || 0}, overall: ${overallRemaining?.toFixed(2) || 0})`);
                        continue;
                    }
                } else {
                    // NO BUDGET SPECIFIED: Calculate based on number of people (realistic portions)
                    quantity = calculateQuantity(p, numPeople, eventType);
                    console.log(`👥 ${p.name} (${category}): Quantity ${quantity} based on ${numPeople} people (no budget specified)`);
                }
                
                let itemTotal = unitPrice * quantity;
                
                // Verify quantity fits within remaining budgets
                if (budget) {
                    if (itemTotal > overallRemaining) {
                        // Reduce quantity to fit in overall budget
                        quantity = Math.max(1, Math.floor(overallRemaining / unitPrice));
                        itemTotal = unitPrice * quantity;
                        console.log(`📉 Reduced ${p.name} quantity to ${quantity} to fit overall budget`);
                    }
                    
                    if (categoryBudget && itemTotal > categoryRemaining) {
                        // Reduce quantity to fit in category budget
                        quantity = Math.max(1, Math.min(quantity, Math.floor(categoryRemaining / unitPrice)));
                        itemTotal = unitPrice * quantity;
                        console.log(`📉 Reduced ${p.name} quantity to ${quantity} to fit category budget`);
                    }
                }
                
                // Final verification - ensure quantity fits within remaining budgets
                if (budget) {
                    const overallRemainingFinal = budget - runningTotal;
                    
                    // Check if we exceed overall budget
                    if (itemTotal > overallRemainingFinal) {
                        if (overallRemainingFinal <= 0) {
                            console.log(`⚠️ Skipping ${p.name} - overall budget exhausted (${runningTotal.toFixed(2)}/${budget} JOD)`);
                            continue;
                        }
                        // Reduce quantity to fit in remaining overall budget
                        quantity = Math.max(1, Math.floor(overallRemainingFinal / unitPrice));
                        itemTotal = unitPrice * quantity;
                        if (quantity < calculateQuantity(p, numPeople, eventType)) {
                            console.log(`📉 Reduced ${p.name} quantity to ${quantity} to fit overall budget (remaining: ${overallRemainingFinal.toFixed(2)} JOD)`);
                        }
                    }
                    
                    // Check if we exceed category budget (if allocated)
                    if (categoryBudgetAllocation && categoryBudget) {
                        const categoryRemainingFinal = categoryBudget - (categorySpent[category] || 0);
                        if (itemTotal > categoryRemainingFinal && categoryRemainingFinal > 0) {
                            // Reduce quantity to fit in category budget
                            const maxCategoryQuantity = Math.floor(categoryRemainingFinal / unitPrice);
                            if (maxCategoryQuantity < quantity) {
                                quantity = Math.max(1, maxCategoryQuantity);
                                itemTotal = unitPrice * quantity;
                                console.log(`📉 Reduced ${p.name} quantity to ${quantity} to fit category budget (${category}: remaining ${categoryRemainingFinal.toFixed(2)} JOD)`);
                            }
                        } else if (categoryRemainingFinal <= 0) {
                            // Category budget exhausted, skip unless overall budget allows
                            const overallRemainingFinal = budget - runningTotal;
                            if (overallRemainingFinal <= 0 || unitPrice > overallRemainingFinal) {
                                console.log(`⚠️ Skipping ${p.name} - category budget exhausted (${category}: ${categoryBudget.toFixed(2)} JOD spent)`);
                                continue;
                            }
                            // Use minimal quantity if overall budget allows
                            quantity = Math.max(1, Math.min(quantity, Math.floor(overallRemainingFinal / unitPrice)));
                            itemTotal = unitPrice * quantity;
                            console.log(`📉 ${p.name} - category budget exhausted, using minimal quantity ${quantity} from overall budget`);
                        }
                    }
                    
                    // Final check - ensure we don't exceed overall budget
                    if (runningTotal + itemTotal > budget) {
                        console.log(`❌ ERROR: Cannot fit ${p.name} within budget. Skipping.`);
                        continue;
                    }
                }
                
                // Add item - it fits within budget
                listItems.push({
                    productId: p.id || p._id,
                    id: p.id || p._id,
                    _id: p._id || p.id,
                    name: p.name || p.name_ar || p.name_en,
                    name_ar: p.name_ar || p.name || p.name_en,
                    name_en: p.name_en || p.name || p.name_ar,
                    quantity: quantity,
                    unit_price: unitPrice,
                    currency: p.currency || 'JOD',
                    category: p.category || 'general',
                    image_url: p.image_url || 'https://via.placeholder.com/80?text=No+Image',
                    product_url: p.product_url || '#',
                    description: p.description || '',
                    store_name: p.store_name || '',
                    calories_per_100g: p.calories_per_100g || null,
                    protein_per_100g: p.protein_per_100g || null,
                    carbs_per_100g: p.carbs_per_100g || null,
                    fats_per_100g: p.fats_per_100g || null,
                    fiber_per_100g: p.fiber_per_100g || null,
                    is_gluten_free: p.is_gluten_free || false,
                    is_vegetarian: p.is_vegetarian || false,
                    is_vegan: p.is_vegan || false,
                    is_halal: p.is_halal || false,
                    is_healthy: p.is_healthy || false,
                    is_organic: p.is_organic || false
                });
                
                // Update running totals
                runningTotal += itemTotal;
                if (categoryBudgetAllocation) {
                    categorySpent[category] = (categorySpent[category] || 0) + itemTotal;
                }
                
                console.log(`✅ Added ${p.name} (${category}, ${quantity}x ${unitPrice.toFixed(2)} = ${itemTotal.toFixed(2)} JOD). Running total: ${runningTotal.toFixed(2)}/${budget || 'unlimited'} JOD${categoryBudgetAllocation ? `, Category (${category}): ${categorySpent[category].toFixed(2)}/${(categoryBudgetAllocation[category] || 0).toFixed(2)} JOD` : ''}`);
                
                // Continue adding products until we're very close to budget (98% or more)
                // Don't stop early - try to use the full budget
                if (budget && runningTotal >= budget * 0.98) {
                    console.log(`🛑 Budget nearly reached (${runningTotal.toFixed(2)}/${budget} JOD, ${((runningTotal/budget)*100).toFixed(1)}%). Will try to fill remaining budget.`);
                    // Don't break - continue to see if we can add more small items
                }
            }
            
            // After first pass, try to fill remaining budget by:
            // 1. Increasing quantities of existing items
            // 2. Adding more affordable products
            if (budget && listItems.length > 0) {
                let currentTotal = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                let remainingBudget = budget - currentTotal;
                
                console.log(`💰 First pass complete: ${currentTotal.toFixed(2)}/${budget} JOD (${((currentTotal/budget)*100).toFixed(1)}%). Remaining: ${remainingBudget.toFixed(2)} JOD`);
                
                if (remainingBudget > 0.5) { // If more than 0.5 JOD remaining, try to fill it
                    console.log(`🔄 Attempting to fill remaining budget (${remainingBudget.toFixed(2)} JOD)...`);
                    
                    // Strategy 1: Increase quantities of existing affordable items
                    for (let i = 0; i < listItems.length; i++) {
                        const item = listItems[i];
                        const itemPrice = item.unit_price;
                        
                        // Recalculate remaining budget
                        currentTotal = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                        remainingBudget = budget - currentTotal;
                        
                        if (remainingBudget <= 0.5) break;
                        
                        // If item is affordable and we have budget, try to add more
                        if (itemPrice <= remainingBudget && itemPrice <= budget * 0.1) { // Only for items < 10% of budget
                            const maxAdditional = Math.floor(remainingBudget / itemPrice);
                            if (maxAdditional > 0) {
                                const additionalQty = Math.min(maxAdditional, 2); // Add max 2 more units
                                const additionalCost = itemPrice * additionalQty;
                                
                                if (currentTotal + additionalCost <= budget) {
                                    item.quantity += additionalQty;
                                    console.log(`➕ Increased ${item.name} quantity by ${additionalQty} (now ${item.quantity} units, +${additionalCost.toFixed(2)} JOD)`);
                                }
                            }
                        }
                    }
                    
                    // Recalculate total after quantity increases
                    currentTotal = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                    remainingBudget = budget - currentTotal;
                    
                    // Strategy 2: Add more affordable products that weren't added yet
                    if (remainingBudget > 1) { // If more than 1 JOD remaining
                        console.log(`🔄 Still ${remainingBudget.toFixed(2)} JOD remaining. Looking for additional affordable products...`);
                        
                        // Find affordable products not yet in list
                        const addedProductIds = new Set(listItems.map(item => item.id || item._id));
                        const affordableNotAdded = affordableProducts.filter(p => {
                            const price = parseFloat(p.price) || 0;
                            return !addedProductIds.has(p.id || p._id) && 
                                   price > 0 && 
                                   price <= remainingBudget && 
                                   price <= budget * 0.15; // Products < 15% of budget
                        });
                        
                        // Sort by price (cheaper first) to maximize items
                        affordableNotAdded.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
                        
                        // Add affordable products until budget is filled
                        for (const p of affordableNotAdded) {
                            // Recalculate remaining budget
                            currentTotal = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                            remainingBudget = budget - currentTotal;
                            
                            if (remainingBudget <= 0.5) break;
                            
                            const unitPrice = parseFloat(p.price) || 0;
                            const maxQty = Math.floor(remainingBudget / unitPrice);
                            
                            if (maxQty > 0) {
                                const quantity = Math.min(maxQty, 2); // Max 2 units
                                const itemTotal = unitPrice * quantity;
                                
                                if (currentTotal + itemTotal <= budget) {
                                    listItems.push({
                                        productId: p.id || p._id,
                                        id: p.id || p._id,
                                        _id: p._id || p.id,
                                        name: p.name || p.name_ar || p.name_en,
                                        name_ar: p.name_ar || p.name || p.name_en,
                                        name_en: p.name_en || p.name || p.name_ar,
                                        quantity: quantity,
                                        unit_price: unitPrice,
                                        currency: p.currency || 'JOD',
                                        category: p.category || 'general',
                                        image_url: p.image_url || 'https://via.placeholder.com/80?text=No+Image',
                                        product_url: p.product_url || '#',
                                        description: p.description || '',
                                        store_name: p.store_name || '',
                                        calories_per_100g: p.calories_per_100g || null,
                                        protein_per_100g: p.protein_per_100g || null,
                                        carbs_per_100g: p.carbs_per_100g || null,
                                        fats_per_100g: p.fats_per_100g || null,
                                        fiber_per_100g: p.fiber_per_100g || null,
                                        is_gluten_free: p.is_gluten_free || false,
                                        is_vegetarian: p.is_vegetarian || false,
                                        is_vegan: p.is_vegan || false,
                                        is_halal: p.is_halal || false,
                                        is_healthy: p.is_healthy || false,
                                        is_organic: p.is_organic || false
                                    });
                                    
                                    console.log(`➕ Added ${p.name} (${quantity}x ${unitPrice.toFixed(2)} = ${itemTotal.toFixed(2)} JOD) to fill budget`);
                                    
                                    // Check if we've filled the budget
                                    currentTotal = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                                    if (currentTotal >= budget * 0.98) {
                                        console.log(`✅ Budget filled: ${currentTotal.toFixed(2)}/${budget} JOD (${((currentTotal/budget)*100).toFixed(1)}%)`);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Final total
                    currentTotal = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                    remainingBudget = budget - currentTotal;
                    console.log(`💰 Final budget usage: ${currentTotal.toFixed(2)}/${budget} JOD (${((currentTotal/budget)*100).toFixed(1)}%), Remaining: ${remainingBudget.toFixed(2)} JOD`);
                }
            }
            
            // Calculate final total cost
            let totalCost = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
            
            // Final verification - ensure total cost is within budget
            if (budget && totalCost > budget) {
                console.error(`❌ CRITICAL ERROR: Total cost ${totalCost.toFixed(2)} JOD exceeds budget ${budget} JOD!`);
                console.error(`   Items count: ${listItems.length}`);
                console.error(`   This should not happen - fixing by removing/reducing expensive items...`);
                
                // Remove most expensive items until within budget
                listItems.sort((a, b) => (b.unit_price * b.quantity) - (a.unit_price * a.quantity));
                let fixedTotal = 0;
                const fixedItems = [];
                
                for (const item of listItems) {
                    const itemCost = item.unit_price * item.quantity;
                    if (fixedTotal + itemCost <= budget) {
                        fixedItems.push(item);
                        fixedTotal += itemCost;
                    } else {
                        // Try with reduced quantity (only for relevant products)
                        const remaining = budget - fixedTotal;
                        if (remaining > 0 && item.unit_price <= remaining) {
                            const isRelevant = relevantProducts.some(rp => (rp.id || rp._id) === (item.id || item._id));
                            if (isRelevant) {
                                // For relevant products, try with minimal quantity
                                const reducedQty = Math.floor(remaining / item.unit_price);
                                if (reducedQty > 0) {
                                    const fixedItem = { ...item, quantity: reducedQty };
                                    fixedItems.push(fixedItem);
                                    fixedTotal += item.unit_price * reducedQty;
                                    console.log(`📉 Reduced ${item.name} to ${reducedQty} units to fit budget`);
                                }
                            }
                            // Skip non-relevant products if they don't fit
                        }
                    }
                }
                
                listItems = fixedItems;
                totalCost = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                console.log(`✅ Fixed: Removed/reduced expensive items. New total: ${totalCost.toFixed(2)}/${budget} JOD (${((totalCost/budget)*100).toFixed(1)}%)`);
            }
            
            shoppingList = {
                items: listItems,
                total_cost: totalCost,
                num_people: numPeople,
                budget: budget,
                event_type: eventType,
                created_at: new Date().toISOString()
            };
            
            console.log(`📋 Final shopping list: ${listItems.length} items, Total: ${totalCost.toFixed(2)} JOD${budget ? `/${budget} JOD budget (${((totalCost/budget)*100).toFixed(1)}%)` : ''}`);
            
            // Update AI response to include budget info
            if (listItems.length > 0 && numPeople > 1) {
                const isArabic = /[\u0600-\u06FF]/.test(message);
                const finalTotalCost = listItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
                
                // Check if user specified budget (from Smart Planner or message)
                const budgetPatterns = [
                    /(?:budget|ميزانية|حدود|maximum|أقل من|على|لـ|for)\s*(\d+)\s*(?:jod|jd|دينار|dinar)?/i,
                    /(\d+)\s*(?:jod|jd|دينار|dinar)\s*(?:budget|ميزانية|حدود)?/i,
                    /(?:limit|حد|to|إلى)\s*(\d+)\s*(?:jod|jd|دينار|dinar)?/i
                ];
                let userSpecifiedBudget = fromSmartPlanner && budget !== null;
                if (!userSpecifiedBudget) {
                    for (const pattern of budgetPatterns) {
                        if (message.match(pattern)) {
                            userSpecifiedBudget = true;
                            break;
                        }
                    }
                }
                
                if (budget && userSpecifiedBudget) {
                    // User specified budget (from Smart Planner or message)
                    const budgetStatus = finalTotalCost <= budget 
                        ? (isArabic ? `✅ ضمن الميزانية المحددة (${finalTotalCost.toFixed(2)} من ${budget} دينار)` : `✅ Within specified budget (${finalTotalCost.toFixed(2)} of ${budget} JOD)`)
                        : (isArabic ? `⚠️ تجاوز الميزانية (${finalTotalCost.toFixed(2)} من ${budget} دينار)` : `⚠️ Over budget (${finalTotalCost.toFixed(2)} of ${budget} JOD)`);
                    
                    aiResponse += (isArabic ? `\n\n💰 ${budgetStatus}` : `\n\n💰 ${budgetStatus}`);
                } else if (budget) {
                    // Auto-calculated budget based on Jordanian prices
                    const budgetStatus = finalTotalCost <= budget 
                        ? (isArabic 
                            ? `✅ ضمن الميزانية المنطقية (${finalTotalCost.toFixed(2)} من ${budget} دينار المقترحة لـ ${numPeople} أشخاص)`
                            : `✅ Within calculated budget (${finalTotalCost.toFixed(2)} of ${budget} JOD suggested for ${numPeople} people)`)
                        : (isArabic 
                            ? `⚠️ تجاوز الميزانية المقترحة (${finalTotalCost.toFixed(2)} من ${budget} دينار)`
                            : `⚠️ Over suggested budget (${finalTotalCost.toFixed(2)} of ${budget} JOD)`);
                    
                    aiResponse += (isArabic 
                        ? `\n\n💰 ${budgetStatus}\n💡 الميزانية المقدرة: ${budget} دينار (~${(budget/numPeople).toFixed(2)} دينار للشخص) بناءً على أسعار الأردن`
                        : `\n\n💰 ${budgetStatus}\n💡 Estimated budget: ${budget} JOD (~${(budget/numPeople).toFixed(2)} per person) based on Jordanian market prices`);
                }
                
                // Always show total cost and per person cost
                aiResponse += (isArabic 
                    ? `\n📊 التكلفة الفعلية: ${finalTotalCost.toFixed(2)} دينار (~${(finalTotalCost/numPeople).toFixed(2)} دينار للشخص)`
                    : `\n📊 Actual cost: ${finalTotalCost.toFixed(2)} JOD (~${(finalTotalCost/numPeople).toFixed(2)} per person)`);
            }
            
            console.log(`📋 Created shopping list for ${numPeople} people${budget ? ` with budget ${budget} JOD` : ''}: ${listItems.length} items, Total: ${totalCost.toFixed(2)} JOD${numPeople > 1 ? ` (~${(totalCost/numPeople).toFixed(2)} per person)` : ''}`);
        }
        
        res.json({ 
            response: aiResponse,
            relevantProducts: relevantProducts.slice(0, 15).map(p => ({
                id: p.id || p._id,
                _id: p._id,
                name: p.name || p.name_ar || p.name_en,
                name_ar: p.name_ar || p.name,
                name_en: p.name_en || p.name,
                price: parseFloat(p.price) || 0,
                currency: p.currency || 'JOD',
                category: p.category || 'general',
                image_url: p.image_url || '',
                product_url: p.product_url || '#',
                description: p.description || '',
                calories_per_100g: p.calories_per_100g || null,
                protein_per_100g: p.protein_per_100g || null,
                is_gluten_free: p.is_gluten_free || false,
                is_vegetarian: p.is_vegetarian || false,
                is_vegan: p.is_vegan || false,
                is_halal: p.is_halal || false,
                is_healthy: p.is_healthy || false,
                is_organic: p.is_organic || false
            })),
            shopping_list: shoppingList,
            is_shopping: shoppingList !== null && shoppingList.items.length > 0
        });
        
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ 
            error: 'Error processing chat message',
            response: 'حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.'
        });
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
    // Connect to DB first
    await connectDB();
    // Then load products (will use MongoDB if available)
    await loadProducts();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Products loaded: ${products.length}`);
        if (HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY !== 'your_api_key_here') {
            console.log('✅ HuggingFace AI configured');
        } else {
            console.log('⚠️  HuggingFace AI not configured - set HUGGINGFACE_API_KEY in .env');
        }
        if (db) {
            console.log('✅ MongoDB connected');
        } else {
            console.log('⚠️  MongoDB not connected - using JSON file as fallback');
        }
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

