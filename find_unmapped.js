const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

const mapping = {
  "قهوة العميد (مع هيل)": "alameedcoffee.png",
  "زيت دوار الشمس عافية": "Afia Sunflower Oil1.jpg",
  "ذرة حلوة البستان": "Al Bustan Sweet Corn1.jpg",
  "زيت زيتون بكر ممتاز الجود": "Al Joud Premium Virgin Olive Oil1.jpg",
  "مربى مشمش الدرة": "Al-Durra Apricot Jam1.jpg",
  "شطة الدرة": "Al-Durra Hot Sauce1.jpg",
  "طحينة الكسيح الذهبية": "Al-Kaseeh Golden Tahini1.jpg",
  "حلاوة طحينية الكسيح": "Al-Kaseeh Tahini Halva1.jpg",
  "بهارات منسف (حوايج) كباتيلو": "Bharat Mansaf (Hawaij) Kabatilu1.jpg",
  "بوشار مايكرويف": "Bouchar Microwave1.jpg",
  "فطر مقطع معلب": "Canned sliced mushrooms1.jpg",
  "مكعبات مرقة الدجاج": "Chicken Stock Cubes1.jpg",
  "راحة حلقوم المهندس": "Engineer's Turkish Delight1.jpg",
  "بطاطا مقلية مجمدة": "Frozen French Fries1.jpg",
  "بامية مجمدة (زيرو)": "Frozen Okra (Zero)1.jpg",
  "ملوخية مجمدة ومفرومة": "Frozen and chopped molokhia1.jpg",
  "شوكولاتة جلاكسي سادة": "Galaxy Plain Chocolate1.jpg",
  "مياه معدنية غدير": "Ghadeer Mineral Water1.jpg",
  "حليب شوكولاتة طيبة": "Good Chocolate Milk1.jpg",
  "كاتشب هاينز": "Heinz Ketchup1.jpg",
  "إندومي (نكهة الدجاج)": "Indomie ,flavor chicken1.jpg",
  "كعك جواد بالسمسم": "Jawad Sesame Cookies1.jpg",
  "سماق بلدي كباتيلو": "Kabatilo Local Sumac1.jpg",
  "زعتر ملوكي كباتيلو": "Kabatilo Royal Zaatar1.jpg",
  "خبز كماج (عربي) - ربطة": "Kamaj bread1.jpg",
  "شيبس ليز (ملح)": "Lay's Chips (salted)1.jpg",
  "مايونيز ليزا": "Lisa Mayonnaise1.jpg",
  "بسكويت ماري مكفيتيز": "Mary McVitie's Biscuits1.jpg",
  "ماتريكس كولا": "Matrix Cola1.jpg",
  "زيت ذرة مازولا": "Mazola Corn Oil1.jpg",
  "مكسرات مشكلة (إكسترا)": "Mixed Nuts (Extra)1.jpg",
  "شيبس مستر شيبس (بيتزا)": "Mr Chips (Pizza)1.jpg",
  "مشروب شعير موسي": "Musi Barley Drink1.jpg",
  "خل تفاح طبيعي الدرة": "Natural Apple Cider Vinegar1.jpg",
  "مياه نستله بيور لايف": "Nestlé Pure Life Water1.jpg",
  "نوتيلا": "Nutella1.jpg",
  "بيبسي": "Pepsi1.jpg",
  "خبز حمام": "Pigeon bread1.jpg",
  "عصير راني (حبيبات الخوخ)": "Rani Juice (Peach Granules)1.jpg",
  "عجينة سمبوسك": "Sambosa dough1.jpg",
  "سفن أب": "Seven Up1.jpg",
  "خبز شراك (صاج)": "Shrak bread1.jpg",
  "ورق عنب محشي (يالنجي)": "Stuffed grape leaves1.jpg",
  "عصير سن توب برتقال": "Sun Top Orange Juice1.jpg",
  "بزر دوار الشمس (مملح)": "Sunflower Seeds (salted)1.jpg",
  "بيض مائدة (طبق كبير)": "Table Eggs1.jpg",
  "تمر مجهول أردني": "Unknown date Jordananian1.jpg",
  "شراب الفيمتو": "Vimto drink1.jpg",
  "بزر بطيخ": "Watermelon seeds1.jpg",
  "دبس رمان يمامة": "Yamama Pomegranate Molasses1.jpg",
  "عسل طبيعي ياسمين": "Yasmin Natural Honey1.jpg",
  "بقلاوة مشكلة زلاطيمو": "Zalatiimo Mixed Baklawa1.jpg"
};

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('mooneh_db');
    const collection = db.collection('products');

    const products = await collection.find({}).toArray();

    const missing = [];
    for (const product of products) {
      const filename = mapping[product.name_ar];
      if (!filename) {
        // Try fuzzy match or keyword match if not directly in mapping
        const matchedEntry = Object.entries(mapping).find(([arName]) => 
          product.name_ar.includes(arName) || arName.includes(product.name_ar)
        );
        
        if (!matchedEntry) {
            missing.push(product.name_ar);
        }
      }
    }

    console.log(`Missing mapped images for ${missing.length} products:`);
    console.log(missing.join('\n'));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
