require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

console.log("Using API Key starting with:", GEMINI_API_KEY.substring(0, 15));

async function test() {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
            maxOutputTokens: 8192,
        }
    });

    const prompt = `Act as an inventory management expert for my e-commerce store. I will provide a list of items, and you need to categorize them, suggest a SEO-friendly title for each, and write a 2-line catchy description for a mobile app notification.

Items:

iPhone 15 Pro Max - Natural Titanium.

Mechanical Gaming Keyboard - RGB - Blue Switches.

Organic Arabica Coffee Beans - 1kg.

Output the result in a clean JSON format so I can parse it directly in my application.`;

    try {
        const result = await model.generateContent(prompt);
        console.log("SUCCESS:");
        console.log(result.response.text());
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
test();
