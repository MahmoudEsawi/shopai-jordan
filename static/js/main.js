// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// Product Browse Functions and State
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12; // Show 12 products per page

// Generate or retrieve session ID required for API carts
function getSessionId() {
    let sessionId = localStorage.getItem('shopai_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('shopai_session_id', sessionId);
    }
    return sessionId;
}

// Cart Toggle Functions - Improved to prevent glitching
function toggleCart() {
    const sideCart = document.getElementById('sideCart');
    const overlay = document.getElementById('cartOverlay');
    
    if (!sideCart || !overlay) return;
    
    // Prevent multiple rapid toggles
    if (sideCart.classList.contains('toggling')) return;
    sideCart.classList.add('toggling');
    
    const isActive = sideCart.classList.contains('active');
    
    if (isActive) {
        // Closing cart
        sideCart.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        // Opening cart - load cart first
        loadCart();
        sideCart.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Remove toggling flag after animation completes
    setTimeout(() => {
        sideCart.classList.remove('toggling');
    }, 300);
}

// Close cart when clicking outside
document.addEventListener('click', (e) => {
    const sideCart = document.getElementById('sideCart');
    const cartToggle = document.getElementById('cartToggleBtn');
    
    if (sideCart && !sideCart.contains(e.target) && !cartToggle?.contains(e.target)) {
        if (sideCart.classList.contains('active')) {
            toggleCart();
        }
    }
});

// Close cart on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const sideCart = document.getElementById('sideCart');
        if (sideCart && sideCart.classList.contains('active')) {
            toggleCart();
        }
    }
});

window.onload = () => {
    loadStats();
    loadCart();
    
    // Load products and setup filters when browse section is available
    if (document.getElementById('productsGrid')) {
        loadProducts();
        setupProductFilters();
    }
    
    // Initialize language
    if (typeof initLanguage === 'function') {
        initLanguage();
    }
};

// Also try loading when DOM is ready (in case window.onload already fired)
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid') && allProducts.length === 0) {
        loadProducts();
        setupProductFilters();
    }
});

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        document.getElementById('totalProducts').textContent = data.total_products;
        let totalCats = 0;
        if (data.stores) {
            data.stores.forEach(s => totalCats += s.categories.length);
        }
        document.getElementById('totalCategories').textContent = totalCats;
    } catch (error) {
        console.error('Error:', error);
    }
}

// AI Chat Functions removed
function sendMessage() {}
// Mobile Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.getElementById('mobileMenuToggle');
    
    if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
        navMenu.classList.remove('active');
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            const navMenu = document.getElementById('navMenu');
            navMenu.classList.remove('active');
        }
    });
});

// Update active nav link on scroll
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Share List Function
async function shareList(shareUrl) {
    const fullUrl = window.location.origin + shareUrl;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My Shopping List - ShopAI Jordan',
                text: window.currentShoppingList ? 
                    `Shopping list for ${window.currentShoppingList.num_people} people - ${window.currentShoppingList.total_cost.toFixed(2)} JOD` :
                    'Check out my shopping list!',
                url: fullUrl
            });
        } catch (err) {
            // Fallback to copy
            copyToClipboard(fullUrl);
        }
    } else {
        copyToClipboard(fullUrl);
    }
}

// Export List Function
async function exportList() {
    if (!window.currentShoppingList) {
        Toast.warning('No shopping list to export');
        return;
    }
    
    // Use a simple prompt-like approach with toast
    Toast.info('Choose export format: Click JSON or Text', 5000);
    // For now, default to JSON. Can be enhanced with a modal later
    const format = 'json';
    
    try {
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                shopping_list: window.currentShoppingList,
                format: format
            })
        });
        
        const data = await response.json();
        
        // Create download
        const blob = new Blob([data.content], { type: format === 'json' ? 'application/json' : 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopping-list-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        Toast.success(`Shopping list exported as ${format.toUpperCase()}!`);
    } catch (error) {
        Toast.error('Error exporting list: ' + error.message);
    }
}

// Copy to Clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.success('Link copied to clipboard!');
        });
    } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Link copied to clipboard!');
    }
}

// Product Browse Functions (State variables moved to top)
async function loadProducts() {
    const loadingEl = document.getElementById('productsLoading');
    const gridEl = document.getElementById('productsGrid');
    
    if (!loadingEl || !gridEl) {
        console.error('Browse section elements not found');
        return;
    }
    
    try {
        loadingEl.style.display = 'block';
        // Show loading skeletons
        gridEl.innerHTML = Array(12).fill(0).map(() => `
            <div class="skeleton-product-card">
                <div class="skeleton skeleton-product-image"></div>
                <div class="skeleton skeleton-product-title"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
                <div class="skeleton skeleton-product-price"></div>
                <div class="skeleton skeleton-product-button"></div>
            </div>
        `).join('');
        
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Handle both array response and object with products property
        if (Array.isArray(data)) {
            allProducts = data;
        } else if (data.products && Array.isArray(data.products)) {
            allProducts = data.products;
        } else {
            allProducts = [];
        }
        
        filteredProducts = [...allProducts];
        
        console.log(`✅ Loaded ${allProducts.length} products from API`);
        
        if (allProducts.length === 0) {
            console.warn('⚠️ No products found. Check MongoDB connection and collection.');
        }
        
        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            // Clear existing options except "All Categories"
            while (categoryFilter.children.length > 1) {
                categoryFilter.removeChild(categoryFilter.lastChild);
            }
            
            // Get unique categories with counts
            const categoryMap = {};
            allProducts.forEach(p => {
                const cat = p.category || 'general';
                categoryMap[cat] = (categoryMap[cat] || 0) + 1;
            });
            
            // Sort categories and add to filter with icons
            const categoryIcons = {
                'meat': '🥩',
                'vegetables': '🥬',
                'fruits': '🍎',
                'dairy': '🥛',
                'bread': '🍞',
                'condiments': '🧂',
                'drinks': '🥤',
                'snacks': '🍿',
                'dessert': '🍰',
                'grains': '🌾',
                'spices': '🌶️',
                'frozen': '🧊',
                'charcoal': '🔥',
                'supplies': '📦',
                'salads': '🥗'
            };
            
            const categories = Object.keys(categoryMap).sort();
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                const count = categoryMap[cat];
                const icon = categoryIcons[cat] || '📦';
                const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
                option.textContent = `${icon} ${displayName} (${count})`;
                categoryFilter.appendChild(option);
            });
            
            console.log(`Populated ${categories.length} categories`);
        }
        
        displayProducts();
        updateFilterResults(allProducts.length);
        loadingEl.style.display = 'none';
    } catch (error) {
        console.error('Error loading products:', error);
        loadingEl.innerHTML = `<div style="color: var(--warning); padding: 2rem; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Error loading products</div>
            <div style="font-size: 0.9rem; color: var(--gray);">${error.message}</div>
            <button class="btn btn-primary btn-sm" onclick="loadProducts()" style="margin-top: 1rem;">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>`;
    }
}

