// Wait for the page to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECT ALL OUR HTML ELEMENTS ---
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d'); // The context is our "drawing tool"

    const imageUpload = document.getElementById('image-upload');
    const frameStyleSelect = document.getElementById('frames-style');
    const frameWidthInput = document.getElementById('frames-width');
    const frameHeightInput = document.getElementById('frames-height');

    let uploadedImage = null; // This will store the user's uploaded image object

    // --- 2. THE MAIN DRAWING FUNCTION ---
    // This function runs every time we need to update the preview
    function drawCanvas() {
        // Clear everything first
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get the current size values
        const frameWidth = frameWidthInput.value;
        const frameHeight = frameHeightInput.value;
        
        // Calculate the aspect ratio to fit the image and frame correctly
        const canvasAspectRatio = canvas.width / canvas.height;
        const frameAspectRatio = frameWidth / frameHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (frameAspectRatio > canvasAspectRatio) {
            drawWidth = canvas.width;
            drawHeight = drawWidth / frameAspectRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = drawHeight * frameAspectRatio;
            offsetY = 0;
            offsetX = (canvas.width - drawWidth) / 2;
        }

        // Draw the uploaded image if it exists
        if (uploadedImage) {
            ctx.drawImage(uploadedImage, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            // If no image, draw a placeholder
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '30px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText('Your Image Here', canvas.width / 2, canvas.height / 2);
        }

        // Draw the frame border over the image
        ctx.lineWidth = 20; // The thickness of the frame border
        const frameStyle = frameStyleSelect.value;
        
        if (frameStyle === 'wood') {
            ctx.strokeStyle = '#8d5524'; // A simple brown for wood
        } else if (frameStyle === 'metal') {
            ctx.strokeStyle = '#adb5bd'; // A simple grey for metal
        } else if (frameStyle === 'ornate') {
            ctx.strokeStyle = '#d4af37'; // A simple gold for ornate
        }
        
        ctx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);
    }


    // --- 3. HANDLE THE IMAGE UPLOAD ---
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader(); // API to read files from the computer

        // When the reader finishes loading the file...
        reader.onload = (e) => {
            uploadedImage = new Image(); // Create a new image object
            uploadedImage.src = e.target.result; // Set its source to the uploaded file data

            // Once the image object has loaded its source...
            uploadedImage.onload = () => {
                drawCanvas(); // Draw everything for the first time with the new image
            };
        };

        reader.readAsDataURL(file); // Start reading the file
    });


    // --- 4. ADD EVENT LISTENERS FOR CONTROLS ---
    // Whenever a control is changed, just redraw the canvas
    frameStyleSelect.addEventListener('change', drawCanvas);
    frameWidthInput.addEventListener('input', drawCanvas);
    frameHeightInput.addEventListener('input', drawCanvas);

    // --- 5. INITIAL DRAW ---
    // Draw the initial placeholder when the page first loads
    drawCanvas();
});