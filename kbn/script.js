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
    // Enhanced mobile cart interactions
function enhanceMobileCart() {
    // Add touch feedback to buttons
    const buttons = document.querySelectorAll('.cart-item button, #proceed-to-checkout, #continue-shopping');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Improve quantity input for mobile
    const quantityInputs = document.querySelectorAll('.cart-item-quantity input');
    quantityInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.backgroundColor = '#f8fafc';
            this.style.borderColor = '#3b82f6';
        });
        
        input.addEventListener('blur', function() {
            this.style.backgroundColor = 'white';
            this.style.borderColor = '#d1d5db';
        });
    });
    
    // Prevent zoom on input focus (iOS)
    quantityInputs.forEach(input => {
        input.addEventListener('focus', function() {
            setTimeout(() => {
                document.body.style.zoom = "100%";
            }, 100);
        });
    });
}

// Initialize when cart is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('cart-items-container')) {
        setTimeout(enhanceMobileCart, 500);
    }
});
    
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
        return [...this.items];
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
    const maxSize = 5 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
        showEnhancedNotification('Please upload JPEG, PNG, GIF, or WebP images only', 'error');
        return;
    }
    
    if (file.size > maxSize) {
        showEnhancedNotification('Image size should be less than 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            showEnhancedNotification('Image uploaded successfully!', 'success');
            callback(img);
        };
        img.onerror = function() {
            showEnhancedNotification('Error loading image', 'error');
        };
    };
    reader.onerror = function() {
        showEnhancedNotification('Error reading file', 'error');
    };
    reader.readAsDataURL(file);
}

// --- CANVAS UTILITIES ---

function initializeCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    return { canvas, ctx, width: rect.width, height: rect.height };
}

