// ============================================
// Mooneh.ai Admin Dashboard - Client Logic
// ============================================

const API = '/api/admin';
let allProducts = [];
let allUsers = [];
let allOrders = [];
let currentPage = 'dashboard';
let productPage = 1;
const PRODUCTS_PER_PAGE = 15;
let pendingConfirmCallback = null;
let activityLog = [];

// ===== AUTH =====
function getToken() {
    return localStorage.getItem('admin_token');
}

function setToken(token) {
    localStorage.setItem('admin_token', token);
}

function clearToken() {
    localStorage.removeItem('admin_token');
}

function authHeaders() {
    return { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
    };
}

async function checkAuth() {
    const token = getToken();
    if (!token) {
        showLogin();
        return false;
    }
    try {
        const res = await fetch(`${API}/verify`, { headers: authHeaders() });
        if (res.ok) {
            const data = await res.json();
            showAdmin(data.user);
            return true;
        } else {
            clearToken();
            showLogin();
            return false;
        }
    } catch (e) {
        clearToken();
        showLogin();
        return false;
    }
}

function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminLayout').style.display = 'none';
}

function showAdmin(user) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'block';
    if (user) {
        document.getElementById('sidebarUserName').textContent = user.name || user.username;
        document.getElementById('sidebarAvatar').textContent = (user.name || user.username || 'A')[0].toUpperCase();
    }
    refreshAllData();
    initSocket();
}

let socket;
function initSocket() {
    if (socket) return;
    socket = io();
    socket.on('new_order', (order) => {
        // Play sound notification
        const audio = new Audio('/static/audio/notification.mp3'); 
        audio.play().catch(e => console.log('Audio play prevented by browser'));
        
        showToast('🚨 New Order Received!', 'info');
        refreshAllData(); // Quick reload of orders and stats
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const error = document.getElementById('loginError');

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;
    error.classList.remove('show');

    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            setToken(data.token);
            showAdmin(data.user);
            showToast('Welcome back! 👋', 'success');
        } else {
            document.getElementById('loginErrorText').textContent = data.error || 'Invalid credentials';
            error.classList.add('show');
        }
    } catch (err) {
        document.getElementById('loginErrorText').textContent = 'Connection error. Please try again.';
        error.classList.add('show');
    }

    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    btn.disabled = false;
}

function handleLogout() {
    clearToken();
    showLogin();
    showToast('Logged out successfully', 'info');
}

