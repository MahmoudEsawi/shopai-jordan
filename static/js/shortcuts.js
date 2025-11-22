// Keyboard Shortcuts System
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.registerDefaultShortcuts();
    }

    registerDefaultShortcuts() {
        // Ctrl/Cmd + K: Focus search
        this.register('ctrl+k', (e) => {
            e.preventDefault();
            const searchInput = document.querySelector('#productSearch, #chatInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        });

        // Ctrl/Cmd + /: Show shortcuts help
        this.register('ctrl+/', (e) => {
            e.preventDefault();
            this.showShortcutsHelp();
        });

        // Escape: Close modals/cart
        this.register('escape', () => {
            // Close cart
            const sideCart = document.getElementById('sideCart');
            if (sideCart && sideCart.classList.contains('active')) {
                toggleCart();
                return;
            }

            // Close wishlist
            const wishlistPanel = document.getElementById('wishlistPanel');
            if (wishlistPanel && wishlistPanel.classList.contains('active')) {
                toggleWishlist();
                return;
            }

            // Close product modal
            const productModal = document.getElementById('productModal');
            if (productModal && productModal.classList.contains('active')) {
                closeProductModal();
                return;
            }
        });

        // Ctrl/Cmd + D: Toggle dark mode
        this.register('ctrl+d', (e) => {
            e.preventDefault();
            if (window.darkMode) {
                darkMode.toggle();
            }
        });

        // Ctrl/Cmd + W: Toggle wishlist
        this.register('ctrl+w', (e) => {
            e.preventDefault();
            if (typeof toggleWishlist === 'function') {
                toggleWishlist();
            }
        });

        // Ctrl/Cmd + C: Open cart
        this.register('ctrl+c', (e) => {
            // Only if not in input field
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                if (typeof toggleCart === 'function') {
                    toggleCart();
                }
            }
        });
    }

    register(keyCombo, callback) {
        this.shortcuts.set(keyCombo.toLowerCase(), callback);
    }

    handleKeyPress(e) {
        const key = e.key.toLowerCase();
        let combo = '';

        // Build key combination string
        if (e.ctrlKey || e.metaKey) {
            combo += 'ctrl+';
        }
        if (e.altKey) {
            combo += 'alt+';
        }
        if (e.shiftKey) {
            combo += 'shift+';
        }
        combo += key;

        // Handle special keys
        if (key === 'escape') {
            combo = 'escape';
        }

        const callback = this.shortcuts.get(combo);
        if (callback) {
            callback(e);
        }
    }

    showShortcutsHelp() {
        const shortcuts = [
            { key: 'Ctrl/Cmd + K', desc: 'Focus search' },
            { key: 'Ctrl/Cmd + /', desc: 'Show shortcuts' },
            { key: 'Ctrl/Cmd + D', desc: 'Toggle dark mode' },
            { key: 'Ctrl/Cmd + W', desc: 'Toggle wishlist' },
            { key: 'Ctrl/Cmd + C', desc: 'Open cart' },
            { key: 'Esc', desc: 'Close modals/panels' }
        ];

        const html = `
            <div class="shortcuts-help">
                <div class="shortcuts-help-header">
                    <h3>Keyboard Shortcuts</h3>
                    <button class="shortcuts-help-close" onclick="this.closest('.shortcuts-help').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="shortcuts-help-content">
                    ${shortcuts.map(s => `
                        <div class="shortcut-item">
                            <kbd>${s.key}</kbd>
                            <span>${s.desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Remove existing help if any
        const existing = document.querySelector('.shortcuts-help');
        if (existing) {
            existing.remove();
        }

        const helpDiv = document.createElement('div');
        helpDiv.innerHTML = html;
        document.body.appendChild(helpDiv.firstElementChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            const help = document.querySelector('.shortcuts-help');
            if (help) {
                help.style.opacity = '0';
                setTimeout(() => help.remove(), 300);
            }
        }, 5000);
    }
}

// Initialize keyboard shortcuts
const keyboardShortcuts = new KeyboardShortcuts();
window.keyboardShortcuts = keyboardShortcuts;

