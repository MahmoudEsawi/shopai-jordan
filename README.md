<div align="center">
  <img src="https://img.shields.io/badge/Mooneh.ai-Jordan-25a55f?style=for-the-badge&logo=shopify" alt="Mooneh.ai" />
  <img src="https://img.shields.io/badge/Powered%20by-MongoDB%20|%20Node.js-1a4d3c?style=for-the-badge&logo=mongodb" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/AI-Hugging%20Face-ffcc00?style=for-the-badge&logo=huggingface" alt="Hugging Face AI" />

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
    <a href="#-technology-stack">Tech Stack</a>
  </p>
</div>

<hr>

## ✨ Overview

**Mooneh.ai** is a modern, comprehensive, and intelligent grocery platform. Forget the hassle of manual grocery planning. Simply tell Mooneh's AI robot what kind of event you're hosting, and it will instantly generate an optimized, budget-aware shopping list specifically tailored for your local Jordanian stores. 

It is divided into two primary systems:
1. **The Storefront:** A premium e-commerce interface with an integrated Hugging Face AI assistant to plan gatherings (e.g., BBQs, Dinners) and calculate actual market prices.
2. **The Admin Dashboard:** A secured, unified control panel to autonomously manage store inventory, analyze metrics, and oversee registered users.

<br>

---

## 🚀 Key Features

### 🧠 AI-Powered Grocery Assistance
* **Event Planning Chatbot:** Natural language AI parses your needs (e.g. *"I need a BBQ plan for 10 people at 50 JOD"*).
* **Budget Optimization:** AI creates balanced category allocations depending on your budget restrictions.
* **Bilingual Support:** Seamless interactions in both **Local Arabic** and **English**.

### 🛍️ Premium eCommerce Storefront
* **Beautiful, Modern Aesthetics:** Featuring a deep forest green (`#1a4d3c`) and lime (`#98d02e`) design system using modern pill-shaped UI components. 
* **User Authentication:** Complete frontend and backend implementation for **Sign up**, **Sign In**, and persistent session control.
* **Complex Filtering:** Filter your local Jordanian produce by Categories, Sorting, and robust client/server-side validation.
* **Sidebar Cart & Wishlist:** Fully interactive drawer controls allowing instant cart calculations.

### 🛡️ Complete Admin Dashboard (`/admin`)
* **Secure Access:** Built-in JWT-free robust token sessionization. (Default admin bootstraps automatically on first run).
* **Direct Database Management:** Full CRUD (Create, Read, Update, Delete) capability attached directly to your local MongoDB to manage **Products** and **Users**.
* **Live Analytics Board:** Visual dashboard presenting total active users, live product catalogs, and daily system logs.

### 💻 Developer Experience Optimized
* **1-Click Start:** A custom macOS executable script (`start-mooneh.command`) auto-starts MongoDB, launches the internal node server, and automatically pops open the Store and Admin browsers concurrently.

<br>

---

## 🛠️ Technology Stack

**Frontend Framework:**
* **Vanilla JavaScript** & **HTML5/CSS3** (Tailored for blazing fast, framework-less, reactive components)
* **TailwindCSS** (Used conceptually for utility structures)
* **Google Fonts** (Inter, Space Grotesk, Cairo) & **Font Awesome**

**Backend Architecture:**
* **Node.js & Express** 
* **MongoDB** Native Driver integration securely storing hashes for authentication. 
* **Hugging Face API** for LLM integrations (Mistral/Llama based inference)
* **Crypto** library for password salting and token generation 

<br>

---

## 🏎️ Quick Start

### Option 1: The Automation Way (macOS)
If you are on macOS and have `mongodb-community` installed or local MongoDB binaries configured:
1. Double click the **`start-mooneh.command`** file inside finder.
2. *Done!* This automatically wakes up your MongoDB daemon, boots the Node server, and opens your browser directly into the site!

### Option 2: The Developer Way
*Requirements: Node.js 18+ and a running Local MongoDB instance.*

**1. Clone the repository:**
```bash
git clone https://github.com/MahmoudEsawi/shopai-jordan.git
cd shopai-jordan
```

**2. Install Modules:**
```bash
npm install
```

**3. Configure Environment Variables (`.env`):**
Create a `.env` file in the root if not automatically generated:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/mooneh_db
HUGGINGFACE_API_KEY=your_key_here
```

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

*(Make sure you change this password once you log in or via MongoDB compass for production servers!)*

<br>

---

## 📂 Project Structure
```text
📦 shopai-jordan
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
</p>
