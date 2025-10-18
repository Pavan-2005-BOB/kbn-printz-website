// --- 1. FIREBASE IMPORTS & CONFIGURATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4dTEmXIiGDeIpPmug7D8z1DU2-ZE6kso",
    authDomain: "kbn-printz-store.firebaseapp.com",
    projectId: "kbn-printz-store",
    storageBucket: "kbn-printz-store.appspot.com",
    messagingSenderId: "1067786431485",
    appId: "1:1067786431485:web:83e1db7c5880d952574794"
};

// Initialize Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
}

// Form Validator Class
class FormValidator {
    static validateShippingForm(formData) {
        const errors = {};
        const data = {};

        // Name validation
        const name = formData.get('full-name')?.toString().trim() || '';
        if (!name) {
            errors.name = 'Full name is required';
        } else if (name.length < 2) {
            errors.name = 'Name must be at least 2 characters';
        } else if (name.length > 100) {
            errors.name = 'Name must be less than 100 characters';
        } else {
            data.name = name.replace(/\s+/g, ' ');
        }

        // Email validation
        const email = formData.get('email')?.toString().trim().toLowerCase() || '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
            errors.email = 'Please enter a valid email address';
        } else if (email.length > 254) {
            errors.email = 'Email must be less than 254 characters';
        } else {
            data.email = email;
        }

        // Address validation
        const address = formData.get('address')?.toString().trim() || '';
        if (!address) {
            errors.address = 'Address is required';
        } else if (address.length < 10) {
            errors.address = 'Please enter a complete address (at least 10 characters)';
        } else if (address.length > 500) {
            errors.address = 'Address must be less than 500 characters';
        } else {
            data.address = address.replace(/\s+/g, ' ');
        }

        // Phone validation
        const phone = formData.get('phone')?.toString().trim() || '';
        const digitsOnly = phone.replace(/[^\d+]/g, '');
        if (!phone) {
            errors.phone = 'Phone number is required';
        } else if (digitsOnly.length < 10) {
            errors.phone = 'Please enter a valid phone number (at least 10 digits)';
        } else if (digitsOnly.length > 15) {
            errors.phone = 'Phone number is too long';
        } else {
            data.phone = digitsOnly;
        }

        return {
            isValid: Object.keys(errors).length === 0,
            data,
            errors
        };
    }
}

// Main Shopping Cart Manager Class
class ShoppingCartManager {
    constructor() {
        this.cart = this.getCartFromStorage();
        this.init();
    }

    init() {
        console.log('🛒 KBN Printz Store initialized ✅');
        this.setupEventListeners();
        this.updateCartIcon();
        
        // Initial renders
        this.renderCart();
        this.renderOrderSummary();
    }

    // --- CART MANAGEMENT ---
    getCartFromStorage() {
        try {
            const cartData = localStorage.getItem('shoppingCart');
            if (!cartData || cartData === 'null' || cartData === 'undefined') {
                return [];
            }
            return JSON.parse(cartData);
        } catch (error) {
            console.error('Error reading cart from storage:', error);
            return [];
        }
    }

