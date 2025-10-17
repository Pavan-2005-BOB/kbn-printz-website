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

// --- SAFE FIREBASE IMPORT WITH ERROR HANDLING ---
let firebaseInitialized = false;
let app = null;
let analytics = null;
let db = null;

async function loadFirebase() {
    try {
        // Check if Firebase is already loaded
        if (window.firebaseApp) {
            console.log("Firebase already loaded, reusing existing instance");
            return { 
                app: window.firebaseApp, 
                analytics: window.firebaseAnalytics, 
                db: window.firebaseDb 
            };
        }

        // Dynamically import Firebase v12.4.0
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js');
        const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        
        app = initializeApp(firebaseConfig);
        analytics = getAnalytics(app);
        db = getFirestore(app);
        
        // Store globally to prevent re-initialization
        window.firebaseApp = app;
        window.firebaseAnalytics = analytics;
        window.firebaseDb = db;
        firebaseInitialized = true;
        
        console.log("Firebase v12.4.0 initialized successfully ✅");
        return { app, analytics, db };
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Continue without Firebase - offline mode
        return { app: null, analytics: null, db: null };
    }
}

// --- GLOBAL VARIABLES ---
let cart = null;

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
                font-family: 'Poppins', sans-serif;
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
                border-radius: 4px;
                transition: opacity 0.2s;
            }
            .toast-close:hover {
                opacity: 1;
                background: rgba(255,255,255,0.1);
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
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
    
    return toast;
}

// --- SHOPPING CART CLASS (ENHANCED) ---
class ShoppingCart {
    constructor() {
        this.items = this.loadFromStorage();
        this.updateUI();
    }
    
    loadFromStorage() {
        try {
            return JSON.parse(localStorage.getItem('shoppingCart')) || [];
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            return [];
        }
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
        if (index < 0 || index >= this.items.length) return;
        
        const itemName = this.items[index].name;
        this.items.splice(index, 1);
        this.save();
        showEnhancedNotification(`${itemName} removed from cart`, 'warning');
    }
    
    updateQuantity(index, newQuantity) {
        if (index < 0 || index >= this.items.length) return;
        
        if (newQuantity < 1) {
            this.removeItem(index);
            return;
        }
        this.items[index].quantity = newQuantity;
        this.save();
    }
    
    clear() {
        this.items = [];
        this.save();
        showEnhancedNotification('Cart cleared', 'info');
    }
    
