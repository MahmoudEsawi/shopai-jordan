<div align="center">

# 🛒 ShopAI Jordan

### AI-Powered Shopping Assistant for Jordan

[![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)](https://github.com/MahmoudEsawi/shopai-jordan)

**Transform your event planning with AI-powered shopping lists. Simply describe your needs, set your budget, and receive a complete shopping list with real prices from Talabat Jordan.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

<div align="center">

| 🤖 AI-Powered | 💰 Budget Optimization | 🛒 Talabat Integration | 📸 Product Images |
|:---:|:---:|:---:|:---:|
| Natural language understanding | Smart budget tracking | Real JOD prices | High-quality photos |
| Groq AI integration | Automatic optimization | Direct product links | Unsplash images |

</div>

### 🎯 Key Capabilities

- **🧠 Intelligent AI Assistant** - Powered by Groq AI (14,400 free requests/day)
- **📋 Smart Shopping Lists** - Automatic quantity calculation based on number of people
- **💵 Budget Management** - Set your budget and get optimized lists
- **🌍 Jordan-Specific** - Products from Talabat Jordan with JOD pricing
- **🖼️ Real Product Images** - High-quality food photography from Unsplash
- **🎨 Modern UI** - Professional, responsive design with smooth animations
- **⚡ Fast & Free** - No API costs, instant results

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
python3 web_app_enhanced.py
```

Open your browser and navigate to: **http://localhost:8080**

---

## 📖 Usage

### Using the Form

1. Select event type (BBQ, Dinner Party, Breakfast, etc.)
2. Enter number of people
3. Set budget (optional)
4. Choose dietary preferences
5. Click "Generate Shopping List"

### Using Chat

Simply type your request naturally:

```
"I want a BBQ for 14 people"
"Breakfast for 10, include hummus and falafel"
"Dinner party for 8, budget 100 JOD"
"Traditional Jordanian meal for 10 people"
```

---

## 🏗️ Project Structure

```
shopai-jordan/
├── web_app_enhanced.py      # Main Flask application
├── product_database.py       # Database management
├── groq_assistant.py        # AI assistant (Groq)
├── smart_list_builder.py   # Shopping list builder
├── templates/
│   └── index.html          # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css       # Stylesheet
│   └── js/
│       └── main.js         # JavaScript
├── scripts/                # Utility scripts
├── docs/                   # Documentation
└── requirements.txt        # Python dependencies
```

---

## 🎨 Screenshots

<div align="center">

### Modern Hero Section
![Hero Section](https://via.placeholder.com/800x400?text=ShopAI+Hero+Section)

### Shopping List Interface
![Shopping List](https://via.placeholder.com/800x400?text=Shopping+List+Interface)

### AI Chat Interface
![Chat Interface](https://via.placeholder.com/800x400?text=AI+Chat+Interface)

</div>

---

## 🔧 API Endpoints

### `GET /api/stats`
Get statistics about products and categories.

**Response:**
```json
{
  "total_products": 31,
  "total_stores": 1,
  "stores": [...]
}
```

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
  "is_shopping": true
}
```

---

## 🛠️ Development

### Adding Products

```bash
# Add Jordan products to database
python3 scripts/jordan_products.py

# Update product images
python3 scripts/update_images_unsplash.py
```

### Customizing

- **Styling**: Edit `static/css/style.css`
- **JavaScript**: Edit `static/js/main.js`
- **HTML**: Edit `templates/index.html`
- **AI Logic**: Edit `groq_assistant.py`
- **List Building**: Edit `smart_list_builder.py`

---

## 📦 Dependencies

- **Flask** - Web framework
- **Flask-CORS** - CORS support
- **requests** - HTTP requests
- **beautifulsoup4** - HTML parsing
- **groq** - Groq AI SDK

See `requirements.txt` for complete list.

---

## 🌍 Target Region

Currently optimized for **Jordan**:
- ✅ Products from Talabat Jordan
- ✅ Prices in JOD (Jordanian Dinar)
- ✅ Local product availability
- ✅ Jordanian food preferences

---

## 🐛 Troubleshooting

### Port Already in Use

If port 8080 is busy, change it in `web_app_enhanced.py`:
```python
app.run(debug=True, host='0.0.0.0', port=8080)
```

### API Key Issues

The app works without an API key but with limited AI features. For full functionality, set your Groq API key.

### Database Issues

If you encounter database errors, delete `products.db` and re-run product scripts.

---

---

## 👥 Contributors

- **Mahmoud Esawi** - Project Creator

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for free AI API
- [Talabat](https://www.talabat.com/) for product integration
- [Unsplash](https://unsplash.com/) for product images

---

## 📞 Support

For issues or questions:
- 📧 Open an [Issue](https://github.com/MahmoudEsawi/shopai-jordan/issues)
- 📖 Check the [Documentation](docs/)
- 💬 Start a [Discussion](https://github.com/MahmoudEsawi/shopai-jordan/discussions)

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Made with ❤️ for Jordan**

[⬆ Back to Top](#-shopai-jordan)

</div>
