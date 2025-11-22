<div align="center">

# 🛒 ShopAI Jordan

### AI-Powered Shopping Assistant for Jordan 🇯🇴

[![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)](https://github.com/MahmoudEsawi/shopai-jordan)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Transform your event planning with AI-powered shopping lists. Simply describe your needs, set your budget, and receive a complete shopping list with real prices from Talabat Jordan.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

<div align="center">

| 🤖 AI-Powered | 💰 Budget Optimization | 🛒 Talabat Integration | 📸 Product Images |
|:---:|:---:|:---:|:---:|
| Natural language understanding | Smart budget tracking | Real JOD prices | High-quality photos |
| Groq AI integration | Automatic optimization | Direct product links | Real product images |

| 🌍 Bilingual | 🎨 Modern UI | 🛒 Smart Cart | 📊 Nutrition Info |
|:---:|:---:|:---:|:---:|
| English & Arabic | Responsive design | Sliding side cart | Calories, protein, etc. |
| RTL/LTR support | Smooth animations | Chat-based management | Dietary filters |

</div>

### 🎯 Key Capabilities

#### 🤖 AI Assistant
- **🧠 Intelligent AI Assistant** - Powered by Groq AI (14,400 free requests/day)
- **💬 Natural Language Chat** - Talk to the AI naturally about your shopping needs
- **📋 Smart Shopping Lists** - Automatic quantity calculation based on number of people
- **🎯 Conversational Requests** - "Add something with protein for breakfast" - AI understands and adds items

#### 🛒 Shopping Features
- **💵 Budget Management** - Set your budget and get optimized lists
- **🛒 Sliding Side Cart** - Beautiful animated cart panel with smooth transitions
- **💬 Chat-Based Cart** - Add, edit, delete items directly from chat
- **📦 Product Browsing** - Browse 90+ products with advanced filters
- **🔍 Smart Search** - Search products by name, category, or dietary preferences

#### 🌍 Localization
- **🌍 Bilingual Support** - Full English and Arabic translation
- **↔️ RTL/LTR Layout** - Automatic layout switching for Arabic
- **🔤 Language Toggle** - Switch languages with one click
- **🇯🇴 Jordan-Specific** - Products from Talabat Jordan with JOD pricing

#### 📊 Product Information
- **📸 Real Product Images** - High-quality product photos
- **📊 Nutritional Data** - Calories, protein, carbs, fats, fiber per 100g
- **🏷️ Dietary Tags** - Gluten-free, vegetarian, vegan, halal, organic, healthy
- **🔍 Advanced Filters** - Filter by protein, calories, dietary preferences

#### 🎨 User Experience
- **📱 Responsive Design** - Works perfectly on all devices
- **🎭 Smooth Animations** - Beautiful transitions and effects
- **⬆️⬇️ Scroll Buttons** - Quick navigation with scroll to top/bottom
- **📄 Professional Footer** - Complete footer with links and social media

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/MahmoudEsawi/shopai-jordan.git
cd shopai-jordan

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Set your Groq API key (optional - app works without it):

```bash
# Linux/macOS
export GROQ_API_KEY="your-api-key-here"

# Windows
set GROQ_API_KEY=your-api-key-here
```

Or create a `.env` file:
```env
GROQ_API_KEY=your-api-key-here
```

> 💡 **Note:** Get your free API key from [Groq Console](https://console.groq.com/)

### Run the Application

```bash
# Option 1: Direct run
python3 web_app_enhanced.py

# Option 2: Use startup script
chmod +x start.sh
./start.sh
```

Open your browser and navigate to: **http://localhost:8080**

---

## 📖 Usage

### Using the Form

1. Select event type (BBQ, Dinner Party, Breakfast, etc.)
2. Enter number of people
3. Set budget (optional)
4. Choose dietary preferences
5. Apply filters (healthy, gluten-free, protein, calories)
6. Click "Generate Shopping List"

### Using Chat

Simply type your request naturally:

```
"I want a BBQ for 14 people"
"Breakfast for one person with 3 JOD budget, focus on protein"
"Add something with protein for breakfast"
"Add them to cart" (after AI suggests items)
"Dinner party for 8, budget 100 JOD"
"Traditional Jordanian meal for 10 people"
```

### Cart Management

- **Add Items**: Click "Add to Cart" on products or say "add [product name]" in chat
- **View Cart**: Click the cart icon in the top-right
- **Edit Quantity**: Use +/- buttons in cart
- **Remove Items**: Click trash icon or say "remove [product name]"
- **Chat Commands**: 
  - "add it" / "add them" - Add items from last AI suggestion
  - "add something with protein" - AI suggests and adds protein-rich items
  - "remove [item]" - Remove from cart
  - "clear cart" - Empty the cart

### Language Switching

- Click the language button (EN/AR) in the navbar
- Entire website translates instantly
- Layout automatically switches to RTL for Arabic

### Product Browsing

1. Navigate to "Browse Products" section
2. Use search bar to find products
3. Filter by category, dietary preferences, or nutrition
4. Sort by price, calories, or protein
5. Click "Add to Cart" on any product

---

## 🏗️ Project Structure

```
shopai-jordan/
├── web_app_enhanced.py          # Main Flask application
├── product_database.py           # Database management
├── groq_assistant.py            # AI assistant (Groq)
├── smart_list_builder.py        # Shopping list builder
├── cart_manager.py              # Cart management
├── recipe_suggestions.py        # Recipe recommendations
├── list_sharing.py              # List sharing functionality
├── templates/
│   └── index.html              # Main HTML template
├── static/
│   ├── css/
│   │   ├── style.css           # Main stylesheet
│   │   ├── cart-sidebar.css   # Cart panel styles
│   │   └── footer.css          # Footer styles
│   └── js/
│       ├── main.js            # Main JavaScript
│       └── translations.js     # Translation system
├── scripts/
│   └── talabat_mart_jordan_products.py  # Product data
├── docs/                       # Documentation
├── start.sh                    # Startup script
└── requirements.txt            # Python dependencies
```

---

## 🎨 Features in Detail

### 🛒 Sliding Side Cart
- Beautiful animated cart panel that slides in from the right
- Smooth transitions and animations
- Real-time updates without page refresh
- Mobile-friendly responsive design
- RTL support for Arabic layout

### 🌍 Bilingual Support
- Complete English and Arabic translations
- Automatic RTL/LTR layout switching
- Language preference saved in localStorage
- All UI elements translated (buttons, labels, messages)

### 📊 Nutritional Information
- Calories per 100g for each product
- Protein, carbs, fats, and fiber content
- Filter products by nutritional values
- Display nutritional badges on product cards

### 🏷️ Dietary Filters
- Gluten-free filter
- Vegetarian filter
- Vegan filter
- Halal filter
- Organic filter
- Healthy food filter
- Protein and calorie range filters

### 💬 Chat-Based Cart Management
- Add items by saying "add [product name]"
- Add multiple items with "add them" or "add it"
- Remove items with "remove [product name]"
- Update quantities with "change [item] to [quantity]"
- Conversational requests like "add something with protein"

---

## 🔧 API Endpoints

### `GET /api/stats`
Get statistics about products and categories.

**Response:**
```json
{
  "total_products": 92,
  "total_stores": 1,
  "stores": [...]
}
```

### `GET /api/products`
Get all products with optional filters.

**Query Parameters:**
- `search` - Search term
- `category` - Filter by category
- `healthy` - Filter healthy products
- `gluten_free` - Filter gluten-free products
- `vegetarian` - Filter vegetarian products
- `vegan` - Filter vegan products
- `organic` - Filter organic products
- `halal` - Filter halal products
- `min_protein` - Minimum protein per 100g
- `max_calories` - Maximum calories per 100g
- `sort` - Sort by (name, price_low, price_high, calories_low, protein_high)

### `POST /api/chat`
Send a chat message and get AI response with shopping list.

**Request:**
```json
{
  "message": "I want a BBQ for 14 people"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI response text",
  "shopping_list": {
    "items": [...],
    "total_cost": 150.50,
    "num_people": 14
  },
  "cart": {
    "items": [...],
    "total_items": 5,
    "total_cost": 25.30
  },
  "is_shopping": true
}
```

### `GET /api/cart`
Get current shopping cart.

### `POST /api/cart/add`
Add product to cart.

**Request:**
```json
{
  "product_id": "product-id",
  "quantity": 1
}
```

### `POST /api/cart/remove`
Remove product from cart.

### `POST /api/cart/update`
Update product quantity in cart.

### `POST /api/cart/clear`
Clear entire cart.

---

## 🛠️ Development

### Adding Products

```bash
# Add Jordan products to database
python3 scripts/talabat_mart_jordan_products.py
```

### Customizing

- **Styling**: Edit `static/css/style.css`, `cart-sidebar.css`, `footer.css`
- **JavaScript**: Edit `static/js/main.js`, `translations.js`
- **HTML**: Edit `templates/index.html`
- **AI Logic**: Edit `groq_assistant.py`
- **List Building**: Edit `smart_list_builder.py`
- **Cart Management**: Edit `cart_manager.py`

### Adding Translations

Edit `static/js/translations.js` to add new translation keys:

```javascript
const translations = {
    en: {
        new_key: "English text"
    },
    ar: {
        new_key: "النص العربي"
    }
};
```

Then add `data-translate="new_key"` to HTML elements.

---

## 📦 Dependencies

- **Flask** - Web framework
- **Flask-CORS** - CORS support
- **requests** - HTTP requests
- **groq** - Groq AI SDK
- **python-dotenv** - Environment variables

See `requirements.txt` for complete list.

---

## 🌍 Target Region

Currently optimized for **Jordan**:
- ✅ Products from Talabat Jordan
- ✅ Prices in JOD (Jordanian Dinar)
- ✅ Local product availability
- ✅ Jordanian food preferences
- ✅ Arabic language support
- ✅ RTL layout support

---

## 🐛 Troubleshooting

### Port Already in Use

If port 8080 is busy, change it in `web_app_enhanced.py`:
```python
app.run(debug=True, host='0.0.0.0', port=8080)
```

### API Key Issues

The app works without an API key but with limited AI features. For full functionality, set your Groq API key as an environment variable.

### Database Issues

If you encounter database errors, delete `products.db` and re-run product scripts:
```bash
rm products.db
python3 scripts/talabat_mart_jordan_products.py
```

### Cart Not Updating

- Clear browser cache
- Check browser console for errors
- Ensure session ID is being sent with requests

---

## 📸 Screenshots

<div align="center">

### Modern Hero Section
![Hero Section](https://via.placeholder.com/800x400?text=ShopAI+Hero+Section)

### Shopping Cart Panel
![Shopping Cart](https://via.placeholder.com/800x400?text=Sliding+Side+Cart)

### Product Browsing
![Product Browse](https://via.placeholder.com/800x400?text=Product+Browsing+with+Filters)

### AI Chat Interface
![Chat Interface](https://via.placeholder.com/800x400?text=AI+Chat+Interface)

</div>

---

## 🎯 Recent Updates

### Version 2.0 - Major Features
- ✅ Sliding side cart with smooth animations
- ✅ Full Arabic language support with RTL/LTR
- ✅ Chat-based cart management
- ✅ Product browsing with advanced filters
- ✅ Nutritional information display
- ✅ Dietary filters (gluten-free, vegetarian, vegan, halal, organic)
- ✅ Professional footer with social links
- ✅ Scroll to top/bottom buttons
- ✅ Improved UI/UX with food-themed colors
- ✅ 90+ real products from Talabat Jordan

---

## 👥 Contributors

- **Mahmoud Esawi** - Project Creator

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for free AI API
- [Talabat](https://www.talabat.com/) for product integration
- [Font Awesome](https://fontawesome.com/) for icons
- [Google Fonts](https://fonts.google.com/) for typography

---

## 📞 Support

For issues or questions:
- 📧 Open an [Issue](https://github.com/MahmoudEsawi/shopai-jordan/issues)
- 📖 Check the [Documentation](docs/)
- 💬 Start a [Discussion](https://github.com/MahmoudEsawi/shopai-jordan/discussions)

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Made with ❤️ for Jordan 🇯🇴**

[⬆ Back to Top](#-shopai-jordan)

</div>
