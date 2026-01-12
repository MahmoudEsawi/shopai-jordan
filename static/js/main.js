// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

async function createSmartList() {
    const eventType = document.getElementById('eventType').value;
    const numPeople = parseInt(document.getElementById('numPeople').value) || 1;
    
    // Get budget value properly - handle empty string, null, and 0 correctly
    const budgetInput = document.getElementById('budget').value;
    let budget = null;
    if (budgetInput !== null && budgetInput !== undefined && budgetInput.trim() !== '') {
        const parsedBudget = parseFloat(budgetInput);
        if (!isNaN(parsedBudget) && parsedBudget > 0) {
            budget = parsedBudget;
        }
    }
    
    const dietary = document.getElementById('dietary').value;
    const additional = document.getElementById('additionalRequests').value;
    const filterHealthy = document.getElementById('filterHealthy').checked;
    const filterGlutenFree = document.getElementById('filterGlutenFree').checked;
    
    const minProteinInput = document.getElementById('minProtein').value;
    let minProtein = null;
    if (minProteinInput && minProteinInput.trim() !== '') {
        const parsed = parseFloat(minProteinInput);
        if (!isNaN(parsed) && parsed > 0) {
            minProtein = parsed;
        }
    }
    
    const maxCaloriesInput = document.getElementById('maxCalories').value;
    let maxCalories = null;
    if (maxCaloriesInput && maxCaloriesInput.trim() !== '') {
        const parsed = parseFloat(maxCaloriesInput);
        if (!isNaN(parsed) && parsed > 0) {
            maxCalories = parsed;
        }
    }
    
    console.log('📋 Smart Shopping Planner form data:', {
        eventType, numPeople, budget, dietary, filterHealthy, filterGlutenFree,
        minProtein, maxCalories, additional
    });
    
    // Build message for display
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
    
    // Set message in chat input
    document.getElementById('chatInput').value = message;
    
    // Send message with explicit parameters from Smart Shopping Planner
    const params = {
        eventType: eventType,
        numPeople: numPeople,
        budget: budget, // Can be null if not specified, or a number if specified
        dietary: dietary,
        filterHealthy: filterHealthy,
        filterGlutenFree: filterGlutenFree,
        minProtein: minProtein,
        maxCalories: maxCalories,
        additionalRequests: additional,
        fromSmartPlanner: true
    };
    
    console.log('📤 Sending to server with params:', params);
    console.log(`📊 Budget details: value=${budget}, type=${typeof budget}, isNull=${budget === null}, isNumber=${typeof budget === 'number'}`);
    await sendMessageWithParams(message, params);
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
    
    await sendMessageWithParams(message);
}