// --- ADD TO CART LOGIC ---
function setupAddToCart() {
    document.addEventListener('click', function(e) {
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
        
        let image = '';
        const imgElement = productElement.querySelector('img');
        if (imgElement) {
            image = imgElement.src;
        }
        
        return {
            name: nameElement ? nameElement.textContent.trim() : 'Custom Product',
            price: priceElement ? priceElement.textContent.trim() : '₹0.00',
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
    
    const canvas = canvasInfo.canvas;
    const ctx = canvasInfo.ctx;
    const imageUpload = document.getElementById('image-upload');
    let uploadedImage = null;

    function drawFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (uploadedImage) {
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
        
        ctx.strokeStyle = '#8d5524';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', function(event) {
            handleImageUpload(event, function(img) {
                uploadedImage = img;
                drawFrame();
            });
        });
    }

    drawFrame();
}

// --- KEYCHAIN EDITOR ---
function initializeKeychainEditor() {
    if (!document.getElementById('add-keychain-btn')) return;
    
    const canvasInfo = initializeCanvas('preview-canvas');
    if (!canvasInfo) return;
    
    const canvas = canvasInfo.canvas;
    const ctx = canvasInfo.ctx;
    const imageUpload = document.getElementById('image-upload');
    let uploadedImage = null;

    function drawKeychain() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (uploadedImage) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(canvas.width, canvas.height) * 0.4;
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();
            
            const scale = Math.min(radius * 2 / uploadedImage.width, radius * 2 / uploadedImage.height);
            const width = uploadedImage.width * scale;
            const height = uploadedImage.height * scale;
            const x = centerX - width / 2;
            const y = centerY - height / 2;
            
            ctx.drawImage(uploadedImage, x, y, width, height);
            ctx.restore();
            
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

    if (imageUpload) {
        imageUpload.addEventListener('change', function(event) {
            handleImageUpload(event, function(img) {
                uploadedImage = img;
                drawKeychain();
            });
        });
    }

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
            container.innerHTML = cartItems.map(function(item, index) {
                return `
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
                `;
            }).join('');
        }
        
        if (subtotal) {
            const total = cartItems.reduce(function(sum, item) {
                const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
                return sum + (price * item.quantity);
            }, 0);
            subtotal.textContent = '₹' + total.toFixed(2);
        }
        
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
        
        if (continueShoppingBtn) {
            continueShoppingBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = 'products.html';
            };
        }
    }
    
    renderCart();
    
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
        
        const subtotal = cartItems.reduce(function(sum, item) {
            const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
            return sum + (price * item.quantity);
        }, 0);
        
        const tax = subtotal * 0.18;
        const shipping = subtotal > 500 ? 0 : 50;
        const total = subtotal + tax + shipping;
        
        if (container) {
            container.innerHTML = cartItems.map(function(item) {
                return `
                <div class="summary-item">
                    <span class="item-name">${item.name} ${item.custom ? '(Custom)' : ''} × ${item.quantity}</span>
                    <span class="item-price">${item.price}</span>
                </div>
                `;
            }).join('');
        }
        
        if (subtotalElement) subtotalElement.textContent = '₹' + subtotal.toFixed(2);
        if (taxElement) taxElement.textContent = '₹' + tax.toFixed(2);
        if (shippingElement) shippingElement.textContent = shipping === 0 ? 'FREE' : '₹' + shipping.toFixed(2);
        if (totalElement) totalElement.textContent = '₹' + total.toFixed(2);
    }
    
    const form = document.getElementById('shipping-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const cartItems = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            if (cartItems.length === 0) {
                showEnhancedNotification('Your cart is empty', 'error');
                return;
            }
            
            const formData = new FormData(form);
            const customerInfo = Object.fromEntries(formData);
            
            const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'pincode'];
            const missingFields = requiredFields.filter(function(field) {
                return !customerInfo[field] || !customerInfo[field].trim();
            });
            
            if (missingFields.length > 0) {
                showEnhancedNotification('Please fill all required fields', 'error');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerInfo.email)) {
                showEnhancedNotification('Please enter a valid email address', 'error');
                return;
            }
            
            const phoneRegex = /^[0-9]{10}$/;
            const cleanPhone = customerInfo.phone.replace(/\D/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                showEnhancedNotification('Please enter a valid 10-digit phone number', 'error');
                return;
            }
            
            const pincodeRegex = /^[0-9]{6}$/;
            if (!pincodeRegex.test(customerInfo.pincode)) {
                showEnhancedNotification('Please enter a valid 6-digit pincode', 'error');
                return;
            }
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            try {
                const subtotal = cartItems.reduce(function(sum, item) {
                    const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
                    return sum + (price * item.quantity);
                }, 0);
                const tax = subtotal * 0.18;
                const shipping = subtotal > 500 ? 0 : 50;
                const total = subtotal + tax + shipping;
                
                const orderData = {
                    customerInfo: customerInfo,
                    items: cartItems,
                    subtotal: '₹' + subtotal.toFixed(2),
                    tax: '₹' + tax.toFixed(2),
                    shipping: shipping === 0 ? 'FREE' : '₹' + shipping.toFixed(2),
                    total: '₹' + total.toFixed(2),
                    orderDate: new Date().toISOString(),
                    orderId: 'KBN' + Date.now(),
                    status: 'confirmed'
                };
                
                localStorage.setItem('kbnOrders', JSON.stringify(orderData));
                
               if (db) {
    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');
        const docRef = doc(db, "orders", orderData.orderId);
        await setDoc(docRef, orderData);
        console.log("Order saved to Firebase");
    } catch (firebaseError) {
        console.warn("Failed to save to Firebase:", firebaseError);
    }
}
                localStorage.removeItem('shoppingCart');
                if (cart) cart.clear();
                
                showEnhancedNotification('Order placed successfully! Redirecting...', 'success');
                
                setTimeout(function() {
                    window.location.href = 'order-confirmation.html?orderId=' + orderData.orderId;
                }, 2000);
                
            } catch (error) {
                console.error('Order processing error:', error);
                showEnhancedNotification('Error processing order. Please try again.', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    renderOrderSummary();
    window.addEventListener('load', renderOrderSummary);
}

// --- ORDER CONFIRMATION PAGE ---
function initializeOrderConfirmation() {
    if (!window.location.pathname.includes('order-confirmation')) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
        const orderData = JSON.parse(localStorage.getItem('kbnOrders'));
        
        if (orderData && orderData.orderId === orderId) {
            const orderIdElement = document.getElementById('order-id');
            const orderTotalElement = document.getElementById('order-total');
            const customerNameElement = document.getElementById('customer-name');
            const customerEmailElement = document.getElementById('customer-email');
            const customerPhoneElement = document.getElementById('customer-phone');
            const customerAddressElement = document.getElementById('customer-address');
            const itemsContainer = document.getElementById('order-items');
            
            if (orderIdElement) orderIdElement.textContent = orderData.orderId;
            if (orderTotalElement) orderTotalElement.textContent = orderData.total;
            if (customerNameElement) customerNameElement.textContent = orderData.customerInfo.name;
            if (customerEmailElement) customerEmailElement.textContent = orderData.customerInfo.email;
            if (customerPhoneElement) customerPhoneElement.textContent = orderData.customerInfo.phone;
            if (customerAddressElement) {
                customerAddressElement.textContent = 
                    orderData.customerInfo.address + ', ' + 
                    orderData.customerInfo.city + ' - ' + 
                    orderData.customerInfo.pincode;
            }
            
            if (itemsContainer && orderData.items) {
                itemsContainer.innerHTML = orderData.items.map(function(item) {
                    return `
                    <div class="order-item">
                        <span>${item.name} ${item.custom ? '(Custom)' : ''} × ${item.quantity}</span>
                        <span>${item.price}</span>
                    </div>
                    `;
                }).join('');
            }
        } else {
            showEnhancedNotification('Order not found', 'error');
            setTimeout(function() {
                window.location.href = 'index.html';
            }, 3000);
        }
    } else {
        showEnhancedNotification('Invalid order reference', 'error');
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 3000);
    }
}

