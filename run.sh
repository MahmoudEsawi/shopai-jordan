#!/bin/bash
# Quick run script for AI Shopping Assistant

echo "🛒 Starting AI Shopping Assistant..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Check for Chrome WebDriver
if ! command -v chromedriver &> /dev/null; then
    echo "⚠️  Warning: chromedriver not found in PATH"
    echo "Install it with: brew install chromedriver (macOS)"
    echo "Or: sudo apt-get install chromium-chromedriver (Ubuntu)"
    echo ""
fi

# Load environment variables if .env exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the web app
echo "🚀 Starting web server on http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""

python web_app.py