function setupProductFilters() {
    const searchInput = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const healthyCheck = document.getElementById('browseHealthy');
    const glutenFreeCheck = document.getElementById('browseGlutenFree');
    const vegetarianCheck = document.getElementById('browseVegetarian');
    const veganCheck = document.getElementById('browseVegan');
    const organicCheck = document.getElementById('browseOrganic');
    const halalCheck = document.getElementById('browseHalal');
    const adminCheck = document.getElementById('browseAdmin');
    const minProteinInput = document.getElementById('browseMinProtein');
    const maxCaloriesInput = document.getElementById('browseMaxCalories');
    const priceFilter = document.getElementById('priceFilter');
    
    const elements = [searchInput, categoryFilter, sortFilter, healthyCheck, glutenFreeCheck, vegetarianCheck, veganCheck, organicCheck, halalCheck, minProteinInput, maxCaloriesInput, priceFilter];
    
    elements.forEach(el => {
        if (el) {
            el.addEventListener('change', filterProducts);
            if (el === searchInput || el === minProteinInput || el === maxCaloriesInput) {
                el.addEventListener('input', filterProducts);
            }
            if (el === searchInput) {
                el.addEventListener('focus', () => {
                    if (el.value.trim() !== '') {
                        updateSearchSuggestions(el.value.toLowerCase());
                    }
                });
                
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const browseSection = document.getElementById('browse');
                        if (browseSection) {
                            // Account for the fixed navbar height
                            const offsetTop = browseSection.offsetTop - 80;
                            window.scrollTo({
                                top: offsetTop,
                                behavior: 'smooth'
                            });
                        }
                        const suggestionsEl = document.getElementById('searchSuggestions');
                        if (suggestionsEl) {
                            suggestionsEl.classList.add('hidden');
                        }
                        // Optionally blur the input to hide soft keyboard on mobile
                        el.blur();
                    }
                });
            }
        }
    });
    
    console.log('Product filters setup complete');
}

function filterProducts() {
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const categorySelect = document.getElementById('categoryFilter');
    const category = categorySelect?.value || '';
    let sortBy = document.getElementById('sortFilter')?.value || 'name';
    const priceFilterVal = document.getElementById('priceFilter')?.value;
    if (priceFilterVal) {
        sortBy = priceFilterVal;
        // Optionally sync the other sort dropdown
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) sortFilter.value = priceFilterVal;
    }
    const healthyOnly = document.getElementById('browseHealthy')?.checked || false;
    const glutenFreeOnly = document.getElementById('browseGlutenFree')?.checked || false;
    const vegetarianOnly = document.getElementById('browseVegetarian')?.checked || false;
    const veganOnly = document.getElementById('browseVegan')?.checked || false;
    const organicOnly = document.getElementById('browseOrganic')?.checked || false;
    const halalOnly = document.getElementById('browseHalal')?.checked || false;
    const minProtein = parseFloat(document.getElementById('browseMinProtein')?.value) || 0;
    const maxCalories = parseFloat(document.getElementById('browseMaxCalories')?.value) || Infinity;
    
    // Visual feedback for active category filter
    if (categorySelect) {
        if (category) {
            categorySelect.style.borderColor = 'var(--primary)';
            categorySelect.style.boxShadow = '0 0 0 3px rgba(230, 126, 34, 0.1)';
        } else {
            categorySelect.style.borderColor = '';
            categorySelect.style.boxShadow = '';
        }
    }
    
    filteredProducts = allProducts.filter(product => {
        // Search filter
        const prodName = (product.name_ar || product.name_en || product.name || '').toLowerCase();
        if (searchTerm && !prodName.includes(searchTerm) && 
            !(product.description || '').toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Category filter - case-insensitive and handle null/undefined
        if (category) {
            const productCategory = (product.category || 'general').toLowerCase();
            const filterCategory = category.toLowerCase();
            if (productCategory !== filterCategory) {
                return false;
            }
        }
        
        // Dietary filters
        if (healthyOnly && !product.is_healthy) return false;
        if (glutenFreeOnly && !product.is_gluten_free) return false;
        if (vegetarianOnly && !product.is_vegetarian) return false;
        if (veganOnly && !product.is_vegan) return false;
        if (organicOnly && !product.is_organic) return false;
        if (halalOnly && !product.is_halal) return false;
        
        // Nutritional filters
        if (minProtein > 0 && (!product.protein_per_100g || product.protein_per_100g < minProtein)) {
            return false;
        }
        if (maxCalories < Infinity && (!product.calories_per_100g || product.calories_per_100g > maxCalories)) {
            return false;
        }
        
        return true;
    });
    
    // Sort products
    filteredProducts.sort((a, b) => {
        switch(sortBy) {
            case 'price_low':
                return (a.price_jod || a.price || 0) - (b.price_jod || b.price || 0);
            case 'price_high':
                return (b.price_jod || b.price || 0) - (a.price_jod || a.price || 0);
            case 'calories_low':
                return (a.calories_per_100g || 0) - (b.calories_per_100g || 0);
            case 'protein_high':
                return (b.protein_per_100g || 0) - (a.protein_per_100g || 0);
            default:
                const nameA = a.name_ar || a.name_en || a.name || '';
                const nameB = b.name_ar || b.name_en || b.name || '';
                return nameA.localeCompare(nameB);
        }
    });
    
    // Update results count
    updateFilterResults(filteredProducts.length);
    
    updateSearchSuggestions(searchTerm);
    
    displayProducts();
}

function updateFilterResults(count) {
    // Reset to first page when filters change
    currentPage = 1;
    
    // Add or update results count display
    let resultsDisplay = document.getElementById('filterResultsCount');
    if (!resultsDisplay) {
        const browseControls = document.querySelector('.browse-controls');
        if (browseControls) {
            resultsDisplay = document.createElement('div');
            resultsDisplay.id = 'filterResultsCount';
            resultsDisplay.className = 'filter-results-count';
            browseControls.appendChild(resultsDisplay);
        }
    }
    
    if (resultsDisplay) {
        resultsDisplay.textContent = `Showing ${count} product${count !== 1 ? 's' : ''}`;
        resultsDisplay.style.display = 'block';
    }
}

function updateSearchSuggestions(searchTerm) {
    const suggestionsEl = document.getElementById('searchSuggestions');
    if (!suggestionsEl) return;
    
    if (!searchTerm || searchTerm.trim() === '') {
        suggestionsEl.classList.add('hidden');
        return;
    }
    
    const topResults = filteredProducts.slice(0, 3);
    
    if (topResults.length === 0) {
        suggestionsEl.innerHTML = '<div class="p-4 text-sm text-gray-500 text-center font-medium">No results found</div>';
        suggestionsEl.classList.remove('hidden');
        return;
    }
    
    const isArabic = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
    
    suggestionsEl.innerHTML = topResults.map(product => {
        const productName = escapeHtml(product.name_ar || product.name_en || product.name || 'Unknown Product');
        const imageUrl = product.image_url || 'https://via.placeholder.com/50?text=No+Image';
        const price = (product.price_jod || product.price || 0).toFixed(2);
        const productId = product.id || product._id || '';
        
        return `
            <div class="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition" onclick="window.location.hash='#browse'; document.getElementById('productSearch').value=''; document.getElementById('searchSuggestions').classList.add('hidden'); setTimeout(()=> { if(typeof window.openQuickView === 'function') window.openQuickView('${productId}') }, 100);">
                <img src="${imageUrl}" class="w-10 h-10 object-contain rounded-lg border border-gray-100" alt="Product" onerror="this.src='https://via.placeholder.com/50'">
                <div class="flex-1 flex flex-col">
                    <span class="text-sm font-bold text-gray-800 line-clamp-1">${productName}</span>
                    <span class="text-[10px] text-gray-500 font-medium">${escapeHtml(product.category || '')}</span>
                </div>
                <div class="font-black text-brand-dark text-sm w-16 text-right">${price} JOD</div>
            </div>
        `;
    }).join('');
    
    suggestionsEl.classList.remove('hidden');
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    const searchInput = document.getElementById('productSearch');
    const suggestionsEl = document.getElementById('searchSuggestions');
    if (suggestionsEl && searchInput && !suggestionsEl.contains(e.target) && e.target !== searchInput) {
        suggestionsEl.classList.add('hidden');
    }
});

