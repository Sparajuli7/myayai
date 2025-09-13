/**
 * Platform Detection System for Major AI Platforms
 * Detects current platform and provides appropriate selectors
 */

class PlatformDetectors {
    constructor() {
        this.platforms = {
            chatgpt: {
                name: 'ChatGPT',
                domains: ['chat.openai.com', 'chatgpt.com'],
                selectors: {
                    primary: 'textarea#prompt-textarea',
                    fallback: [
                        'div[contenteditable="true"].ProseMirror',
                        'textarea[data-id="root"]',
                        '.composer textarea',
                        'form textarea[placeholder*="Message"]'
                    ]
                },
                containerClass: 'myayai-chatgpt',
                submitSelector: 'button[data-testid="send-button"]'
            },
            claude: {
                name: 'Claude',
                domains: ['claude.ai'],
                selectors: {
                    primary: 'div[contenteditable="true"][data-placeholder*="Reply"]',
                    fallback: [
                        'div.composer-textarea',
                        '.ProseMirror[contenteditable="true"]',
                        'div[data-placeholder*="Send a message"]',
                        '.conversation-input [contenteditable="true"]'
                    ]
                },
                containerClass: 'myayai-claude',
                submitSelector: 'button[aria-label*="Send"]'
            },
            perplexity: {
                name: 'Perplexity',
                domains: ['perplexity.ai', 'www.perplexity.ai'],
                selectors: {
                    primary: 'textarea[placeholder*="Ask"]',
                    fallback: [
                        'input[type="text"][placeholder*="Ask"]',
                        'textarea[aria-label*="Ask"]',
                        '.search-input textarea',
                        'form input[type="text"]'
                    ]
                },
                containerClass: 'myayai-perplexity',
                submitSelector: 'button[aria-label*="Submit"]'
            },
            gemini: {
                name: 'Gemini',
                domains: ['gemini.google.com', 'bard.google.com'],
                selectors: {
                    primary: 'rich-textarea',
                    fallback: [
                        '.ql-editor',
                        '.conversation-input',
                        'div[contenteditable="true"][aria-label*="Enter"]',
                        'textarea[aria-label*="Enter"]'
                    ]
                },
                containerClass: 'myayai-gemini',
                submitSelector: 'button[aria-label*="Send"]'
            },
            copilot: {
                name: 'Copilot',
                domains: ['copilot.microsoft.com', 'copilot.live'],
                selectors: {
                    primary: 'textarea[aria-label*="Ask"]',
                    fallback: [
                        'input[placeholder*="Ask"]',
                        '.input-box textarea',
                        'textarea[placeholder*="Type"]',
                        'div[contenteditable="true"][role="textbox"]'
                    ]
                },
                containerClass: 'myayai-copilot',
                submitSelector: 'button[title*="Submit"]'
            },
            poe: {
                name: 'Poe',
                domains: ['poe.com'],
                selectors: {
                    primary: '.ChatMessageInputContainer textarea',
                    fallback: [
                        'textarea[placeholder*="Talk"]',
                        '.MessageInputContainer textarea',
                        '.chat-input textarea',
                        'form textarea'
                    ]
                },
                containerClass: 'myayai-poe',
                submitSelector: 'button[class*="send"]'
            },
            characterai: {
                name: 'Character.AI',
                domains: ['character.ai', 'beta.character.ai'],
                selectors: {
                    primary: 'textarea[placeholder*="Type"]',
                    fallback: [
                        '.input-container textarea',
                        'textarea[aria-label*="Type"]',
                        '.message-input textarea',
                        'form textarea'
                    ]
                },
                containerClass: 'myayai-characterai',
                submitSelector: 'button[aria-label*="Send"]'
            }
        };
    }

    /**
     * Detect current platform based on hostname
     */
    detectCurrentPlatform() {
        const hostname = window.location.hostname;
        
        for (const [key, platform] of Object.entries(this.platforms)) {
            if (platform.domains.some(domain => hostname.includes(domain))) {
                return { id: key, ...platform };
            }
        }
        
        return null;
    }