    save() {
        try {
            localStorage.setItem('shoppingCart', JSON.stringify(this.items));
            this.updateUI();
            
            // Trigger custom event for other pages
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
            showEnhancedNotification('Error saving cart data', 'error');
        }
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
        return [...this.items]; // Return copy to prevent direct mutation
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
}

// --- IMAGE UPLOAD HANDLER ---
function handleImageUpload(event, callback) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
        showEnhancedNotification('Please upload JPEG, PNG, GIF, or WebP images only', 'error');
        return;
    }
    
    if (file.size > maxSize) {
        showEnhancedNotification('Image size should be less than 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            showEnhancedNotification('Image uploaded successfully!', 'success');
            callback(img);
        };
        img.onerror = () => showEnhancedNotification('Error loading image', 'error');
    };
    reader.onerror = () => showEnhancedNotification('Error reading file', 'error');
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
        const addToCartBtn = e.target.closest('.btn-primary, #add-keychain-btn, #add-custom-frame-btn, .add-to-cart-btn');
        if (!addToCartBtn || !cart) return;
        
        e.preventDefault();
        
        const productElement = addToCartBtn.closest('.product-info, .editor-controls, .product-card, .product-details');
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
        const nameElement = productElement.querySelector('h1, h2, h3, .product-name');
        const priceElement = productElement.querySelector('.product-price, .price, .product-cost');
        const quantityInput = document.getElementById('quantity') || productElement.querySelector('.quantity-input');
        
        // Get product image
        let image = '';
        const imgElement = productElement.querySelector('img');
        if (imgElement) {
            image = imgElement.src;
        }
        
        return {
            name: nameElement?.textContent?.trim() || 'Custom Product',
            price: priceElement?.textContent?.trim() || '₹0.00',
            quantity: quantityInput ? parseInt(quantityInput.value) || 1 : 1,
            image: image,
            custom: !!document.getElementById('preview-canvas'),
            timestamp: new Date().toISOString()
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
            // Draw image with aspect ratio preservation
            const scale = Math.min(canvas.width / uploadedImage.width, canvas.height / uploadedImage.height);
            const width = uploadedImage.width * scale;
            const height = uploadedImage.height * scale;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            
            ctx.drawImage(uploadedImage, x, y, width, height);
        } else {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Poppins, sans-serif';
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
            // Draw circular keychain design
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(canvas.width, canvas.height) * 0.4;
            
            // Create circular clipping path
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();
            
            // Draw image within circle
            const scale = Math.min(radius * 2 / uploadedImage.width, radius * 2 / uploadedImage.height);
            const width = uploadedImage.width * scale;
            const height = uploadedImage.height * scale;
            const x = centerX - width / 2;
            const y = centerY - height / 2;
            
            ctx.drawImage(uploadedImage, x, y, width, height);
            ctx.restore();
            
            // Draw keychain ring
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY - radius - 15, 10, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Poppins, sans-serif';
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
        const checkoutBtn = document.getElementById('proceed-to-checkout');
        const continueShoppingBtn = document.getElementById('continue-shopping');
        
        // Load cart data directly from storage for reliability
        const cartItems = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        
        if (!cartItems || cartItems.length === 0) {
            if (container) container.innerHTML = '';
            if (emptyMessage) emptyMessage.style.display = 'block';
            if (summary) summary.style.display = 'none';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            return;
        }
        
        if (emptyMessage) emptyMessage.style.display = 'none';
        if (summary) summary.style.display = 'block';
        if (checkoutBtn) checkoutBtn.style.display = 'block';
        
        if (container) {
            container.innerHTML = cartItems.map((item, index) => `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image || 'https://placehold.co/100x100/f8f9fa/6c757d?text=No+Image'}" 
                             alt="${item.name}" 
                             onerror="this.src='https://placehold.co/100x100/f8f9fa/6c757d?text=No+Image'">
                    </div>
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        ${item.custom ? '<p class="base-price-text">Custom Design</p>' : ''}
                        <p class="item-price">${item.price}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="cart.updateQuantity(${index}, ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" 
                               onchange="cart.updateQuantity(${index}, parseInt(this.value))">
                        <button class="quantity-btn" onclick="cart.updateQuantity(${index}, ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-price">
                        ${item.price}
                    </div>
                    <button class="remove-item-btn" onclick="cart.removeItem(${index})" title="Remove item">
                        ×
                    </button>
                </div>
            `).join('');
        }
        
        if (subtotal) {
            const total = cartItems.reduce((sum, item) => {
                const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
                return sum + (price * item.quantity);
            }, 0);
            subtotal.textContent = `₹${total.toFixed(2)}`;
        }
        
        // Update checkout button
        if (checkoutBtn) {
            checkoutBtn.onclick = function(e) {
                e.preventDefault();
                if (cartItems.length > 0) {
                    window.location.href = 'checkout.html';
                } else {
                    showEnhancedNotification('Your cart is empty', 'error');
                }
            };
        }
        
        // Continue shopping button
        if (continueShoppingBtn) {
            continueShoppingBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = 'products.html';
            };
        }
    }
    
    // Render initial cart
    renderCart();
    
    // Update when cart changes
    window.addEventListener('cartUpdated', renderCart);
    window.addEventListener('storage', renderCart);
}

