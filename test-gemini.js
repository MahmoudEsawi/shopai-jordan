require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
console.log("Using API Key starting with:", GEMINI_API_KEY.substring(0, 15));

async function test() {
    // Using gemini-2.5-flash (latest model, available on paid tier)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
            maxOutputTokens: 200,
        }
    });

    const prompt = 'قل: أهلاً وسهلاً! (say hello in Arabic briefly)';

    try {
        const result = await model.generateContent(prompt);
        console.log("✅ SUCCESS:", result.response.text());
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }
}
test();
