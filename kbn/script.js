// --- GLOBAL VARIABLES ---
let cart = null;
let db = null;
let app = null;
let analytics = null;

// --- ENHANCED NOTIFICATION SYSTEM ---
function showEnhancedNotification(message, type = 'success', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1100;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                padding: 12px 16px;
                margin-bottom: 10px;
                border-radius: 8px;
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideInRight 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .toast-success { background: #10b981; }
            .toast-error { background: #ef4444; }
            .toast-warning { background: #f59e0b; }
            .toast-info { background: #3b82f6; }
            .toast-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                opacity: 0.7;
                margin-left: auto;
                padding: 4px;
            }
            .toast-close:hover { opacity: 1; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
    
    return toast;
}

// --- SHOPPING CART CLASS ---
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        this.updateUI();
    }
    
    addItem(product) {
        // Basic validation
        if (!product || !product.name || !product.price) {
            showEnhancedNotification('Invalid product', 'error');
            return false;
        }
        
        const existingIndex = this.items.findIndex(item => 
            item.name === product.name && item.custom === product.custom
        );
        
        if (existingIndex > -1) {
            this.items[existingIndex].quantity += product.quantity;
            showEnhancedNotification(`Updated quantity of ${product.name}`, 'success');
        } else {
            product.id = Date.now().toString();
            this.items.push(product);
            showEnhancedNotification(`${product.quantity} x ${product.name} added to cart!`, 'success');
        }
        
        this.save();
        return true;
    }
    
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            const removedItem = this.items[index];
            this.items.splice(index, 1);
            this.save();
            showEnhancedNotification(`${removedItem.name} removed from cart`, 'warning');
        }
    }
    
    updateQuantity(index, newQuantity) {
        if (index >= 0 && index < this.items.length && newQuantity > 0) {
            this.items[index].quantity = newQuantity;
            this.save();
        } else if (newQuantity < 1) {
            this.removeItem(index);
        }
    }
    
    clear() {
        this.items = [];
        this.save();
        showEnhancedNotification('Cart cleared', 'info');
    }
    
    save() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
        this.updateUI();
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
    
    updateUI() {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartBadge = document.querySelector('.cart-badge');
        
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    getTotal() {
        return this.items.reduce((total, item) => {
            const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
            return total + (price * item.quantity);
        }, 0);
    }
    
    getItems() {
        return this.items;
    }
}

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyC4dTEmXIiGDeIpPmug7D8z1DU2-ZE6kso",
    authDomain: "kbn-printz-store.firebaseapp.com",
    projectId: "kbn-printz-store",
    storageBucket: "kbn-printz-store.firebasestorage.app",
    messagingSenderId: "1067786431485",
    appId: "1:1067786431485:web:83e1db7c5880d952574794",
    measurementId: "G-4SST0WTRMZ"
};

// --- FIREBASE LOADER ---
async function loadFirebase() {
    try {
        // Check if Firebase is already available
        if (window.firebaseApp) {
            console.log("Firebase already loaded");
            return { 
                app: window.firebaseApp, 
                db: window.firebaseDb,
                analytics: window.firebaseAnalytics
            };
        }

        // Dynamically import Firebase
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js');
        const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js');
        
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const analytics = getAnalytics(app);
        
        // Store globally
        window.firebaseApp = app;
        window.firebaseDb = db;
        window.firebaseAnalytics = analytics;
        
        console.log("Firebase + Analytics initialized successfully ✅");
        return { app, db, analytics };
    } catch (error) {
        console.log("Firebase not available, running in offline mode");
        return { app: null, db: null, analytics: null };
    }
}

// --- IMAGE UPLOAD HANDLER ---
function handleImageUpload(event, callback) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showEnhancedNotification('Please upload JPEG, PNG, or GIF images', 'error');
        return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showEnhancedNotification('Image must be smaller than 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => callback(img);
        img.onerror = () => showEnhancedNotification('Error loading image', 'error');
    };
    reader.onerror = () => showEnhancedNotification('Error reading file', 'error');
    reader.readAsDataURL(file);
}

// --- CANVAS UTILITIES ---
function initializeCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with id ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set proper dimensions
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    return { canvas, ctx, width: rect.width, height: rect.height };
}

// --- ADD TO CART LOGIC ---
function setupAddToCart() {
    document.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.btn-primary, #add-keychain-btn, #add-custom-frame-btn');
        if (!addToCartBtn) return;
        
        e.preventDefault();
        
        // Check if cart is ready
        if (!window.KBNPrintz || !window.KBNPrintz.cart()) {
            showEnhancedNotification('Please wait, cart is loading...', 'warning');
            return;
        }
        
        const productElement = addToCartBtn.closest('.product-info, .editor-controls, .product-card');
        if (!productElement) {
            showEnhancedNotification('Product not found', 'error');
            return;
        }
        
        const productInfo = extractProductInfo(productElement);
        if (productInfo) {
            window.KBNPrintz.cart().addItem(productInfo);
        }
    });
}

