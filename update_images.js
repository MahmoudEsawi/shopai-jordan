const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

// Dictionary mapping Arabic keywords to professional Unsplash images
const imageMap = [
  { keywords: ['قهوة', 'نسكافيه', 'كوفي'], url: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['شاي'], url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['كاكاو', 'شوكولاتة', 'نوتيلا', 'جلاكسي', 'سنيكرز'], url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['حليب', 'مبيض'], url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['لبنة', 'لبن', 'شنينة'], url: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['جبنة', 'حلوم', 'شيدر'], url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['زبدة'], url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f6f5b4?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['دجاج', 'ساديا', 'زنجر'], url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['لحم', 'مفروم'], url: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['برجر'], url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['بطاطا', 'ماكين'], url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['خضار', 'بازيلاء', 'ملوخية', 'باميا'], url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['زيت', 'عافية'], url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['أرز', 'رز', 'تايجر', 'صنوايت'], url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['سكر', 'الأسرة'], url: 'https://images.unsplash.com/photo-1581350744630-f1cbae67d9cc?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['عدس', 'حمص', 'فول'], url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['معكرونة', 'اندومي', 'نودلز'], url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['تونة', 'سردين'], url: 'https://images.unsplash.com/photo-1614777986387-015c2a89b696?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['رب البندورة', 'كاتشب', 'طماطم'], url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['خبز', 'حمام', 'توست'], url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['ماء', 'مياه'], url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['عصير', 'بيبسي', 'كوكا', 'سفن'], url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['شيبس', 'ليز', 'دوريتوس'], url: 'https://images.unsplash.com/photo-1566478989037-e924e5288219?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['بسكويت', 'اوريو', 'لواكر'], url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['فاين', 'محارم', 'ورق'], url: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['سائل', 'فيري', 'برسيل', 'كلور', 'صابون'], url: 'https://images.unsplash.com/photo-1584820927498-cafece648fc2?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['شامبو', 'معجون'], url: 'https://images.unsplash.com/photo-1535581252891-92524a87e3da?auto=format&fit=crop&w=400&q=80' },
  // Generic Fallbacks by category
  { keywords: ['مشروبات'], url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['ألبان'], url: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['مونة'], url: 'https://images.unsplash.com/photo-1587049352847-8d4e8941554a?auto=format&fit=crop&w=400&q=80' },
  { keywords: ['عناية'], url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80' },
];

const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';

async function updateImages() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('mooneh_db');
    const products = await db.collection('products').find({}).toArray();
    
    let updatedCount = 0;
    
    for (const product of products) {
      if(product.name_ar === "قهوة العميد (مع هيل)" && product.image_url === "/pics/alameedcoffee.png") {
        continue; // Keep the specific one if it exists
      }

      let matchedUrl = fallbackImage;
      const searchableText = `${product.name_ar} ${product.name} ${product.category}`.toLowerCase();
      
      for (const map of imageMap) {
        if (map.keywords.some(kw => searchableText.includes(kw))) {
          matchedUrl = map.url;
          break;
        }
      }
      
      await db.collection('products').updateOne(
        { _id: product._id },
        { $set: { image_url: matchedUrl } }
      );
      updatedCount++;
    }
    
    console.log(`✅ Successfully updated ${updatedCount} products with professional images!`);
  } catch(e) {
    console.error('Error updating images:', e);
  } finally {
    await client.close();
  }
}

updateImages();
