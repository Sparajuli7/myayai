// MyAyAI Extension Background Helper Functions
// Additional utilities and background tasks

/**
 * Background utilities for MyAyAI Extension
 */
class BackgroundUtils {
    static instance = null;

    constructor() {
        if (BackgroundUtils.instance) {
            return BackgroundUtils.instance;
        }
        
        BackgroundUtils.instance = this;
        this.platformConfigs = this.initializePlatformConfigs();
    }

    initializePlatformConfigs() {
        return {
            openai: {
                name: 'ChatGPT',
                domain: 'chat.openai.com',
                apiLimits: { requestsPerHour: 60, tokensPerRequest: 4000 },
                optimizationTips: [
                    'Be specific about the format you want',
                    'Provide examples when possible',
                    'Use system messages for role definition'
                ]
            },
            claude: {
                name: 'Claude',
                domain: 'claude.ai',
                apiLimits: { requestsPerHour: 50, tokensPerRequest: 8000 },
                optimizationTips: [
                    'Claude works well with structured prompts',
                    'Use XML-like tags for organization',
                    'Be explicit about reasoning steps'
                ]
            },
            gemini: {
                name: 'Gemini',
                domain: 'gemini.google.com',
                apiLimits: { requestsPerHour: 100, tokensPerRequest: 2000 },
                optimizationTips: [
                    'Break complex tasks into steps',
                    'Use clear, direct language',
                    'Specify output format clearly'
                ]
            },
            perplexity: {
                name: 'Perplexity',
                domain: 'www.perplexity.ai',
                apiLimits: { requestsPerHour: 40, tokensPerRequest: 3000 },
                optimizationTips: [
                    'Include specific sources when needed',
                    'Ask for citations',
                    'Be specific about time ranges'
                ]
            },
            copilot: {
                name: 'Copilot',
                domain: 'copilot.microsoft.com',
                apiLimits: { requestsPerHour: 30, tokensPerRequest: 3000 },
                optimizationTips: [
                    'Reference Microsoft tools when relevant',
                    'Use professional tone',
                    'Ask for actionable insights'
                ]
            },
            poe: {
                name: 'Poe',
                domain: 'poe.com',
                apiLimits: { requestsPerHour: 80, tokensPerRequest: 2500 },
                optimizationTips: [
                    'Specify which model you want to optimize for',
                    'Use clear conversation starters',
                    'Keep context concise'
                ]
            },
            character: {
                name: 'Character.AI',
                domain: 'character.ai',
                apiLimits: { requestsPerHour: 120, tokensPerRequest: 1500 },
                optimizationTips: [
                    'Develop character backstory',
                    'Use consistent personality',
                    'Keep responses conversational'
                ]
            }
        };
    }

    /**
     * Get platform-specific optimization suggestions
     */
    getPlatformOptimizations(platform, prompt) {
        const config = this.platformConfigs[platform];
        if (!config) return [];

        const suggestions = [...config.optimizationTips];
        
        // Add dynamic suggestions based on prompt analysis
        const analysis = this.analyzePrompt(prompt);
        
        if (analysis.isShort && platform !== 'character') {
            suggestions.push('Consider adding more context for better results');
        }
        
        if (analysis.hasNoQuestions && config.name !== 'Character.AI') {
            suggestions.push('End with a specific question to guide the response');
        }
        
        if (analysis.isVague) {
            suggestions.push('Add specific examples or use cases');
        }
        
        return suggestions;
    }

    /**
     * Analyze prompt characteristics
     */
    analyzePrompt(prompt) {
        return {
            length: prompt.length,
            wordCount: prompt.split(/\s+/).length,
            isShort: prompt.length < 50,
            isLong: prompt.length > 1000,
            hasQuestions: prompt.includes('?'),
            hasNoQuestions: !prompt.includes('?'),
            hasExamples: prompt.toLowerCase().includes('example'),
            hasContext: prompt.toLowerCase().includes('context') || prompt.toLowerCase().includes('background'),
            isVague: this.isVaguePrompt(prompt),
            sentiment: this.getPromptSentiment(prompt),
            complexity: this.getComplexityScore(prompt)
        };
    }

