// Cart Toggle Functions
function toggleCart() {
    const sideCart = document.getElementById('sideCart');
    const overlay = document.getElementById('cartOverlay');
    
    if (sideCart && overlay) {
        sideCart.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Prevent body scroll when cart is open
        if (sideCart.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
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

async function createSmartList() {
    const eventType = document.getElementById('eventType').value;
    const numPeople = document.getElementById('numPeople').value;
    const budget = document.getElementById('budget').value;
    const dietary = document.getElementById('dietary').value;
    const additional = document.getElementById('additionalRequests').value;
    const filterHealthy = document.getElementById('filterHealthy').checked;
    const filterGlutenFree = document.getElementById('filterGlutenFree').checked;
    const minProtein = document.getElementById('minProtein').value;
    const maxCalories = document.getElementById('maxCalories').value;
    
    let message = `I want ${eventType === 'bbq' ? 'a BBQ' : eventType === 'traditional' ? 'a traditional Jordanian meal' : 'a ' + eventType} for ${numPeople} people`;
    
    if (budget) {
        message += `, budget ${budget} JOD`;
    }
    
    if (dietary !== 'all') {
        message += `, ${dietary}`;
    }
    
    if (filterHealthy) {
        message += `, healthy food only`;
    }
    
    if (filterGlutenFree) {
        message += `, gluten-free only`;
    }
    
    if (minProtein) {
        message += `, minimum ${minProtein}g protein per 100g`;
    }
    
    if (maxCalories) {
        message += `, maximum ${maxCalories} calories per 100g`;
    }
    
    if (additional) {
        message += `. ${additional}`;
    }
    
    document.getElementById('chatInput').value = message;
    sendMessage();
}

// Generate or retrieve session ID
function getSessionId() {
    let sessionId = localStorage.getItem('shopai_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('shopai_session_id', sessionId);
    }
    return sessionId;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessageToChat('user', message);
    input.value = '';
    
    const loadingMsg = addMessageToChat('bot', '<div class="spinner"></div> AI is thinking...');
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            },
            body: JSON.stringify({message: message})
        });
        
        const data = await response.json();
        loadingMsg.remove();
        
        addMessageToChat('bot', data.message || data.response);
        
        // Handle cart updates
        if (data.cart) {
            updateCartDisplay(data.cart);
        }
        
        // Only show shopping list if it's actually a shopping request
        if (data.is_shopping && data.shopping_list && data.shopping_list.items && data.shopping_list.items.length > 0) {
            displayShoppingList(data.shopping_list, message, data.recipes, data.share_url);
        } else {
            // Hide shopping list if it exists
            const listContainer = document.getElementById('shoppingList');
            if (listContainer) {
                listContainer.innerHTML = '';
                listContainer.style.display = 'none';
            }
        }
    } catch (error) {
        loadingMsg.remove();
        addMessageToChat('bot', 'Error: ' + error.message);
    }
}

function addMessageToChat(type, message) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    const time = new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
    messageDiv.innerHTML = message + `<div class="message-time">${time}</div>`;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}

