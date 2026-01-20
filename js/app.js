// Inaruwa Delivery - Main Application JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const restaurantsSection = document.getElementById('restaurants-section');
    const authModal = document.getElementById('auth-modal');
    const modalTitle = document.getElementById('modal-title');
    const authForm = document.getElementById('auth-form');
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const closeModalBtn = document.getElementById('close-modal');
    const toast = document.getElementById('toast');

    // Sample restaurant data
    const sampleRestaurants = [
        { name: 'Vintage Bites', desc: 'Local favorites and quick bites', img: 'img/r1.jpg', tag: 'Popular' },
        { name: 'Spice Route', desc: 'Authentic spicy curries', img: 'img/r2.jpg', tag: 'Hot' },
        { name: 'Sweet Corner', desc: 'Desserts and beverages', img: 'img/r3.jpg', tag: 'New' },
        { name: 'Green Bowl', desc: 'Healthy salads and bowls', img: 'img/r4.jpg', tag: 'Healthy' },
        { name: 'Grill House', desc: 'Charcoal grilled specials', img: 'img/r5.jpg', tag: 'Chef' },
        { name: 'Cafe Aroma', desc: 'Coffee and light meals', img: 'img/r6.jpg', tag: 'Cozy' }
    ];

    // Search suggestions
    const suggestions = ['Pizza', 'Momo', 'Thali', 'Coffee', 'Burger', 'Salad', 'Dessert', 'Samosa'];

    // State management
    let currentUser = null;
    let authToken = localStorage.getItem('authToken');

    // Initialize app
    initializeApp();

    function initializeApp() {
        loadRestaurants();
        setupEventListeners();
        setupSearchSuggestions();
        checkAuthStatus();
        setupAccessibility();
    }

    // Load restaurants
    function loadRestaurants() {
        restaurantsSection.innerHTML = '';
        sampleRestaurants.forEach(restaurant => {
            const card = createRestaurantCard(restaurant);
            restaurantsSection.appendChild(card);
        });
    }

    // Create restaurant card
    function createRestaurantCard(restaurant) {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
            <div class="thumb" style="background-image: url('${restaurant.img}');" role="img" aria-label="${restaurant.name} restaurant"></div>
            <h3>${restaurant.name}</h3>
            <p>${restaurant.desc}</p>
            <div class="kv">
                <span class="badge">${restaurant.tag}</span>
            </div>
        `;
        return card;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Search functionality
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });

        // Auth modal
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('login');
        });

        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('signup');
        });

        closeModalBtn.addEventListener('click', closeAuthModal);
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });

        // Form submission
        authForm.addEventListener('submit', handleAuthSubmit);

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModal.style.display === 'flex') {
                closeAuthModal();
            }
        });
    }

    // Search functionality
    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            loadRestaurants();
            return;
        }

        const filteredRestaurants = sampleRestaurants.filter(restaurant =>
            restaurant.name.toLowerCase().includes(query) ||
            restaurant.desc.toLowerCase().includes(query) ||
            restaurant.tag.toLowerCase().includes(query)
        );

        displaySearchResults(filteredRestaurants, query);
    }

    // Display search results
    function displaySearchResults(restaurants, query) {
        restaurantsSection.innerHTML = '';

        if (restaurants.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = `No results for "${query}". Try another keyword.`;
            restaurantsSection.appendChild(noResults);
        } else {
            restaurants.forEach(restaurant => {
                const card = createRestaurantCard(restaurant);
                restaurantsSection.appendChild(card);
            });
        }
    }

    // Search suggestions
    function setupSearchSuggestions() {
        let suggestionsBox = null;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();

            // Remove existing suggestions
            if (suggestionsBox) {
                suggestionsBox.remove();
                suggestionsBox = null;
            }

            if (!query) return;

            const matches = suggestions.filter(suggestion =>
                suggestion.toLowerCase().includes(query)
            ).slice(0, 6);

            if (matches.length === 0) return;

            // Create suggestions box
            suggestionsBox = document.createElement('div');
            suggestionsBox.className = 'suggestions';

            matches.forEach(match => {
                const suggestion = document.createElement('div');
                suggestion.textContent = match;
                suggestion.addEventListener('click', () => {
                    searchInput.value = match;
                    suggestionsBox.remove();
                    handleSearch();
                });
                suggestionsBox.appendChild(suggestion);
            });

            // Position suggestions box
            const rect = searchInput.getBoundingClientRect();
            suggestionsBox.style.left = `${rect.left}px`;
            suggestionsBox.style.top = `${rect.bottom + 8}px`;
            suggestionsBox.style.width = `${rect.width}px`;

            document.body.appendChild(suggestionsBox);
        });

        // Hide suggestions on outside click
        document.addEventListener('click', (e) => {
            if (suggestionsBox && !suggestionsBox.contains(e.target) && e.target !== searchInput) {
                suggestionsBox.remove();
                suggestionsBox = null;
            }
        });
    }

    // Authentication modal
    function openAuthModal(mode) {
        modalTitle.textContent = mode === 'login' ? 'Login' : 'Sign Up';
        authForm.reset();
        clearFormErrors();
        authModal.style.display = 'flex';
        authModal.setAttribute('aria-hidden', 'false');

        // Focus management
        setTimeout(() => {
            document.getElementById('email').focus();
        }, 100);
    }

    function closeAuthModal() {
        authModal.style.display = 'none';
        authModal.setAttribute('aria-hidden', 'true');
    }

    // Authentication form handling
    async function handleAuthSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const isSignup = modalTitle.textContent === 'Sign Up';

        clearFormErrors();

        try {
            const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                authToken = data.token;
                localStorage.setItem('authToken', authToken);
                currentUser = data.user;

                closeAuthModal();
                showToast(`Welcome${isSignup ? '' : ' back'}, ${currentUser.email.split('@')[0]}!`);
                updateAuthUI();
            } else {
                // Handle errors
                if (data.errors) {
                    displayFormErrors(data.errors);
                } else {
                    showToast(data.message || 'Authentication failed', 'error');
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            showToast('Network error. Please try again.', 'error');
        }
    }

    // Form error handling
    function displayFormErrors(errors) {
        errors.forEach(error => {
            const errorElement = document.getElementById(`${error.param}-error`);
            if (errorElement) {
                errorElement.textContent = error.msg;
            }
        });
    }

    function clearFormErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
    }

    // Check authentication status
    async function checkAuthStatus() {
        if (!authToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                updateAuthUI();
            } else {
                // Token invalid, clear it
                localStorage.removeItem('authToken');
                authToken = null;
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    // Update UI based on auth status
    function updateAuthUI() {
        if (currentUser) {
            loginLink.textContent = 'Logout';
            loginLink.removeEventListener('click', openAuthModal);
            loginLink.addEventListener('click', handleLogout);
            signupLink.style.display = 'none';
        } else {
            loginLink.textContent = 'Login';
            loginLink.removeEventListener('click', handleLogout);
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                openAuthModal('login');
            });
            signupLink.style.display = 'inline';
        }
    }

    // Logout handling
    async function handleLogout(e) {
        e.preventDefault();

        try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;
        updateAuthUI();
        showToast('Logged out successfully');
    }

    // Toast notifications
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // Accessibility improvements
    function setupAccessibility() {
        // Add skip link
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main landmark
        const main = document.querySelector('main');
        if (main) {
            main.id = 'main';
            main.setAttribute('role', 'main');
        }

        // Improve form accessibility
        document.getElementById('email').setAttribute('autocomplete', modalTitle.textContent === 'Sign Up' ? 'username' : 'email');
        document.getElementById('password').setAttribute('autocomplete', 'current-password');
    }

    // Lazy load hero background
    function lazyLoadHero() {
        const hero = document.querySelector('.hero');
        if (hero) {
            const img = new Image();
            img.src = 'img/bg.jpg';
            img.onload = () => {
                hero.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4)), url('${img.src}')`;
            };
        }
    }

    // Initialize lazy loading
    lazyLoadHero();
});