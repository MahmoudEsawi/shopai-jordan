#!/bin/bash
# ============================================
#  Mooneh.ai — One-Click Startup Script
#  Starts MongoDB, Node.js server, and opens
#  the website in the default browser.
# ============================================

# -- Configuration --
MONGOD_BIN="$HOME/Downloads/mongodb-macos-aarch64--8.2.6/bin/mongod"
DB_PATH="$HOME/data/db"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=3000

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🌙  Mooneh.ai  Launcher         ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""

# -- Step 1: Start MongoDB --
echo -e "${YELLOW}[1/3]${NC} Checking MongoDB..."

if nc -z localhost 27017 2>/dev/null; then
    echo -e "  ${GREEN}✅ MongoDB is already running on port 27017${NC}"
else
    echo -e "  ⏳ Starting MongoDB..."
    mkdir -p "$DB_PATH"
    
    if command -v brew &> /dev/null && brew services list 2>/dev/null | grep -q mongodb; then
        brew services start mongodb-community >/dev/null 2>&1
    elif [ -x "$MONGOD_BIN" ]; then
        "$MONGOD_BIN" --dbpath "$DB_PATH" --fork --logpath "$PROJECT_DIR/mongodb.log" >/dev/null 2>&1
    elif command -v mongod &> /dev/null; then
        mongod --dbpath "$DB_PATH" --fork --logpath "$PROJECT_DIR/mongodb.log" >/dev/null 2>&1
    fi

    for i in {1..10}; do
        if nc -z localhost 27017 2>/dev/null; then
            echo -e "  ${GREEN}✅ MongoDB started successfully${NC}"
            break
        fi
        sleep 0.5
    done

    if ! nc -z localhost 27017 2>/dev/null; then
        echo -e "  ${RED}❌ Failed to start MongoDB. Check mongodb.log${NC}"
        echo -e "  ${YELLOW}Server will run using JSON fallback data.${NC}"
    fi
fi

# -- Step 2: Kill any existing Node server on the port --
echo ""
echo -e "${YELLOW}[2/3]${NC} Starting Node.js server..."

EXISTING_PID=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
    echo -e "  ⏳ Stopping existing process on port $PORT..."
    kill -9 $EXISTING_PID 2>/dev/null
    sleep 1
fi

# Also kill any leftover node server.js or nodemon
pkill -f "node server.js" 2>/dev/null
pkill -f "nodemon server.js" 2>/dev/null
sleep 1

# -- Step 3: Start the Node server --
cd "$PROJECT_DIR"
node server.js &
SERVER_PID=$!

# Wait for the server to be ready (up to 60 seconds — MongoDB + product loading can be slow)
echo -e "  ⏳ Waiting for server to load (connecting to DB, loading products)..."
SERVER_READY=false
for i in {1..60}; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "  ${RED}❌ Server process crashed. Check terminal output above.${NC}"
        exit 1
    fi
    if nc -z localhost $PORT 2>/dev/null; then
        echo -e "  ${GREEN}✅ Server is live at http://localhost:$PORT  (took ${i}s)${NC}"
        SERVER_READY=true
        break
    fi
    sleep 1
done

if [ "$SERVER_READY" = false ]; then
    echo -e "  ${RED}❌ Server timed out after 60s. Check terminal output.${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# -- Step 4: Open the browser --
echo ""
echo -e "${YELLOW}[3/3]${NC} Opening browser..."
open "http://localhost:$PORT"
echo -e "  ${GREEN}✅ Browser opened${NC}"

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 Mooneh.ai is running!${NC}"
echo -e "${CYAN}  URL:${NC}  http://localhost:$PORT"
echo -e "${CYAN}  PID:${NC}  $SERVER_PID"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop the server."
echo ""

# Keep the script alive; Ctrl+C cleanly shuts down
trap "echo ''; echo -e '${YELLOW}🛑 Shutting down server...${NC}'; kill $SERVER_PID 2>/dev/null; echo -e '${GREEN}✅ Done. Goodbye!${NC}'; exit 0" INT TERM

wait $SERVER_PID
