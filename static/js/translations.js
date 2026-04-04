// Translation System - Complete Website Translations
const translations = {
    en: {
        // Navigation
        get_started: "Get Started",
        home: "Home",
        features: "Features",
        browse_products: "Browse Products",
        cart: "Cart",
        how_it_works: "How It Works",
        about: "About",
        jordan: "Jordan",
        
        // Hero Section
        powered_by: "Powered by Hugging Face AI",
        hero_title_line1: "Intelligent Shopping",
        hero_title_line2: "Assistant for Jordan",
        hero_description: "Shop smarter with Mooneh.ai — browse hundreds of grocery products, get AI-powered recommendations, and place your order for fast doorstep delivery across Jordan.",
        hero_feature_ai: "AI-Powered Intelligence",
        hero_feature_budget: "Budget Optimization",
        hero_feature_talabat: "Direct Talabat Integration",
        hero_feature_instant: "Instant Results",
        
        // Features Section
        features_title: "Powerful Features",
        features_subtitle: "Everything you need for smart shopping",
        feature_ai_title: "AI-Powered Intelligence",
        feature_ai_desc: "Natural language understanding powered by Groq AI. Just describe what you need in plain English.",
        feature_budget_title: "Budget Optimization",
        feature_budget_desc: "Set your budget and get optimized shopping lists that stay within your limits.",
        feature_talabat_title: "Talabat Integration",
        feature_talabat_desc: "Real products with JOD prices and direct links to Talabat Jordan for easy ordering.",
        feature_recipe_title: "Recipe Suggestions",
        feature_recipe_desc: "Get recipe recommendations based on your shopping list with ingredient matching.",
        feature_sharing_title: "Easy Sharing",
        feature_sharing_desc: "Share your shopping lists via link or export to JSON/Text format.",
        feature_mobile_title: "Mobile Friendly",
        feature_mobile_desc: "Fully responsive design that works perfectly on all devices.",
        
        // How It Works
        how_it_works_title: "How It Works",
        how_it_works_subtitle: "Get your shopping list in 3 simple steps",
        step1_title: "Describe Your Needs",
        step1_desc: "Tell the AI what you need. For example: \"I want a BBQ for 14 people\" or use the form to provide details.",
        step2_title: "AI Creates Your List",
        step2_desc: "Our AI analyzes your request, calculates quantities, and selects the best products from Talabat Jordan.",
        step3_title: "Shop & Share",
        step3_desc: "Review your list, get recipe suggestions, share with others, or export for later use.",
        
        // About Section
        about_title: "About Mooneh.ai",
        about_text1: "Mooneh.ai is an intelligent shopping assistant designed specifically for Jordan. It helps you create smart shopping lists for any event, from family dinners to large parties.",
        about_text2: "Powered by Groq AI, our system understands natural language and creates optimized shopping lists with real prices from Talabat Jordan. No more guessing quantities or forgetting items!",
        stat_products: "Products",
        stat_free: "Free",
        stat_available: "Available",
        stat_products_photos: "Products with Photos",
        stat_categories: "Categories",
        stat_currency: "Jordan Currency",
        stat_ai_powered: "AI Powered",
        
        // Shopping Planner
        planner_title: "Smart Shopping Planner",
        form_title: "Event Planning Form",
        event_type: "Event Type",
        event_bbq: "BBQ / Grilling",
        event_dinner: "Dinner Party",
        event_lunch: "Lunch Gathering",
        event_party: "Party / Celebration",
        event_family: "Family Meal",
        event_traditional: "Traditional Jordanian",
        num_people: "Number of People",
        budget_label: "Budget (JOD)",
        budget_placeholder: "e.g., 100",
        dietary_preferences: "Dietary Preferences",
        dietary_all: "All Foods",
        dietary_vegetarian: "Vegetarian",
        dietary_halal: "Halal Only",
        dietary_no_beef: "No Beef",
        dietary_no_chicken: "No Chicken",
        filters_label: "Filters",
        filter_healthy: "💚 Healthy Food",
        filter_gluten_free: "🌾 Gluten-Free",
        nutritional_filters: "Nutritional Filters",
        min_protein: "Min Protein (g/100g)",
        max_calories: "Max Calories (cal/100g)",
        additional_requests: "Additional Requests (Optional)",
        additional_placeholder: "e.g., Extra vegetables, low budget, more drinks...",
        generate_list: "Generate Shopping List",
        or_text: "OR",
        welcome_message: "Welcome to Mooneh.ai",
        welcome_desc: "I'm your intelligent shopping assistant. Use the form above for detailed planning, or chat with me naturally about your shopping needs. I'll create perfect shopping lists with real prices from Talabat Jordan.",
        
        // Browse Products
        browse_title: "Browse Products",
        browse_subtitle: "Explore our full catalog with filters",
        search_products: "🔍 Search products...",
        all_categories: "All Categories",
        sort_name: "Sort by Name",
        sort_price_low: "Price: Low to High",
        sort_price_high: "Price: High to Low",
        sort_calories_low: "Calories: Low to High",
        sort_protein_high: "Protein: High to Low",
        healthy_only: "💚 Healthy Only",
        gluten_free: "🌾 Gluten-Free",
        vegetarian: "🥬 Vegetarian",
        vegan: "🌱 Vegan",
        organic: "🌿 Organic",
        halal: "🕌 Halal",
        
        // Cart
        shopping_cart: "Shopping Cart",
        items: "items",
        cart_empty: "Your cart is empty",
        cart_empty_hint: "Add items from chat or browse products",
        total_items: "Total Items:",
        total_cost: "Total Cost:",
        proceed_checkout: "Proceed to Checkout",
        clear_cart: "Clear Cart",
        remove_from_cart: "Remove from cart?",
        clear_entire_cart: "Clear entire cart? This cannot be undone.",
        
        // Products
        add_to_cart: "Add to Cart",
        view_product: "View Product",
        
        // Chat
        send: "Send",
        type_message: "Or type freely...",
        
        // General
        just_now: "Just now",
        
        // Footer
        footer_about_title: "About Mooneh.ai",
        footer_about_text: "Your all-in-one AI-powered grocery store for Jordan. Browse a wide range of products, chat with our smart assistant, and get your groceries delivered right to your door — fast, easy, and affordable.",
        footer_quick_links: "Quick Links",
        footer_contact: "Contact",
        footer_email: "support@mooneh.ai",
        footer_website: "www.mooneh.ai",
        footer_follow: "Follow Us",
        footer_powered_by: "Powered by Hugging Face AI",
        footer_copyright: "© 2024 Mooneh.ai. All rights reserved.",
        
        // Pagination
        prev: "Previous",
        next: "Next",
        page_info: "Page {page} of {total}",
        
        // Shopping List
        shopping_list_title: "Suggested Shopping List",
        shopping_list_subtitle: "You can edit quantities before adding products to cart",
        event_type: "Event Type",
        num_people: "people",
        person: "person",
        items_count: "items",
        item: "item",
        per_unit: "per unit",
        total: "Total",
        total_amount: "Total Amount",
        add_to_cart_btn: "Add All to Cart",
        clear_list: "Clear List",
        remove: "Remove",
        delete: "Delete",
        edit_quantities: "Edit quantities before adding to cart",
        suggested_products: "Suggested Products",
        select_products: "Select products you want to add to the list",
        add_to_list: "Add to List",
        quantity_updated: "Quantity updated",
        product_added_to_list: "Product added to list",
        list_empty: "The list is empty",
        products_added_to_cart: "{count} products added to cart successfully!",
        products_failed_to_add: "{count} products failed to add",
        list_cleared: "List cleared",
        product_added_to_cart: "Product added to cart",
        product_add_error: "Error adding product",
        product_removed_from_cart: "Product removed from cart",
        product_remove_error: "Error removing product",
        for_event: "for"
    },
    ar: {
        // Navigation
        get_started: "ابدأ الآن",
        home: "الرئيسية",
        features: "المميزات",
        browse_products: "تصفح المنتجات",
        cart: "السلة",
        how_it_works: "كيف يعمل",
        about: "حول",
        jordan: "الأردن",
        
        // Hero Section
        powered_by: "مدعوم من Hugging Face AI",
        hero_title_line1: "مساعد التسوق الذكي",
        hero_title_line2: "للمملكة الأردنية",
        hero_description: "حوّل تخطيط فعالياتك بقوائم تسوق مدعومة بالذكاء الاصطناعي. ببساطة اشرح احتياجاتك، حدد ميزانيتك، واحصل على قائمة تسوق كاملة بأسعار حقيقية من طلبات الأردن. ذكي، سريع، ومصمم خصيصاً لتفضيلاتك.",
        hero_feature_ai: "ذكاء مدعوم بالذكاء الاصطناعي",
        hero_feature_budget: "تحسين الميزانية",
        hero_feature_talabat: "تكامل مباشر مع طلبات",
        hero_feature_instant: "نتائج فورية",
        
        // Features Section
        features_title: "مميزات قوية",
        features_subtitle: "كل ما تحتاجه للتسوق الذكي",
        feature_ai_title: "ذكاء مدعوم بالذكاء الاصطناعي",
        feature_ai_desc: "فهم اللغة الطبيعية مدعوم من Groq AI. فقط اشرح ما تحتاجه باللغة الإنجليزية العادية.",
        feature_budget_title: "تحسين الميزانية",
        feature_budget_desc: "حدد ميزانيتك واحصل على قوائم تسوق محسّنة تبقى ضمن حدودك.",
        feature_talabat_title: "تكامل مع طلبات",
        feature_talabat_desc: "منتجات حقيقية بأسعار بالدينار الأردني وروابط مباشرة لطلبات الأردن للطلب بسهولة.",
        feature_recipe_title: "اقتراحات الوصفات",
        feature_recipe_desc: "احصل على توصيات الوصفات بناءً على قائمة التسوق الخاصة بك مع مطابقة المكونات.",
        feature_sharing_title: "مشاركة سهلة",
        feature_sharing_desc: "شارك قوائم التسوق الخاصة بك عبر الرابط أو قم بالتصدير بصيغة JSON أو النص.",
        feature_mobile_title: "متوافق مع الجوال",
        feature_mobile_desc: "تصميم متجاوب بالكامل يعمل بشكل مثالي على جميع الأجهزة.",
        
        // How It Works
        how_it_works_title: "كيف يعمل",
        how_it_works_subtitle: "احصل على قائمة التسوق الخاصة بك في 3 خطوات بسيطة",
        step1_title: "اشرح احتياجاتك",
        step1_desc: "أخبر الذكاء الاصطناعي بما تحتاجه. على سبيل المثال: \"أريد شواء لـ 14 شخصاً\" أو استخدم النموذج لتقديم التفاصيل.",
        step2_title: "الذكاء الاصطناعي ينشئ قائمتك",
        step2_desc: "يحلل الذكاء الاصطناعي طلبك، يحسب الكميات، ويختار أفضل المنتجات من طلبات الأردن.",
        step3_title: "تسوق وشارك",
        step3_desc: "راجع قائمتك، احصل على اقتراحات الوصفات، شاركها مع الآخرين، أو قم بالتصدير للاستخدام لاحقاً.",
        
        // About Section
        about_title: "حول Mooneh.ai",
        about_text1: "Mooneh.ai هو مساعد تسوق ذكي مصمم خصيصاً للأردن. يساعدك على إنشاء قوائم تسوق ذكية لأي فعالية، من عشاء العائلة إلى الحفلات الكبيرة.",
        about_text2: "مدعوم من Groq AI، يفهم نظامنا اللغة الطبيعية وينشئ قوائم تسوق محسّنة بأسعار حقيقية من طلبات الأردن. لا مزيد من التخمين في الكميات أو نسيان العناصر!",
        stat_products: "منتج",
        stat_free: "مجاني",
        stat_available: "متاح",
        stat_products_photos: "منتجات مع صور",
        stat_categories: "فئات",
        stat_currency: "العملة الأردنية",
        stat_ai_powered: "مدعوم بالذكاء الاصطناعي",
        
        // Shopping Planner
        planner_title: "مخطط التسوق الذكي",
        form_title: "نموذج تخطيط الفعالية",
        event_type: "نوع الفعالية",
        event_bbq: "شواء / مشاوي",
        event_dinner: "حفلة عشاء",
        event_lunch: "تجمع غداء",
        event_party: "حفلة / احتفال",
        event_family: "وجبة عائلية",
        event_traditional: "أردني تقليدي",
        num_people: "عدد الأشخاص",
        budget_label: "الميزانية (دينار أردني)",
        budget_placeholder: "مثال: 100",
        dietary_preferences: "التفضيلات الغذائية",
        dietary_all: "جميع الأطعمة",
        dietary_vegetarian: "نباتي",
        dietary_halal: "حلال فقط",
        dietary_no_beef: "بدون لحم بقري",
        dietary_no_chicken: "بدون دجاج",
        filters_label: "المرشحات",
        filter_healthy: "💚 طعام صحي",
        filter_gluten_free: "🌾 خالي من الغلوتين",
        nutritional_filters: "مرشحات غذائية",
        min_protein: "الحد الأدنى للبروتين (جم/100جم)",
        max_calories: "الحد الأقصى للسعرات (سعر/100جم)",
        additional_requests: "طلبات إضافية (اختياري)",
        additional_placeholder: "مثال: خضار إضافية، ميزانية منخفضة، مشروبات أكثر...",
        generate_list: "إنشاء قائمة التسوق",
        or_text: "أو",
        welcome_message: "مرحباً بك في Mooneh.ai",
        welcome_desc: "أنا مساعد التسوق الذكي الخاص بك. استخدم النموذج أعلاه للتخطيط التفصيلي، أو تحدث معي بشكل طبيعي حول احتياجات التسوق الخاصة بك. سأنشئ قوائم تسوق مثالية بأسعار حقيقية من طلبات الأردن.",
        
        // Browse Products
        browse_title: "تصفح المنتجات",
        browse_subtitle: "استكشف كتالوجنا الكامل مع المرشحات",
        search_products: "🔍 ابحث عن المنتجات...",
        all_categories: "جميع الفئات",
        sort_name: "ترتيب حسب الاسم",
        sort_price_low: "السعر: من الأقل إلى الأعلى",
        sort_price_high: "السعر: من الأعلى إلى الأقل",
        sort_calories_low: "السعرات: من الأقل إلى الأعلى",
        sort_protein_high: "البروتين: من الأعلى إلى الأقل",
        healthy_only: "💚 صحي فقط",
        gluten_free: "🌾 خالي من الغلوتين",
        vegetarian: "🥬 نباتي",
        vegan: "🌱 نباتي صرف",
        organic: "🌿 عضوي",
        halal: "🕌 حلال",
        
        // Cart
        shopping_cart: "سلة التسوق",
        items: "عنصر",
        cart_empty: "سلة التسوق فارغة",
        cart_empty_hint: "أضف عناصر من المحادثة أو تصفح المنتجات",
        total_items: "إجمالي العناصر:",
        total_cost: "إجمالي التكلفة:",
        proceed_checkout: "المتابعة للدفع",
        clear_cart: "مسح السلة",
        remove_from_cart: "إزالة هذا العنصر من السلة؟",
        clear_entire_cart: "مسح السلة بالكامل؟ لا يمكن التراجع عن هذا.",
        
        // Products
        add_to_cart: "أضف إلى السلة",
        view_product: "عرض المنتج",
        
        // Chat
        send: "إرسال",
        type_message: "أو اكتب بحرية...",
        
        // General
        just_now: "الآن",
        
        // Footer
        footer_about_title: "حول Mooneh.ai",
        footer_about_text: "مساعد التسوق الذكي الخاص بك للأردن. مدعوم من Groq AI، يساعدك على إنشاء قوائم تسوق ذكية بأسعار حقيقية من طلبات الأردن.",
        footer_quick_links: "روابط سريعة",
        footer_contact: "اتصل بنا",
        footer_email: "support@mooneh.ai",
        footer_website: "www.mooneh.ai",
        footer_follow: "تابعنا",
        footer_powered_by: "مدعوم من Hugging Face AI",
        footer_copyright: "© 2024 Mooneh.ai. جميع الحقوق محفوظة.",
        
        // Pagination
        prev: "السابق",
        next: "التالي",
        page_info: "صفحة {page} من {total}",
        
        // Shopping List
        shopping_list_title: "قائمة التسوق المقترحة",
        shopping_list_subtitle: "يمكنك تعديل الكميات قبل إضافة المنتجات للسلة",
        event_type: "نوع الفعالية",
        num_people: "أشخاص",
        person: "شخص",
        items_count: "منتج",
        item: "منتج",
        per_unit: "لكل وحدة",
        total: "المجموع",
        total_amount: "المجموع الكلي",
        add_to_cart_btn: "إضافة الكل للسلة",
        clear_list: "مسح القائمة",
        remove: "حذف",
        delete: "حذف",
        edit_quantities: "يمكنك تعديل الكميات قبل إضافة المنتجات للسلة",
        suggested_products: "المنتجات المقترحة",
        select_products: "اختر المنتجات التي تريد إضافتها للقائمة",
        add_to_list: "إضافة للقائمة",
        quantity_updated: "تم تحديث الكمية",
        product_added_to_list: "تم إضافة المنتج للقائمة",
        list_empty: "القائمة فارغة",
        products_added_to_cart: "تم إضافة {count} منتج للسلة بنجاح!",
        products_failed_to_add: "فشل إضافة {count} منتج",
        list_cleared: "تم مسح القائمة",
        product_added_to_cart: "تم إضافة المنتج للسلة",
        product_add_error: "خطأ في إضافة المنتج",
        product_removed_from_cart: "تم حذف المنتج من السلة",
        product_remove_error: "خطأ في حذف المنتج",
        for_event: "لـ"
    }
};

let currentLanguage = localStorage.getItem('language') || 'en';
let isRTL = currentLanguage === 'ar';

// Initialize language on load
function initLanguage() {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
}

// Set language and update UI
function setLanguage(lang) {
    currentLanguage = lang;
    isRTL = lang === 'ar';
    localStorage.setItem('language', lang);
    
    // Update HTML dir attribute
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    
    // Update language button text
    const langText = document.getElementById('languageText');
    if (langText) {
        langText.textContent = lang === 'ar' ? 'AR' : 'EN';
    }
    
    // Translate all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = translations[lang][key];
        if (translation) {
            // Handle different element types
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Only update placeholder if it's a placeholder attribute
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
            } else if (element.tagName === 'OPTION') {
                element.textContent = translation;
            } else if (element.hasAttribute('title')) {
                element.title = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Update cart display if it exists
    if (typeof updateCartDisplay === 'function') {
        const cartData = JSON.parse(localStorage.getItem('lastCartData') || '{}');
        if (cartData.items) {
            updateCartDisplay(cartData);
        }
    }
}



// Get translation
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
} else {
    initLanguage();
}
