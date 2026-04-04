const { MongoClient } = require('mongodb');
const google = require('googlethis');

const uri = 'mongodb://127.0.0.1:27017/mooneh_db';

async function fetchImages() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('mooneh_db');
    const collection = db.collection('products');
    
    // Fetch all products to overwrite bad hotlinked images
    const products = await collection.find({}).toArray();
    console.log(`Working on ${products.length} products...`);
    
    let updatedCount = 0;
    
    for (const p of products) {
      if (p.name_ar === "قهوة العميد (مع هيل)" && p.image_url === "/pics/alameedcoffee.png") {
        console.log(`Skipping predefined image for: ${p.name_ar}`);
        continue; // preserve original if you want
      }
      
      // Strict full name and brand search
      const query = `${p.name_ar} ${p.brand ? p.brand : ''}`.trim();
      console.log(`Searching for: ${query}`);
      
      try {
        const images = await google.image(query, { safe: false });
        // Get first valid image
        if (images && images.length > 0) {
            let selectedUrl = null;
            // Iterate over results to avoid garbage/watermarked/blocked urls
            for (const img of images) {
                const url = img.url;
                if (!url.startsWith('http')) continue;
                
                // Block bad CDNs that prevent hotlinking (causes broken images)
                const isBlocked = ['lookaside', 'facebook', 'fbsbx', 'instagram', 'tiktok', 'twimg', 'x-raw-image', 'amazon'].some(bad => url.includes(bad));
                
                if (!isBlocked) {
                    selectedUrl = url;
                    break;
                }
            }
          
            if (selectedUrl) {
              await collection.updateOne({ _id: p._id }, { $set: { image_url: selectedUrl } });
              console.log(`✅ Updated [${p.name_ar}] -> ${selectedUrl.substring(0,60)}...`);
              updatedCount++;
            } else {
              console.log(`⚠️ No good image URL found for [${p.name_ar}]`);
            }
        } else {
          console.log(`⚠️ No images returned for [${p.name_ar}]`);
        }
      } catch (err) {
        console.log(`❌ Search error for [${p.name_ar}]: ${err.message}`);
      }
      
      // Delay to avoid Google blocking
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`\n🎉 Processed completed! Successfully updated ${updatedCount} products.`);
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await client.close();
  }
}

fetchImages();
