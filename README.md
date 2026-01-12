<div align="center">

# 🛒 ShopAI Jordan

### Smart Shopping Assistant for the Hashemite Kingdom of Jordan
**مساعد التسوق الذكي للمملكة الأردنية الهاشمية**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.21+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-AI-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Transform your event planning with AI-powered shopping lists tailored for the Jordanian market**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**ShopAI Jordan** is an intelligent, AI-powered shopping assistant web application designed specifically for the Jordanian market. Using advanced natural language processing, it helps users create smart, budget-optimized shopping lists for various events including BBQs, dinner parties, family gatherings, and traditional celebrations.

### 🎯 Why ShopAI Jordan?

- 🤖 **AI-Powered Intelligence** - Leverages Hugging Face's Mistral-7B-Instruct model for natural language understanding
- 🏪 **Real Jordanian Products** - Integrated with real products and prices in JOD (Jordanian Dinars)
- 💰 **Smart Budget Management** - Intelligent budget allocation and optimization across product categories
- 🌍 **Bilingual Support** - Seamless Arabic and English support with RTL layout
- 📱 **Responsive Design** - Beautiful, modern UI that works on all devices
- 🎯 **Event-Specific Intelligence** - Context-aware recommendations based on event type

---

## ✨ Features

### 🧠 Intelligent Shopping Lists

- **Natural Language Processing** - Simply describe what you need in Arabic or English
- **Smart Shopping Planner** - Detailed form for precise event planning
- **Automatic Budget Calculation** - Based on event type and number of guests
- **Priority-Based Selection** - Essential items (meat, chicken, shish for BBQ) prioritized

### 🛍️ Comprehensive Product Management

- **100+ Local Products** - From trusted Jordanian stores
- **Advanced Filtering** - By category, price, dietary preferences
- **Bilingual Search** - Search in Arabic or English
- **Detailed Information** - Nutrition facts, dietary tags, store information
- **Smart Pagination** - 12 products per page for optimal browsing

### 💵 Budget Intelligence

- **Custom or Auto-Calculate** - Set your own budget or let AI calculate it
- **Category-Based Allocation** - Smart distribution (e.g., 35% meat for BBQ)
- **Maximum Utilization** - Products selected to use ~98% of budget
- **Real-Time Calculations** - See total cost update as you shop

### 🌐 Full Internationalization (i18n)

- **Complete Translation** - All UI elements in Arabic and English
- **Dynamic Language Switching** - Switch languages on the fly
- **RTL Support** - Proper right-to-left layout for Arabic
- **Cultural Awareness** - Appropriate product names and descriptions

### 🎨 Modern User Experience

- **Beautiful Design** - Gradient hero sections with background images
- **Dark Mode** - Easy on the eyes for night shopping
- **Smooth Animations** - Polished transitions and interactions
- **Interactive Cart** - Sidebar cart with real-time updates
- **Wishlist Feature** - Save products for later
- **Toast Notifications** - Clear user feedback

### 🍖 Event-Specific Intelligence

| Event Type | Priority Products |
|------------|------------------|
| **BBQ** | Chicken, Meat, Shish/Kebab, Charcoal |
| **Dinner** | Meat, Vegetables, Bread, Dairy |
| **Breakfast** | Bread, Dairy, Eggs, Fruits |
| **Lunch** | Proteins, Vegetables, Grains, Sides |
| **Traditional** | Mansaf ingredients, Arabic coffee, Dates |

---

## 🛠️ Technology Stack

<div align="center">

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

