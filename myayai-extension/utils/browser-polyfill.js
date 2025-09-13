/**
 * Browser API Polyfill
 * Provides cross-browser compatibility for extension APIs
 */

(function(global) {
  'use strict';

  // Main browser API object
  let browser;

  // Check if we're in Firefox (has native browser object)
  if (typeof global.browser !== 'undefined') {
    browser = global.browser;
  }
  // Chrome/Edge/Brave/Opera (use chrome object)
  else if (typeof global.chrome !== 'undefined') {
    browser = global.chrome;
  }
  // Fallback for other environments
  else {
    browser = {};
  }

  /**
   * Promisify Chrome APIs that use callbacks
   */
  function promisify(fn, context) {
    return function(...args) {
      return new Promise((resolve, reject) => {
        const callback = (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        };
        
        args.push(callback);
        fn.apply(context, args);
      });
    };
  }

  /**
   * Storage API Polyfill
   */
  const storage = {
    local: {
      get: browser.storage?.local?.get || function(keys) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return promisify(chrome.storage.local.get, chrome.storage.local)(keys);
        }
        return Promise.resolve({});
      },
      
      set: browser.storage?.local?.set || function(items) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return promisify(chrome.storage.local.set, chrome.storage.local)(items);
        }
        return Promise.resolve();
      },
      
      remove: browser.storage?.local?.remove || function(keys) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return promisify(chrome.storage.local.remove, chrome.storage.local)(keys);
        }
        return Promise.resolve();
      },
      
      clear: browser.storage?.local?.clear || function() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return promisify(chrome.storage.local.clear, chrome.storage.local)();
        }
        return Promise.resolve();
      }
    },
    
    sync: {
      get: browser.storage?.sync?.get || function(keys) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return promisify(chrome.storage.sync.get, chrome.storage.sync)(keys);
        }
        return Promise.resolve({});
      },
      
      set: browser.storage?.sync?.set || function(items) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return promisify(chrome.storage.sync.set, chrome.storage.sync)(items);
        }
        return Promise.resolve();
      },
      
      remove: browser.storage?.sync?.remove || function(keys) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return promisify(chrome.storage.sync.remove, chrome.storage.sync)(keys);
        }
        return Promise.resolve();
      },
      
      clear: browser.storage?.sync?.clear || function() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return promisify(chrome.storage.sync.clear, chrome.storage.sync)();
        }
        return Promise.resolve();
      }
    },

    onChanged: {
      addListener: browser.storage?.onChanged?.addListener || function(callback) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.onChanged.addListener(callback);
        }
      },
      
      removeListener: browser.storage?.onChanged?.removeListener || function(callback) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.onChanged.removeListener(callback);
        }
      }
    }
  };

  /**
   * Runtime API Polyfill
   */
  const runtime = {
    sendMessage: browser.runtime?.sendMessage || function(message, options) {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return promisify(chrome.runtime.sendMessage, chrome.runtime)(message, options);
      }
      return Promise.resolve();
    },
    
    onMessage: {
      addListener: browser.runtime?.onMessage?.addListener || function(callback) {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.onMessage.addListener(callback);
        }
      },
      
      removeListener: browser.runtime?.onMessage?.removeListener || function(callback) {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.onMessage.removeListener(callback);
        }
      }
    },
    
    getManifest: browser.runtime?.getManifest || function() {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome.runtime.getManifest();
      }
      return {};
    },
    
    getURL: browser.runtime?.getURL || function(path) {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome.runtime.getURL(path);
      }
      return path;
    },

    id: browser.runtime?.id || (typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : ''),
    
    lastError: browser.runtime?.lastError || (typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.lastError : null)
  };

  /**
   * Tabs API Polyfill
   */
  const tabs = {
    query: browser.tabs?.query || function(queryInfo) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return promisify(chrome.tabs.query, chrome.tabs)(queryInfo);
      }
      return Promise.resolve([]);
    },
    
    get: browser.tabs?.get || function(tabId) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return promisify(chrome.tabs.get, chrome.tabs)(tabId);
      }
      return Promise.resolve({});
    },
    
    sendMessage: browser.tabs?.sendMessage || function(tabId, message, options) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return promisify(chrome.tabs.sendMessage, chrome.tabs)(tabId, message, options);
      }
      return Promise.resolve();
    },
    
    executeScript: browser.tabs?.executeScript || function(tabId, details) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return promisify(chrome.tabs.executeScript, chrome.tabs)(tabId, details);
      }
      return Promise.resolve([]);
    },
    
    insertCSS: browser.tabs?.insertCSS || function(tabId, details) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return promisify(chrome.tabs.insertCSS, chrome.tabs)(tabId, details);
      }
      return Promise.resolve();
    },
    
    onActivated: {
      addListener: browser.tabs?.onActivated?.addListener || function(callback) {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.onActivated.addListener(callback);
        }
      }
    },
    
    onUpdated: {
      addListener: browser.tabs?.onUpdated?.addListener || function(callback) {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.onUpdated.addListener(callback);
        }
      }
    }
  };

  /**
   * Scripting API Polyfill (Manifest V3)
   */
  const scripting = {
    executeScript: browser.scripting?.executeScript || function(details) {
      if (typeof chrome !== 'undefined' && chrome.scripting) {
        return promisify(chrome.scripting.executeScript, chrome.scripting)(details);
      } else if (typeof chrome !== 'undefined' && chrome.tabs) {
        // Fallback to tabs.executeScript for MV2
        return promisify(chrome.tabs.executeScript, chrome.tabs)(details.target.tabId, {
          code: details.func ? `(${details.func})()` : undefined,
          file: details.files ? details.files[0] : undefined
        });
      }
      return Promise.resolve([]);
    },
    
    insertCSS: browser.scripting?.insertCSS || function(details) {
      if (typeof chrome !== 'undefined' && chrome.scripting) {
        return promisify(chrome.scripting.insertCSS, chrome.scripting)(details);
      } else if (typeof chrome !== 'undefined' && chrome.tabs) {
        // Fallback to tabs.insertCSS for MV2
        return promisify(chrome.tabs.insertCSS, chrome.tabs)(details.target.tabId, {
          code: details.css,
          file: details.files ? details.files[0] : undefined
        });
      }
      return Promise.resolve();
    }
  };

  /**
   * Action API Polyfill (Manifest V3) / Browser Action (Manifest V2)
   */
  const action = browser.action || browser.browserAction || {
    setTitle: function(details) {
      const api = (typeof chrome !== 'undefined') ? 
        (chrome.action || chrome.browserAction) : null;
      if (api) {
        return promisify(api.setTitle, api)(details);
      }
      return Promise.resolve();
    },
    
    setBadgeText: function(details) {
      const api = (typeof chrome !== 'undefined') ? 
        (chrome.action || chrome.browserAction) : null;
      if (api) {
        return promisify(api.setBadgeText, api)(details);
      }
      return Promise.resolve();
    },
    
    setBadgeBackgroundColor: function(details) {
      const api = (typeof chrome !== 'undefined') ? 
        (chrome.action || chrome.browserAction) : null;
      if (api) {
        return promisify(api.setBadgeBackgroundColor, api)(details);
      }
      return Promise.resolve();
    },
    
    onClicked: {
      addListener: function(callback) {
        const api = (typeof chrome !== 'undefined') ? 
          (chrome.action || chrome.browserAction) : null;
        if (api && api.onClicked) {
          api.onClicked.addListener(callback);
        }
      }
    }
  };

  /**
   * Utility Functions
   */
  const utils = {
    /**
     * Get the manifest version
     */
    getManifestVersion: function() {
      try {
        const manifest = runtime.getManifest();
        return manifest.manifest_version || 2;
      } catch (e) {
        return 2;
      }
    },
    
    /**
     * Check if running in Firefox
     */
    isFirefox: function() {
      return typeof global.browser !== 'undefined' && 
             global.browser !== global.chrome;
    },
    
    /**
     * Check if running in Chrome-based browser
     */
    isChrome: function() {
      return typeof global.chrome !== 'undefined' && 
             (!global.browser || global.browser === global.chrome);
    },
    
    /**
     * Get browser name
     */
    getBrowserName: function() {
      if (this.isFirefox()) return 'firefox';
      if (this.isChrome()) return 'chrome';
      return 'unknown';
    },
    
    /**
     * Check if feature is supported
     */
    isSupported: function(feature) {
      const features = {
        'scripting': typeof chrome !== 'undefined' && !!chrome.scripting,
        'action': typeof chrome !== 'undefined' && !!chrome.action,
        'browserAction': typeof chrome !== 'undefined' && !!chrome.browserAction,
        'serviceWorker': this.getManifestVersion() === 3
      };
      
      return features[feature] || false;
    }
  };

  // Export polyfilled browser object
  const polyfill = {
    storage,
    runtime,
    tabs,
    scripting,
    action,
    utils
  };

  // Make available globally
  if (typeof global.browser === 'undefined') {
    global.browser = polyfill;
  }

  // Also export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = polyfill;
  }

  // AMD support
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return polyfill;
    });
  }

})(typeof globalThis !== 'undefined' ? globalThis : 
   typeof window !== 'undefined' ? window : 
   typeof global !== 'undefined' ? global : 
   typeof self !== 'undefined' ? self : this);
