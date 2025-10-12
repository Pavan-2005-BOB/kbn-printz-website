document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECT ALL OUR HTML ELEMENTS ---
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');

    const imageUpload = document.getElementById('image-upload');
    const quantityInput = document.getElementById('quantity');
    const addToCartBtn = document.getElementById('add-keychain-btn');

    let uploadedImage = null;

    // --- 2. THE MAIN DRAWING FUNCTION ---
    function drawCanvas() {
        // Clear everything first
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the uploaded image if it exists
        if (uploadedImage) {
            // Calculate aspect ratio to fit and center the image
            const hRatio = canvas.width / uploadedImage.width;
            const vRatio = canvas.height / uploadedImage.height;
            const ratio = Math.min(hRatio, vRatio) * 0.9; // Use 90% of canvas
            const centeredWidth = uploadedImage.width * ratio;
            const centeredHeight = uploadedImage.height * ratio;
            const offsetX = (canvas.width - centeredWidth) / 2;
            const offsetY = (canvas.height - centeredHeight) / 2;

            ctx.drawImage(uploadedImage, offsetX, offsetY, centeredWidth, centeredHeight);
        } else {
            // If no image, draw a placeholder
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '30px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText('Your Design Here', canvas.width / 2, canvas.height / 2);
        }
    }

    // --- 3. HANDLE THE IMAGE UPLOAD ---
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = new Image();
            uploadedImage.src = e.target.result;
            uploadedImage.onload = () => {
                drawCanvas(); // Draw the uploaded image
            };
        };
        reader.readAsDataURL(file);
    });

    // --- 4. ADD TO CART LOGIC ---
    addToCartBtn.addEventListener('click', () => {
        if (!uploadedImage) {
            alert('Please upload a design first!');
            return;
        }

        const productQuantity = parseInt(quantityInput.value);
        const productName = 'Custom Shape Keychain';
        const productbaseprice= 'Starts From';
        const productPrice = '₹100.00'; // Fixed price for this product
        const productImage = canvas.toDataURL('image/png'); // Get snapshot of the canvas

        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

        // Check if a custom keychain already exists to update quantity
        const existingProductIndex = cart.findIndex(item => item.name === productName && item.custom);
        if (existingProductIndex > -1) {
             // For simplicity, we'll just add as new for now. 
             // Combining different custom designs is complex.
        }

        const productToAdd = {

            name: productName,
            baseprice: productbaseprice,
            price: productPrice,
            quantity: productQuantity,
            image: productImage,
            custom: true // Flag to identify it as a custom item
        };
        cart.push(productToAdd);

        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        alert(`${productQuantity} x ${productName} has been added to your cart!`);
        updateCartIcon();
    });

    // --- 5. INITIAL DRAW ---
    drawCanvas();
});