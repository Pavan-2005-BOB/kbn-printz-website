// Custom Frame Designer Class
class CustomFrameDesigner {
    constructor() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.imageUpload = document.getElementById('image-upload');
        this.frameStyleSelect = document.getElementById('frames-style');
        this.frameWidthInput = document.getElementById('frames-width');
        this.frameHeightInput = document.getElementById('frames-height');
        this.addToCartBtn = document.getElementById('add-custom-frame-btn');
        this.resetBtn = document.getElementById('reset-frame-btn');
        this.downloadBtn = document.getElementById('download-frame-design');
        
        this.uploadedImage = null;
        this.framePatterns = new Map();
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.rotation = 0;
        
        this.init();
    }

    init() {
        console.log('Custom Frame Designer initialized 🖼️');
        this.setupCanvas();
        this.preloadFramePatterns();
        this.setupEventListeners();
        this.drawCanvas();
    }

    setupCanvas() {
        // Set high DPI canvas for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    async preloadFramePatterns() {
        // Pre-create canvas patterns for different frame styles
        this.framePatterns.set('wood', this.createWoodPattern());
        this.framePatterns.set('metal', this.createMetalPattern());
        this.framePatterns.set('ornate', this.createOrnatePattern());
        this.framePatterns.set('modern', this.createModernPattern());
        this.framePatterns.set('vintage', this.createVintagePattern());
    }

    createWoodPattern() {
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        patternCanvas.width = 100;
        patternCanvas.height = 100;

        // Wood grain pattern
        patternCtx.fillStyle = '#8d5524';
        patternCtx.fillRect(0, 0, 100, 100);

        patternCtx.strokeStyle = '#6d451c';
        patternCtx.lineWidth = 2;
        
        // Draw wood grain lines
        for (let i = 0; i < 10; i++) {
            patternCtx.beginPath();
            patternCtx.moveTo(Math.random() * 100, 0);
            patternCtx.bezierCurveTo(
                Math.random() * 100, 30,
                Math.random() * 100, 70,
                Math.random() * 100, 100
            );
            patternCtx.stroke();
        }

        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    createMetalPattern() {
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        patternCanvas.width = 50;
        patternCanvas.height = 50;

        // Brushed metal effect
        patternCtx.fillStyle = '#adb5bd';
        patternCtx.fillRect(0, 0, 50, 50);

        patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        patternCtx.lineWidth = 1;
        
        for (let i = 0; i < 50; i += 4) {
            patternCtx.beginPath();
            patternCtx.moveTo(0, i);
            patternCtx.lineTo(50, i);
            patternCtx.stroke();
        }

        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    createOrnatePattern() {
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        patternCanvas.width = 120;
        patternCanvas.height = 120;

        // Gold ornate pattern
        patternCtx.fillStyle = '#d4af37';
        patternCtx.fillRect(0, 0, 120, 120);

        patternCtx.strokeStyle = '#b8941f';
        patternCtx.fillStyle = '#f5d76e';
        patternCtx.lineWidth = 2;

        // Simple decorative elements
        for (let x = 0; x < 120; x += 30) {
            for (let y = 0; y < 120; y += 30) {
                patternCtx.beginPath();
                patternCtx.arc(x + 15, y + 15, 8, 0, Math.PI * 2);
                patternCtx.stroke();
            }
        }

        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    createModernPattern() {
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        patternCanvas.width = 80;
        patternCanvas.height = 80;

        // Modern minimalist pattern
        const gradient = patternCtx.createLinearGradient(0, 0, 80, 80);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        
        patternCtx.fillStyle = gradient;
        patternCtx.fillRect(0, 0, 80, 80);

        patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        patternCtx.lineWidth = 1;
        patternCtx.strokeRect(20, 20, 40, 40);

        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    createVintagePattern() {
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        patternCanvas.width = 100;
        patternCanvas.height = 100;

        // Vintage distressed pattern
        patternCtx.fillStyle = '#8b7355';
        patternCtx.fillRect(0, 0, 100, 100);

        // Add some distress marks
        patternCtx.fillStyle = 'rgba(109, 76, 65, 0.3)';
        for (let i = 0; i < 20; i++) {
            patternCtx.beginPath();
            patternCtx.arc(
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 5 + 1,
                0,
                Math.PI * 2
            );
            patternCtx.fill();
        }

        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    setupEventListeners() {
        // Image upload handler
        this.imageUpload.addEventListener('change', (event) => {
            this.handleImageUpload(event);
        });

        // Control change handlers
        this.frameStyleSelect.addEventListener('change', () => {
            this.drawCanvas();
            this.updatePrice();
        });

        this.frameWidthInput.addEventListener('input', () => {
            this.validateDimensions();
            this.drawCanvas();
            this.updatePrice();
        });

        this.frameHeightInput.addEventListener('input', () => {
            this.validateDimensions();
            this.drawCanvas();
            this.updatePrice();
        });

        // Action buttons
        if (this.addToCartBtn) {
            this.addToCartBtn.addEventListener('click', () => {
                this.addToCart();
            });
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                this.resetDesign();
            });
        }

        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => {
                this.downloadDesign();
            });
        }

        // Canvas interaction handlers
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window resize
        window.addEventListener('resize', () => {
            this.debounce(() => {
                this.setupCanvas();
                this.drawCanvas();
            }, 250)();
        });
    }

    // --- IMAGE HANDLING ---
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            this.showNotification('Please upload a valid image (JPEG, PNG, or WebP)', 'error');
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showNotification('Image size must be less than 10MB', 'error');
            return;
        }

        try {
            this.showLoadingState(true);
            this.uploadedImage = await this.loadImage(file);
            
            // Reset transformations
            this.offsetX = 0;
            this.offsetY = 0;
            this.scale = 1;
            this.rotation = 0;
            
            this.drawCanvas();
            this.showNotification('Image uploaded successfully! Drag to position.', 'success');
            this.toggleActionButtons(true);
            
        } catch (error) {
            console.error('Error loading image:', error);
            this.showNotification('Failed to load image. Please try another file.', 'error');
        } finally {
            this.showLoadingState(false);
        }
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // --- CANVAS RENDERING ---
    drawCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Calculate frame dimensions and position
        const { drawWidth, drawHeight, offsetX, offsetY } = this.calculateFrameDimensions();
        
        // Draw image with transformations
        if (this.uploadedImage) {
            this.drawImageWithTransform(offsetX, offsetY, drawWidth, drawHeight);
        } else {
            this.drawPlaceholder(offsetX, offsetY, drawWidth, drawHeight);
        }
        
        // Draw frame
        this.drawFrame(offsetX, offsetY, drawWidth, drawHeight);
        
        // Draw dimensions label
        this.drawDimensionsLabel(offsetX, offsetY, drawWidth, drawHeight);
    }

    calculateFrameDimensions() {
        const frameWidth = parseInt(this.frameWidthInput.value) || 10;
        const frameHeight = parseInt(this.frameHeightInput.value) || 10;
        
        const canvasAspectRatio = this.canvas.width / this.canvas.height;
        const frameAspectRatio = frameWidth / frameHeight;

        let drawWidth, drawHeight, offsetX, offsetY;
        const padding = 40;

        if (frameAspectRatio > canvasAspectRatio) {
            drawWidth = this.canvas.width - padding * 2;
            drawHeight = drawWidth / frameAspectRatio;
            offsetX = padding;
            offsetY = (this.canvas.height - drawHeight) / 2;
        } else {
            drawHeight = this.canvas.height - padding * 2;
            drawWidth = drawHeight * frameAspectRatio;
            offsetY = padding;
            offsetX = (this.canvas.width - drawWidth) / 2;
        }

        return { drawWidth, drawHeight, offsetX, offsetY };
    }

    drawBackground() {
        // Subtle grid background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 1;
        
        const gridSize = 25;
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawImageWithTransform(offsetX, offsetY, drawWidth, drawHeight) {
        this.ctx.save();
        
        // Move to center of frame
        const centerX = offsetX + drawWidth / 2;
        const centerY = offsetY + drawHeight / 2;
        this.ctx.translate(centerX, centerY);
        
        // Apply transformations
        this.ctx.rotate(this.rotation);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(this.offsetX, this.offsetY);
        
        // Calculate image dimensions to fill frame
        const imageAspect = this.uploadedImage.width / this.uploadedImage.height;
        const frameAspect = drawWidth / drawHeight;
        
        let renderWidth, renderHeight;
        if (imageAspect > frameAspect) {
            renderHeight = drawHeight;
            renderWidth = drawHeight * imageAspect;
        } else {
            renderWidth = drawWidth;
            renderHeight = drawWidth / imageAspect;
        }
        
        // Draw image centered
        this.ctx.drawImage(
            this.uploadedImage,
            -renderWidth / 2,
            -renderHeight / 2,
            renderWidth,
            renderHeight
        );
        
        this.ctx.restore();
    }

    drawPlaceholder(offsetX, offsetY, drawWidth, drawHeight) {
        this.ctx.fillStyle = '#e9ecef';
        this.ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
        
        this.ctx.fillStyle = '#adb5bd';
        this.ctx.font = '500 16px Poppins, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const centerX = offsetX + drawWidth / 2;
        const centerY = offsetY + drawHeight / 2;
        
        this.ctx.fillText('Upload your photo', centerX, centerY - 10);
        this.ctx.font = '400 14px Poppins, sans-serif';
        this.ctx.fillText('Drag to position • Scroll to zoom', centerX, centerY + 15);
    }

    drawFrame(offsetX, offsetY, drawWidth, drawHeight) {
        const frameStyle = this.frameStyleSelect.value;
        const frameThickness = 25;
        
        this.ctx.save();
        
        // Draw frame background
        const pattern = this.framePatterns.get(frameStyle) || '#cccccc';
        this.ctx.fillStyle = pattern;
        this.ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
        
        // Draw inner mat (image area)
        const matPadding = frameThickness;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(
            offsetX + matPadding,
            offsetY + matPadding,
            drawWidth - matPadding * 2,
            drawHeight - matPadding * 2
        );
        
        // Add frame bevel effect
        this.addFrameBevel(offsetX, offsetY, drawWidth, drawHeight, frameThickness, frameStyle);
        
        this.ctx.restore();
    }

    addFrameBevel(x, y, width, height, thickness, style) {
        // Outer bevel (light source from top-left)
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
        
        if (style === 'wood' || style === 'vintage') {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        } else if (style === 'metal') {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        } else if (style === 'ornate') {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.8)');
            gradient.addColorStop(1, 'rgba(184, 148, 31, 0.9)');
        }
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
    }

    drawDimensionsLabel(offsetX, offsetY, drawWidth, drawHeight) {
        const width = this.frameWidthInput.value;
        const height = this.frameHeightInput.value;
        
        this.ctx.fillStyle = '#495057';
        this.ctx.font = '600 14px Poppins, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        this.ctx.fillText(
            `${width}" × ${height}"`,
            this.canvas.width / 2,
            offsetY + drawHeight + 30
        );
    }

    // --- INTERACTION HANDLERS ---
    handleMouseDown(e) {
        if (!this.uploadedImage) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        this.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.uploadedImage) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        this.offsetX += (currentX - this.lastX) / this.scale;
        this.offsetY += (currentY - this.lastY) / this.scale;
        
        this.lastX = currentX;
        this.lastY = currentY;
        this.drawCanvas();
    }

    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = this.uploadedImage ? 'grab' : 'default';
    }

    handleWheel(e) {
        if (!this.uploadedImage) return;
        
        e.preventDefault();
        const delta = -Math.sign(e.deltaY);
        this.scale = Math.max(0.1, Math.min(3, this.scale * (1 + delta * 0.1)));
        this.drawCanvas();
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (!this.uploadedImage) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = touch.clientX - rect.left;
        this.lastY = touch.clientY - rect.top;
        this.isDragging = true;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging || !this.uploadedImage) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        this.offsetX += (currentX - this.lastX) / this.scale;
        this.offsetY += (currentY - this.lastY) / this.scale;
        
        this.lastX = currentX;
        this.lastY = currentY;
        this.drawCanvas();
    }

    handleTouchEnd() {
        this.isDragging = false;
    }

    handleKeyboard(e) {
        if (!this.uploadedImage) return;
        
        switch(e.key) {
            case '+':
            case '=':
                e.preventDefault();
                this.scale = Math.min(this.scale * 1.1, 3);
                this.drawCanvas();
                break;
            case '-':
                e.preventDefault();
                this.scale = Math.max(this.scale / 1.1, 0.1);
                this.drawCanvas();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.rotation += Math.PI / 4;
                    this.drawCanvas();
                }
                break;
        }
    }

    // --- VALIDATION & UTILITIES ---
    validateDimensions() {
        let width = parseInt(this.frameWidthInput.value);
        let height = parseInt(this.frameHeightInput.value);
        
        // Ensure minimum size
        width = Math.max(1, Math.min(120, width || 10));
        height = Math.max(1, Math.min(120, height || 10));
        
        this.frameWidthInput.value = width;
        this.frameHeightInput.value = height;
    }

    updatePrice() {
        // Calculate price based on dimensions and frame style
        const width = parseInt(this.frameWidthInput.value);
        const height = parseInt(this.frameHeightInput.value);
        const style = this.frameStyleSelect.value;
        
        const basePrice = 500; // ₹500 base price
        const sizeMultiplier = (width * height) / 100;
        const styleMultiplier = this.getStyleMultiplier(style);
        
        const totalPrice = basePrice * sizeMultiplier * styleMultiplier;
        
        // Update price display if exists
        const priceElement = document.querySelector('.product-price');
        if (priceElement) {
            priceElement.textContent = `₹${Math.round(totalPrice)}`;
        }
    }

    getStyleMultiplier(style) {
        const multipliers = {
            'wood': 1.0,
            'metal': 1.5,
            'ornate': 2.0,
            'modern': 1.2,
            'vintage': 1.8
        };
        return multipliers[style] || 1.0;
    }

    // --- ACTION METHODS ---
    addToCart() {
        if (!this.uploadedImage) {
            this.showNotification('Please upload an image first!', 'error');
            return;
        }

        try {
            this.showLoadingState(true, this.addToCartBtn);
            
            const productData = {
                name: 'Custom Photo Frame',
                baseprice: 'Custom Size',
                price: this.calculateFinalPrice(),
                quantity: 1,
                image: this.getCanvasSnapshot(),
                custom: true,
                frameData: {
                    style: this.frameStyleSelect.value,
                    width: this.frameWidthInput.value,
                    height: this.frameHeightInput.value,
                    designData: this.getDesignData()
                },
                timestamp: new Date().toISOString()
            };

            this.saveToCart(productData);
            this.showNotification('Custom frame added to cart!', 'success');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add frame to cart', 'error');
        } finally {
            this.showLoadingState(false, this.addToCartBtn);
        }
    }

    calculateFinalPrice() {
        const width = parseInt(this.frameWidthInput.value);
        const height = parseInt(this.frameHeightInput.value);
        const style = this.frameStyleSelect.value;
        
        const basePrice = 500;
        const sizeMultiplier = (width * height) / 100;
        const styleMultiplier = this.getStyleMultiplier(style);
        
        return `₹${Math.round(basePrice * sizeMultiplier * styleMultiplier)}`;
    }

    getCanvasSnapshot() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        // Redraw without grid for clean snapshot
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        if (this.uploadedImage) {
            tempCtx.drawImage(this.canvas, 0, 0);
        }
        
        return tempCanvas.toDataURL('image/png', 0.95);
    }

    getDesignData() {
        return {
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            rotation: this.rotation,
            timestamp: new Date().toISOString()
        };
    }

    saveToCart(productData) {
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        cart.push(productData);
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        this.updateCartIcon();
    }

    resetDesign() {
        this.uploadedImage = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.rotation = 0;
        this.imageUpload.value = '';
        this.toggleActionButtons(false);
        this.drawCanvas();
        this.showNotification('Design has been reset', 'info');
    }

    downloadDesign() {
        if (!this.uploadedImage) {
            this.showNotification('No design to download', 'error');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `frame-design-${new Date().getTime()}.png`;
            link.href = this.getCanvasSnapshot();
            link.click();
            this.showNotification('Design downloaded!', 'success');
        } catch (error) {
            console.error('Error downloading design:', error);
            this.showNotification('Download failed', 'error');
        }
    }

    toggleActionButtons(enabled) {
        const buttons = [this.resetBtn, this.downloadBtn].filter(Boolean);
        buttons.forEach(btn => {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.6';
        });
    }

    showLoadingState(show, button = null) {
        if (button) {
            if (show) {
                button.dataset.originalText = button.textContent;
                button.innerHTML = '<div class="btn-spinner"></div> Adding...';
                button.disabled = true;
            } else {
                button.textContent = button.dataset.originalText;
                button.disabled = false;
            }
        }
    }

    showNotification(message, type = 'info') {
        // Implementation similar to previous example
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Use the notification system from previous example
    }

    updateCartIcon() {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the frame designer
document.addEventListener('DOMContentLoaded', () => {
    new CustomFrameDesigner();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomFrameDesigner;
}