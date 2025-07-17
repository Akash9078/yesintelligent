// ==========================================================================
// YESINTELLIGENT WEBSITE - MAIN JAVASCRIPT MODULE
// ==========================================================================

// Prevent layout shift during page load
document.documentElement.classList.add('preload');

// Remove preload class after page loads
window.addEventListener('load', () => {
    document.documentElement.classList.remove('preload');
});

// Configuration object for site-wide settings
const CONFIG = {
    MAILERLITE_URL: 'https://www.mailerlite.com/invite/3fe9afe57a666',
    ANIMATION_DELAY: 50,
    SCROLL_THRESHOLD: 100,
    DEBOUNCE_DELAY: 300,
    NEWSLETTER_SUCCESS_MESSAGE: 'Thank you for subscribing! You\'ll receive your free guide soon.',
    LOAD_MORE_MESSAGE: 'Loading...',
    NO_MORE_POSTS_MESSAGE: 'No more posts'
};

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

const Utils = {
    // Debounce function for performance optimization
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Smooth scroll to element
    smoothScrollTo: function(element) {
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    },

    // Add class with animation support
    addClass: function(element, className) {
        if (element && !element.classList.contains(className)) {
            element.classList.add(className);
        }
    },

    // Remove class with animation support
    removeClass: function(element, className) {
        if (element && element.classList.contains(className)) {
            element.classList.remove(className);
        }
    },

    // Toggle class helper
    toggleClass: function(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    },

    // Get current page name
    getCurrentPage: function() {
        const path = window.location.pathname;
        if (path.includes('tools')) return 'tools';
        if (path.includes('blog')) return 'blog';
        return 'home';
    },

    // Log analytics event (placeholder for future analytics integration)
    logEvent: function(event, data = {}) {
        console.log(`Analytics Event: ${event}`, data);
        // Future: gtag('event', event, data);
    }
};

// ==========================================================================
// NAVIGATION MODULE
// ==========================================================================

const Navigation = {
    init: function() {
        this.bindEvents();
        this.setupScrollEffect();
        this.setActiveNavLink();
    },

    bindEvents: function() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        // Mobile menu toggle
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                Utils.toggleClass(hamburger, 'active');
                Utils.toggleClass(navMenu, 'active');
            });
        }

        // Close mobile menu on link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                Utils.removeClass(hamburger, 'active');
                Utils.removeClass(navMenu, 'active');
            });
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                Utils.smoothScrollTo(target);
            });
        });
    },

    setupScrollEffect: function() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        const scrollHandler = Utils.debounce(() => {
            if (window.scrollY > CONFIG.SCROLL_THRESHOLD) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        }, 10);

        window.addEventListener('scroll', scrollHandler);
    },

    setActiveNavLink: function() {
        const currentPage = Utils.getCurrentPage();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            Utils.removeClass(link, 'active');
            const href = link.getAttribute('href');
            
            if ((currentPage === 'home' && href === '#home') ||
                (currentPage === 'tools' && href.includes('tools')) ||
                (currentPage === 'blog' && href.includes('blog'))) {
                Utils.addClass(link, 'active');
            }
        });
    }
};

// ==========================================================================
// NEWSLETTER MODULE
// ==========================================================================

const Newsletter = {
    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        const forms = document.querySelectorAll('#newsletterForm, .newsletter-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        });
    },

    handleSubmit: async function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const name = form.querySelector('input[type="text"]')?.value;
        const email = form.querySelector('input[type="email"]')?.value;
        
        // Validation
        if (!this.validateForm(name, email)) {
            return;
        }

        // Show loading state
        this.showLoadingState(form);

        try {
            // Prepare data for webhook
            const webhookData = {
                name: name,
                email: email,
                source: 'Newsletter Signup',
                page: window.location.href,
                timestamp: new Date().toISOString(),
                type: 'newsletter_subscription'
            };

            // Send to webhook
            const response = await fetch('https://n8ndroplet.yesintelligent.com/webhook/eca518a8-5809-434a-a1c1-903144ba2bcc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookData)
            });

            if (response.ok) {
                // Log analytics event
                Utils.logEvent('newsletter_signup', {
                    page: Utils.getCurrentPage(),
                    name: name,
                    email: email
                });

                // Show success message
                this.showSuccessMessage(form);
                
                // Reset form
                form.reset();
            } else {
                throw new Error('Server responded with an error');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            this.showErrorMessage(form);
        } finally {
            this.hideLoadingState(form);
        }
    },

    validateForm: function(name, email) {
        if (!name || !email) {
            alert('Please fill in all fields');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return false;
        }

        return true;
    },

    showLoadingState: function(form) {
        const button = form.querySelector('button[type="submit"]');
        if (button) {
            button.disabled = true;
            const originalText = button.textContent;
            button.dataset.originalText = originalText;
            button.textContent = 'Subscribing...';
        }
    },

    hideLoadingState: function(form) {
        const button = form.querySelector('button[type="submit"]');
        if (button && button.dataset.originalText) {
            button.disabled = false;
            button.textContent = button.dataset.originalText;
        }
    },

    showSuccessMessage: function(form) {
        alert(CONFIG.NEWSLETTER_SUCCESS_MESSAGE);
        
        // Optional: Replace alert with custom modal in the future
        // this.showCustomModal(CONFIG.NEWSLETTER_SUCCESS_MESSAGE);
    },

    showErrorMessage: function(form) {
        alert('Sorry, there was an error subscribing. Please try again or contact us directly.');
    }
};

