#!/bin/bash

# --- Mooneh.ai 2026 Startup Script ---

echo "🚀 Starting Mooneh.ai Environment..."

# 1. Start MongoDB if not already running
if ! lsof -i :27017 > /dev/null; then
    echo "🍃 Starting MongoDB..."
    # Attempt to start via brew services first
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    else
        # Fallback to direct mongod run in background
        nohup mongod --dbpath /usr/local/var/mongodb > /dev/null 2>&1 &
    fi
    sleep 2
else
    echo "✅ MongoDB is already running."
fi

# 2. Kill any existing node processes for this project
echo "🔄 Refreshing Node.js processes..."
lsof -ti :3000 | xargs kill -9 2>/dev/null

# 3. Start the Node.js server in the background
echo "🌐 Starting Mooneh.ai Server on port 3000..."
nohup node server.js > server_nohup.log 2>&1 &

# Wait for server to initialize
sleep 3

# 4. Open the website in the browser
echo "✨ Opening Mooneh.ai in your browser..."
open "http://localhost:3000"

echo "----------------------------------------"
echo "✅ Done! Mooneh.ai is now live."
echo "📜 Logs are being written to server_nohup.log"
echo "----------------------------------------"
