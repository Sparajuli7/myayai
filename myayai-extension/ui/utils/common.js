// MyAyAI Common Utilities
// Shared utility functions for the extension

const MyAyAIUtils = {
    /**
     * DOM Utilities
     */
    dom: {
        /**
         * Create element with attributes and content
         */
        createElement(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            if (content) {
                if (typeof content === 'string') {
                    element.innerHTML = content;
                } else if (content instanceof HTMLElement) {
                    element.appendChild(content);
                } else if (Array.isArray(content)) {
                    content.forEach(child => {
                        if (typeof child === 'string') {
                            element.appendChild(document.createTextNode(child));
                        } else if (child instanceof HTMLElement) {
                            element.appendChild(child);
                        }
                    });
                }
            }
            
            return element;
        },

        /**
         * Add CSS styles to document head
         */
        addStyles(css, id) {
            if (id && document.getElementById(id)) return;
            
            const style = document.createElement('style');
            if (id) style.id = id;
            style.textContent = css;
            document.head.appendChild(style);
            
            return style;
        },

        /**
         * Wait for element to appear in DOM
         */
        waitForElement(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                
                const observer = new MutationObserver((mutations, obs) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        obs.disconnect();
                        resolve(element);
                    }
                });
                
                observer.observe(document, {
                    childList: true,
                    subtree: true
                });
                
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }, timeout);
            });
        },

        /**
         * Check if element is visible in viewport
         */
        isElementVisible(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        /**
         * Scroll element into view smoothly
         */
        scrollIntoView(element, options = {}) {
            const defaultOptions = {
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
                ...options
            };
            
            element.scrollIntoView(defaultOptions);
        },

        /**
         * Get element's absolute position
         */
        getElementPosition(element) {
            const rect = element.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
            };
        }
    },

    /**
     * String Utilities
     */
    string: {
        /**
         * Truncate string with ellipsis
         */
        truncate(str, length = 100, suffix = '...') {
            if (!str || str.length <= length) return str;
            return str.substring(0, length - suffix.length) + suffix;
        },

        /**
         * Capitalize first letter
         */
        capitalize(str) {
            if (!str) return str;
            return str.charAt(0).toUpperCase() + str.slice(1);
        },

        /**
         * Convert to title case
         */
        titleCase(str) {
            if (!str) return str;
            return str.replace(/\w\S*/g, txt => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        },

        /**
         * Remove HTML tags
         */
        stripHtml(html) {
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
        },

        /**
         * Escape HTML entities
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * Generate random string
         */
        random(length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },

        /**
         * Generate UUID v4
         */
        uuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        /**
         * Count words in text
         */
        wordCount(text) {
            if (!text) return 0;
            return text.trim().split(/\s+/).filter(word => word.length > 0).length;
        },

        /**
         * Extract URLs from text
         */
        extractUrls(text) {
            const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
            return text.match(urlRegex) || [];
        }
    },

    /**
     * Array Utilities
     */
    array: {
        /**
         * Remove duplicates from array
         */
        unique(arr) {
            return [...new Set(arr)];
        },

        /**
         * Chunk array into smaller arrays
         */
        chunk(arr, size) {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
            }
            return chunks;
        },

        /**
         * Shuffle array
         */
        shuffle(arr) {
            const result = [...arr];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        },

        /**
         * Group array by key
         */
        groupBy(arr, key) {
            return arr.reduce((groups, item) => {
                const groupKey = typeof key === 'function' ? key(item) : item[key];
                if (!groups[groupKey]) {
                    groups[groupKey] = [];
                }
                groups[groupKey].push(item);
                return groups;
            }, {});
        },

        /**
         * Find differences between arrays
         */
        diff(arr1, arr2) {
            return {
                added: arr2.filter(x => !arr1.includes(x)),
                removed: arr1.filter(x => !arr2.includes(x)),
                common: arr1.filter(x => arr2.includes(x))
            };
        }
    },

    /**
     * Object Utilities
     */
    object: {
        /**
         * Deep clone object
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        },

        /**
         * Deep merge objects
         */
        deepMerge(target, ...sources) {
            if (!sources.length) return target;
            const source = sources.shift();
            
            if (this.isObject(target) && this.isObject(source)) {
                for (const key in source) {
                    if (this.isObject(source[key])) {
                        if (!target[key]) Object.assign(target, { [key]: {} });
                        this.deepMerge(target[key], source[key]);
                    } else {
                        Object.assign(target, { [key]: source[key] });
                    }
                }
            }
            
            return this.deepMerge(target, ...sources);
        },

        /**
         * Check if value is object
         */
        isObject(item) {
            return item && typeof item === 'object' && !Array.isArray(item);
        },

        /**
         * Get nested object property safely
         */
        get(obj, path, defaultValue) {
            const keys = path.split('.');
            let result = obj;
            
            for (const key of keys) {
                if (result === null || result === undefined || !result.hasOwnProperty(key)) {
                    return defaultValue;
                }
                result = result[key];
            }
            
            return result;
        },

        /**
         * Set nested object property
         */
        set(obj, path, value) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            
            let current = obj;
            for (const key of keys) {
                if (!(key in current) || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            
            current[lastKey] = value;
            return obj;
        },

        /**
         * Remove undefined/null properties
         */
        clean(obj) {
            const cleaned = {};
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                if (value !== undefined && value !== null) {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        const nestedCleaned = this.clean(value);
                        if (Object.keys(nestedCleaned).length > 0) {
                            cleaned[key] = nestedCleaned;
                        }
                    } else {
                        cleaned[key] = value;
                    }
                }
            });
            return cleaned;
        }
    },

    /**
     * Date/Time Utilities
     */
    date: {
        /**
         * Format date for display
         */
        format(date, format = 'YYYY-MM-DD HH:mm:ss') {
            const d = new Date(date);
            const replacements = {
                'YYYY': d.getFullYear(),
                'MM': String(d.getMonth() + 1).padStart(2, '0'),
                'DD': String(d.getDate()).padStart(2, '0'),
                'HH': String(d.getHours()).padStart(2, '0'),
                'mm': String(d.getMinutes()).padStart(2, '0'),
                'ss': String(d.getSeconds()).padStart(2, '0')
            };
            
            return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
        },

        /**
         * Get relative time string
         */
        relative(date) {
            const now = new Date();
            const then = new Date(date);
            const diffMs = now - then;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffSeconds < 60) return 'just now';
            if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays < 7) return `${diffDays} days ago`;
            
            return this.format(date, 'MM/DD/YYYY');
        },

        /**
         * Check if date is today
         */
        isToday(date) {
            const today = new Date();
            const checkDate = new Date(date);
            return today.toDateString() === checkDate.toDateString();
        },

        /**
         * Add time to date
         */
        add(date, amount, unit = 'days') {
            const result = new Date(date);
            const units = {
                seconds: 1000,
                minutes: 60 * 1000,
                hours: 60 * 60 * 1000,
                days: 24 * 60 * 60 * 1000,
                weeks: 7 * 24 * 60 * 60 * 1000
            };
            
            result.setTime(result.getTime() + (amount * units[unit]));
            return result;
        }
    },

    /**
     * Storage Utilities
     */
    storage: {
        /**
         * Chrome storage wrapper with error handling
         */
        async get(keys, area = 'sync') {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) {
                    return {};
                }
                
                const result = await chrome.storage[area].get(keys);
                return result;
            } catch (error) {
                console.error('Storage get error:', error);
                return {};
            }
        },

        async set(data, area = 'sync') {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) {
                    return false;
                }
                
                await chrome.storage[area].set(data);
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },

        async remove(keys, area = 'sync') {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) {
                    return false;
                }
                
                await chrome.storage[area].remove(keys);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },

        async clear(area = 'sync') {
            try {
                if (typeof chrome === 'undefined' || !chrome.storage) {
                    return false;
                }
                
                await chrome.storage[area].clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    },

    /**
     * Validation Utilities
     */
    validate: {
        /**
         * Check if string is valid email
         */
        email(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        /**
         * Check if string is valid URL
         */
        url(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },

        /**
         * Check if value is not empty
         */
        required(value) {
            if (typeof value === 'string') {
                return value.trim().length > 0;
            }
            return value !== null && value !== undefined;
        },

        /**
         * Check string length
         */
        length(str, min = 0, max = Infinity) {
            const len = str ? str.length : 0;
            return len >= min && len <= max;
        },

        /**
         * Check if number is in range
         */
        range(num, min = -Infinity, max = Infinity) {
            const n = parseFloat(num);
            return !isNaN(n) && n >= min && n <= max;
        }
    },

    /**
     * Animation Utilities
     */
    animation: {
        /**
         * Fade in element
         */
        fadeIn(element, duration = 300) {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
            
            return new Promise(resolve => {
                setTimeout(resolve, duration);
            });
        },

        /**
         * Fade out element
         */
        fadeOut(element, duration = 300) {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            
            return new Promise(resolve => {
                setTimeout(() => {
                    element.style.display = 'none';
                    resolve();
                }, duration);
            });
        },

        /**
         * Slide down element
         */
        slideDown(element, duration = 300) {
            element.style.maxHeight = '0';
            element.style.overflow = 'hidden';
            element.style.transition = `max-height ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.maxHeight = element.scrollHeight + 'px';
            });
            
            return new Promise(resolve => {
                setTimeout(() => {
                    element.style.maxHeight = '';
                    element.style.overflow = '';
                    resolve();
                }, duration);
            });
        },

        /**
         * Slide up element
         */
        slideUp(element, duration = 300) {
            element.style.maxHeight = element.scrollHeight + 'px';
            element.style.overflow = 'hidden';
            element.style.transition = `max-height ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.maxHeight = '0';
            });
            
            return new Promise(resolve => {
                setTimeout(() => {
                    element.style.display = 'none';
                    resolve();
                }, duration);
            });
        }
    },

    /**
     * Debounce and Throttle
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func.apply(this, args);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Event Emitter
     */
    createEventEmitter() {
        const events = {};
        
        return {
            on(event, callback) {
                if (!events[event]) events[event] = [];
                events[event].push(callback);
            },
            
            off(event, callback) {
                if (!events[event]) return;
                events[event] = events[event].filter(cb => cb !== callback);
            },
            
            emit(event, ...args) {
                if (!events[event]) return;
                events[event].forEach(callback => callback(...args));
            },
            
            once(event, callback) {
                const onceCallback = (...args) => {
                    callback(...args);
                    this.off(event, onceCallback);
                };
                this.on(event, onceCallback);
            }
        };
    },

    /**
     * Platform Detection
     */
    platform: {
        isChrome: () => typeof chrome !== 'undefined' && chrome.runtime,
        isFirefox: () => typeof browser !== 'undefined' && browser.runtime,
        isMac: () => /Mac|iPod|iPhone|iPad/.test(navigator.platform),
        isWindows: () => /Win/.test(navigator.platform),
        isLinux: () => /Linux/.test(navigator.platform),
        isMobile: () => /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    },

    /**
     * Error Handling
     */
    error: {
        /**
         * Safe function execution with error handling
         */
        async safe(fn, fallback = null) {
            try {
                return await fn();
            } catch (error) {
                console.error('Safe execution failed:', error);
                return fallback;
            }
        },

        /**
         * Retry function execution
         */
        async retry(fn, maxRetries = 3, delay = 1000) {
            let lastError;
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    return await fn();
                } catch (error) {
                    lastError = error;
                    if (i < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            throw lastError;
        }
    }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyAyAIUtils;
} else if (typeof window !== 'undefined') {
    window.MyAyAIUtils = MyAyAIUtils;
} else {
    self.MyAyAIUtils = MyAyAIUtils;
}