// ==========================================================================
// TOOLS PAGE MODULE
// ==========================================================================

const ToolsPage = {
    init: function() {
        if (Utils.getCurrentPage() !== 'tools') return;
        
        this.bindEvents();
        this.setupFiltering();
    },

    bindEvents: function() {
        const searchInput = document.getElementById('searchInput');
        const filterButtons = document.querySelectorAll('.filter-btn');

        // Search functionality with debouncing
        if (searchInput) {
            const debouncedSearch = Utils.debounce((searchTerm) => {
                this.filterTools(searchTerm, this.getActiveCategory());
            }, CONFIG.DEBOUNCE_DELAY);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value.toLowerCase());
            });
        }

        // Category filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleCategoryFilter(e.target);
            });
        });
    },

    setupFiltering: function() {
        // Initialize with all tools visible
        this.updateResultsCount();
    },

    handleCategoryFilter: function(clickedButton) {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => {
            Utils.removeClass(btn, 'active');
        });
        Utils.addClass(clickedButton, 'active');
        
        // Filter tools
        const category = clickedButton.getAttribute('data-category');
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        this.filterTools(searchTerm, category);

        // Log analytics
        Utils.logEvent('tools_filter', {
            category: category,
            search_term: searchTerm
        });
    },

    getActiveCategory: function() {
        const activeButton = document.querySelector('.filter-btn.active');
        return activeButton ? activeButton.getAttribute('data-category') : 'all';
    },

    filterTools: function(searchTerm, category) {
        const toolCards = document.querySelectorAll('.tool-card');
        let visibleCount = 0;

        toolCards.forEach(card => {
            const shouldShow = this.shouldShowTool(card, searchTerm, category);
            
            if (shouldShow) {
                this.showToolCard(card);
                visibleCount++;
            } else {
                this.hideToolCard(card);
            }
        });

        this.updateResultsCount(visibleCount);
    },

    shouldShowTool: function(card, searchTerm, category) {
        const cardCategory = card.getAttribute('data-category');
        const cardTitle = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const cardDescription = card.querySelector('p')?.textContent.toLowerCase() || '';
        
        const matchesSearch = !searchTerm || 
            cardTitle.includes(searchTerm) || 
            cardDescription.includes(searchTerm);
        
        const matchesCategory = category === 'all' || cardCategory === category;
        
        return matchesSearch && matchesCategory;
    },

    showToolCard: function(card) {
        card.style.display = 'block';
        card.style.opacity = '0';
        
        setTimeout(() => {
            card.style.opacity = '1';
        }, CONFIG.ANIMATION_DELAY);
    },

    hideToolCard: function(card) {
        card.style.display = 'none';
    },

    updateResultsCount: function(count = null) {
        if (count === null) {
            const visibleCards = Array.from(document.querySelectorAll('.tool-card'))
                .filter(card => card.style.display !== 'none');
            count = visibleCards.length;
        }
        
        console.log(`Showing ${count} tools`);
        // Future: Update UI with results count
    }
};

// ==========================================================================
// BLOG PAGE MODULE
// ==========================================================================

const BlogPage = {
    init: function() {
        if (Utils.getCurrentPage() !== 'blog') return;
        
        this.bindEvents();
    },

    bindEvents: function() {
        const loadMoreBtn = document.querySelector('.load-more button');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.handleLoadMore(loadMoreBtn));
        }
    },

    handleLoadMore: function(button) {
        // Update button state
        button.textContent = CONFIG.LOAD_MORE_MESSAGE;
        button.disabled = true;
        
        // Log analytics
        Utils.logEvent('blog_load_more');
        
        // Simulate loading (replace with actual AJAX call in the future)
        setTimeout(() => {
            button.textContent = CONFIG.NO_MORE_POSTS_MESSAGE;
            button.style.opacity = '0.5';
        }, 1000);
    }
};

// ==========================================================================
// ANIMATIONS MODULE
// ==========================================================================

const Animations = {
    init: function() {
        this.setupIntersectionObserver();
        this.animateOnLoad();
    },

    setupIntersectionObserver: function() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll(
            '.tool-card, .benefit-card, .post-card, .card'
        );
        
        animateElements.forEach(el => {
            this.prepareElementForAnimation(el);
            observer.observe(el);
        });
    },

    prepareElementForAnimation: function(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    },

    animateElement: function(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    },

    animateOnLoad: function() {
        // Add any page load animations here
        document.body.style.opacity = '1';
    }
};

