// --- 1. FIREBASE IMPORTS & CONFIGURATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    setDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- GLOBAL VARIABLES ---
let cart = null;
let db = null;
let app = null;

// --- ENHANCED NOTIFICATION SYSTEM (Independent function) ---
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
    
    // Add styles if not already present
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.3s;
                margin-left: auto;
            }
            .toast-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(styles);
    }
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
    
    return toast;
}

// --- ENHANCED SHOPPING CART CLASS ---
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        this.init();
    }
    
    init() {
        this.updateUI();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for storage changes across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'shoppingCart') {
                this.items = JSON.parse(e.newValue) || [];
                this.updateUI();
            }
        });
    }
    
    addItem(product) {
        // Validate product data
        if (!this.validateProduct(product)) {
            showEnhancedNotification('Invalid product data', 'error');
            return false;
        }
        
        const existingIndex = this.items.findIndex(item => 
            item.name === product.name && 
            item.custom === product.custom
        );
        
        if (existingIndex > -1) {
            this.items[existingIndex].quantity += product.quantity;
            showEnhancedNotification(`Updated quantity of ${product.name} in cart`, 'success');
        } else {
            // Add unique ID for better management
            product.id = this.generateId();
            product.addedAt = new Date().toISOString();
            this.items.push(product);
            showEnhancedNotification(`${product.quantity} x ${product.name} added to cart!`, 'success');
        }
        
        this.save();
        this.updateUI();
        return true;
    }
    
    removeItem(index) {
        const removedItem = this.items[index];
        this.items.splice(index, 1);
        this.save();
        this.updateUI();
        showEnhancedNotification(`${removedItem.name} removed from cart`, 'warning');
    }
    
    updateQuantity(index, newQuantity) {
        if (newQuantity < 1) {
            this.removeItem(index);
            return;
        }
        
        this.items[index].quantity = newQuantity;
        this.save();
        this.updateUI();
    }
    
    clear() {
        this.items = [];
        this.save();
        this.updateUI();
        showEnhancedNotification('Cart cleared', 'warning');
    }
    
    save() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { items: this.items, total: this.getTotal() } 
        }));
    }
    
    updateUI() {
        const totalItems = this.getTotalItems();
        const cartBadge = document.querySelector('.cart-badge');
        const cartTotalElement = document.querySelector('.cart-total');
        
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.classList.toggle('show', totalItems > 0);
        }
        
        if (cartTotalElement) {
            cartTotalElement.textContent = this.getTotal().toFixed(2);
        }
    }
    
    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    getTotal() {
        return this.items.reduce((total, item) => {
            const price = this.extractPrice(item.price);
            return total + (price * item.quantity);
        }, 0);
    }
    
    extractPrice(priceString) {
        if (typeof priceString === 'number') return priceString;
        const priceMatch = priceString.match(/\$?(\d+\.?\d*)/);
        return priceMatch ? parseFloat(priceMatch[1]) : 0;
    }
    
    validateProduct(product) {
        return product && 
               product.name && 
               product.price && 
               product.quantity > 0;
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    async saveOrderToFirestore(customerInfo) {
        try {
            if (!db) {
                throw new Error('Firestore not initialized');
            }
            
            const orderData = {
                items: this.items,
                total: this.getTotal(),
                customer: customerInfo,
                status: 'pending',
                createdAt: serverTimestamp(),
                orderId: this.generateOrderId()
            };
            
            const docRef = await addDoc(collection(db, "orders"), orderData);
            console.log("Order saved with ID: ", docRef.id);
            
            // Save order ID locally for reference
            await setDoc(doc(db, "orderReferences", docRef.id), {
                orderId: orderData.orderId,
                createdAt: serverTimestamp()
            });
            
            return { success: true, orderId: orderData.orderId, docId: docRef.id };
        } catch (error) {
            console.error("Error saving order: ", error);
            showEnhancedNotification('Failed to save order. Please try again.', 'error');
            return { success: false, error: error.message };
        }
    }
    
    generateOrderId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `KBN-${timestamp}-${random}`;
    }
}