    /**
     * Check if prompt is vague
     */
    isVaguePrompt(prompt) {
        const vagueIndicators = [
            'help me with',
            'tell me about',
            'what is',
            'how do',
            'can you'
        ];
        
        const lowerPrompt = prompt.toLowerCase();
        const vagueCount = vagueIndicators.filter(indicator => 
            lowerPrompt.includes(indicator)
        ).length;
        
        return vagueCount > 0 && prompt.length < 100;
    }

    /**
     * Get prompt sentiment
     */
    getPromptSentiment(prompt) {
        const positiveWords = ['please', 'help', 'thanks', 'appreciate', 'great', 'good'];
        const urgentWords = ['urgent', 'asap', 'quickly', 'immediately', 'fast'];
        const neutralWords = ['analyze', 'explain', 'describe', 'compare'];
        
        const lowerPrompt = prompt.toLowerCase();
        
        const positiveScore = positiveWords.filter(word => lowerPrompt.includes(word)).length;
        const urgentScore = urgentWords.filter(word => lowerPrompt.includes(word)).length;
        const neutralScore = neutralWords.filter(word => lowerPrompt.includes(word)).length;
        
        if (urgentScore > 0) return 'urgent';
        if (positiveScore > neutralScore) return 'polite';
        if (neutralScore > 0) return 'analytical';
        return 'neutral';
    }

    /**
     * Calculate complexity score (1-10)
     */
    getComplexityScore(prompt) {
        let score = 1;
        
        // Length factor
        if (prompt.length > 500) score += 2;
        else if (prompt.length > 200) score += 1;
        
        // Technical terms
        const technicalTerms = ['algorithm', 'database', 'api', 'function', 'class', 'method'];
        const techCount = technicalTerms.filter(term => 
            prompt.toLowerCase().includes(term)
        ).length;
        score += Math.min(techCount, 3);
        
        // Multiple questions
        const questionCount = (prompt.match(/\?/g) || []).length;
        score += Math.min(questionCount, 2);
        
        // Lists or numbered items
        if (prompt.includes('1.') || prompt.includes('•') || prompt.includes('-')) {
            score += 1;
        }
        
        return Math.min(score, 10);
    }

    /**
     * Generate platform-specific optimized prompt
     */
    optimizeForPlatform(prompt, platform, optimizationLevel = 'advanced') {
        const config = this.platformConfigs[platform];
        const analysis = this.analyzePrompt(prompt);
        
        let optimized = prompt;
        
        // Apply platform-specific optimizations
        switch (platform) {
            case 'openai':
                optimized = this.optimizeForOpenAI(optimized, analysis, optimizationLevel);
                break;
            case 'claude':
                optimized = this.optimizeForClaude(optimized, analysis, optimizationLevel);
                break;
            case 'gemini':
                optimized = this.optimizeForGemini(optimized, analysis, optimizationLevel);
                break;
            case 'perplexity':
                optimized = this.optimizeForPerplexity(optimized, analysis, optimizationLevel);
                break;
            default:
                optimized = this.applyGeneralOptimizations(optimized, analysis, optimizationLevel);
        }
        
        return optimized;
    }

    optimizeForOpenAI(prompt, analysis, level) {
        let optimized = prompt;
        
        if (level === 'advanced' || level === 'expert') {
            // Add role definition if missing
            if (!prompt.toLowerCase().includes('you are') && analysis.complexity > 5) {
                optimized = `You are an expert assistant. ${optimized}`;
            }
            
            // Add step-by-step request for complex prompts
            if (analysis.complexity > 6 && !prompt.toLowerCase().includes('step')) {
                optimized += '\n\nPlease provide a step-by-step approach.';
            }
        }
        
        // Add format specification
        if (analysis.isLong && !prompt.toLowerCase().includes('format')) {
            optimized += '\n\nPlease format your response with clear headings and bullet points.';
        }
        
        return optimized;
    }

    optimizeForClaude(prompt, analysis, level) {
        let optimized = prompt;
        
        if (level === 'advanced' || level === 'expert') {
            // Wrap in thinking tags for complex requests
            if (analysis.complexity > 7) {
                optimized = `<thinking>\nThis is a complex request that requires careful analysis.\n</thinking>\n\n${optimized}`;
            }
            
            // Add structure tags
            if (analysis.isLong) {
                optimized = `<request>\n${optimized}\n</request>\n\nPlease provide a thorough, well-structured response.`;
            }
        }
        
        return optimized;
    }

