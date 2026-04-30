#!/bin/bash

# --- Mooneh.ai 2026 Startup Script ---

echo "🚀 Starting Mooneh.ai Environment..."

# 1. Start MongoDB if not already running
if lsof -i :27017 > /dev/null 2>&1; then
    echo "🍃 MongoDB already running"
elif command -v brew &> /dev/null && brew services list 2>/dev/null | grep -q mongodb; then
    echo "🍃 Starting MongoDB via brew..."
    brew services start mongodb-community 2>/dev/null
    sleep 2
elif command -v mongod &> /dev/null; then
    echo "🍃 Starting mongod..."
    mkdir -p /tmp/mongodata
    mongod --dbpath /tmp/mongodata --fork --logpath /tmp/mongod.log 2>/dev/null
    sleep 2
else
    echo "⚠️  MongoDB not installed - server will use JSON fallback"
fi

# 2. Kill any existing node server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# 3. Start server
echo "🌐 Starting Node.js server..."
cd "$(dirname "$0")"
node server.js
