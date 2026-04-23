require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

const manualMapping = {
    "قهوة العميد (مع هيل)": "BanAlAmeed_Turkish_Coffee_Medium_Cardamom.png",
    "قهوة العميد (بدون هيل)": "alameedcoffee.png",
    "شاي الغزالين (فرط)": "AlGhazaleen_Tea_500g.png",
    "شاي محمود (علاقة)": "mahmoud-ceylon-tea.png",
    "شاي ليبتون (علاقة)": "Lipton_Yellow_Label_Tea_Bags_100.png",
    "نسكافيه ريد مج": "Nescafe_Red_Mug_Jar.png",
    "كاكاو هنتز": "Hintz_Cocoa_Powder_Tin_227g_Front.png",
    "سحلب كباتيلو": "Bzuriyeh_Sahlab_Ready_Mix_Arabic.png",
    "مبيض قهوة كوفي ميت": "Coffee_Mate_Original_Box.png",
    "لبنة طيبة الطازجة": "Taybeh_Labneh_Fresh.png",
    "حليب حمودة طازج": "Hamoudeh_Whole_Milk_1L.png",
    "شنينة زين (عيران)": "almarai-ayran-2l-1.png",
    "لبن رايب بلدنا": "baladna-laban-fresh.png",
    "جبنة مثلثات البقرة الضاحكة": "La_Vache_Qui_Rit_Original_8portions.png",
    "زبدة لورباك": "Lurpak_Unsalted_Butter_400g.png",
    "سمنة البلقاء بلدي": "AlBalka_Samn_Baladi.png",
    "حليب مجفف نيدو": "Nestle_Nido_Dry_Whole_Milk_400g.png",
    "ناجتس دجاج نبيل": "Nabil_Chicken_Popcorn_400g.png",
    "برغر بقري سنيورة": "Siniora_Beef_Burger_Arabic_Spices_224g.png",
    "صدور دجاج الطاحونة": "Fresh_Chicken_Breast.png",
    "دجاج كامل عزوتنا": "AlTahooneh_Fresh_Whole_Chicken.png",
    "كبة شامية نبيل": "Nabil_Kubbeh_Balls.png",
    "مرتديلا دجاج سنيورة": "Siniora_AlQuds_Plain_Chicken_Mortadella.png",
    "هوت دوغ خزان": "Khazan_Beef_Sausages_250g.png",
    "شاورما دجاج نبيل": "Nabil_Chicken_Shawarma_400g.png",
    "اسكالوب دجاج الطاحونة": "AlTahooneh_Frozen_Chicken_Escalope_450g.png",
    "أرز صن وايت (حبة قصيرة)": "Sunwhite_Calrose_Rice_1kg.png",
    "أرز تايجر (بسمتي)": "Tiger_Basmati_Rice_1121.png",
    "أرز محمود بسمتي": "Mahmood_Rice_1121_Sella_5kg.png",
    "سكر الأسرة": "AlOsra_Fine_Sugar_5kg.png",
    "طحين المطاحن الأردنية (زيرو)": "jordanian-flour-company-flour-zero-1.png",
    "عدس مجروش الدرة": "Durra_Red_Lentils.png",
    "فريكة خضراء الدرة": "Durra_Green_Freekeh_Whole_450g.png",
    "برغل خشن الدرة": "Durra_Bulgur_Wheat_900g.png",
    "حمص حب الكسيح": "AlKasih_Chickpeas_Ready_Serve_1.png",
    "معكرونة توليدو (سباغيتي)": "spaghettoni-pasta-zara-1.png",
    "شعيرية زين": "al-ghazal-vermicelli.png",
    "جميد سائل الكسيح": "AlKasih_Liquid_Jameed_1kg.png",
    "حمص بالطحينة الدرة": "Durra_Hommus_Tahina_Dip_370g.png",
    "فول مدمس الكسيح": "AlKasih_Foul_Medammas_Broad_Beans.png",
    "مكدوس باذنجان الدرة": "Durra_Makdous_Stuffed_Eggplants_400g.png",
    "تونة جيشا بالزيت": "Geisha_Light_Meat_Tuna_Sunflower_Oil.png",
    "سردين ميلو": "Melo_Sardines_Chili_Sunflower_Oil_125g.png",
    "ذرة حلوة البستان": "Al Bustan Sweet Corn1.jpg",
    "زيت زيتون بكر ممتاز الجود": "Al Joud Premium Virgin Olive Oil1.jpg",
    "زيت دوار الشمس عافية": "Afia Sunflower Oil1.jpg",
    "زيت ذرة مازولا": "Mazola Corn Oil1.jpg",
    "دبس رمان يمامة": "Yamama Pomegranate Molasses1.jpg",
    "كاتشب هاينز": "Heinz Ketchup.png",
    "مايونيز ليزا": "Lisa Mayonnaise1.jpg",
    "شطة الدرة": "Al-Durra Hot Sauce1.jpg",
    "زعتر ملوكي كباتيلو": "Kabatilo Royal Zaatar1.jpg",
    "سماق بلدي كباتيلو": "Kabatilo Local Sumac1.jpg",
    "بهارات منسف (حوايج) كباتيلو": "Bharat Mansaf (Hawaij) Kabatilu1.jpg",
    "حلاوة طحينية الكسيح": "Al-Kaseeh Tahini Halva1.jpg",
    "طحينة الكسيح الذهبية": "Al-Kaseeh Golden Tahini1.jpg",
    "مربى مشمش الدرة": "Al-Durra Apricot Jam1.jpg",
    "عسل طبيعي ياسمين": "Yasmin Natural Honey1.jpg",
    "نوتيلا": "Nutella.png",
    "شوكولاتة جلاكسي سادة": "Galaxy Plain Chocolate1.jpg",
    "بسكويت ماري مكفيتيز": "Mary McVitie's Biscuits1.jpg",
    "كعك جواد بالسمسم": "Jawad Sesame Cookies1.jpg",
    "راحة حلقوم المهندس": "Engineer's Turkish Delight1.jpg",
    "بقلاوة مشكلة زلاطيمو": "Zalatiimo Mixed Baklawa1.jpg",
    "مياه معدنية غدير": "Ghadeer Mineral Water1.jpg",
    "مياه نستله بيور لايف": "Nestlé Pure Life Water1.jpg",
    "ماتريكس كولا": "Matrix Cola1.jpg",
    "بيبسي": "Pepsi Can.png",
    "سفن أب": "7UP Bottle.png",
    "عصير راني (حبيبات الخوخ)": "Rani Juice (Peach Granules)1.jpg",
    "عصير سن توب برتقال": "Sun Top Orange Juice1.jpg",
    "شراب الفيمتو": "Vimto drink1.jpg",
    "حليب شوكولاتة طيبة": "Good Chocolate Milk1.jpg",
    "مشروب شعير موسي": "Musi Barley Drink1.jpg",
    "شيبس مستر شيبس (بيتزا)": "Mr Chips (Pizza)1.jpg",
    "شيبس ليز (ملح)": "Lay's Chips (salted)1.jpg",
    "بزر دوار الشمس (مملح)": "Sunflower Seeds (salted)1.jpg",
    "بزر بطيخ": "Watermelon seeds1.jpg",
    "مكسرات مشكلة (إكسترا)": "Mixed Nuts (Extra)1.jpg",
    "بوشار مايكرويف": "Bouchar Microwave1.jpg",
    "ملوخية مجمدة ومفرومة": "Frozen and chopped molokhia1.jpg",
    "بامية مجمدة (زيرو)": "Frozen Okra (Zero)1.jpg",
    "بطاطا مقلية مجمدة": "Frozen French Fries1.jpg",
    "عجينة سمبوسك": "Sambosa dough1.jpg",
    "خبز كماج (عربي) - ربطة": "Kamaj bread1.jpg",
    "خبز شراك (صاج)": "Shrak bread1.jpg",
    "خبز حمام": "Pigeon bread1.jpg",
    "بيض مائدة (طبق كبير)": "Table Eggs1.jpg",
    "إندومي (نكهة الدجاج)": "Indomie ,flavor chicken1.jpg",
    "مكعبات مرقة الدجاج": "Chicken Stock Cubes1.jpg",
    "خل تفاح طبيعي الدرة": "Natural Apple Cider Vinegar1.jpg",
    "ورق عنب محشي (يالنجي)": "Stuffed grape leaves1.jpg",
    "فطر مقطع معلب": "Canned sliced mushrooms1.jpg",
    "تمر مجهول أردني": "Dates Pack.jpg",
    "لبن زبادي": "Yogurt Cup.png",
    "بطيخ أحمر": "Watermelon seeds1.jpg"
};

async function run() {
    try {
        await client.connect();
        const col = client.db('mooneh_db').collection('products');
        let updateCount = 0;
        
        for (const [arName, fileName] of Object.entries(manualMapping)) {
            // Check if file exists in pics folder
            const exists = fs.existsSync("pics/" + fileName);
            if (!exists) {
                console.log("⚠️ File not found: " + fileName);
                continue;
            }
            
            const result = await col.updateOne(
                { name_ar: arName },
                { $set: { image_url: "/pics/" + fileName } }
            );
            
            if (result.matchedCount > 0) {
                console.log("✅ Updated " + arName + " -> " + fileName);
                updateCount++;
            } else {
                console.log("❌ Product not found in DB: " + arName);
            }
        }
        console.log("\n🎉 Successfully updated " + updateCount + " images!");
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