    optimizeForGemini(prompt, analysis, level) {
        let optimized = prompt;
        
        // Add clear instructions
        if (analysis.isVague) {
            optimized += '\n\nPlease be specific and provide concrete examples.';
        }
        
        // Break into numbered steps for complex requests
        if (analysis.complexity > 6 && level === 'expert') {
            optimized += '\n\nPlease organize your response into numbered sections.';
        }
        
        return optimized;
    }

    optimizeForPerplexity(prompt, analysis, level) {
        let optimized = prompt;
        
        // Add source requests
        if (level === 'advanced' || level === 'expert') {
            if (!prompt.toLowerCase().includes('source')) {
                optimized += '\n\nPlease include relevant sources and citations.';
            }
        }
        
        // Add time context if missing
        if (analysis.isVague && !prompt.includes('2024') && !prompt.includes('current')) {
            optimized = `Current information about: ${optimized}`;
        }
        
        return optimized;
    }

    applyGeneralOptimizations(prompt, analysis, level) {
        let optimized = prompt;
        
        // Add context request for short prompts
        if (analysis.isShort && level !== 'basic') {
            optimized = `Context: [Please provide relevant background]\n\n${optimized}`;
        }
        
        // Add specificity for vague prompts
        if (analysis.isVague) {
            optimized += '\n\nPlease be specific and provide examples.';
        }
        
        // Add format request for long prompts
        if (analysis.isLong && level === 'expert') {
            optimized += '\n\nPlease structure your response clearly with headings, subheadings, and bullet points where appropriate.';
        }
        
        return optimized;
    }

    /**
     * Get usage analytics for optimization
     */
    async getUsageAnalytics(timeRange = '7d') {
        try {
            const data = await chrome.storage.local.get(['promptHistory']);
            const history = data.promptHistory || [];
            
            const now = Date.now();
            const ranges = {
                '1d': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000
            };
            
            const cutoff = now - (ranges[timeRange] || ranges['7d']);
            const recentHistory = history.filter(entry => entry.timestamp > cutoff);
            
            return {
                totalOptimizations: recentHistory.length,
                platformUsage: this.getPlatformUsage(recentHistory),
                averageImprovementLength: this.getAverageImprovement(recentHistory),
                mostCommonOptimizations: this.getMostCommonOptimizations(recentHistory),
                timeRange: timeRange
            };
            
        } catch (error) {
            console.error('Failed to get usage analytics:', error);
            return null;
        }
    }

    getPlatformUsage(history) {
        const usage = {};
        history.forEach(entry => {
            if (entry.platform) {
                usage[entry.platform] = (usage[entry.platform] || 0) + 1;
            }
        });
        return usage;
    }

    getAverageImprovement(history) {
        const improvements = history
            .filter(entry => entry.original && entry.optimized)
            .map(entry => entry.optimized.length - entry.original.length);
        
        if (improvements.length === 0) return 0;
        
        return improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    }