function displayProducts() {
    const grid = document.getElementById('productsGrid');
    const paginationEl = document.getElementById('productsPagination');
    
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray);"><i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i><div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">No products found</div><div>Try adjusting your filters or search terms.</div></div>';
        if (paginationEl) paginationEl.style.display = 'none';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    // Get current language
    const isArabic = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
    
    // Update pagination UI
    if (paginationEl && totalPages > 1) {
        paginationEl.style.display = 'flex';
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');
        
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages;
        }
        if (pageInfo) {
            pageInfo.textContent = isArabic 
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`;
        }
    } else if (paginationEl) {
        paginationEl.style.display = 'none';
    }
    
    const html = productsToShow.map(product => {
        // Build tags/labels array with language support
        const tags = [];
        if (product.is_gluten_free) tags.push({text: isArabic ? '🌾 خالي من الغلوتين' : '🌾 Gluten-Free', class: 'tag-gluten-free'});
        if (product.is_vegetarian) tags.push({text: isArabic ? '🥬 نباتي' : '🥬 Vegetarian', class: 'tag-vegetarian'});
        if (product.is_vegan) tags.push({text: isArabic ? '🌱 نباتي صرف' : '🌱 Vegan', class: 'tag-vegan'});
        if (product.is_healthy) tags.push({text: isArabic ? '💚 صحي' : '💚 Healthy', class: 'tag-healthy'});
        if (product.is_organic) tags.push({text: isArabic ? '🌿 عضوي' : '🌿 Organic', class: 'tag-organic'});
        if (product.is_halal) tags.push({text: isArabic ? '🕌 حلال' : '🕌 Halal', class: 'tag-halal'});
        
        // Category tag
        if (product.category) {
            tags.push({text: product.category.charAt(0).toUpperCase() + product.category.slice(1), class: 'tag-category'});
        }
        
        // Escape HTML to prevent XSS (using global function)
        const productName = escapeHtml(product.name_ar || product.name_en || product.name || 'Unknown Product');
        const category = escapeHtml(product.category || 'General');
        const imageUrl = product.image_url || 'https://via.placeholder.com/300?text=No+Image';
        const productUrl = product.product_url || '#';
        const price = (product.price_jod || product.price || 0).toFixed(2);
        const productId = product.id || '';
        
        // Build nutrition info (hidden by default, shown only on eye click)
        const hasNutrition = product.calories_per_100g || product.protein_per_100g || product.carbs_per_100g || product.fats_per_100g;
        
        // Store product data in data attribute for quick access
        const productData = escapeHtml(JSON.stringify(product));
        
        return `
            <div class="product-card bg-white rounded-[1.5rem] transition-all duration-300 relative group flex flex-col font-sans w-full h-[360px] max-w-[240px] mx-auto cursor-pointer border border-transparent hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] shadow-[0_5px_15px_rgba(0,0,0,0.02)]" data-product-id="${productId}" data-product='${productData}'>
                
                <!-- Product Image -->
                <div class="flex justify-center items-center pt-5 pb-2 relative h-[160px] shrink-0 w-full">
                    <img src="${imageUrl}" 
                         alt="${productName}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300?text=No+Image'"
                         class="w-full h-full object-contain max-w-[140px] max-h-[140px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform duration-500 group-hover:scale-105">
                </div>

                <!-- Product Details -->
                <div class="mt-2 flex flex-col items-center text-center gap-1 pb-4 px-2 flex-1">
                    <h3 class="font-bold text-[#0e423e] text-[15px] leading-snug line-clamp-2 w-full">${productName}</h3>
                    <div class="text-[11px] text-gray-400 font-medium tracking-wide">${product.size || '500 gm.'}</div>
                    
                    <div class="mt-auto pt-2 font-black text-2xl text-[#0e423e] tracking-tight flex items-start justify-center">
                        ${price.split('.')[0]}<span class="text-[13px] pt-1">.${price.split('.')[1] || '00'}$</span>
                    </div>
                </div>
                
                <div class="cart-btn-wrapper relative flex justify-center w-[90%] mx-auto mt-0 mb-3">
                    <button class="add-to-cart-action w-full h-11 rounded-t-sm rounded-b-2xl bg-[#F4F7F4] hover:bg-[#E2ECE2] text-brand-dark flex items-center justify-center transition-colors duration-200" data-pid="${productId}">
                        <i class="fas fa-plus text-lg pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = html;
    
    // Add event delegation for the new elements
    const newCards = grid.querySelectorAll('.product-card');
    newCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Check if the click was on the add-to-cart button or its inner text/icon
            const cartBtn = e.target.closest('.add-to-cart-action, .cart-btn-wrapper button');
            if (cartBtn) {
                e.preventDefault();
                e.stopPropagation();
                // Determine the action based on the button class and dataset
                const pid = card.dataset.productId;
                if (!pid) return;
                
                if (cartBtn.classList.contains('qty-minus')) {
                    const currentQty = parseInt(cartBtn.parentElement.querySelector('span').textContent);
                    window.cartHelpers.update(pid, currentQty - 1);
                } else if (cartBtn.classList.contains('qty-plus')) {
                    const currentQty = parseInt(cartBtn.parentElement.querySelector('span').textContent);
                    window.cartHelpers.update(pid, currentQty + 1);
                } else {
                    window.cartHelpers.add(pid);
                }
                return;
            }
            
            // Otherwise, it’s a click on the card: open quick view
            if (typeof window.openQuickView === 'function') {
                window.openQuickView(card.dataset.productId);
            }
        });
    });
    
    // Update wishlist UI after rendering products
    if (typeof wishlistManager !== 'undefined') {
        wishlistManager.updateWishlistUI();
    }
    
    // Sync cart buttons with local storage
    if (typeof window.syncProductCards === 'function') {
        window.syncProductCards();
    }
    
    console.log(`Displayed ${productsToShow.length} products (page ${currentPage} of ${totalPages}, total: ${filteredProducts.length})`);
}

