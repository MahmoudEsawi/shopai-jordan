// Wishlist Management System
class WishlistManager {
    constructor() {
        this.wishlist = this.loadWishlist();
        this.init();
    }

    init() {
        // Load wishlist on page load
        this.updateWishlistUI();
    }

    loadWishlist() {
        try {
            const stored = localStorage.getItem('wishlist');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading wishlist:', e);
            return [];
        }
    }

    saveWishlist() {
        try {
            localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
        } catch (e) {
            console.error('Error saving wishlist:', e);
        }
    }

    isInWishlist(productId) {
        return this.wishlist.some(item => item.id === productId);
    }

    addToWishlist(product) {
        if (!this.isInWishlist(product.id)) {
            this.wishlist.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                product_url: product.product_url,
                category: product.category,
                added_at: new Date().toISOString()
            });
            this.saveWishlist();
            this.updateWishlistUI();
            Toast.success(`Added "${product.name}" to wishlist`);
            return true;
        }
        return false;
    }

    removeFromWishlist(productId) {
        const index = this.wishlist.findIndex(item => item.id === productId);
        if (index > -1) {
            const product = this.wishlist[index];
            this.wishlist.splice(index, 1);
            this.saveWishlist();
            this.updateWishlistUI();
            Toast.info(`Removed "${product.name}" from wishlist`);
            return true;
        }
        return false;
    }

    toggleWishlist(product) {
        if (this.isInWishlist(product.id)) {
            this.removeFromWishlist(product.id);
        } else {
            this.addToWishlist(product);
        }
    }

    getWishlist() {
        return this.wishlist;
    }

    getWishlistCount() {
        return this.wishlist.length;
    }

    clearWishlist() {
        this.wishlist = [];
        this.saveWishlist();
        this.updateWishlistUI();
        Toast.info('Wishlist cleared');
    }

    updateWishlistUI() {
        // Update wishlist button badge
        const wishlistBadge = document.getElementById('wishlistBadge');
        if (wishlistBadge) {
            const count = this.getWishlistCount();
            wishlistBadge.textContent = count;
            wishlistBadge.style.display = count > 0 ? 'flex' : 'none';
        }

        // Update all wishlist buttons on product cards
        document.querySelectorAll('[data-product-id]').forEach(card => {
            const productId = card.getAttribute('data-product-id');
            const wishlistBtn = card.querySelector('.wishlist-btn');
            if (wishlistBtn) {
                if (this.isInWishlist(productId)) {
                    wishlistBtn.classList.add('active');
                    wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
                } else {
                    wishlistBtn.classList.remove('active');
                    wishlistBtn.innerHTML = '<i class="far fa-heart"></i>';
                }
            }
        });
    }

    renderWishlistItems() {
        if (this.wishlist.length === 0) {
            return `
                <div class="wishlist-empty">
                    <i class="fas fa-heart" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
                    <div style="font-size: 1.1rem; color: var(--gray); margin-bottom: 0.5rem;">Your wishlist is empty</div>
                    <div style="font-size: 0.9rem; color: var(--gray);">Add products to your wishlist to save them for later</div>
                </div>
            `;
        }

        return this.wishlist.map(item => `
            <div class="wishlist-item" data-product-id="${item.id}">
                <div class="wishlist-item-image">
                    <img src="${item.image_url || 'https://via.placeholder.com/100?text=No+Image'}" 
                         alt="${this.escapeHtml(item.name)}"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
                </div>
                <div class="wishlist-item-details">
                    <div class="wishlist-item-name">${this.escapeHtml(item.name)}</div>
                    <div class="wishlist-item-category">${this.escapeHtml(item.category || 'General')}</div>
                    <div class="wishlist-item-price">${item.price.toFixed(2)} JOD</div>
                </div>
                <div class="wishlist-item-actions">
                    <button class="btn btn-success btn-sm" onclick="addToCart('${item.id}', 1)">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn btn-outline btn-sm wishlist-remove-btn" onclick="wishlistManager.removeFromWishlist('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize wishlist manager
const wishlistManager = new WishlistManager();
window.wishlistManager = wishlistManager;

// Update wishlist panel when items change
const originalAddToWishlist = WishlistManager.prototype.addToWishlist;
const originalRemoveFromWishlist = WishlistManager.prototype.removeFromWishlist;

WishlistManager.prototype.addToWishlist = function(product) {
    const result = originalAddToWishlist.call(this, product);
    if (result) {
        const wishlistPanel = document.getElementById('wishlistPanel');
        if (wishlistPanel && wishlistPanel.classList.contains('active')) {
            const wishlistItems = document.getElementById('wishlistItems');
            if (wishlistItems) {
                wishlistItems.innerHTML = this.renderWishlistItems();
            }
        }
    }
    return result;
};

WishlistManager.prototype.removeFromWishlist = function(productId) {
    const result = originalRemoveFromWishlist.call(this, productId);
    if (result) {
        const wishlistPanel = document.getElementById('wishlistPanel');
        if (wishlistPanel && wishlistPanel.classList.contains('active')) {
            const wishlistItems = document.getElementById('wishlistItems');
            if (wishlistItems) {
                wishlistItems.innerHTML = this.renderWishlistItems();
            }
        }
    }
    return result;
};

