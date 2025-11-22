// Product Quick View Modal
class ProductModal {
    constructor() {
        this.currentProduct = null;
        this.init();
    }

    init() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('productModal')) {
            this.createModal();
        }
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'productModal';
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="productModal.close()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="productModal.close()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-body" id="productModalBody">
                    <!-- Content will be inserted here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    show(product) {
        this.currentProduct = product;
        const modal = document.getElementById('productModal');
        const body = document.getElementById('productModalBody');

        if (!modal || !body) return;

        // Build product details HTML
        const facts = [];
        if (product.is_gluten_free) facts.push('<span class="dietary-badge">🌾 Gluten-Free</span>');
        if (product.is_vegetarian) facts.push('<span class="dietary-badge">🥬 Vegetarian</span>');
        if (product.is_vegan) facts.push('<span class="dietary-badge">🌱 Vegan</span>');
        if (product.is_healthy) facts.push('<span class="dietary-badge healthy">💚 Healthy</span>');
        if (product.is_organic) facts.push('<span class="dietary-badge organic">🌿 Organic</span>');
        if (product.is_halal) facts.push('<span class="dietary-badge">🕌 Halal</span>');

        body.innerHTML = `
            <div class="product-modal-image">
                <img src="${product.image_url || 'https://via.placeholder.com/400?text=No+Image'}" 
                     alt="${this.escapeHtml(product.name)}"
                     onerror="this.src='https://via.placeholder.com/400?text=No+Image'">
            </div>
            <div class="product-modal-details">
                <h2 class="product-modal-title">${this.escapeHtml(product.name)}</h2>
                <div class="product-modal-category">${this.escapeHtml(product.category || 'General')}</div>
                
                ${facts.length > 0 ? `
                    <div class="product-modal-facts">
                        ${facts.join('')}
                    </div>
                ` : ''}

                ${product.description ? `
                    <div class="product-modal-description">
                        ${this.escapeHtml(product.description)}
                    </div>
                ` : ''}

                ${product.calories_per_100g || product.protein_per_100g ? `
                    <div class="product-modal-nutrition">
                        <h3>Nutritional Information (per 100g)</h3>
                        <div class="nutrition-grid">
                            ${product.calories_per_100g ? `
                                <div class="nutrition-item">
                                    <i class="fas fa-fire"></i>
                                    <span>Calories</span>
                                    <strong>${product.calories_per_100g}</strong>
                                </div>
                            ` : ''}
                            ${product.protein_per_100g ? `
                                <div class="nutrition-item">
                                    <i class="fas fa-dumbbell"></i>
                                    <span>Protein</span>
                                    <strong>${product.protein_per_100g}g</strong>
                                </div>
                            ` : ''}
                            ${product.carbs_per_100g ? `
                                <div class="nutrition-item">
                                    <i class="fas fa-bread-slice"></i>
                                    <span>Carbs</span>
                                    <strong>${product.carbs_per_100g}g</strong>
                                </div>
                            ` : ''}
                            ${product.fats_per_100g ? `
                                <div class="nutrition-item">
                                    <i class="fas fa-tint"></i>
                                    <span>Fats</span>
                                    <strong>${product.fats_per_100g}g</strong>
                                </div>
                            ` : ''}
                            ${product.fiber_per_100g ? `
                                <div class="nutrition-item">
                                    <i class="fas fa-seedling"></i>
                                    <span>Fiber</span>
                                    <strong>${product.fiber_per_100g}g</strong>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                <div class="product-modal-price">
                    <span class="price-label">Price:</span>
                    <span class="price-value">${product.price.toFixed(2)} JOD</span>
                </div>

                <div class="product-modal-actions">
                    <button class="btn btn-success btn-lg" onclick="addToCart('${product.id}', 1); productModal.close();">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn btn-outline btn-lg wishlist-modal-btn" onclick="wishlistManager.toggleWishlist(productModal.currentProduct); this.classList.toggle('active');">
                        <i class="far fa-heart"></i> Add to Wishlist
                    </button>
                    ${product.product_url ? `
                        <a href="${product.product_url}" target="_blank" class="btn btn-primary btn-lg">
                            <i class="fas fa-external-link-alt"></i> View on Talabat
                        </a>
                    ` : ''}
                </div>
            </div>
        `;

        // Update wishlist button state
        setTimeout(() => {
            const wishlistBtn = body.querySelector('.wishlist-modal-btn');
            if (wishlistBtn && wishlistManager.isInWishlist(product.id)) {
                wishlistBtn.classList.add('active');
                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Wishlist';
            }
        }, 100);

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentProduct = null;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize product modal
const productModal = new ProductModal();
window.productModal = productModal;

// Close on Escape key (handled by shortcuts.js)
// Close on overlay click (handled in HTML)

