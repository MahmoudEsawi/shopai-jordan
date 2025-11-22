// UX Enhancements - Comprehensive User Experience Improvements

// ============================================
// 1. SMOOTH NAVIGATION & ACTIVE STATES
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Update active nav link based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    function updateActiveNav() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollPos >= top && scrollPos < bottom) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();
    
    // Smooth scroll for anchor links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = 80; // Navbar height
                    const targetPosition = target.offsetTop - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update active state
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });
});

// ============================================
// 2. LOADING STATES
// ============================================
const LoadingManager = {
    overlay: null,
    
    init() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(this.overlay);
        }
    },
    
    show() {
        this.init();
        this.overlay.classList.add('active');
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }
};

// Button loading state
function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// ============================================
// 3. FORM VALIDATION
// ============================================
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        const group = input.closest('.form-group');
        if (!group) return;
        
        // Remove existing error messages
        const existingError = group.querySelector('.form-error');
        if (existingError) existingError.remove();
        
        // Validate
        if (!input.value.trim()) {
            showFieldError(group, 'This field is required');
            isValid = false;
        } else if (input.type === 'email' && !isValidEmail(input.value)) {
            showFieldError(group, 'Please enter a valid email address');
            isValid = false;
        } else if (input.type === 'tel' && !isValidPhone(input.value)) {
            showFieldError(group, 'Please enter a valid phone number');
            isValid = false;
        } else {
            showFieldSuccess(group);
        }
    });
    
    return isValid;
}

function showFieldError(group, message) {
    const error = document.createElement('div');
    error.className = 'form-error';
    error.textContent = message;
    group.appendChild(error);
    
    const input = group.querySelector('input, select, textarea');
    if (input) {
        input.classList.add('error');
        input.classList.remove('success');
    }
}

function showFieldSuccess(group) {
    const input = group.querySelector('input, select, textarea');
    if (input) {
        input.classList.add('success');
        input.classList.remove('error');
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]+$/.test(phone);
}

// Real-time validation
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                const group = input.closest('.form-group');
                if (group && input.hasAttribute('required')) {
                    if (!input.value.trim()) {
                        showFieldError(group, 'This field is required');
                    } else {
                        showFieldSuccess(group);
                    }
                }
            });
        });
    });
});

// ============================================
// 4. EMPTY STATES
// ============================================
function showEmptyState(container, options = {}) {
    const {
        icon = 'fas fa-inbox',
        title = 'No items found',
        description = 'There are no items to display at the moment.',
        actionText = null,
        actionCallback = null
    } = options;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="${icon}"></i>
            </div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-description">${description}</p>
            ${actionText ? `
                <button class="btn btn-primary empty-state-action" onclick="${actionCallback ? actionCallback.toString() : ''}">
                    ${actionText}
                </button>
            ` : ''}
        </div>
    `;
}

// ============================================
// 5. KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('#chatInput, .smart-search-input, input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape to close modals/panels
    if (e.key === 'Escape') {
        // Close any open modals
        const modals = document.querySelectorAll('.modal.active, .modal.show');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close, .close-btn');
            if (closeBtn) closeBtn.click();
        });
    }
});

// ============================================
// 6. PROGRESS INDICATORS
// ============================================
function updateProgressBar(barId, percentage) {
    const bar = document.getElementById(barId);
    if (bar) {
        const fill = bar.querySelector('.progress-fill');
        if (fill) {
            fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }
}

// ============================================
// 7. SMOOTH ANIMATIONS
// ============================================
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const opacity = Math.min(progress / duration, 1);
        element.style.opacity = opacity;
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

function slideUp(element, duration = 300) {
    element.style.maxHeight = '0';
    element.style.overflow = 'hidden';
    element.style.transition = `max-height ${duration}ms ease`;
    
    setTimeout(() => {
        const height = element.scrollHeight;
        element.style.maxHeight = `${height}px`;
        
        setTimeout(() => {
            element.style.maxHeight = 'none';
        }, duration);
    }, 10);
}

// ============================================
// 8. TOOLTIP INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.classList.add('tooltip');
    });
});

// ============================================
// 9. ACCESSIBILITY IMPROVEMENTS
// ============================================
// Skip to main content link
document.addEventListener('DOMContentLoaded', () => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-main';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content ID if not exists
    const main = document.querySelector('main, .container, #main-content');
    if (main && !main.id) {
        main.id = 'main-content';
    }
});

// ============================================
// 10. PERFORMANCE: DEBOUNCE & THROTTLE
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// 11. EXPORT FUNCTIONS
// ============================================
window.LoadingManager = LoadingManager;
window.setButtonLoading = setButtonLoading;
window.validateForm = validateForm;
window.showEmptyState = showEmptyState;
window.updateProgressBar = updateProgressBar;
window.fadeIn = fadeIn;
window.slideUp = slideUp;
window.debounce = debounce;
window.throttle = throttle;

