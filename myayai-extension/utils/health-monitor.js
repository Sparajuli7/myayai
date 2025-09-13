/**
 * Health Monitor for MyAyai Extension
 * Comprehensive health checks for platform selectors, API availability, storage, memory, and performance
 */

import { Logger } from './logger.js';
import { errorHandler } from './error-handler.js';

export class HealthMonitor {
  constructor() {
    this.logger = new Logger('HealthMonitor');
    this.checks = new Map();
    this.results = new Map();
    this.thresholds = {
      memory: {
        warning: 75, // percentage
        critical: 90
      },
      storage: {
        warning: 80, // percentage  
        critical: 95
      },
      responseTime: {
        warning: 500, // milliseconds
        critical: 2000
      },
      errorRate: {
        warning: 5, // percentage
        critical: 15
      }
    };
    
    this.platformSelectors = {
      chatgpt: [
        'textarea[placeholder*="message"]',
        '#prompt-textarea',
        'div[contenteditable="true"][data-testid]',
        '.ProseMirror',
        'main form textarea'
      ],
      claude: [
        '[data-testid="chat-input"]',
        '.claude-chat textarea',
        'div[role="textbox"]',
        '.message-input textarea',
        'fieldset textarea'
      ],
      bard: [
        'rich-textarea textarea',
        '.input-area textarea',
        '.conversation-container textarea',
        '#input-text',
        'chat-input textarea'
      ],
      copilot: [
        '#userInput',
        '.input-container textarea',
        '.copilot-input',
        '.chat-input textarea',
        'textarea[placeholder*="ask"]'
      ],
      gemini: [
        '.chat-input textarea',
        '#input-textarea',
        'textarea[data-testid="input"]',
        '.input-field textarea'
      ],
      generic: [
        'textarea',
        'input[type="text"]',
        'div[contenteditable="true"]',
        '[role="textbox"]'
      ]
    };
    
    this.initializeHealthChecks();
  }

  /**
   * Initialize all health check functions
   */
  initializeHealthChecks() {
    // Platform selector health checks
    this.registerCheck('platform_selectors', this.checkPlatformSelectors.bind(this), {
      interval: 30000, // 30 seconds
      timeout: 5000,
      critical: true
    });
    
    // API availability checks
    this.registerCheck('api_availability', this.checkAPIAvailability.bind(this), {
      interval: 60000, // 1 minute
      timeout: 10000,
      critical: true
    });
    
    // Storage quota checks
    this.registerCheck('storage_quota', this.checkStorageQuota.bind(this), {
      interval: 120000, // 2 minutes
      timeout: 5000,
      critical: false
    });
    
    // Memory usage monitoring
    this.registerCheck('memory_usage', this.checkMemoryUsage.bind(this), {
      interval: 30000, // 30 seconds
      timeout: 2000,
      critical: false
    });
    
    // Performance metrics
    this.registerCheck('performance_metrics', this.checkPerformanceMetrics.bind(this), {
      interval: 60000, // 1 minute
      timeout: 10000,
      critical: false
    });
    
    // Extension connectivity
    this.registerCheck('extension_connectivity', this.checkExtensionConnectivity.bind(this), {
      interval: 45000, // 45 seconds
      timeout: 3000,
      critical: true
    });
    
    // DOM accessibility
    this.registerCheck('dom_accessibility', this.checkDOMAccessibility.bind(this), {
      interval: 20000, // 20 seconds
      timeout: 5000,
      critical: true
    });
  }

