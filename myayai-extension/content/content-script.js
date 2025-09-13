/**
 * MyAyAI Content Script - Main Orchestrator
 * Coordinates platform detection, UI injection, and dynamic content monitoring
 */

class MyAyAIContentScript {
    constructor() {
        this.platformDetectors = null;
        this.uiInjector = null;
        this.mutationObserver = null;
        this.currentInput = null;
        this.currentPlatform = null;
        this.isInitialized = false;
        this.cleanupCallbacks = [];
        this.debounceTimer = null;
        this.errorHandler = null;
        this.logger = null;
        this.fallbackUI = null;
        
        // Initialize error handling
        this.initializeErrorHandling();
        
        // Configuration
        this.config = {
            minCharThreshold: 10,
            debounceDelay: 300,
            observerThrottle: 100,
            retryAttempts: 3,
            retryDelay: 1000
        };

        // Bind methods
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleMutation = this.handleMutation.bind(this);
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.cleanup = this.cleanup.bind(this);
    }

    /**
     * Initialize error handling system
     */
    async initializeErrorHandling() {
        try {
            // Try to get global error handler and logger
            if (window.MyAyaiErrorHandler) {
                this.errorHandler = window.MyAyaiErrorHandler;
            }
            if (window.MyAyaiLogger) {
                this.logger = window.MyAyaiLogger.child('ContentScript');
            }
            if (window.MyAyaiFallbackUI) {
                this.fallbackUI = window.MyAyaiFallbackUI;
            }
            
            // Set up global error handlers for this context
            window.addEventListener('error', (event) => {
                this.handleError(event.error || new Error(event.message), {
                    type: 'uncaught_exception',
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(event.reason, {
                    type: 'unhandled_promise_rejection'
                });
                event.preventDefault();
            });

            // Set up fallback UI message handling
            this.setupFallbackUIMessaging();
            
        } catch (error) {
            console.warn('[MyAyAI] Failed to initialize error handling:', error);
        }
    }

    /**
     * Initialize the content script
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        const initFunction = async () => {
            if (this.logger) {
                await this.logger.info('Initializing content script');
            } else {
                console.log('[MyAyAI] Initializing content script...');
            }

            // Wait for dependencies
            await this.waitForDependencies();

            // Initialize components with error boundaries
            this.platformDetectors = await this.safeInitialize(() => new PlatformDetectors(), 'PlatformDetectors');
            this.uiInjector = await this.safeInitialize(() => new UIInjector(), 'UIInjector');

            // Detect current platform
            this.currentPlatform = await this.safeExecute(
                () => this.platformDetectors.detectCurrentPlatform(),
                'platform detection'
            );
            
            if (this.currentPlatform) {
                const message = `Detected platform: ${this.currentPlatform.name}`;
                if (this.logger) {
                    await this.logger.info(message);
                } else {
                    console.log(`[MyAyAI] ${message}`);
                }
            } else {
                const message = 'Platform not recognized, using generic detection';
                if (this.logger) {
                    await this.logger.warn(message);
                } else {
                    console.log(`[MyAyAI] ${message}`);
                }
            }

            // Set up observers and listeners
            await this.safeExecute(() => this.setupMutationObserver(), 'mutation observer setup');
            await this.safeExecute(() => this.setupInputMonitoring(), 'input monitoring setup');
            await this.safeExecute(() => this.setupNavigationHandling(), 'navigation handling setup');
            await this.safeExecute(() => this.setupResizeHandling(), 'resize handling setup');

            // Initial scan for inputs
            await this.safeExecute(() => this.scanForInputs(), 'initial input scan');

            // Set up cleanup on page unload
            window.addEventListener('beforeunload', this.cleanup);
            
            this.isInitialized = true;
            
            const successMessage = 'Content script initialized successfully';
            if (this.logger) {
                await this.logger.success(successMessage);
            } else {
                console.log(`[MyAyAI] ${successMessage}`);
            }
        };

        // Execute initialization with error handling
        if (this.errorHandler && this.errorHandler.wrapAsync) {
            const wrappedInit = this.errorHandler.wrapAsync(initFunction, {
                retryAttempts: 2,
                context: { component: 'ContentScript', method: 'init' },
                showUserErrors: true,
                fallbackFn: () => this.initializeFallbackMode()
            });
            
            try {
                await wrappedInit();
            } catch (error) {
                await this.initializeFallbackMode();
            }
        } else {
            try {
                await initFunction();
            } catch (error) {
                this.handleError(error, 'initialization');
                await this.initializeFallbackMode();
            }
        }
    }

    /**
     * Set up fallback UI messaging
     */
    setupFallbackUIMessaging() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'myayai-recovery-request') {
                this.handleRecoveryRequest(event.data);
            } else if (event.data.type === 'myayai-health-check') {
                this.handleHealthCheck();
            }
        });
    }

    /**
     * Handle recovery request from fallback UI
     * @param {Object} data - Recovery request data
     */
    async handleRecoveryRequest(data) {
        try {
            if (this.logger) {
                await this.logger.info(`Handling recovery request (attempt ${data.attempt})`);
            }

            // Reset initialization state
            this.isInitialized = false;
            
            // Cleanup existing state
            this.cleanup(false);
            
            // Try to reinitialize
            await this.init();
            
            // Send response
            window.postMessage({
                type: 'myayai-recovery-response',
                success: this.isInitialized
            }, '*');
            
        } catch (error) {
            this.handleError(error, 'recovery_request');
            window.postMessage({
                type: 'myayai-recovery-response',
                success: false,
                error: error.message
            }, '*');
        }
    }

    /**
     * Handle health check from fallback UI
     */
    handleHealthCheck() {
        const isHealthy = this.isInitialized && 
                         this.platformDetectors && 
                         this.uiInjector;
        
        window.postMessage({
            type: 'myayai-health-response',
            healthy: isHealthy
        }, '*');
    }

    /**
     * Initialize fallback mode when normal initialization fails
     */
    async initializeFallbackMode() {
        try {
            if (this.logger) {
                await this.logger.warn('Initializing in fallback mode');
            } else {
                console.warn('[MyAyAI] Initializing in fallback mode');
            }
            
            // Minimal initialization with basic functionality
            this.isInitialized = true;
            
            // Activate fallback UI if available
            if (this.fallbackUI) {
                await this.fallbackUI.activate({
                    reason: 'Extension initialization failed but will retry automatically',
                    recoverable: true,
                    showMinimized: true,
                    autoRetry: true
                });
            } else {
                // Show basic fallback notification
                this.showFallbackNotification();
            }
            
            // Set up basic retry mechanism
            setTimeout(() => {
                if (this.isInitialized && !this.platformDetectors) {
                    if (this.logger) {
                        this.logger.info('Retrying full initialization from fallback mode');
                    }
                    this.isInitialized = false;
                    this.init();
                }
            }, 10000); // Retry after 10 seconds
            
        } catch (error) {
            if (this.logger) {
                await this.logger.error('Fallback initialization failed', error);
            } else {
                console.error('[MyAyAI] Fallback initialization failed:', error);
            }
        }
    }

    /**
     * Wait for required dependencies to load
     */
    async waitForDependencies() {
        const maxWait = 10000; // 10 seconds
        const checkInterval = 100;
        let elapsed = 0;

        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                if (window.PlatformDetectors && window.UIInjector) {
                    resolve();
                    return;
                }

                elapsed += checkInterval;
                if (elapsed >= maxWait) {
                    reject(new Error('Dependencies not loaded within timeout'));
                    return;
                }

                setTimeout(checkDependencies, checkInterval);
            };

            checkDependencies();
        });
    }

    /**
     * Set up MutationObserver for dynamic content
     */
    setupMutationObserver() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        this.mutationObserver = new MutationObserver(this.throttle(this.handleMutation, this.config.observerThrottle));

        // Start observing
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'contenteditable', 'placeholder']
        });

        this.cleanupCallbacks.push(() => {
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
                this.mutationObserver = null;
            }
        });
    }

    /**
     * Set up input monitoring
     */
    setupInputMonitoring() {
        const removeListener = this.platformDetectors.monitorInputChanges(this.handleInputChange);
        this.cleanupCallbacks.push(removeListener);
    }

    /**
     * Set up SPA navigation handling
     */
    setupNavigationHandling() {
        // Handle pushState/replaceState for SPA navigation
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            this.handleNavigation();
        };

        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            this.handleNavigation();
        };

        // Handle popstate events
        window.addEventListener('popstate', this.handleNavigation);

        // Handle hashchange for hash-based routing
        window.addEventListener('hashchange', this.handleNavigation);

        this.cleanupCallbacks.push(() => {
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
            window.removeEventListener('popstate', this.handleNavigation);
            window.removeEventListener('hashchange', this.handleNavigation);
        });
    }

    /**
     * Set up window resize handling
     */
    setupResizeHandling() {
        const throttledResize = this.throttle(this.handleResize, 250);
        window.addEventListener('resize', throttledResize);

        this.cleanupCallbacks.push(() => {
            window.removeEventListener('resize', throttledResize);
        });
    }

    /**
     * Handle mutations in the DOM
     */
    handleMutation(mutations) {
        let shouldRescan = false;

        for (const mutation of mutations) {
            // Check for new input elements
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (this.isInputElement(node) || node.querySelector('textarea, input[type="text"], [contenteditable="true"]')) {
                            shouldRescan = true;
                            break;
                        }
                    }
                }
            }

            // Check for attribute changes that might affect inputs
            if (mutation.type === 'attributes' && this.isInputElement(mutation.target)) {
                shouldRescan = true;
            }
        }

        if (shouldRescan) {
            this.debouncedScanForInputs();
        }
    }

    /**
     * Handle input content changes
     */
    handleInputChange(input, event) {
        try {
            // Skip if this isn't the main input we're tracking
            if (this.currentInput && this.currentInput !== input) {
                return;
            }

            const hasMinContent = this.platformDetectors.hasMinimumContent(input, this.config.minCharThreshold);

            if (hasMinContent && !this.uiInjector.activeButtons.has(input)) {
                // Show optimize button
                this.uiInjector.injectOptimizeButton(input, this.currentPlatform);
                this.currentInput = input;
            } else if (!hasMinContent && this.uiInjector.activeButtons.has(input)) {
                // Hide optimize button
                this.uiInjector.hideButton(input);
            }

        } catch (error) {
            console.warn('[MyAyAI] Error handling input change:', error);
        }
    }

    /**
     * Handle navigation changes (SPA)
     */
    handleNavigation() {
        console.log('[MyAyAI] Navigation detected, rescanning...');
        
        // Clear current state
        this.cleanup(false); // Don't remove listeners, just clear UI

        // Re-detect platform (URL might have changed)
        this.currentPlatform = this.platformDetectors.detectCurrentPlatform();
        
        // Rescan after a short delay to allow page to settle
        setTimeout(() => {
            this.debouncedScanForInputs();
        }, 500);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.uiInjector) {
            this.uiInjector.updateButtonPositions();
        }
    }

    /**
     * Scan for input elements
     */
    async scanForInputs() {
        try {
            console.log('[MyAyAI] Scanning for inputs...');

            const input = this.platformDetectors.findActiveInput(this.currentPlatform);
            
            if (input) {
                console.log('[MyAyAI] Found active input:', input);
                
                // Check if input already has enough content
                if (this.platformDetectors.hasMinimumContent(input, this.config.minCharThreshold)) {
                    this.uiInjector.injectOptimizeButton(input, this.currentPlatform);
                }
                
                this.currentInput = input;
                
                // Focus monitoring on this input
                this.focusOnInput(input);
            } else {
                console.log('[MyAyAI] No suitable input found');
            }

        } catch (error) {
            console.warn('[MyAyAI] Error scanning for inputs:', error);
        }
    }

    /**
     * Focus monitoring on specific input
     */
    focusOnInput(input) {
        if (!input) return;

        // Add specific listeners for this input
        const events = ['focus', 'blur', 'input', 'keyup'];
        const handlers = [];

        events.forEach(eventType => {
            const handler = (event) => this.handleInputChange(input, event);
            input.addEventListener(eventType, handler);
            handlers.push(() => input.removeEventListener(eventType, handler));
        });

        // Store cleanup callbacks
        this.cleanupCallbacks.push(...handlers);
    }

    /**
     * Check if element is an input
     */
    isInputElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const tagName = element.tagName.toLowerCase();
        return (
            tagName === 'textarea' ||
            (tagName === 'input' && element.type === 'text') ||
            element.contentEditable === 'true'
        );
    }

    /**
     * Debounced scan for inputs
     */
    debouncedScanForInputs() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.scanForInputs();
        }, this.config.debounceDelay);
    }

    /**
     * Throttle function execution
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Debounce function execution
     */
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

    /**
     * Safe initialization wrapper
     */
    async safeInitialize(initFn, componentName) {
        try {
            const component = initFn();
            if (this.logger) {
                await this.logger.debug(`${componentName} initialized successfully`);
            }
            return component;
        } catch (error) {
            const message = `Failed to initialize ${componentName}`;
            if (this.logger) {
                await this.logger.error(message, error);
            } else {
                console.error(`[MyAyAI] ${message}:`, error);
            }
            return null;
        }
    }

    /**
     * Safe execution wrapper
     */
    async safeExecute(fn, operation) {
        try {
            return await fn();
        } catch (error) {
            const message = `Failed to execute ${operation}`;
            if (this.logger) {
                await this.logger.warn(message, error);
            } else {
                console.warn(`[MyAyAI] ${message}:`, error);
            }
            return null;
        }
    }

    /**
     * Show fallback notification to user
     */
    showFallbackNotification() {
        if (this.errorHandler && this.errorHandler.showUserMessage) {
            this.errorHandler.showUserMessage(
                'MyAyai is running in safe mode. Some features may be limited. The extension will automatically retry full functionality.',
                'warning',
                8000
            );
        } else {
            // Fallback notification without error handler
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 12px 16px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;
            notification.textContent = 'MyAyai is running in safe mode. Some features may be limited.';
            
            document.body.appendChild(notification);
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 8000);
        }
    }

    /**
     * Handle errors with enhanced reporting and recovery
     */
    handleError(error, context = 'general') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            url: window.location.href,
            platform: this.currentPlatform?.name || 'unknown',
            timestamp: new Date().toISOString()
        };

        // Log with enhanced error handler if available
        if (this.errorHandler) {
            this.errorHandler.logError(error, errorInfo);
        } else {
            console.error(`[MyAyAI] Error in ${context}:`, error);
        }

        // Send error to background script for centralized logging
        if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
                type: 'ERROR_REPORT',
                payload: errorInfo
            }).catch(() => {
                // Silently ignore errors when sending error reports
            });
        }

        // Enhanced recovery logic
        if (context === 'initialization') {
            if (!this.isInitialized) {
                if (this.logger) {
                    this.logger.info('Scheduling initialization retry');
                } else {
                    console.log('[MyAyAI] Scheduling initialization retry...');
                }
                
                setTimeout(() => {
                    if (!this.isInitialized) {
                        this.init();
                    }
                }, this.config.retryDelay);
            }
        } else if (context === 'platform_detection' && this.platformDetectors) {
            // Try generic platform detection as fallback
            setTimeout(() => {
                if (this.logger) {
                    this.logger.debug('Retrying platform detection with generic fallback');
                }
                this.currentPlatform = { name: 'Generic', selectors: ['textarea', 'input[type="text"]', '[contenteditable="true"]'] };
                this.scanForInputs();
            }, 2000);
        } else if (context === 'ui_injection') {
            // Try to reinject UI after delay, or use fallback UI
            setTimeout(async () => {
                if (this.uiInjector && this.currentInput) {
                    if (this.logger) {
                        this.logger.debug('Retrying UI injection');
                    }
                    try {
                        this.uiInjector.injectOptimizeButton(this.currentInput, this.currentPlatform);
                    } catch (injectionError) {
                        // If UI injection keeps failing, activate fallback UI
                        if (this.fallbackUI && !this.fallbackUI.getStatus().isActive) {
                            await this.fallbackUI.activate({
                                reason: 'UI injection failed - platform interface may have changed',
                                recoverable: true,
                                showMinimized: false,
                                autoRetry: true
                            });
                        }
                    }
                } else if (this.fallbackUI && !this.fallbackUI.getStatus().isActive) {
                    await this.fallbackUI.activate({
                        reason: 'Core components failed to initialize',
                        recoverable: true,
                        showMinimized: false,
                        autoRetry: true
                    });
                }
            }, 1000);
        }
    }

    /**
     * Clean up resources and listeners
     */
    cleanup(removeListeners = true) {
        console.log('[MyAyAI] Cleaning up content script...');

        try {
            // Clear timers
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
            }

            // Clean up UI
            if (this.uiInjector) {
                this.uiInjector.cleanup();
            }

            // Clear current references
            this.currentInput = null;

            if (removeListeners) {
                // Execute all cleanup callbacks
                this.cleanupCallbacks.forEach(callback => {
                    try {
                        callback();
                    } catch (error) {
                        console.warn('[MyAyAI] Error during cleanup:', error);
                    }
                });
                this.cleanupCallbacks = [];

                this.isInitialized = false;
            }

        } catch (error) {
            console.warn('[MyAyAI] Error during cleanup:', error);
        }
    }

    /**
     * Public method to manually trigger rescan
     */
    rescan() {
        this.debouncedScanForInputs();
    }

    /**
     * Public method to get current status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            platform: this.currentPlatform?.name || 'unknown',
            hasActiveInput: !!this.currentInput,
            activeButtons: this.uiInjector?.activeButtons.size || 0
        };
    }
}

// Initialize when DOM is ready
function initializeMyAyAI() {
    // Check if already initialized
    if (window.myayaiContentScript) {
        return;
    }

    console.log('[MyAyAI] Starting content script initialization...');
    
    const contentScript = new MyAyAIContentScript();
    window.myayaiContentScript = contentScript;

    // Initialize immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => contentScript.init(), 100);
        });
    } else {
        // DOM is already loaded
        setTimeout(() => contentScript.init(), 100);
    }

    // Also listen for interactive state
    if (document.readyState === 'interactive') {
        setTimeout(() => contentScript.init(), 500);
    }

    // Fallback initialization
    setTimeout(() => {
        if (!contentScript.isInitialized) {
            console.log('[MyAyAI] Fallback initialization triggered');
            contentScript.init();
        }
    }, 2000);
}

// Start initialization
initializeMyAyAI();

// Handle dynamic script loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyAyAIContentScript;
}
