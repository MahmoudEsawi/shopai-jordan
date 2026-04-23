const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mooneh_db';

function simplifyStr(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[-_]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').trim().replace(/\s+/g, ' ');
}

async function run() {
    const picsDir = path.join(__dirname, 'pics');
    const files = fs.readdirSync(picsDir).filter(f => f.match(/\.(png|jpe?g|webp|gif)$/i));
    console.log(`Found ${files.length} images in pics directory.\n`);

    const jsonPath = path.join(__dirname, 'data', 'jordan_products.json');
    let memoryProducts = [];
    if (fs.existsSync(jsonPath)) {
        memoryProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }

    let mongoClient;
    let mongoCollection = null;
    let productsToProcess = memoryProducts;

    try {
        mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await mongoClient.connect();
        const db = mongoClient.db('mooneh_db');
        mongoCollection = db.collection('products');
        console.log('✅ Connected to MongoDB!');
        productsToProcess = await mongoCollection.find({}).toArray();
    } catch (e) {
        console.log('⚠️ Could not connect to MongoDB. Searching local JSON fallback only.', e.message);
    }

    let matchedCount = 0;

    for (let product of productsToProcess) {
        const nameEn = product.name_en || product.name || '';
        const nameAr = product.name_ar || '';
        const simpleEn = simplifyStr(nameEn);
        const simpleAr = simplifyStr(nameAr);
        const wordTokens = simpleEn.split(' ').filter(w => w.length > 2);

        let matches = [];

        // Exact mapping from previous script logic (highly accurate for Arabic names)
        const exactMapping = {
            "قهوة العميد (مع هيل)": ["alameedcoffee.png", null],
            "ذرة حلوة البستان": ["Al Bustan Sweet Corn1.jpg", "Al Bustan Sweet Corn2.jpg"],
            // Check matches folder...
        };

        if (exactMapping[nameAr]) {
            matches = exactMapping[nameAr].filter(v => v);
        } else {
            // Fuzzy Match
            matches = files.filter(f => {
                const sFile = simplifyStr(f.replace(/\.[^/.]+$/, "")); 
                let matchCount = 0;
                for (let w of wordTokens) {
                    if (sFile.includes(w)) matchCount++;
                }
                const matchRatio = wordTokens.length ? (matchCount / wordTokens.length) : 0;
                const sFileNoNum = sFile.replace(/\d+$/, '').trim();
                
                return (matchRatio >= 0.7 && wordTokens.length > 0) || sFileNoNum === simpleEn || sFile === simpleEn || sFile.includes(simpleEn) || sFile.includes(simpleAr);
            });
        }

        if (matches.length > 0) {
            matches.sort((a, b) => {
                const aIs2 = a.includes('2') || a.includes('(2)');
                const bIs2 = b.includes('2') || b.includes('(2)');
                if (aIs2 && !bIs2) return 1;
                if (!aIs2 && bIs2) return -1;
                return a.localeCompare(b);
            });

            const img1 = matches[0];
            const img2 = matches.length > 1 ? matches[1] : null;

            // Updated fields
            const setFields = { image_url: `/pics/${img1}` };
            if (img2) setFields.image_url_2 = `/pics/${img2}`;

            // Update Mongo
            if (mongoCollection) {
                await mongoCollection.updateOne({ _id: product._id }, { $set: setFields });
            }

            // Update memory array
            const memProd = memoryProducts.find(p => p.name_ar === nameAr);
            if (memProd) {
                memProd.image_url = setFields.image_url;
                if (setFields.image_url_2) memProd.image_url_2 = setFields.image_url_2;
            }

            console.log(`✅ MATCHED: ${nameAr} -> ${img1} ${img2 ? ' & ' + img2 : ''}`);
            matchedCount++;
        }
    }

    // Save JSON
    fs.writeFileSync(jsonPath, JSON.stringify(memoryProducts, null, 2), 'utf8');
    
    if (mongoClient) await mongoClient.close();
    console.log(`\n🎉 Script finished! Assigned images to ${matchedCount} products.`);
}

run();
