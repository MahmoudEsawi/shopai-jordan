# Project Documentation: Mooneh.ai (مونة.ai)

**Project Title:** Mooneh.ai - Intelligent Grocery & Event Planning Assistant  
**Domain:** Artificial Intelligence, E-Commerce, Web Development  
**Author:** Mahmoud Esawi  

---

## 1. Executive Summary

Mooneh.ai is a next-generation, AI-driven e-commerce grocery platform tailored specifically for the Jordanian market. It bridges the gap between traditional online grocery shopping and intelligent, automated meal and event planning. By integrating advanced Natural Language Processing (NLP) through Google Gemini AI, Mooneh.ai acts as a smart culinary assistant that can instantly interpret user requirements—such as budget constraints, dietary preferences, and event sizes—to generate optimized, localized shopping lists with real-time market pricing.

## 2. Motivation (Why I Made This Project)

Grocery shopping for specific events (e.g., family dinners, BBQs, holiday gatherings) is often a time-consuming and cognitively demanding task. Consumers frequently struggle to estimate the correct quantities of ingredients needed, balance their purchases against a strict budget, and locate all the necessary items across different store aisles or e-commerce categories.

Furthermore, existing grocery platforms in the Jordanian market function merely as static digital catalogs. They require users to know exactly what they want beforehand. I created Mooneh.ai to transform the grocery shopping experience from a passive browsing activity into an active, conversational, and highly personalized service. The goal is to bring the expertise of a seasoned event planner and local grocer directly to the consumer's smartphone or laptop.

## 3. Problem Statement

Modern consumers face several friction points in daily grocery shopping and event planning:
1. **Decision Fatigue:** Planning meals or events requires significant mental effort to calculate quantities and ensure no ingredients are forgotten.
2. **Budget Mismanagement:** Consumers often struggle to accurately predict the total cost of a recipe or event until they reach the checkout counter, leading to cart abandonment or overspending.
3. **Lack of Personalization:** Traditional e-commerce platforms lack the intelligence to understand context (e.g., "I need a healthy dinner for 4 people under 20 JOD").
4. **Localization Gap:** AI tools like standard ChatGPT provide generic recipes that often include ingredients unavailable or prohibitively expensive in the local Jordanian market.

## 4. Target Audience

Mooneh.ai is designed to serve a diverse demographic within Jordan, specifically targeting:
* **Busy Professionals & Parents:** Individuals who lack the time to meticulously plan family meals and need quick, reliable, and budget-friendly grocery solutions.
* **Event Hosts:** People organizing gatherings (BBQs, Iftars, parties) who need accurate quantity estimations to avoid food waste or shortages.
* **Budget-Conscious Shoppers:** University students and families looking to maximize their culinary output within strict financial constraints.
* **Tech-Savvy Consumers:** Users who prefer conversational, AI-driven interfaces over traditional search bars and paginated catalogs.

## 5. Proposed Solution

Mooneh.ai solves the aforementioned problems by introducing a "Conversational Commerce" model. 

Instead of manually searching for items, a user can open the AI chat panel and say: *"I am hosting a BBQ for 10 people this weekend. My budget is 50 JOD."* 
The AI assistant (powered by Google Gemini) instantly processes this context and:
1. Suggests a tailored menu appropriate for the local culture.
2. Calculates the exact quantities of meat, vegetables, bread, and charcoal needed for 10 people.
3. Cross-references the required ingredients with the actual inventory stored in the Mooneh.ai MongoDB database.
4. Generates a one-click "Add to Cart" shopping list that strictly adheres to the 50 JOD limit.

## 6. Key Features

### 6.1. Smart Shopping Assistant (AI Chatbot)
* **Context-Aware Recommendations:** Understands localized slang, events, and dietary needs in both English and Arabic.
* **Dynamic Budgeting:** Automatically adjusts recommendations based on the user's defined budget.
* **Instant Cart Integration:** AI-suggested items can be added directly to the user's shopping basket with a single click.

### 6.2. Premium eCommerce Storefront
* **Bilingual Interface:** Full localization supporting both English and Arabic.
* **Advanced Filtering & Sorting:** Real-time filtering by category, price, dietary restrictions (Vegan, Halal, Gluten-Free), and nutritional values (Calories, Protein).
* **Responsive UI/UX:** A modern, visually stunning interface utilizing glass-morphism, smooth micro-animations, and a cohesive brand identity (Forest Green & Lime).
* **Secure Checkout:** Guarded checkout process ensuring only authenticated users can place orders, securing customer data and preventing spam.

### 6.3. Comprehensive Admin Dashboard
* **Inventory Management:** Full CRUD (Create, Read, Update, Delete) interface to manage the product catalog seamlessly.
* **Order Tracking:** Real-time visibility into customer orders and fulfillment statuses.
* **Analytics:** High-level metrics tracking total products, active users, and platform health.

## 7. Technology Stack

The project utilizes a modern, robust, and scalable JavaScript-centric architecture:

* **Frontend:** 
  * HTML5, CSS3, Vanilla JavaScript (DOM manipulation)
  * TailwindCSS (Utility classes for rapid responsive design)
  * FontAwesome & Google Fonts (Typography and Iconography)
* **Backend:** 
  * **Node.js:** JavaScript runtime for backend execution.
  * **Express.js:** Web application framework for routing and API management.
* **Database:** 
  * **MongoDB:** NoSQL database used for flexible, scalable storage of products, user credentials, carts, and orders.
* **Artificial Intelligence:** 
  * **Google Gemini API (gemini-2.5-flash):** Serves as the core NLP engine for the smart assistant, offering high-speed reasoning and robust bilingual conversational capabilities.
* **Security & Utilities:** 
  * `bcrypt`: For secure password hashing and salting.
  * `crypto`: For generating secure authentication tokens.
  * `dotenv`: For managing sensitive environment variables securely.

## 8. System Architecture Overview

1. **Client Tier (Browser):** The user interacts with the UI. When asking the AI a question, an asynchronous `fetch` request is sent to the Express API containing the message and the conversation history.
2. **Application Tier (Express Server):** The server receives the prompt, injects system instructions (acting as 'Mooneh', the Jordanian expert), retrieves the current store inventory from MongoDB, and forwards the entire context to the Gemini API.
3. **AI Tier (Google Gemini):** Gemini analyzes the prompt against the inventory, generates a localized response, and formats a structured JSON shopping list.
4. **Data Tier (MongoDB):** The server verifies the AI's product suggestions against the database to ensure items are in-stock and prices are accurate, then sends the final payload back to the client.

## 9. Conclusion and Future Work

Mooneh.ai successfully demonstrates the viability of integrating Generative AI into traditional e-commerce paradigms. It shifts the burden of planning and searching away from the user and onto the system.

**Future Enhancements could include:**
* **Payment Gateway Integration:** Connecting to local payment providers (e.g., eFAWATEERcom, CliQ) for direct online checkout.
* **Delivery Logistics Tracking:** Implementing real-time GPS tracking for dispatched orders.
* **Advanced Personalization:** Utilizing machine learning on past order history to predict when a user is running low on staple items and automatically suggesting a restock cart.