### AI & Tools
![Hugging Face](https://img.shields.io/badge/Hugging%20Face-FFD21E?style=flat&logo=huggingface&logoColor=black)
![Font Awesome](https://img.shields.io/badge/Font%20Awesome-528DD7?style=flat&logo=fontawesome&logoColor=white)

</div>

**Backend:**
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, minimalist web framework
- **MongoDB** - NoSQL database for products and cart data
- **Hugging Face API** - AI text generation (Mistral-7B-Instruct)
- **Axios** - Promise-based HTTP client

**Frontend:**
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables, gradients, animations
- **Vanilla JavaScript** - No framework dependencies for maximum performance
- **Font Awesome** - Comprehensive icon library
- **Google Fonts** - Inter, Space Grotesk, Cairo typography

**Development Tools:**
- **dotenv** - Environment variable management
- **nodemon** - Development auto-reload
- **CORS** - Cross-origin resource sharing

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **MongoDB** (Optional - falls back to JSON) ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/MahmoudEsawi/shopai-jordan.git
cd shopai-jordan
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000

# MongoDB Configuration (Optional)
MONGODB_URI=mongodb://localhost:27017/shopai

# Hugging Face AI Configuration
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

> 💡 **Get your Hugging Face API key:** Visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

4. **Start the application**

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

5. **Open your browser**

Navigate to `http://localhost:3000` and start shopping! 🎉

---

## 📚 Documentation

### Usage Guide

#### 🎯 Smart Shopping Planner

1. Navigate to the **Smart Shopping Planner** section
2. Select your event type (BBQ, Dinner, Lunch, Breakfast, Party)
3. Enter the number of people
4. Set budget (optional - auto-calculates if not specified)
5. Choose dietary preferences (Vegetarian, Vegan, Halal, Gluten-Free, etc.)
6. Add any additional requests
7. Click **"Create Shopping List"**

#### 💬 Chat with AI Assistant

Simply type your request in natural language:

**Arabic Examples:**
```
أريد شواء لـ 14 شخص بميزانية 50 دينار
بدي فطور لـ 5 أشخاص
بدي جاج ولحم للشوي
```

**English Examples:**
```
I want a BBQ for 10 people with a budget of 40 JOD
I need breakfast for 5 people
I want chicken and meat for grilling
```

The AI will:
- ✅ Understand your request in Arabic or English
- ✅ Search for relevant products
- ✅ Create a smart shopping list
- ✅ Calculate quantities based on number of people
- ✅ Optimize for your budget

#### 🔍 Browse Products

- Use **filters** to find products by category, price, dietary preferences
- **Search** by product name (supports Arabic and English)
- View **detailed product information** including nutrition facts
- **Add to cart** or **save to wishlist**

#### 📝 Shopping List Management

- Edit quantities before adding to cart
- Remove items from list
- View total cost in real-time
- Add entire list to cart with one click
- Clear list and start over

---

## 📡 API Reference

### Products

#### Get All Products

```http
GET /api/products
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `search` | string | Search products by name |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `store` | string | Filter by store name |

**Response:**
```json
[
  {
    "id": "product_id",
    "name": "Product Name",
    "name_ar": "اسم المنتج",
    "name_en": "Product Name",
    "price": 10.50,
    "currency": "JOD",
    "category": "meat",
    "description": "Product description",
    "store_name": "Store Name",
    "product_url": "https://talabat.com/product",
    "image_url": "https://example.com/image.jpg",
    "calories_per_100g": 250,
    "protein_per_100g": 20,
    "is_halal": true,
    "is_vegetarian": false
  }
]
```

### Chat

#### Chat with AI

```http
POST /api/chat
```

**Request Body:**
```json
{
  "message": "أريد شواء لـ 10 أشخاص",
  "eventType": "bbq",
  "numPeople": 10,
  "budget": 70,
  "dietary": "halal",
  "filterHealthy": false,
  "filterGlutenFree": false,
  "fromSmartPlanner": true
}
```

**Response:**
```json
{
  "response": "AI response message",
  "shopping_list": {
    "items": [...],
    "total_cost": 68.50,
    "num_people": 10,
    "event_type": "bbq"
  },
  "relevantProducts": [...]
}
```

### Cart Operations

```http
GET /api/cart              # Get cart items
POST /api/cart/add         # Add item to cart
POST /api/cart/remove      # Remove item from cart
POST /api/cart/update      # Update item quantity
```

### Statistics

```http
GET /api/stats             # Get product categories and stores
```

---

## 📁 Project Structure

```
shopai-jordan/
├── 📄 server.js                 # Main Express server
├── 📄 package.json              # Dependencies and scripts
├── 📄 .env                      # Environment variables (not in git)
├── 📄 .gitignore               # Git ignore rules
├── 📄 README.md                # This file
│
├── 📂 static/                  # Static assets
│   ├── 📂 css/                 # Stylesheets
│   │   ├── style.css          # Main stylesheet
│   │   ├── cart-sidebar.css   # Cart sidebar styles
│   │   ├── darkmode.css       # Dark mode styles
│   │   └── ...
│   └── 📂 js/                  # JavaScript files
│       ├── main.js            # Main application logic
│       ├── translations.js    # i18n translations
│       ├── wishlist.js        # Wishlist functionality
│       └── ...
│
├── 📂 templates/               # HTML templates
│   └── index.html             # Main HTML template
│
├── 📂 data/                    # Data files
│   └── jordan_products.json   # Product data fallback
│
└── 📂 background/              # Background images
    └── Gemini_Generated_Image_sxgg5bsxgg5bsxgg.png
```

---

## ⚙️ Configuration

### MongoDB Setup (Optional)

The application works with or without MongoDB. If MongoDB is not available, it automatically falls back to JSON files.

**To use MongoDB:**

1. Install MongoDB locally or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Update `MONGODB_URI` in `.env`
3. Create a database named `shopai`
4. Create a collection named `prouducts` (note the spelling)
5. Import your products into the collection

### Product Data Structure

Products should follow this structure:

```json
{
  "_id": "product_id",
  "name": "Product Name",
  "name_ar": "اسم المنتج",
  "name_en": "Product Name",
  "price": 10.50,
  "currency": "JOD",
  "category": "meat",
  "description": "Product description",
  "store_name": "Store Name",
  "product_url": "https://talabat.com/product-url",
  "image_url": "https://example.com/image.jpg",
  "calories_per_100g": 250,
  "protein_per_100g": 20,
  "carbs_per_100g": 5,
  "fats_per_100g": 15,
  "is_gluten_free": false,
  "is_vegetarian": false,
  "is_vegan": false,
  "is_halal": true,
  "is_organic": false,
  "is_healthy": true
}
```

---

## 🎨 Key Features Explained

### Intelligent Product Selection Algorithm

The system uses advanced algorithms to select products based on:

1. **Event Type Priority**
   - BBQ: Meat (35%), Vegetables (15%), Drinks (15%), Charcoal, Supplies
   - Dinner: Meat, Vegetables, Bread, Dairy, Desserts
   - Breakfast: Bread, Dairy, Eggs, Fruits, Jam

2. **Budget Allocation**
   - Smart category-based budget distribution
   - Ensures balanced shopping lists within budget
   - Maximizes budget utilization (~98%)

3. **Essential Products First**
   - For BBQ: Chicken, Meat, Shish are mandatory
   - Searches by keywords if category classification is incorrect
   - Fallback mechanisms ensure essential items are always included

### Language Support

Full bilingual support with:
- ✅ Dynamic language switching (AR ↔ EN)
- ✅ RTL layout for Arabic
- ✅ Translated product names, categories, UI elements
- ✅ Cultural context awareness
- ✅ Arabic synonym matching (e.g., "جاج" = "دجاج" = "chicken")

### Budget Intelligence

- **Automatic Calculation**: Realistic budgets based on event type and guests (e.g., 7 JOD/person for BBQ)
- **Jordanian Market Prices**: Tailored to local market prices
- **Strict Adherence**: Products selected to maximize budget utilization
- **Category Allocation**: Distributes budget across categories intelligently

---

## 🤝 Contributing

Contributions are welcome! We appreciate your help in making ShopAI Jordan better.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write clear, descriptive commit messages
- Test your changes thoroughly
- Update documentation as needed
- Add comments for complex logic

### Development Commands

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run with file watching
npm run dev:watch

# Start production server
npm start
```

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Hugging Face](https://huggingface.co/)** - For providing AI models and API
- **[Talabat Jordan](https://www.talabat.com/jordan)** - For product data inspiration
- **[Font Awesome](https://fontawesome.com/)** - For beautiful icons
- **[Google Fonts](https://fonts.google.com/)** - For typography

---

## 📞 Contact & Support

- **GitHub Repository**: [MahmoudEsawi/shopai-jordan](https://github.com/MahmoudEsawi/shopai-jordan)
- **Issues**: [Report a bug or request a feature](https://github.com/MahmoudEsawi/shopai-jordan/issues)

---

## 🔮 Roadmap

### Planned Features

- [ ] **User Authentication** - User accounts and profiles
- [ ] **Saved Shopping Lists** - Save and reuse shopping lists
- [ ] **Recipe Suggestions** - Based on shopping list items
- [ ] **Talabat Integration** - Direct ordering through Talabat API
- [ ] **Price Comparison** - Compare prices across multiple stores
- [ ] **Seasonal Recommendations** - Products based on season
- [ ] **Meal Planning Calendar** - Weekly/monthly meal planning
- [ ] **Nutritional Analysis** - Health insights and recommendations
- [ ] **Mobile App** - Native iOS and Android apps
- [ ] **Voice Commands** - Voice-activated shopping assistant

---

<div align="center">

### Made with ❤️ for the Jordanian market

**⭐ Star this repo if you find it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/MahmoudEsawi/shopai-jordan?style=social)](https://github.com/MahmoudEsawi/shopai-jordan/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/MahmoudEsawi/shopai-jordan?style=social)](https://github.com/MahmoudEsawi/shopai-jordan/network/members)

---

**ShopAI Jordan** | Smart Shopping, Simplified

</div>