// --- MOBILE NAVIGATION ---
function initializeMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', function() {
            mainNav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open');
            document.body.style.overflow = mainNav.classList.contains('is-open') ? 'hidden' : '';
        });
        
        mainNav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                mainNav.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                document.body.style.overflow = '';
            });
        });
        
        document.addEventListener('click', function(e) {
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

// --- NETLIFY COMPATIBILITY ---
function initializeNetlifyCompatibility() {
    const netlifyForms = document.querySelectorAll('form[data-netlify="true"]');
    netlifyForms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            console.log('Netlify form submission detected');
        });
    });
}

// --- MAIN INITIALIZATION ---
// Enhanced Navigation for All Pages
function initEnhancedNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    const navOverlay = document.querySelector('.nav-overlay');
    const body = document.body;

    // Mobile Menu Toggle
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', function() {
            const isOpen = mainNav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open');
            navOverlay?.classList.toggle('is-open');
            body.classList.toggle('menu-open', isOpen);
        });

        // Close menu when clicking overlay
        if (navOverlay) {
            navOverlay.addEventListener('click', closeMobileMenu);
        }

        // Mobile dropdown functionality
        const dropdownToggles = mainNav.querySelectorAll('.nav-dropdown-toggle');
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.parentElement;
                    dropdown.classList.toggle('active');
                    
                    // Close other dropdowns
                    dropdownToggles.forEach(otherToggle => {
                        if (otherToggle !== this) {
                            otherToggle.parentElement.classList.remove('active');
                        }
                    });
                }
            });
        });

        // Close menu when clicking navigation links
        mainNav.querySelectorAll('a').forEach(link => {
            if (!link.classList.contains('nav-dropdown-toggle')) {
                link.addEventListener('click', closeMobileMenu);
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMobileMenu();
            }
        });
    }

    function closeMobileMenu() {
        mainNav?.classList.remove('is-open');
        navToggle?.classList.remove('is-open');
        navOverlay?.classList.remove('is-open');
        body.classList.remove('menu-open');
        
        // Close all mobile dropdowns
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
}

