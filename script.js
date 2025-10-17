// --- 1. FIREBASE IMPORTS & CONFIGURATION ---
// Note: These imports are now handled by loading the script as a module
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log('script.js has loaded!');

    // --- (All your existing code for AOS, Menu, Cart, etc. goes below) ---
    // Note: AOS is not loaded on every page, so we add a check for it.
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

    // --- ADD TO CART LOGIC (Handles all pages) ---
    const addToCartButton = document.querySelector('.product-actions .btn-primary, #add-keychain-btn, #add-custom-frame-btn');
    if (addToCartButton) {
      addToCartButton.addEventListener('click', () => {
        const productInfo = addToCartButton.closest('.product-info, .editor-controls');
        const mainTitleElement = document.querySelector('.product-detail h1, .frame-editor h2');
        const productName = mainTitleElement.textContent;
        const productPrice = productInfo.querySelector('.product-price').textContent;
        const quantityInput = document.getElementById('quantity');
        const productQuantity = quantityInput ? parseInt(quantityInput.value) : 1;

        let productImage = '';
        const previewCanvas = document.getElementById('preview-canvas');
        
        const imageUploadInput = document.getElementById('image-upload');
        if (previewCanvas && imageUploadInput && imageUploadInput.files.length > 0) {
            productImage = previewCanvas.toDataURL('image/jpeg');
        } else {
            const imgElement = document.querySelector('.product-image img');
            if (imgElement) { productImage = imgElement.src; }
        }

        if (imageUploadInput && !productImage) {
            alert('Please upload an image before adding to cart!');
            return;
        }

        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        const isCustom = !!previewCanvas;
        const existingProductIndex = cart.findIndex(item => item.name === productName && !item.custom && !isCustom);

        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += productQuantity;
        } else {
            const productToAdd = {
                name: productName,
                price: productPrice,
                quantity: productQuantity,
                image: productImage,
                custom: isCustom,
                baseprice: productInfo.querySelector('.product') ? productInfo.querySelector('.product').textContent.trim() : null
            };
            cart.push(productToAdd);
        }

        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        alert(`${productQuantity} x ${productName} has been added to your cart!`);
        updateCartIcon();
      });
    }
    
    // --- FRAME EDITOR LOGIC ---
    if (document.getElementById('frame-style')) { // Check if we are on the frame editor page
        const frameEditorCanvas = document.getElementById('preview-canvas');
        const ctx = frameEditorCanvas.getContext('2d');
        const imageUpload = document.getElementById('image-upload');
        const frameStyleSelect = document.getElementById('frame-style');
        const frameWidthInput = document.getElementById('frame-width');
        const frameHeightInput = document.getElementById('frame-height');
        let uploadedImage = null;

        function drawFrameCanvas() {
            ctx.clearRect(0, 0, frameEditorCanvas.width, frameEditorCanvas.height);
            const frameWidth = frameWidthInput.value;
            const frameHeight = frameHeightInput.value;
            const canvasAspectRatio = frameEditorCanvas.width / frameEditorCanvas.height;
            const frameAspectRatio = frameWidth / frameHeight;
            let drawWidth, drawHeight, offsetX, offsetY;
            if (frameAspectRatio > canvasAspectRatio) {
                drawWidth = frameEditorCanvas.width;
                drawHeight = drawWidth / frameAspectRatio;
                offsetX = 0;
                offsetY = (frameEditorCanvas.height - drawHeight) / 2;
            } else {
                drawHeight = frameEditorCanvas.height;
                drawWidth = drawHeight * frameAspectRatio;
                offsetY = 0;
                offsetX = (frameEditorCanvas.width - drawWidth) / 2;
            }
            if (uploadedImage) {
                ctx.drawImage(uploadedImage, offsetX, offsetY, drawWidth, drawHeight);
            } else {
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
                ctx.fillStyle = '#a0a0a0';
                ctx.font = '30px Poppins';
                ctx.textAlign = 'center';
                ctx.fillText('Your Image Here', frameEditorCanvas.width / 2, frameEditorCanvas.height / 2);
            }
            ctx.lineWidth = 20;
            const frameStyle = frameStyleSelect.value;
            if (frameStyle === 'wood') { ctx.strokeStyle = '#8d5524'; }
            else if (frameStyle === 'metal') { ctx.strokeStyle = '#adb5bd'; }
            else if (frameStyle === 'ornate') { ctx.strokeStyle = '#d4af37'; }
            ctx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);
        }

        imageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage = new Image();
                uploadedImage.src = e.target.result;
                uploadedImage.onload = () => drawFrameCanvas();
            };
            reader.readAsDataURL(file);
        });

        frameStyleSelect.addEventListener('change', drawFrameCanvas);
        frameWidthInput.addEventListener('input', drawFrameCanvas);
        frameHeightInput.addEventListener('input', drawFrameCanvas);
        drawFrameCanvas();
    }

    // --- KEYCHAIN EDITOR LOGIC ---
    if(document.getElementById('add-keychain-btn')) { // Check if we are on keychain editor page
        const keychainCanvas = document.getElementById('preview-canvas');
        const ctx = keychainCanvas.getContext('2d');
        const imageUpload = document.getElementById('image-upload');
        let uploadedImage = null;

        function drawKeychainCanvas() {
            ctx.clearRect(0, 0, keychainCanvas.width, keychainCanvas.height);
            if (uploadedImage) {
                const hRatio = keychainCanvas.width / uploadedImage.width;
                const vRatio = keychainCanvas.height / uploadedImage.height;
                const ratio = Math.min(hRatio, vRatio) * 0.9;
                const centeredWidth = uploadedImage.width * ratio;
                const centeredHeight = uploadedImage.height * ratio;
                const offsetX = (keychainCanvas.width - centeredWidth) / 2;
                const offsetY = (keychainCanvas.height - centeredHeight) / 2;
                ctx.drawImage(uploadedImage, offsetX, offsetY, centeredWidth, centeredHeight);
            } else {
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(0, 0, keychainCanvas.width, keychainCanvas.height);
                ctx.fillStyle = '#a0a0a0';
                ctx.font = '30px Poppins';
                ctx.textAlign = 'center';
                ctx.fillText('Your Design Here', keychainCanvas.width / 2, keychainCanvas.height / 2);
            }
        }

        imageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage = new Image();
                uploadedImage.src = e.target.result;
                uploadedImage.onload = () => drawKeychainCanvas();
            };
            reader.readAsDataURL(file);
        });
        
        drawKeychainCanvas();
    }

    // Call initial functions that should run on every page
    updateCartIcon();
});