/**
 * Comprehensive Logger for MyAyai Extension
 * Provides structured logging with multiple levels, formatting, and storage
 */

export class Logger {
  constructor(context = 'MyAyai', options = {}) {
    this.context = context;
    this.options = {
      level: options.level || 'info',
      enableConsole: options.enableConsole !== false,
      enableStorage: options.enableStorage !== false,
      maxStoredLogs: options.maxStoredLogs || 500,
      enableTimestamp: options.enableTimestamp !== false,
      enableStackTrace: options.enableStackTrace !== false,
      colors: options.colors !== false,
      ...options
    };
    
    // Log levels with priorities
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    // Console colors for different log levels
    this.colors = {
      debug: '#9CA3AF',    // Gray
      info: '#3B82F6',     // Blue
      warn: '#F59E0B',     // Yellow/Orange
      error: '#EF4444',    // Red
      success: '#10B981'   // Green
    };
    
    // Console styling
    this.styles = {
      debug: 'color: #9CA3AF; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: normal;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
      success: 'color: #10B981; font-weight: bold;',
      context: 'color: #6B7280; font-weight: bold; background: #F3F4F6; padding: 2px 6px; border-radius: 3px;',
      timestamp: 'color: #9CA3AF; font-size: 11px;'
    };
    
    // Initialize storage cleanup
    this.initializeCleanup();
  }

  /**
   * Initialize periodic cleanup of old logs
   */
  async initializeCleanup() {
    if (!this.options.enableStorage) return;
    
    try {
      // Clean up old logs on initialization
      await this.cleanupOldLogs();
      
      // Set up periodic cleanup (every hour)
      setInterval(() => {
        this.cleanupOldLogs().catch(error => {
          console.error('Failed to cleanup old logs:', error);
        });
      }, 60 * 60 * 1000);
    } catch (error) {
      console.error('Failed to initialize log cleanup:', error);
    }
  }

  /**
   * Check if a log level should be processed
   * @param {string} level - Log level to check
   * @returns {boolean} Whether the level should be processed
   */
  shouldLog(level) {
    const currentLevelPriority = this.levels[this.options.level] || 1;
    const messageLevelPriority = this.levels[level] || 1;
    return messageLevelPriority >= currentLevelPriority;
  }