  /**
   * Register a health check
   * @param {string} name - Check name
   * @param {Function} checkFunction - Function to execute
   * @param {Object} options - Check options
   */
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      fn: checkFunction,
      interval: options.interval || 60000,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      lastRun: 0,
      running: false,
      timer: null
    });
  }

  /**
   * Start all health monitoring
   */
  async startMonitoring() {
    try {
      await this.logger.info('Starting health monitoring');
      
      for (const [name, check] of this.checks) {
        this.startCheck(name, check);
      }
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'HealthMonitor',
        method: 'startMonitoring'
      });
    }
  }

  /**
   * Stop all health monitoring
   */
  async stopMonitoring() {
    try {
      await this.logger.info('Stopping health monitoring');
      
      for (const [name, check] of this.checks) {
        if (check.timer) {
          clearInterval(check.timer);
          check.timer = null;
        }
        check.running = false;
      }
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'HealthMonitor',
        method: 'stopMonitoring'
      });
    }
  }

  /**
   * Start individual health check
   * @param {string} name - Check name
   * @param {Object} check - Check configuration
   */
  startCheck(name, check) {
    // Run immediately
    this.runCheck(name, check);
    
    // Schedule periodic runs
    check.timer = setInterval(() => {
      this.runCheck(name, check);
    }, check.interval);
  }

  /**
   * Run individual health check
   * @param {string} name - Check name
   * @param {Object} check - Check configuration
   */
  async runCheck(name, check) {
    if (check.running) return; // Prevent overlapping runs
    
    check.running = true;
    const startTime = performance.now();
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Check timeout')), check.timeout);
      });
      
      const checkPromise = check.fn();
      const result = await Promise.race([checkPromise, timeoutPromise]);
      
      const duration = performance.now() - startTime;
      
      // Store result
      this.results.set(name, {
        ...result,
        timestamp: new Date().toISOString(),
        duration: duration,
        success: true
      });
      
      check.lastRun = Date.now();
      
      // Log if there are issues
      if (result.status !== 'healthy') {
        await this.logger.warn(`Health check ${name} reported ${result.status}`, result);
        
        if (result.status === 'critical' && check.critical) {
          this.handleCriticalIssue(name, result);
        }
      }
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Store error result
      this.results.set(name, {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
        duration: duration,
        success: false
      });
      
      await this.logger.error(`Health check ${name} failed`, {
        error: error.message,
        duration: duration
      });
      
      if (check.critical) {
        this.handleCriticalIssue(name, { status: 'error', message: error.message });
      }
      
    } finally {
      check.running = false;
    }
  }

  /**
   * Check platform selectors are still valid
   */
  async checkPlatformSelectors() {
    try {
      const currentUrl = window.location.href;
      const platform = this.detectPlatformFromUrl(currentUrl);
      
      if (!platform) {
        return {
          status: 'inactive',
          message: 'Not on a supported AI platform',
          platform: 'none',
          validSelectors: 0,
          totalSelectors: 0
        };
      }
      
      const selectors = this.platformSelectors[platform] || this.platformSelectors.generic;
      let validSelectors = 0;
      const selectorResults = [];
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          const isValid = elements.length > 0;
          
          if (isValid) {
            validSelectors++;
            // Check if elements are actually visible and interactable
            const visibleElements = Array.from(elements).filter(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0';
            });
            
            selectorResults.push({
              selector,
              found: elements.length,
              visible: visibleElements.length,
              valid: visibleElements.length > 0
            });
          } else {
            selectorResults.push({
              selector,
              found: 0,
              visible: 0,
              valid: false
            });
          }
        } catch (error) {
          selectorResults.push({
            selector,
            error: error.message,
            valid: false
          });
        }
      }
      
      const validPercentage = (validSelectors / selectors.length) * 100;
      let status = 'healthy';
      let message = `Platform selectors working (${validSelectors}/${selectors.length})`;
      
      if (validPercentage < 25) {
        status = 'critical';
        message = 'Most platform selectors are broken - platform may have changed';
      } else if (validPercentage < 50) {
        status = 'warning';
        message = 'Some platform selectors are not working - monitoring for platform changes';
      }
      
      return {
        status,
        message,
        platform,
        validSelectors,
        totalSelectors: selectors.length,
        validPercentage,
        selectorResults,
        url: currentUrl
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Selector check failed: ${error.message}`,
        error: error.name
      };
    }
  }

  /**
   * Check Chrome extension API availability
   */
  async checkAPIAvailability() {
    try {
      const apis = {
        storage: false,
        tabs: false,
        runtime: false,
        notifications: false,
        activeTab: false
      };
      
      let workingApis = 0;
      const apiResults = [];
      
      // Test storage API
      try {
        if (chrome.storage && chrome.storage.local) {
          await chrome.storage.local.get(['test_key']);
          apis.storage = true;
          workingApis++;
          apiResults.push({ api: 'storage', status: 'working' });
        }
      } catch (error) {
        apiResults.push({ api: 'storage', status: 'failed', error: error.message });
      }
      
      // Test tabs API (if available in context)
      try {
        if (chrome.tabs) {
          await chrome.tabs.query({ active: true, currentWindow: true });
          apis.tabs = true;
          workingApis++;
          apiResults.push({ api: 'tabs', status: 'working' });
        }
      } catch (error) {
        apiResults.push({ api: 'tabs', status: 'failed', error: error.message });
      }
      
      // Test runtime API
      try {
        if (chrome.runtime) {
          const manifest = chrome.runtime.getManifest();
          if (manifest) {
            apis.runtime = true;
            workingApis++;
            apiResults.push({ api: 'runtime', status: 'working', version: manifest.version });
          }
        }
      } catch (error) {
        apiResults.push({ api: 'runtime', status: 'failed', error: error.message });
      }
      
      // Test notifications API
      try {
        if (chrome.notifications) {
          apis.notifications = true;
          workingApis++;
          apiResults.push({ api: 'notifications', status: 'working' });
        }
      } catch (error) {
        apiResults.push({ api: 'notifications', status: 'failed', error: error.message });
      }
      
      // Test active tab permissions
      try {
        if (chrome.tabs) {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          apis.activeTab = tabs && tabs.length > 0;
          if (apis.activeTab) workingApis++;
          apiResults.push({ api: 'activeTab', status: apis.activeTab ? 'working' : 'no_access' });
        }
      } catch (error) {
        apiResults.push({ api: 'activeTab', status: 'failed', error: error.message });
      }
      
      const totalApis = Object.keys(apis).length;
      const workingPercentage = (workingApis / totalApis) * 100;
      
      let status = 'healthy';
      let message = `Chrome APIs working (${workingApis}/${totalApis})`;
      
      if (workingPercentage < 50) {
        status = 'critical';
        message = 'Critical Chrome APIs are not available';
      } else if (workingPercentage < 80) {
        status = 'warning';  
        message = 'Some Chrome APIs are not available';
      }
      
      return {
        status,
        message,
        workingApis,
        totalApis,
        workingPercentage,
        apis,
        apiResults
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `API availability check failed: ${error.message}`,
        error: error.name
      };
    }
  }

  /**
   * Check storage quota usage
   */
  async checkStorageQuota() {
    try {
      let storageInfo = { bytesInUse: 0, quota: 5242880 }; // Default 5MB
      
      if (chrome.storage && chrome.storage.local) {
        storageInfo.bytesInUse = await chrome.storage.local.getBytesInUse();
        storageInfo.quota = chrome.storage.local.QUOTA_BYTES || 5242880;
      }
      
      const usagePercentage = (storageInfo.bytesInUse / storageInfo.quota) * 100;
      const usageMB = storageInfo.bytesInUse / (1024 * 1024);
      const quotaMB = storageInfo.quota / (1024 * 1024);
      
      let status = 'healthy';
      let message = `Storage usage: ${usageMB.toFixed(2)}MB / ${quotaMB.toFixed(2)}MB (${usagePercentage.toFixed(1)}%)`;
      
      if (usagePercentage >= this.thresholds.storage.critical) {
        status = 'critical';
        message = `Storage critically full: ${usagePercentage.toFixed(1)}% - cleanup required`;
      } else if (usagePercentage >= this.thresholds.storage.warning) {
        status = 'warning';
        message = `High storage usage: ${usagePercentage.toFixed(1)}% - consider cleanup`;
      }
      
      return {
        status,
        message,
        bytesInUse: storageInfo.bytesInUse,
        quota: storageInfo.quota,
        usagePercentage,
        usageMB,
        quotaMB
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Storage quota check failed: ${error.message}`,
        error: error.name
      };
    }
  }

  /**
   * Check memory usage
   */
  async checkMemoryUsage() {
    try {
      if (!performance.memory) {
        return {
          status: 'unknown',
          message: 'Memory information not available in this browser',
          supported: false
        };
      }
      
      const memory = performance.memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const totalMB = memory.totalJSHeapSize / (1024 * 1024);
      const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
      
      let status = 'healthy';
      let message = `Memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (${usagePercentage.toFixed(1)}%)`;
      
      if (usagePercentage >= this.thresholds.memory.critical) {
        status = 'critical';
        message = `Critical memory usage: ${usagePercentage.toFixed(1)}% - performance degradation likely`;
      } else if (usagePercentage >= this.thresholds.memory.warning) {
        status = 'warning';
        message = `High memory usage: ${usagePercentage.toFixed(1)}% - monitoring performance`;
      }
      
      return {
        status,
        message,
        usedBytes: memory.usedJSHeapSize,
        totalBytes: memory.totalJSHeapSize,
        limitBytes: memory.jsHeapSizeLimit,
        usagePercentage,
        usedMB,
        totalMB,
        limitMB,
        supported: true
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Memory usage check failed: ${error.message}`,
        error: error.name
      };
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics() {
    try {
      // Test DOM query performance
      const domTestStart = performance.now();
      document.querySelectorAll('div, span, p, a').length;
      const domQueryTime = performance.now() - domTestStart;
      
      // Test storage performance
      const storageTestStart = performance.now();
      if (chrome.storage && chrome.storage.local) {
        await chrome.storage.local.get(['test_performance_key']);
      }
      const storageTime = performance.now() - storageTestStart;
      
      // Check for performance timing API
      let navigationTiming = null;
      if (performance.timing) {
        const timing = performance.timing;
        navigationTiming = {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
          pageLoad: timing.loadEventEnd - timing.navigationStart,
          domReady: timing.domComplete - timing.domLoading
        };
      }
      
      // Aggregate response time metric
      const avgResponseTime = (domQueryTime + storageTime) / 2;
      
      let status = 'healthy';
      let message = `Performance: DOM ${domQueryTime.toFixed(2)}ms, Storage ${storageTime.toFixed(2)}ms`;
      
      if (avgResponseTime >= this.thresholds.responseTime.critical) {
        status = 'critical';
        message = `Critical performance issues: ${avgResponseTime.toFixed(2)}ms average response time`;
      } else if (avgResponseTime >= this.thresholds.responseTime.warning) {
        status = 'warning';
        message = `Slow performance detected: ${avgResponseTime.toFixed(2)}ms average response time`;
      }
      
      return {
        status,
        message,
        domQueryTime,
        storageTime,
        avgResponseTime,
        navigationTiming,
        timestamp: Date.now()
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Performance metrics check failed: ${error.message}`,
        error: error.name
      };
    }
  }

  /**
   * Check extension connectivity
   */
  async checkExtensionConnectivity() {
    try {
      const results = {
        backgroundConnection: false,
        messageHandling: false,
        runtimeAvailable: false
      };
      
      // Test runtime availability
      if (chrome.runtime && chrome.runtime.id) {
        results.runtimeAvailable = true;
      }
      
      // Test message handling
      try {
        const response = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Message timeout')), 3000);
          
          chrome.runtime.sendMessage({ 
            type: 'health_check', 
            timestamp: Date.now() 
          }, (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        
        results.messageHandling = true;
        results.backgroundConnection = response && response.status === 'ok';
        
      } catch (error) {
        // Message handling failed
        results.messageError = error.message;
      }
      
      const workingConnections = Object.values(results).filter(Boolean).length;
      const totalConnections = 3;
      
      let status = 'healthy';
      let message = `Extension connectivity: ${workingConnections}/${totalConnections} working`;
      
      if (workingConnections === 0) {
        status = 'critical';
        message = 'Extension completely disconnected';
      } else if (workingConnections < totalConnections) {
        status = 'warning';
        message = 'Partial extension connectivity issues';
      }
      
      return {
        status,
        message,
        connections: results,
        workingConnections,
        totalConnections
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Connectivity check failed: ${error.message}`,
        error: error.name
      };
    }
  }

  /**
   * Check DOM accessibility
   */
  async checkDOMAccessibility() {
    try {
      const results = {
        bodyAccess: false,
        headAccess: false,
        scriptInjection: false,
        styleInjection: false,
        eventListeners: false
      };
      
      // Test body access
      try {
        results.bodyAccess = document.body !== null;
      } catch (error) {}
      
      // Test head access  
      try {
        results.headAccess = document.head !== null;
      } catch (error) {}
      
      // Test script injection capability
      try {
        const testScript = document.createElement('script');
        testScript.textContent = '// test';
        document.head.appendChild(testScript);
        document.head.removeChild(testScript);
        results.scriptInjection = true;
      } catch (error) {}
      
      // Test style injection capability
      try {
        const testStyle = document.createElement('style');
        testStyle.textContent = '/* test */';
        document.head.appendChild(testStyle);
        document.head.removeChild(testStyle);
        results.styleInjection = true;
      } catch (error) {}
      
      // Test event listener capability
      try {
        const testElement = document.createElement('div');
        const testHandler = () => {};
        testElement.addEventListener('click', testHandler);
        testElement.removeEventListener('click', testHandler);
        results.eventListeners = true;
      } catch (error) {}
      
      const workingFeatures = Object.values(results).filter(Boolean).length;
      const totalFeatures = Object.keys(results).length;
      
      let status = 'healthy';
      let message = `DOM access: ${workingFeatures}/${totalFeatures} features working`;
      
      if (workingFeatures < 3) {
        status = 'critical';
        message = 'Critical DOM access restrictions detected';
      } else if (workingFeatures < totalFeatures) {
        status = 'warning';
        message = 'Some DOM features restricted';
      }
      
      return {
        status,
        message,
        features: results,
        workingFeatures,
        totalFeatures,
        restrictions: totalFeatures - workingFeatures
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `DOM accessibility check failed: ${error.message}`,
        error: error.name
      };
    }
  }

  /**
   * Handle critical health issues
   * @param {string} checkName - Name of the failed check
   * @param {Object} result - Check result
   */
  async handleCriticalIssue(checkName, result) {
    try {
      const errorMessage = `Critical health issue in ${checkName}: ${result.message}`;
      
      // Log the critical issue
      errorHandler.logError(new Error(errorMessage), {
        component: 'HealthMonitor',
        check: checkName,
        result: result,
        critical: true
      });
      
      // Show user notification for critical issues
      errorHandler.showUserMessage(
        `System Issue: ${result.message}. Some features may not work properly.`,
        'error',
        10000
      );
      
      // Try automatic recovery for certain issues
      if (checkName === 'platform_selectors') {
        await this.attemptPlatformRecovery();
      } else if (checkName === 'storage_quota') {
        await this.attemptStorageCleanup();
      }
      
    } catch (error) {
      await this.logger.error('Failed to handle critical health issue', {
        originalCheck: checkName,
        handlingError: error.message
      });
    }
  }

  /**
   * Attempt to recover from platform selector issues
   */
  async attemptPlatformRecovery() {
    try {
      await this.logger.info('Attempting platform selector recovery');
      
      // Try to trigger a rescan of the page
      if (window.myayaiContentScript && window.myayaiContentScript.rescan) {
        window.myayaiContentScript.rescan();
      }
      
      // Send message to background to re-detect platform
      if (chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'platform_recovery_request',
          url: window.location.href
        });
      }
      
    } catch (error) {
      await this.logger.error('Platform recovery failed', error);
    }
  }

  /**
   * Attempt to clean up storage
   */
  async attemptStorageCleanup() {
    try {
      await this.logger.info('Attempting storage cleanup');
      
      if (chrome.storage && chrome.storage.local) {
        // Clean up old logs, caches, etc.
        const keysToClean = ['old_logs', 'cache_', 'temp_', 'debug_'];
        
        for (const keyPrefix of keysToClean) {
          try {
            const allData = await chrome.storage.local.get();
            const keysToRemove = Object.keys(allData)
              .filter(key => key.startsWith(keyPrefix));
            
            if (keysToRemove.length > 0) {
              await chrome.storage.local.remove(keysToRemove);
              await this.logger.info(`Cleaned up ${keysToRemove.length} storage items with prefix: ${keyPrefix}`);
            }
          } catch (error) {
            await this.logger.debug(`Failed to clean keys with prefix ${keyPrefix}:`, error);
          }
        }
      }
      
    } catch (error) {
      await this.logger.error('Storage cleanup failed', error);
    }
  }

  /**
   * Get current health status summary
   * @returns {Object} Health status summary
   */
  getHealthSummary() {
    const results = Array.from(this.results.values());
    if (results.length === 0) {
      return { status: 'unknown', message: 'No health data available' };
    }
    
    const statuses = results.map(r => r.status);
    const criticalCount = statuses.filter(s => s === 'critical').length;
    const warningCount = statuses.filter(s => s === 'warning').length;
    const errorCount = statuses.filter(s => s === 'error').length;
    
    let overallStatus = 'healthy';
    let message = 'All systems operational';
    
    if (criticalCount > 0) {
      overallStatus = 'critical';
      message = `${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} detected`;
    } else if (errorCount > 0) {
      overallStatus = 'error';
      message = `${errorCount} check${errorCount > 1 ? 's' : ''} failed`;
    } else if (warningCount > 0) {
      overallStatus = 'warning';
      message = `${warningCount} warning${warningCount > 1 ? 's' : ''} detected`;
    }
    
    return {
      status: overallStatus,
      message: message,
      criticalCount,
      warningCount,
      errorCount,
      totalChecks: results.length,
      lastUpdate: this.getLatestCheckTime()
    };
  }

  /**
   * Get detailed health report
   * @returns {Object} Detailed health report
   */
  getDetailedReport() {
    const summary = this.getHealthSummary();
    const checks = {};
    
    for (const [name, result] of this.results.entries()) {
      checks[name] = { ...result };
    }
    
    return {
      summary,
      checks,
      timestamp: new Date().toISOString(),
      thresholds: this.thresholds
    };
  }

  /**
   * Get latest check time
   * @returns {string} Latest check timestamp
   */
  getLatestCheckTime() {
    const timestamps = Array.from(this.results.values())
      .map(r => r.timestamp)
      .filter(Boolean)
      .sort()
      .reverse();
    
    return timestamps[0] || null;
  }

  /**
   * Detect platform from URL
   * @param {string} url - Current URL
   * @returns {string|null} Platform identifier
   */
  detectPlatformFromUrl(url) {
    const platformPatterns = {
      chatgpt: /chat\.openai\.com/,
      claude: /claude\.ai/,
      bard: /bard\.google\.com/,
      copilot: /copilot\.microsoft\.com/,
      gemini: /gemini\.google\.com/
    };
    
    for (const [platform, pattern] of Object.entries(platformPatterns)) {
      if (pattern.test(url)) {
        return platform;
      }
    }
    
    return null;
  }

  /**
   * Force run all health checks
   * @returns {Promise<Object>} Health report
   */
  async runAllChecks() {
    const promises = [];
    
    for (const [name, check] of this.checks.entries()) {
      promises.push(this.runCheck(name, check));
    }
    
    await Promise.allSettled(promises);
    return this.getDetailedReport();
  }

  /**
   * Force run specific health check
   * @param {string} checkName - Name of check to run
   * @returns {Promise<Object>} Check result
   */
  async runSingleCheck(checkName) {
    const check = this.checks.get(checkName);
    if (!check) {
      throw new Error(`Health check '${checkName}' not found`);
    }
    
    await this.runCheck(checkName, check);
    return this.results.get(checkName);
  }
}

// Create global instance
export const healthMonitor = new HealthMonitor();

// Make available globally for other scripts
if (typeof window !== 'undefined') {
  window.MyAyaiHealthMonitor = healthMonitor;
}