// --- ENHANCED IMAGE UPLOAD HANDLER ---
function handleImageUpload(event, callback, options = {}) {
    const file = event.target.files[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showEnhancedNotification('Please upload a valid image (JPEG, PNG, GIF, or WebP)', 'error');
        event.target.value = '';
        return;
    }

    // Size validation (default 5MB)
    const maxSize = options.maxSize || 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showEnhancedNotification(`Image size must be less than ${maxSize / (1024 * 1024)}MB`, 'error');
        event.target.value = '';
        return;
    }

    // Show loading state
    const originalText = event.target.parentElement.querySelector('label')?.textContent;
    if (originalText) {
        event.target.parentElement.querySelector('label').textContent = 'Uploading...';
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = () => {
            // Restore original text
            if (originalText) {
                event.target.parentElement.querySelector('label').textContent = originalText;
            }
            
            // Dimension validation if specified
            if (options.minWidth && img.width < options.minWidth) {
                showEnhancedNotification(`Image width must be at least ${options.minWidth}px`, 'error');
                return;
            }
            
            if (options.minHeight && img.height < options.minHeight) {
                showEnhancedNotification(`Image height must be at least ${options.minHeight}px`, 'error');
                return;
            }
            
            callback(img);
            showEnhancedNotification('Image uploaded successfully!', 'success');
        };
        
        img.onerror = () => {
            if (originalText) {
                event.target.parentElement.querySelector('label').textContent = originalText;
            }
            showEnhancedNotification('Error loading image', 'error');
        };
    };
    
    reader.onerror = () => {
        if (originalText) {
            event.target.parentElement.querySelector('label').textContent = originalText;
        }
        showEnhancedNotification('Error reading file', 'error');
    };
    
    reader.readAsDataURL(file);
}

// --- ENHANCED CANVAS UTILITIES ---
function initializeCanvas(canvasId, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with id ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set display size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Set actual size in memory (scaled for DPI)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale context to match DPI
    ctx.scale(dpr, dpr);
    
    // Set rendering quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    return { canvas, ctx, dpr, displayWidth: rect.width, displayHeight: rect.height };
}

// --- ENHANCED ADD TO CART LOGIC ---
function setupAddToCart() {
    // Handle all add to cart buttons
    document.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.btn-primary, #add-keychain-btn, #add-custom-frame-btn, [data-add-to-cart]');
        if (!addToCartBtn) return;
        
        e.preventDefault();
        
        // Make sure cart is initialized
        if (!cart) {
            showEnhancedNotification('Shopping cart not ready. Please refresh the page.', 'error');
            return;
        }
        
        const productElement = addToCartBtn.closest('.product-info, .editor-controls, .product-card, [data-product]');
        if (!productElement) {
            console.error('Product element not found');
            showEnhancedNotification('Could not find product information', 'error');
            return;
        }
        
        // Extract product information
        const productInfo = extractProductInfo(productElement, addToCartBtn);
        if (!productInfo) {
            showEnhancedNotification('Could not find product information', 'error');
            return;
        }
        
        // Validate required fields for custom products
        if (productInfo.requiresImage && !productInfo.image) {
            showEnhancedNotification('Please upload an image before adding to cart!', 'error');
            return;
        }
        
        // Add to cart
        const success = cart.addItem(productInfo);
        
        if (success && productInfo.custom) {
            // For custom products, you might want to save the design
            saveCustomDesign(productInfo);
        }
    });
}

