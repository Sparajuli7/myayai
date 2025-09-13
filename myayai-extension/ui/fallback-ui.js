/**
 * Fallback UI Components for MyAyai Extension
 * Provides minimal UI functionality when normal injection fails
 */

import { Logger } from '../utils/logger.js';
import { errorHandler } from '../utils/error-handler.js';

export class FallbackUI {
  constructor() {
    this.logger = new Logger('FallbackUI');
    this.activeElements = new Set();
    this.fallbackContainer = null;
    this.isActive = false;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    
    this.styles = {
      container: `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        pointer-events: none;
      `,
      panel: `
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        padding: 16px;
        max-width: 300px;
        pointer-events: auto;
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.3s ease;
      `,
      panelActive: `
        transform: translateY(0);
        opacity: 1;
      `,
      title: `
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      `,
      message: `
        font-size: 13px;
        color: #6b7280;
        line-height: 1.4;
        margin: 0 0 12px 0;
      `,
      button: `
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-right: 8px;
      `,
      buttonSecondary: `
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      `,
      buttonDanger: `
        background: #ef4444;
        color: white;
      `,
      icon: `
        width: 16px;
        height: 16px;
        display: inline-block;
      `,
      minimized: `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        background: #3b82f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        z-index: 10000;
        transition: transform 0.2s;
        pointer-events: auto;
      `,
      minimizedIcon: `
        color: white;
        font-size: 20px;
        line-height: 1;
      `
    };
  }

