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
        
        // Categories
        cat_pantry: "Pantry",
        cat_frozen: "Frozen",
        cat_dairy: "Dairy",
        cat_meat: "Meat",
        
        // Banners
        banner_about_badge: "About Mooneh.ai",
        banner_about_desc: "Your smart shopping assistant for fresh groceries and local goods.",
        banner_selection_badge: "Vast Selection",
        banner_selection_title: "Explore 100+ quality items.",
        banner_selection_desc: "From fresh produce to meats and pantry staples.",
        banner_ai_badge: "AI ASSISTANT",
        banner_ai_title: "Need Ideas?",
        banner_ai_desc: "Click to chat with our smart assistant.",
        banner_delivery_badge: "Fast Service",
        banner_delivery_desc: "Fast & reliable delivery to your doorstep.",
        
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
        get_started: "يلا نبلش",
        home: "الرئيسية",
        features: "ميزاتنا",
        browse_products: "شوف الأغراض",
        cart: "سلتك",
        how_it_works: "كيف بتشتغل؟",
        about: "عنّا",
        jordan: "الأردن",
        
        // Hero Section
        powered_by: "مبنية بـ Gemini AI",
        hero_title_line1: "مساعدك الذكي",
        hero_title_line2: "للمقاضي بالأردن",
        hero_description: "تسوق بذكاء مع مونتي! تصفح مئات المنتجات، احصل على اقتراحات بتفهم عليك، واطلب ليوصلك لباب بيتك بأي مكان بالأردن.",
        hero_feature_ai: "ذكاء اصطناعي بفهمك",
        hero_feature_budget: "على قد جيبتك",
        hero_feature_talabat: "مربوطة مع طلبات",
        hero_feature_instant: "بلمح البصر",
        
        // Categories
        cat_pantry: "مونة",
        cat_frozen: "مجمدات",
        cat_dairy: "ألبان وأجبان",
        cat_meat: "لحوم",
        
        // Banners
        banner_about_badge: "شو هي مونتي؟",
        banner_about_desc: "مساعدك الذكي لتسوق الخضار الطازجة والمنتجات المحلية.",
        banner_selection_badge: "خيارات بتفتح النفس",
        banner_selection_title: "أكثر من 100 منتج نخب.",
        banner_selection_desc: "من الخضار الطازجة للحومات ولأغراض المونة.",
        banner_ai_badge: "المساعد الذكي",
        banner_ai_title: "محتار شو تطبخ؟",
        banner_ai_desc: "اكبس هون ودردش معي.",
        banner_delivery_badge: "خدمة طيارة",
        banner_delivery_desc: "توصيل سريع ومضمون لباب بيتك.",
        
        // Features Section
        features_title: "ميزات بتريّحك",
        features_subtitle: "كل إشي بتحتاجه لتتسوق بذكاء",
        feature_ai_title: "ذكاء اصطناعي بفهمك",
        feature_ai_desc: "اكتب اللي بدك ياه بلغتك العادية والذكاء الاصطناعي رح يفهم عليك.",
        feature_budget_title: "على قد جيبتك",
        feature_budget_desc: "حدد ميزانيتك، وبنظبّطلك قائمة تسوق ما بتخزق جيبتك.",
        feature_talabat_title: "مربوطة مع طلبات",
        feature_talabat_desc: "منتجات حقيقية بالدينار الأردني مع روابط سريعة للطلب من طلبات الأردن.",
        feature_recipe_title: "اقتراحات طبخات",
        feature_recipe_desc: "بنقترح عليك طبخات بناءً على الأغراض اللي بسلتك.",
        feature_sharing_title: "شيرها بسهولة",
        feature_sharing_desc: "شارك القائمة مع العيلة برابط أو انسخها كنص.",
        feature_mobile_title: "بتفتح من الموبايل",
        feature_mobile_desc: "تصميم مريح وسلس بيشتغل على كل الشاشات.",
        
        // How It Works
        how_it_works_title: "كيف بتشتغل؟",
        how_it_works_subtitle: "قائمة مقاضيك جاهزة بـ 3 خطوات",
        step1_title: "احكيلنا شو بدك",
        step1_desc: "مثلاً: \"بدي أغراض هش ونش لـ 14 شخص\" أو استخدم النموذج لتعطينا التفاصيل.",
        step2_title: "بنجّهزلك القائمة",
        step2_desc: "الذكاء الاصطناعي بيحسب الكميات وبيختارلك أحسن المنتجات من طلبات الأردن.",
        step3_title: "تسوق وشارك",
        step3_desc: "راجع القائمة، شوف الطبخات، وشاركها أو احفظها عندك.",
        
        // About Section
        about_title: "شو هي مونتي؟",
        about_text1: "مونتي هو رفيقك الذكي لتسوق المقاضي في الأردن. بيساعدك ترتب أمورك وتجهّز مقاضيك لأي عزومة، من عشاء العيلة للحفلات الكبيرة.",
        about_text2: "نظامنا بيفهم حكيك العادي وبيعملك قائمة بتوفّر عليك وقت، وبأسعار حقيقية. انسى تخمين الكميات أو إنك تنسى إشي!",
        stat_products: "منتج",
        stat_free: "بلاش",
        stat_available: "متوفر",
        stat_products_photos: "منتجات بصور",
        stat_categories: "أقسام",
        stat_currency: "بالدينار",
        stat_ai_powered: "ذكاء اصطناعي",
        
        // Shopping Planner
        planner_title: "مخطط التسوق الذكي",
        form_title: "رتب عزومتك",
        event_type: "نوع المناسبة",
        event_bbq: "هش ونش / مشاوي",
        event_dinner: "عزومة عشاء",
        event_lunch: "جمعة غداء",
        event_party: "حفلة / عيد ميلاد",
        event_family: "غداء عيلة",
        event_traditional: "طبخة أردنية",
        num_people: "كم شخص؟",
        budget_label: "الميزانية (دينار)",
        budget_placeholder: "مثال: 100",
        dietary_preferences: "تفضيلات الأكل",
        dietary_all: "بوكلوا كل إشي",
        dietary_vegetarian: "نباتي",
        dietary_halal: "حلال أكيد",
        dietary_no_beef: "بدون عجل",
        dietary_no_chicken: "بدون جاج",
        filters_label: "فلاتر",
        filter_healthy: "💚 صحي",
        filter_gluten_free: "🌾 بدون غلوتين",
        nutritional_filters: "فلاتر صحية",
        min_protein: "أقل بروتين (جم/100جم)",
        max_calories: "أعلى سعرات (سعر/100جم)",
        additional_requests: "أي طلبات ثانية؟",
        additional_placeholder: "مثال: كثّر خضار، طفرانين، بدنا بيبسي أكثر...",
        generate_list: "جهّز القائمة",
        or_text: "أو",
        welcome_message: "يا هلا فيك بمونتي",
        welcome_desc: "أنا مساعدك الشخصي للمقاضي. استخدم الفورم لتخطط بالتفصيل، أو دردش معي زي كأنك بتحكي مع صاحبك. رح أزبطك بقائمة بتبيّض الوجه.",
        
        // Browse Products
        browse_title: "شوف الأغراض",
        browse_subtitle: "تصفح كل إشي متوفر عندنا",
        search_products: "🔍 دوّر عاللي بدك ياه...",
        all_categories: "كل الأقسام",
        sort_name: "الترتيب حسب الاسم",
        sort_price_low: "السعر: من الأرخص للأغلى",
        sort_price_high: "السعر: من الأغلى للأرخص",
        sort_calories_low: "السعرات: الأقل أولاً",
        sort_protein_high: "البروتين: الأعلى أولاً",
        healthy_only: "💚 صحي بس",
        gluten_free: "🌾 بدون غلوتين",
        vegetarian: "🥬 نباتي",
        vegan: "🌱 نباتي صرف",
        organic: "🌿 عضوي",
        halal: "🕌 حلال",
        
        // Cart
        shopping_cart: "سلتك",
        items: "غرض",
        cart_empty: "السلة فاضية",
        cart_empty_hint: "ضيف أغراض من الدردشة أو تصفح المنتجات",
        total_items: "كم غرض:",
        total_cost: "الحساب:",
        proceed_checkout: "كمل للطلب",
        clear_cart: "فضّي السلة",
        remove_from_cart: "أشيلو من السلة؟",
        clear_entire_cart: "أفضّي السلة كلها؟ ما بتقدر تتراجع.",
        
        // Products
        add_to_cart: "ضيف للسلة",
        view_product: "شوف المنتج",
        
        // Chat
        send: "ابعث",
        type_message: "أو اكتب شو بخاطرك...",
        
        // General
        just_now: "هسا",
        
        // Footer
        footer_about_title: "عن مونتي.ai",
        footer_about_text: "رفيقك الذكي للمقاضي بالأردن. بيساعدك تجهّز قوائمك بأسعار حقيقية ومنتجات مرتبة، لتريّح راسك وتتسوق بذكاء.",
        footer_quick_links: "روابط سريعة",
        footer_contact: "تواصل معنا",
        footer_email: "support@mooneh.ai",
        footer_website: "www.mooneh.ai",
        footer_follow: "تابعنا",
        footer_powered_by: "مدعوم من Gemini AI",
        footer_copyright: "© 2026 Mooneh.ai. جميع الحقوق محفوظة.",
        
        // Pagination
        prev: "اللي قبله",
        next: "اللي بعده",
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