// ==========================================================================
// ANALYTICS MODULE
// ==========================================================================

const Analytics = {
    init: function() {
        this.trackAffiliateClicks();
        this.trackPageViews();
    },

    trackAffiliateClicks: function() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href*="http"]');
            if (link && link.closest('.tool-card')) {
                const toolName = link.closest('.tool-card').querySelector('h3')?.textContent;
                
                Utils.logEvent('affiliate_click', {
                    tool_name: toolName,
                    url: link.href,
                    page: Utils.getCurrentPage()
                });
            }
        });
    },

    trackPageViews: function() {
        Utils.logEvent('page_view', {
            page: Utils.getCurrentPage(),
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
    }
};

// ==========================================================================
// CONTACT FORM MODULE
// ==========================================================================

const ContactForm = {
    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    },

    handleSubmit: async function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');
        
        // Validation
        if (!this.validateForm(fullName, email, subject, message)) {
            return;
        }

        // Show loading state
        this.showLoadingState(form);
        
        try {
            // Prepare data for webhook
            const webhookData = {
                fullName: fullName,
                email: email,
                subject: subject,
                message: message,
                timestamp: new Date().toISOString(),
                source: 'YesIntelligent Contact Form',
                page: window.location.href
            };

            // Send to webhook
            const response = await fetch('https://n8ndroplet.yesintelligent.com/webhook/14c2dfeb-491d-45b6-a4f4-da16b65ddb61', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookData)
            });

            if (response.ok) {
                this.showSuccessMessage(form, fullName);
                form.reset();
                
                // Log analytics event
                Utils.logEvent('contact_form_submit', {
                    page: Utils.getCurrentPage(),
                    fullName: fullName,
                    subject: subject
                });
            } else {
                throw new Error('Server responded with an error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showErrorMessage(form);
        } finally {
            this.hideLoadingState(form);
        }
    },

    validateForm: function(fullName, email, subject, message) {
        // Clear previous error messages
        this.clearValidationErrors();
        
        let isValid = true;
        
        if (!fullName || fullName.trim().length < 2) {
            this.showValidationError('Please enter your full name (at least 2 characters)');
            isValid = false;
        }
        
        if (!email || !this.isValidEmail(email)) {
            this.showValidationError('Please enter a valid email address');
            isValid = false;
        }
        
        if (!subject) {
            this.showValidationError('Please select a subject');
            isValid = false;
        }
        
        if (!message || message.trim().length < 10) {
            this.showValidationError('Please enter a message (at least 10 characters)');
            isValid = false;
        }
        
        return isValid;
    },

    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    clearValidationErrors: function() {
        const messageDiv = document.querySelector('#form-message');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }
    },

    showLoadingState: function(form) {
        const button = form.querySelector('.submit-btn');
        const span = button.querySelector('span');
        const originalText = span.textContent;
        button.dataset.originalText = originalText;
        span.textContent = 'Sending...';
        button.querySelector('i').className = 'fas fa-spinner fa-spin';
        button.disabled = true;
    },

    hideLoadingState: function(form) {
        const button = form.querySelector('.submit-btn');
        const span = button.querySelector('span');
        span.textContent = button.dataset.originalText;
        button.querySelector('i').className = 'fas fa-paper-plane';
        button.disabled = false;
    },

    showSuccessMessage: function(form, name) {
        const messageDiv = form.querySelector('#form-message');
        messageDiv.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <strong>Thank you, ${name}!</strong><br>
                We've received your information and will be in touch with you shortly.
            </div>
        `;
        messageDiv.style.display = 'block';
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    showErrorMessage: function(form) {
        const messageDiv = form.querySelector('#form-message');
        messageDiv.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Oops!</strong> Something went wrong. Please try again or contact us directly at akashkumarnaik948@gmail.com.
            </div>
        `;
        messageDiv.style.display = 'block';
    },

    showValidationError: function(message) {
        const messageDiv = document.querySelector('#form-message');
        if (messageDiv) {
            messageDiv.innerHTML = `
                <div class="validation-error">
                    <i class="fas fa-exclamation-circle"></i>
                    ${message}
                </div>
            `;
            messageDiv.style.display = 'block';
        }
    }
};

// ==========================================================================
// MAIN INITIALIZATION
// ==========================================================================

const YesIntelligent = {
    init: function() {
        // Initialize all modules when DOM is ready
        Navigation.init();
        Newsletter.init();
        ContactForm.init();
        ToolsPage.init();
        BlogPage.init();
        Animations.init();
        Analytics.init();
        
        console.log('YesIntelligent website initialized successfully!');
    }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    YesIntelligent.init();
});

// Expose global namespace for external access if needed
window.YesIntelligent = YesIntelligent;