// --- CHECKOUT PAGE FUNCTIONALITY ---
function initializeCheckoutPage() {
    if (!document.getElementById('summary-items-container')) return;
    
    function renderOrderSummary() {
        const container = document.getElementById('summary-items-container');
        const totalElement = document.getElementById('summary-total');
        const emptyCheckout = document.getElementById('empty-checkout-message');
        const checkoutForm = document.getElementById('shipping-form');
        const subtotalElement = document.getElementById('checkout-subtotal');
        const taxElement = document.getElementById('checkout-tax');
        const shippingElement = document.getElementById('checkout-shipping');
        
        // Load cart data directly from localStorage
        const cartItems = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        
        if (!cartItems || cartItems.length === 0) {
            if (container) container.innerHTML = '<p class="text-muted">No items in cart</p>';
            if (totalElement) totalElement.textContent = '₹0.00';
            if (subtotalElement) subtotalElement.textContent = '₹0.00';
            if (taxElement) taxElement.textContent = '₹0.00';
            if (shippingElement) shippingElement.textContent = '₹0.00';
            if (emptyCheckout) emptyCheckout.style.display = 'block';
            if (checkoutForm) checkoutForm.style.display = 'none';
            return;
        }
        
        if (emptyCheckout) emptyCheckout.style.display = 'none';
        if (checkoutForm) checkoutForm.style.display = 'block';
        
        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => {
            const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
            return sum + (price * item.quantity);
        }, 0);
        
        const tax = subtotal * 0.18; // 18% GST
        const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
        const total = subtotal + tax + shipping;
        
        if (container) {
            container.innerHTML = cartItems.map(item => `
                <div class="summary-item">
                    <span class="item-name">${item.name} ${item.custom ? '(Custom)' : ''} × ${item.quantity}</span>
                    <span class="item-price">${item.price}</span>
                </div>
            `).join('');
        }
        
        if (subtotalElement) subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `₹${tax.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `₹${total.toFixed(2)}`;
    }
    
    // Handle form submission
    const form = document.getElementById('shipping-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const cartItems = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            if (cartItems.length === 0) {
                showEnhancedNotification('Your cart is empty', 'error');
                return;
            }
            
            // Validate form
            const formData = new FormData(form);
            const customerInfo = Object.fromEntries(formData);
            
            // Basic validation
            const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'pincode'];
            const missingFields = requiredFields.filter(field => !customerInfo[field]?.trim());
            
            if (missingFields.length > 0) {
                showEnhancedNotification('Please fill all required fields', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerInfo.email)) {
                showEnhancedNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Phone validation
            const phoneRegex = /^[0-9]{10}$/;
            const cleanPhone = customerInfo.phone.replace(/\D/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                showEnhancedNotification('Please enter a valid 10-digit phone number', 'error');
                return;
            }
            
            // Pincode validation
            const pincodeRegex = /^[0-9]{6}$/;
            if (!pincodeRegex.test(customerInfo.pincode)) {
                showEnhancedNotification('Please enter a valid 6-digit pincode', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            try {
                // Calculate final totals
                const subtotal = cartItems.reduce((sum, item) => {
                    const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
                    return sum + (price * item.quantity);
                }, 0);
                const tax = subtotal * 0.18;
                const shipping = subtotal > 500 ? 0 : 50;
                const total = subtotal + tax + shipping;
                
                // Create order data
                const orderData = {
                    customerInfo: customerInfo,
                    items: cartItems,
                    subtotal: `₹${subtotal.toFixed(2)}`,
                    tax: `₹${tax.toFixed(2)}`,
                    shipping: shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`,
                    total: `₹${total.toFixed(2)}`,
                    orderDate: new Date().toISOString(),
                    orderId: 'KBN' + Date.now(),
                    status: 'confirmed'
                };
                
                // Save order to localStorage
                localStorage.setItem('kbnOrders', JSON.stringify(orderData));
                
                // Try to save to Firebase if available
                if (db) {
                    try {
                        const firestore = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
                        await firestore.setDoc(firestore.doc(db, "orders", orderData.orderId), orderData);
                        console.log("Order saved to Firebase");
                    } catch (firebaseError) {
                        console.warn("Failed to save to Firebase, using localStorage only:", firebaseError);
                    }
                }
                
                // Clear cart
                localStorage.removeItem('shoppingCart');
                if (cart) cart.clear();
                
                showEnhancedNotification('Order placed successfully! Redirecting...', 'success');
                
                // Redirect to confirmation page
                setTimeout(() => {
                    window.location.href = `order-confirmation.html?orderId=${orderData.orderId}`;
                }, 2000);
                
            } catch (error) {
                console.error('Order processing error:', error);
                showEnhancedNotification('Error processing order. Please try again.', 'error');
                
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Render initial summary
    renderOrderSummary();
    
    // Also check if user came here with empty cart
    window.addEventListener('load', renderOrderSummary);
}