function extractProductInfo(productElement) {
    try {
        const nameElement = productElement.querySelector('h1, h2, h3');
        const priceElement = productElement.querySelector('.product-price, .price');
        const quantityInput = document.getElementById('quantity') || productElement.querySelector('input[type="number"]');
        
        const productName = nameElement?.textContent?.trim() || 'Custom Product';
        const productPrice = priceElement?.textContent?.trim() || '₹0.00';
        const productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        
        // Check for custom product with image
        const previewCanvas = document.getElementById('preview-canvas');
        const imageUpload = document.getElementById('image-upload');
        let productImage = '';
        
        if (previewCanvas && imageUpload && imageUpload.files.length > 0) {
            productImage = previewCanvas.toDataURL('image/jpeg', 0.8);
        } else {
            const imgElement = productElement.querySelector('.product-image img, img');
            if (imgElement) { 
                productImage = imgElement.src; 
            }
        }
        
        return {
            name: productName,
            price: productPrice,
            quantity: productQuantity,
            image: productImage,
            custom: !!previewCanvas,
            requiresImage: !!imageUpload,
            id: Date.now().toString()
        };
    } catch (error) {
        console.error('Error extracting product info:', error);
        return null;
    }
}

// --- FRAME EDITOR ---
function initializeFrameEditor() {
    if (!document.getElementById('frame-style')) return;
    
    const canvasInfo = initializeCanvas('preview-canvas');
    if (!canvasInfo) return;
    
    const { canvas, ctx } = canvasInfo;
    const imageUpload = document.getElementById('image-upload');
    let uploadedImage = null;

    function drawFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (uploadedImage) {
            ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText('Upload your image to preview', canvas.width / 2, canvas.height / 2);
        }
        
        // Draw frame border
        ctx.strokeStyle = '#8d5524';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    imageUpload?.addEventListener('change', (event) => {
        handleImageUpload(event, (img) => {
            uploadedImage = img;
            drawFrame();
        });
    });

    drawFrame();
}

// --- KEYCHAIN EDITOR ---
function initializeKeychainEditor() {
    if (!document.getElementById('add-keychain-btn')) return;
    
    const canvasInfo = initializeCanvas('preview-canvas');
    if (!canvasInfo) return;
    
    const { canvas, ctx } = canvasInfo;
    const imageUpload = document.getElementById('image-upload');
    let uploadedImage = null;

    function drawKeychain() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (uploadedImage) {
            const ratio = Math.min(canvas.width / uploadedImage.width, canvas.height / uploadedImage.height) * 0.8;
            const width = uploadedImage.width * ratio;
            const height = uploadedImage.height * ratio;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            
            ctx.drawImage(uploadedImage, x, y, width, height);
        } else {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText('Upload your design to preview', canvas.width / 2, canvas.height / 2);
        }
    }

    imageUpload?.addEventListener('change', (event) => {
        handleImageUpload(event, (img) => {
            uploadedImage = img;
            drawKeychain();
        });
    });

    drawKeychain();
}

