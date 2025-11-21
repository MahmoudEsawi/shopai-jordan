window.onload = () => loadStats();

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
    
    let message = `I want ${eventType === 'bbq' ? 'a BBQ' : eventType === 'traditional' ? 'a traditional Jordanian meal' : 'a ' + eventType} for ${numPeople} people`;
    
    if (budget) {
        message += `, budget ${budget} JOD`;
    }
    
    if (dietary !== 'all') {
        message += `, ${dietary}`;
    }
    
    if (additional) {
        message += `. ${additional}`;
    }
    
    document.getElementById('chatInput').value = message;
    sendMessage();
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: message})
        });
        
        const data = await response.json();
        loadingMsg.remove();
        
        addMessageToChat('bot', data.message || data.response);
        
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
            
            if (item.product_url) {
                html += `<a href="${item.product_url}" target="_blank" class="item-link">`;
                html += `<i class="fas fa-external-link-alt"></i> View on Talabat Jordan</a>`;
            }
            
            html += `</div>`;
            html += `<div class="item-actions">`;
            html += `<div class="item-price">${item.total_price.toFixed(2)} <span style="font-size: 1rem; color: var(--gray);">JOD</span></div>`;
            
            if (item.product_url) {
                html += `<button class="btn btn-success btn-sm" onclick="window.open('${item.product_url}', '_blank')">`;
                html += `<i class="fas fa-cart-plus"></i> Add to Cart</button>`;
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
    alert(`Opening ${Math.min(links.length, 5)} products on Talabat Jordan!`);
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
        alert('No shopping list to export');
        return;
    }
    
    const format = confirm('Export as JSON? (Cancel for Text format)') ? 'json' : 'text';
    
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
        
        alert(`Shopping list exported as ${format.toUpperCase()}!`);
    } catch (error) {
        alert('Error exporting list: ' + error.message);
    }
}

// Copy to Clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied to clipboard!');
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