function displayShoppingList(shoppingList, originalRequest, recipes = [], shareUrl = null) {
    const container = document.getElementById('shoppingList');
    
    const byCategory = {};
    shoppingList.items.forEach(item => {
        if (!byCategory[item.category]) byCategory[item.category] = [];
        byCategory[item.category].push(item);
    });
    
    // Extract budget from request
    const budgetMatch = originalRequest.match(/budget[:\s]+(\d+)/i);
    const requestedBudget = budgetMatch ? parseFloat(budgetMatch[1]) : null;
    
    let html = '<div class="shopping-list">';
    html += '<div class="list-header">';
    html += '<div>';
    html += '<div class="list-title"><i class="fas fa-shopping-cart"></i> Shopping List</div>';
    html += `<div style="color: var(--gray); margin-top: 0.5rem; font-size: 1rem;">For ${shoppingList.num_people} people • ${shoppingList.items.length} items</div>`;
    html += '</div>';
    html += '<div style="display: flex; gap: 1rem; flex-wrap: wrap;">';
    html += '<button class="btn btn-success btn-sm" onclick="openAllOnTalabat()"><i class="fas fa-shopping-bag"></i> Order on Talabat</button>';
    html += '<button class="btn btn-primary btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button>';
    if (shareUrl) {
        html += `<button class="btn btn-primary btn-sm" onclick="shareList('${shareUrl}')"><i class="fas fa-share-alt"></i> Share</button>`;
    }
    html += '<button class="btn btn-primary btn-sm" onclick="exportList()"><i class="fas fa-download"></i> Export</button>';
    html += '</div>';
    html += '</div>';
    
    for (const [category, items] of Object.entries(byCategory)) {
        html += `<div class="category-section">`;
        html += `<div class="category-header">`;
        html += `<span style="font-weight: 700; font-size: 1.1rem;">${category.toUpperCase()}</span>`;
        html += `<span style="margin-left: auto; background: white; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; color: var(--primary); font-weight: 600;">${items.length} items</span>`;
        html += `</div>`;
        
        items.forEach(item => {
            html += `<div class="shopping-item">`;
            
            // Product Image
            if (item.image_url) {
                html += `<img src="${item.image_url}" class="item-image" alt="${item.product_name}" onerror="this.src='https://via.placeholder.com/100?text=No+Image'">`;
            }
            
            html += `<div class="item-main">`;
            html += `<div class="item-name">${item.product_name}</div>`;
            html += `<div class="item-details">`;
            html += `<span><i class="fas fa-box"></i> Qty: ${item.quantity}</span>`;
            html += `<span><i class="fas fa-coins"></i> ${item.unit_price.toFixed(2)} JOD each</span>`;
            html += `</div>`;
            
            // Nutritional Information
            if (item.calories_per_100g || item.protein_per_100g) {
                html += `<div class="nutrition-info">`;
                html += `<div class="nutrition-info-row">`;
                if (item.calories_per_100g) {
                    html += `<span class="nutrition-info-item calories"><i class="fas fa-fire"></i> ${item.calories_per_100g} cal/100g</span>`;
                }
                if (item.protein_per_100g) {
                    html += `<span class="nutrition-info-item protein"><i class="fas fa-dumbbell"></i> ${item.protein_per_100g}g protein/100g</span>`;
                }
                if (item.carbs_per_100g) {
                    html += `<span class="nutrition-info-item carbs"><i class="fas fa-bread-slice"></i> ${item.carbs_per_100g}g carbs/100g</span>`;
                }
                if (item.fats_per_100g) {
                    html += `<span class="nutrition-info-item fats"><i class="fas fa-tint"></i> ${item.fats_per_100g}g fats/100g</span>`;
                }
                html += `</div>`;
                
                // Dietary Facts
                const facts = [];
                if (item.is_gluten_free) facts.push('<span class="dietary-badge">🌾 Gluten-Free</span>');
                if (item.is_vegetarian) facts.push('<span class="dietary-badge">🥬 Vegetarian</span>');
                if (item.is_vegan) facts.push('<span class="dietary-badge">🌱 Vegan</span>');
                if (item.is_healthy) facts.push('<span class="dietary-badge healthy">💚 Healthy</span>');
                if (item.is_organic) facts.push('<span class="dietary-badge organic">🌿 Organic</span>');
                if (facts.length > 0) {
                    html += `<div class="dietary-facts">${facts.join('')}</div>`;
                }
                html += `</div>`;
            }
            
            if (item.product_url) {
                html += `<a href="${item.product_url}" target="_blank" class="item-link" style="margin-top: 0.5rem; display: inline-block;">`;
                html += `<i class="fas fa-external-link-alt"></i> View on Talabat Jordan</a>`;
            }
            
            html += `</div>`;
            html += `<div class="item-actions">`;
            html += `<div class="item-price">${item.total_price.toFixed(2)} <span style="font-size: 1rem; color: var(--gray);">JOD</span></div>`;
            
            // Add to cart button - need to find product ID from name
            html += `<button class="btn btn-success btn-sm" onclick="addProductToCartByName('${item.product_name}')">`;
            html += `<i class="fas fa-cart-plus"></i> Add to Cart</button>`;
            
            if (item.product_url) {
                html += `<a href="${item.product_url}" target="_blank" class="item-link" style="margin-left: 0.5rem; display: inline-block;">`;
                html += `<i class="fas fa-external-link-alt"></i> View on Talabat</a>`;
            }
            
            html += `</div></div>`;
        });
        
        html += `</div>`;
    }
    
    // Total Section with Budget Indicator
    html += `<div class="total-section">`;
    html += `<div>`;
    html += `<div style="font-size: 1.1rem; opacity: 0.95; font-weight: 600;">Total Cost</div>`;
    html += `<div style="font-size: 0.9rem; opacity: 0.85; margin-top: 0.25rem;">${shoppingList.items.length} items • Ready to order on Talabat</div>`;
    
    if (requestedBudget) {
        const withinBudget = shoppingList.total_cost <= requestedBudget;
        const budgetDiff = requestedBudget - shoppingList.total_cost;
        html += `<div class="budget-indicator">`;
        if (withinBudget) {
            html += `<i class="fas fa-check-circle"></i> Within budget • ${budgetDiff.toFixed(2)} JOD remaining`;
        } else {
            html += `<i class="fas fa-exclamation-circle"></i> Over budget by ${Math.abs(budgetDiff).toFixed(2)} JOD`;
        }
        html += `</div>`;
    }
    
    html += `</div>`;
    html += `<div class="total-amount">${shoppingList.total_cost.toFixed(2)} <span style="font-size: 1.8rem; font-weight: 600;">JOD</span></div>`;
    html += `</div>`;
    html += '</div>';
    
    // Add Recipe Suggestions Section
    if (recipes && recipes.length > 0) {
        html += '<div class="recipes-section" style="margin-top: 3rem; padding: 2rem; background: white; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.12);">';
        html += '<div style="font-size: 1.8rem; font-weight: 800; margin-bottom: 1.5rem; color: var(--dark);"><i class="fas fa-utensils"></i> Recipe Suggestions</div>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">';
        
        recipes.forEach(recipe => {
            html += '<div class="recipe-card" style="padding: 1.5rem; background: var(--light); border-radius: 15px; border: 2px solid #e2e8f0;">';
            html += `<div style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">${recipe.name}</div>`;
            html += `<div style="color: var(--gray); margin-bottom: 1rem; font-size: 0.95rem;">${recipe.description}</div>`;
            html += '<div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">';
            html += `<span style="background: white; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem;"><i class="fas fa-clock"></i> ${recipe.prep_time}</span>`;
            html += `<span style="background: white; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem;"><i class="fas fa-fire"></i> ${recipe.cook_time}</span>`;
            html += `<span style="background: white; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem;"><i class="fas fa-users"></i> ${recipe.servings} servings</span>`;
            html += `<span style="background: white; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem;"><i class="fas fa-signal"></i> ${recipe.difficulty}</span>`;
            html += '</div>';
            html += '<div style="margin-top: 1rem;">';
            html += '<div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--dark);">Ingredients:</div>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
            recipe.ingredients.slice(0, 5).forEach(ing => {
                html += `<span style="background: white; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.85rem; color: var(--gray);">${ing}</span>`;
            });
            if (recipe.ingredients.length > 5) {
                html += `<span style="background: white; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.85rem; color: var(--gray);">+${recipe.ingredients.length - 5} more</span>`;
            }
            html += '</div>';
            html += '</div>';
            if (recipe.match_percentage) {
                html += `<div style="margin-top: 1rem; padding: 0.5rem; background: rgba(37, 99, 235, 0.1); border-radius: 8px; font-size: 0.85rem; color: var(--primary);"><i class="fas fa-check-circle"></i> ${recipe.match_percentage}% match with your shopping list</div>`;
            }
            html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
    container.style.display = 'block';
    
    // Store shopping list for sharing/export
    window.currentShoppingList = shoppingList;
    window.currentShareUrl = shareUrl;
    
    // Auto-scroll to shopping list smoothly
    setTimeout(() => {
        container.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 300);
}

function openAllOnTalabat() {
    const links = Array.from(document.querySelectorAll('.item-link'));
    links.slice(0, 5).forEach((link, idx) => {
        setTimeout(() => window.open(link.href, '_blank'), idx * 600);
    });
    Toast.info(`Opening ${Math.min(links.length, 5)} products on Talabat Jordan!`);
}

document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

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

// Product Browse Functions
let allProducts = [];
let filteredProducts = [];

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
        
        allProducts = data.products || [];
        filteredProducts = [...allProducts];
        
        console.log(`Loaded ${allProducts.length} products`);
        
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
    const minProteinInput = document.getElementById('browseMinProtein');
    const maxCaloriesInput = document.getElementById('browseMaxCalories');
    
    const elements = [searchInput, categoryFilter, sortFilter, healthyCheck, glutenFreeCheck, vegetarianCheck, veganCheck, organicCheck, halalCheck, minProteinInput, maxCaloriesInput];
    
    elements.forEach(el => {
        if (el) {
            el.addEventListener('change', filterProducts);
            if (el === searchInput || el === minProteinInput || el === maxCaloriesInput) {
                el.addEventListener('input', filterProducts);
            }
        }
    });
    
    console.log('Product filters setup complete');
}

function filterProducts() {
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const categorySelect = document.getElementById('categoryFilter');
    const category = categorySelect?.value || '';
    const sortBy = document.getElementById('sortFilter')?.value || 'name';
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
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && 
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
                return (a.price || 0) - (b.price || 0);
            case 'price_high':
                return (b.price || 0) - (a.price || 0);
            case 'calories_low':
                return (a.calories_per_100g || 0) - (b.calories_per_100g || 0);
            case 'protein_high':
                return (b.protein_per_100g || 0) - (a.protein_per_100g || 0);
            default:
                return (a.name || '').localeCompare(b.name || '');
        }
    });
    
    // Update results count
    updateFilterResults(filteredProducts.length);
    
    displayProducts();
}