// --- CART PAGE FUNCTIONALITY ---
function initializeCartPage() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    
    function renderCart() {
        const cart = window.KBNPrintz?.cart();
        const emptyMessage = document.getElementById('empty-cart-message');
        const summary = document.getElementById('cart-summary');
        const subtotal = document.getElementById('cart-subtotal');
        
        if (!cart || cart.getItems().length === 0) {
            container.innerHTML = '';
            if (emptyMessage) emptyMessage.style.display = 'block';
            if (summary) summary.style.display = 'none';
            return;
        }
        
        if (emptyMessage) emptyMessage.style.display = 'none';
        if (summary) summary.style.display = 'block';
        
        container.innerHTML = cart.getItems().map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image || 'https://placehold.co/100x100/f8f9fa/6c757d?text=No+Image'}" alt="${item.name}" loading="lazy">
                </div>
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    ${item.custom ? '<p class="base-price-text">Custom Design</p>' : ''}
                </div>
                <div class="cart-item-quantity">
                    <input type="number" value="${item.quantity}" min="1" 
                           onchange="window.KBNPrintz.cart().updateQuantity(${index}, parseInt(this.value))">
                </div>
                <div class="cart-item-price">
                    ${item.price}
                </div>
                <button class="remove-item-btn" onclick="window.KBNPrintz.cart().removeItem(${index})">
                    ×
                </button>
            </div>
        `).join('');
        
        if (subtotal) {
            subtotal.textContent = `₹${cart.getTotal().toFixed(2)}`;
        }
    }
    
    // Render initial cart
    renderCart();
    
    // Update when cart changes
    window.addEventListener('cartUpdated', renderCart);
}

// --- CHECKOUT PAGE FUNCTIONALITY ---

function initializeCheckoutPage() {
    const container = document.getElementById('summary-items-container');
    if (!container) return;
    // Add this to your existing script.js in the checkout section

// --- CHECKOUT PAGE FUNCTIONALITY ---
function initializeCheckoutPage() {
    const container = document.getElementById('summary-items-container');
    if (!container) return;
    
    function renderOrderSummary() {
        const cart = window.KBNPrintz?.cart();
        const totalElement = document.getElementById('summary-total');
        
        if (!cart || cart.getItems().length === 0) {
            container.innerHTML = '<p>No items in cart</p>';
            if (totalElement) totalElement.textContent = '₹0.00';
            
            // Redirect to cart if empty
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1500);
            return;
        }
        
        container.innerHTML = cart.getItems().map(item => `
            <div class="summary-item">
                <span class="item-name">${item.name} × ${item.quantity}</span>
                <span>${item.price}</span>
            </div>
        `).join('');
        
        if (totalElement) {
            totalElement.textContent = `₹${cart.getTotal().toFixed(2)}`;
        }
    }
    
    // Handle form submission
    const form = document.getElementById('shipping-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const cart = window.KBNPrintz?.cart();
            if (!cart || cart.getItems().length === 0) {
                showEnhancedNotification('Your cart is empty', 'error');
                setTimeout(() => {
                    window.location.href = 'cart.html';
                }, 1500);
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Placing Order...';
            submitBtn.disabled = true;
            
            try {
                // Simulate order processing
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                showEnhancedNotification('Order placed successfully!', 'success');
                cart.clear();
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } catch (error) {
                showEnhancedNotification('Failed to place order', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    renderOrderSummary();
}
    
    function renderOrderSummary() {
        const cart = window.KBNPrintz?.cart();
        const totalElement = document.getElementById('summary-total');
        
        if (!cart || cart.getItems().length === 0) {
            container.innerHTML = '<p>No items in cart</p>';
            if (totalElement) totalElement.textContent = '₹0.00';
            return;
        }
        
        container.innerHTML = cart.getItems().map(item => `
            <div class="summary-item">
                <span class="item-name">${item.name} × ${item.quantity}</span>
                <span>${item.price}</span>
            </div>
        `).join('');
        
        if (totalElement) {
            totalElement.textContent = `₹${cart.getTotal().toFixed(2)}`;
        }
    }
    
    // Handle form submission
    const form = document.getElementById('shipping-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const cart = window.KBNPrintz?.cart();
            if (!cart || cart.getItems().length === 0) {
                showEnhancedNotification('Your cart is empty', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Placing Order...';
            submitBtn.disabled = true;
            
            try {
                // Simulate order processing
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                showEnhancedNotification('Order placed successfully!', 'success');
                cart.clear();
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } catch (error) {
                showEnhancedNotification('Failed to place order', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    renderOrderSummary();
}

// --- MOBILE NAVIGATION ---
function initializeMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open');
        });
    }
}

// --- MAIN INITIALIZATION ---
async function initializeKBNPrintz() {
    try {
        console.log('🚀 Initializing KBN Printz Store...');
        
        // Initialize mobile navigation first
        initializeMobileNavigation();
        
        // Initialize shopping cart (doesn't depend on Firebase)
        cart = new ShoppingCart();
        
        // Initialize AOS animations
        if (typeof AOS !== 'undefined') {
            AOS.init({ 
                once: true, 
                duration: 800,
                offset: 50
            });
        }
        
        // Try to initialize Firebase (optional)
        try {
            const firebase = await loadFirebase();
            app = firebase.app;
            db = firebase.db;
            analytics = firebase.analytics;
        } catch (error) {
            console.log('Firebase initialization skipped - running in offline mode');
        }
        
        // Setup global access
        window.KBNPrintz = {
            cart: () => cart,
            db: () => db,
            analytics: () => analytics,
            showNotification: showEnhancedNotification
        };
        
        // Initialize page-specific functionality
        setupAddToCart();
        initializeFrameEditor();
        initializeKeychainEditor();
        initializeCartPage();
        initializeCheckoutPage();
        
        console.log('✅ KBN Printz Store initialized successfully!');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showEnhancedNotification('Some features may not work properly', 'warning');
    }
}

// --- START APPLICATION ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKBNPrintz);
} else {
    initializeKBNPrintz();
}