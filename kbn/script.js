// --- SAFE FIREBASE IMPORT WITH ERROR HANDLING ---
let firebaseInitialized = false;

async function loadFirebase() {
    try {
        // Check if Firebase is already loaded
        if (typeof initializeApp !== 'undefined' && window.firebaseApp) {
            console.log("Firebase already loaded, reusing existing instance");
            return window.firebaseApp;
        }

        // Dynamically import Firebase v9
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js');
        
        const firebaseConfig = {
            apiKey: "AIzaSyC4dTEmXIiGDeIpPmug7D8z1DU2-ZE6kso",
            authDomain: "kbn-printz-store.firebaseapp.com",
            projectId: "kbn-printz-store",
            storageBucket: "kbn-printz-store.appspot.com",
            messagingSenderId: "1067786431485",
            appId: "1:1067786431485:web:83e1db7c5880d952574794"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Store globally to prevent re-initialization
        window.firebaseApp = app;
        window.firebaseDb = db;
        firebaseInitialized = true;
        
        console.log("Firebase v9+ initialized successfully ✅");
        return { app, db };
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Continue without Firebase - offline mode
        return { app: null, db: null };
    }
}

// --- GLOBAL VARIABLES ---
let cart = null;
let db = null;
let app = null;

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
            }
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

// --- SHOPPING CART CLASS (SIMPLIFIED) ---
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
        } else {
            product.id = Date.now().toString();
            this.items.push(product);
        }
        
        this.save();
        showEnhancedNotification(`${product.quantity} x ${product.name} added to cart!`, 'success');
        return true;
    }
    
    removeItem(index) {
        this.items.splice(index, 1);
        this.save();
        showEnhancedNotification('Item removed from cart', 'warning');
    }
    
    save() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
        this.updateUI();
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

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => callback(img);
        img.onerror = () => showEnhancedNotification('Error loading image', 'error');
    };
    reader.readAsDataURL(file);
}

// --- CANVAS UTILITIES ---
function initializeCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
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
        if (!addToCartBtn || !cart) return;
        
        e.preventDefault();
        
        const productElement = addToCartBtn.closest('.product-info, .editor-controls, .product-card');
        if (!productElement) {
            showEnhancedNotification('Product not found', 'error');
            return;
        }
        
        const productInfo = extractProductInfo(productElement);
        if (productInfo) {
            cart.addItem(productInfo);
        }
    });
}

function extractProductInfo(productElement) {
    try {
        const nameElement = productElement.querySelector('h1, h2, h3');
        const priceElement = productElement.querySelector('.product-price, .price');
        const quantityInput = document.getElementById('quantity');
        
        return {
            name: nameElement?.textContent?.trim() || 'Custom Product',
            price: priceElement?.textContent?.trim() || '₹0.00',
            quantity: quantityInput ? parseInt(quantityInput.value) || 1 : 1,
            image: productElement.querySelector('img')?.src || '',
            custom: !!document.getElementById('preview-canvas')
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
        
        // Draw placeholder or image
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
            // Simple centered image
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
    if (!document.getElementById('cart-items-container')) return;
    
    function renderCart() {
        const container = document.getElementById('cart-items-container');
        const emptyMessage = document.getElementById('empty-cart-message');
        const summary = document.getElementById('cart-summary');
        const subtotal = document.getElementById('cart-subtotal');
        
        if (!cart || cart.items.length === 0) {
            container.innerHTML = '';
            emptyMessage.style.display = 'block';
            summary.style.display = 'none';
            return;
        }
        
        emptyMessage.style.display = 'none';
        summary.style.display = 'block';
        
        container.innerHTML = cart.items.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image || 'https://placehold.co/100x100/f8f9fa/6c757d?text=No+Image'}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    ${item.custom ? '<p class="base-price-text">Custom Design</p>' : ''}
                </div>
                <div class="cart-item-quantity">
                    <input type="number" value="${item.quantity}" min="1" 
                           onchange="cart.updateQuantity(${index}, parseInt(this.value))">
                </div>
                <div class="cart-item-price">
                    ${item.price}
                </div>
                <button class="remove-item-btn" onclick="cart.removeItem(${index})">
                    ×
                </button>
            </div>
        `).join('');
        
        subtotal.textContent = `₹${cart.getTotal().toFixed(2)}`;
    }
    
    // Render initial cart
    renderCart();
    
    // Update when cart changes
    window.addEventListener('storage', renderCart);
    window.addEventListener('cartUpdated', renderCart);
}

// --- CHECKOUT PAGE FUNCTIONALITY ---
function initializeCheckoutPage() {
    if (!document.getElementById('summary-items-container')) return;
    
    function renderOrderSummary() {
        const container = document.getElementById('summary-items-container');
        const totalElement = document.getElementById('summary-total');
        
        if (!cart || cart.items.length === 0) {
            container.innerHTML = '<p>No items in cart</p>';
            totalElement.textContent = '₹0.00';
            return;
        }
        
        container.innerHTML = cart.items.map(item => `
            <div class="summary-item">
                <span class="item-name">${item.name} × ${item.quantity}</span>
                <span>${item.price}</span>
            </div>
        `).join('');
        
        totalElement.textContent = `₹${cart.getTotal().toFixed(2)}`;
    }
    
    // Handle form submission
    const form = document.getElementById('shipping-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!cart || cart.items.length === 0) {
                showEnhancedNotification('Your cart is empty', 'error');
                return;
            }
            
            showEnhancedNotification('Order placed successfully!', 'success');
            cart.clear();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        });
    }
    
    renderOrderSummary();
}

// --- MAIN INITIALIZATION ---
async function initializeKBNPrintz() {
    try {
        console.log('🚀 Initializing KBN Printz Store...');
        
        // Initialize Firebase (optional - works offline too)
        try {
            const firebase = await loadFirebase();
            app = firebase.app;
            db = firebase.db;
        } catch (error) {
            console.log('Firebase not available, running in offline mode');
        }
        
        // Initialize shopping cart
        cart = new ShoppingCart();
        
        // Initialize AOS animations
        if (typeof AOS !== 'undefined') {
            AOS.init({ 
                once: true, 
                duration: 800,
                offset: 50
            });
        }
        
        // Mobile navigation
        const navToggle = document.querySelector('.nav-toggle');
        const mainNav = document.querySelector('.main-nav');
        if (navToggle && mainNav) {
            navToggle.addEventListener('click', () => {
                mainNav.classList.toggle('is-open');
                navToggle.classList.toggle('is-open');
            });
        }
        
        // Initialize page-specific functionality
        setupAddToCart();
        initializeFrameEditor();
        initializeKeychainEditor();
        initializeCartPage();
        initializeCheckoutPage();
        
        console.log('✅ KBN Printz Store initialized successfully!');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showEnhancedNotification('Page loaded with limited functionality', 'warning');
    }
}

// --- START APPLICATION ---
document.addEventListener('DOMContentLoaded', initializeKBNPrintz);

// --- GLOBAL ACCESS ---
window.KBNPrintz = {
    cart: () => cart,
    showNotification: showEnhancedNotification
};