// Pagination functions
function changePage(direction) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayProducts();
        // Scroll to top of products section
        const browseSection = document.getElementById('browse');
        if (browseSection) {
            browseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Toggle nutrition info visibility
function toggleNutritionInfo(cardElement) {
    const productId = cardElement.dataset.productId;
    const nutritionEl = document.getElementById(`nutrition-${productId}`);
    
    if (nutritionEl) {
        if (nutritionEl.style.display === 'none' || !nutritionEl.style.display) {
            nutritionEl.style.display = 'block';
        } else {
            nutritionEl.style.display = 'none';
        }
    } else {
        // If nutrition info doesn't exist, show product modal instead
        const product = JSON.parse(cardElement.dataset.product);
        if (typeof productModal !== 'undefined') {
            productModal.show(product);
        }
    }
}

// Cart Management Functions
async function loadCart() {
    try {
        const response = await fetch('/api/cart', {
            headers: {'X-Session-ID': getSessionId()}
        });
        const data = await response.json();
        if (data.success && data.cart) {
            updateCartDisplay(data.cart);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// Debounce cart updates to prevent glitching
let cartUpdateTimeout = null;
let isUpdatingCart = false;

function updateCartDisplay(cart) {
    // Debounce rapid updates - prevent glitching from multiple rapid calls
    if (cartUpdateTimeout) {
        clearTimeout(cartUpdateTimeout);
    }
    
    cartUpdateTimeout = setTimeout(() => {
        _updateCartDisplay(cart);
    }, 150); // Increased delay for stability
}

function _updateCartDisplay(cart) {
    if (isUpdatingCart) {
        setTimeout(() => _updateCartDisplay(cart), 200);
        return;
    }
    isUpdatingCart = true;

    requestAnimationFrame(() => {
        try {
            const cartItemsEl  = document.getElementById('cartItems');
            const cartItemCountEl = document.getElementById('cartItemCount');
            const cartTotalEl  = document.getElementById('cartTotal');
            const navCartCount = document.getElementById('navCartCount');
            const cartFooter   = document.getElementById('cartFooter');
            const cartFooterTotal = document.getElementById('cartFooterTotal');

            if (!cartItemsEl) { isUpdatingCart = false; return; }

            // Store cart for syncProductCards
            localStorage.setItem('lastCartData', JSON.stringify(cart));

            // --- Client-side dedup: merge duplicate productIds before rendering ---
            const merged = [];
            (cart.items || []).forEach(item => {
                const pid = String(item.productId || item.product_id || '');
                const existing = merged.find(m => m.pid === pid);
                if (existing) {
                    existing.quantity += (item.quantity || 1);
                    existing.total_price = existing.unit_price * existing.quantity;
                } else {
                    merged.push({
                        pid,
                        name: item.name || item.product_name || 'Product',
                        category: item.category || 'General',
                        image_url: item.image_url || '',
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || item.price || 0,
                        total_price: item.total_price || (item.unit_price || item.price || 0) * (item.quantity || 1),
                    });
                }
            });

            const itemCount = merged.reduce((s, i) => s + i.quantity, 0);
            const totalCost = merged.reduce((s, i) => s + i.total_price, 0);

            // Update header counts
            if (cartItemCountEl) cartItemCountEl.textContent = itemCount;
            if (cartTotalEl) cartTotalEl.textContent = totalCost.toFixed(2);
            if (navCartCount) {
                navCartCount.textContent = itemCount;
                navCartCount.style.display = itemCount > 0 ? 'flex' : 'none';
            }
            if (cartFooterTotal) cartFooterTotal.textContent = `${totalCost.toFixed(2)} JOD`;

            // Show/hide footer
            if (cartFooter) {
                if (merged.length > 0) {
                    cartFooter.style.removeProperty('display');
                } else {
                    cartFooter.style.display = 'none';
                }
            }

            // Build cart items DOM (no innerHTML with onclick - use data attributes)
            cartItemsEl.innerHTML = '';

            if (merged.length === 0) {
                cartItemsEl.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-48 text-gray-400 gap-3 mt-8 opacity-70">
                        <i class="fas fa-shopping-basket text-5xl"></i>
                        <div class="text-xl font-black text-gray-500">Your basket is empty</div>
                        <div class="text-sm font-medium">Add items from the store to see them here</div>
                    </div>`;
                return;
            }

            merged.forEach(item => {
                const card = document.createElement('div');
                card.className = 'cart-item flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100';
                card.dataset.pid = item.pid;

                // Image
                const imgBox = document.createElement('div');
                imgBox.className = 'w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-gray-300';
                if (item.image_url) {
                    const img = document.createElement('img');
                    img.src = item.image_url;
                    img.alt = item.name;
                    img.className = 'w-full h-full object-cover';
                    img.loading = 'lazy';
                    img.onerror = () => { imgBox.innerHTML = '<i class="fas fa-box text-2xl"></i>'; };
                    imgBox.appendChild(img);
                } else {
                    imgBox.innerHTML = '<i class="fas fa-box text-2xl"></i>';
                }

                // Details
                const details = document.createElement('div');
                details.className = 'flex-1 min-w-0';
                details.innerHTML = `
                    <div class="font-bold text-gray-900 text-sm leading-tight truncate">${item.name}</div>
                    <div class="text-xs text-gray-400 mt-0.5 mb-1">${item.category}</div>
                    <div class="font-black text-brand-dark text-base">${item.total_price.toFixed(2)} JOD</div>
                    <div class="text-xs text-gray-400">${item.unit_price.toFixed(2)} JOD each</div>`;

                // Controls
                const controls = document.createElement('div');
                controls.className = 'flex flex-col items-center gap-2';

                const qtyRow = document.createElement('div');
                qtyRow.className = 'flex items-center gap-1 bg-gray-100 rounded-xl p-1';

                const minusBtn = document.createElement('button');
                minusBtn.className = 'cart-qty-btn w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-brand-default transition-colors';
                minusBtn.dataset.action = 'minus';
                minusBtn.dataset.pid = item.pid;
                minusBtn.dataset.qty = item.quantity;
                minusBtn.innerHTML = '<i class="fas fa-minus text-[10px] text-gray-600 pointer-events-none"></i>';

                const qtySpan = document.createElement('span');
                qtySpan.className = 'font-black text-sm text-gray-900 w-6 text-center';
                qtySpan.textContent = item.quantity;

                const plusBtn = document.createElement('button');
                plusBtn.className = 'cart-qty-btn w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-brand-default transition-colors';
                plusBtn.dataset.action = 'plus';
                plusBtn.dataset.pid = item.pid;
                plusBtn.dataset.qty = item.quantity;
                plusBtn.innerHTML = '<i class="fas fa-plus text-[10px] text-gray-600 pointer-events-none"></i>';

                qtyRow.appendChild(minusBtn);
                qtyRow.appendChild(qtySpan);
                qtyRow.appendChild(plusBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'cart-delete-btn w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-colors';
                deleteBtn.dataset.pid = item.pid;
                deleteBtn.title = 'Remove';
                deleteBtn.innerHTML = '<i class="fas fa-trash text-[10px] pointer-events-none"></i>';

                controls.appendChild(qtyRow);
                controls.appendChild(deleteBtn);

                card.appendChild(imgBox);
                card.appendChild(details);
                card.appendChild(controls);
                cartItemsEl.appendChild(card);
            });

            // Sync product cards on browse page
            if (typeof window.syncProductCards === 'function') window.syncProductCards();

        } catch (error) {
            console.error('Error updating cart display:', error);
        } finally {
            setTimeout(() => { isUpdatingCart = false; }, 100);
        }
    });
}

async function addToCart(productId, quantity = 1) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            },
            body: JSON.stringify({productId: productId, quantity: quantity})
        });
        
        const data = await response.json();
        const currentLang = localStorage.getItem('language') || 'en';
        const t = translations[currentLang] || translations['en'];
        if (data.success) {
            await loadCart(); // Reload cart to get updated data
            
            // Auto open side cart
            const sideCart = document.getElementById('sideCart');
            if (sideCart && !sideCart.classList.contains('active')) {
                toggleCart();
            }
            
            // showNotification(data.message || t.product_added_to_cart, 'success');
        } else {
            showNotification(data.error || data.message || t.product_add_error, 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

async function removeFromCart(productId) {
    try {
        const response = await fetch('/api/cart/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            },
            body: JSON.stringify({productId: productId})
        });
        
        const data = await response.json();
        if (data.success) {
            await loadCart(); // Reload cart to get updated data
            const currentLang = localStorage.getItem('language') || 'en';
            const t = translations[currentLang] || translations['en'];
            showNotification(data.message || t.product_removed_from_cart, 'success');
        } else {
            const currentLang = localStorage.getItem('language') || 'en';
            const t = translations[currentLang] || translations['en'];
            showNotification(data.error || data.message || t.product_remove_error, 'error');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

async function updateCartQuantity(productId, quantity) {
    quantity = parseInt(quantity);
    
    // If quantity is 0 or less, remove the item entirely
    if (isNaN(quantity) || quantity <= 0) {
        return removeFromCart(productId);
    }
    
    try {
        const response = await fetch('/api/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            },
            body: JSON.stringify({productId: productId, quantity: quantity})
        });
        
        const data = await response.json();
        if (data.success) {
            await loadCart(); // Always reload from server for consistency
        } else {
            showNotification(data.message || 'Error updating quantity', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function clearCart() {
    const confirmMsg = 'Clear entire basket? This cannot be undone.';
    if (!confirm(confirmMsg)) return;
    
    try {
        const response = await fetch('/api/cart/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            }
        });
        
        const data = await response.json();
        if (data.success) {
            await loadCart(); // Reload to reflect cleared state
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

function checkoutCart() {
    const cartItemsEl = document.getElementById('cartItems');
    if (!cartItemsEl || cartItemsEl.querySelector('.cart-empty')) {
        if(typeof Toast !== 'undefined') Toast.warning('Cart is empty!');
        return;
    }
    
    // Auto-fill available user info if logged in
    const username = localStorage.getItem('username');
    if (username) {
        const nameInput = document.getElementById('checkoutName');
        if(nameInput && !nameInput.value) nameInput.value = username;
    }
    
    // Close side cart so it doesn't cover checkout modal
    const sideCart = document.getElementById('sideCart');
    const overlay = document.getElementById('cartOverlay');
    if (sideCart && sideCart.classList.contains('active')) {
        sideCart.classList.remove('active');
        if(overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Open checkout modal
    const modal = document.getElementById('checkoutModal');
    const content = document.getElementById('checkoutContent');
    
    if(modal && content) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Small delay to allow display:flex to apply before animation
        setTimeout(() => {
            content.classList.remove('translate-y-full', 'opacity-0');
            content.classList.add('translate-y-0', 'opacity-100');
        }, 10);
        
        document.body.style.overflow = 'hidden';
    }
}

function closeCheckout() {
    const modal = document.getElementById('checkoutModal');
    const content = document.getElementById('checkoutContent');
    
    if(content) {
        content.classList.remove('translate-y-0', 'opacity-100');
        content.classList.add('translate-y-full', 'opacity-0');
    }
    
    setTimeout(() => {
        if(modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        // Only re-enable scrolling if no other modals are open
        const sideCart = document.getElementById('sideCart');
        const aiChatPanel = document.getElementById('aiChatPanel');
        if ((!sideCart || !sideCart.classList.contains('active')) && 
            (!aiChatPanel || !aiChatPanel.classList.contains('translate-x-0'))) {
            document.body.style.overflow = '';
        }
    }, 300);
}

async function submitCheckout(event) {
    event.preventDefault();
    
    const name = document.getElementById('checkoutName').value;
    const phone = document.getElementById('checkoutPhone').value;
    const address = document.getElementById('checkoutAddress').value;
    const payment = document.getElementById('checkoutPayment').value;
    
    const cartData = JSON.parse(localStorage.getItem('lastCartData') || '{"items":[]}');
    const totalRaw = document.getElementById('cartFooterTotal').textContent;
    const total = parseFloat(totalRaw) || 0;
    
    const orderData = {
        customerInfo: { name, phone, address, payment_method: payment },
        items: cartData.items || [],
        total: total,
        session_id: getSessionId()
    };
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeCheckout();
            if(typeof Toast !== 'undefined') Toast.success('Order placed successfully! ID: ' + data.orderId);
            // Clear cart
            await fetch('/api/cart/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() }
            });
            await loadCart();
        } else {
            if(typeof Toast !== 'undefined') Toast.error(data.error || 'Failed to place order.');
        }
    } catch (err) {
        console.error('Checkout error:', err);
        if(typeof Toast !== 'undefined') Toast.error('An error occurred during checkout.');
    }
}

async function addProductToCartByName(productName) {
    try {
        // Search for product by name
        const response = await fetch(`/api/products?q=${encodeURIComponent(productName)}`);
        const data = await response.json();
        
        if (data.success && data.products && data.products.length > 0) {
            const product = data.products[0];
            await addToCart(product.id, 1);
        } else {
            showNotification('Product not found', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Display editable shopping list from chat
function displayEditableShoppingList(shoppingList, originalRequest) {
    const container = document.getElementById('shoppingList');
    if (!container) {
        console.error('Shopping list container not found');
        return;
    }
    
    // Get current language
    const currentLang = localStorage.getItem('language') || 'en';
    const isArabic = currentLang === 'ar' || document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
    
    // Get translations
    const t = translations[currentLang] || translations['en'];
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'shopping-list-header';
    header.style.cssText = 'margin-bottom: 1.5rem;';
    
    const numPeople = shoppingList.num_people || 1;
    const eventType = shoppingList.event_type || 'general';
    const eventNames = {
        'bbq': isArabic ? 'شواء' : 'BBQ',
        'dinner': isArabic ? 'عشاء' : 'Dinner Party',
        'lunch': isArabic ? 'غداء' : 'Lunch Gathering',
        'breakfast': isArabic ? 'فطور' : 'Breakfast',
        'party': isArabic ? 'حفلة' : 'Party',
        'family': isArabic ? 'وجبة عائلية' : 'Family Meal',
        'traditional': isArabic ? 'وجبة أردنية تقليدية' : 'Traditional Jordanian',
        'general': isArabic ? 'عام' : 'General Event'
    };
    const eventDisplayName = eventNames[eventType] || eventNames['general'];
    const peopleText = numPeople === 1 ? t.person : t.num_people;
    
    header.innerHTML = `
        <h3 style="color: var(--dark); margin-bottom: 0.5rem;">🛒 ${t.shopping_list_title}</h3>
        <p style="color: var(--gray); font-size: 0.95rem; margin-top: 0.5rem;">
            ${eventDisplayName} ${t.for_event} ${numPeople} ${peopleText}
            <br>
            ${t.shopping_list_subtitle}
        </p>
    `;
    container.appendChild(header);
    
    // List items container
    const listContainer = document.createElement('div');
    listContainer.className = 'shopping-list-items';
    listContainer.style.cssText = 'margin-top: 1.5rem;';
    
    shoppingList.items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shopping-list-item-editable';
        itemDiv.dataset.index = index;
        itemDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: white;
            border-radius: 12px;
            margin-bottom: 0.75rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease-in-out;
        `;
        itemDiv.onmouseenter = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };
        itemDiv.onmouseleave = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        };
        
        const totalPrice = (item.unit_price * item.quantity).toFixed(2);
        const productName = isArabic ? escapeHtml(item.name_ar || item.name || 'منتج غير معروف') : escapeHtml(item.name_en || item.name || 'Unknown Product');
        const productCategory = escapeHtml(item.category || (isArabic ? 'عام' : 'General'));
        const productDescription = isArabic ? escapeHtml(item.description_ar || item.description || '') : escapeHtml(item.description_en || item.description || '');
        
        itemDiv.innerHTML = `
            <a href="${escapeHtml(item.product_url || '#')}" target="_blank" rel="noopener noreferrer" style="flex-shrink: 0;">
                <img src="${escapeHtml(item.image_url || 'https://via.placeholder.com/80?text=No+Image')}" 
                     alt="${productName}" 
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=No+Image';"
                     style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
            </a>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; color: var(--dark); margin-bottom: 0.25rem; font-size: 1rem;">
                    <a href="${escapeHtml(item.product_url || '#')}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">
                        ${productName}
                    </a>
                </div>
                <div style="font-size: 0.85rem; color: var(--gray); margin-bottom: 0.25rem;">
                    ${productCategory} • ${item.unit_price.toFixed(2)} ${item.currency || 'JOD'} ${t.per_unit}
                </div>
                ${productDescription ? `<div style="font-size: 0.8rem; color: var(--light-gray); max-height: 40px; overflow: hidden; text-overflow: ellipsis;">${productDescription}</div>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                <button onclick="updateListItemQuantity(${index}, -1)" style="
                    width: 32px;
                    height: 32px;
                    border: 1px solid var(--primary);
                    background: white;
                    color: var(--primary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">-</button>
                <input type="number" 
                       id="list_quantity_${index}" 
                       value="${item.quantity}" 
                       min="1" 
                       onchange="updateListItemQuantity(${index}, 0)"
                       style="
                           width: 70px;
                           padding: 0.5rem;
                           text-align: center;
                           border: 1px solid #e5e7eb;
                           border-radius: 6px;
                           font-weight: 600;
                           font-size: 1rem;
                       ">
                <button onclick="updateListItemQuantity(${index}, 1)" style="
                    width: 32px;
                    height: 32px;
                    border: 1px solid var(--primary);
                    background: white;
                    color: var(--primary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">+</button>
            </div>
            <div style="text-align: ${isArabic ? 'left' : 'right'}; min-width: 100px; flex-shrink: 0;">
                <div style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">
                    ${totalPrice} ${item.currency || 'JOD'}
                </div>
                <div style="font-size: 0.75rem; color: var(--gray);">${t.total}</div>
            </div>
            <button onclick="removeFromShoppingList(${index})" style="
                padding: 0.5rem;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1rem;
                flex-shrink: 0;
            " title="${t.remove}">🗑️</button>
        `;
        
        listContainer.appendChild(itemDiv);
    });
    
    container.appendChild(listContainer);
    
    // Footer with totals and actions
    const footer = document.createElement('div');
    footer.className = 'shopping-list-footer';
    footer.style.cssText = `
        margin-top: 1.5rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        border-radius: 12px;
        color: white;
    `;
    
    const initialTotal = shoppingList.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const itemsCount = shoppingList.items.length;
    const itemsText = itemsCount === 1 ? t.item : t.items_count;
    
    footer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${t.total_amount}</div>
                <div style="font-size: 1.8rem; font-weight: 700;" id="listTotalPrice">${initialTotal.toFixed(2)} ${shoppingList.items[0]?.currency || 'JOD'}</div>
            </div>
            <div style="text-align: ${isArabic ? 'left' : 'right'};">
                <div style="font-size: 0.9rem; opacity: 0.9;">${itemsText}</div>
                <div style="font-size: 1.3rem; font-weight: 600;" id="listItemCount">${itemsCount}</div>
            </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
            <button onclick="addListToCart()" style="
                flex: 1;
                padding: 0.75rem 1.5rem;
                background: white;
                color: var(--primary);
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.2s ease-in-out;
            " onmouseover="this.style.background='var(--light-gray)'" onmouseout="this.style.background='white'">
                ✅ ${t.add_to_cart_btn}
            </button>
            <button onclick="clearShoppingList()" style="
                padding: 0.75rem 1.5rem;
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease-in-out;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                🗑️ ${t.clear_list}
            </button>
        </div>
    `;
    
    container.appendChild(footer);
    
    // Store shopping list globally
    window.currentShoppingList = shoppingList;
    
    // Scroll to list
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// Display product suggestions when products are found but no shopping list
function displayProductSuggestions(products, originalRequest) {
    if (!products || products.length === 0) return;
    
    // Get current language
    const currentLang = localStorage.getItem('language') || 'en';
    const isArabic = currentLang === 'ar' || document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
    const t = translations[currentLang] || translations['en'];
    
    const container = document.getElementById('shoppingList');
    if (!container) {
        console.error('Shopping list container not found');
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = 'product-suggestions-header';
    header.style.cssText = 'margin-bottom: 1.5rem;';
    header.innerHTML = `
        <h3 style="color: var(--dark); margin-bottom: 0.5rem;">✨ ${t.suggested_products}</h3>
        <p style="color: var(--gray); font-size: 0.95rem;">${t.select_products}</p>
    `;
    container.appendChild(header);
    
    const productsGrid = document.createElement('div');
    productsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1rem;
    `;
    
    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        productCard.onmouseover = () => {
            productCard.style.transform = 'translateY(-4px)';
            productCard.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        };
        productCard.onmouseout = () => {
            productCard.style.transform = 'translateY(0)';
            productCard.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        };
        
        const productName = isArabic ? escapeHtml(product.name_ar || product.name || 'منتج غير معروف') : escapeHtml(product.name_en || product.name || 'Unknown Product');
        const productCategory = escapeHtml(product.category || (isArabic ? 'عام' : 'General'));
        
        productCard.innerHTML = `
            ${product.image_url ? `<img src="${product.image_url}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 0.75rem;" onerror="this.src='https://via.placeholder.com/220x140?text=No+Image'">` : ''}
            <div style="font-weight: 600; color: var(--dark); margin-bottom: 0.25rem; font-size: 0.95rem; line-height: 1.3;">
                ${productName}
            </div>
            <div style="font-size: 0.8rem; color: var(--gray); margin-bottom: 0.5rem;">
                ${productCategory}
            </div>
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.75rem; font-size: 1.1rem;">
                ${(product.price_jod || product.price || 0).toFixed(2)} ${product.currency || 'JOD'}
            </div>
            <button onclick="addProductToList('${product.id}')" style="
                width: 100%;
                padding: 0.625rem;
                background: var(--primary);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.9rem;
                transition: background 0.2s;
            " onmouseover="this.style.background='var(--primary-dark)'" onmouseout="this.style.background='var(--primary)'">
                ➕ ${t.add_to_list}
            </button>
        `;
        
        productsGrid.appendChild(productCard);
    });
    
    container.appendChild(productsGrid);
    
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// Update shopping list item quantity
function updateListItemQuantity(index, change) {
    if (!window.currentShoppingList || !window.currentShoppingList.items[index]) return;
    
    const input = document.getElementById(`list_quantity_${index}`);
    if (!input) return;
    
    let newQuantity = parseInt(input.value) || 1;
    if (change === 0) {
        // Direct input change
        newQuantity = parseInt(input.value) || 1;
    } else {
        // Button click (+ or -)
        newQuantity = Math.max(1, newQuantity + change);
    }
    
    input.value = newQuantity;
    window.currentShoppingList.items[index].quantity = newQuantity;
    
    // Update total price display for this item
    const itemDiv = input.closest('.shopping-list-item-editable');
    if (itemDiv) {
        const priceDisplay = itemDiv.querySelector('[style*="font-size: 1.2rem"]');
        if (priceDisplay) {
            const unitPrice = window.currentShoppingList.items[index].unit_price;
            const currency = window.currentShoppingList.items[index].currency || 'JOD';
            const total = (unitPrice * newQuantity).toFixed(2);
            priceDisplay.innerHTML = `${total} ${currency}`;
        }
    }
    
    // Update overall total
    updateShoppingListTotal();
}

// Update shopping list total
function updateShoppingListTotal() {
    if (!window.currentShoppingList) return;
    
    const totalPriceEl = document.getElementById('listTotalPrice');
    if (!totalPriceEl) return;
    
    let total = 0;
    let currency = 'JOD';
    
    window.currentShoppingList.items.forEach((item, index) => {
        const input = document.getElementById(`list_quantity_${index}`);
        const quantity = input ? parseInt(input.value) || item.quantity : item.quantity;
        total += item.unit_price * quantity;
        if (!currency) currency = item.currency || 'JOD';
    });
    
    totalPriceEl.textContent = `${total.toFixed(2)} ${currency}`;
}

// Remove item from shopping list
function removeFromShoppingList(index) {
    if (!window.currentShoppingList || !window.currentShoppingList.items[index]) return;
    
    window.currentShoppingList.items.splice(index, 1);
    
    // Re-render the list
    if (window.currentShoppingList.items.length > 0) {
        displayEditableShoppingList(window.currentShoppingList, '');
    } else {
        clearShoppingList();
    }
}

// Add product to shopping list
async function addProductToList(productId) {
    try {
        // Find product in all products
        const product = allProducts.find(p => String(p.id || p._id) === String(productId));
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }
        
        // Initialize shopping list if not exists
        if (!window.currentShoppingList) {
            window.currentShoppingList = {
                items: [],
                total_cost: 0,
                num_people: 1,
                event_type: 'general'
            };
        }
        
        // Check if product already in list
        const existingIndex = window.currentShoppingList.items.findIndex(item => (item.productId || item.id) === productId);
        
        // Get current language
        const currentLang = localStorage.getItem('language') || 'en';
        const t = translations[currentLang] || translations['en'];
        
        if (existingIndex >= 0) {
            // Increase quantity
            window.currentShoppingList.items[existingIndex].quantity += 1;
            showNotification(t.quantity_updated, 'success');
        } else {
            // Add new item
            window.currentShoppingList.items.push({
                productId: product.id || product._id,
                id: product.id || product._id,
                name: product.name || product.name_ar || product.name_en,
                name_ar: product.name_ar || product.name,
                name_en: product.name_en || product.name,
                quantity: 1,
                unit_price: parseFloat(product.price_jod || product.price) || 0,
                currency: product.currency || 'JOD',
                category: product.category || 'general',
                image_url: product.image_url || '',
                product_url: product.product_url || '#',
                calories_per_100g: product.calories_per_100g || null,
                protein_per_100g: product.protein_per_100g || null,
                carbs_per_100g: product.carbs_per_100g || null,
                fats_per_100g: product.fats_per_100g || null,
                is_gluten_free: product.is_gluten_free || false,
                is_vegetarian: product.is_vegetarian || false,
                is_vegan: product.is_vegan || false,
                is_healthy: product.is_healthy || false,
                is_organic: product.is_organic || false
            });
            showNotification(t.product_added_to_list, 'success');
        }
        
        // Re-render list
        displayEditableShoppingList(window.currentShoppingList, '');
    } catch (error) {
        console.error('Error adding product to list:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add all items from shopping list to cart
async function addListToCart() {
    // Get current language
    const currentLang = localStorage.getItem('language') || 'en';
    const t = translations[currentLang] || translations['en'];
    
    if (!window.currentShoppingList || !window.currentShoppingList.items || window.currentShoppingList.items.length === 0) {
        showNotification(t.list_empty, 'warning');
        return;
    }
    
    try {
        let addedCount = 0;
        let failedCount = 0;
        
        for (const item of window.currentShoppingList.items) {
            try {
                const productId = item.productId || item.id;
                const quantity = parseInt(document.getElementById(`list_quantity_${window.currentShoppingList.items.indexOf(item)}`)?.value || item.quantity);
                
                if (!productId) {
                    failedCount++;
                    continue;
                }
                
                const response = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-ID': getSessionId()
                    },
                    body: JSON.stringify({
                        productId: productId,
                        quantity: quantity
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    addedCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                console.error('Error adding item to cart:', error);
                failedCount++;
            }
        }
        
        // Reload cart
        await loadCart();
        
        if (addedCount > 0) {
            showNotification(`✅ ${t.products_added_to_cart.replace('{count}', addedCount)}`, 'success');
            // Optionally clear shopping list after adding to cart
            // clearShoppingList();
        }
        
        if (failedCount > 0) {
            showNotification(`⚠️ ${t.products_failed_to_add.replace('{count}', failedCount)}`, 'warning');
        }
    } catch (error) {
        console.error('Error adding list to cart:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Clear shopping list
function clearShoppingList() {
    // Get current language
    const currentLang = localStorage.getItem('language') || 'en';
    const t = translations[currentLang] || translations['en'];
    
    window.currentShoppingList = null;
    const container = document.getElementById('shoppingList');
    if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
    }
    
    showNotification(t.list_cleared, 'info');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--warning)' : 'var(--primary)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Scroll Functions
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToBottom() {
    window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
    });
}

// Show/hide scroll buttons based on scroll position
function updateScrollButtons() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    const scrollTopBtn = document.getElementById('scrollToTop');
    const scrollBottomBtn = document.getElementById('scrollToBottom');
    
    // Show scroll to top button when scrolled down
    if (scrollTopBtn) {
        if (scrollTop > 300) {
            scrollTopBtn.classList.add('active');
        } else {
            scrollTopBtn.classList.remove('active');
        }
    }
    
    // Show scroll to bottom button when not at bottom
    if (scrollBottomBtn) {
        if (scrollTop + clientHeight < scrollHeight - 100) {
            scrollBottomBtn.classList.add('active');
        } else {
            scrollBottomBtn.classList.remove('active');
        }
    }
}

// Initialize scroll buttons
window.addEventListener('scroll', updateScrollButtons);
window.addEventListener('load', updateScrollButtons);

// ─── Cart Items Event Delegation ───────────────────────────────────────────
// Handles qty +/- and delete buttons rendered by _updateCartDisplay
document.addEventListener('click', function(e) {
    // Qty buttons
    const qtyBtn = e.target.closest('.cart-qty-btn');
    if (qtyBtn) {
        e.stopPropagation();
        const pid = qtyBtn.dataset.pid;
        const action = qtyBtn.dataset.action;
        const currentQty = parseInt(qtyBtn.dataset.qty) || 1;
        const newQty = action === 'plus' ? currentQty + 1 : currentQty - 1;
        updateCartQuantity(pid, newQty);
        return;
    }

    // Delete button
    const delBtn = e.target.closest('.cart-delete-btn');
    if (delBtn) {
        e.stopPropagation();
        const pid = delBtn.dataset.pid;
        removeFromCart(pid);
        return;
    }
});

// Custom AddToCart Helpers for ProductCards Animation
window.cartHelpers = {
    add: async (id) => {
        try {
            await addToCart(id, 1);
            if (typeof window.syncProductCards === 'function') window.syncProductCards();
        } catch (e) {
            console.error('Add to cart failed:', e);
        }
    },
    update: async (id, qty) => {
        // updateCartQuantity handles qty<=0 by removing the item
        await updateCartQuantity(id, qty);
        if (typeof window.syncProductCards === 'function') window.syncProductCards();
    }
};

window.syncProductCards = function() {
    const cartDataStr = localStorage.getItem('lastCartData');
    if (!cartDataStr) return;
    try {
        const cartData = JSON.parse(cartDataStr);
        document.querySelectorAll('.product-card').forEach(card => {
            const pid = card.dataset.productId;
            if (!pid) return;
            const item = cartData.items?.find(i => (i.productId || i.product_id) === pid);
            const qty = item ? item.quantity : 0;
            
            const wrapper = card.querySelector('.cart-btn-wrapper');
            if (wrapper) {
                if (qty > 0) {
                    wrapper.innerHTML = `
                        <div class="h-11 bg-[#DCF3CA] text-brand-dark w-full rounded-t-sm rounded-b-2xl flex items-center justify-between px-3 transition-colors duration-200">
                            <button class="qty-minus w-7 h-7 rounded-full bg-transparent hover:bg-black/5 border border-brand-dark flex items-center justify-center transition"><i class="fas fa-minus text-[10px] pointer-events-none"></i></button>
                            <span class="font-bold text-base select-none">${qty}</span>
                            <button class="qty-plus w-7 h-7 rounded-full bg-transparent hover:bg-black/5 border border-brand-dark flex items-center justify-center transition"><i class="fas fa-plus text-[10px] pointer-events-none"></i></button>
                        </div>
                    `;
                } else {
                    wrapper.innerHTML = `
                        <button class="add-to-cart-action w-full h-11 rounded-t-sm rounded-b-2xl bg-[#F4F7F4] hover:bg-[#E2ECE2] text-brand-dark flex items-center justify-center transition-colors duration-200" data-pid="${pid}">
                            <i class="fas fa-plus text-lg pointer-events-none"></i>
                        </button>
                    `;
                }
            }
        });

        // Quick View Modal Update
        const qvContent = document.getElementById('quickViewContent');
        if (qvContent && qvContent.parentElement && !qvContent.parentElement.classList.contains('hidden')) {
            const pid = qvContent.getAttribute('data-current-product');
            const item = cartData.items?.find(i => (i.productId || i.product_id) === pid);
            const qty = item ? item.quantity : 0;
            const qvWrapper = document.getElementById('qvCartWrapper');
            if (qvWrapper && pid) {
                if (qty > 0) {
                    qvWrapper.innerHTML = `
                        <div class="h-12 bg-[#DCF3CA] text-brand-dark w-full rounded-full flex items-center justify-between px-4 transition-colors duration-200">
                            <button class="qty-minus w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition shadow-sm" onclick="window.cartHelpers.update('${pid}', ${qty - 1})"><i class="fas fa-minus text-sm"></i></button>
                            <span class="font-bold text-lg select-none">${qty}</span>
                            <button class="qty-plus w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition shadow-sm" onclick="window.cartHelpers.update('${pid}', ${qty + 1})"><i class="fas fa-plus text-sm"></i></button>
                        </div>
                    `;
                } else {
                    qvWrapper.innerHTML = `
                        <button class="w-full h-12 rounded-full border-2 border-brand-light bg-brand-light hover:bg-[#8bc025] text-brand-dark font-bold transition flex items-center justify-center gap-2 shadow-sm" onclick="window.cartHelpers.add('${pid}')">
                            <i class="fas fa-shopping-cart"></i> Add to cart
                        </button>
                    `;
                }
            }
        }
    } catch(e) {
        console.error("Cart sync failed:", e);
    }
};

window.openQuickView = function(productId) {
    if (!allProducts || !allProducts.length) return;
    const product = allProducts.find(p => String(p.id) === String(productId) || String(p._id) === String(productId));
    if (!product) return;
    
    const imageEl = document.getElementById('qvImage');
    if (imageEl) imageEl.src = product.image_url || 'https://via.placeholder.com/300?text=No+Image';
    
    // Set mock thumbs based on main image
    document.getElementById('qvThumb1').src = product.image_url || 'https://via.placeholder.com/300?text=No+Image';
    document.getElementById('qvThumb2').src = product.image_url || 'https://via.placeholder.com/300?text=No+Image';
    document.getElementById('qvThumb3').src = product.image_url || 'https://via.placeholder.com/300?text=No+Image';

    const titleEl = document.getElementById('qvTitle');
    if (titleEl) titleEl.textContent = product.name_ar || product.name || 'Unnamed Product';
    
    const priceStr = parseFloat(product.price_jod || product.price || 0).toFixed(2);
    const [priceInt, priceDec] = priceStr.split('.');
    
    const intEl = document.getElementById('qvPriceInt');
    if (intEl) intEl.textContent = priceInt;
    
    const decEl = document.getElementById('qvPriceDec');
    if (decEl) decEl.textContent = priceDec;

    // Use Arabic category (or English) as subtitle
    const categoryEl = document.querySelector('.text-sm.text-gray-400.font-medium.mb-1');
    if (categoryEl) categoryEl.textContent = product.category || 'Local Shop';

    // Populate Nutritional Facts
    const elCalories = document.getElementById('qvCalories');
    const elProtein = document.getElementById('qvProtein');
    const elCarbs = document.getElementById('qvCarbs');
    const elFats = document.getElementById('qvFats');
    const elDesc = document.getElementById('qvDescription');

    if (elCalories) elCalories.textContent = product.calories_per_100g ? product.calories_per_100g + ' kcal' : '-';
    if (elProtein) elProtein.textContent = product.protein_per_100g ? product.protein_per_100g + 'g' : '-';
    if (elCarbs) elCarbs.textContent = product.carbs_per_100g ? product.carbs_per_100g + 'g' : '-';
    if (elFats) elFats.textContent = product.fats_per_100g ? product.fats_per_100g + 'g' : '-';
    
    if (elDesc) {
        elDesc.textContent = product.description || 'A healthy, delicious local product selected by Mooneh.ai specifically for your grocery needs. Features high quality standards.';
    }

    const contentDiv = document.getElementById('quickViewContent');
    if (contentDiv) {
        contentDiv.setAttribute('data-current-product', productId);
    }

    // Show modal first so children aren't hidden
    const modal = document.getElementById('quickViewGlobalModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (contentDiv) {
                contentDiv.classList.remove('scale-95', 'opacity-0');
                contentDiv.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    }

    // Call sync to render correct cart buttons inside the modal NOW that it's visible
    if (typeof window.syncProductCards === 'function') {
        window.syncProductCards();
    }
};

window.closeQuickView = function() {
    const content = document.getElementById('quickViewContent');
    if (content) {
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    setTimeout(() => {
        const modal = document.getElementById('quickViewGlobalModal');
        if (modal) {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }
    }, 300);
};

