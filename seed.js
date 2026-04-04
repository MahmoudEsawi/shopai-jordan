const { MongoClient } = require('mongodb');
require('dotenv').config();

// رابط الاتصال من ملف .env (MongoDB Atlas)
const uri = process.env.MONGODB_URI;

async function run() {
  if (!uri) {
    console.error('❌ لا يوجد MONGODB_URI في ملف .env');
    return;
  }

  const client = new MongoClient(uri);

  try {
    // الاتصال بالداتا بيس
    await client.connect();
    console.log("✅ تم الاتصال بسيرفر MongoDB بنجاح يا معلم!");

    // إنشاء الداتا بيس والـ Collection
    const database = client.db('mooneh_db');
    const productsCollection = database.collection('products');

    // الداتا: 100 منتج أردني حقيقي (مرتبة بطريقة NoSQL احترافية)
    const products = [
      // ☕ قسم المشروبات الساخنة (1-10)
      { name_ar: "قهوة العميد (مع هيل)", brand: "العميد", category: "مشروبات ساخنة", price_jod: 2.85, size: "250g", image_url: "/pics/alameedcoffee.png", nutrition_per_100g: { calories: 5, protein_g: 0.2, carbs_g: 0.5, fat_g: 0 }, description: "القهوة الأردنية الأولى، بن تركي محمص ومطحون مع الهيل." },
      { name_ar: "قهوة العميد (بدون هيل)", brand: "العميد", category: "مشروبات ساخنة", price_jod: 2.50, size: "250g", nutrition_per_100g: { calories: 5, protein_g: 0.2, carbs_g: 0.5, fat_g: 0 }, description: "بن تركي سادة للي بحب القهوة الثقيلة." },
      { name_ar: "شاي الغزالين (فرط)", brand: "الغزالين", category: "مشروبات ساخنة", price_jod: 3.20, size: "400g", nutrition_per_100g: { calories: 2, protein_g: 0, carbs_g: 0.5, fat_g: 0 }, description: "شاي سيلاني فرط، ملك القعدات والعصرونية." },
      { name_ar: "شاي محمود (علاقة)", brand: "شاي محمود", category: "مشروبات ساخنة", price_jod: 2.50, size: "100 bags", nutrition_per_100g: { calories: 2, protein_g: 0, carbs_g: 0.5, fat_g: 0 }, description: "شاي أسود فاخر وسريع التحضير." },
      { name_ar: "شاي ليبتون (علاقة)", brand: "ليبتون", category: "مشروبات ساخنة", price_jod: 2.80, size: "100 bags", nutrition_per_100g: { calories: 2, protein_g: 0, carbs_g: 0.5, fat_g: 0 }, description: "العلامة الصفراء المعروفة بكل بيت." },
      { name_ar: "نسكافيه ريد مج", brand: "نستله", category: "مشروبات ساخنة", price_jod: 5.50, size: "200g", nutrition_per_100g: { calories: 2, protein_g: 0.2, carbs_g: 0.4, fat_g: 0 }, description: "قهوة سريعة الذوبان للترويقة." },
      { name_ar: "قهوة بن طوقان", brand: "بن طوقان", category: "مشروبات ساخنة", price_jod: 2.20, size: "200g", nutrition_per_100g: { calories: 5, protein_g: 0.2, carbs_g: 0.5, fat_g: 0 }, description: "بن أردني عريق بطعم مميز." },
      { name_ar: "كاكاو هنتز", brand: "هنتز", category: "مشروبات ساخنة", price_jod: 3.50, size: "227g", nutrition_per_100g: { calories: 310, protein_g: 20, carbs_g: 14, fat_g: 21 }, description: "كاكاو خام ممتاز للحلويات والمشروبات." },
      { name_ar: "سحلب كباتيلو", brand: "كباتيلو", category: "مشروبات ساخنة", price_jod: 1.75, size: "250g", nutrition_per_100g: { calories: 380, protein_g: 5, carbs_g: 85, fat_g: 1.5 }, description: "مشروب الشتاء الأول، بس ضيف حليب." },
      { name_ar: "مبيض قهوة كوفي ميت", brand: "نستله", category: "مشروبات ساخنة", price_jod: 3.20, size: "400g", nutrition_per_100g: { calories: 550, protein_g: 2, carbs_g: 60, fat_g: 35 }, description: "مبيض قهوة بودرة خالي من الحليب." },

      // 🧀 قسم الألبان والأجبان (11-20)
      { name_ar: "لبنة طيبة الطازجة", brand: "طيبة", category: "ألبان وأجبان", price_jod: 1.65, size: "500g", nutrition_per_100g: { calories: 150, protein_g: 5, carbs_g: 4, fat_g: 10 }, description: "لبنة حامضة شوي وممتازة مع زيت الزيتون." },
      { name_ar: "حليب حمودة طازج", brand: "حمودة", category: "ألبان وأجبان", price_jod: 1.25, size: "1 Liter", nutrition_per_100g: { calories: 60, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.1 }, description: "حليب بقري طازج مبستر ومدعم." },
      { name_ar: "شنينة زين (عيران)", brand: "زين", category: "ألبان وأجبان", price_jod: 0.80, size: "1 Liter", nutrition_per_100g: { calories: 35, protein_g: 2, carbs_g: 3, fat_g: 1.5 }, description: "شنينة مالحة بتبرد على القلب مع المنسف." },
      { name_ar: "لبن رايب بلدنا", brand: "بلدنا", category: "ألبان وأجبان", price_jod: 1.10, size: "1 kg", nutrition_per_100g: { calories: 60, protein_g: 3.5, carbs_g: 5, fat_g: 3 }, description: "لبن زبادي متماسك وحامض طبيعي." },
      { name_ar: "جبنة حلوم نادك", brand: "نادك", category: "ألبان وأجبان", price_jod: 2.50, size: "225g", nutrition_per_100g: { calories: 310, protein_g: 21, carbs_g: 2, fat_g: 24 }, description: "جبنة حلوم ممتازة للقلي والشوي." },
      { name_ar: "جبنة مثلثات البقرة الضاحكة", brand: "البقرة الضاحكة", category: "ألبان وأجبان", price_jod: 1.25, size: "8 portions", nutrition_per_100g: { calories: 250, protein_g: 10, carbs_g: 6, fat_g: 20 }, description: "لسندويشات المدارس السريعة." },
      { name_ar: "جبنة كاسات كرافت", brand: "كرافت", category: "ألبان وأجبان", price_jod: 4.50, size: "480g", nutrition_per_100g: { calories: 320, protein_g: 11, carbs_g: 4, fat_g: 28 }, description: "جبنة كريمية قابلة للدهن." },
      { name_ar: "زبدة لورباك", brand: "لورباك", category: "ألبان وأجبان", price_jod: 3.20, size: "400g", nutrition_per_100g: { calories: 740, protein_g: 0.5, carbs_g: 0.5, fat_g: 82 }, description: "زبدة دنماركية غير مملحة." },
      { name_ar: "سمنة البلقاء بلدي", brand: "البلقاء", category: "ألبان وأجبان", price_jod: 6.50, size: "800g", nutrition_per_100g: { calories: 900, protein_g: 0, carbs_g: 0, fat_g: 100 }, description: "سمن بلدي أردني بيعطي نكهة خرافية للأكل." },
      { name_ar: "حليب مجفف نيدو", brand: "نيدو", category: "ألبان وأجبان", price_jod: 8.50, size: "900g", nutrition_per_100g: { calories: 500, protein_g: 24, carbs_g: 38, fat_g: 28 }, description: "حليب بودرة كامل الدسم." },

      // 🍗 قسم اللحوم والمجمدات (21-30)
      { name_ar: "ناجتس دجاج نبيل", brand: "نبيل", category: "مجمدات", price_jod: 4.25, size: "750g", nutrition_per_100g: { calories: 250, protein_g: 15, carbs_g: 15, fat_g: 14 }, description: "دجاج مقرمش المفضل عند الأطفال." },
      { name_ar: "برغر بقري سنيورة", brand: "سنيورة", category: "مجمدات", price_jod: 5.50, size: "1 kg", nutrition_per_100g: { calories: 280, protein_g: 16, carbs_g: 5, fat_g: 22 }, description: "برغر لحم متبل وجاهز للشوي." },
      { name_ar: "صدور دجاج الطاحونة", brand: "الطاحونة", category: "مجمدات", price_jod: 4.50, size: "1 kg", nutrition_per_100g: { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 }, description: "صدور دجاج مسحبة ونظيفة." },
      { name_ar: "دجاج كامل عزوتنا", brand: "عزوتنا", category: "لحوم", price_jod: 2.60, size: "1000g", nutrition_per_100g: { calories: 239, protein_g: 27, carbs_g: 0, fat_g: 13 }, description: "دجاج وطني طازج مبرد." },
      { name_ar: "كبة شامية نبيل", brand: "نبيل", category: "مجمدات", price_jod: 4.50, size: "500g", nutrition_per_100g: { calories: 320, protein_g: 12, carbs_g: 30, fat_g: 18 }, description: "كبة محشية لحمة وصنوبر جاهزة للقلي." },
      { name_ar: "مرتديلا دجاج سنيورة", brand: "سنيورة", category: "لحوم باردة", price_jod: 3.50, size: "500g", nutrition_per_100g: { calories: 220, protein_g: 14, carbs_g: 4, fat_g: 16 }, description: "مرتديلا دجاج سادة للفطور." },
      { name_ar: "هوت دوغ خزان", brand: "خزان", category: "لحوم باردة", price_jod: 2.80, size: "400g", nutrition_per_100g: { calories: 290, protein_g: 11, carbs_g: 5, fat_g: 25 }, description: "نقانق دجاج سريعة التحضير." },
      { name_ar: "بوب كورن دجاج نبيل", brand: "نبيل", category: "مجمدات", price_jod: 2.50, size: "400g", nutrition_per_100g: { calories: 260, protein_g: 14, carbs_g: 16, fat_g: 15 }, description: "قطع دجاج صغيرة مقرمشة." },
      { name_ar: "شاورما دجاج نبيل", brand: "نبيل", category: "مجمدات", price_jod: 3.20, size: "400g", nutrition_per_100g: { calories: 210, protein_g: 18, carbs_g: 6, fat_g: 12 }, description: "شاورما دجاج متبلة وجاهزة للتقليب." },
      { name_ar: "اسكالوب دجاج الطاحونة", brand: "الطاحونة", category: "مجمدات", price_jod: 2.90, size: "400g", nutrition_per_100g: { calories: 270, protein_g: 14, carbs_g: 20, fat_g: 15 }, description: "اسكالوب بانيه مقرمش." },

      // 🍚 قسم المونة والأرز (31-40)
      { name_ar: "أرز صن وايت (حبة قصيرة)", brand: "صن وايت", category: "مونة", price_jod: 4.75, size: "4 kg", nutrition_per_100g: { calories: 350, protein_g: 6.5, carbs_g: 79, fat_g: 0.5 }, description: "أرز كالروز الأسترالي، للمنسف والمحاشي." },
      { name_ar: "أرز تايجر (بسمتي)", brand: "تايجر", category: "مونة", price_jod: 3.25, size: "3 kg", nutrition_per_100g: { calories: 350, protein_g: 8, carbs_g: 77, fat_g: 0.5 }, description: "أرز بسمتي حبة طويلة للكبسة والبرياني." },
      { name_ar: "أرز محمود بسمتي", brand: "محمود", category: "مونة", price_jod: 4.25, size: "4 kg", nutrition_per_100g: { calories: 345, protein_g: 8, carbs_g: 78, fat_g: 0.5 }, description: "أرز هندي فاخر حبة طويلة." },
      { name_ar: "سكر الأسرة", brand: "الأسرة", category: "مونة", price_jod: 3.00, size: "5 kg", nutrition_per_100g: { calories: 400, protein_g: 0, carbs_g: 100, fat_g: 0 }, description: "سكر أبيض ناعم جداً." },
      { name_ar: "سكر شعبان", brand: "شعبان", category: "مونة", price_jod: 0.65, size: "1 kg", nutrition_per_100g: { calories: 400, protein_g: 0, carbs_g: 100, fat_g: 0 }, description: "سكر أردني عالي الجودة." },
      { name_ar: "طحين المطاحن الأردنية (زيرو)", brand: "المطاحن الأردنية", category: "مونة", price_jod: 1.50, size: "2 kg", nutrition_per_100g: { calories: 364, protein_g: 10, carbs_g: 76, fat_g: 1 }, description: "طحين متعدد الاستعمالات للمخبوزات." },
      { name_ar: "عدس مجروش الدرة", brand: "الدرة", category: "مونة", price_jod: 1.25, size: "1 kg", nutrition_per_100g: { calories: 353, protein_g: 25, carbs_g: 60, fat_g: 1 }, description: "عدس برتقالي أساسي لشوربة العدس." },
      { name_ar: "فريكة خضراء الدرة", brand: "الدرة", category: "مونة", price_jod: 3.00, size: "800g", nutrition_per_100g: { calories: 350, protein_g: 14, carbs_g: 70, fat_g: 2 }, description: "فريكة خشنة لطبخ شوربة الفريكة." },
      { name_ar: "برغل خشن الدرة", brand: "الدرة", category: "مونة", price_jod: 1.10, size: "800g", nutrition_per_100g: { calories: 342, protein_g: 12, carbs_g: 75, fat_g: 1.3 }, description: "برغل خشن لطبخ المجدرة." },
      { name_ar: "حمص حب الكسيح", brand: "الكسيح", category: "مونة", price_jod: 1.50, size: "1 kg", nutrition_per_100g: { calories: 364, protein_g: 19, carbs_g: 60, fat_g: 6 }, description: "حمص ناشف للطبخ والفلافل." },

      // 🥫 قسم المعلبات والمعكرونة (41-50)
      { name_ar: "معكرونة توليدو (سباغيتي)", brand: "توليدو", category: "مونة", price_jod: 0.60, size: "400g", nutrition_per_100g: { calories: 360, protein_g: 12, carbs_g: 73, fat_g: 1.5 }, description: "معكرونة قمح قاسي أردنية." },
      { name_ar: "شعيرية زين", brand: "زين", category: "مونة", price_jod: 0.50, size: "300g", nutrition_per_100g: { calories: 360, protein_g: 11, carbs_g: 75, fat_g: 1 }, description: "شعيرية محمصة للطبخ مع الأرز." },
      { name_ar: "جميد سائل الكسيح", brand: "الكسيح", category: "معلبات", price_jod: 2.00, size: "500g", nutrition_per_100g: { calories: 110, protein_g: 9, carbs_g: 5, fat_g: 6 }, description: "جميد أردني سائل وجاهز للمنسف." },
      { name_ar: "حمص بالطحينة الدرة", brand: "الدرة", category: "معلبات", price_jod: 0.85, size: "380g", nutrition_per_100g: { calories: 166, protein_g: 6, carbs_g: 14, fat_g: 9 }, description: "حمص جاهز للأكل." },
      { name_ar: "فول مدمس الكسيح", brand: "الكسيح", category: "معلبات", price_jod: 0.55, size: "390g", nutrition_per_100g: { calories: 110, protein_g: 7, carbs_g: 18, fat_g: 1 }, description: "فول حبة صغيرة وجاهز للتتبيل." },
      { name_ar: "مكدوس باذنجان الدرة", brand: "الدرة", category: "معلبات", price_jod: 3.75, size: "1 kg", nutrition_per_100g: { calories: 280, protein_g: 3, carbs_g: 10, fat_g: 25 }, description: "مكدوس محشي جوز بالزيت." },
      { name_ar: "رب البندورة توليدو", brand: "توليدو", category: "معلبات", price_jod: 1.20, size: "800g", nutrition_per_100g: { calories: 82, protein_g: 4, carbs_g: 18, fat_g: 0.5 }, description: "معجون طماطم مركز للطبخ." },
      { name_ar: "تونة جيشا بالزيت", brand: "جيشا", category: "معلبات", price_jod: 1.40, size: "160g", nutrition_per_100g: { calories: 198, protein_g: 29, carbs_g: 0, fat_g: 8 }, description: "تونة قطع متماسكة." },
      { name_ar: "سردين ميلو", brand: "ميلو", category: "معلبات", price_jod: 0.90, size: "125g", nutrition_per_100g: { calories: 208, protein_g: 24, carbs_g: 0, fat_g: 11 }, description: "سردين بالزيت النباتي." },
      { name_ar: "ذرة حلوة البستان", brand: "البستان", category: "معلبات", price_jod: 0.80, size: "340g", nutrition_per_100g: { calories: 86, protein_g: 3, carbs_g: 18, fat_g: 1 }, description: "ذرة معلبة جاهزة للسلطات." },

      // 🫒 قسم الزيوت والصلصات والبهارات (51-60)
      { name_ar: "زيت زيتون بكر ممتاز الجود", brand: "الجود", category: "زيوت", price_jod: 8.00, size: "1 Liter", nutrition_per_100g: { calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100 }, description: "زيت زيتون أردني عصرة أولى." },
      { name_ar: "زيت دوار الشمس عافية", brand: "عافية", category: "زيوت", price_jod: 2.99, size: "1.5 Liter", nutrition_per_100g: { calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100 }, description: "زيت خفيف للقلي والطبخ." },
      { name_ar: "زيت ذرة مازولا", brand: "مازولا", category: "زيوت", price_jod: 3.50, size: "1.5 Liter", nutrition_per_100g: { calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100 }, description: "زيت ذرة نقي." },
      { name_ar: "دبس رمان يمامة", brand: "يمامة", category: "صلصات", price_jod: 1.90, size: "300ml", nutrition_per_100g: { calories: 300, protein_g: 0, carbs_g: 75, fat_g: 0 }, description: "حموضة بتعطي طعم خرافي للفتوش." },
      { name_ar: "كاتشب هاينز", brand: "هاينز", category: "صلصات", price_jod: 2.20, size: "500ml", nutrition_per_100g: { calories: 110, protein_g: 1, carbs_g: 25, fat_g: 0 }, description: "الكاتشب الأول عالمياً." },
      { name_ar: "مايونيز ليزا", brand: "ليزا", category: "صلصات", price_jod: 1.50, size: "400g", nutrition_per_100g: { calories: 680, protein_g: 1, carbs_g: 3, fat_g: 75 }, description: "مايونيز كثيف للسندويشات." },
      { name_ar: "شطة الدرة", brand: "الدرة", category: "صلصات", price_jod: 0.80, size: "100ml", nutrition_per_100g: { calories: 30, protein_g: 1, carbs_g: 6, fat_g: 0.5 }, description: "صلصة فلفل حار سائلة." },
      { name_ar: "زعتر ملوكي كباتيلو", brand: "كباتيلو", category: "بهارات", price_jod: 3.00, size: "500g", nutrition_per_100g: { calories: 240, protein_g: 8, carbs_g: 30, fat_g: 12 }, description: "زعتر أردني مخلوط بالسمسم والسماق." },
      { name_ar: "سماق بلدي كباتيلو", brand: "كباتيلو", category: "بهارات", price_jod: 2.50, size: "250g", nutrition_per_100g: { calories: 350, protein_g: 4, carbs_g: 70, fat_g: 10 }, description: "سماق أحمر للمسخن والسلطات." },
      { name_ar: "بهارات منسف (حوايج) كباتيلو", brand: "كباتيلو", category: "بهارات", price_jod: 1.50, size: "100g", nutrition_per_100g: { calories: 300, protein_g: 10, carbs_g: 60, fat_g: 10 }, description: "خلطة صفراء لتعزيز لون وطعم المنسف." },

      // 🍯 قسم الحلويات والمربيات (61-70)
      { name_ar: "حلاوة طحينية الكسيح", brand: "الكسيح", category: "حلويات", price_jod: 2.25, size: "400g", nutrition_per_100g: { calories: 533, protein_g: 12, carbs_g: 45, fat_g: 33 }, description: "حلاوة سادة تذوب بالفم." },
      { name_ar: "طحينة الكسيح الذهبية", brand: "الكسيح", category: "مونة", price_jod: 2.49, size: "450g", nutrition_per_100g: { calories: 595, protein_g: 17, carbs_g: 21, fat_g: 53 }, description: "طحينة سمسم صافية." },
      { name_ar: "مربى مشمش الدرة", brand: "الدرة", category: "حلويات", price_jod: 1.50, size: "400g", nutrition_per_100g: { calories: 250, protein_g: 0.5, carbs_g: 65, fat_g: 0 }, description: "مربى مشمش بقطع الفاكهة." },
      { name_ar: "عسل طبيعي ياسمين", brand: "ياسمين", category: "حلويات", price_jod: 8.00, size: "500g", nutrition_per_100g: { calories: 304, protein_g: 0.3, carbs_g: 82, fat_g: 0 }, description: "عسل أردني جبلي طبيعي." },
      { name_ar: "نوتيلا", brand: "فيريرو", category: "حلويات", price_jod: 4.50, size: "400g", nutrition_per_100g: { calories: 539, protein_g: 6, carbs_g: 57, fat_g: 30 }, description: "شوكولاتة البندق للدهن." },
      { name_ar: "شوكولاتة جلاكسي سادة", brand: "جلاكسي", category: "سناكس", price_jod: 0.70, size: "36g", nutrition_per_100g: { calories: 546, protein_g: 6.6, carbs_g: 56, fat_g: 32 }, description: "شوكولاتة ناعمة بالحليب." },
      { name_ar: "بسكويت ماري مكفيتيز", brand: "مكفيتيز", category: "حلويات", price_jod: 1.20, size: "300g", nutrition_per_100g: { calories: 400, protein_g: 7, carbs_g: 75, fat_g: 10 }, description: "البسكويت الرسمي لليزي كيك." },
      { name_ar: "كعك جواد بالسمسم", brand: "جواد", category: "مخبوزات", price_jod: 1.50, size: "500g", nutrition_per_100g: { calories: 320, protein_g: 8, carbs_g: 50, fat_g: 12 }, description: "كعك مقرمش للترويقة مع الشاي." },
      { name_ar: "راحة حلقوم المهندس", brand: "المهندس", category: "حلويات", price_jod: 4.00, size: "500g", nutrition_per_100g: { calories: 380, protein_g: 1, carbs_g: 90, fat_g: 0 }, description: "حلقوم طري لسندويشات البسكوت." },
      { name_ar: "بقلاوة مشكلة زلاطيمو", brand: "زلاطيمو", category: "حلويات", price_jod: 12.00, size: "1 kg", nutrition_per_100g: { calories: 430, protein_g: 6, carbs_g: 45, fat_g: 25 }, description: "بقلاوة أردنية فاخرة للضيافة." },

      // 🧃 قسم المشروبات الباردة (71-80)
      { name_ar: "مياه معدنية غدير", brand: "غدير", category: "مشروبات باردة", price_jod: 0.35, size: "1.5 Liter", nutrition_per_100g: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }, description: "مياه شرب نقية." },
      { name_ar: "مياه نستله بيور لايف", brand: "نستله", category: "مشروبات باردة", price_jod: 0.40, size: "1.5 Liter", nutrition_per_100g: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }, description: "مياه شرب معبأة." },
      { name_ar: "ماتريكس كولا", brand: "ماتريكس", category: "مشروبات باردة", price_jod: 0.60, size: "1 Liter", nutrition_per_100g: { calories: 40, protein_g: 0, carbs_g: 10, fat_g: 0 }, description: "البديل المحلي القوي لمشروبات الكولا." },
      { name_ar: "بيبسي", brand: "بيبسي", category: "مشروبات باردة", price_jod: 0.45, size: "330ml", nutrition_per_100g: { calories: 42, protein_g: 0, carbs_g: 11, fat_g: 0 }, description: "مشروب غازي." },
      { name_ar: "سفن أب", brand: "سفن أب", category: "مشروبات باردة", price_jod: 0.45, size: "330ml", nutrition_per_100g: { calories: 40, protein_g: 0, carbs_g: 10, fat_g: 0 }, description: "مشروب غازي بنكهة الليمون." },
      { name_ar: "عصير راني (حبيبات الخوخ)", brand: "راني", category: "مشروبات باردة", price_jod: 0.40, size: "240ml", nutrition_per_100g: { calories: 45, protein_g: 0, carbs_g: 11, fat_g: 0 }, description: "عصير خوخ مع قطع طبيعية." },
      { name_ar: "عصير سن توب برتقال", brand: "سن توب", category: "مشروبات باردة", price_jod: 0.25, size: "125ml", nutrition_per_100g: { calories: 48, protein_g: 0, carbs_g: 12, fat_g: 0 }, description: "عصير المدارس المفضل للأطفال." },
      { name_ar: "شراب الفيمتو", brand: "فيمتو", category: "مشروبات باردة", price_jod: 2.20, size: "710ml", nutrition_per_100g: { calories: 350, protein_g: 0, carbs_g: 85, fat_g: 0 }, description: "شراب توت مركز لرمضان." },
      { name_ar: "حليب شوكولاتة طيبة", brand: "طيبة", category: "مشروبات باردة", price_jod: 0.35, size: "200ml", nutrition_per_100g: { calories: 80, protein_g: 3, carbs_g: 10, fat_g: 2.5 }, description: "حليب معقم بنكهة الكاكاو." },
      { name_ar: "مشروب شعير موسي", brand: "موسي", category: "مشروبات باردة", price_jod: 0.70, size: "330ml", nutrition_per_100g: { calories: 35, protein_g: 0.2, carbs_g: 8, fat_g: 0 }, description: "بيرة خالية من الكحول." },

      // 🍿 قسم السناكس والتفريز (81-90)
      { name_ar: "شيبس مستر شيبس (بيتزا)", brand: "مستر شيبس", category: "سناكس", price_jod: 0.50, size: "100g", nutrition_per_100g: { calories: 500, protein_g: 6, carbs_g: 55, fat_g: 28 }, description: "الشيبس الشعبي الأول بطعم البيتزا." },
      { name_ar: "شيبس ليز (ملح)", brand: "ليز", category: "سناكس", price_jod: 0.50, size: "50g", nutrition_per_100g: { calories: 536, protein_g: 6, carbs_g: 53, fat_g: 33 }, description: "بطاطا شيبس أصلية مقرمشة." },
      { name_ar: "بزر دوار الشمس (مملح)", brand: "محامص الشعب", category: "سناكس", price_jod: 2.00, size: "500g", nutrition_per_100g: { calories: 584, protein_g: 20, carbs_g: 20, fat_g: 51 }, description: "بزر أسود لسهرات العيلة." },
      { name_ar: "بزر بطيخ", brand: "محامص الشعب", category: "سناكس", price_jod: 3.50, size: "500g", nutrition_per_100g: { calories: 557, protein_g: 28, carbs_g: 15, fat_g: 47 }, description: "بزر بطيخ محمص ومملح." },
      { name_ar: "مكسرات مشكلة (إكسترا)", brand: "محامص الرفاعي", category: "سناكس", price_jod: 9.00, size: "500g", nutrition_per_100g: { calories: 600, protein_g: 18, carbs_g: 22, fat_g: 53 }, description: "كاجو وفستق ولوز وبندق محمص." },
      { name_ar: "بوشار مايكرويف", brand: "أمريكان جاردن", category: "سناكس", price_jod: 2.50, size: "3 packs", nutrition_per_100g: { calories: 429, protein_g: 8, carbs_g: 55, fat_g: 20 }, description: "بوشار بالزبدة سريع." },
      { name_ar: "ملوخية مجمدة ومفرومة", brand: "السنبلة", category: "مجمدات", price_jod: 1.10, size: "400g", nutrition_per_100g: { calories: 34, protein_g: 3, carbs_g: 5, fat_g: 0.5 }, description: "ملوخية خضراء مفرومة للطبخ السريع." },
      { name_ar: "بامية مجمدة (زيرو)", brand: "السنبلة", category: "مجمدات", price_jod: 1.80, size: "400g", nutrition_per_100g: { calories: 33, protein_g: 2, carbs_g: 7, fat_g: 0.2 }, description: "بامية حبة صغيرة لليخاني." },
      { name_ar: "بطاطا مقلية مجمدة", brand: "ماكين", category: "مجمدات", price_jod: 3.20, size: "2.5 kg", nutrition_per_100g: { calories: 130, protein_g: 2, carbs_g: 20, fat_g: 4 }, description: "بطاطا أصابع للقلي." },
      { name_ar: "عجينة سمبوسك", brand: "السنبلة", category: "مجمدات", price_jod: 1.50, size: "500g", nutrition_per_100g: { calories: 280, protein_g: 7, carbs_g: 55, fat_g: 2 }, description: "رقائق جاهزة لحشي السمبوسك." },

      // 🍞 قسم المخبوزات والمتفرقات (91-100)
      { name_ar: "خبز كماج (عربي) - ربطة", brand: "مخابز محلية", category: "مخبوزات", price_jod: 0.35, size: "1 kg", nutrition_per_100g: { calories: 275, protein_g: 9, carbs_g: 55, fat_g: 1.2 }, description: "الخبز الأردني الأساسي المدعوم." },
      { name_ar: "خبز شراك (صاج)", brand: "مخابز محلية", category: "مخبوزات", price_jod: 1.00, size: "1 kg", nutrition_per_100g: { calories: 260, protein_g: 8, carbs_g: 52, fat_g: 1 }, description: "رقيق جداً، أساسي للمنسف والشاورما." },
      { name_ar: "خبز حمام", brand: "مخابز جواد", category: "مخبوزات", price_jod: 0.75, size: "6 pcs", nutrition_per_100g: { calories: 290, protein_g: 8.5, carbs_g: 50, fat_g: 3 }, description: "خبز صمون لسندويشات الفلافل." },
      { name_ar: "بيض مائدة (طبق كبير)", brand: "مزارع محلية", category: "متفرقات", price_jod: 3.00, size: "30 eggs", nutrition_per_100g: { calories: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11 }, description: "طبق بيض مزارع طازج." },
      { name_ar: "إندومي (نكهة الدجاج)", brand: "إندومي", category: "مونة", price_jod: 1.50, size: "5 packs", nutrition_per_100g: { calories: 450, protein_g: 10, carbs_g: 60, fat_g: 18 }, description: "المنقذ في الجوع السريع." },
      { name_ar: "مكعبات مرقة الدجاج", brand: "ماجي", category: "مونة", price_jod: 2.00, size: "24 cubes", nutrition_per_100g: { calories: 250, protein_g: 9, carbs_g: 20, fat_g: 15 }, description: "لتعزيز نكهة الطبخ." },
      { name_ar: "خل تفاح طبيعي الدرة", brand: "الدرة", category: "صلصات", price_jod: 1.10, size: "500ml", nutrition_per_100g: { calories: 22, protein_g: 0, carbs_g: 1, fat_g: 0 }, description: "للسلطات وتعقيم الخضار." },
      { name_ar: "ورق عنب محشي (يالنجي)", brand: "الدرة", category: "معلبات", price_jod: 2.25, size: "400g", nutrition_per_100g: { calories: 180, protein_g: 3, carbs_g: 20, fat_g: 10 }, description: "يالنجي جاهز للأكل." },
      { name_ar: "فطر مقطع معلب", brand: "الدرة", category: "معلبات", price_jod: 1.20, size: "400g", nutrition_per_100g: { calories: 22, protein_g: 3, carbs_g: 3, fat_g: 0.3 }, description: "فطر جاهز لطبخات الكريمة والدجاج." },
      { name_ar: "تمر مجهول أردني", brand: "ثمار الأردن", category: "فواكه وتمور", price_jod: 5.50, size: "1 kg", nutrition_per_100g: { calories: 277, protein_g: 1.8, carbs_g: 75, fat_g: 0.2 }, description: "حبة مليانة، من أجود التمور بالعالم." }
    ];

    // مسح الداتا القديمة (عشان لو شغلت السكربت أكثر من مرة ما يتكرروا)
    await productsCollection.deleteMany({});

    // إدخال الـ 100 صنف دفعة وحدة (InsertMany)
    const result = await productsCollection.insertMany(products);
    console.log(`✅ كفو! تم إدخال ${result.insertedCount} منتج أردني لـ MongoDB بامتياز.`);

  } catch (err) {
    console.error("❌ صار في مشكلة يا غالي:", err);
  } finally {
    // تسكير الاتصال
    await client.close();
    console.log("🔒 تم إغلاق الاتصال بقاعدة البيانات.");
  }
}

// تشغيل السكربت
run();
