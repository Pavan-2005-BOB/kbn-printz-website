// Custom Keychain Editor Class
class CustomKeychainEditor {
    constructor() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.imageUpload = document.getElementById('image-upload');
        this.quantityInput = document.getElementById('quantity');
        this.addToCartBtn = document.getElementById('add-keychain-btn');
        this.resetBtn = document.getElementById('reset-design-btn');
        this.downloadBtn = document.getElementById('download-design-btn');
        
        this.uploadedImage = null;
        this.imageScale = 0.9;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        
        this.init();
    }

    init() {
        console.log('Custom Keychain Editor initialized 🎨');
        this.setupEventListeners();
        this.setupCanvas();
        this.drawCanvas();
    }

    setupCanvas() {
        // Set canvas dimensions for high DPI displays
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

    setupEventListeners() {
        // Image upload handler
        this.imageUpload.addEventListener('change', (event) => {
            this.handleImageUpload(event);
        });

        // Add to cart handler
        this.addToCartBtn.addEventListener('click', () => {
            this.addToCart();
        });

        // Reset design handler
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                this.resetDesign();
            });
        }

        // Download design handler
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => {
                this.downloadDesign();
            });
        }

        // Canvas interaction handlers for image manipulation
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window resize handler
        window.addEventListener('resize', () => {
            this.debounce(() => {
                this.setupCanvas();
                this.drawCanvas();
            }, 250)();
        });
    }

    // --- IMAGE UPLOAD & PROCESSING ---
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            this.showNotification('Please upload a valid image file (JPEG, PNG, WebP, or GIF)', 'error');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showNotification('Image size must be less than 5MB', 'error');
            return;
        }

        try {
            this.showLoadingState(true);
            
            // Create and load image
            this.uploadedImage = await this.loadImage(file);
            
            // Reset transformations for new image
            this.offsetX = 0;
            this.offsetY = 0;
            this.scale = 1;
            
            this.drawCanvas();
            this.showNotification('Image uploaded successfully! You can drag to reposition.', 'success');
            
            // Enable action buttons
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

    // --- CANVAS DRAWING & RENDERING ---
    drawCanvas() {
        // Clear canvas with a nice background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background pattern
        this.drawBackground();
        
        // Draw the uploaded image with transformations
        if (this.uploadedImage) {
            this.drawImageWithTransform();
        } else {
            this.drawPlaceholder();
        }
        
        // Draw keychain outline/border
        this.drawKeychainOutline();
    }

    drawBackground() {
        // Create a subtle grid background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 1;
        
        // Draw grid lines
        const gridSize = 20;
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

    drawImageWithTransform() {
        this.ctx.save();
        
        // Move to center of canvas
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        
        // Apply scale
        this.ctx.scale(this.scale, this.scale);
        
        // Apply offset (dragging)
        this.ctx.translate(this.offsetX, this.offsetY);
        
        // Calculate dimensions to maintain aspect ratio
        const hRatio = (this.canvas.width * this.imageScale) / this.uploadedImage.width;
        const vRatio = (this.canvas.height * this.imageScale) / this.uploadedImage.height;
        const ratio = Math.min(hRatio, vRatio);
        const width = this.uploadedImage.width * ratio;
        const height = this.uploadedImage.height * ratio;
        
        // Draw image centered
        this.ctx.drawImage(this.uploadedImage, -width / 2, -height / 2, width, height);
        
        this.ctx.restore();
    }

    drawPlaceholder() {
        this.ctx.fillStyle = '#e9ecef';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#adb5bd';
        this.ctx.font = '600 16px Poppins, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillText('Upload your design to get started', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '400 14px Poppins, sans-serif';
        this.ctx.fillText('Supports: JPG, PNG, WebP, GIF • Max 5MB', this.canvas.width / 2, this.canvas.height / 2 + 10);
        
        // Draw upload icon
        this.drawUploadIcon();
    }

    drawUploadIcon() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 - 60;
        
        this.ctx.strokeStyle = '#adb5bd';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 3]);
        
        // Draw cloud outline
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw arrow
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 15);
        this.ctx.lineTo(centerX, centerY + 15);
        this.ctx.moveTo(centerX - 10, centerY + 5);
        this.ctx.lineTo(centerX, centerY + 15);
        this.ctx.lineTo(centerX + 10, centerY + 5);
        this.ctx.stroke();
    }

    drawKeychainOutline() {
        this.ctx.strokeStyle = '#ff6700';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        
        const padding = 10;
        this.ctx.strokeRect(
            padding, 
            padding, 
            this.canvas.width - padding * 2, 
            this.canvas.height - padding * 2
        );
        
        this.ctx.setLineDash([]);
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
                this.scale = Math.max(this.scale / 1.1, 0.5);
                this.drawCanvas();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.resetDesign();
                }
                break;
        }
    }

    // --- CART FUNCTIONALITY ---
    addToCart() {
        if (!this.uploadedImage) {
            this.showNotification('Please upload a design first!', 'error');
            return;
        }

        const productQuantity = parseInt(this.quantityInput.value) || 1;
        
        if (productQuantity < 1 || productQuantity > 99) {
            this.showNotification('Please enter a valid quantity (1-99)', 'error');
            return;
        }

        try {
            this.showLoadingState(true, this.addToCartBtn);
            
            const productData = {
                name: 'Custom Shape Keychain',
                baseprice: 'Starts From',
                price: '₹100.00',
                quantity: productQuantity,
                image: this.getCanvasSnapshot(),
                custom: true,
                designData: this.getDesignData(), // Save transformation data
                timestamp: new Date().toISOString()
            };

            this.saveToCart(productData);
            this.showNotification(`${productQuantity} × Custom Keychain added to cart!`, 'success');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add item to cart. Please try again.', 'error');
        } finally {
            this.showLoadingState(false, this.addToCartBtn);
        }
    }

    getCanvasSnapshot() {
        // Create a high-quality snapshot
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        // Redraw without grid for cleaner snapshot
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        if (this.uploadedImage) {
            tempCtx.drawImage(this.canvas, 0, 0);
        }
        
        return tempCanvas.toDataURL('image/png', 0.9);
    }

    getDesignData() {
        return {
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            imageScale: this.imageScale,
            timestamp: new Date().toISOString()
        };
    }

    saveToCart(productData) {
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        
        // For custom items, always add as new item (don't combine)
        cart.push(productData);
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        
        // Update cart icon
        this.updateCartIcon();
    }

    // --- UTILITY FUNCTIONS ---
    resetDesign() {
        this.uploadedImage = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
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
            link.download = `keychain-design-${new Date().getTime()}.png`;
            link.href = this.getCanvasSnapshot();
            link.click();
            this.showNotification('Design downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error downloading design:', error);
            this.showNotification('Failed to download design', 'error');
        }
    }

    toggleActionButtons(enabled) {
        const buttons = [this.resetBtn, this.downloadBtn].filter(Boolean);
        buttons.forEach(btn => {
            if (enabled) {
                btn.disabled = false;
                btn.style.opacity = '1';
            } else {
                btn.disabled = true;
                btn.style.opacity = '0.6';
            }
        });
    }

    showLoadingState(show, button = null) {
        if (button) {
            if (show) {
                button.dataset.originalText = button.textContent;
                button.innerHTML = '<div class="btn-spinner"></div> Processing...';
                button.disabled = true;
            } else {
                button.textContent = button.dataset.originalText;
                button.disabled = false;
            }
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.custom-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `custom-notification custom-notification--${type}`;
        notification.innerHTML = `
            <span class="custom-notification__message">${message}</span>
            <button class="custom-notification__close">&times;</button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            this.injectNotificationStyles();
        }

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('custom-notification--show');
        });

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Close button handler
        notification.querySelector('.custom-notification__close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.classList.remove('custom-notification--show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }

    injectNotificationStyles() {
        const styles = `
            .custom-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                border-left: 4px solid #6c757d;
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 10000;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .custom-notification--show {
                transform: translateX(0);
                opacity: 1;
            }
            .custom-notification--success { border-left-color: #28a745; }
            .custom-notification--error { border-left-color: #dc3545; }
            .custom-notification--info { border-left-color: #17a2b8; }
            .custom-notification__message {
                flex: 1;
                font-weight: 500;
            }
            .custom-notification__close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .btn-spinner {
                width: 16px;
                height: 16px;
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
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'notification-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    updateCartIcon() {
        // Dispatch custom event for cart update
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

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CustomKeychainEditor();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomKeychainEditor;
}