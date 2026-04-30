<div align="center">
  <img src="https://img.shields.io/badge/Mooneh.ai-Jordan-25a55f?style=for-the-badge&logo=shopify" alt="Mooneh.ai" />
  <img src="https://img.shields.io/badge/Powered%20by-MongoDB%20|%20Node.js-1a4d3c?style=for-the-badge&logo=mongodb" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=google" alt="Google Gemini AI" />

  <br><br>

  <h1 align="center">🛒 Mooneh.ai (مونة.ai)</h1>

  <p align="center">
    <strong>Your Smart Grocery & AI Shopping Assistant for the Jordanian Market</strong>
    <br>
    <em>مساعد التسوق الذكي للمملكة الأردنية</em>
  </p>
  
  <p align="center">
    <a href="#-key-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-admin-dashboard">Admin Panel</a> •
    <a href="#-technology-stack">Tech Stack</a> •
    <a href="#-deployment">Deployment</a>
  </p>
</div>

<hr>

## ✨ Overview

**Mooneh.ai** is a modern, comprehensive, and intelligent grocery platform built for the Jordanian market. Forget the hassle of manual grocery planning — simply tell Mooneh's AI assistant what kind of event you're hosting, and it will instantly generate an optimized, budget-aware shopping list tailored to local Jordanian stores and real market prices.

It is divided into two primary systems:
1. **The Storefront:** A premium e-commerce interface with an integrated **Google Gemini AI** assistant to plan gatherings (e.g., BBQs, Dinners) and calculate actual market prices.
2. **The Admin Dashboard:** A secured, unified control panel to autonomously manage store inventory, analyze metrics, and oversee registered users.

<br>

---

## 🚀 Key Features

### 🧠 AI-Powered Grocery Assistance
* **Event Planning Chatbot:** Natural language AI (powered by **Google Gemini**) parses your needs (e.g. *"I need a BBQ plan for 10 people at 50 JOD"*).
* **Multimodal Fridge Vision:** Snap a photo of your fridge, and the AI will analyze your existing ingredients to build recipes and missing grocery lists instantly.
* **Budget Optimization:** AI creates balanced category allocations depending on your budget restrictions.
* **Bilingual Persona:** Seamless interactions in both **Local Arabic** and **English**, perfectly synchronized with the active UI language.

### 🛍️ Premium eCommerce Storefront
* **Beautiful, Modern Aesthetics:** Featuring a deep forest green (`#1a4d3c`) and lime (`#98d02e`) design system using modern pill-shaped UI components.
* **User Authentication:** Complete frontend and backend implementation for **Sign Up**, **Sign In**, persistent session control, and **sign-in required checkout**.
* **Complex Filtering:** Filter your local Jordanian produce by Categories, Sorting, and robust client/server-side validation.
* **Sidebar Cart & Wishlist:** Fully interactive drawer controls allowing instant cart calculations.

### 🛡️ Complete Admin Dashboard (`/admin` & `/supervisor`)
* **Secure Access:** Built-in robust token session management. (Default admin bootstraps automatically on first run).
* **Direct Database Management:** Full CRUD (Create, Read, Update, Delete) capability attached directly to your MongoDB to manage **Products** and **Users**.
* **Live Order WebSockets:** Employs Socket.io for instantaneous real-time push notifications of new orders—no page refreshes required.
* **PDF Invoicing:** Generate professional, downloadable PDF invoices directly from the dashboard for any completed order.
* **Live Analytics Board:** Visual dashboard presenting total active users, live product catalogs, and daily system logs.

### 💻 Developer Experience Optimized
* **1-Click Start:** A custom macOS executable script (`start-mooneh.command`) auto-starts MongoDB, launches the internal Node server, and automatically pops open the Store and Admin browsers concurrently.

<br>

---

## 🛠️ Technology Stack

**Frontend:**
* **Vanilla JavaScript** & **HTML5/CSS3** (Tailored for blazing fast, framework-less, reactive components)
* **TailwindCSS** (Used for utility structures)
* **Google Fonts** (Inter, Space Grotesk, Cairo) & **Font Awesome**

**Backend:**
* **Node.js & Express**
* **MongoDB** Native Driver integration securely storing hashes for authentication
* **Google Gemini AI** (gemini-2.5-flash) for intelligent conversational shopping assistance
* **Crypto** library for password salting and token generation

<br>

---

## 🏎️ Quick Start

### Option 1: The Automation Way (macOS)
If you are on macOS and have `mongodb-community` installed or local MongoDB binaries configured:
1. Double click the **`start-mooneh.command`** file inside Finder.
2. *Done!* This automatically wakes up your MongoDB daemon, boots the Node server, and opens your browser directly into the site!

### Option 2: The Developer Way
*Requirements: Node.js 18+ and a running Local MongoDB instance.*

**1. Clone the repository:**
```bash
git clone https://github.com/MahmoudEsawi/mooneh-ai.git
cd mooneh-ai
```

**2. Install Modules:**
```bash
npm install
```

**3. Configure Environment Variables (`.env`):**
Create a `.env` file in the root:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/mooneh_db
GEMINI_API_KEY=your_gemini_api_key_here
```

> 💡 Get your free Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey)

**4. Start the Application:**
```bash
npm run dev
```

> 🌐 Main Storefront opens at `http://localhost:3000`
> 🛡️ Admin Dashboard opens at `http://localhost:3000/admin`

<br>

---

## 🎛️ Admin Dashboard

Mooneh.ai auto-seeds the admin account if it detects a fresh database.
* **Endpoint:** `/admin`
* **Username:** `admin`
* **Password:** `admin123`

*(Make sure you change this password once you log in or via MongoDB Compass for production servers!)*

<br>

---

## 🚀 Deployment

### Deploy to Render (Recommended — Free Tier)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:** Add `GEMINI_API_KEY` and `MONGODB_URI` (use MongoDB Atlas for cloud DB)
5. Deploy!

### Deploy to Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
2. Add environment variables (`GEMINI_API_KEY`, `MONGODB_URI`)
3. Railway auto-detects Node.js and deploys

### MongoDB Atlas (Cloud Database)

For production, replace local MongoDB with [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):
1. Create a free M0 cluster
2. Get your connection string
3. Update `MONGODB_URI` in your environment variables

<br>

---

## 📂 Project Structure
```text
📦 mooneh-ai
 ┣ 📂 static             # Core CSS definitions, JS application logic, and specific UI plugins
 ┃ ┣ 📂 css              # global styling, admin.css, auth.css, cart-sidebar.css
 ┃ ┗ 📂 js               # API controllers, translation dictionaries, toast utilities
 ┣ 📂 templates          # The physical View Layer
 ┃ ┣ 📜 admin.html       # The Admin Dashboard GUI
 ┃ ┣ 📜 auth.html        # Unified sign in/registration GUI
 ┃ ┗ 📜 index.html       # The Client Storefront View
 ┣ 📜 server.js          # The Express API, HTTP Gateway, Controller mappings
 ┣ 📜 start-mooneh.command # 1-Click Bootstrap Script
 ┣ 📜 seed.js            # Automated Database Population utility
 ┗ 📜 package.json       # Node package map
```

<br>

---

<p align="center">
  <b>Built with ❤️ by <a href="https://github.com/MahmoudEsawi">Mahmoud</a> for the Jordanian Market.</b>
  <br>
  <em>Powered by Google Gemini AI</em>
</p>
