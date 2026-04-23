const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

// ONLY products that have a real matching file in the /pics folder
// Format: "Arabic name" -> ["main pic (1)", "secondary pic (2) or null"]
const exactMapping = {
  "قهوة العميد (مع هيل)":          ["alameedcoffee.png",              null],
  "زيت دوار الشمس عافية":          ["Afia Sunflower Oil1.jpg",        "Afia Sunflower Oil2.jpg"],
  "ذرة حلوة البستان":              ["Al Bustan Sweet Corn1.jpg",      "Al Bustan Sweet Corn2.jpg"],
  "زيت زيتون بكر ممتاز الجود":    ["Al Joud Premium Virgin Olive Oil1.jpg", "Al Joud Premium Virgin Olive Oil2.jpg"],
  "مربى مشمش الدرة":              ["Al-Durra Apricot Jam1.jpg",      "Al-Durra Apricot Jam2.jpg"],
  "شطة الدرة":                    ["Al-Durra Hot Sauce1.jpg",        "Al-Durra Hot Sauce2.jpg"],
  "طحينة الكسيح الذهبية":          ["Al-Kaseeh Golden Tahini1.jpg",   "Al-Kaseeh Golden Tahini2.jpg"],
  "حلاوة طحينية الكسيح":          ["Al-Kaseeh Tahini Halva1.jpg",    "Al-Kaseeh Tahini Halva2.jpg"],
  "بهارات منسف (حوايج) كباتيلو":  ["Bharat Mansaf (Hawaij) Kabatilu1.jpg", "Bharat Mansaf (Hawaij) Kabatilu2.jpg"],
  "بوشار مايكرويف":               ["Bouchar Microwave1.jpg",         "Bouchar Microwave2.jpg"],
  "فطر مقطع معلب":                ["Canned sliced mushrooms1.jpg",   "Canned sliced mushrooms2.jpg"],
  "مكعبات مرقة الدجاج":           ["Chicken Stock Cubes1.jpg",       "Chicken Stock Cubes2.jpg"],
  "راحة حلقوم المهندس":           ["Engineer's Turkish Delight1.jpg","Engineer's Turkish Delight2.jpg"],
  "بطاطا مقلية مجمدة":            ["Frozen French Fries1.jpg",       "Frozen French Fries2.jpg"],
  "بامية مجمدة (زيرو)":           ["Frozen Okra (Zero)1.jpg",        "Frozen Okra (Zero)2.jpg"],
  "ملوخية مجمدة ومفرومة":         ["Frozen and chopped molokhia1.jpg","Frozen and chopped molokhia2.jpg"],
  "شوكولاتة جلاكسي سادة":         ["Galaxy Plain Chocolate1.jpg",    "Galaxy Plain Chocolate2.jpg"],
  "مياه معدنية غدير":             ["Ghadeer Mineral Water1.jpg",     "Ghadeer Mineral Water2.jpg"],
  "حليب شوكولاتة طيبة":           ["Good Chocolate Milk1.jpg",       "Good Chocolate Milk2.jpg"],
  "كاتشب هاينز":                  ["Heinz Ketchup1.jpg",             "Heinz Ketchup2.jpg"],
  "إندومي (نكهة الدجاج)":         ["Indomie ,flavor chicken1.jpg",   "Indomie ,flavor chicken2.jpg"],
  "كعك جواد بالسمسم":             ["Jawad Sesame Cookies1.jpg",      "Jawad Sesame Cookies2.jpg"],
  "سماق بلدي كباتيلو":            ["Kabatilo Local Sumac1.jpg",      "Kabatilo Local Sumac2.jpg"],
  "زعتر ملوكي كباتيلو":           ["Kabatilo Royal Zaatar1.jpg",     "Kabatilo Royal Zaatar2.jpg"],
  "خبز كماج (عربي) - ربطة":       ["Kamaj bread1.jpg",               "Kamaj bread2.jpg"],
  "شيبس ليز (ملح)":               ["Lay's Chips (salted)1.jpg",      "Lay's Chips (salted)2.jpg"],
  "مايونيز ليزا":                 ["Lisa Mayonnaise1.jpg",           null],
  "بسكويت ماري مكفيتيز":          ["Mary McVitie's Biscuits1.jpg",   "Mary McVitie's Biscuits2.jpg"],
  "ماتريكس كولا":                 ["Matrix Cola1.jpg",               "Matrix Cola2.jpg"],
  "زيت ذرة مازولا":               ["Mazola Corn Oil1.jpg",           "Mazola Corn Oil2.jpg"],
  "مكسرات مشكلة (إكسترا)":        ["Mixed Nuts (Extra)1.jpg",        "Mixed Nuts (Extra)2.jpg"],
  "شيبس مستر شيبس (بيتزا)":       ["Mr Chips (Pizza)1.jpg",          "Mr Chips (Pizza)2.jpg"],
  "مشروب شعير موسي":              ["Musi Barley Drink1.jpg",         "Musi Barley Drink2.jpg"],
  "خل تفاح طبيعي الدرة":          ["Natural Apple Cider Vinegar1.jpg","Natural Apple Cider Vinegar2.jpg"],
  "مياه نستله بيور لايف":         ["Nestlé Pure Life Water1.jpg",    "Nestlé Pure Life Water2.jpg"],
  "نوتيلا":                       ["Nutella1.jpg",                   "Nutella2.jpg"],
  "بيبسي":                        ["Pepsi1.jpg",                     null],
  "خبز حمام":                     ["Pigeon bread1.jpg",              "Pigeon bread2.jpg"],
  "عصير راني (حبيبات الخوخ)":     ["Rani Juice (Peach Granules)1.jpg","Rani Juice (Peach Granules)2.jpg"],
  "عجينة سمبوسك":                 ["Sambosa dough1.jpg",             "Sambosa dough2.jpg"],
  "سفن أب":                       ["Seven Up1.jpg",                  "Seven Up (2).jpg"],
  "خبز شراك (صاج)":               ["Shrak bread1.jpg",               "Shrak bread2.jpg"],
  "ورق عنب محشي (يالنجي)":        ["Stuffed grape leaves1.jpg",      "Stuffed grape leaves2.jpg"],
  "عصير سن توب برتقال":           ["Sun Top Orange Juice1.jpg",      "Sun Top Orange Juice2.jpg"],
  "بزر دوار الشمس (مملح)":        ["Sunflower Seeds (salted)1.jpg",  "Sunflower Seeds (salted)2.jpg"],
  "بيض مائدة (طبق كبير)":         ["Table Eggs1.jpg",                "Table Eggs2.jpg"],
  "تمر مجهول أردني":              ["Unknown date Jordananian1.jpg",  "Unknown date Jordananian2.jpg"],
  "شراب الفيمتو":                 ["Vimto drink1.jpg",               "Vimto drink2.jpg"],
  "بزر بطيخ":                     ["Watermelon seeds1.jpg",          "Watermelon seeds2.jpg"],
  "دبس رمان يمامة":               ["Yamama Pomegranate Molasses1.jpg","Yamama Pomegranate Molasses2.jpg"],
  "عسل طبيعي ياسمين":             ["Yasmin Natural Honey1.jpg",      "Yasmin Natural Honey2.jpg"],
  "بقلاوة مشكلة زلاطيمو":         ["Zalatiimo Mixed Baklawa1.jpg",   "Zalatiimo Mixed Baklawa2.jpg"]
};

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('mooneh_db');
    const collection = db.collection('products');

    const products = await collection.find({}).toArray();
    console.log(`Found ${products.length} products.\n`);

    let matched = 0;
    let cleared = 0;

    for (const product of products) {
      const imgs = exactMapping[product.name_ar];

      if (imgs) {
        // Has a real pic in the /pics folder — assign both images
        const [img1, img2] = imgs;
        const setFields = { image_url: `/pics/${img1}` };
        if (img2) {
          setFields.image_url_2 = `/pics/${img2}`;
        } else {
          // Ensure no stale image_url_2 remains
          await collection.updateOne({ _id: product._id }, { $unset: { image_url_2: "" } });
        }
        await collection.updateOne({ _id: product._id }, { $set: setFields });
        console.log(`✅ ${product.name_ar} → ${img1}${img2 ? ' + ' + img2 : ''}`);
        matched++;
      } else {
        // No matching pic — clear both image fields so server generates placeholder
        await collection.updateOne(
          { _id: product._id },
          { $unset: { image_url: "", image_url_2: "" } }
        );
        console.log(`🗑  ${product.name_ar} → (no pic, cleared)`);
        cleared++;
      }
    }

    console.log(`\n✅ Assigned real pics   : ${matched} products`);
    console.log(`🗑  Cleared (no match)  : ${cleared} products`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