    getMostCommonOptimizations(history) {
        const optimizations = {};
        
        history.forEach(entry => {
            if (entry.improvements) {
                entry.improvements.forEach(improvement => {
                    optimizations[improvement] = (optimizations[improvement] || 0) + 1;
                });
            }
        });
        
        return Object.entries(optimizations)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([improvement]) => improvement);
    }

    /**
     * Generate improvement suggestions based on historical data
     */
    async generatePersonalizedSuggestions(userId) {
        try {
            const analytics = await this.getUsageAnalytics('30d');
            if (!analytics) return [];
            
            const suggestions = [];
            
            // Platform-specific suggestions
            const topPlatform = Object.entries(analytics.platformUsage)
                .sort(([,a], [,b]) => b - a)[0];
            
            if (topPlatform) {
                const [platform] = topPlatform;
                const platformTips = this.platformConfigs[platform]?.optimizationTips || [];
                suggestions.push(`${this.platformConfigs[platform]?.name} tip: ${platformTips[0]}`);
            }
            
            // Usage pattern suggestions
            if (analytics.totalOptimizations < 5) {
                suggestions.push('Try using the optimization feature more regularly for better prompts');
            }
            
            if (analytics.averageImprovementLength < 50) {
                suggestions.push('Consider adding more detailed context to your prompts');
            }
            
            return suggestions;
            
        } catch (error) {
            console.error('Failed to generate personalized suggestions:', error);
            return [];
        }
    }

    /**
     * Check if rate limits are exceeded
     */
    async checkRateLimit(platform, userId) {
        try {
            const data = await chrome.storage.local.get(['rateLimits']);
            const rateLimits = data.rateLimits || {};
            
            const userLimits = rateLimits[userId] || {};
            const platformLimits = userLimits[platform] || { count: 0, resetTime: 0 };
            
            const config = this.platformConfigs[platform];
            if (!config) return { allowed: true, remaining: Infinity };
            
            const now = Date.now();
            const hourAgo = now - (60 * 60 * 1000);
            
            // Reset if hour has passed
            if (platformLimits.resetTime < hourAgo) {
                platformLimits.count = 0;
                platformLimits.resetTime = now;
            }
            
            const remaining = config.apiLimits.requestsPerHour - platformLimits.count;
            const allowed = remaining > 0;
            
            return { allowed, remaining, resetTime: platformLimits.resetTime };
            
        } catch (error) {
            console.error('Failed to check rate limit:', error);
            return { allowed: true, remaining: Infinity };
        }
    }

    /**
     * Update rate limit counter
     */
    async updateRateLimit(platform, userId) {
        try {
            const data = await chrome.storage.local.get(['rateLimits']);
            const rateLimits = data.rateLimits || {};
            
            if (!rateLimits[userId]) rateLimits[userId] = {};
            if (!rateLimits[userId][platform]) {
                rateLimits[userId][platform] = { count: 0, resetTime: Date.now() };
            }
            
            rateLimits[userId][platform].count += 1;
            
            await chrome.storage.local.set({ rateLimits });
            
        } catch (error) {
            console.error('Failed to update rate limit:', error);
        }
    }

    /**
     * Clean up old rate limit data
     */
    async cleanupRateLimits() {
        try {
            const data = await chrome.storage.local.get(['rateLimits']);
            const rateLimits = data.rateLimits || {};
            
            const now = Date.now();
            const dayAgo = now - (24 * 60 * 60 * 1000);
            
            // Clean up old entries
            for (const userId in rateLimits) {
                for (const platform in rateLimits[userId]) {
                    if (rateLimits[userId][platform].resetTime < dayAgo) {
                        delete rateLimits[userId][platform];
                    }
                }
                
                // Remove empty user entries
                if (Object.keys(rateLimits[userId]).length === 0) {
                    delete rateLimits[userId];
                }
            }
            
            await chrome.storage.local.set({ rateLimits });
            
        } catch (error) {
            console.error('Failed to cleanup rate limits:', error);
        }
    }
}

// Export for use in service worker
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundUtils;
} else {
    // Make available globally for the service worker
    self.BackgroundUtils = BackgroundUtils;
}

// Import error handling and monitoring systems
try {
    importScripts('./update-manager.js');
    importScripts('../utils/error-handler.js');
    importScripts('../utils/logger.js');
    importScripts('../utils/health-monitor.js');
} catch (error) {
    console.error('Failed to import monitoring systems:', error);
}

// At the top, import necessary classes
// Assuming ES6 modules or global

const optimizer = new PromptOptimizer();
const scorer = new QualityScorer();
const achievements = new Achievements(); // But Achievements uses chrome.storage, ok in background

// Initialize monitoring systems
let updateManager, errorHandler, logger, healthMonitor;

try {
    if (typeof UpdateManager !== 'undefined') {
        updateManager = new UpdateManager();
    }
    if (typeof MyAyaiErrorHandler !== 'undefined') {
        errorHandler = MyAyaiErrorHandler;
    }
    if (typeof MyAyaiLogger !== 'undefined') {
        logger = MyAyaiLogger;
    }
    if (typeof MyAyaiHealthMonitor !== 'undefined') {
        healthMonitor = MyAyaiHealthMonitor;
        healthMonitor.startMonitoring();
    }
} catch (error) {
    console.error('Failed to initialize monitoring systems:', error);
}

