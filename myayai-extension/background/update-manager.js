/**
 * Update Manager for MyAyai Extension
 * Handles platform change detection, version updates, health monitoring, and system checks
 */

import { Logger } from '../utils/logger.js';
import { errorHandler } from '../utils/error-handler.js';

export class UpdateManager {
  constructor() {
    this.logger = new Logger('UpdateManager');
    this.isMonitoring = false;
    this.healthChecks = new Map();
    this.platformChecks = new Map();
    this.lastHealthCheck = null;
    this.healthCheckInterval = 5 * 60 * 1000; // 5 minutes
    this.platformCheckInterval = 30 * 1000; // 30 seconds
    this.performanceMetrics = {
      memory: [],
      responseTime: [],
      errorRate: []
    };
    
    // Platform detection patterns
    this.platformPatterns = {
      chatgpt: {
        selectors: [
          'div[role="presentation"]',
          '.text-base',
          'main.relative',
          'textarea[placeholder*="message"]',
          '[data-testid="send-button"]'
        ],
        url: /chat\.openai\.com/,
        name: 'ChatGPT'
      },
      claude: {
        selectors: [
          '[data-testid="chat-input"]',
          '.claude-chat',
          'div[role="textbox"]',
          '.message-container'
        ],
        url: /claude\.ai/,
        name: 'Claude'
      },
      bard: {
        selectors: [
          'rich-textarea',
          '.input-area',
          '.conversation-container'
        ],
        url: /bard\.google\.com/,
        name: 'Bard'
      },
      copilot: {
        selectors: [
          '#userInput',
          '.input-container',
          '.copilot-input'
        ],
        url: /copilot\.microsoft\.com/,
        name: 'Copilot'
      }
    };
    
    this.initialize();
  }

  /**
   * Initialize the update manager
   */
  async initialize() {
    try {
      await this.logger.info('Initializing UpdateManager');
      
      // Set up chrome extension event listeners
      this.setupExtensionListeners();
      
      // Start monitoring
      await this.startMonitoring();
      
      // Check for updates on initialization
      await this.checkForUpdates();
      
      await this.logger.info('UpdateManager initialized successfully');
    } catch (error) {
      errorHandler.logError(error, { component: 'UpdateManager', method: 'initialize' });
    }
  }

