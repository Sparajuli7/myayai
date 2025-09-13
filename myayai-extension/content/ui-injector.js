/**
 * UI Injection System for MyAyAI Extension
 * Handles creation and management of the floating optimize button
 */

// Import at top
import { showFloatingXP, showConfetti, showBadgeUnlock, showLevelUp } from '../ui/animations.js';
import { achievements } from '../ui/achievements.js'; // If needed, but since background handles tracking

class UIInjector {
    constructor() {
        this.activeButtons = new Map();
        this.animationDuration = 300;
        this.buttonId = 'myayai-optimize-button';
        this.containerId = 'myayai-ui-container';
        this.isInitialized = false;
        this.currentInput = null;
        this.currentPlatform = null;
        
        this.initializeStyles();
    }

    /**
     * Initialize global styles for the UI
     */
    initializeStyles() {
        if (this.isInitialized) return;

        const styleId = 'myayai-injected-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            .myayai-optimize-button {
                position: absolute;
                z-index: 999999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 12px;
                width: 40px;
                height: 40px;
                cursor: pointer;
                font-size: 16px;
                color: white;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
                transition: all ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transform: translateY(10px) scale(0.8);
                backdrop-filter: blur(10px);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                user-select: none;
                -webkit-user-select: none;
            }

            .myayai-optimize-button.show {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

            .myayai-optimize-button:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
                background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
            }

            .myayai-optimize-button:active {
                transform: translateY(0) scale(0.95);
                box-shadow: 0 2px 15px rgba(102, 126, 234, 0.3);
            }

            .myayai-optimize-button.processing {
                background: linear-gradient(135deg, #ffa726 0%, #ff7043 100%);
                animation: myayai-pulse 2s infinite;
            }

            @keyframes myayai-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .myayai-ghost-preview {
                position: absolute;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(102, 126, 234, 0.2);
                border-radius: 8px;
                padding: 12px;
                max-width: 300px;
                font-size: 14px;
                color: #333;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                z-index: 1000000;
                opacity: 0;
                transform: translateY(10px);
                transition: all ${this.animationDuration}ms ease-out;
                pointer-events: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.4;
                backdrop-filter: blur(10px);
            }

            .myayai-ghost-preview.show {
                opacity: 1;
                transform: translateY(0);
            }

            .myayai-ghost-preview::before {
                content: '';
                position: absolute;
                top: -5px;
                left: 20px;
                width: 10px;
                height: 10px;
                background: rgba(255, 255, 255, 0.95);
                border-left: 1px solid rgba(102, 126, 234, 0.2);
                border-top: 1px solid rgba(102, 126, 234, 0.2);
                transform: rotate(45deg);
            }

            .myayai-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4caf50;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
                z-index: 1000001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                opacity: 0;
                transform: translateX(100%);
                transition: all ${this.animationDuration}ms ease-out;
            }

            .myayai-notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            .myayai-notification.error {
                background: #f44336;
                box-shadow: 0 4px 20px rgba(244, 67, 54, 0.3);
            }

            /* Platform-specific adjustments */
            .myayai-chatgpt .myayai-optimize-button {
                border-radius: 8px;
            }