    /**
     * Find the active input element for the current platform
     */
    findActiveInput(platform = null) {
        const currentPlatform = platform || this.detectCurrentPlatform();
        
        if (!currentPlatform) {
            return this.findGenericInput();
        }

        try {
            // Try primary selector first
            let input = document.querySelector(currentPlatform.selectors.primary);
            if (input && this.isInputVisible(input)) {
                return input;
            }

            // Try fallback selectors
            for (const selector of currentPlatform.selectors.fallback) {
                input = document.querySelector(selector);
                if (input && this.isInputVisible(input)) {
                    return input;
                }
            }

            // Last resort: find any visible input
            return this.findGenericInput();
        } catch (error) {
            console.warn('[MyAyAI] Error finding platform input:', error);
            return this.findGenericInput();
        }
    }

    /**
     * Generic input detection for unknown platforms
     */
    findGenericInput() {
        const genericSelectors = [
            'textarea[placeholder*="ask" i]',
            'textarea[placeholder*="type" i]',
            'textarea[placeholder*="message" i]',
            'input[type="text"][placeholder*="ask" i]',
            'div[contenteditable="true"][aria-label*="input" i]',
            'div[contenteditable="true"][role="textbox"]',
            'textarea:not([readonly]):not([disabled])',
            'input[type="text"]:not([readonly]):not([disabled])'
        ];

        for (const selector of genericSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (this.isInputVisible(element) && this.isLikelyMainInput(element)) {
                        return element;
                    }
                }
            } catch (error) {
                console.warn('[MyAyAI] Error with generic selector:', selector, error);
            }
        }

        return null;
    }

    /**
     * Check if input element is visible and usable
     */
    isInputVisible(element) {
        if (!element) return false;
        
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0 &&
            !element.disabled &&
            !element.readOnly
        );
    }

    /**
     * Heuristic to determine if this is likely the main input
     */
    isLikelyMainInput(element) {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        
        // Skip very small inputs (likely search boxes, etc.)
        if (rect.width < 200 || rect.height < 20) {
            return false;
        }

        // Skip inputs that are clearly not for chat/conversation
        const excludePatterns = [
            'search', 'filter', 'username', 'password', 'email',
            'login', 'signup', 'header', 'nav', 'sidebar'
        ];

        const elementText = (element.placeholder || element.ariaLabel || element.className || '').toLowerCase();
        if (excludePatterns.some(pattern => elementText.includes(pattern))) {
            return false;
        }

        // Prefer inputs that are more centrally located and larger
        const isInMainArea = rect.left > window.innerWidth * 0.1 && 
                           rect.right < window.innerWidth * 0.9 &&
                           rect.top > window.innerHeight * 0.2;

        return isInMainArea;
    }

    /**
     * Get input container for positioning UI elements
     */
    getInputContainer(input) {
        if (!input) return null;

        // Try to find the form or container
        let container = input.closest('form') || 
                       input.closest('[class*="input"]') || 
                       input.closest('[class*="composer"]') || 
                       input.closest('[class*="chat"]') || 
                       input.closest('[class*="message"]') ||
                       input.parentElement;

        // Ensure we have a reasonable container
        while (container && container !== document.body) {
            const rect = container.getBoundingClientRect();
            if (rect.width > input.getBoundingClientRect().width * 0.8) {
                break;
            }
            container = container.parentElement;
        }

        return container || input;
    }

    /**
     * Check if input has minimum character threshold
     */
    hasMinimumContent(input, threshold = 10) {
        if (!input) return false;
        
        const content = this.getInputContent(input);
        return content.trim().length >= threshold;
    }

    /**
     * Get content from input (handles both textarea and contenteditable)
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
     * Set content in input (handles both textarea and contenteditable)
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
                input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Some platforms need additional events
                const keyboardEvent = new KeyboardEvent('keyup', { bubbles: true });
                input.dispatchEvent(keyboardEvent);
            }
            
            return true;
        } catch (error) {
            console.warn('[MyAyAI] Error setting input content:', error);
            return false;
        }
    }

    /**
     * Monitor input changes with proper event delegation
     */
    monitorInputChanges(callback) {
        const events = ['input', 'keyup', 'paste', 'focus', 'blur'];
        const boundCallback = (event) => {
            const target = event.target;
            if (this.isInputVisible(target) && this.isLikelyMainInput(target)) {
                callback(target, event);
            }
        };

        events.forEach(eventType => {
            document.addEventListener(eventType, boundCallback, true);
        });

        return () => {
            events.forEach(eventType => {
                document.removeEventListener(eventType, boundCallback, true);
            });
        };
    }
}

// Export for use in other scripts
window.PlatformDetectors = PlatformDetectors;
