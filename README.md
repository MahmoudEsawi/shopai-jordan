# ShopAI Jordan - Intelligent Shopping Assistant

![Python Version](https://img.shields.io/badge/Python-3.8+-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Production-ready-success)

## 🎯 Overview

ShopAI is an AI-powered shopping assistant that helps you create smart shopping lists for events. Simply describe your needs in natural language, and get a complete shopping list with real prices from Talabat Jordan.

**Example:** Say *"I want a BBQ for 14 people"* and get a complete shopping list with all items, quantities, and prices!

## ✨ Features

- 🤖 **AI-Powered Intelligence** - Natural language understanding using Groq AI
- 💰 **Budget Optimization** - Set your budget and get optimized lists
- 🛒 **Direct Talabat Integration** - Real products with JOD prices and direct links
- 📸 **Product Images** - Visual product display
- ⚡ **Instant Results** - Fast response times
- 🎨 **Modern UI** - Professional, clean interface
- 📱 **Responsive Design** - Works on all devices

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up API Key (Optional)

The app works with Groq AI (free tier available). Set your API key:

```bash
export GROQ_API_KEY="your-api-key-here"
```

Or create a `.env` file:
```
GROQ_API_KEY=your-api-key-here
```

### 3. Run the Application

```bash
python3 web_app_enhanced.py
```

### 4. Open in Browser

Navigate to: **http://localhost:8080**

## 📖 Usage

### Using the Form

1. Select event type (BBQ, Dinner Party, etc.)
2. Enter number of people
3. Set budget (optional)
4. Choose dietary preferences
5. Click "Generate Shopping List"

### Using Chat

Simply type your request naturally:
- "I want a BBQ for 14 people"
- "Dinner party for 8, budget 100 JOD"
- "Traditional Jordanian meal for 10 people"

## 🏗️ Project Structure

```
mikroelectron/
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
├── data/                   # Database files
└── requirements.txt        # Python dependencies
```

## 🔧 Configuration

### Environment Variables

- `GROQ_API_KEY` - Your Groq API key (optional, app works without it)

### Database

The app uses SQLite database (`products.db`) to store product information. Products are added via scripts in the `scripts/` directory.

## 📚 API Endpoints

### GET `/api/stats`
Get statistics about products and categories.

### POST `/api/chat`
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

## 🛠️ Development

### Adding Products

Use the scripts in `scripts/` directory to add products:

```bash
python3 scripts/jordan_products.py
```

### Customizing

- **Styling**: Edit `static/css/style.css`
- **JavaScript**: Edit `static/js/main.js`
- **HTML**: Edit `templates/index.html`
- **AI Logic**: Edit `groq_assistant.py`
- **List Building**: Edit `smart_list_builder.py`

## 📦 Dependencies

- Flask - Web framework
- Flask-CORS - CORS support
- requests - HTTP requests
- beautifulsoup4 - HTML parsing
- groq - Groq AI SDK

See `requirements.txt` for complete list.

## 🌍 Target Region

Currently optimized for **Jordan**:
- Products from Talabat Jordan
- Prices in JOD (Jordanian Dinar)
- Local product availability

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

## 📝 License

MIT License - See LICENSE file for details

## 👥 Credits

Created as part of a graduation project.

## 🎯 Example Requests

Try these with the chatbot:

```
"I want a BBQ for 14 people"
"Dinner party for 8, budget 100 JOD"
"Traditional Jordanian meal for 10 people"
"Lunch gathering for 6, vegetarian"
"Party for 20 people, budget 200 JOD"
```

## 🔮 Future Enhancements

- [ ] Support for more regions
- [ ] Multiple store integration
- [ ] Recipe suggestions
- [ ] Shopping list sharing
- [ ] Mobile app
- [ ] Price comparison
- [ ] Delivery time estimates

## 📞 Support

For issues or questions, please check the documentation in the `docs/` directory.

---

**Happy Shopping! 🛒✨**
