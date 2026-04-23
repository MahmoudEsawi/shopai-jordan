require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

function cleanString(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, '');
}

async function run() {
    try {
        await client.connect();
        const db = client.db('mooneh_db');
        const col = db.collection('products');
        
        const picsDir = path.join(__dirname, 'pics');
        const files = fs.readdirSync(picsDir);
        
        const products = await col.find({}).toArray();
        let updateCount = 0;
        
        for (const product of products) {
            let matchedFile = null;
            
            // Generate clean versions for comparison
            const nameEnClean = cleanString(product.name_en);
            const nameArClean = cleanString(product.name_ar);
            const nameClean = cleanString(product.name);
            
            for (const file of files) {
                // Ignore non-images
                if (!file.match(/\.(png|jpe?g|gif|webp)$/i)) continue;
                
                const fileNameClean = cleanString(file.replace(/\.[^/.]+$/, ""));
                
                // Try exact match first
                if (fileNameClean === nameEnClean || fileNameClean === nameArClean || fileNameClean === nameClean) {
                    matchedFile = file;
                    break;
                }
                
                // Try partial match if name is long enough
                if (nameEnClean.length > 4 && fileNameClean.includes(nameEnClean)) {
                    matchedFile = file;
                    break;
                }
                if (fileNameClean.length > 4 && nameEnClean.includes(fileNameClean)) {
                    matchedFile = file;
                    break;
                }
            }
            
            if (matchedFile) {
                const newUrl = `/pics/${matchedFile}`;
                if (product.image_url !== newUrl) {
                    await col.updateOne({ _id: product._id }, { $set: { image_url: newUrl } });
                    console.log(`✅ Matched: ${product.name_ar || product.name_en} -> ${matchedFile}`);
                    updateCount++;
                }
            } else {
                console.log(`❌ No match for: ${product.name_ar || product.name_en} (${product.name_en})`);
            }
        }
        
        console.log(`\n🎉 Updated ${updateCount} product images.`);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.close();
    }
}

run();