// --- ORDER CONFIRMATION PAGE ---
function initializeOrderConfirmation() {
    if (!window.location.pathname.includes('order-confirmation')) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
        // Try to get order from localStorage
        const orderData = JSON.parse(localStorage.getItem('kbnOrders'));
        
        if (orderData && orderData.orderId === orderId) {
            document.getElementById('order-id')?.textContent = orderData.orderId;
            document.getElementById('order-total')?.textContent = orderData.total;
            document.getElementById('customer-name')?.textContent = orderData.customerInfo.name;
            document.getElementById('customer-email')?.textContent = orderData.customerInfo.email;
            document.getElementById('customer-phone')?.textContent = orderData.customerInfo.phone;
            document.getElementById('customer-address')?.textContent = 
                `${orderData.customerInfo.address}, ${orderData.customerInfo.city} - ${orderData.customerInfo.pincode}`;
            
            // Render order items
            const itemsContainer = document.getElementById('order-items');
            if (itemsContainer && orderData.items) {
                itemsContainer.innerHTML = orderData.items.map(item => `
                    <div class="order-item">
                        <span>${item.name} ${item.custom ? '(Custom)' : ''} × ${item.quantity}</span>
                        <span>${item.price}</span>
                    </div>
                `).join('');
            }
        } else {
            showEnhancedNotification('Order not found', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    } else {
        showEnhancedNotification('Invalid order reference', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
}

// --- MOBILE NAVIGATION ---
function initializeMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open');
            document.body.style.overflow = mainNav.classList.contains('is-open') ? 'hidden' : '';
        });
        
        // Close mobile nav when clicking on links
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                document.body.style.overflow = '';
            });
        });
        
        // Close mobile nav when clicking outside
        document.addEventListener('click', (e) => {
            if (mainNav.classList.contains('is-open') && 
                !mainNav.contains(e.target) && 
                !navToggle.contains(e.target)) {
                mainNav.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                document.body.style.overflow = '';
            }
        });
    }
}

// --- NETLIFY SPECIFIC FIXES ---
function initializeNetlifyCompatibility() {
    // Handle Netlify form submissions if any
    const netlifyForms = document.querySelectorAll('form[data-netlify="true"]');
    netlifyForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            // Let Netlify handle its own forms
            console.log('Netlify form submission detected');
        });
    });
}

// --- MAIN INITIALIZATION ---
async function initializeKBNPrintz() {
    try {
        console.log('🚀 Initializing KBN Printz Store...');
        
        // Initialize Firebase (optional - works offline too)
        try {
            const firebase = await loadFirebase();
            app = firebase.app;
            analytics = firebase.analytics;
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
        
        // Initialize mobile navigation
        initializeMobileNavigation();
        
        // Initialize Netlify compatibility
        initializeNetlifyCompatibility();
        
        // Initialize page-specific functionality
        setupAddToCart();
        initializeFrameEditor();
        initializeKeychainEditor();
        initializeCartPage();
        initializeCheckoutPage();
        initializeOrderConfirmation();
        
        console.log('✅ KBN Printz Store initialized successfully!');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showEnhancedNotification('Page loaded with limited functionality', 'warning');
    }
}

// --- START APPLICATION ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKBNPrintz);
} else {
    initializeKBNPrintz();
}

// --- GLOBAL ACCESS ---
window.KBNPrintz = {
    cart: () => cart,
    showNotification: showEnhancedNotification,
    firebase: () => ({ app, analytics, db })
};

// --- ERROR BOUNDARY ---
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// --- OFFLINE SUPPORT ---
window.addEventListener('online', () => {
    showEnhancedNotification('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showEnhancedNotification('You are currently offline', 'warning');
});

// --- PAGE VISIBILITY ---
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && cart) {
        // Refresh cart when page becomes visible
        cart.updateUI();
    }
});