  /**
   * Setup Chrome extension event listeners
   */
  setupExtensionListeners() {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;

    // Handle extension installation/update
    chrome.runtime.onInstalled.addListener(async (details) => {
      await this.handleExtensionUpdate(details);
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle tab updates to detect platform changes
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          this.detectPlatformChange(tab.url, tabId);
        }
      });
    }

    // Handle tab activation
    if (chrome.tabs && chrome.tabs.onActivated) {
      chrome.tabs.onActivated.addListener(async (activeInfo) => {
        try {
          const tab = await chrome.tabs.get(activeInfo.tabId);
          if (tab.url) {
            await this.detectPlatformChange(tab.url, activeInfo.tabId);
          }
        } catch (error) {
          // Tab might be closed or not accessible
        }
      });
    }
  }

  /**
   * Handle extension update events
   * @param {Object} details - Installation details
   */
  async handleExtensionUpdate(details) {
    try {
      const manifest = chrome.runtime.getManifest();
      const currentVersion = manifest.version;
      
      await this.logger.info('Extension update detected', {
        reason: details.reason,
        currentVersion: currentVersion,
        previousVersion: details.previousVersion
      });

      switch (details.reason) {
        case 'install':
          await this.handleFirstInstall(currentVersion);
          break;
        case 'update':
          await this.handleVersionUpdate(details.previousVersion, currentVersion);
          break;
        case 'chrome_update':
          await this.handleBrowserUpdate();
          break;
      }
    } catch (error) {
      errorHandler.logError(error, { 
        component: 'UpdateManager', 
        method: 'handleExtensionUpdate',
        details
      });
    }
  }

  /**
   * Handle first installation
   * @param {string} version - Current version
   */
  async handleFirstInstall(version) {
    await this.logger.info('MyAyai extension installed', { version });
    
    // Set up initial configuration
    await chrome.storage.local.set({
      'first_install_date': new Date().toISOString(),
      'version': version,
      'health_monitoring_enabled': true,
      'platform_monitoring_enabled': true
    });

    // Show welcome notification
    this.showNotification('Welcome to MyAyai!', 
      'The extension has been installed and is ready to enhance your AI interactions.');
  }

  /**
   * Handle version update
   * @param {string} previousVersion - Previous version
   * @param {string} currentVersion - Current version
   */
  async handleVersionUpdate(previousVersion, currentVersion) {
    await this.logger.info('Extension updated', { previousVersion, currentVersion });
    
    // Update stored version
    await chrome.storage.local.set({ 'version': currentVersion });
    
    // Check if this is a major update
    const prevMajor = parseInt(previousVersion.split('.')[0]);
    const currMajor = parseInt(currentVersion.split('.')[0]);
    
    if (currMajor > prevMajor) {
      this.showNotification('MyAyai Updated!', 
        `Major update to version ${currentVersion}. Check out the new features!`);
    }
    
    // Perform any necessary migrations
    await this.performMigrations(previousVersion, currentVersion);
    
    // Clear caches that might be incompatible
    await this.clearLegacyData(previousVersion);
  }

  /**
   * Handle browser update
   */
  async handleBrowserUpdate() {
    await this.logger.info('Browser update detected');
    
    // Re-initialize platform detection as browser APIs might have changed
    setTimeout(() => {
      this.reinitializePlatformDetection();
    }, 5000);
  }

  /**
   * Start monitoring systems
   */
  async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Start health checks
    this.startHealthChecks();
    
    // Start platform monitoring
    this.startPlatformMonitoring();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    await this.logger.info('System monitoring started');
  }

  /**
   * Stop monitoring systems
   */
  async stopMonitoring() {
    this.isMonitoring = false;
    
    // Clear intervals
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.platformCheckTimer) {
      clearInterval(this.platformCheckTimer);
    }
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
    }
    
    await this.logger.info('System monitoring stopped');
  }

  /**
   * Start health checks
   */
  startHealthChecks() {
    this.healthCheckTimer = setInterval(async () => {
      await this.runHealthChecks();
    }, this.healthCheckInterval);
    
    // Run initial health check
    setTimeout(() => this.runHealthChecks(), 1000);
  }

  /**
   * Run comprehensive health checks
   */
  async runHealthChecks() {
    try {
      const healthResults = await this.logger.time('Health Check', async () => {
        const results = {
          timestamp: new Date().toISOString(),
          platform: await this.checkPlatformHealth(),
          storage: await this.checkStorageHealth(),
          memory: await this.checkMemoryHealth(),
          api: await this.checkApiHealth(),
          performance: await this.checkPerformanceHealth()
        };
        
        return results;
      });
      
      this.lastHealthCheck = healthResults;
      
      // Store health check results
      await this.storeHealthCheckResults(healthResults);
      
      // Check for critical issues
      await this.analyzeCriticalIssues(healthResults);
      
      await this.logger.debug('Health check completed', healthResults);
      
    } catch (error) {
      errorHandler.logError(error, { 
        component: 'UpdateManager', 
        method: 'runHealthChecks' 
      });
    }
  }

  /**
   * Check platform health
   */
  async checkPlatformHealth() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        return { status: 'unknown', message: 'No active tabs' };
      }
      
      const activeTab = tabs[0];
      const platform = this.detectPlatform(activeTab.url);
      
      if (!platform) {
        return { status: 'inactive', message: 'Not on a supported AI platform' };
      }
      
      // Check if platform selectors are still valid
      const selectorsValid = await this.validatePlatformSelectors(activeTab.id, platform);
      
      return {
        status: selectorsValid ? 'healthy' : 'degraded',
        platform: platform.name,
        url: activeTab.url,
        selectorsValid: selectorsValid,
        message: selectorsValid ? 'Platform is responsive' : 'Platform may have changed'
      };
      
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message,
        error: error.name
      };
    }
  }

  /**
   * Check storage health
   */
  async checkStorageHealth() {
    try {
      const storageInfo = await chrome.storage.local.getBytesInUse();
      const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
      const usagePercentage = (storageInfo / quota) * 100;
      
      let status = 'healthy';
      let message = `Storage usage: ${usagePercentage.toFixed(1)}%`;
      
      if (usagePercentage > 90) {
        status = 'critical';
        message = 'Storage nearly full - cleanup required';
      } else if (usagePercentage > 75) {
        status = 'warning';
        message = 'High storage usage detected';
      }
      
      return {
        status: status,
        usageBytes: storageInfo,
        quotaBytes: quota,
        usagePercentage: usagePercentage,
        message: message
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        error: error.name
      };
    }
  }

  /**
   * Check memory health
   */
  async checkMemoryHealth() {
    try {
      if (!performance.memory) {
        return { status: 'unknown', message: 'Memory info not available' };
      }
      
      const memory = performance.memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      
      // Store memory metrics for trending
      this.performanceMetrics.memory.push({
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
      
      // Keep only last 100 measurements
      if (this.performanceMetrics.memory.length > 100) {
        this.performanceMetrics.memory = this.performanceMetrics.memory.slice(-100);
      }
      
      let status = 'healthy';
      let message = `Memory usage: ${usagePercentage.toFixed(1)}%`;
      
      if (usagePercentage > 90) {
        status = 'critical';
        message = 'High memory usage detected';
      } else if (usagePercentage > 75) {
        status = 'warning';
        message = 'Elevated memory usage';
      }
      
      return {
        status: status,
        usedBytes: memory.usedJSHeapSize,
        totalBytes: memory.totalJSHeapSize,
        limitBytes: memory.jsHeapSizeLimit,
        usagePercentage: usagePercentage,
        message: message
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        error: error.name
      };
    }
  }

  /**
   * Check API health
   */
  async checkApiHealth() {
    try {
      // Check if Chrome extension APIs are working
      const apiChecks = {
        storage: false,
        tabs: false,
        runtime: false,
        activeTab: false
      };
      
      // Test storage API
      try {
        await chrome.storage.local.get(['test']);
        apiChecks.storage = true;
      } catch (e) {}
      
      // Test tabs API
      try {
        await chrome.tabs.query({ active: true });
        apiChecks.tabs = true;
      } catch (e) {}
      
      // Test runtime API
      try {
        chrome.runtime.getManifest();
        apiChecks.runtime = true;
      } catch (e) {}
      
      // Test active tab access
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        apiChecks.activeTab = tabs && tabs.length > 0;
      } catch (e) {}
      
      const workingApis = Object.values(apiChecks).filter(Boolean).length;
      const totalApis = Object.keys(apiChecks).length;
      
      let status = 'healthy';
      if (workingApis < totalApis) {
        status = workingApis < totalApis / 2 ? 'critical' : 'warning';
      }
      
      return {
        status: status,
        checks: apiChecks,
        workingApis: workingApis,
        totalApis: totalApis,
        message: `${workingApis}/${totalApis} APIs functional`
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        error: error.name
      };
    }
  }

  /**
   * Check performance health
   */
  async checkPerformanceHealth() {
    try {
      // Measure response time with a simple operation
      const startTime = performance.now();
      await chrome.storage.local.get(['test_key']);
      const responseTime = performance.now() - startTime;
      
      // Store performance metrics
      this.performanceMetrics.responseTime.push({
        timestamp: Date.now(),
        responseTime: responseTime
      });
      
      // Keep only last 50 measurements
      if (this.performanceMetrics.responseTime.length > 50) {
        this.performanceMetrics.responseTime = this.performanceMetrics.responseTime.slice(-50);
      }
      
      // Calculate average response time
      const avgResponseTime = this.performanceMetrics.responseTime
        .reduce((sum, metric) => sum + metric.responseTime, 0) / this.performanceMetrics.responseTime.length;
      
      let status = 'healthy';
      let message = `Avg response time: ${avgResponseTime.toFixed(2)}ms`;
      
      if (avgResponseTime > 1000) {
        status = 'critical';
        message = 'Very slow response times detected';
      } else if (avgResponseTime > 500) {
        status = 'warning';
        message = 'Slow response times detected';
      }
      
      return {
        status: status,
        currentResponseTime: responseTime,
        averageResponseTime: avgResponseTime,
        measurements: this.performanceMetrics.responseTime.length,
        message: message
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        error: error.name
      };
    }
  }

  /**
   * Start platform monitoring
   */
  startPlatformMonitoring() {
    this.platformCheckTimer = setInterval(async () => {
      await this.checkPlatformChanges();
    }, this.platformCheckInterval);
  }

  /**
   * Check for platform changes
   */
  async checkPlatformChanges() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) return;
      
      const activeTab = tabs[0];
      await this.detectPlatformChange(activeTab.url, activeTab.id);
      
    } catch (error) {
      await this.logger.debug('Platform change check failed', error);
    }
  }

  /**
   * Detect platform from URL
   * @param {string} url - Page URL
   * @returns {Object|null} Platform information
   */
  detectPlatform(url) {
    for (const [key, platform] of Object.entries(this.platformPatterns)) {
      if (platform.url.test(url)) {
        return { ...platform, key };
      }
    }
    return null;
  }

  /**
   * Detect platform change
   * @param {string} url - Page URL  
   * @param {number} tabId - Tab ID
   */
  async detectPlatformChange(url, tabId) {
    try {
      const platform = this.detectPlatform(url);
      const currentPlatform = this.platformChecks.get(tabId);
      
      if (platform && (!currentPlatform || currentPlatform.key !== platform.key)) {
        // Platform changed or new platform detected
        this.platformChecks.set(tabId, platform);
        
        await this.logger.info('Platform detected', { 
          platform: platform.name, 
          url, 
          tabId 
        });
        
        // Notify content script about platform change
        try {
          await chrome.tabs.sendMessage(tabId, {
            type: 'platform_detected',
            platform: platform
          });
        } catch (error) {
          // Content script might not be loaded yet
          await this.logger.debug('Failed to notify content script', error);
        }
        
        // Validate platform selectors
        setTimeout(async () => {
          await this.validatePlatformSelectors(tabId, platform);
        }, 2000);
        
      } else if (!platform && currentPlatform) {
        // Left a platform
        this.platformChecks.delete(tabId);
        await this.logger.info('Left platform', { 
          platform: currentPlatform.name, 
          tabId 
        });
      }
      
    } catch (error) {
      await this.logger.debug('Platform change detection failed', error);
    }
  }

  /**
   * Validate platform selectors are still working
   * @param {number} tabId - Tab ID
   * @param {Object} platform - Platform information
   * @returns {boolean} Whether selectors are valid
   */
  async validatePlatformSelectors(tabId, platform) {
    try {
      const results = await chrome.tabs.sendMessage(tabId, {
        type: 'validate_selectors',
        selectors: platform.selectors
      });
      
      const validSelectors = results?.validSelectors || 0;
      const totalSelectors = platform.selectors.length;
      const isValid = validSelectors > 0;
      
      if (!isValid) {
        await this.logger.warn('Platform selectors invalid', {
          platform: platform.name,
          validSelectors,
          totalSelectors,
          tabId
        });
        
        // Trigger graceful degradation
        errorHandler.showUserMessage(
          `${platform.name} interface may have changed. Some features might not work correctly.`,
          'warning'
        );
      }
      
      return isValid;
      
    } catch (error) {
      await this.logger.debug('Selector validation failed', error);
      return false;
    }
  }

  /**
   * Handle messages from content scripts
   * @param {Object} message - Message from content script
   * @param {Object} sender - Message sender
   * @param {Function} sendResponse - Response function
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'health_check_request':
          sendResponse(this.lastHealthCheck);
          break;
          
        case 'platform_change_detected':
          await this.handlePlatformChangeReport(message, sender);
          sendResponse({ status: 'acknowledged' });
          break;
          
        case 'performance_metrics':
          await this.recordPerformanceMetrics(message.metrics);
          sendResponse({ status: 'recorded' });
          break;
          
        case 'error_report':
          errorHandler.logError(new Error(message.error), {
            source: 'content_script',
            tabId: sender.tab?.id,
            url: sender.tab?.url,
            ...message.context
          });
          sendResponse({ status: 'logged' });
          break;
          
        default:
          sendResponse({ status: 'unknown_message_type' });
      }
    } catch (error) {
      errorHandler.logError(error, {
        component: 'UpdateManager',
        method: 'handleMessage',
        message: message
      });
      sendResponse({ status: 'error', error: error.message });
    }
  }

  /**
   * Check for extension updates
   */
  async checkForUpdates() {
    try {
      // Chrome will automatically update extensions
      // This is mainly for logging and user notification
      const manifest = chrome.runtime.getManifest();
      const storedData = await chrome.storage.local.get(['version', 'last_update_check']);
      
      await chrome.storage.local.set({
        'last_update_check': new Date().toISOString()
      });
      
      // If version changed, an update occurred
      if (storedData.version && storedData.version !== manifest.version) {
        await this.logger.info('Version change detected during update check', {
          previousVersion: storedData.version,
          currentVersion: manifest.version
        });
      }
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'UpdateManager',
        method: 'checkForUpdates'
      });
    }
  }

  /**
   * Show notification to user
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   */
  showNotification(title, message) {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon48.png',
        title: title,
        message: message
      });
    }
  }

  /**
   * Store health check results
   * @param {Object} results - Health check results
   */
  async storeHealthCheckResults(results) {
    try {
      const storedResults = await chrome.storage.local.get(['health_check_history']);
      const history = storedResults.health_check_history || [];
      
      history.push(results);
      
      // Keep only last 50 health checks
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      await chrome.storage.local.set({ 'health_check_history': history });
      
    } catch (error) {
      await this.logger.error('Failed to store health check results', error);
    }
  }

  /**
   * Analyze critical issues from health check
   * @param {Object} results - Health check results
   */
  async analyzeCriticalIssues(results) {
    const criticalIssues = [];
    
    Object.entries(results).forEach(([category, result]) => {
      if (result.status === 'critical') {
        criticalIssues.push({
          category,
          message: result.message,
          details: result
        });
      }
    });
    
    if (criticalIssues.length > 0) {
      await this.logger.error('Critical health issues detected', criticalIssues);
      
      // Show user notification for critical issues
      const messages = criticalIssues.map(issue => issue.message).join('; ');
      errorHandler.showUserMessage(
        `System issues detected: ${messages}`,
        'error',
        10000
      );
    }
  }

  /**
   * Get health status summary
   * @returns {Promise<Object>} Health status summary
   */
  async getHealthStatus() {
    if (!this.lastHealthCheck) {
      return { status: 'unknown', message: 'No health check data available' };
    }
    
    const statuses = Object.values(this.lastHealthCheck)
      .filter(result => result && typeof result === 'object' && result.status)
      .map(result => result.status);
    
    if (statuses.includes('critical')) {
      return { status: 'critical', message: 'Critical issues detected' };
    } else if (statuses.includes('warning')) {
      return { status: 'warning', message: 'Minor issues detected' };
    } else if (statuses.includes('error')) {
      return { status: 'error', message: 'Health check errors' };
    } else {
      return { status: 'healthy', message: 'All systems operational' };
    }
  }

  /**
   * Perform data migrations between versions
   * @param {string} previousVersion - Previous version
   * @param {string} currentVersion - Current version  
   */
  async performMigrations(previousVersion, currentVersion) {
    try {
      // Example migration logic - customize based on actual needs
      const prevMajor = parseInt(previousVersion.split('.')[0]);
      const currMajor = parseInt(currentVersion.split('.')[0]);
      
      if (prevMajor < 2 && currMajor >= 2) {
        // Example: Migrate from v1.x to v2.x
        await this.migrateToV2();
      }
      
      await this.logger.info('Data migrations completed', {
        previousVersion,
        currentVersion
      });
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'UpdateManager',
        method: 'performMigrations',
        previousVersion,
        currentVersion
      });
    }
  }

  /**
   * Example migration to version 2
   */
  async migrateToV2() {
    // Placeholder for actual migration logic
    await this.logger.info('Migrating data to version 2.x format');
    
    // Example: Rename old storage keys
    const oldData = await chrome.storage.local.get(['old_settings']);
    if (oldData.old_settings) {
      await chrome.storage.local.set({ 'new_settings': oldData.old_settings });
      await chrome.storage.local.remove(['old_settings']);
    }
  }

  /**
   * Clear legacy data from old versions
   * @param {string} previousVersion - Previous version
   */
  async clearLegacyData(previousVersion) {
    try {
      // Define keys to clear based on version
      const legacyKeys = [];
      
      const prevMajor = parseInt(previousVersion.split('.')[0]);
      if (prevMajor < 2) {
        legacyKeys.push('old_cache', 'deprecated_settings');
      }
      
      if (legacyKeys.length > 0) {
        await chrome.storage.local.remove(legacyKeys);
        await this.logger.info('Legacy data cleared', { keys: legacyKeys });
      }
      
    } catch (error) {
      await this.logger.warn('Failed to clear legacy data', error);
    }
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    this.performanceTimer = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60000); // Every minute
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    try {
      if (performance.memory) {
        this.performanceMetrics.memory.push({
          timestamp: Date.now(),
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        });
      }
      
      // Keep only recent metrics
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
      Object.keys(this.performanceMetrics).forEach(key => {
        this.performanceMetrics[key] = this.performanceMetrics[key]
          .filter(metric => metric.timestamp > cutoff);
      });
      
    } catch (error) {
      this.logger.debug('Performance metrics collection failed', error);
    }
  }

  /**
   * Get performance metrics summary
   * @returns {Object} Performance metrics summary
   */
  getPerformanceMetrics() {
    return {
      memory: this.performanceMetrics.memory.slice(-10), // Last 10 measurements
      responseTime: this.performanceMetrics.responseTime.slice(-10),
      errorRate: this.performanceMetrics.errorRate.slice(-10)
    };
  }

  /**
   * Reinitialize platform detection after browser updates
   */
  async reinitializePlatformDetection() {
    try {
      await this.logger.info('Reinitializing platform detection');
      
      // Clear existing platform checks
      this.platformChecks.clear();
      
      // Re-check active tabs
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('chrome://')) {
          await this.detectPlatformChange(tab.url, tab.id);
        }
      }
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'UpdateManager',
        method: 'reinitializePlatformDetection'
      });
    }
  }
}

// Create and export global instance
export const updateManager = new UpdateManager();

// Make available globally for other scripts
if (typeof window !== 'undefined') {
  window.MyAyaiUpdateManager = updateManager;
}