// ===== PAGE NAVIGATION =====
function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.sidebar-link[data-page="${page}"]`).classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        categories: 'Categories',
        users: 'Users',
        orders: 'Orders',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    // Close mobile sidebar
    document.getElementById('adminSidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function toggleSidebar() {
    document.getElementById('adminSidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// ===== DATA LOADING =====
async function refreshAllData() {
    await Promise.all([loadProducts(), loadUsers(), loadOrders(), loadDashboardStats()]);
}

async function loadProducts() {
    try {
        const res = await fetch(`${API}/products`, { headers: authHeaders() });
        if (res.status === 401) { handleLogout(); return; }
        const data = await res.json();
        allProducts = data.products || data || [];
        document.getElementById('productCountBadge').textContent = allProducts.length;
        renderProducts();
        updateCategoryFilter();
        renderCategoriesPage();
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

async function loadUsers() {
    try {
        const res = await fetch(`${API}/users`, { headers: authHeaders() });
        if (res.status === 401) { handleLogout(); return; }
        const data = await res.json();
        allUsers = data.users || data || [];
        document.getElementById('userCountBadge').textContent = allUsers.length;
        renderUsers();
        updateUserStats();
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

async function loadDashboardStats() {
    try {
        const categories = [...new Set(allProducts.map(p => p.category))];
        document.getElementById('statProducts').textContent = allProducts.length;
        document.getElementById('statCategories').textContent = categories.length;
        document.getElementById('statUsers').textContent = allUsers.length;
        document.getElementById('statOrders').textContent = allOrders.length;
        document.getElementById('dbProductCount').textContent = allProducts.length + ' documents';
        document.getElementById('dbUserCount').textContent = allUsers.length + ' documents';
        document.getElementById('dbConnection').textContent = 'mongodb://127.0.0.1:27017';

        // Category breakdown
        const catCounts = {};
        allProducts.forEach(p => {
            const cat = p.category || 'Other';
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6','#6366f1','#a855f7','#84cc16','#eab308','#22d3ee','#f43f5e','#0ea5e9'];
        const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
        
        const breakdownEl = document.getElementById('categoryBreakdown');
        breakdownEl.innerHTML = sortedCats.map(([cat, count], i) => `
            <li class="category-item">
                <div class="category-info">
                    <span class="category-dot" style="background:${colors[i % colors.length]}"></span>
                    <span class="category-name">${cat}</span>
                </div>
                <span class="category-count">${count}</span>
            </li>
        `).join('');

        // Build admin dashboard charts
        buildAdminCharts();

    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

// ===== PRODUCTS TABLE =====
function renderProducts() {
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
    if (productPage > totalPages) productPage = 1;

    const start = (productPage - 1) * PRODUCTS_PER_PAGE;
    const paged = filtered.slice(start, start + PRODUCTS_PER_PAGE);

    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = paged.length === 0 
        ? '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--admin-text-muted);">No products found</td></tr>'
        : paged.map(p => {
        const id = p._id || p.id;
        const name = p.name_ar || p.name || '';
        const brand = p.brand || '';
        const imgUrl = p.image_url || `https://via.placeholder.com/40x40/3b82f6/fff?text=${encodeURIComponent(name[0] || '?')}`;
        return `
            <tr>
                <td>
                    <div class="product-cell">
                        <img src="${imgUrl}" alt="" class="product-thumb" onerror="this.src='https://via.placeholder.com/40x40/3b82f6/fff?text=?'">
                        <div>
                            <div class="product-name">${escHtml(name)}</div>
                            <div class="product-brand">${escHtml(brand)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="category-chip">${escHtml(p.category || '-')}</span></td>
                <td class="price-cell">${(parseFloat(p.price_jod || p.price) || 0).toFixed(2)}</td>
                <td>${escHtml(p.size || '-')}</td>
                <td><span class="status-badge active"><span class="status-dot"></span> In Stock</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="admin-btn-icon" title="Edit" onclick='editProduct("${id}")'>
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="admin-btn-icon danger" title="Delete" onclick='deleteProduct("${id}", "${escHtml(name).replace(/'/g, "\\'")}") '>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Pagination
    document.getElementById('productsPaginationInfo').textContent = 
        `Showing ${start + 1}-${Math.min(start + PRODUCTS_PER_PAGE, filtered.length)} of ${filtered.length} products`;
    
    const pagEl = document.getElementById('productsPagination');
    if (totalPages <= 1) {
        pagEl.innerHTML = '';
    } else {
        let html = '';
        if (productPage > 1) html += `<button onclick="goProductPage(${productPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
        for (let i = 1; i <= totalPages; i++) {
            if (totalPages > 7 && i > 3 && i < totalPages - 2 && Math.abs(i - productPage) > 1) {
                if (i === 4) html += `<button disabled>...</button>`;
                continue;
            }
            html += `<button class="${i === productPage ? 'active' : ''}" onclick="goProductPage(${i})">${i}</button>`;
        }
        if (productPage < totalPages) html += `<button onclick="goProductPage(${productPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
        pagEl.innerHTML = html;
    }
}

function goProductPage(p) {
    productPage = p;
    renderProducts();
}

function getFilteredProducts() {
    let list = [...allProducts];
    const search = (document.getElementById('productSearch')?.value || '').toLowerCase();
    const cat = document.getElementById('categoryFilter')?.value || '';
    
    if (search) {
        list = list.filter(p => {
            const text = `${p.name_ar || ''} ${p.name || ''} ${p.brand || ''} ${p.description || ''}`.toLowerCase();
            return text.includes(search);
        });
    }
    if (cat) {
        list = list.filter(p => p.category === cat);
    }
    return list;
}

function filterProducts() {
    productPage = 1;
    renderProducts();
}

function updateCategoryFilter() {
    const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
    const sel = document.getElementById('categoryFilter');
    const current = sel.value;
    sel.innerHTML = '<option value="">All Categories</option>' + 
        cats.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
}

// ===== CATEGORIES PAGE =====
function renderCategoriesPage() {
    const catCounts = {};
    allProducts.forEach(p => {
        const cat = p.category || 'Other';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6','#6366f1','#a855f7','#84cc16','#eab308','#22d3ee','#f43f5e','#0ea5e9'];
    const emojis = {
        'مشروبات ساخنة': '☕', 'ألبان وأجبان': '🧀', 'مجمدات': '🧊', 'لحوم': '🥩',
        'لحوم باردة': '🥓', 'مونة': '🍚', 'معلبات': '🥫', 'زيوت': '🫒',
        'صلصات': '🫙', 'بهارات': '🌶️', 'حلويات': '🍯', 'سناكس': '🍿',
        'مشروبات باردة': '🧃', 'مخبوزات': '🍞', 'متفرقات': '📦', 'فواكه وتمور': '🌴'
    };

    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count], i) => `
            <div class="stat-card-admin" style="cursor:pointer;" onclick="filterByCategory('${cat}')">
                <div class="stat-card-top">
                    <div class="stat-icon" style="background:${colors[i % colors.length]};font-size:1.3rem;">
                        ${emojis[cat] || '📦'}
                    </div>
                </div>
                <div class="stat-value">${count}</div>
                <div class="stat-label-admin">${cat}</div>
            </div>
        `).join('');
}

function filterByCategory(cat) {
    switchPage('products');
    document.getElementById('categoryFilter').value = cat;
    filterProducts();
}

// ===== PRODUCT CRUD =====
function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    form.reset();
    document.getElementById('editProductId').value = '';

    if (product) {
        title.textContent = 'Edit Product';
        document.getElementById('editProductId').value = product._id || product.id;
        document.getElementById('prodNameAr').value = product.name_ar || product.name || '';
        document.getElementById('prodBrand').value = product.brand || '';
        document.getElementById('prodCategory').value = product.category || '';
        document.getElementById('prodPrice').value = product.price_jod || product.price || '';
        document.getElementById('prodSize').value = product.size || '';
        document.getElementById('prodImage').value = product.image_url || '';
        document.getElementById('prodDesc').value = product.description || '';
        
        const n = product.nutrition_per_100g || {};
        document.getElementById('prodCalories').value = n.calories || '';
        document.getElementById('prodProtein').value = n.protein_g || '';
        document.getElementById('prodCarbs').value = n.carbs_g || '';
        document.getElementById('prodFat').value = n.fat_g || '';
    } else {
        title.textContent = 'Add New Product';
    }

    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

function editProduct(id) {
    const product = allProducts.find(p => (p._id || p.id) == id);
    if (product) openProductModal(product);
}

async function saveProduct() {
    const id = document.getElementById('editProductId').value;
    const nameAr = document.getElementById('prodNameAr').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const category = document.getElementById('prodCategory').value;

    if (!nameAr || !price || !category) {
        showToast('Please fill required fields', 'error');
        return;
    }

    const productData = {
        name_ar: nameAr,
        brand: document.getElementById('prodBrand').value.trim(),
        category: category,
        price_jod: price,
        size: document.getElementById('prodSize').value.trim(),
        image_url: document.getElementById('prodImage').value.trim(),
        description: document.getElementById('prodDesc').value.trim(),
        nutrition_per_100g: {
            calories: parseFloat(document.getElementById('prodCalories').value) || 0,
            protein_g: parseFloat(document.getElementById('prodProtein').value) || 0,
            carbs_g: parseFloat(document.getElementById('prodCarbs').value) || 0,
            fat_g: parseFloat(document.getElementById('prodFat').value) || 0
        }
    };

    try {
        let res;
        if (id) {
            res = await fetch(`${API}/products/${id}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(productData)
            });
        } else {
            res = await fetch(`${API}/products`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(productData)
            });
        }

        if (res.status === 401) { handleLogout(); return; }
        const data = await res.json();
        
        if (res.ok) {
            closeProductModal();
            showToast(id ? 'Product updated ✅' : 'Product added ✅', 'success');
            addActivity(id ? 'edit' : 'add', `${id ? 'Updated' : 'Added'} product: ${nameAr}`);
            await loadProducts();
            loadDashboardStats();
        } else {
            showToast(data.error || 'Error saving product', 'error');
        }
    } catch (err) {
        showToast('Network error. Please try again.', 'error');
    }
}

