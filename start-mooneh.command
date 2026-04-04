#!/bin/bash

# Move to the directory where this script is located
cd "$(dirname "$0")"

echo "========================================="
echo "        Starting Mooneh.ai Server        "
echo "========================================="

# Check if MongoDB is already running
if pgrep -x "mongod" > /dev/null
then
    echo "✅ MongoDB is already running."
else
    echo "⚠️ MongoDB is NOT running. Starting MongoDB automatically in the background..."
    
    # Run the exact MongoDB binary and dbpath you've been using
    /Users/airm2/Downloads/mongodb-macos-aarch64--8.2.6/bin/mongod --dbpath /Users/airm2/data/db > /dev/null 2>&1 &
    
    # Wait a few seconds for Mongo to spin up
    sleep 3
    echo "✅ MongoDB successfully started."
fi

echo ""
echo "Launching your store and admin dashboard..."

# Give the server 2 seconds to start, then open the browser automatically
(sleep 2 && open "http://localhost:3000") &
(sleep 2 && open "http://localhost:3000/admin") &

# Start the server (uses nodemon to auto-restart if you change files)
if command -v npm &> /dev/null; then
    echo "Starting Mooneh server with npm..."
    npm run dev
else
    echo "Starting Mooneh server with node..."
    node server.js
fi
