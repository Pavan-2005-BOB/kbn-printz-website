document.addEventListener('DOMContentLoaded', function() {
    console.log('script.js has loaded!');

    // --- 1. FIREBASE CONFIGURATION (Analytics Removed) ---
    const firebaseConfig = {
        apiKey: "AIzaSyC4dTEmXIiGDeIpPmug7D8z1DU2-ZE6kso",
        authDomain: "kbn-printz-store.firebaseapp.com",
        projectId: "kbn-printz-store",
        storageBucket: "kbn-printz-store.appspot.com",
        messagingSenderId: "1067786431485",
        appId: "1:1067786431485:web:83e1db7c5880d952574794"
        // measurementId has been removed as it's optional
    };

    // Initialize Firebase using the version 8 syntax
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    
    // --- (The rest of your code remains the same) ---
    if (typeof AOS !== 'undefined') {
        AOS.init({ once: true, duration: 800 });
    }

    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('#main-nav');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open');
        });
    }
    
    function updateCartIcon() {
        const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const cartBadge = document.querySelector('.cart-badge');
        let totalItems = 0;
        cart.forEach(item => { totalItems += item.quantity; });

        if (cartBadge) {
            if (totalItems > 0) {
                cartBadge.textContent = totalItems;
                cartBadge.classList.add('show');
            } else {
                cartBadge.classList.remove('show');
            }
        }
    }

    const addToCartButton = document.querySelector('.product-actions .btn-primary, #add-keychain-btn, #add-custom-frame-btn');
    if (addToCartButton) {
      addToCartButton.addEventListener('click', () => {
        const productInfo = addToCartButton.closest('.product-info, .editor-controls');
        const productName = productInfo.querySelector('h1').textContent;
        const productPrice = productInfo.querySelector('.product-price').textContent;
        const quantityInput = document.getElementById('quantity');
        const productQuantity = quantityInput ? parseInt(quantityInput.value) : 1;
        
        let productImage = '';
        const previewCanvas = document.getElementById('preview-canvas') || document.getElementById('keychain-preview-canvas');
        
        if (previewCanvas && document.getElementById('image-upload') && document.getElementById('image-upload').files.length > 0) {
            productImage = previewCanvas.toDataURL('image/jpeg');
        } else {
            const imgElement = document.querySelector('.product-image img');
            if (imgElement) { productImage = imgElement.src; }
        }
        
        if ((document.getElementById('image-upload')) && !productImage) {
            alert('Please upload an image before adding to cart!');
            return;
        }

        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const existingProductIndex = cart.findIndex(item => item.name === productName && !item.custom);
        
        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += productQuantity;
        } else {
            const productToAdd = { 
                name: productName, 
                price: productPrice, 
                quantity: productQuantity, 
                image: productImage, 
                custom: !!previewCanvas, 
                baseprice: productInfo.querySelector('.product') ? productInfo.querySelector('.product').textContent.trim() : null 
            };
            cart.push(productToAdd);
        }
        
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        alert(`${productQuantity} x ${productName} has been added to your cart!`);
        updateCartIcon();
      });
    }

    const cartItemsContainer = document.getElementById('cart-items-container');
    function renderCart() {
        if (!cartItemsContainer) return;
        const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const emptyCartMessage = document.getElementById('empty-cart-message');
        const cartSummary = document.getElementById('cart-summary');
        const cartSubtotalEl = document.getElementById('cart-subtotal');
        let subtotal = 0;
        
        cartItemsContainer.innerHTML = ''; 
        
        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartSummary.style.display = 'none';
        } else {
            emptyCartMessage.style.display = 'none';
            cartSummary.style.display = 'flex';
            cart.forEach((product, index) => {
                const priceAsNumber = parseFloat(product.price.replace('₹', ''));
                const itemTotal = priceAsNumber * product.quantity;
                subtotal += itemTotal;
                const cartItemHTML = `<div class="cart-item"><div class="cart-item-image"><img src="${product.image}" alt="${product.name}"></div><div class="cart-item-details"><h3>${product.name}</h3>${product.baseprice ? `<p class="base-price-text">${product.baseprice}</p>` : ''}<p>Price: ${product.price}</p></div><div class="cart-item-quantity"><input type="number" value="${product.quantity}" min="1" data-index="${index}"></div><p class="cart-item-price">₹${itemTotal.toFixed(2)}</p><button class="remove-item-btn" data-index="${index}">&times;</button></div>`;
                cartItemsContainer.innerHTML += cartItemHTML;
            });
            cartSubtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
        }
    }
    
    if (cartItemsContainer) {
        renderCart();
        cartItemsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-item-btn')) {
                const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
                cart.splice(event.target.dataset.index, 1);
                localStorage.setItem('shoppingCart', JSON.stringify(cart));
                renderCart();
                updateCartIcon();
            }
        });
        cartItemsContainer.addEventListener('change', (event) => {
            if (event.target.matches('input[type="number"]')) {
                const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
                const index = event.target.dataset.index;
                const newQuantity = parseInt(event.target.value);
                if (newQuantity > 0) {
                    cart[index].quantity = newQuantity;
                } else {
                    cart.splice(index, 1);
                }
                localStorage.setItem('shoppingCart', JSON.stringify(cart));
                renderCart();
                updateCartIcon();
            }
        });
    }

    // --- Checkout Page Logic (CORRECTED) ---
    const summaryItemsContainer = document.getElementById('summary-items-container');
    if (summaryItemsContainer) {
        const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const summaryTotalEl = document.getElementById('summary-total');
        let subtotal = 0;

        if (cart.length > 0) {
            cart.forEach(product => {
                const priceAsNumber = parseFloat(product.price.replace('₹', ''));
                const itemTotal = priceAsNumber * product.quantity;
                subtotal += itemTotal;
                const summaryItemHTML = `<div class="summary-item"><span class="item-name">${product.name} (x${product.quantity})</span><span class="item-price">₹${itemTotal.toFixed(2)}</span></div>`;
                summaryItemsContainer.innerHTML += summaryItemHTML;
            });
            summaryTotalEl.textContent = `₹${subtotal.toFixed(2)}`;
        }

        const shippingForm = document.getElementById('shipping-form');
        shippingForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            if (cart.length === 0) {
                alert("Your cart is empty. Please add items before placing an order.");
                return;
            }

            const shippingDetails = {
                name: document.getElementById('full-name').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value,
            };

            const order = {
                shipping: shippingDetails,
                items: cart,
                total: subtotal,
                createdAt: new Date()
            };

            db.collection("orders").add(order).then(() => {
                localStorage.removeItem('shoppingCart');
                alert('Order placed successfully! Thank you for your purchase.');
                window.location.href = 'thank-you.html';
            }).catch((error) => {
                console.error("Error writing document: ", error);
                alert("There was an error placing your order. Please try again.");
            });
        });
    }

    updateCartIcon();
});

