require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function run() {
    try {
        await client.connect();
        const db = client.db('mooneh_db');
        const col = db.collection('products');
        
        const picsDir = path.join(__dirname, 'pics');
        const fileNames = fs.readdirSync(picsDir).filter(f => f.match(/\.(png|jpe?g|gif|webp)$/i));
        
        const products = await col.find({}).toArray();
        const productsToMatch = products.filter(p => !p.image_url || p.image_url === '' || !fileNames.includes(p.image_url.replace('/pics/', '')));
        
        console.log(`Found ${productsToMatch.length} products to potentially match.`);
        if(productsToMatch.length === 0) {
            console.log("Everything is already matched!");
            return;
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: {
                maxOutputTokens: 8000
            }
        });

        const prompt = `
You are a matching engine. Your task is to match Arabic product names with English image filenames.

Available Image Filenames:
${JSON.stringify(fileNames)}

Products needing images:
${JSON.stringify(productsToMatch.map(p => ({ id: p._id, name: p.name_ar || p.name_en || p.name })))}

Find the best matching image filename for each product based on meaning/translation. Only include pairs where you are reasonably confident.
Output JSON format:
{
  "matches": [
    { "product_id": "id here", "image_filename": "filename here" }
  ]
}
`;
        console.log("Asking Gemini to match...");
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const matchData = JSON.parse(responseText);
        
        let updateCount = 0;
        for (const match of matchData.matches) {
            const product = products.find(p => String(p._id) === match.product_id);
            if (product && fileNames.includes(match.image_filename)) {
                await col.updateOne(
                    { _id: new ObjectId(match.product_id) }, 
                    { $set: { image_url: `/pics/${match.image_filename}` } }
                );
                console.log(`✅ Matched: ${product.name_ar || product.name} -> ${match.image_filename}`);
                updateCount++;
            }
        }
        
        console.log(`\n🎉 Gemini successfully updated ${updateCount} product images!`);
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.close();
    }
}

run();
