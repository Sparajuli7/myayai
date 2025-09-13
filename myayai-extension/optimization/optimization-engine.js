// MyAyAI Optimization Engine
// Main engine that coordinates prompt analysis and optimization

// Import dependencies (these would be loaded via module system or script tags)
// import PromptAnalyzer from './prompt-analyzer.js';
// import PromptSuggestions from './prompt-suggestions.js';

class OptimizationEngine {
    constructor(options = {}) {
        this.options = {
            defaultLevel: 'advanced',
            cacheResults: true,
            maxCacheSize: 100,
            enableAnalytics: true,
            ...options
        };
        
        this.analyzer = new (self.PromptAnalyzer || PromptAnalyzer)();
        this.suggestions = new (self.PromptSuggestions || PromptSuggestions)();
        this.cache = new Map();
        this.analytics = {
            optimizations: 0,
            improvements: {},
            platformUsage: {},
            averageScoreImprovement: 0
        };
        
        this.init();
    }

    async init() {
        try {
            // Load any saved analytics
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const data = await chrome.storage.local.get(['optimizationAnalytics']);
                if (data.optimizationAnalytics) {
                    this.analytics = { ...this.analytics, ...data.optimizationAnalytics };
                }
            }
            
            console.log('OptimizationEngine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize OptimizationEngine:', error);
        }
    }

    /**
     * Main optimization method
     */
    async optimize(prompt, options = {}) {
        const startTime = Date.now();
        
        try {
            // Validate input
            if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
                throw new Error('Invalid prompt: prompt must be a non-empty string');
            }

            // Check cache first
            const cacheKey = this.generateCacheKey(prompt, options);
            if (this.options.cacheResults && this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Set default options
            const optimizationOptions = {
                level: this.options.defaultLevel,
                platform: null,
                context: [],
                userId: null,
                includeAnalysis: true,
                includeSuggestions: true,
                generateAlternatives: false,
                ...options
            };

            // Analyze the prompt
            const analysis = this.analyzer.analyze(prompt, {
                platform: optimizationOptions.platform,
                context: optimizationOptions.context
            });

            // Generate suggestions
            const suggestions = this.suggestions.generateSuggestions(
                prompt, 
                analysis, 
                optimizationOptions
            );

            // Generate optimized version
            const optimizedPrompt = this.suggestions.generateOptimizedPrompt(
                prompt, 
                analysis, 
                suggestions, 
                optimizationOptions
            );

            // Generate alternatives if requested
            let alternatives = [];
            if (optimizationOptions.generateAlternatives) {
                alternatives = await this.generateAlternatives(
                    prompt, 
                    analysis, 
                    optimizationOptions
                );
            }

            // Calculate improvement metrics
            const improvement = this.calculateImprovement(analysis, optimizedPrompt);

            // Create result object
            const result = {
                original: {
                    text: prompt,
                    analysis: optimizationOptions.includeAnalysis ? analysis : null
                },
                optimized: {
                    text: optimizedPrompt,
                    analysis: optimizationOptions.includeAnalysis ? 
                        this.analyzer.analyze(optimizedPrompt, optimizationOptions) : null
                },
                suggestions: optimizationOptions.includeSuggestions ? suggestions : null,
                alternatives: alternatives,
                improvement: improvement,
                metadata: {
                    optimizationLevel: optimizationOptions.level,
                    platform: optimizationOptions.platform,
                    processingTime: Date.now() - startTime,
                    engineVersion: '1.0.0',
                    timestamp: Date.now()
                }
            };

            // Cache the result
            if (this.options.cacheResults) {
                this.addToCache(cacheKey, result);
            }

            // Track analytics
            if (this.options.enableAnalytics) {
                await this.trackOptimization(result, optimizationOptions);
            }

            return result;

        } catch (error) {
            console.error('Optimization failed:', error);
            throw new Error(`Optimization failed: ${error.message}`);
        }
    }

    /**
     * Generate alternative optimizations
     */
    async generateAlternatives(prompt, analysis, options) {
        const alternatives = [];
        const levels = ['basic', 'advanced', 'expert'].filter(l => l !== options.level);
        
        for (const level of levels) {
            try {
                const altOptions = { ...options, level };
                const altSuggestions = this.suggestions.generateSuggestions(
                    prompt, 
                    analysis, 
                    altOptions
                );
                
                const altOptimized = this.suggestions.generateOptimizedPrompt(
                    prompt, 
                    analysis, 
                    altSuggestions, 
                    altOptions
                );
                
                alternatives.push({
                    level: level,
                    text: altOptimized,
                    analysis: this.analyzer.analyze(altOptimized, altOptions),
                    improvement: this.calculateImprovement(analysis, altOptimized)
                });
                
            } catch (error) {
                console.error(`Failed to generate ${level} alternative:`, error);
            }
        }
        
        return alternatives;
    }

    /**
     * Calculate improvement metrics
     */
    calculateImprovement(originalAnalysis, optimizedPrompt) {
        const optimizedAnalysis = this.analyzer.analyze(optimizedPrompt);
        
        const scoreImprovement = optimizedAnalysis.overallScore - originalAnalysis.overallScore;
        const improvements = [];
        
        // Compare individual scores
        Object.keys(originalAnalysis.scores).forEach(aspect => {
            const originalScore = originalAnalysis.scores[aspect];
            const optimizedScore = optimizedAnalysis.scores[aspect];
            const improvement = optimizedScore - originalScore;
            
            if (improvement > 5) {
                improvements.push({
                    aspect,
                    originalScore,
                    optimizedScore,
                    improvement: Math.round(improvement),
                    description: this.getImprovementDescription(aspect, improvement)
                });
            }
        });
        
        return {
            overallScoreChange: Math.round(scoreImprovement),
            gradeChange: {
                from: originalAnalysis.grade,
                to: optimizedAnalysis.grade
            },
            aspectImprovements: improvements,
            lengthChange: optimizedPrompt.length - originalAnalysis.text.length,
            wordCountChange: this.countWords(optimizedPrompt) - originalAnalysis.metadata.wordCount,
            issuesResolved: Math.max(0, originalAnalysis.issues.length - optimizedAnalysis.issues.length),
            newSuggestions: optimizedAnalysis.suggestions?.length || 0
        };
    }

    getImprovementDescription(aspect, improvement) {
        const descriptions = {
            clarity: 'Clearer, more understandable language',
            specificity: 'More specific and detailed requirements',
            structure: 'Better organized and formatted',
            context: 'Enhanced background information',
            completeness: 'More comprehensive and complete'
        };
        
        return descriptions[aspect] || `Improved ${aspect}`;
    }

    /**
     * Batch optimization for multiple prompts
     */
    async batchOptimize(prompts, options = {}) {
        const batchOptions = {
            concurrent: 3,
            stopOnError: false,
            ...options
        };
        
        const results = [];
        const errors = [];
        
        // Process prompts in batches
        for (let i = 0; i < prompts.length; i += batchOptions.concurrent) {
            const batch = prompts.slice(i, i + batchOptions.concurrent);
            
            const batchPromises = batch.map(async (prompt, index) => {
                try {
                    const result = await this.optimize(prompt, options);
                    return { index: i + index, result, error: null };
                } catch (error) {
                    const errorInfo = { index: i + index, result: null, error: error.message };
                    if (!batchOptions.stopOnError) {
                        return errorInfo;
                    }
                    throw error;
                }
            });
            
            try {
                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach(({ index, result, error }) => {
                    if (error) {
                        errors.push({ index, error });
                    } else {
                        results[index] = result;
                    }
                });
                
            } catch (error) {
                if (batchOptions.stopOnError) {
                    throw new Error(`Batch optimization failed at batch starting index ${i}: ${error.message}`);
                }
            }
        }
        
        return {
            results: results.filter(r => r !== undefined),
            errors,
            summary: {
                total: prompts.length,
                successful: results.filter(r => r !== undefined).length,
                failed: errors.length
            }
        };
    }

    /**
     * Real-time optimization suggestions while typing
     */
    getRealtimeSuggestions(prompt, options = {}) {
        try {
            // Quick analysis for real-time feedback
            const analysis = this.analyzer.analyze(prompt, options);
            
            // Generate only immediate suggestions
            const suggestions = {
                immediate: this.suggestions.generateImmediateFixes(prompt, analysis),
                quickTips: this.getQuickTips(prompt, analysis),
                score: analysis.overallScore,
                grade: analysis.grade
            };
            
            return suggestions;
            
        } catch (error) {
            console.error('Real-time suggestions failed:', error);
            return {
                immediate: [],
                quickTips: [],
                score: 0,
                grade: 'F'
            };
        }
    }

    getQuickTips(prompt, analysis) {
        const tips = [];
        
        if (analysis.metadata.wordCount < 5) {
            tips.push('Add more detail to get better results');
        }
        
        if (analysis.metadata.questionCount === 0) {
            tips.push('End with a specific question');
        }
        
        if (analysis.scores.specificity < 60) {
            tips.push('Be more specific about what you want');
        }
        
        if (!/(please|context|example)/i.test(prompt)) {
            tips.push('Consider adding context or examples');
        }
        
        return tips.slice(0, 3);
    }

    /**
     * Get optimization history and analytics
     */
    async getOptimizationHistory(options = {}) {
        try {
            const filters = {
                platform: null,
                dateFrom: null,
                dateTo: null,
                userId: null,
                limit: 50,
                ...options
            };
            
            if (typeof chrome === 'undefined' || !chrome.storage) {
                return { history: [], analytics: this.analytics };
            }
            
            const data = await chrome.storage.local.get(['promptHistory', 'optimizationAnalytics']);
            let history = data.promptHistory || [];
            
            // Apply filters
            if (filters.platform) {
                history = history.filter(h => h.platform === filters.platform);
            }
            
            if (filters.dateFrom) {
                history = history.filter(h => h.timestamp >= filters.dateFrom);
            }
            
            if (filters.dateTo) {
                history = history.filter(h => h.timestamp <= filters.dateTo);
            }
            
            if (filters.userId) {
                history = history.filter(h => h.userId === filters.userId);
            }
            
            // Sort by timestamp (most recent first) and limit
            history = history
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, filters.limit);
            
            return {
                history,
                analytics: data.optimizationAnalytics || this.analytics,
                filters
            };
            
        } catch (error) {
            console.error('Failed to get optimization history:', error);
            return { history: [], analytics: this.analytics };
        }
    }

    /**
     * Export optimization results
     */
    async exportResults(format = 'json', options = {}) {
        try {
            const historyData = await this.getOptimizationHistory(options);
            
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0.0',
                    format,
                    totalEntries: historyData.history.length
                },
                analytics: historyData.analytics,
                history: historyData.history
            };
            
            switch (format) {
                case 'json':
                    return JSON.stringify(exportData, null, 2);
                    
                case 'csv':
                    return this.convertToCSV(historyData.history);
                    
                case 'markdown':
                    return this.convertToMarkdown(exportData);
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    convertToCSV(history) {
        if (history.length === 0) return 'No data to export';
        
        const headers = ['Date', 'Platform', 'Original', 'Optimized', 'Score Improvement', 'Grade Change'];
        const rows = history.map(entry => [
            new Date(entry.timestamp).toISOString(),
            entry.platform || 'N/A',
            `"${entry.original?.replace(/"/g, '""') || ''}"`,
            `"${entry.optimized?.replace(/"/g, '""') || ''}"`,
            entry.scoreImprovement || 0,
            entry.gradeChange || 'N/A'
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    convertToMarkdown(exportData) {
        let markdown = `# MyAyAI Optimization Export\n\n`;
        markdown += `**Export Date:** ${exportData.metadata.exportDate}\n`;
        markdown += `**Total Entries:** ${exportData.metadata.totalEntries}\n\n`;
        
        markdown += `## Analytics Summary\n\n`;
        markdown += `- **Total Optimizations:** ${exportData.analytics.optimizations}\n`;
        markdown += `- **Average Score Improvement:** ${exportData.analytics.averageScoreImprovement}\n\n`;
        
        markdown += `## Optimization History\n\n`;
        exportData.history.forEach((entry, index) => {
            markdown += `### Optimization ${index + 1}\n\n`;
            markdown += `**Date:** ${new Date(entry.timestamp).toLocaleDateString()}\n`;
            markdown += `**Platform:** ${entry.platform || 'N/A'}\n\n`;
            markdown += `**Original:**\n\`\`\`\n${entry.original || 'N/A'}\n\`\`\`\n\n`;
            markdown += `**Optimized:**\n\`\`\`\n${entry.optimized || 'N/A'}\n\`\`\`\n\n`;
            markdown += `---\n\n`;
        });
        
        return markdown;
    }

    /**
     * Cache management
     */
    generateCacheKey(prompt, options) {
        const keyData = {
            prompt: prompt.substring(0, 200), // Use first 200 chars
            level: options.level,
            platform: options.platform
        };
        
        return btoa(JSON.stringify(keyData));
    }

    addToCache(key, result) {
        // Implement LRU cache logic
        if (this.cache.size >= this.options.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, result);
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Analytics tracking
     */
    async trackOptimization(result, options) {
        try {
            this.analytics.optimizations++;
            
            // Track platform usage
            if (options.platform) {
                this.analytics.platformUsage[options.platform] = 
                    (this.analytics.platformUsage[options.platform] || 0) + 1;
            }
            
            // Track improvements
            const scoreImprovement = result.improvement.overallScoreChange;
            if (scoreImprovement > 0) {
                this.analytics.averageScoreImprovement = 
                    ((this.analytics.averageScoreImprovement * (this.analytics.optimizations - 1)) + scoreImprovement) 
                    / this.analytics.optimizations;
            }
            
            // Save analytics
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ 
                    optimizationAnalytics: this.analytics 
                });
            }
            
        } catch (error) {
            console.error('Failed to track optimization:', error);
        }
    }

    /**
     * Utility methods
     */
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Get engine statistics
     */
    getStats() {
        return {
            analytics: this.analytics,
            cache: {
                size: this.cache.size,
                maxSize: this.options.maxCacheSize
            },
            version: '1.0.0',
            uptime: Date.now() - (this.initTime || Date.now())
        };
    }

    /**
     * Reset engine state
     */
    reset() {
        this.cache.clear();
        this.analytics = {
            optimizations: 0,
            improvements: {},
            platformUsage: {},
            averageScoreImprovement: 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizationEngine;
} else if (typeof window !== 'undefined') {
    window.OptimizationEngine = OptimizationEngine;
} else {
    self.OptimizationEngine = OptimizationEngine;
}