function deleteProduct(id, name) {
    openConfirm(
        'Delete Product?',
        `Are you sure you want to delete "${name}"? This cannot be undone.`,
        async () => {
            try {
                const res = await fetch(`${API}/products/${id}`, {
                    method: 'DELETE',
                    headers: authHeaders()
                });
                if (res.status === 401) { handleLogout(); return; }
                if (res.ok) {
                    showToast('Product deleted 🗑️', 'success');
                    addActivity('delete', `Deleted product: ${name}`);
                    await loadProducts();
                    loadDashboardStats();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Error deleting product', 'error');
                }
            } catch (err) {
                showToast('Network error', 'error');
            }
        }
    );
}

// ===== USERS =====
function renderUsers() {
    const search = (document.getElementById('userSearch')?.value || '').toLowerCase();
    let list = [...allUsers];
    if (search) {
        list = list.filter(u => {
            const text = `${u.name || ''} ${u.username || ''} ${u.email || ''}`.toLowerCase();
            return text.includes(search);
        });
    }

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = list.length === 0
        ? '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--admin-text-muted);">No users found</td></tr>'
        : list.map(u => {
        const id = u._id || u.id;
        const initial = (u.name || u.username || 'U')[0].toUpperCase();
        const statusClass = u.status === 'active' ? 'active' : 'inactive';
        const roleColor = u.role === 'admin' ? 'var(--admin-info)' : 'var(--admin-text-light)';
        const joinDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : '-';
        return `
            <tr>
                <td>
                    <div class="product-cell">
                        <div style="width:36px;height:36px;border-radius:8px;background:var(--admin-gradient-4);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.8rem;flex-shrink:0;">${initial}</div>
                        <div>
                            <div class="product-name">${escHtml(u.name || u.username || '-')}</div>
                            <div class="product-brand">@${escHtml(u.username || '-')}</div>
                        </div>
                    </div>
                </td>
                <td>${escHtml(u.email || '-')}</td>
                <td><span style="color:${roleColor};font-weight:600;font-size:0.8rem;text-transform:capitalize;">${u.role || 'customer'}</span></td>
                <td><span class="status-badge ${statusClass}"><span class="status-dot"></span> ${u.status || 'active'}</span></td>
                <td style="font-size:0.8rem;color:var(--admin-text-muted);">${joinDate}</td>
                <td>
                    <div class="actions-cell">
                        <button class="admin-btn-icon" title="Edit" onclick='editUser("${id}")'>
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="admin-btn-icon danger" title="Delete" onclick='deleteUser("${id}", "${escHtml(u.name || u.username || '').replace(/'/g, "\\'")}") '>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterUsers() {
    renderUsers();
}

function updateUserStats() {
    document.getElementById('totalUsersCount').textContent = allUsers.length;
    document.getElementById('activeUsersCount').textContent = allUsers.filter(u => u.status === 'active').length;
    document.getElementById('adminUsersCount').textContent = allUsers.filter(u => u.role === 'admin').length;
}

function openUserModal(user = null) {
    const modal = document.getElementById('userModal');
    document.getElementById('userForm').reset();
    document.getElementById('editUserId').value = '';

    if (user) {
        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('editUserId').value = user._id || user.id;
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userUsername').value = user.username || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRole').value = user.role || 'customer';
        document.getElementById('userStatus').value = user.status || 'active';
        document.getElementById('userPassword').required = false;
        document.getElementById('passwordHint').style.display = 'block';
        document.getElementById('passwordLabel').textContent = 'Password';
    } else {
        document.getElementById('userModalTitle').textContent = 'Add New User';
        document.getElementById('userPassword').required = true;
        document.getElementById('passwordHint').style.display = 'none';
        document.getElementById('passwordLabel').textContent = 'Password *';
    }

    modal.classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function editUser(id) {
    const user = allUsers.find(u => (u._id || u.id) == id);
    if (user) openUserModal(user);
}

async function saveUser() {
    const id = document.getElementById('editUserId').value;
    const name = document.getElementById('userName').value.trim();
    const username = document.getElementById('userUsername').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;

    if (!name || !username || !email) {
        showToast('Please fill required fields', 'error');
        return;
    }

    if (!id && !password) {
        showToast('Password is required for new users', 'error');
        return;
    }

    const userData = { name, username, email, role, status };
    if (password) userData.password = password;

    try {
        let res;
        if (id) {
            res = await fetch(`${API}/users/${id}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(userData)
            });
        } else {
            res = await fetch(`${API}/users`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(userData)
            });
        }

        if (res.status === 401) { handleLogout(); return; }
        const data = await res.json();

        if (res.ok) {
            closeUserModal();
            showToast(id ? 'User updated ✅' : 'User added ✅', 'success');
            addActivity('user', `${id ? 'Updated' : 'Added'} user: ${name}`);
            await loadUsers();
            loadDashboardStats();
        } else {
            showToast(data.error || 'Error saving user', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
}

function deleteUser(id, name) {
    openConfirm(
        'Delete User?',
        `Are you sure you want to delete "${name}"? This cannot be undone.`,
        async () => {
            try {
                const res = await fetch(`${API}/users/${id}`, {
                    method: 'DELETE',
                    headers: authHeaders()
                });
                if (res.status === 401) { handleLogout(); return; }
                if (res.ok) {
                    showToast('User deleted 🗑️', 'success');
                    addActivity('delete', `Deleted user: ${name}`);
                    await loadUsers();
                    loadDashboardStats();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Error deleting user', 'error');
                }
            } catch (err) {
                showToast('Network error', 'error');
            }
        }
    );
}

// ===== ORDERS =====
async function loadOrders() {
    try {
        const res = await fetch(`${API}/orders`, { headers: authHeaders() });
        if (res.status === 401) { handleLogout(); return; }
        const data = await res.json();
        allOrders = data.orders || [];
        renderOrders();
    } catch (err) {
        console.error('Error loading orders:', err);
    }
}

function renderOrders() {
    const list = [...allOrders];
    
    let html = '';
    
    if (list.length === 0) {
        html = `
        <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <div class="empty-state-text">No orders yet. Orders will appear here once customers start shopping.</div>
        </div>`;
    } else {
        html = `
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total (JOD)</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="ordersTableBody">
                    ${list.map(o => {
                        const id = o._id || o.id;
                        const date = o.created_at ? new Date(o.created_at).toLocaleString() : '-';
                        let statusClass = o.status === 'Delivered' ? 'active' : (o.status === 'Cancelled' ? 'inactive' : 'pending');
                        return `
                            <tr>
                                <td><span style="font-weight:700;color:var(--admin-primary)">${o.order_id || id.substring(0,8)}</span></td>
                                <td>
                                    <div class="product-name">${escHtml(o.customer?.name || '-')}</div>
                                    <div class="product-brand" style="font-size:0.75rem">${escHtml(o.customer?.phone || '-')}</div>
                                </td>
                                <td>${(o.items || []).length} items</td>
                                <td class="price-cell">${(parseFloat(o.total_amount) || 0).toFixed(2)}</td>
                                <td style="font-size:0.85rem;color:var(--admin-text-muted)">${date}</td>
                                <td>
                                    <span class="status-badge ${statusClass}">
                                        <span class="status-dot"></span> ${o.status || 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display:flex;gap:0.5rem;align-items:center">
                                        <select class="form-input-admin" style="width: auto; padding: 0.25rem; font-size: 0.8rem; background-color: var(--white);" onchange="updateOrderStatus('${id}', this.value)">
                                            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                                            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                        </select>
                                        <button onclick="generateInvoice('${id}')" title="Download Invoice" style="background:var(--admin-primary);color:white;border:none;border-radius:4px;padding:0.25rem 0.5rem;cursor:pointer"><i class="fas fa-file-pdf"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }
    
    const container = document.querySelector('#page-orders .admin-card-body');
    if(container) container.innerHTML = html;
}

function generateInvoice(id) {
    const o = allOrders.find(x => (x._id || x.id) === id);
    if (!o) return;
    
    const inv = document.createElement('div');
    inv.style.padding = '40px';
    inv.style.fontFamily = 'Inter, sans-serif';
    inv.style.color = '#333';
    inv.innerHTML = `
        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #eee;padding-bottom:20px;margin-bottom:20px">
            <div><h1 style="color:#06b6d4;margin:0">Mooneh.ai</h1><p style="margin:5px 0;color:#666">Invoice / Receipt</p></div>
            <div style="text-align:right">
                <h3 style="margin:0">Order ${o.order_id || id.substring(0,8)}</h3>
                <p style="margin:5px 0;color:#666">Date: ${new Date(o.created_at).toLocaleString()}</p>
                <span style="display:inline-block;padding:4px 8px;background:#e0f2fe;color:#0369a1;border-radius:4px;font-size:0.8rem;font-weight:bold">${o.status}</span>
            </div>
        </div>
        <div style="margin-bottom:30px">
            <h4 style="margin:0 0 10px 0;color:#444;text-transform:uppercase;font-size:0.8rem">Billed To:</h4>
            <p style="margin:0;font-weight:bold">${o.customer?.name || 'Customer'}</p>
            <p style="margin:5px 0 0 0;color:#666">${o.customer?.phone || '-'}</p>
            <p style="margin:5px 0 0 0;color:#666">${o.customer?.address || '-'}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:30px">
            <thead>
                <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;text-align:left">
                    <th style="padding:12px;font-size:0.9rem">Item</th>
                    <th style="padding:12px;font-size:0.9rem;text-align:center">Qty</th>
                    <th style="padding:12px;font-size:0.9rem;text-align:right">Price</th>
                    <th style="padding:12px;font-size:0.9rem;text-align:right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${(o.items||[]).map(i => `
                <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:12px">
                        <div style="font-weight:bold">${i.name_ar || i.name}</div>
                        ${i.brand ? `<div style="font-size:0.8rem;color:#666">${i.brand}</div>` : ''}
                    </td>
                    <td style="padding:12px;text-align:center">${i.quantity}</td>
                    <td style="padding:12px;text-align:right">${parseFloat(i.price).toFixed(2)} JOD</td>
                    <td style="padding:12px;text-align:right;font-weight:bold">${(parseFloat(i.price) * i.quantity).toFixed(2)} JOD</td>
                </tr>`).join('')}
            </tbody>
        </table>
        <div style="display:flex;justify-content:flex-end">
            <div style="width:300px;background:#f8fafc;padding:20px;border-radius:8px">
                <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                    <span style="color:#666">Subtotal:</span>
                    <span>${parseFloat(o.total_amount).toFixed(2)} JOD</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                    <span style="color:#666">Delivery:</span>
                    <span>Free</span>
                </div>
                <div style="display:flex;justify-content:space-between;border-top:2px solid #e2e8f0;padding-top:10px;margin-top:10px;font-size:1.2rem;font-weight:bold">
                    <span>Total:</span>
                    <span style="color:#06b6d4">${parseFloat(o.total_amount).toFixed(2)} JOD</span>
                </div>
            </div>
        </div>
        <div style="margin-top:50px;text-align:center;color:#94a3b8;font-size:0.8rem;border-top:1px solid #eee;padding-top:20px">
            <p>Thank you for shopping with Mooneh.ai!</p>
            <p>If you have any questions, contact us at support@mooneh.ai</p>
        </div>
    `;
    
    inv.style.width = '800px';
    
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.appendChild(inv);
    document.body.appendChild(wrapper);

    const opt = {
        margin: 0,
        filename: `Invoice_${o.order_id || id.substring(0,8)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    showToast('Generating Invoice...', 'info');
    if(typeof html2pdf !== 'undefined'){
        html2pdf().set(opt).from(inv).save().then(() => {
            document.body.removeChild(wrapper);
            showToast('Invoice Downloaded ✅', 'success');
        }).catch(e=>{
            document.body.removeChild(wrapper);
            showToast('Error','error');
        });
    }else{
        document.body.removeChild(wrapper);
        showToast('PDF library not loaded','error');
    }
}

async function updateOrderStatus(id, newStatus) {
    try {
        const res = await fetch(`${API}/orders/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        if (res.status === 401) { handleLogout(); return; }
        if (res.ok) {
            showToast('Order status updated ✅', 'success');
            await loadOrders();
            loadDashboardStats();
        } else {
            showToast('Error updating order', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
}

// ===== ACTIVITY LOG =====
function addActivity(type, text) {
    activityLog.unshift({ type, text, time: new Date() });
    if (activityLog.length > 20) activityLog.pop();
    renderActivity();
}

function renderActivity() {
    const list = document.getElementById('activityList');
    const iconMap = {
        add: '<i class="fas fa-plus"></i>',
        edit: '<i class="fas fa-pen"></i>',
        delete: '<i class="fas fa-trash"></i>',
        user: '<i class="fas fa-user"></i>'
    };

    list.innerHTML = activityLog.length === 0 
        ? '<li class="activity-item"><div class="activity-icon add"><i class="fas fa-info"></i></div><div><div class="activity-text">No recent activity</div></div></li>'
        : activityLog.map(a => `
            <li class="activity-item">
                <div class="activity-icon ${a.type}">${iconMap[a.type] || '<i class="fas fa-circle"></i>'}</div>
                <div>
                    <div class="activity-text">${escHtml(a.text)}</div>
                    <div class="activity-time">${timeAgo(a.time)}</div>
                </div>
            </li>
        `).join('');
}

// ===== CONFIRM DIALOG =====
function openConfirm(title, text, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmText').textContent = text;
    pendingConfirmCallback = callback;
    document.getElementById('confirmDialog').classList.add('active');
}

function closeConfirm() {
    document.getElementById('confirmDialog').classList.remove('active');
    pendingConfirmCallback = null;
}

function confirmAction() {
    if (pendingConfirmCallback) {
        pendingConfirmCallback();
    }
    closeConfirm();
}

// ===== TOAST =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('adminToast');
    const icon = document.getElementById('toastIcon');
    document.getElementById('toastMessage').textContent = message;
    
    toast.className = 'admin-toast ' + type;
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    icon.className = icons[type] || icons.success;
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== HELPERS =====
function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
        closeUserModal();
        closeConfirm();
    }
});

// Close modals on overlay click
document.getElementById('productModal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-modal-overlay')) closeProductModal();
});
document.getElementById('userModal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-modal-overlay')) closeUserModal();
});