// Add at the end:

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Wrap message handling in error handling
  const handleMessage = async () => {
    try {
      if (logger) {
        logger.debug('Received message', { type: message.type || message.action, sender: sender.tab?.url });
      }

      // Handle optimization requests
      if (message.action === 'optimizePrompt') {
        const original = message.content;
        const platform = message.platform;

        const originalScore = scorer.calculateQualityScore(original);
        const optimized = optimizer.optimizePrompt(original, platform);
        const optimizedScore = scorer.calculateQualityScore(optimized);
        const improvement = ((optimizedScore - originalScore) / originalScore) * 100;

        // Assume timeSaved based on length or something, e.g. original.length / 10 seconds
        const timeSaved = Math.floor(original.length / 10);

        const data = await achievements.trackOptimization(improvement, platform, timeSaved);
        return {
          optimizedText: optimized,
          achievementData: data
        };
      }

      // Handle health check requests
      if (message.type === 'health_check') {
        return { status: 'ok', timestamp: Date.now() };
      }

      // Handle error reports from content scripts
      if (message.type === 'ERROR_REPORT' || message.type === 'error_report') {
        if (errorHandler) {
          errorHandler.logError(new Error(message.payload.error), {
            source: 'content_script',
            tabId: sender.tab?.id,
            url: sender.tab?.url,
            platform: message.payload.platform,
            context: message.payload.context,
            stack: message.payload.stack
          });
        }
        return { status: 'logged' };
      }

      // Handle platform recovery requests
      if (message.type === 'platform_recovery_request') {
        if (updateManager && updateManager.detectPlatformChange) {
          await updateManager.detectPlatformChange(message.url, sender.tab?.id);
        }
        return { status: 'recovery_attempted' };
      }

      // Handle health status requests
      if (message.type === 'get_health_status') {
        if (healthMonitor) {
          return healthMonitor.getHealthSummary();
        }
        return { status: 'unknown', message: 'Health monitor not available' };
      }

      // Handle detailed health reports
      if (message.type === 'get_health_report') {
        if (healthMonitor) {
          return healthMonitor.getDetailedReport();
        }
        return { error: 'Health monitor not available' };
      }

      // Handle performance metrics
      if (message.type === 'performance_metrics') {
        if (updateManager && updateManager.recordPerformanceMetrics) {
          await updateManager.recordPerformanceMetrics(message.metrics);
        }
        return { status: 'recorded' };
      }

      // Handle validate selectors requests
      if (message.type === 'validate_selectors') {
        let validSelectors = 0;
        const results = [];
        
        for (const selector of message.selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              validSelectors++;
              results.push({ selector, found: elements.length, valid: true });
            } else {
              results.push({ selector, found: 0, valid: false });
            }
          } catch (error) {
            results.push({ selector, error: error.message, valid: false });
          }
        }
        
        return { validSelectors, results };
      }

      // Unknown message type
      return { error: 'Unknown message type', type: message.type || message.action };

    } catch (error) {
      if (errorHandler) {
        errorHandler.logError(error, {
          component: 'BackgroundScript',
          method: 'messageHandler',
          message: message,
          sender: sender.tab?.url
        });
      } else {
        console.error('Background script error:', error);
      }
      
      return { 
        error: 'Internal error occurred', 
        message: error.message,
        recoverable: true 
      };
    }
  };

  // Execute with error handling
  if (errorHandler && errorHandler.wrapAsync) {
    const wrappedHandler = errorHandler.wrapAsync(handleMessage, {
      retryAttempts: 2,
      context: { messageType: message.type || message.action },
      showUserErrors: false
    });
    
    wrappedHandler()
      .then(result => sendResponse(result))
      .catch(error => {
        sendResponse({ 
          error: 'Failed to process message', 
          message: error.message 
        });
      });
  } else {
    handleMessage()
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Message handling failed:', error);
        sendResponse({ 
          error: 'Failed to process message', 
          message: error.message 
        });
      });
  }

  return true; // Async response
});