async function sendMessageWithParams(message, params = null) {
    if (!message || message.trim() === '') return;
    
    const input = document.getElementById('chatInput');
    addMessageToChat('user', message);
    
    // Only clear input if not from Smart Planner (Smart Planner already sets it)
    if (!params || !params.fromSmartPlanner) {
        input.value = '';
    }
    
    const loadingMsg = addMessageToChat('bot', '<div class="spinner"></div> AI is thinking...');
    
    try {
        // Prepare request body with message and optional parameters
        const requestBody = {
            message: message,
            conversation_history: []
        };
        
        // Add parameters from Smart Shopping Planner if provided
        if (params) {
            requestBody.eventType = params.eventType;
            requestBody.numPeople = params.numPeople;
            requestBody.budget = params.budget; // Send budget as-is (number or null)
            requestBody.dietary = params.dietary;
            requestBody.filterHealthy = params.filterHealthy;
            requestBody.filterGlutenFree = params.filterGlutenFree;
            requestBody.minProtein = params.minProtein;
            requestBody.maxCalories = params.maxCalories;
            requestBody.additionalRequests = params.additionalRequests;
            requestBody.fromSmartPlanner = params.fromSmartPlanner;
            
            console.log('📋 Sending Smart Shopping Planner data to server:', {
                ...params,
                budgetDetails: {
                    value: params.budget,
                    type: typeof params.budget,
                    isNull: params.budget === null,
                    isNumber: typeof params.budget === 'number',
                    isValid: params.budget !== null && typeof params.budget === 'number' && params.budget > 0
                }
            });
        }
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': getSessionId()
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        loadingMsg.remove();
        
        // Clear input after sending
        input.value = '';
        
        // Display AI response
        addMessageToChat('bot', data.message || data.response);
        
        // Handle cart updates
        if (data.cart) {
            updateCartDisplay(data.cart);
        }
        
        // Show products in editable shopping list if available
        console.log('📋 Shopping list data:', data.shopping_list);
        console.log('📋 Relevant products:', data.relevantProducts);
        
        if (data.shopping_list && data.shopping_list.items && data.shopping_list.items.length > 0) {
            console.log(`✅ Found shopping list with ${data.shopping_list.items.length} items`);
            // Store shopping list globally
            window.currentShoppingList = data.shopping_list;
            
            // Display shopping list with edit capability
            displayEditableShoppingList(data.shopping_list, message);
        } else if (data.relevantProducts && data.relevantProducts.length > 0) {
            console.log(`✅ Found ${data.relevantProducts.length} relevant products (no shopping list)`);
            // If no shopping list but we have relevant products, show them in a list
            displayProductSuggestions(data.relevantProducts, message);
        } else {
            console.log('⚠️ No shopping list or relevant products found');
            // Hide shopping list if it exists
            const listContainer = document.getElementById('shoppingList');
            if (listContainer) {
                listContainer.innerHTML = '';
                listContainer.style.display = 'none';
            }
        }
    } catch (error) {
        loadingMsg.remove();
        input.value = '';
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

// Display editable shopping list from chat
function displayEditableShoppingList(shoppingList, originalRequest) {
    const container = document.getElementById('shoppingList');
    if (!container) {
        console.error('Shopping list container not found');
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'shopping-list-header';
    const numPeople = shoppingList.num_people || 1;
    const eventType = shoppingList.event_type || 'general';
    const eventNames = {
        'bbq': 'شواء / BBQ',
        'dinner': 'عشاء / Dinner',
        'lunch': 'غداء / Lunch',
        'breakfast': 'فطور / Breakfast',
        'party': 'حفلة / Party',
        'family': 'عائلة / Family',
        'traditional': 'تقليدي / Traditional',
        'general': 'عام / General'
    };
    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h3 style="margin: 0;">🛒 قائمة التسوق المقترحة (Shopping List)</h3>
            <div style="font-size: 0.9rem; color: var(--gray);">
                ${eventNames[eventType] || 'عام'} • ${numPeople} ${numPeople === 1 ? 'شخص' : 'أشخاص'}
            </div>
        </div>
        <p style="color: var(--gray); margin-top: 0.5rem; font-size: 0.9rem;">يمكنك تعديل الكميات قبل إضافة المنتجات للسلة • ${shoppingList.items.length} منتج</p>
    `;
    container.appendChild(header);
    
    // List items
    const listContainer = document.createElement('div');
    listContainer.className = 'shopping-list-items';
    listContainer.style.cssText = 'margin-top: 1.5rem;';
    
    shoppingList.items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shopping-list-item-editable';
        itemDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: white;
            border-radius: 12px;
            margin-bottom: 0.75rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
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
        const imageUrl = item.image_url || 'https://via.placeholder.com/80?text=No+Image';
        const productName = item.name_ar || item.name || item.name_en || 'منتج';
        const categoryName = item.category || 'عام';
        
        itemDiv.innerHTML = `
            <div style="width: 80px; height: 80px; flex-shrink: 0;">
                <img src="${escapeHtml(imageUrl)}" 
                     alt="${escapeHtml(productName)}"
                     onerror="this.src='https://via.placeholder.com/80?text=No+Image'"
                     style="
                         width: 100%;
                         height: 100%;
                         object-fit: cover;
                         border-radius: 8px;
                         border: 1px solid #e5e7eb;
                     ">
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; color: var(--dark); margin-bottom: 0.25rem; font-size: 1rem;">
                    ${escapeHtml(productName)}
                </div>
                <div style="font-size: 0.85rem; color: var(--gray); margin-bottom: 0.25rem;">
                    ${escapeHtml(categoryName)} • ${item.unit_price.toFixed(2)} ${item.currency || 'JOD'} لكل وحدة
                </div>
                ${item.description ? `<div style="font-size: 0.75rem; color: var(--gray); opacity: 0.8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.description.substring(0, 60))}${item.description.length > 60 ? '...' : ''}</div>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                <button onclick="updateListItemQuantity(${index}, -1)" style="
                    width: 36px;
                    height: 36px;
                    border: 1px solid var(--primary);
                    background: white;
                    color: var(--primary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                " onmouseenter="this.style.background='var(--primary)'; this.style.color='white';" 
                   onmouseleave="this.style.background='white'; this.style.color='var(--primary);">-</button>
                <input type="number" 
                       id="list_quantity_${index}" 
                       value="${item.quantity}" 
                       min="1" 
                       onchange="updateListItemQuantity(${index}, 0)"
                       style="
                           width: 70px;
                           padding: 0.5rem;
                           text-align: center;
                           border: 2px solid #e5e7eb;
                           border-radius: 6px;
                           font-weight: 600;
                           font-size: 1rem;
                           transition: border-color 0.2s;
                       " onfocus="this.style.borderColor='var(--primary)';" 
                          onblur="this.style.borderColor='#e5e7eb';">
                <button onclick="updateListItemQuantity(${index}, 1)" style="
                    width: 36px;
                    height: 36px;
                    border: 1px solid var(--primary);
                    background: white;
                    color: var(--primary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                " onmouseenter="this.style.background='var(--primary)'; this.style.color='white';" 
                   onmouseleave="this.style.background='white'; this.style.color='var(--primary);">+</button>
            </div>
            <div style="text-align: right; min-width: 120px; flex-shrink: 0;">
                <div style="font-weight: 700; color: var(--primary); font-size: 1.2rem; margin-bottom: 0.25rem;">
                    ${totalPrice} ${item.currency || 'JOD'}
                </div>
                <div style="font-size: 0.75rem; color: var(--gray);">
                    ${item.quantity} × ${item.unit_price.toFixed(2)}
                </div>
            </div>
            <button onclick="removeFromShoppingList(${index})" style="
                padding: 0.5rem 0.75rem;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1rem;
                transition: background 0.2s;
                flex-shrink: 0;
            " onmouseenter="this.style.background='#dc2626';" 
               onmouseleave="this.style.background='#ef4444';" 
               title="حذف من القائمة">🗑️</button>
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
    
    footer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
                <div style="font-size: 0.9rem; opacity: 0.9;">المجموع الكلي</div>
                <div style="font-size: 1.8rem; font-weight: 700;" id="listTotalPrice">${initialTotal.toFixed(2)} ${shoppingList.items[0]?.currency || 'JOD'}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 0.9rem; opacity: 0.9;">عدد المنتجات</div>
                <div style="font-size: 1.2rem; font-weight: 600;" id="listItemCount">${shoppingList.items.length}</div>
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
            ">
                ✅ إضافة للسلة (Add to Cart)
            </button>
            <button onclick="clearShoppingList()" style="
                padding: 0.75rem 1.5rem;
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            ">
                🗑️ مسح القائمة
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
    
    const container = document.getElementById('shoppingList');
    if (!container) {
        console.error('Shopping list container not found');
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = 'product-suggestions-header';
    header.innerHTML = `
        <h3>✨ المنتجات المقترحة (Suggested Products)</h3>
        <p style="color: var(--gray); margin-top: 0.5rem;">اختر المنتجات التي تريد إضافتها للقائمة</p>
    `;
    container.appendChild(header);
    
    const productsGrid = document.createElement('div');
    productsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
    `;
    
    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.2s;
        `;
        productCard.onmouseover = () => productCard.style.transform = 'translateY(-4px)';
        productCard.onmouseout = () => productCard.style.transform = 'translateY(0)';
        
        productCard.innerHTML = `
            ${product.image_url ? `<img src="${product.image_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 0.75rem;">` : ''}
            <div style="font-weight: 600; color: var(--dark); margin-bottom: 0.25rem; font-size: 0.9rem;">
                ${product.name_ar || product.name || 'منتج'}
            </div>
            <div style="font-size: 0.8rem; color: var(--gray); margin-bottom: 0.5rem;">
                ${product.category}
            </div>
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">
                ${product.price.toFixed(2)} ${product.currency || 'JOD'}
            </div>
            <button onclick="addProductToList('${product.id}')" style="
                width: 100%;
                padding: 0.5rem;
                background: var(--primary);
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                font-size: 0.9rem;
            ">
                ➕ إضافة للقائمة
            </button>
        `;
        
        productsGrid.appendChild(productCard);
    });
    
    container.appendChild(productsGrid);
    
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
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
let currentPage = 1;
const productsPerPage = 12; // Show 12 products per page

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
        const productName = isArabic ? escapeHtml(product.name_ar || product.name || 'منتج غير معروف') : escapeHtml(product.name_en || product.name || 'Unknown Product');
        const category = escapeHtml(product.category || 'General');
        const imageUrl = product.image_url || 'https://via.placeholder.com/300?text=No+Image';
        const productUrl = product.product_url || '#';
        const price = (product.price || 0).toFixed(2);
        const productId = product.id || '';
        
        // Build nutrition info (hidden by default, shown only on eye click)
        const hasNutrition = product.calories_per_100g || product.protein_per_100g || product.carbs_per_100g || product.fats_per_100g;
        
        // Store product data in data attribute for quick access
        const productData = escapeHtml(JSON.stringify(product));
        
        return `
            <div class="product-card" data-product-id="${productId}" data-product='${productData}'>
                <button class="wishlist-btn" onclick="event.stopPropagation(); const card = this.closest('.product-card'); const product = JSON.parse(card.dataset.product); wishlistManager.toggleWishlist(product);" title="${isArabic ? 'إضافة للمفضلة' : 'Add to wishlist'}">
                    <i class="far fa-heart"></i>
                </button>
                <button class="quick-view-btn" onclick="event.stopPropagation(); const card = this.closest('.product-card'); const product = JSON.parse(card.dataset.product); toggleNutritionInfo(card);" title="${isArabic ? 'عرض معلومات التغذية' : 'View nutrition info'}">
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
                    
                    ${product.description ? `<div class="product-card-description">${escapeHtml(isArabic ? (product.description_ar || product.description) : (product.description_en || product.description))}</div>` : ''}
                    
                    ${hasNutrition ? `
                        <div class="product-card-nutrition-full" style="display: none;" id="nutrition-${productId}">
                            <div class="nutrition-header">
                                <i class="fas fa-chart-pie"></i> ${isArabic ? 'القيمة الغذائية لكل 100 جرام' : 'Nutrition per 100g'}
                            </div>
                            <div class="nutrition-grid">
                                ${product.calories_per_100g ? `
                                    <div class="nutrition-item">
                                        <div class="nutrition-label"><i class="fas fa-fire"></i> ${isArabic ? 'السعرات' : 'Calories'}</div>
                                        <div class="nutrition-value">${product.calories_per_100g}</div>
                                    </div>
                                ` : ''}
                                ${product.protein_per_100g ? `
                                    <div class="nutrition-item protein">
                                        <div class="nutrition-label"><i class="fas fa-dumbbell"></i> ${isArabic ? 'البروتين' : 'Protein'}</div>
                                        <div class="nutrition-value">${product.protein_per_100g}g</div>
                                    </div>
                                ` : ''}
                                ${product.carbs_per_100g ? `
                                    <div class="nutrition-item">
                                        <div class="nutrition-label"><i class="fas fa-bread-slice"></i> ${isArabic ? 'الكربوهيدرات' : 'Carbs'}</div>
                                        <div class="nutrition-value">${product.carbs_per_100g}g</div>
                                    </div>
                                ` : ''}
                                ${product.fats_per_100g ? `
                                    <div class="nutrition-item">
                                        <div class="nutrition-label"><i class="fas fa-tint"></i> ${isArabic ? 'الدهون' : 'Fats'}</div>
                                        <div class="nutrition-value">${product.fats_per_100g}g</div>
                                    </div>
                                ` : ''}
                                ${product.fiber_per_100g ? `
                                    <div class="nutrition-item">
                                        <div class="nutrition-label"><i class="fas fa-leaf"></i> ${isArabic ? 'الألياف' : 'Fiber'}</div>
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
                            <i class="fas fa-shopping-cart"></i> ${isArabic ? 'أضف للسلة' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = html;
    
    // Update wishlist UI after rendering products
    if (typeof wishlistManager !== 'undefined') {
        wishlistManager.updateWishlistUI();
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
    // Prevent concurrent updates - queue if already updating
    if (isUpdatingCart) {
        // Queue this update for after current one completes
        setTimeout(() => _updateCartDisplay(cart), 200);
        return;
    }
    
    isUpdatingCart = true;
    
    // Use requestAnimationFrame for smooth DOM updates
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
            if (shouldShow) {
                if (cartFooter.style.display === 'none') {
                    cartFooter.style.display = 'block';
                    // Use requestAnimationFrame for smooth transition
                    requestAnimationFrame(() => {
                        cartFooter.style.opacity = '1';
                    });
                }
            } else {
                cartFooter.style.opacity = '0';
                setTimeout(() => {
                    if (cartFooter && cartFooter.style.opacity === '0') {
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
                    
                    const productId = escapeHtml(item.productId || item.product_id || '');
                    const productName = escapeHtml(item.name || item.product_name || '');
                    const category = escapeHtml(item.category || 'General');
                    const imageUrl = escapeHtml(item.image_url || 'https://via.placeholder.com/100?text=No+Image');
                    const productUrl = item.product_url ? escapeHtml(item.product_url) : '';
                    
                    html += `
                        <div class="cart-item" data-product-id="${productId}">
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
            
            // Replace content smoothly - use single DOM update
            cartItemsEl.innerHTML = html;
            
            // Re-translate if language system is loaded
            if (typeof setLanguage === 'function') {
                setTimeout(() => setLanguage(currentLanguage), 100);
            }
            
        } catch (error) {
            console.error('Error updating cart display:', error);
            isUpdatingCart = false;
        } finally {
            // Reset flag after DOM settles
            setTimeout(() => {
                isUpdatingCart = false;
            }, 100);
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
            showNotification(data.message || t.product_added_to_cart, 'success');
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
            body: JSON.stringify({productId: productId, quantity: quantity})
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
                ${product.price.toFixed(2)} ${product.currency || 'JOD'}
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
        const product = allProducts.find(p => (p.id || p._id) === productId);
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
                unit_price: parseFloat(product.price) || 0,
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

