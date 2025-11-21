# 🚀 Quick Start Guide

Get started with AI Shopping Assistant in 5 minutes!

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Install Chrome WebDriver

### macOS (with Homebrew)
```bash
brew install chromedriver
```

### Ubuntu/Debian
```bash
sudo apt-get install chromium-chromedriver
```

### Windows
Download from: https://chromedriver.chromium.org/

## Step 3: Configure (Optional)

For AI features, set your OpenAI API key:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# The app works without this, but AI features will be limited
```

## Step 4: Run the Web App

```bash
python web_app.py
```

Open http://localhost:5000 in your browser.

## Step 5: Start Using!

### 1. Scrape a Store

In the web interface:
1. Enter a store URL (e.g., `https://www.walmart.com`)
2. Click "Start Scraping"
3. Wait for products to be scraped and saved

### 2. Chat with AI

Once you have products in the database:
1. Type your request: "I want to have a BBQ for 14 people"
2. Click "Send Message"
3. Get an instant shopping list!

## Common Requests to Try

```
"I want to have a BBQ for 14 people"
"Dinner party for 8, budget $100"
"Need snacks for 20 people"
"Shopping for a family of 4"
"Find me grills under $50"
```

## Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### Chrome WebDriver not found
```bash
# macOS
brew install chromedriver

# Make sure it's in your PATH
which chromedriver
```

### Port 5000 already in use
```bash
# Edit web_app.py and change the port at the bottom:
app.run(debug=True, host='0.0.0.0', port=8080)
```

## What's Next?

- Read the full [README_SHOPPING_ASSISTANT.md](README_SHOPPING_ASSISTANT.md)
- Try scraping your favorite stores
- Customize event templates in `shopping_assistant.py`
- Explore the API endpoints

## Architecture Overview

```
┌──────────────────┐
│   Web Browser    │  ← You interact here
└────────┬─────────┘
         │
┌────────▼─────────┐
│   Web App        │  ← Flask server (web_app.py)
│   (Port 5000)    │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐  ┌──▼──────────┐
│Scraper│  │  AI Assistant│
└───┬───┘  └──┬──────────┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │Database │  ← SQLite (products.db)
    └─────────┘
```

Happy Shopping! 🛒✨