function updateFilterResults(count) {
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

function displayProducts() {
    const grid = document.getElementById('productsGrid');
    
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray);"><i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i><div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">No products found</div><div>Try adjusting your filters or search terms.</div></div>';
        return;
    }
    
    grid.innerHTML = filteredProducts.map(product => {
        // Build tags/labels array
        const tags = [];
        if (product.is_gluten_free) tags.push({text: '🌾 Gluten-Free', class: 'tag-gluten-free'});
        if (product.is_vegetarian) tags.push({text: '🥬 Vegetarian', class: 'tag-vegetarian'});
        if (product.is_vegan) tags.push({text: '🌱 Vegan', class: 'tag-vegan'});
        if (product.is_healthy) tags.push({text: '💚 Healthy', class: 'tag-healthy'});
        if (product.is_organic) tags.push({text: '🌿 Organic', class: 'tag-organic'});
        if (product.is_halal) tags.push({text: '🕌 Halal', class: 'tag-halal'});
        
        // Category tag
        if (product.category) {
            tags.push({text: product.category.charAt(0).toUpperCase() + product.category.slice(1), class: 'tag-category'});
        }
        
        // Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        const productName = escapeHtml(product.name || 'Unknown Product');
        const category = escapeHtml(product.category || 'General');
        const imageUrl = product.image_url || 'https://via.placeholder.com/300?text=No+Image';
        const productUrl = product.product_url || '#';
        const price = (product.price || 0).toFixed(2);
        const productId = product.id || '';
        
        // Build nutrition info
        const hasNutrition = product.calories_per_100g || product.protein_per_100g || product.carbs_per_100g || product.fats_per_100g;
        
        // Store product data in data attribute for quick access
        const productData = escapeHtml(JSON.stringify(product));
        
        return `
            <div class="product-card" data-product-id="${productId}" data-product='${productData}'>
                <button class="wishlist-btn" onclick="event.stopPropagation(); const card = this.closest('.product-card'); const product = JSON.parse(card.dataset.product); wishlistManager.toggleWishlist(product);" title="Add to wishlist">
                    <i class="far fa-heart"></i>
                </button>
                <button class="quick-view-btn" onclick="event.stopPropagation(); const card = this.closest('.product-card'); const product = JSON.parse(card.dataset.product); productModal.show(product);" title="Quick view">
                    <i class="fas fa-eye"></i>
                </button>
                <div class="product-card-image" onclick="window.open('${productUrl}', '_blank')">
                    <img src="${imageUrl}" 
                         alt="${productName}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                    ${tags.length > 0 ? `<div class="product-card-badges">${tags.map(t => `<span class="product-card-badge ${t.class}">${t.text}</span>`).join('')}</div>` : ''}
                </div>
                <div class="product-card-content">
                    <div class="product-card-name">${productName}</div>
                    
                    ${product.description ? `<div class="product-card-description">${escapeHtml(product.description)}</div>` : ''}
                    
                    ${hasNutrition ? `
                        <div class="product-card-nutrition-full">
                            <div class="nutrition-header">
                                <i class="fas fa-chart-pie"></i> Nutrition per 100g
                            </div>
                            <div class="nutrition-grid">
                                ${product.calories_per_100g ? `
                                    <div class="nutrition-item">
                                        <div class="nutrition-label"><i class="fas fa-fire"></i> Calories</div>
                                        <div class="nutrition-value">${product.calories_per_100g}</div>
                                    </div>
                                ` : ''}
                                ${product.protein_per_100g ? `
                                    <div class="nutrition-item protein">
                                        <div class="nutrition-label"><i class="fas fa-dumbbell"></i> Protein</div>
                                        <div class="nutrition-value">${product.protein_per_100g}g</div>
                                    </div>
                                ` : ''}
                                ${product.carbs_per_100g ? `
                                    <div class="nutrition-item">
                                        <div class="nutrition-label"><i class="fas fa-bread-slice"></i> Carbs</div>
                                        <div class="nutrition-value">${product.carbs_per_100g}g</div>
                                    </div>
                                ` : ''}
                                ${product.fats_per_100g ? `
                                    <div class="nutrition-item">
                                        <div class="nutrition-label"><i class="fas fa-tint"></i> Fats</div>
                                        <div class="nutrition-value">${product.fats_per_100g}g</div>
                                    </div>
                                ` : ''}
                                ${product.fiber_per_100g ? `
                                    <div class="nutrition-item">
                                        <div class="nutrition-label"><i class="fas fa-leaf"></i> Fiber</div>
                                        <div class="nutrition-value">${product.fiber_per_100g}g</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="product-card-tags">
                        ${tags.filter(t => !t.class.includes('category')).map(t => `<span class="product-tag ${t.class}">${t.text}</span>`).join('')}
                    </div>
                    
                    <div class="product-card-footer">
                        <div>
                            <span class="product-card-price">${price}</span>
                            <span class="product-card-price-currency"> JOD</span>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCart('${product.id}', 1)">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    gridEl.innerHTML = html;
    
    // Update wishlist UI after rendering products
    if (typeof wishlistManager !== 'undefined') {
        wishlistManager.updateWishlistUI();
    }
    
    console.log(`Displayed ${filteredProducts.length} products`);
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
    // Debounce rapid updates
    if (cartUpdateTimeout) {
        clearTimeout(cartUpdateTimeout);
    }
    
    cartUpdateTimeout = setTimeout(() => {
        _updateCartDisplay(cart);
    }, 50); // Small delay to batch rapid updates
}

function _updateCartDisplay(cart) {
    if (isUpdatingCart) return; // Prevent concurrent updates
    isUpdatingCart = true;
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
        try {
            const cartItemsEl = document.getElementById('cartItems');
            const cartItemCountEl = document.getElementById('cartItemCount');
            const cartTotalEl = document.getElementById('cartTotal');
            const navCartCount = document.getElementById('navCartCount');
            const cartFooter = document.getElementById('cartFooter');
            const cartFooterItemCount = document.getElementById('cartFooterItemCount');
            const cartFooterTotal = document.getElementById('cartFooterTotal');
            
            // Store cart data for language switching
            localStorage.setItem('lastCartData', JSON.stringify(cart));
            
            if (!cartItemsEl) {
                isUpdatingCart = false;
                return;
            }
            
            // Update summary (fast, no DOM manipulation)
            const itemCount = cart.total_items || 0;
            if (cartItemCountEl) {
                cartItemCountEl.textContent = itemCount;
            }
            if (cartTotalEl) {
                cartTotalEl.textContent = (cart.total_cost || 0).toFixed(2);
            }
            if (navCartCount) {
                navCartCount.textContent = itemCount;
                navCartCount.style.display = itemCount > 0 ? 'inline-block' : 'none';
            }
            
            // Update footer totals
            if (cartFooterItemCount) {
                cartFooterItemCount.innerHTML = `<strong>${itemCount}</strong>`;
            }
            if (cartFooterTotal) {
                cartFooterTotal.innerHTML = `<strong>${(cart.total_cost || 0).toFixed(2)} JOD</strong>`;
            }
            
            // Show/hide footer with smooth transition
            if (cartFooter) {
                const shouldShow = cart.items && cart.items.length > 0;
                if (shouldShow && cartFooter.style.display === 'none') {
                    cartFooter.style.display = 'block';
                    // Trigger reflow for animation
                    cartFooter.offsetHeight;
                    cartFooter.style.opacity = '1';
                } else if (!shouldShow) {
                    cartFooter.style.opacity = '0';
                    setTimeout(() => {
                        if (cartFooter.style.opacity === '0') {
                            cartFooter.style.display = 'none';
                        }
                    }, 200);
                }
            }
            
            // Display cart items - build HTML string for better performance
            let html = '';
            
            // Escape HTML to prevent XSS
            const escapeHtml = (text) => {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };
            
            if (!cart.items || cart.items.length === 0) {
                const emptyText = typeof t === 'function' ? t('cart_empty') : 'Your cart is empty';
                const emptyHint = typeof t === 'function' ? t('cart_empty_hint') : 'Add items from chat or browse products';
                html = `
                    <div class="cart-empty">
                        <i class="fas fa-shopping-cart"></i>
                        <div data-translate="cart_empty">${emptyText}</div>
                        <div class="cart-empty-hint" data-translate="cart_empty_hint">${emptyHint}</div>
                    </div>
                `;
            } else {
                cart.items.forEach((item, index) => {
                    const facts = [];
                    if (item.is_gluten_free) facts.push('<span class="dietary-badge">🌾 GF</span>');
                    if (item.is_vegetarian) facts.push('<span class="dietary-badge">🥬 V</span>');
                    if (item.is_vegan) facts.push('<span class="dietary-badge">🌱 VG</span>');
                    if (item.is_healthy) facts.push('<span class="dietary-badge healthy">💚</span>');
                    
                    const productId = escapeHtml(item.product_id);
                    const productName = escapeHtml(item.product_name);
                    const category = escapeHtml(item.category || 'General');
                    const imageUrl = escapeHtml(item.image_url || 'https://via.placeholder.com/100?text=No+Image');
                    const productUrl = item.product_url ? escapeHtml(item.product_url) : '';
                    
                    html += `
                        <div class="cart-item" data-product-id="${productId}" style="opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease ${index * 0.05}s, transform 0.3s ease ${index * 0.05}s;">
                            <div class="cart-item-image">
                                <img src="${imageUrl}" 
                                     alt="${productName}"
                                     loading="lazy"
                                     onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
                            </div>
                            <div class="cart-item-details">
                                <div class="cart-item-name">${productName}</div>
                                <div class="cart-item-category">${category}</div>
                                ${facts.length > 0 ? `<div class="cart-item-tags">${facts.join('')}</div>` : ''}
                                ${item.calories_per_100g || item.protein_per_100g ? `
                                    <div class="cart-item-nutrition" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--gray);">
                                        ${item.calories_per_100g ? `<span><i class="fas fa-fire"></i> ${item.calories_per_100g} cal/100g</span>` : ''}
                                        ${item.protein_per_100g ? `<span style="margin-left: 1rem;"><i class="fas fa-dumbbell"></i> ${item.protein_per_100g}g prot/100g</span>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="cart-item-quantity">
                                <button class="quantity-btn" onclick="updateCartQuantity('${productId}', ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                                       onchange="updateCartQuantity('${productId}', this.value)">
                                <button class="quantity-btn" onclick="updateCartQuantity('${productId}', ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="cart-item-price">
                                <div class="cart-item-total">${item.total_price.toFixed(2)} JOD</div>
                                <div class="cart-item-unit">${item.unit_price.toFixed(2)} JOD each</div>
                            </div>
                            <div class="cart-item-actions">
                                <button class="btn-remove" onclick="removeFromCart('${productId}')" title="Remove from cart">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ${productUrl ? `
                                    <button class="btn-view" onclick="window.open('${productUrl}', '_blank')" title="View on Talabat">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
            }
            
            // Replace content smoothly
            cartItemsEl.innerHTML = html;
            
            // Trigger animations after a brief delay
            setTimeout(() => {
                const items = cartItemsEl.querySelectorAll('.cart-item');
                items.forEach((item, index) => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                });
            }, 10);
            
            // Re-translate if language system is loaded
            if (typeof setLanguage === 'function') {
                setTimeout(() => setLanguage(currentLanguage), 100);
            }
            
        } catch (error) {
            console.error('Error updating cart display:', error);
        } finally {
            isUpdatingCart = false;
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
            body: JSON.stringify({product_id: productId, quantity: quantity})
        });
        
        const data = await response.json();
        if (data.success) {
            updateCartDisplay(data.cart);
            showNotification(data.message || 'Item added to cart', 'success');
        } else {
            showNotification(data.message || 'Error adding to cart', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function removeFromCart(productId) {
    const confirmMsg = typeof t === 'function' ? t('remove_from_cart') : 'Remove this item from cart?';
    if (!confirm(confirmMsg)) return;
    
    try {
        const response = await fetch('/api/cart/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            },
            body: JSON.stringify({product_id: productId})
        });
        
        const data = await response.json();
        if (data.success) {
            updateCartDisplay(data.cart);
            showNotification(data.message || 'Item removed from cart', 'success');
        } else {
            showNotification(data.message || 'Error removing item', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function updateCartQuantity(productId, quantity) {
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
    }
    
    try {
        const response = await fetch('/api/cart/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            },
            body: JSON.stringify({product_id: productId, quantity: quantity})
        });
        
        const data = await response.json();
        if (data.success) {
            updateCartDisplay(data.cart);
        } else {
            showNotification(data.message || 'Error updating quantity', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function clearCart() {
    const confirmMsg = typeof t === 'function' ? t('clear_entire_cart') : 'Clear entire cart? This cannot be undone.';
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
            updateCartDisplay(data.cart);
            showNotification(data.message || 'Cart cleared', 'success');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

function checkoutCart() {
    const cartItemsEl = document.getElementById('cartItems');
    if (!cartItemsEl || cartItemsEl.querySelector('.cart-items-list')) {
        Toast.warning('Cart is empty!');
        return;
    }
    
    // Get all product URLs and open them
    const items = cartItemsEl.querySelectorAll('.cart-item');
    const urls = [];
    items.forEach(item => {
        const viewBtn = item.querySelector('.btn-view');
        if (viewBtn && viewBtn.onclick) {
            // Extract URL from onclick
            const onclick = viewBtn.getAttribute('onclick');
            const urlMatch = onclick.match(/window\.open\('([^']+)'/);
            if (urlMatch) {
                urls.push(urlMatch[1]);
            }
        }
    });
    
    if (urls.length > 0) {
        Toast.info(`Opening ${urls.length} products on Talabat Jordan...`);
        urls.slice(0, 5).forEach((url, idx) => {
            setTimeout(() => window.open(url, '_blank'), idx * 500);
        });
    } else {
        Toast.warning('Please add items with product links to checkout');
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