  /**
   * Initialize fallback UI system
   */
  async initialize() {
    try {
      await this.logger.info('Initializing fallback UI');
      
      // Add CSS styles
      this.addStyles();
      
      // Set up event listeners
      this.setupEventListeners();
      
      await this.logger.debug('Fallback UI initialized successfully');
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'FallbackUI',
        method: 'initialize'
      });
    }
  }

  /**
   * Add CSS styles to the page
   */
  addStyles() {
    if (document.getElementById('myayai-fallback-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'myayai-fallback-styles';
    styles.textContent = `
      .myayai-fallback-container {
        ${this.styles.container}
      }
      .myayai-fallback-panel {
        ${this.styles.panel}
      }
      .myayai-fallback-panel.active {
        ${this.styles.panelActive}
      }
      .myayai-fallback-title {
        ${this.styles.title}
      }
      .myayai-fallback-message {
        ${this.styles.message}
      }
      .myayai-fallback-button {
        ${this.styles.button}
      }
      .myayai-fallback-button:hover {
        background: #2563eb;
      }
      .myayai-fallback-button.secondary {
        ${this.styles.buttonSecondary}
      }
      .myayai-fallback-button.secondary:hover {
        background: #e5e7eb;
      }
      .myayai-fallback-button.danger {
        ${this.styles.buttonDanger}
      }
      .myayai-fallback-button.danger:hover {
        background: #dc2626;
      }
      .myayai-fallback-icon {
        ${this.styles.icon}
      }
      .myayai-fallback-minimized {
        ${this.styles.minimized}
      }
      .myayai-fallback-minimized:hover {
        transform: scale(1.1);
      }
      .myayai-fallback-minimized-icon {
        ${this.styles.minimizedIcon}
      }
      .myayai-fallback-pulse {
        animation: myayai-pulse 2s infinite;
      }
      @keyframes myayai-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .myayai-fallback-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-left: 4px solid #3b82f6;
        border-radius: 6px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        z-index: 10001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        pointer-events: auto;
      }
      .myayai-fallback-toast.show {
        transform: translateX(0);
      }
      .myayai-fallback-toast.error {
        border-left-color: #ef4444;
      }
      .myayai-fallback-toast.warning {
        border-left-color: #f59e0b;
      }
      .myayai-fallback-toast.success {
        border-left-color: #10b981;
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for messages from the main content script
    window.addEventListener('message', (event) => {
      if (event.data.type === 'myayai-fallback-request') {
        this.handleFallbackRequest(event.data);
      }
    });
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isActive) {
        this.checkForRecovery();
      }
    });
  }

  /**
   * Activate fallback UI
   * @param {Object} options - Fallback options
   */
  async activate(options = {}) {
    try {
      if (this.isActive) {
        await this.logger.debug('Fallback UI already active');
        return;
      }
      
      this.isActive = true;
      await this.logger.warn('Activating fallback UI', options);
      
      const {
        reason = 'Unknown error',
        recoverable = true,
        showMinimized = true,
        autoRetry = true
      } = options;
      
      if (showMinimized) {
        this.showMinimizedIndicator();
      } else {
        this.showFallbackPanel(reason, recoverable, autoRetry);
      }
      
      // Set up auto-retry if enabled
      if (autoRetry && recoverable) {
        this.scheduleRetry();
      }
      
      // Show toast notification
      this.showToast(
        'MyAyai is running in safe mode',
        'Some features may be limited while we attempt to restore full functionality.',
        'warning'
      );
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'FallbackUI',
        method: 'activate'
      });
    }
  }

  /**
   * Show minimized indicator
   */
  showMinimizedIndicator() {
    if (document.getElementById('myayai-fallback-minimized')) return;
    
    const minimized = document.createElement('div');
    minimized.id = 'myayai-fallback-minimized';
    minimized.className = 'myayai-fallback-minimized myayai-fallback-pulse';
    minimized.innerHTML = `
      <span class="myayai-fallback-minimized-icon">⚠️</span>
    `;
    
    minimized.addEventListener('click', () => {
      this.showFallbackPanel();
      minimized.remove();
    });
    
    document.body.appendChild(minimized);
    this.activeElements.add(minimized);
  }

  /**
   * Show fallback panel
   * @param {string} reason - Reason for fallback
   * @param {boolean} recoverable - Whether the issue is recoverable
   * @param {boolean} autoRetry - Whether to auto-retry
   */
  showFallbackPanel(reason = 'Extension encountered an error', recoverable = true, autoRetry = true) {
    // Remove existing panel
    const existing = document.getElementById('myayai-fallback-panel');
    if (existing) {
      existing.remove();
    }
    
    // Create container if it doesn't exist
    if (!this.fallbackContainer) {
      this.fallbackContainer = document.createElement('div');
      this.fallbackContainer.className = 'myayai-fallback-container';
      document.body.appendChild(this.fallbackContainer);
    }
    
    // Create panel
    const panel = document.createElement('div');
    panel.id = 'myayai-fallback-panel';
    panel.className = 'myayai-fallback-panel';
    
    const icon = recoverable ? '🔧' : '⚠️';
    const title = recoverable ? 'Safe Mode Active' : 'Error Detected';
    
    panel.innerHTML = `
      <div class="myayai-fallback-title">
        <span class="myayai-fallback-icon">${icon}</span>
        ${title}
      </div>
      <div class="myayai-fallback-message">
        ${reason}${recoverable ? ' We\'re working to restore full functionality.' : ''}
      </div>
      <div class="myayai-fallback-actions">
        ${recoverable ? `
          <button class="myayai-fallback-button" data-action="retry">
            Retry Now
          </button>
        ` : ''}
        <button class="myayai-fallback-button secondary" data-action="minimize">
          Minimize
        </button>
        <button class="myayai-fallback-button secondary" data-action="dismiss">
          Dismiss
        </button>
      </div>
    `;
    
    // Add event listeners
    panel.addEventListener('click', (event) => {
      const action = event.target.dataset.action;
      if (action) {
        this.handlePanelAction(action);
      }
    });
    
    this.fallbackContainer.appendChild(panel);
    this.activeElements.add(panel);
    
    // Animate in
    setTimeout(() => {
      panel.classList.add('active');
    }, 100);
  }

  /**
   * Handle panel action
   * @param {string} action - Action to handle
   */
  async handlePanelAction(action) {
    try {
      switch (action) {
        case 'retry':
          await this.attemptRecovery();
          break;
        case 'minimize':
          this.minimizePanel();
          break;
        case 'dismiss':
          await this.deactivate();
          break;
      }
    } catch (error) {
      errorHandler.logError(error, {
        component: 'FallbackUI',
        method: 'handlePanelAction',
        action
      });
    }
  }

  /**
   * Minimize the panel
   */
  minimizePanel() {
    const panel = document.getElementById('myayai-fallback-panel');
    if (panel) {
      panel.remove();
    }
    this.showMinimizedIndicator();
  }

  /**
   * Show toast notification
   * @param {string} title - Toast title
   * @param {string} message - Toast message
   * @param {string} type - Toast type (info, warning, error, success)
   */
  showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `myayai-fallback-toast ${type}`;
    toast.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">
        ${title}
      </div>
      <div style="font-size: 13px; color: #6b7280;">
        ${message}
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 8000);
    
    // Allow manual dismissal
    toast.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
  }

  /**
   * Schedule retry attempt
   */
  scheduleRetry() {
    if (this.retryAttempts >= this.maxRetryAttempts) {
      this.logger.warn('Maximum retry attempts reached, stopping auto-retry');
      return;
    }
    
    const delay = this.retryDelay * (this.retryAttempts + 1); // Exponential backoff
    
    setTimeout(async () => {
      await this.attemptRecovery(true);
    }, delay);
  }

  /**
   * Attempt to recover from fallback mode
   * @param {boolean} isAutoRetry - Whether this is an automatic retry
   */
  async attemptRecovery(isAutoRetry = false) {
    try {
      this.retryAttempts++;
      
      await this.logger.info(`Attempting recovery (attempt ${this.retryAttempts}${isAutoRetry ? ', auto' : ', manual'})`);
      
      // Show loading state
      const panel = document.getElementById('myayai-fallback-panel');
      if (panel) {
        const button = panel.querySelector('[data-action="retry"]');
        if (button) {
          button.textContent = 'Retrying...';
          button.disabled = true;
        }
      }
      
      // Notify main content script to retry initialization
      window.postMessage({
        type: 'myayai-recovery-request',
        attempt: this.retryAttempts,
        isAutoRetry
      }, '*');
      
      // Wait for response or timeout
      const success = await this.waitForRecovery(5000);
      
      if (success) {
        await this.logger.success('Recovery successful');
        this.showToast(
          'Recovery Successful!',
          'MyAyai has been restored to full functionality.',
          'success'
        );
        await this.deactivate();
      } else {
        await this.logger.warn(`Recovery attempt ${this.retryAttempts} failed`);
        
        // Reset button state
        if (panel) {
          const button = panel.querySelector('[data-action="retry"]');
          if (button) {
            button.textContent = 'Retry Now';
            button.disabled = false;
          }
        }
        
        // Schedule next auto-retry if not manual and under limit
        if (isAutoRetry && this.retryAttempts < this.maxRetryAttempts) {
          this.scheduleRetry();
        } else if (this.retryAttempts >= this.maxRetryAttempts) {
          this.showToast(
            'Recovery Failed',
            'Unable to restore full functionality. Please refresh the page.',
            'error'
          );
        }
      }
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'FallbackUI',
        method: 'attemptRecovery'
      });
      
      this.showToast(
        'Recovery Error',
        'An error occurred during recovery attempt.',
        'error'
      );
    }
  }

  /**
   * Wait for recovery response
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Success status
   */
  waitForRecovery(timeout) {
    return new Promise((resolve) => {
      let resolved = false;
      
      const messageHandler = (event) => {
        if (event.data.type === 'myayai-recovery-response' && !resolved) {
          resolved = true;
          window.removeEventListener('message', messageHandler);
          resolve(event.data.success);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', messageHandler);
          resolve(false);
        }
      }, timeout);
    });
  }

  /**
   * Check if recovery is possible
   */
  async checkForRecovery() {
    try {
      // Send a simple health check message
      window.postMessage({
        type: 'myayai-health-check'
      }, '*');
      
      // If we get a response, recovery might be possible
      const healthy = await this.waitForHealthResponse(2000);
      
      if (healthy && this.isActive) {
        await this.logger.info('System appears healthy, attempting recovery');
        await this.attemptRecovery();
      }
      
    } catch (error) {
      await this.logger.debug('Health check failed during recovery check', error);
    }
  }

  /**
   * Wait for health check response
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Health status
   */
  waitForHealthResponse(timeout) {
    return new Promise((resolve) => {
      let resolved = false;
      
      const messageHandler = (event) => {
        if (event.data.type === 'myayai-health-response' && !resolved) {
          resolved = true;
          window.removeEventListener('message', messageHandler);
          resolve(event.data.healthy);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          window.removeEventListener('message', messageHandler);
          resolve(false);
        }
      }, timeout);
    });
  }

  /**
   * Handle fallback requests from main script
   * @param {Object} data - Request data
   */
  async handleFallbackRequest(data) {
    const { reason, recoverable, options } = data;
    await this.activate({
      reason,
      recoverable,
      ...options
    });
  }

  /**
   * Deactivate fallback UI
   */
  async deactivate() {
    try {
      if (!this.isActive) return;
      
      this.isActive = false;
      this.retryAttempts = 0;
      
      // Remove all active elements
      for (const element of this.activeElements) {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
      this.activeElements.clear();
      
      // Remove container
      if (this.fallbackContainer) {
        if (this.fallbackContainer.parentNode) {
          this.fallbackContainer.parentNode.removeChild(this.fallbackContainer);
        }
        this.fallbackContainer = null;
      }
      
      await this.logger.info('Fallback UI deactivated');
      
    } catch (error) {
      errorHandler.logError(error, {
        component: 'FallbackUI',
        method: 'deactivate'
      });
    }
  }

  /**
   * Get current status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isActive: this.isActive,
      retryAttempts: this.retryAttempts,
      maxRetryAttempts: this.maxRetryAttempts,
      activeElements: this.activeElements.size
    };
  }

  /**
   * Clean up fallback UI
   */
  async cleanup() {
    await this.deactivate();
    
    // Remove styles
    const styles = document.getElementById('myayai-fallback-styles');
    if (styles) {
      styles.remove();
    }
    
    await this.logger.debug('Fallback UI cleaned up');
  }
}

// Create global instance
export const fallbackUI = new FallbackUI();

// Make available globally for other scripts
if (typeof window !== 'undefined') {
  window.MyAyaiFallbackUI = fallbackUI;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    fallbackUI.initialize();
  });
} else {
  fallbackUI.initialize();
}