            .myayai-claude .myayai-optimize-button {
                background: linear-gradient(135deg, #c17a47 0%, #8b5a2b 100%);
                box-shadow: 0 4px 20px rgba(193, 122, 71, 0.3);
            }

            .myayai-claude .myayai-optimize-button:hover {
                background: linear-gradient(135deg, #a6623a 0%, #7a4d26 100%);
                box-shadow: 0 8px 30px rgba(193, 122, 71, 0.4);
            }

            .myayai-perplexity .myayai-optimize-button {
                background: linear-gradient(135deg, #20b2aa 0%, #008b8b 100%);
                box-shadow: 0 4px 20px rgba(32, 178, 170, 0.3);
            }

            .myayai-gemini .myayai-optimize-button {
                background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
                box-shadow: 0 4px 20px rgba(66, 133, 244, 0.3);
            }

            .myayai-copilot .myayai-optimize-button {
                background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
                box-shadow: 0 4px 20px rgba(0, 120, 212, 0.3);
            }

            /* Animation for slide-in */
            @keyframes myayai-slide-in {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            .myayai-slide-in {
                animation: myayai-slide-in ${this.animationDuration}ms ease-out;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        this.isInitialized = true;
    }

    /**
     * Inject optimize button for given input
     */
    injectOptimizeButton(input, platform) {
        if (!input || this.activeButtons.has(input)) {
            return;
        }

        try {
            this.currentInput = input;
            this.currentPlatform = platform;

            const button = this.createOptimizeButton(input, platform);
            const container = this.getOrCreateContainer(input);
            
            container.appendChild(button);
            this.activeButtons.set(input, button);

            // Position the button
            this.positionButton(button, input, container);

            // Show with animation
            requestAnimationFrame(() => {
                button.classList.add('show');
            });

            // Add platform-specific class to body for styling
            if (platform?.containerClass) {
                document.body.classList.add(platform.containerClass);
            }

        } catch (error) {
            console.error('[MyAyAI] Error injecting optimize button:', error);
            this.showNotification('Failed to inject optimize button', 'error');
        }
    }

    /**
     * Create the optimize button element
     */
    createOptimizeButton(input, platform) {
        const button = document.createElement('button');
        button.id = this.buttonId + '-' + Math.random().toString(36).substr(2, 9);
        button.className = 'myayai-optimize-button';
        button.innerHTML = '✨';
        button.title = 'Optimize with MyAyAI';
        button.setAttribute('aria-label', 'Optimize prompt with MyAyAI');

        // Add click handler
        button.addEventListener('click', (e) => this.handleOptimizeClick(e, input, platform));

        // Add hover handlers for ghost preview
        button.addEventListener('mouseenter', () => this.showGhostPreview(button, input));
        button.addEventListener('mouseleave', () => this.hideGhostPreview());

        return button;
    }

    /**
     * Get or create UI container for the input
     */
    getOrCreateContainer(input) {
        const inputContainer = input.closest('form') || 
                             input.closest('[class*="input"]') || 
                             input.closest('[class*="composer"]') ||
                             input.parentElement;

        let container = inputContainer.querySelector('.myayai-ui-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'myayai-ui-container';
            container.style.cssText = `
                position: relative;
                pointer-events: none;
                z-index: 999998;
            `;
            inputContainer.appendChild(container);
        }

        return container;
    }

    /**
     * Position the button relative to the input
     */
    positionButton(button, input, container) {
        const inputRect = input.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate position relative to container
        const relativeTop = inputRect.top - containerRect.top;
        const relativeRight = containerRect.right - inputRect.right;

        button.style.cssText = `
            position: absolute;
            top: ${relativeTop + inputRect.height - 50}px;
            right: ${relativeRight + 10}px;
            pointer-events: auto;
        `;

        // Adjust if button would be outside viewport
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.right > window.innerWidth - 10) {
            button.style.right = '10px';
        }
        if (buttonRect.bottom > window.innerHeight - 10) {
            button.style.top = `${relativeTop - 50}px`;
        }
    }

    /**
     * Handle optimize button click
     */
    async handleOptimizeClick(event, input, platform) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.target;
        const content = this.getInputContent(input);

        if (!content || content.trim().length < 10) {
            this.showNotification('Please type at least 10 characters to optimize', 'error');
            return;
        }

        try {
            button.classList.add('processing');
            button.innerHTML = '⚡';

            // Send message to extension for optimization
            const response = await this.requestOptimization(content, platform);
            
            if (response && response.optimizedText) {
                // Replace input content
                this.setInputContent(input, response.optimizedText);
                this.showNotification('Prompt optimized successfully!');
                
                // Hide button temporarily
                this.hideButton(input);
                
                // Optional: Auto-focus input for user to review
                input.focus();

                if (response.achievementData) {
                    const { xpGained, newlyUnlocked, leveledUp, newLevel } = response.achievementData;

                    showFloatingXP(xpGained, input);

                    if (newlyUnlocked.length > 0) {
                        newlyUnlocked.forEach(ach => showBadgeUnlock(ach.title));
                        showConfetti();
                    }

                    if (leveledUp) {
                        showLevelUp(newLevel);
                        showConfetti(5000);
                    }
                }
            } else {
                throw new Error('No optimization received');
            }

        } catch (error) {
            console.error('[MyAyAI] Optimization failed:', error);
            this.showNotification('Optimization failed. Please try again.', 'error');
        } finally {
            button.classList.remove('processing');
            button.innerHTML = '✨';
        }
    }

    /**
     * Request optimization from extension
     */
    async requestOptimization(content, platform) {
        return new Promise((resolve, reject) => {
            const message = {
                type: 'OPTIMIZE_PROMPT',
                payload: {
                    text: content,
                    platform: platform?.name || 'Unknown',
                    url: window.location.href
                }
            };

            // Send to extension background script
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            } else {
                // Fallback for testing or if chrome API unavailable
                setTimeout(() => {
                    resolve({
                        optimizedText: `[OPTIMIZED] ${content}`,
                        suggestions: ['More specific', 'Better context', 'Clearer intent']
                    });
                }, 1000);
            }
        });
    }

    /**
     * Show ghost preview on hover
     */
    showGhostPreview(button, input) {
        this.hideGhostPreview(); // Remove any existing preview

        const content = this.getInputContent(input);
        if (!content || content.length < 10) return;

        const preview = document.createElement('div');
        preview.className = 'myayai-ghost-preview';
        preview.id = 'myayai-ghost-preview';
        preview.innerHTML = `
            <strong>Preview optimization:</strong><br>
            <em>Click ✨ to enhance your prompt with AI-powered suggestions</em>
        `;

        document.body.appendChild(preview);

        // Position preview
        const buttonRect = button.getBoundingClientRect();
        preview.style.cssText = `
            position: fixed;
            top: ${buttonRect.top - preview.offsetHeight - 10}px;
            left: ${buttonRect.left - 150}px;
        `;

        // Adjust position if outside viewport
        if (preview.getBoundingClientRect().left < 10) {
            preview.style.left = '10px';
        }
        if (preview.getBoundingClientRect().top < 10) {
            preview.style.top = `${buttonRect.bottom + 10}px`;
        }

        requestAnimationFrame(() => {
            preview.classList.add('show');
        });
    }

    /**
     * Hide ghost preview
     */
    hideGhostPreview() {
        const preview = document.getElementById('myayai-ghost-preview');
        if (preview) {
            preview.classList.remove('show');
            setTimeout(() => {
                if (preview.parentNode) {
                    preview.parentNode.removeChild(preview);
                }
            }, this.animationDuration);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `myayai-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, this.animationDuration);
        }, 3000);
    }

    /**
     * Remove optimize button for input
     */
    hideButton(input) {
        const button = this.activeButtons.get(input);
        if (button) {
            button.classList.remove('show');
            setTimeout(() => {
                if (button.parentNode) {
                    button.parentNode.removeChild(button);
                }
                this.activeButtons.delete(input);
            }, this.animationDuration);
        }
    }

    /**
     * Clean up all buttons
     */
    cleanup() {
        this.activeButtons.forEach((button, input) => {
            this.hideButton(input);
        });
        
        // Remove platform classes
        document.body.className = document.body.className
            .replace(/myayai-\w+/g, '')
            .trim();

        this.hideGhostPreview();
    }

    /**
     * Get input content (textarea or contenteditable)
     */
    getInputContent(input) {
        if (!input) return '';
        
        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
            return input.value || '';
        } else if (input.contentEditable === 'true') {
            return input.textContent || input.innerText || '';
        }
        
        return '';
    }

    /**
     * Set input content (textarea or contenteditable)
     */
    setInputContent(input, content) {
        if (!input) return false;
        
        try {
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
                input.value = content;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (input.contentEditable === 'true') {
                input.textContent = content;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Trigger additional events for contenteditable
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: content
                });
                input.dispatchEvent(inputEvent);
            }
            
            return true;
        } catch (error) {
            console.warn('[MyAyAI] Error setting input content:', error);
            return false;
        }
    }

    /**
     * Check if should show optimize button based on content length
     */
    shouldShowOptimizeButton(input, threshold = 10) {
        const content = this.getInputContent(input);
        return content.trim().length >= threshold;
    }

    /**
     * Update button position on window resize
     */
    updateButtonPositions() {
        this.activeButtons.forEach((button, input) => {
            const container = button.parentElement;
            if (container && input) {
                this.positionButton(button, input, container);
            }
        });
    }
}

// Export for use in other scripts
window.UIInjector = UIInjector;