function extractProductInfo(productElement, addButton) {
    try {
        // Try different selectors for product name
        const nameElement = productElement.querySelector('h1, h2, h3, [data-product-name]');
        const priceElement = productElement.querySelector('.product-price, [data-product-price], .price');
        const quantityInput = document.getElementById('quantity') || productElement.querySelector('input[type="number"]');
        
        const productName = nameElement?.textContent?.trim() || 'Custom Product';
        const productPrice = priceElement?.textContent?.trim() || '$0.00';
        const productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        
        // Check if this is a custom product with image
        const previewCanvas = document.getElementById('preview-canvas');
        const imageUpload = document.getElementById('image-upload');
        let productImage = '';
        
        if (previewCanvas && imageUpload && imageUpload.files.length > 0) {
            productImage = previewCanvas.toDataURL('image/jpeg', 0.8); // Compressed
        } else {
            const imgElement = productElement.querySelector('.product-image img, img[data-product-image]');
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
            baseprice: productElement.querySelector('.base-price')?.textContent?.trim() || null,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error extracting product info:', error);
        return null;
    }
}

function saveCustomDesign(productInfo) {
    // Save custom design data to localStorage for recovery
    const designs = JSON.parse(localStorage.getItem('customDesigns')) || [];
    designs.push({
        ...productInfo,
        savedAt: new Date().toISOString()
    });
    
    // Keep only last 10 designs
    if (designs.length > 10) {
        designs.shift();
    }
    
    localStorage.setItem('customDesigns', JSON.stringify(designs));
}

// --- ENHANCED FRAME EDITOR ---
function initializeFrameEditor() {
    if (!document.getElementById('frame-style')) return;
    
    const canvasInfo = initializeCanvas('preview-canvas');
    if (!canvasInfo) return;
    
    const { canvas, ctx } = canvasInfo;
    const imageUpload = document.getElementById('image-upload');
    const frameStyleSelect = document.getElementById('frame-style');
    const frameWidthInput = document.getElementById('frame-width');
    const frameHeightInput = document.getElementById('frame-height');
    
    let uploadedImage = null;
    let renderTimeout = null;

    // Debounced render function for performance
    function drawFrameCanvas() {
        if (renderTimeout) clearTimeout(renderTimeout);
        renderTimeout = setTimeout(renderFrame, 50);
    }
    
    function renderFrame() {
        ctx.clearRect(0, 0, canvas.width / canvasInfo.dpr, canvas.height / canvasInfo.dpr);
        
        const frameWidth = parseFloat(frameWidthInput.value) || 8;
        const frameHeight = parseFloat(frameHeightInput.value) || 10;
        const canvasAspectRatio = canvasInfo.displayWidth / canvasInfo.displayHeight;
        const frameAspectRatio = frameWidth / frameHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (frameAspectRatio > canvasAspectRatio) {
            drawWidth = canvasInfo.displayWidth;
            drawHeight = drawWidth / frameAspectRatio;
            offsetX = 0;
            offsetY = (canvasInfo.displayHeight - drawHeight) / 2;
        } else {
            drawHeight = canvasInfo.displayHeight;
            drawWidth = drawHeight * frameAspectRatio;
            offsetY = 0;
            offsetX = (canvasInfo.displayWidth - drawWidth) / 2;
        }
        
        // Draw image or placeholder
        if (uploadedImage) {
            ctx.drawImage(uploadedImage, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
            
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText('Upload your image to preview', canvasInfo.displayWidth / 2, canvasInfo.displayHeight / 2);
        }
        
        // Draw frame
        ctx.lineWidth = 15;
        const frameStyle = frameStyleSelect.value;
        
        const frameColors = {
            wood: { color: '#8d5524', pattern: 'wood' },
            metal: { color: '#adb5bd', pattern: 'metal' },
            ornate: { color: '#d4af37', pattern: 'gold' }
        };
        
        const frameConfig = frameColors[frameStyle] || frameColors.wood;
        ctx.strokeStyle = frameConfig.color;
        ctx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);
        
        // Add subtle inner border
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(offsetX + 2, offsetY + 2, drawWidth - 4, drawHeight - 4);
    }

    // Event listeners with debouncing
    imageUpload.addEventListener('change', (event) => {
        handleImageUpload(event, (img) => {
            uploadedImage = img;
            drawFrameCanvas();
        }, { maxSize: 10 * 1024 * 1024, minWidth: 100, minHeight: 100 });
    });

    frameStyleSelect.addEventListener('change', drawFrameCanvas);
    
    [frameWidthInput, frameHeightInput].forEach(input => {
        input.addEventListener('input', () => {
            // Validate dimensions
            const value = parseFloat(input.value);
            if (value < 4) input.value = 4;
            if (value > 36) input.value = 36;
            drawFrameCanvas();
        });
    });

    // Initial render
    drawFrameCanvas();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const newCanvasInfo = initializeCanvas('preview-canvas');
        if (newCanvasInfo) {
            Object.assign(canvasInfo, newCanvasInfo);
            drawFrameCanvas();
        }
    });
}

