// --- 1. FIREBASE IMPORTS & CONFIGURATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- DOM READY ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('script.js has loaded as a module! ✅');

    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyC4dTEmXIiGDeIpPmug7D8z1DU2-ZE6kso",
        authDomain: "kbn-printz-store.firebaseapp.com",
        projectId: "kbn-printz-store",
        storageBucket: "kbn-printz-store.appspot.com",
        messagingSenderId: "1067786431485",
        appId: "1:1067786431485:web:83e1db7c5880d952574794"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("Firebase v9+ connected ✅");

    // --- Initialize AOS and Navigation ---
    if (typeof AOS !== 'undefined') {
        AOS.init({ once: true, duration: 800, offset: 100 });
    }

    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('#main-nav');
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open');
            document.body.style.overflow = mainNav.classList.contains('is-open') ? 'hidden' : '';
        });
    }

    const navLinks = document.querySelectorAll('#main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav?.classList.remove('is-open');
            navToggle?.classList.remove('is-open');
            document.body.style.overflow = '';
        });
    });

    // --- 2. FORM VALIDATOR CLASS ---
    class FormValidator {
        static validateShippingForm(formData) {
            const errors = {};
            const data = {};

            const name = formData.get('full-name')?.trim() || '';
            if (!name) errors.name = 'Full name is required';
            else if (name.length < 2) errors.name = 'Name must be at least 2 characters';
            else data.name = name;

            const email = formData.get('email')?.trim().toLowerCase() || '';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email) errors.email = 'Email is required';
            else if (!emailRegex.test(email)) errors.email = 'Invalid email address';
            else data.email = email;

            const address = formData.get('address')?.trim() || '';
            if (!address) errors.address = 'Address is required';
            else if (address.length < 10) errors.address = 'Enter full address (min 10 chars)';
            else data.address = address;

            const phone = formData.get('phone')?.trim() || '';
            const digitsOnly = phone.replace(/[^\d+]/g, '');
            if (!phone) errors.phone = 'Phone number is required';
            else if (digitsOnly.length < 10) errors.phone = 'Enter a valid phone number';
            else data.phone = digitsOnly;

            return {
                isValid: Object.keys(errors).length === 0,
                data,
                errors
            };
        }
    }

    // --- 3. SHOPPING CART MANAGER ---
    class ShoppingCartManager {
        constructor() {
            this.db = db;
            this.cart = this.getCartFromStorage();
            this.init();
        }

        init() {
            console.log('KBN Printz Store initialized 🛍️');
            this.setupEventListeners();
            this.updateCartIcon();
        }

        // Storage handling
        getCartFromStorage() {
            try { return JSON.parse(localStorage.getItem('shoppingCart')) || []; }
            catch { return []; }
        }
        saveCartToStorage() {
            localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        }

        // Cart functions
        addToCart(product) {
            if (product.custom) this.cart.push(product);
            else {
                const index = this.cart.findIndex(p => p.name === product.name && !p.custom);
                if (index > -1) this.cart[index].quantity += product.quantity;
                else this.cart.push(product);
            }
            this.saveCartToStorage();
            this.updateCartIcon();
            this.showNotification(`${product.quantity} x ${product.name} added to cart!`, 'success');
        }

        removeFromCart(index) {
            if (index >= 0 && index < this.cart.length) {
                this.cart.splice(index, 1);
                this.saveCartToStorage();
                this.updateCartIcon();
                this.showNotification('Item removed from cart', 'info');
                return true;
            }
            return false;
        }

        updateQuantity(index, newQty) {
            if (index >= 0 && index < this.cart.length) {
                if (newQty > 0) this.cart[index].quantity = newQty;
                else this.removeFromCart(index);
                this.saveCartToStorage();
                this.updateCartIcon();
            }
        }

        getCartTotal() {
            return this.cart.reduce((sum, p) => sum + (parseFloat(p.price.replace('₹','')) * p.quantity), 0);
        }

        clearCart() {
            this.cart = [];
            this.saveCartToStorage();
            this.updateCartIcon();
        }

        updateCartIcon() {
            const badge = document.querySelector('.cart-badge');
            if (!badge) return;
            const total = this.cart.reduce((s, i) => s + i.quantity, 0);
            if (total > 0) {
                badge.textContent = total > 99 ? '99+' : total;
                badge.classList.add('show');
            } else badge.classList.remove('show');
        }

        // Notifications
        showNotification(msg, type='info') {
            const existing = document.querySelector('.custom-notification');
            if (existing) existing.remove();

            const note = document.createElement('div');
            note.className = `custom-notification custom-notification--${type}`;
            note.innerHTML = `
                <span class="custom-notification__message">${msg}</span>
                <button class="custom-notification__close">&times;</button>
            `;
            if (!document.querySelector('#notification-styles')) this.injectNotificationStyles();
            document.body.appendChild(note);

            requestAnimationFrame(() => note.classList.add('custom-notification--show'));
            const timer = setTimeout(() => this.removeNotification(note), 5000);
            note.querySelector('.custom-notification__close').addEventListener('click', () => {
                clearTimeout(timer);
                this.removeNotification(note);
            });
        }

        removeNotification(note) {
            note.classList.remove('custom-notification--show');
            setTimeout(() => note.remove(), 300);
        }

        injectNotificationStyles() {
  const css = `
  .custom-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--color-surface);
    color: var(--color-text-primary);
    padding: var(--space-4) var(--space-5);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    border-left: 4px solid var(--color-border);
    transform: translateX(400px);
    opacity: 0;
    transition: all var(--transition-normal);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    max-width: 400px;
  }

  .custom-notification--show {
    transform: translateX(0);
    opacity: 1;
  }

  .custom-notification--success {
    border-left-color: var(--color-success);
  }
  .custom-notification--error {
    border-left-color: var(--color-error);
  }
  .custom-notification--info {
    border-left-color: var(--color-info);
  }

  .custom-notification__message {
    flex: 1;
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
  }

  .custom-notification__close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: 0;
    line-height: 1;
    transition: color var(--transition-normal);
  }

  .custom-notification__close:hover {
    color: var(--color-error);
  }

  .btn-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 8px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  `;
  
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = css;
  document.head.appendChild(style);
        }

        // Rendering
        renderCart() {
            const container = document.getElementById('cart-items-container');
            if (!container) return;
            const emptyMsg = document.getElementById('empty-cart-message');
            const summary = document.getElementById('cart-summary');
            const subtotalEl = document.getElementById('cart-subtotal');

            container.innerHTML = '';
            if (this.cart.length === 0) {
                emptyMsg.style.display = 'block';
                summary.style.display = 'none';
                return;
            }

            emptyMsg.style.display = 'none';
            summary.style.display = 'flex';

            this.cart.forEach((p, i) => {
                const priceNum = parseFloat(p.price.replace('₹', '')) || 0;
                const itemTotal = priceNum * p.quantity;
                container.innerHTML += `
                    <div class="cart-item" data-index="${i}">
                        <div class="cart-item-image"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
                        <div class="cart-item-details">
                            <h3>${this.escapeHtml(p.name)}</h3>
                            ${p.baseprice ? `<p class="base-price-text">${this.escapeHtml(p.baseprice)}</p>` : ''}
                            <p>Price: ${p.price}</p>
                            ${p.custom ? '<p class="custom-badge">Custom Design</p>' : ''}
                        </div>
                        <div class="cart-item-quantity"><input type="number" value="${p.quantity}" min="1" data-index="${i}"></div>
                        <p class="cart-item-total">₹${itemTotal.toFixed(2)}</p>
                        <button class="remove-item-btn" data-index="${i}">&times;</button>
                    </div>
                `;
            });
            if (subtotalEl) subtotalEl.textContent = `₹${this.getCartTotal().toFixed(2)}`;
        }

        renderOrderSummary() {
            const container = document.getElementById('summary-items-container');
            const totalEl = document.getElementById('summary-total');
            if (!container) return;
            container.innerHTML = '';
            this.cart.forEach(p => {
                const total = parseFloat(p.price.replace('₹','')) * p.quantity;
                container.innerHTML += `<div class="summary-item">
                    <span class="item-name">${this.escapeHtml(p.name)} (x${p.quantity})</span>
                    <span class="item-price">₹${total.toFixed(2)}</span></div>`;
            });
            if (totalEl) totalEl.textContent = `₹${this.getCartTotal().toFixed(2)}`;
        }

        escapeHtml(txt) {
            return txt.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
        }

        // Events
        setupEventListeners() {
            this.setupAddToCartHandler();
            this.setupCartHandlers();
            this.setupCheckoutHandler();
        }

        setupAddToCartHandler() {
            const btn = document.querySelector('.product-actions .btn-primary, #add-keychain-btn, #add-custom-frame-btn');
            if (!btn) return;
            btn.addEventListener('click', () => {
                const productData = this.getProductDataFromForm();
                if (productData) this.addToCart(productData);
            });
        }

        getProductDataFromForm() {
            const btn = document.querySelector('.product-actions .btn-primary, #add-keychain-btn, #add-custom-frame-btn');
            const info = btn?.closest('.product-info, .editor-controls');
            if (!info) return null;

            const name = info.querySelector('h1')?.textContent || 'Unnamed Product';
            const price = info.querySelector('.product-price')?.textContent || '₹0.00';
            const qty = parseInt(document.getElementById('quantity')?.value) || 1;
            const canvas = document.getElementById('preview-canvas') || document.getElementById('keychain-preview-canvas');
            let img = '';
            if (canvas && document.getElementById('image-upload')?.files.length > 0) img = canvas.toDataURL('image/jpeg', 0.9);
            else img = document.querySelector('.product-image img')?.src || '';

            if (document.getElementById('image-upload') && !img) {
                this.showNotification('Please upload an image before adding to cart!', 'error');
                return null;
            }

            return { name, price, quantity: qty, image: img, custom: !!canvas, baseprice: info.querySelector('.product')?.textContent?.trim() || null };
        }

        setupCartHandlers() {
            const container = document.getElementById('cart-items-container');
            if (!container) return;
            this.renderCart();

            container.addEventListener('click', e => {
                if (e.target.classList.contains('remove-item-btn')) {
                    const i = parseInt(e.target.dataset.index);
                    this.removeFromCart(i);
                    this.renderCart();
                }
            });

            container.addEventListener('change', e => {
                if (e.target.matches('input[type="number"]')) {
                    const i = parseInt(e.target.dataset.index);
                    const q = parseInt(e.target.value) || 1;
                    this.updateQuantity(i, q);
                    this.renderCart();
                }
            });
        }

        setupCheckoutHandler() {
            const form = document.getElementById('shipping-form');
            if (!form) return;
            this.renderOrderSummary();

            form.addEventListener('submit', async e => {
                e.preventDefault();
                if (this.cart.length === 0) return this.showNotification('Your cart is empty!', 'error');

                const result = FormValidator.validateShippingForm(new FormData(form));
                if (!result.isValid) return this.showNotification('Please fill all required fields correctly.', 'error');

                const order = {
                    shipping: result.data,
                    items: this.cart,
                    total: this.getCartTotal(),
                    createdAt: serverTimestamp(),
                    status: 'pending',
                    orderId: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
                };

                const btn = form.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                btn.innerHTML = '<div class="btn-spinner"></div> Placing Order...';
                btn.disabled = true;

                try {
                    await addDoc(collection(this.db, "orders"), order);
                    this.clearCart();
                    this.showNotification('Order placed successfully! Thank you 🎉', 'success');
                    setTimeout(() => window.location.href = 'thank-you.html', 2000);
                } catch (err) {
                    console.error(err);
                    this.showNotification('Error placing order. Try again.', 'error');
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            });
        }
    }

    // --- 4. INITIALIZE APP ---
    new ShoppingCartManager();
});