  /**
   * Format timestamp
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Get caller information for stack trace
   * @returns {Object} Caller information
   */
  getCallerInfo() {
    if (!this.options.enableStackTrace) return null;
    
    try {
      const stack = new Error().stack;
      const stackLines = stack.split('\n');
      
      // Find the first line that's not from this logger
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i];
        if (!line.includes('logger.js') && !line.includes('Logger')) {
          const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)|at\s+(.+?):(\d+):(\d+)/);
          if (match) {
            return {
              function: match[1] || match[5] || 'anonymous',
              file: (match[2] || match[5] || '').split('/').pop(),
              line: match[3] || match[6],
              column: match[4] || match[7]
            };
          }
        }
      }
    } catch (error) {
      // Stack trace parsing failed, continue without it
    }
    
    return null;
  }

  /**
   * Format log message for console output
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data
   * @returns {Array} Formatted console arguments
   */
  formatConsoleMessage(level, message, data) {
    const timestamp = this.getTimestamp();
    const caller = this.getCallerInfo();
    const args = [];
    
    if (this.options.colors && typeof window !== 'undefined') {
      // Styled console output for browsers
      let logMessage = '';
      let styles = [];
      
      if (this.options.enableTimestamp) {
        logMessage += '%c[%s] ';
        styles.push(this.styles.timestamp, timestamp);
      }
      
      logMessage += '%c[%s] %c%s';
      styles.push(
        this.styles.context,
        this.context,
        this.styles[level] || this.styles.info,
        message.toUpperCase()
      );
      
      if (caller) {
        logMessage += ' %c(%s:%s)';
        styles.push(this.styles.timestamp, caller.file, caller.line);
      }
      
      logMessage += '%c: %s';
      styles.push('color: inherit; font-weight: normal;', message);
      
      args.push(logMessage, ...styles);
    } else {
      // Plain text output for Node.js or when colors are disabled
      let logMessage = '';
      
      if (this.options.enableTimestamp) {
        logMessage += `[${timestamp}] `;
      }
      
      logMessage += `[${this.context}] ${level.toUpperCase()}`;
      
      if (caller) {
        logMessage += ` (${caller.file}:${caller.line})`;
      }
      
      logMessage += `: ${message}`;
      args.push(logMessage);
    }
    
    if (data !== undefined) {
      args.push(data);
    }
    
    return args;
  }

  /**
   * Store log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  async storeLog(level, message, data) {
    if (!this.options.enableStorage) return;
    
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level,
        context: this.context,
        message: message,
        data: this.serializeData(data),
        caller: this.getCallerInfo(),
        id: this.generateLogId()
      };
      
      const logs = await this.getStoredLogs();
      logs.push(logEntry);
      
      // Keep only the most recent logs
      if (logs.length > this.options.maxStoredLogs) {
        logs.splice(0, logs.length - this.options.maxStoredLogs);
      }
      
      await this.saveStoredLogs(logs);
    } catch (error) {
      console.error('Failed to store log:', error);
    }
  }

  /**
   * Serialize data for storage
   * @param {*} data - Data to serialize
   * @returns {*} Serialized data
   */
  serializeData(data) {
    if (data === undefined || data === null) return data;
    
    try {
      // Handle circular references and non-serializable objects
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack
          };
        }
        if (typeof value === 'function') {
          return '[Function]';
        }
        if (value instanceof HTMLElement) {
          return `[HTMLElement: ${value.tagName}]`;
        }
        return value;
      }));
    } catch (error) {
      return `[Serialization Error: ${error.message}]`;
    }
  }

  /**
   * Get stored logs
   * @returns {Promise<Array>} Array of log entries
   */
  async getStoredLogs() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['myayai_logs']);
        return result.myayai_logs || [];
      } else {
        const stored = localStorage.getItem('myayai_logs');
        return stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.error('Failed to get stored logs:', error);
      return [];
    }
  }

  /**
   * Save logs to storage
   * @param {Array} logs - Log entries to save
   */
  async saveStoredLogs(logs) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 'myayai_logs': logs });
      } else {
        localStorage.setItem('myayai_logs', JSON.stringify(logs));
      }
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs() {
    try {
      const logs = await this.getStoredLogs();
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate > oneWeekAgo;
      });
      
      if (recentLogs.length !== logs.length) {
        await this.saveStoredLogs(recentLogs);
        console.info(`Cleaned up ${logs.length - recentLogs.length} old log entries`);
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Generate unique log ID
   * @returns {string} Unique log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Core logging method
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  async log(level, message, data) {
    if (!this.shouldLog(level)) return;
    
    // Console output
    if (this.options.enableConsole) {
      const consoleArgs = this.formatConsoleMessage(level, message, data);
      const consoleMethod = console[level] || console.log;
      consoleMethod.apply(console, consoleArgs);
    }
    
    // Store log
    await this.storeLog(level, message, data);
  }

  /**
   * Debug level logging
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  async debug(message, data) {
    await this.log('debug', message, data);
  }

  /**
   * Info level logging
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  async info(message, data) {
    await this.log('info', message, data);
  }

  /**
   * Warning level logging
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  async warn(message, data) {
    await this.log('warn', message, data);
  }

  /**
   * Error level logging
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  async error(message, data) {
    await this.log('error', message, data);
  }

  /**
   * Success level logging (treated as info level)
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  async success(message, data) {
    if (!this.shouldLog('info')) return;
    
    // Console output with success styling
    if (this.options.enableConsole) {
      const consoleArgs = this.formatConsoleMessage('success', message, data);
      console.info.apply(console, consoleArgs);
    }
    
    // Store as info level
    await this.storeLog('info', message, data);
  }

  /**
   * Group related log messages
   * @param {string} title - Group title
   * @param {Function} fn - Function containing grouped logs
   */
  async group(title, fn) {
    if (this.options.enableConsole && console.group) {
      console.group(`[${this.context}] ${title}`);
    }
    
    await this.info(`--- ${title} ---`);
    
    try {
      await fn();
    } finally {
      if (this.options.enableConsole && console.groupEnd) {
        console.groupEnd();
      }
      await this.info(`--- End ${title} ---`);
    }
  }

  /**
   * Time a function execution
   * @param {string} label - Timer label
   * @param {Function} fn - Function to time
   * @returns {*} Function result
   */
  async time(label, fn) {
    const startTime = performance.now();
    await this.debug(`Timer started: ${label}`);
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      await this.info(`Timer completed: ${label}`, { 
        duration: `${duration.toFixed(2)}ms`,
        startTime,
        endTime
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      await this.error(`Timer failed: ${label}`, { 
        duration: `${duration.toFixed(2)}ms`,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Create a child logger with additional context
   * @param {string} childContext - Additional context for child logger
   * @param {Object} childOptions - Options for child logger
   * @returns {Logger} Child logger instance
   */
  child(childContext, childOptions = {}) {
    const fullContext = `${this.context}:${childContext}`;
    const options = { ...this.options, ...childOptions };
    return new Logger(fullContext, options);
  }

  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.options.level = level;
      this.info(`Log level changed to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}. Valid levels: ${Object.keys(this.levels).join(', ')}`);
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current logger configuration
   */
  getConfig() {
    return {
      context: this.context,
      level: this.options.level,
      enableConsole: this.options.enableConsole,
      enableStorage: this.options.enableStorage,
      maxStoredLogs: this.options.maxStoredLogs,
      enableTimestamp: this.options.enableTimestamp,
      enableStackTrace: this.options.enableStackTrace,
      colors: this.options.colors
    };
  }

  /**
   * Update logger configuration
   * @param {Object} newOptions - New configuration options
   */
  updateConfig(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.info('Logger configuration updated', newOptions);
  }

  /**
   * Get log statistics
   * @returns {Promise<Object>} Log statistics
   */
  async getStats() {
    const logs = await this.getStoredLogs();
    const stats = {
      total: logs.length,
      byLevel: {},
      byContext: {},
      oldestLog: null,
      newestLog: null
    };
    
    logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Count by context
      stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
      
      // Track oldest and newest
      if (!stats.oldestLog || log.timestamp < stats.oldestLog) {
        stats.oldestLog = log.timestamp;
      }
      if (!stats.newestLog || log.timestamp > stats.newestLog) {
        stats.newestLog = log.timestamp;
      }
    });
    
    return stats;
  }

  /**
   * Clear all stored logs
   */
  async clearLogs() {
    await this.saveStoredLogs([]);
    this.info('All stored logs cleared');
  }

  /**
   * Export logs for debugging or support
   * @param {Object} options - Export options
   * @returns {Promise<string>} Exported logs as string
   */
  async exportLogs(options = {}) {
    const {
      format = 'json',
      levels = null,
      since = null,
      limit = null
    } = options;
    
    let logs = await this.getStoredLogs();
    
    // Filter by levels
    if (levels && Array.isArray(levels)) {
      logs = logs.filter(log => levels.includes(log.level));
    }
    
    // Filter by date
    if (since) {
      const sinceDate = new Date(since);
      logs = logs.filter(log => new Date(log.timestamp) >= sinceDate);
    }
    
    // Limit results
    if (limit && typeof limit === 'number') {
      logs = logs.slice(-limit);
    }
    
    if (format === 'text') {
      return logs.map(log => {
        const caller = log.caller ? ` (${log.caller.file}:${log.caller.line})` : '';
        const data = log.data ? ` - ${JSON.stringify(log.data)}` : '';
        return `[${log.timestamp}] [${log.context}] ${log.level.toUpperCase()}${caller}: ${log.message}${data}`;
      }).join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
  }
}

// Create default logger instance
export const logger = new Logger();

// Make available globally for other scripts
if (typeof window !== 'undefined') {
  window.MyAyaiLogger = logger;
}
