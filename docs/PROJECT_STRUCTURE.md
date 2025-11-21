# Project Structure

## Overview

This document describes the organized structure of the ShopAI project.

## Directory Layout

```
mikroelectron/
├── web_app_enhanced.py      # Main Flask application (entry point)
├── product_database.py       # Database operations
├── groq_assistant.py        # AI assistant using Groq
├── smart_list_builder.py   # Shopping list generation logic
├── requirements.txt         # Python dependencies
├── run.sh                   # Quick start script
├── README.md                # Main documentation
│
├── templates/               # HTML templates
│   └── index.html          # Main page template
│
├── static/                  # Static assets
│   ├── css/
│   │   └── style.css       # Stylesheet
│   └── js/
│       └── main.js         # JavaScript functionality
│
├── scripts/                 # Utility scripts
│   ├── jordan_products.py  # Add Jordan products to DB
│   ├── talabat_products.py # Add Talabat products
│   ├── add_real_products.py # Add real products
│   └── demo_simple.py      # Simple demo script
│
├── docs/                    # Documentation
│   ├── PROJECT_STRUCTURE.md # This file
│   └── [other docs]        # Additional documentation
│
├── data/                    # Data files
│   ├── products.db         # Main database
│   └── demo_products.db    # Demo database
│
└── archive/                 # Old/unused files
    ├── web_app.py          # Old web app versions
    ├── web_app_simple.py
    ├── web_app_pro.py
    ├── web_app_final.py
    └── [other archived files]
```

## Key Files

### Main Application
- **web_app_enhanced.py** - Flask web server, routes, API endpoints

### Core Modules
- **product_database.py** - SQLite database operations, product management
- **groq_assistant.py** - AI chat functionality using Groq API
- **smart_list_builder.py** - Builds shopping lists from user requests

### Frontend
- **templates/index.html** - Main HTML page
- **static/css/style.css** - All styling
- **static/js/main.js** - Client-side JavaScript

### Utilities
- **scripts/jordan_products.py** - Populate database with Jordan products
- **scripts/demo_simple.py** - Demo/example script

## Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run the app
python3 web_app_enhanced.py

# Or use the quick start script
./run.sh
```

## Adding Products

To add products to the database:

```bash
python3 scripts/jordan_products.py
```

## Development

- Edit HTML: `templates/index.html`
- Edit CSS: `static/css/style.css`
- Edit JS: `static/js/main.js`
- Edit Python: `web_app_enhanced.py` and core modules

