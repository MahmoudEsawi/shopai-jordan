require('dotenv').config();
const { MongoClient } = require('mongodb');

async function findNoImageProducts() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mooneh_db';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('mooneh_db');
        const col = db.collection('products');

        // Find products where image_url is missing, null, empty, or a placeholder
        const noImage = await col.find({
            $or: [
                { image_url: { $exists: false } },
                { image_url: null },
                { image_url: '' },
                { image_url: { $regex: 'placeholder|via\\.placeholder\\.com', $options: 'i' } }
            ]
        }).toArray();

        console.log(`\n📋 Found ${noImage.length} product(s) without a real photo:\n`);
        console.log('─'.repeat(70));

        noImage.forEach((p, i) => {
            const name    = p.name_ar || p.name_en || p.name || '(no name)';
            const cat     = p.category || '(no category)';
            const id      = p._id ? p._id.toString() : '(no id)';
            const imgVal  = p.image_url || '(missing)';
            console.log(`${String(i + 1).padStart(3)}. ${name}`);
            console.log(`      Category : ${cat}`);
            console.log(`      _id      : ${id}`);
            console.log(`      image_url: ${imgVal.substring(0, 80)}`);
            console.log();
        });

        console.log('─'.repeat(70));
        console.log(`Total: ${noImage.length} products without photos`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}

findNoImageProducts();