// ===== ADMIN CHARTS (Chart.js) =====
let adminCharts = {};

function destroyAdminChart(key) {
    if (adminCharts[key]) { adminCharts[key].destroy(); delete adminCharts[key]; }
}

function buildAdminCharts() {
    if (typeof Chart === 'undefined') return;
    buildAdminRevenueChart();
    buildAdminCategoryChart();
    buildAdminOrderChart();
}

function buildAdminRevenueChart() {
    destroyAdminChart('revenue');
    const ctx = document.getElementById('adminRevenueChart');
    if (!ctx) return;
    const daily = {};
    allOrders.forEach(o => {
        if (o.status === 'Cancelled') return;
        const d = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daily[d] = (daily[d] || 0) + (parseFloat(o.total_amount) || 0);
    });
    let entries = Object.entries(daily).slice(-14);
    if (!entries.length) entries = [['Today', 0]];
    adminCharts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: entries.map(e => e[0]),
            datasets: [{
                label: 'Revenue (JOD)',
                data: entries.map(e => e[1]),
                borderColor: '#25a55f',
                backgroundColor: 'rgba(37,165,95,0.1)',
                fill: true, tension: 0.4,
                pointBackgroundColor: '#25a55f',
                pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

function buildAdminCategoryChart() {
    destroyAdminChart('category');
    const ctx = document.getElementById('adminCategoryChart');
    if (!ctx) return;
    const cc = {};
    allProducts.forEach(p => { const c = p.category || 'Other'; cc[c] = (cc[c] || 0) + 1; });
    const sorted = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const colors = ['#25a55f','#10b981','#06b6d4','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#ec4899','#f97316','#14b8a6'];
    adminCharts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sorted.map(e => e[0]),
            datasets: [{ data: sorted.map(e => e[1]), backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: { legend: { position: 'right', labels: { padding: 8, usePointStyle: true, pointStyle: 'circle', font: { size: 10 } } } }
        }
    });
}

function buildAdminOrderChart() {
    destroyAdminChart('orders');
    const ctx = document.getElementById('adminOrderChart');
    if (!ctx) return;
    const s = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
    allOrders.forEach(o => s[o.status || 'Pending']++);
    adminCharts.orders = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(s),
            datasets: [{ data: Object.values(s), backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'], borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 10 } } } }
        }
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

