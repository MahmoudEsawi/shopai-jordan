require('dotenv').config();
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

async function run() {
  await client.connect();
  const db = client.db('mooneh_db');
  const col = db.collection('products');

  const newProducts = [
    // === More Vegetables ===
    { name_ar: 'ثوم طازج', name_en: 'Fresh Garlic', brand: 'بلدي', category: 'خضار', price_jod: 0.5, size: '250g', image_url: '/pics/garlic.png', nutrition_per_100g: { calories: 149, protein: 6, carbs: 33, fat: 0.5 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'خس طازج', name_en: 'Fresh Lettuce', brand: 'بلدي', category: 'خضار', price_jod: 0.5, size: 'رأس', image_url: '/pics/lettuce.png', nutrition_per_100g: { calories: 15, protein: 1, carbs: 3, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'جزر طازج', name_en: 'Fresh Carrots', brand: 'بلدي', category: 'خضار', price_jod: 0.5, size: '1kg', image_url: '/pics/carrot.png', nutrition_per_100g: { calories: 41, protein: 1, carbs: 10, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'كوسا بلدية', name_en: 'Fresh Zucchini', brand: 'بلدي', category: 'خضار', price_jod: 0.75, size: '1kg', image_url: '/pics/zucchini.png', nutrition_per_100g: { calories: 17, protein: 1, carbs: 3, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'باذنجان بلدي', name_en: 'Fresh Eggplant', brand: 'بلدي', category: 'خضار', price_jod: 0.6, size: '1kg', image_url: '/pics/eggplant.png', nutrition_per_100g: { calories: 25, protein: 1, carbs: 6, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'ملفوف أبيض', name_en: 'White Cabbage', brand: 'بلدي', category: 'خضار', price_jod: 0.4, size: '1kg', image_url: '/pics/cabbage.png', nutrition_per_100g: { calories: 25, protein: 1, carbs: 6, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'فجل أحمر', name_en: 'Red Radish', brand: 'بلدي', category: 'خضار', price_jod: 0.35, size: 'حزمة', image_url: '/pics/radish.png', nutrition_per_100g: { calories: 16, protein: 0.7, carbs: 3, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'جرجير طازج', name_en: 'Fresh Arugula', brand: 'بلدي', category: 'خضار', price_jod: 0.25, size: 'حزمة', image_url: '/pics/arugula.png', nutrition_per_100g: { calories: 25, protein: 2.5, carbs: 4, fat: 0.7 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'فلفل أخضر حار', name_en: 'Hot Green Pepper', brand: 'بلدي', category: 'خضار', price_jod: 0.5, size: '500g', image_url: '/pics/hotpepper.png', nutrition_per_100g: { calories: 40, protein: 2, carbs: 9, fat: 0.4 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },

    // === More Fruits ===
    { name_ar: 'موز طازج', name_en: 'Fresh Bananas', brand: 'مستورد', category: 'فواكه', price_jod: 1.0, size: '1kg', image_url: '/pics/banana.png', nutrition_per_100g: { calories: 89, protein: 1, carbs: 23, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'تفاح أحمر', name_en: 'Red Apples', brand: 'مستورد', category: 'فواكه', price_jod: 1.5, size: '1kg', image_url: '/pics/apple.png', nutrition_per_100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'برتقال طازج', name_en: 'Fresh Oranges', brand: 'بلدي', category: 'فواكه', price_jod: 1.0, size: '1kg', image_url: '/pics/orange.png', nutrition_per_100g: { calories: 47, protein: 1, carbs: 12, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'عنب أخضر', name_en: 'Green Grapes', brand: 'بلدي', category: 'فواكه', price_jod: 2.0, size: '1kg', image_url: '/pics/grapes.png', nutrition_per_100g: { calories: 69, protein: 0.7, carbs: 18, fat: 0 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'فراولة طازجة', name_en: 'Fresh Strawberries', brand: 'بلدي', category: 'فواكه', price_jod: 2.5, size: '500g', image_url: '/pics/strawberry.png', nutrition_per_100g: { calories: 32, protein: 0.7, carbs: 8, fat: 0.3 }, is_halal: true, is_healthy: true, is_vegetarian: true, is_vegan: true },

    // === More Meats ===
    { name_ar: 'لحم خروف للطبخ', name_en: 'Lamb Meat for Cooking', brand: 'بلدي', category: 'لحوم', price_jod: 11.0, size: '1kg', image_url: '/pics/lamb.png', nutrition_per_100g: { calories: 294, protein: 25, carbs: 0, fat: 21 }, is_halal: true },
    { name_ar: 'أجنحة دجاج طازجة', name_en: 'Fresh Chicken Wings', brand: 'عزوتنا', category: 'لحوم', price_jod: 3.0, size: '1kg', image_url: '/pics/chickenwings.png', nutrition_per_100g: { calories: 203, protein: 18, carbs: 0, fat: 14 }, is_halal: true },
    { name_ar: 'كباب لحم جاهز', name_en: 'Ready Lamb Kebab', brand: 'سنيورة', category: 'لحوم', price_jod: 5.5, size: '1kg', image_url: '/pics/kebab.png', nutrition_per_100g: { calories: 260, protein: 20, carbs: 4, fat: 18 }, is_halal: true },
    { name_ar: 'ستيك لحم بقري', name_en: 'Beef Steak', brand: 'بلدي', category: 'لحوم', price_jod: 8.5, size: '500g', image_url: '/pics/steak.png', nutrition_per_100g: { calories: 271, protein: 26, carbs: 0, fat: 18 }, is_halal: true },

    // === More Spices ===
    { name_ar: 'ملح ناعم', name_en: 'Fine Salt', brand: 'البحر الميت', category: 'بهارات', price_jod: 0.5, size: '1kg', image_url: '/pics/salt.png', nutrition_per_100g: {} },
    { name_ar: 'فلفل أسود مطحون', name_en: 'Ground Black Pepper', brand: 'كباتيلو', category: 'بهارات', price_jod: 1.5, size: '100g', image_url: '/pics/blackpepper.png', nutrition_per_100g: {} },
    { name_ar: 'كمون مطحون', name_en: 'Ground Cumin', brand: 'كباتيلو', category: 'بهارات', price_jod: 1.0, size: '100g', image_url: '/pics/cumin.png', nutrition_per_100g: {} },
    { name_ar: 'كركم مطحون', name_en: 'Ground Turmeric', brand: 'كباتيلو', category: 'بهارات', price_jod: 1.0, size: '100g', image_url: '/pics/turmeric.png', nutrition_per_100g: {} },
    { name_ar: 'بابريكا حلوة', name_en: 'Sweet Paprika', brand: 'كباتيلو', category: 'بهارات', price_jod: 1.25, size: '100g', image_url: '/pics/paprika.png', nutrition_per_100g: {} },
    { name_ar: 'قرفة مطحونة', name_en: 'Ground Cinnamon', brand: 'كباتيلو', category: 'بهارات', price_jod: 1.5, size: '100g', image_url: '/pics/cinnamon.png', nutrition_per_100g: {} },
    { name_ar: 'بهارات مشكلة (سبع بهارات)', name_en: 'Seven Spice Mix', brand: 'كباتيلو', category: 'بهارات', price_jod: 1.75, size: '100g', image_url: '/pics/sevenspice.png', nutrition_per_100g: {} },

    // === More Sauces ===
    { name_ar: 'صلصة ثوم جاهزة', name_en: 'Garlic Sauce (Toum)', brand: 'الدرة', category: 'صلصات', price_jod: 1.25, size: '250g', image_url: '/pics/toumsauce.png', nutrition_per_100g: { calories: 400, protein: 1, carbs: 5, fat: 42 } },
    { name_ar: 'خردل أصفر', name_en: 'Yellow Mustard', brand: 'هاينز', category: 'صلصات', price_jod: 1.5, size: '250g', image_url: '/pics/mustard.png', nutrition_per_100g: { calories: 60, protein: 4, carbs: 5, fat: 3 } },
    { name_ar: 'صلصة باربيكيو', name_en: 'BBQ Sauce', brand: 'هاينز', category: 'صلصات', price_jod: 2.0, size: '350g', image_url: '/pics/bbqsauce.png', nutrition_per_100g: { calories: 170, protein: 1, carbs: 40, fat: 0.5 } },

    // === Dairy additions ===
    { name_ar: 'قشطة قيمر', name_en: 'Thick Cream (Qaimar)', brand: 'بوك', category: 'ألبان وأجبان', price_jod: 1.0, size: '170g', image_url: '/pics/cream.png', nutrition_per_100g: { calories: 195, protein: 3, carbs: 4, fat: 19 }, is_halal: true },
    { name_ar: 'كريمة طبخ', name_en: 'Cooking Cream', brand: 'بوك', category: 'ألبان وأجبان', price_jod: 1.5, size: '200ml', image_url: '/pics/cookingcream.png', nutrition_per_100g: { calories: 240, protein: 2, carbs: 4, fat: 24 }, is_halal: true },
    { name_ar: 'جبنة عكاوي', name_en: 'Akkawi Cheese', brand: 'بلدي', category: 'ألبان وأجبان', price_jod: 3.5, size: '500g', image_url: '/pics/akkawi.png', nutrition_per_100g: { calories: 280, protein: 18, carbs: 2, fat: 22 }, is_halal: true },
    { name_ar: 'جبنة نابلسية', name_en: 'Nabulsi Cheese', brand: 'بلدي', category: 'ألبان وأجبان', price_jod: 4.0, size: '500g', image_url: '/pics/nabulsi.png', nutrition_per_100g: { calories: 300, protein: 20, carbs: 1, fat: 24 }, is_halal: true },
    { name_ar: 'لبن زبادي', name_en: 'Yogurt', brand: 'بلدنا', category: 'ألبان وأجبان', price_jod: 0.75, size: '1kg', image_url: '/pics/yogurt.png', nutrition_per_100g: { calories: 61, protein: 3, carbs: 5, fat: 3 }, is_halal: true, is_healthy: true },

    // === Canned / Prepared ===
    { name_ar: 'زيتون أخضر مخلل', name_en: 'Green Olives', brand: 'الدرة', category: 'معلبات', price_jod: 1.75, size: '500g', image_url: '/pics/olives.png', nutrition_per_100g: { calories: 145, protein: 1, carbs: 4, fat: 15 }, is_halal: true, is_healthy: true },
    { name_ar: 'فلافل جاهزة مجمدة', name_en: 'Frozen Falafel', brand: 'نبيل', category: 'مجمدات', price_jod: 2.0, size: '400g', image_url: '/pics/falafel.png', nutrition_per_100g: { calories: 330, protein: 13, carbs: 32, fat: 18 }, is_halal: true, is_vegetarian: true, is_vegan: true },
    { name_ar: 'سمبوسة لحم جاهزة', name_en: 'Ready Meat Sambousek', brand: 'نبيل', category: 'مجمدات', price_jod: 3.0, size: '500g', image_url: '/pics/sambousek.png', nutrition_per_100g: { calories: 280, protein: 10, carbs: 25, fat: 16 }, is_halal: true },

    // === Party Supplies ===
    { name_ar: 'صحون بلاستيك (25 قطعة)', name_en: 'Plastic Plates (25 pcs)', brand: 'عادي', category: 'مستلزمات حفلات', price_jod: 1.0, size: '25 قطعة', image_url: '/pics/plates.png', nutrition_per_100g: {} },
    { name_ar: 'أكواب بلاستيك (25 قطعة)', name_en: 'Plastic Cups (25 pcs)', brand: 'عادي', category: 'مستلزمات حفلات', price_jod: 0.75, size: '25 قطعة', image_url: '/pics/cups.png', nutrition_per_100g: {} },
    { name_ar: 'مناديل ورقية (كبير)', name_en: 'Paper Napkins (Large)', brand: 'فاين', category: 'مستلزمات حفلات', price_jod: 1.25, size: '100 منديل', image_url: '/pics/napkins.png', nutrition_per_100g: {} },
    { name_ar: 'أكياس قمامة كبيرة', name_en: 'Large Garbage Bags', brand: 'عادي', category: 'مستلزمات حفلات', price_jod: 0.75, size: '10 أكياس', image_url: '/pics/garbagebags.png', nutrition_per_100g: {} },
    { name_ar: 'شوك وسكاكين بلاستيك', name_en: 'Plastic Cutlery Set', brand: 'عادي', category: 'مستلزمات حفلات', price_jod: 1.0, size: '25 طقم', image_url: '/pics/cutlery.png', nutrition_per_100g: {} },

    // === Bakery ===
    { name_ar: 'مناقيش زعتر (6 قطع)', name_en: 'Zaatar Manakeesh (6 pcs)', brand: 'المخبز', category: 'مخبوزات', price_jod: 1.5, size: '6 قطع', image_url: '/pics/manakeesh.png', nutrition_per_100g: { calories: 280, protein: 7, carbs: 35, fat: 12 }, is_halal: true, is_vegetarian: true },
    { name_ar: 'خبز تورتيلا', name_en: 'Tortilla Wraps', brand: 'المطاحن', category: 'مخبوزات', price_jod: 1.25, size: '6 قطع', image_url: '/pics/tortilla.png', nutrition_per_100g: { calories: 300, protein: 8, carbs: 50, fat: 8 }, is_halal: true },

    // === Drinks ===
    { name_ar: 'عصير برتقال طبيعي', name_en: 'Fresh Orange Juice', brand: 'طيبة', category: 'مشروبات باردة', price_jod: 1.5, size: '1L', image_url: '/pics/orangejuice.png', nutrition_per_100g: { calories: 45, protein: 0.7, carbs: 10, fat: 0 }, is_halal: true, is_healthy: true },
    { name_ar: 'عصير ليمون ونعنع', name_en: 'Lemonade with Mint', brand: 'طيبة', category: 'مشروبات باردة', price_jod: 1.25, size: '1L', image_url: '/pics/lemonade.png', nutrition_per_100g: { calories: 40, protein: 0, carbs: 10, fat: 0 }, is_halal: true, is_healthy: true },
  ];

  const result = await col.insertMany(newProducts);
  console.log('✅ Inserted ' + result.insertedCount + ' new products');
  const total = await col.countDocuments();
  console.log('📦 Total products now: ' + total);
  await client.close();
}
run();
