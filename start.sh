#!/bin/bash
# ShopAI Jordan - Startup Script
# Make sure to set GROQ_API_KEY environment variable before running
# Example: export GROQ_API_KEY="your-api-key-here"

echo "🚀 Starting ShopAI Jordan..."
if [ -z "$GROQ_API_KEY" ]; then
    echo "⚠️  Warning: GROQ_API_KEY environment variable is not set."
    echo "   The app will run but AI features will be limited."
    echo "   Set it with: export GROQ_API_KEY='your-api-key'"
else
    echo "✅ Groq API Key loaded"
fi
echo ""

python3 web_app_enhanced.py
