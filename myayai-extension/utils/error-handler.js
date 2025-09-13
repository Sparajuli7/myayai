/**
 * Comprehensive Error Handler for MyAyai Extension
 * Provides global error handling, retry logic, graceful degradation, and user notifications
 */

import { Logger } from './logger.js';

export class ErrorHandler {
  constructor() {
    this.logger = new Logger('ErrorHandler');
    this.retryAttempts = new Map();
    this.errorCounts = new Map();
    this.gracefulDegradationEnabled = true;
    this.maxRetryAttempts = 3;
    this.baseRetryDelay = 1000; // 1 second
    this.maxRetryDelay = 30000; // 30 seconds
    this.errorReportingEnabled = false; // Will be true when Sentry is configured
    
    // Initialize global error handlers
    this.initializeGlobalHandlers();
  }

  /**
   * Initialize global error handlers for unhandled errors
   */
  initializeGlobalHandlers() {
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        type: 'uncaught_exception',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, {
        type: 'unhandled_promise_rejection',
        promise: event.promise
      });
      event.preventDefault(); // Prevent console error
    });

    // Handle extension-specific errors
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'error_report') {
          this.logError(new Error(message.error), message.context);
        }
      });
    }
  }

  /**
   * Log error with context information
   * @param {Error} error - The error object
   * @param {Object} context - Additional context information
   */
  logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: context,
      userAgent: navigator.userAgent,
      url: window.location?.href,
      errorId: this.generateErrorId()
    };

    // Increment error count
    const errorKey = `${error.name}:${error.message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    this.logger.error('Error occurred', errorInfo);
    
    // Report error to external service if enabled
    if (this.errorReportingEnabled) {
      this.reportError(error, context);
    }

    return errorInfo;
  }

  /**
   * Report error to external monitoring service (Sentry ready)
   * @param {Error} error - The error object
   * @param {Object} context - Additional context information
   */
  async reportError(error, context = {}) {
    try {
      // Prepare for Sentry integration
      const errorData = {
        message: error.message,
        stack: error.stack,
        context: context,
        timestamp: new Date().toISOString(),
        version: chrome.runtime.getManifest().version,
        browser: this.getBrowserInfo()
      };

      // Future Sentry implementation
      // if (typeof Sentry !== 'undefined') {
      //   Sentry.captureException(error, {
      //     contexts: { custom: context },
      //     extra: errorData
      //   });
      // }

      // For now, store error reports locally for debugging
      await this.storeErrorReport(errorData);
      
    } catch (reportingError) {
      this.logger.error('Failed to report error', { reportingError, originalError: error });
    }
  }

  /**
   * Store error report locally
   * @param {Object} errorData - Error data to store
   */
  async storeErrorReport(errorData) {
    try {
      const reports = await this.getStoredErrorReports();
      reports.push(errorData);
      
      // Keep only last 100 error reports
      if (reports.length > 100) {
        reports.splice(0, reports.length - 100);
      }
      
      await chrome.storage.local.set({ 'error_reports': reports });
    } catch (error) {
      console.error('Failed to store error report:', error);
    }
  }

  /**
   * Get stored error reports
   * @returns {Promise<Array>} Array of error reports
   */
  async getStoredErrorReports() {
    try {
      const result = await chrome.storage.local.get(['error_reports']);
      return result.error_reports || [];
    } catch (error) {
      console.error('Failed to get stored error reports:', error);
      return [];
    }
  }

  /**
   * Show user-friendly error message
   * @param {string} message - User-friendly message
   * @param {string} type - Message type (info, warning, error)
   * @param {number} duration - Display duration in milliseconds
   */
  showUserMessage(message, type = 'error', duration = 5000) {
    try {
      // Create notification element
      const notification = this.createNotificationElement(message, type);
      
      // Add to DOM
      const container = this.getOrCreateNotificationContainer();
      container.appendChild(notification);
      
      // Auto-remove after duration
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, duration);
      
      // Add click to dismiss
      notification.addEventListener('click', () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
      
    } catch (error) {
      // Fallback to console if UI notification fails
      console.error('Failed to show user message:', message, error);
    }
  }

  /**
   * Create notification element
   * @param {string} message - Message text
   * @param {string} type - Notification type
   * @returns {HTMLElement} Notification element
   */
  createNotificationElement(message, type) {
    const notification = document.createElement('div');
    notification.className = `myayai-notification myayai-notification--${type}`;
    notification.innerHTML = `
      <div class="myayai-notification__icon">
        ${this.getNotificationIcon(type)}
      </div>
      <div class="myayai-notification__message">${this.escapeHtml(message)}</div>
      <div class="myayai-notification__close">×</div>
    `;
    
    // Add styles if not already added
    this.addNotificationStyles();
    
    return notification;
  }

  /**
   * Get or create notification container
   * @returns {HTMLElement} Notification container
   */
  getOrCreateNotificationContainer() {
    let container = document.getElementById('myayai-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'myayai-notifications';
      container.className = 'myayai-notifications-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Add notification styles to page
   */
  addNotificationStyles() {
    if (document.getElementById('myayai-notification-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'myayai-notification-styles';
    styles.textContent = `
      .myayai-notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      }
      .myayai-notification {
        display: flex;
        align-items: center;
        background: white;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        pointer-events: auto;
        cursor: pointer;
        transition: all 0.3s ease;
        border-left: 4px solid #007bff;
      }
      .myayai-notification:hover {
        transform: translateX(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      .myayai-notification--error {
        border-left-color: #dc3545;
      }
      .myayai-notification--warning {
        border-left-color: #ffc107;
      }
      .myayai-notification--info {
        border-left-color: #17a2b8;
      }
      .myayai-notification__icon {
        margin-right: 12px;
        font-size: 18px;
      }
      .myayai-notification__message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
        color: #333;
      }
      .myayai-notification__close {
        margin-left: 12px;
        font-size: 18px;
        color: #999;
        cursor: pointer;
      }
      .myayai-notification__close:hover {
        color: #333;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon HTML
   */
  getNotificationIcon(type) {
    const icons = {
      error: '⚠️',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type] || icons.info;
  }

  /**
   * Escape HTML in user messages
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxAttempts - Maximum retry attempts
   * @param {string} operationId - Unique identifier for the operation
   * @param {Object} context - Additional context for logging
   * @returns {Promise} Result of the function or final error
   */
  async retry(fn, maxAttempts = this.maxRetryAttempts, operationId = null, context = {}) {
    const id = operationId || this.generateOperationId();
    let attempts = this.retryAttempts.get(id) || 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await fn();
        this.retryAttempts.delete(id); // Clear attempts on success
        if (attempts > 0) {
          this.logger.info(`Operation succeeded after ${attempts} retries`, { operationId: id, context });
        }
        return result;
      } catch (error) {
        attempts++;
        this.retryAttempts.set(id, attempts);
        
        if (attempts >= maxAttempts) {
          this.logError(error, {
            ...context,
            operationId: id,
            attempts: attempts,
            maxAttempts: maxAttempts,
            finalAttempt: true
          });
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.baseRetryDelay * Math.pow(2, attempts - 1),
          this.maxRetryDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const finalDelay = delay + jitter;
        
        this.logger.warn(`Operation failed, retrying in ${finalDelay}ms`, {
          operationId: id,
          attempt: attempts,
          maxAttempts: maxAttempts,
          error: error.message,
          context
        });
        
        await this.sleep(finalDelay);
      }
    }
  }

  /**
   * Enable graceful degradation for failed operations
   * @param {Function} primaryFn - Primary function to try
   * @param {Function} fallbackFn - Fallback function if primary fails
   * @param {string} context - Context description for logging
   * @returns {Promise} Result from primary or fallback function
   */
  async gracefulDegrade(primaryFn, fallbackFn, context = 'unknown') {
    if (!this.gracefulDegradationEnabled) {
      return await primaryFn();
    }
    
    try {
      return await primaryFn();
    } catch (primaryError) {
      this.logger.warn(`Primary operation failed, using fallback`, {
        context,
        primaryError: primaryError.message
      });
      
      try {
        const result = await fallbackFn();
        this.showUserMessage(
          'Some features may be limited due to platform changes. The extension is running in compatibility mode.',
          'warning',
          8000
        );
        return result;
      } catch (fallbackError) {
        this.logError(fallbackError, {
          context,
          primaryError: primaryError.message,
          fallbackAttempted: true
        });
        throw fallbackError;
      }
    }
  }

  /**
   * Wrap async function with comprehensive error handling
   * @param {Function} fn - Async function to wrap
   * @param {Object} options - Error handling options
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, options = {}) {
    const {
      retryAttempts = this.maxRetryAttempts,
      showUserErrors = false,
      context = {},
      operationId = null,
      fallbackFn = null
    } = options;
    
    return async (...args) => {
      const wrappedFn = async () => {
        try {
          return await fn(...args);
        } catch (error) {
          if (showUserErrors) {
            this.showUserMessage(
              'An error occurred while processing your request. Please try again.',
              'error'
            );
          }
          throw error;
        }
      };
      
      if (fallbackFn) {
        return await this.gracefulDegrade(
          () => this.retry(wrappedFn, retryAttempts, operationId, context),
          fallbackFn,
          context.description || 'wrapped_operation'
        );
      } else {
        return await this.retry(wrappedFn, retryAttempts, operationId, context);
      }
    };
  }

  /**
   * Create error boundary for React-like component error handling
   * @param {Function} component - Component function
   * @param {Function} errorFallback - Error fallback component
   * @returns {Function} Component with error boundary
   */
  createErrorBoundary(component, errorFallback = null) {
    return (...args) => {
      try {
        return component(...args);
      } catch (error) {
        this.logError(error, {
          component: component.name || 'anonymous',
          type: 'component_error'
        });
        
        if (errorFallback) {
          return errorFallback(error);
        }
        
        // Default error fallback
        return this.createErrorFallbackElement(error);
      }
    };
  }

  /**
   * Create default error fallback element
   * @param {Error} error - Error that occurred
   * @returns {HTMLElement} Error fallback element
   */
  createErrorFallbackElement(error) {
    const element = document.createElement('div');
    element.className = 'myayai-error-boundary';
    element.innerHTML = `
      <div class="myayai-error-message">
        <h3>Something went wrong</h3>
        <p>We're sorry, but an error occurred. The extension is still running, but this component couldn't load properly.</p>
        <button class="myayai-error-retry" onclick="window.location.reload()">Retry</button>
      </div>
    `;
    
    // Add error boundary styles
    this.addErrorBoundaryStyles();
    
    return element;
  }

  /**
   * Add error boundary styles
   */
  addErrorBoundaryStyles() {
    if (document.getElementById('myayai-error-boundary-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'myayai-error-boundary-styles';
    styles.textContent = `
      .myayai-error-boundary {
        padding: 20px;
        border: 1px solid #e3e3e3;
        border-radius: 8px;
        background-color: #f8f9fa;
        text-align: center;
        margin: 10px 0;
      }
      .myayai-error-message h3 {
        color: #dc3545;
        margin-bottom: 10px;
        font-size: 18px;
      }
      .myayai-error-message p {
        color: #6c757d;
        margin-bottom: 15px;
        line-height: 1.5;
      }
      .myayai-error-retry {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .myayai-error-retry:hover {
        background-color: #0056b3;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Get browser information for error reporting
   * @returns {Object} Browser information
   */
  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      chrome: !!window.chrome,
      extension: !!chrome.runtime
    };
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique operation ID
   * @returns {string} Unique operation ID
   */
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      uniqueErrors: this.errorCounts.size,
      activeRetries: this.retryAttempts.size,
      errorBreakdown: Object.fromEntries(this.errorCounts.entries())
    };
  }

  /**
   * Clear error statistics
   */
  clearErrorStats() {
    this.errorCounts.clear();
    this.retryAttempts.clear();
  }

  /**
   * Enable or disable error reporting
   * @param {boolean} enabled - Whether to enable error reporting
   */
  setErrorReporting(enabled) {
    this.errorReportingEnabled = enabled;
    this.logger.info(`Error reporting ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable or disable graceful degradation
   * @param {boolean} enabled - Whether to enable graceful degradation
   */
  setGracefulDegradation(enabled) {
    this.gracefulDegradationEnabled = enabled;
    this.logger.info(`Graceful degradation ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create global instance
export const errorHandler = new ErrorHandler();

// Make available globally for other scripts
if (typeof window !== 'undefined') {
  window.MyAyaiErrorHandler = errorHandler;
}