    saveCartToStorage() {
        try {
            localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    addToCart(product) {
        if (!product || typeof product !== 'object') {
            console.error('Invalid product data:', product);
            return false;
        }

        // For custom products, always add as new item
        if (product.custom) {
            this.cart.push(product);
        } else {
            // For regular products, combine quantities
            const existingProductIndex = this.cart.findIndex(item => 
                item.name === product.name && !item.custom
            );
            
            if (existingProductIndex > -1) {
                this.cart[existingProductIndex].quantity += product.quantity;
            } else {
                this.cart.push(product);
            }
        }

        this.saveCartToStorage();
        this.updateCartIcon();
        return true;
    }

    removeFromCart(index) {
        if (index >= 0 && index < this.cart.length) {
            this.cart.splice(index, 1);
            this.saveCartToStorage();
            this.updateCartIcon();
            return true;
        }
        return false;
    }

    updateQuantity(index, newQuantity) {
        if (index >= 0 && index < this.cart.length) {
            if (newQuantity > 0) {
                this.cart[index].quantity = newQuantity;
            } else {
                this.removeFromCart(index);
                return false;
            }
            this.saveCartToStorage();
            this.updateCartIcon();
            return true;
        }
        return false;
    }

    getCartTotal() {
        return this.cart.reduce((total, product) => {
            let price = 0;
            try {
                if (typeof product.price === 'string') {
                    price = parseFloat(product.price.replace('₹', '').replace(',', '')) || 0;
                } else if (typeof product.price === 'number') {
                    price = product.price;
                }
            } catch (error) {
                console.error('Error parsing price:', error);
                price = 0;
            }
            return total + (price * product.quantity);
        }, 0);
    }

    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartIcon();
    }

    // --- UI UPDATES ---
    updateCartIcon() {
        const cartBadge = document.querySelector('.cart-badge');
        if (!cartBadge) return;

        const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        if (totalItems > 0) {
            cartBadge.textContent = totalItems > 99 ? '99+' : totalItems;
            cartBadge.classList.add('show');
        } else {
            cartBadge.classList.remove('show');
        }
    }

    renderCart() {
        const cartItemsContainer = document.getElementById('cart-items-container');
        if (!cartItemsContainer) return;

        const emptyCartMessage = document.getElementById('empty-cart-message');
        const cartSummary = document.getElementById('cart-summary');
        const cartSubtotalEl = document.getElementById('cart-subtotal');

        cartItemsContainer.innerHTML = '';

        if (this.cart.length === 0) {
            if (emptyCartMessage) emptyCartMessage.style.display = 'block';
            if (cartSummary) cartSummary.style.display = 'none';
            return;
        }

        if (emptyCartMessage) emptyCartMessage.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'flex';

        this.cart.forEach((product, index) => {
            let priceAsNumber = 0;
            try {
                priceAsNumber = parseFloat(product.price.toString().replace('₹', '').replace(',', '')) || 0;
            } catch (error) {
                console.error('Error parsing price:', error);
                priceAsNumber = 0;
            }
            const itemTotal = priceAsNumber * product.quantity;
            
            const cartItemHTML = `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-image">
                        <img src="${product.image || ''}" alt="${product.name || 'Product'}" loading="lazy">
                    </div>
                    <div class="cart-item-details">
                        <h3>${this.escapeHtml(product.name || 'Unnamed Product')}</h3>
                        ${product.baseprice ? `<p class="base-price-text">${this.escapeHtml(product.baseprice)}</p>` : ''}
                        <p class="item-price">Price: ${product.price || '₹0.00'}</p>
                        ${product.custom ? '<p class="custom-badge">Custom Design</p>' : ''}
                    </div>
                    <div class="cart-item-quantity">
                        <input type="number" value="${product.quantity || 1}" min="1" data-index="${index}">
                    </div>
                    <p class="cart-item-total">₹${itemTotal.toFixed(2)}</p>
                    <button class="remove-item-btn" data-index="${index}" aria-label="Remove item">
                        &times;
                    </button>
                </div>
            `;
            cartItemsContainer.innerHTML += cartItemHTML;
        });

        if (cartSubtotalEl) {
            cartSubtotalEl.textContent = `₹${this.getCartTotal().toFixed(2)}`;
        }
    }

    renderOrderSummary() {
        const summaryItemsContainer = document.getElementById('summary-items-container');
        const summaryTotalEl = document.getElementById('summary-total');

        if (!summaryItemsContainer) return;

        summaryItemsContainer.innerHTML = '';

        this.cart.forEach(product => {
            let priceAsNumber = 0;
            try {
                priceAsNumber = parseFloat(product.price.toString().replace('₹', '').replace(',', '')) || 0;
            } catch (error) {
                console.error('Error parsing price:', error);
                priceAsNumber = 0;
            }
            const itemTotal = priceAsNumber * product.quantity;
            
            const summaryItemHTML = `
                <div class="summary-item">
                    <span class="item-name">${this.escapeHtml(product.name)} ${product.custom ? '(Custom)' : ''} (x${product.quantity})</span>
                    <span class="item-price">₹${itemTotal.toFixed(2)}</span>
                </div>
            `;
            summaryItemsContainer.innerHTML += summaryItemHTML;
        });

        if (summaryTotalEl) {
            summaryTotalEl.textContent = `₹${this.getCartTotal().toFixed(2)}`;
        }
    }

    // --- UTILITIES ---
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    getProductDataFromForm() {
        const addToCartButton = document.querySelector('.product-actions .btn-primary, #add-keychain-btn, #add-custom-frame-btn');
        if (!addToCartButton) return null;

        const productInfo = addToCartButton.closest('.product-info, .editor-controls');
        if (!productInfo) return null;

        const productName = productInfo.querySelector('h1')?.textContent || 'Unnamed Product';
        const productPrice = productInfo.querySelector('.product-price')?.textContent || '₹0.00';
        const quantityInput = document.getElementById('quantity');
        const productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        let productImage = '';
        const previewCanvas = document.getElementById('preview-canvas') || document.getElementById('keychain-preview-canvas');

        if (previewCanvas && document.getElementById('image-upload')?.files.length > 0) {
            productImage = previewCanvas.toDataURL('image/jpeg', 0.9);
        } else {
            const imgElement = document.querySelector('.product-image img');
            productImage = imgElement?.src || '';
        }

        // Validate custom product image
        if ((document.getElementById('image-upload')) && !productImage) {
            this.showNotification('Please upload an image before adding to cart!', 'error');
            return null;
        }

        return {
            name: productName,
            price: productPrice,
            quantity: productQuantity,
            image: productImage,
            custom: !!previewCanvas,
            baseprice: productInfo.querySelector('.product')?.textContent?.trim() || null
        };
    }

    // --- FORM ERROR DISPLAY ---
    displayFormErrors(errors) {
        this.clearFormErrors();
        
        Object.entries(errors).forEach(([field, message]) => {
            const inputElement = document.querySelector(`[name="${field}"]`);
            if (inputElement) {
                inputElement.classList.add('error');
                
                let errorElement = inputElement.parentNode.querySelector('.error-message');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    inputElement.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = message;
            }
        });
        
        const firstErrorField = document.querySelector('.error');
        if (firstErrorField) {
            firstErrorField.focus();
        }
    }

    clearFormErrors() {
        document.querySelectorAll('.error').forEach(element => {
            element.classList.remove('error');
        });
        
        document.querySelectorAll('.error-message').forEach(element => {
            element.remove();
        });
    }

    // --- NOTIFICATION SYSTEM ---
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.custom-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `custom-notification custom-notification--${type}`;
        notification.innerHTML = `
            <span class="custom-notification__message">${message}</span>
            <button class="custom-notification__close">&times;</button>
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('custom-notification--show');
        });

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Close button handler
        notification.querySelector('.custom-notification__close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.classList.remove('custom-notification--show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }

    // --- EVENT HANDLERS ---
    setupEventListeners() {
        this.setupAddToCartHandler();
        this.setupCartHandlers();
        this.setupCheckoutHandler();
        this.setupNavigation();
    }

    setupAddToCartHandler() {
        const addToCartButton = document.querySelector('.product-actions .btn-primary, #add-keychain-btn, #add-custom-frame-btn');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', () => {
                const productData = this.getProductDataFromForm();
                if (productData) {
                    const success = this.addToCart(productData);
                    if (success) {
                        this.showNotification(`${productData.quantity} x ${productData.name} has been added to your cart!`, 'success');
                    }
                }
            });
        }
    }

    setupCartHandlers() {
        const cartItemsContainer = document.getElementById('cart-items-container');
        if (!cartItemsContainer) return;

        // Remove item handler
        cartItemsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-item-btn')) {
                const index = parseInt(event.target.dataset.index);
                if (this.removeFromCart(index)) {
                    this.renderCart();
                    this.showNotification('Item removed from cart', 'info');
                }
            }
        });

        // Quantity change handler
        cartItemsContainer.addEventListener('change', (event) => {
            if (event.target.matches('input[type="number"]')) {
                const index = parseInt(event.target.dataset.index);
                const newQuantity = parseInt(event.target.value) || 1;
                
                if (this.updateQuantity(index, newQuantity)) {
                    this.renderCart();
                }
            }
        });
    }

    setupCheckoutHandler() {
        const shippingForm = document.getElementById('shipping-form');
        if (!shippingForm) return;

        shippingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            if (this.cart.length === 0) {
                this.showNotification("Your cart is empty. Please add items before placing an order.", 'error');
                return;
            }

            // Check Firebase connection
            if (!db) {
                this.showNotification("Database connection error. Please refresh the page and try again.", 'error');
                return;
            }

            // Create FormData object from the form
            const formData = new FormData(shippingForm);

            // Validate form data
            const validationResult = FormValidator.validateShippingForm(formData);

            if (!validationResult.isValid) {
                this.displayFormErrors(validationResult.errors);
                return;
            }

            const shippingDetails = validationResult.data;

            const order = {
                shipping: shippingDetails,
                items: this.cart,
                total: this.getCartTotal(),
                createdAt: serverTimestamp(),
                status: 'pending',
                orderId: this.generateOrderId()
            };

            try {
                // Show loading state
                const submitButton = shippingForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.innerHTML = '<div class="btn-spinner"></div> Placing Order...';
                submitButton.disabled = true;

                // Save to Firestore
                await addDoc(collection(db, "orders"), order);
                
                // Clear cart and redirect
                this.clearCart();
                this.showNotification('Order placed successfully! Thank you for your purchase.', 'success');
                
                // Redirect to thank you page after a short delay
                setTimeout(() => {
                    window.location.href = 'thank-you.html';
                }, 2000);

            } catch (error) {
                console.error("Error placing order:", error);
                this.showNotification("There was an error placing your order. Please try again.", 'error');
                
                // Reset button state
                const submitButton = shippingForm.querySelector('button[type="submit"]');
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    setupNavigation() {
        // AOS initialization
        if (typeof AOS !== 'undefined') {
            AOS.init({ 
                once: true, 
                duration: 800,
                offset: 100 
            });
        }

        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const mainNav = document.querySelector('#main-nav');
        if (navToggle && mainNav) {
            navToggle.addEventListener('click', () => {
                mainNav.classList.toggle('is-open');
                navToggle.classList.toggle('is-open');
                document.body.style.overflow = mainNav.classList.contains('is-open') ? 'hidden' : '';
            });
        }

        // Close mobile menu when clicking on links
        const navLinks = document.querySelectorAll('#main-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav?.classList.remove('is-open');
                navToggle?.classList.remove('is-open');
                document.body.style.overflow = '';
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            if (mainNav?.classList.contains('is-open') && 
                !mainNav.contains(event.target) && 
                !navToggle.contains(event.target)) {
                mainNav.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                document.body.style.overflow = '';
            }
        });
    }

    // --- HELPER METHODS ---
    generateOrderId() {
        return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShoppingCartManager();
});

// Export for potential use in other modules
export { ShoppingCartManager };