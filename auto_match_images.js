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
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('mooneh_db');
        const collection = db.collection('products');

        const products = await collection.find({}).toArray();
        console.log(`Found ${products.length} products to update.\n`);

        const picsDir = path.join(__dirname, 'pics');
        const files = fs.readdirSync(picsDir).filter(f => f.match(/\.(png|jpe?g|webp|gif)$/i));
        console.log(`Found ${files.length} images in pics directory.\n`);

        let matched = 0;

        for (const product of products) {
            const nameEn = product.name_en || product.name || '';
            const arName = product.name_ar || '';
            const simpleName = simplifyStr(nameEn);
            const wordTokens = simpleName.split(' ').filter(w => w.length > 2);

            if (!simpleName) continue;

            // Find matching images
            let matches = files.filter(f => {
                const sFile = simplifyStr(f.replace(/\.[^/.]+$/, "")); // remove extension
                
                // Direct include (e.g. "al ghazaleen tea 500g" includes "tea")
                // A good match is when almost all tokens are in the filename
                let matchCount = 0;
                for (let w of wordTokens) {
                    if (sFile.includes(w)) matchCount++;
                }
                const matchRatio = matchCount / wordTokens.length;
                
                // OR exact match after removing trailing numbers
                const sFileNoNum = sFile.replace(/\d+$/, '').trim();
                
                return matchRatio >= 0.7 || sFileNoNum === simpleName || sFile === simpleName || sFile.includes(simpleName);
            });

            if (matches.length > 0) {
                // Determine img1 and img2 based on alphabetical order or presence of '2'
                matches.sort((a, b) => {
                    const aIs2 = a.includes('2') || a.includes('(2)');
                    const bIs2 = b.includes('2') || b.includes('(2)');
                    if (aIs2 && !bIs2) return 1;
                    if (!aIs2 && bIs2) return -1;
                    return a.localeCompare(b);
                });

                const img1 = matches[0];
                const img2 = matches.length > 1 ? matches[1] : null;

                const setFields = { image_url: `/pics/${img1}` };
                if (img2) {
                    setFields.image_url_2 = `/pics/${img2}`;
                }

                await collection.updateOne({ _id: product._id }, { $set: setFields });
                console.log(`✅ MATCHED: ${nameEn} (${arName}) -> ${img1} ${img2 ? ' & ' + img2 : ''}`);
                matched++;
            }
        }

        console.log(`\n🎉 Assigned images to ${matched} products automatically!`);
    } catch (err) {
        console.error("FATAL ERROR:", err);
    } finally {
        await client.close();
    }
}

run();