// Cart Management for All Pages
function initCartSystem() {
    // Update cart badge on all pages
    function updateCartBadge() {
        const cartBadges = document.querySelectorAll('.cart-badge');
        cartBadges.forEach(badge => {
            try {
                const cartItems = JSON.parse(localStorage.getItem('shoppingCart')) || [];
                const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'flex' : 'none';
            } catch (error) {
                console.error('Error updating cart badge:', error);
                badge.style.display = 'none';
            }
        });
    }

    // Add to cart functionality for all product pages
    function setupAddToCart() {
        document.addEventListener('click', function(e) {
            const addToCartBtn = e.target.closest('.btn-primary, .add-to-cart, [id*="add"]');
            
            if (addToCartBtn && (addToCartBtn.textContent.includes('Add to Cart') || 
                                addToCartBtn.textContent.includes('Cart') ||
                                addToCartBtn.id.includes('add'))) {
                e.preventDefault();
                
                // Get product info based on page type
                const productInfo = getProductInfo();
                if (productInfo) {
                    addToCart(productInfo);
                }
            }
        });
    }

    function getProductInfo() {
        // Get product info based on current page
        const path = window.location.pathname;
        const page = path.split('/').pop();
        
        let productInfo = {
            name: 'Custom Product',
            price: '₹0.00',
            quantity: 1,
            image: '',
            custom: false,
            page: page
        };

        // Product-specific logic
        if (page.includes('frame')) {
            productInfo.name = document.querySelector('h1, h2')?.textContent || 'Custom Frame';
            productInfo.price = document.querySelector('.price, .product-price')?.textContent || '₹299.00';
            productInfo.image = document.querySelector('.product-image img, .preview-image')?.src || '';
            productInfo.custom = page.includes('editor');
        }
        else if (page.includes('keychain')) {
            productInfo.name = document.querySelector('h1, h2')?.textContent || 'Custom Keychain';
            productInfo.price = document.querySelector('.price, .product-price')?.textContent || '₹199.00';
            productInfo.image = document.querySelector('.product-image img, .preview-image')?.src || '';
            productInfo.custom = page.includes('editor') || page.includes('custom');
        }
        else if (page.includes('sign') || page.includes('art') || page.includes('board')) {
            productInfo.name = document.querySelector('h1, h2')?.textContent || document.title;
            productInfo.price = document.querySelector('.price, .product-price')?.textContent || '₹499.00';
            productInfo.image = document.querySelector('.product-image img')?.src || '';
        }

        return productInfo;
    }

    function addToCart(productInfo) {
        try {
            const cartItems = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            
            // Check if product already exists
            const existingIndex = cartItems.findIndex(item => 
                item.name === productInfo.name && item.page === productInfo.page
            );
            
            if (existingIndex > -1) {
                cartItems[existingIndex].quantity += productInfo.quantity;
            } else {
                productInfo.id = Date.now().toString();
                cartItems.push(productInfo);
            }
            
            localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
            updateCartBadge();
            
            // Show success message
            showNotification(`${productInfo.name} added to cart!`, 'success');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Error adding product to cart', 'error');
        }
    }

    // Initialize
    updateCartBadge();
    setupAddToCart();
    
    // Update cart when storage changes (other tabs)
    window.addEventListener('storage', updateCartBadge);
}

// Notification System
function showNotification(message, type = 'success') {
    // Your existing notification code here
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    initEnhancedNavigation();
    initCartSystem();
    
    console.log('✅ KBN Printz enhanced navigation initialized');
});
async function initializeKBNPrintz() {
    try {
        console.log('🚀 Initializing KBN Printz Store...');
        
        try {
            const firebase = await loadFirebase();
            app = firebase.app;
            analytics = firebase.analytics;
            db = firebase.db;
        } catch (error) {
            console.log('Firebase not available, running in offline mode');
        }
        
        cart = new ShoppingCart();
        
        if (typeof AOS !== 'undefined') {
            AOS.init({ 
                once: true, 
                duration: 800,
                offset: 50
            });
        }
        
        initializeMobileNavigation();
        initializeNetlifyCompatibility();
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
    cart: function() { return cart; },
    showNotification: showEnhancedNotification,
    firebase: function() { return { app: app, analytics: analytics, db: db }; }
};

// --- ERROR HANDLING ---
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('online', function() {
    showEnhancedNotification('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    showEnhancedNotification('You are currently offline', 'warning');
});

document.addEventListener('visibilitychange', function() {
    if (!document.hidden && cart) {
        cart.updateUI();
    }
});