// --- ENHANCED KEYCHAIN EDITOR ---
function initializeKeychainEditor() {
    if (!document.getElementById('add-keychain-btn')) return;
    
    const canvasInfo = initializeCanvas('preview-canvas');
    if (!canvasInfo) return;
    
    const { canvas, ctx } = canvasInfo;
    const imageUpload = document.getElementById('image-upload');
    
    let uploadedImage = null;

    function drawKeychainCanvas() {
        ctx.clearRect(0, 0, canvas.width / canvasInfo.dpr, canvas.height / canvasInfo.dpr);
        
        if (uploadedImage) {
            // Draw keychain shape (rounded rectangle)
            const padding = 20;
            const keychainWidth = canvasInfo.displayWidth - (padding * 2);
            const keychainHeight = canvasInfo.displayHeight - (padding * 2);
            
            // Draw keychain background
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#dee2e6';
            ctx.lineWidth = 3;
            
            // Rounded rectangle
            const radius = 15;
            ctx.beginPath();
            ctx.moveTo(padding + radius, padding);
            ctx.lineTo(padding + keychainWidth - radius, padding);
            ctx.quadraticCurveTo(padding + keychainWidth, padding, padding + keychainWidth, padding + radius);
            ctx.lineTo(padding + keychainWidth, padding + keychainHeight - radius);
            ctx.quadraticCurveTo(padding + keychainWidth, padding + keychainHeight, padding + keychainWidth - radius, padding + keychainHeight);
            ctx.lineTo(padding + radius, padding + keychainHeight);
            ctx.quadraticCurveTo(padding, padding + keychainHeight, padding, padding + keychainHeight - radius);
            ctx.lineTo(padding, padding + radius);
            ctx.quadraticCurveTo(padding, padding, padding + radius, padding);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw keychain ring
            ctx.beginPath();
            ctx.arc(canvasInfo.displayWidth / 2, padding - 10, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw image inside keychain
            const imgPadding = 10;
            const imgWidth = keychainWidth - (imgPadding * 2);
            const imgHeight = keychainHeight - (imgPadding * 2);
            
            const hRatio = imgWidth / uploadedImage.width;
            const vRatio = imgHeight / uploadedImage.height;
            const ratio = Math.min(hRatio, vRatio) * 0.9;
            const centeredWidth = uploadedImage.width * ratio;
            const centeredHeight = uploadedImage.height * ratio;
            const offsetX = (canvasInfo.displayWidth - centeredWidth) / 2;
            const offsetY = (canvasInfo.displayHeight - centeredHeight) / 2;
            
            ctx.drawImage(uploadedImage, offsetX, offsetY, centeredWidth, centeredHeight);
        } else {
            // Draw placeholder
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvasInfo.displayWidth, canvasInfo.displayHeight);
            
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText('Upload your design to preview', canvasInfo.displayWidth / 2, canvasInfo.displayHeight / 2);
        }
    }

    imageUpload.addEventListener('change', (event) => {
        handleImageUpload(event, (img) => {
            uploadedImage = img;
            drawKeychainCanvas();
        }, { maxSize: 5 * 1024 * 1024 });
    });
    
    drawKeychainCanvas();
}

// --- INITIALIZATION ---
function initializeApp() {
    try {
        console.log('KBN Printz Store - Initializing...');
        
        // --- FIREBASE INITIALIZATION (MUST BE FIRST) ---
        const firebaseConfig = {
            apiKey: "AIzaSyC4dTEmXIiGDeIpPmug7D8z1DU2-ZE6kso",
            authDomain: "kbn-printz-store.firebaseapp.com",
            projectId: "kbn-printz-store",
            storageBucket: "kbn-printz-store.appspot.com",
            messagingSenderId: "1067786431485",
            appId: "1:1067786431485:web:83e1db7c5880d952574794"
        };

        // Initialize Firebase FIRST
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase v9+ connected ✅");

        // --- NOW INITIALIZE CART (after Firebase) ---
        cart = new ShoppingCart();
        console.log("Shopping cart initialized ✅");

        // Initialize AOS
        if (typeof AOS !== 'undefined') {
            AOS.init({ 
                once: true, 
                duration: 800,
                offset: 50
            });
        }

        // Mobile navigation
        const navToggle = document.querySelector('.nav-toggle');
        const mainNav = document.querySelector('.nav-links');
        if (navToggle && mainNav) {
            navToggle.addEventListener('click', () => {
                mainNav.classList.toggle('is-open');
                navToggle.classList.toggle('is-open');
                navToggle.innerHTML = mainNav.classList.contains('is-open') ? 
                    '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
            });
        }

        // Setup all functionality
        setupAddToCart();
        initializeFrameEditor();
        initializeKeychainEditor();
        
        console.log('KBN Printz Store - Enhanced version initialized successfully!');
        
    } catch (error) {
        console.error('Error during initialization:', error);
        showEnhancedNotification('Failed to initialize app. Please refresh the page.', 'error');
    }
}

// --- START THE APPLICATION WHEN DOM IS LOADED ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - starting app initialization');
    initializeApp();
});

// --- EXPORT FOR GLOBAL ACCESS (if needed) ---
window.KBNPrintz = {
    cart: () => cart,
    db: () => db,
    showNotification: showEnhancedNotification
};