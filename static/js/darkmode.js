// Dark Mode Management
class DarkMode {
    constructor() {
        this.isDark = this.loadPreference();
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupToggle();
    }

    loadPreference() {
        const stored = localStorage.getItem('darkMode');
        if (stored !== null) {
            return stored === 'true';
        }
        // Default to system preference
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    savePreference() {
        localStorage.setItem('darkMode', this.isDark.toString());
    }

    toggle() {
        this.isDark = !this.isDark;
        this.applyTheme();
        this.savePreference();
        Toast.info(this.isDark ? 'Dark mode enabled' : 'Light mode enabled');
    }

    applyTheme() {
        if (this.isDark) {
            document.body.classList.add('dark-mode');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-theme', 'light');
        }
        
        // Update toggle button icon
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = this.isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    setupToggle() {
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set preference
                if (localStorage.getItem('darkMode') === null) {
                    this.isDark = e.matches;
                    this.applyTheme();
                }
            });
        }
    }

    getCurrentTheme() {
        return this.isDark ? 'dark' : 'light';
    }
}

// Initialize dark mode
const darkMode = new DarkMode();
window.darkMode = darkMode;

