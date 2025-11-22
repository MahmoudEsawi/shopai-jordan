// Wishlist Panel Toggle
function toggleWishlist() {
    const wishlistPanel = document.getElementById('wishlistPanel');
    const wishlistOverlay = document.getElementById('wishlistOverlay');
    
    if (wishlistPanel && wishlistOverlay) {
        const isActive = wishlistPanel.classList.contains('active');
        
        if (!isActive) {
            // Load and render wishlist items
            const wishlistItems = document.getElementById('wishlistItems');
            if (wishlistItems && typeof wishlistManager !== 'undefined') {
                wishlistItems.innerHTML = wishlistManager.renderWishlistItems();
            }
        }
        
        wishlistPanel.classList.toggle('active');
        wishlistOverlay.classList.toggle('active');
        
        // Prevent body scroll when panel is open
        if (wishlistPanel.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Make function available globally
window.toggleWishlist = toggleWishlist;

