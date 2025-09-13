/**
 * MyAyAI Value Tracker
 * Handles metrics calculation, data persistence, and value tracking
 */

class ValueTracker {
    constructor() {
        this.storageKeys = {
            dailyStats: 'myayai_daily_stats',
            lifetimeStats: 'myayai_lifetime_stats',
            achievements: 'myayai_achievements',
            userLevel: 'myayai_user_level',
            streak: 'myayai_streak',
            settings: 'myayai_settings'
        };

        this.defaultStats = {
            daily: {
                promptsOptimized: 0,
                timeSaved: 0,
                apiCostsSaved: 0,
                qualityImprovement: 0,
                optimizations: [],
                date: this.getTodayDate()
            },
            lifetime: {
                totalPrompts: 0,
                totalTimeSaved: 0,
                totalApiCostsSaved: 0,
                averageQuality: 0,
                platformUsage: {
                    chatgpt: 0,
                    claude: 0,
                    gemini: 0,
                    perplexity: 0,
                    others: 0
                },
                dailyHistory: [],
                qualityHistory: []
            }
        };

        this.achievements = {
            firstOptimization: { id: 'first', title: 'First Steps', description: 'Completed your first optimization', icon: '🎯', unlocked: false, xp: 100 },
            tenOptimizations: { id: 'ten', title: 'Getting Started', description: 'Completed 10 optimizations', icon: '⚡', unlocked: false, xp: 250 },
            hundredOptimizations: { id: 'hundred', title: 'Optimization Master', description: 'Completed 100 optimizations', icon: '🏆', unlocked: false, xp: 1000 },
            weekStreak: { id: 'week_streak', title: 'Weekly Warrior', description: 'Maintained a 7-day streak', icon: '🔥', unlocked: false, xp: 500 },
            monthStreak: { id: 'month_streak', title: 'Monthly Master', description: 'Maintained a 30-day streak', icon: '👑', unlocked: false, xp: 2000 },
            qualityExpert: { id: 'quality', title: 'Quality Expert', description: 'Achieved 90%+ average quality', icon: '💎', unlocked: false, xp: 750 },
            timeSaver: { id: 'time_saver', title: 'Time Saver', description: 'Saved 10 hours total', icon: '⏰', unlocked: false, xp: 600 },
            costOptimizer: { id: 'cost_optimizer', title: 'Cost Optimizer', description: 'Saved $100 in API costs', icon: '💰', unlocked: false, xp: 800 }
        };

        this.levelThresholds = [0, 500, 1200, 2500, 4500, 7500, 12000, 18000, 26000, 36000, 50000];
        
        this.init();
    }

    async init() {
        await this.loadData();
        await this.checkDailyReset();
        this.startDailyResetTimer();
    }

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    async loadData() {
        try {
            const data = await chrome.storage.local.get(Object.values(this.storageKeys));
            
            this.dailyStats = data[this.storageKeys.dailyStats] || { ...this.defaultStats.daily };
            this.lifetimeStats = data[this.storageKeys.lifetimeStats] || { ...this.defaultStats.lifetime };
            this.userAchievements = data[this.storageKeys.achievements] || { ...this.achievements };
            this.userLevel = data[this.storageKeys.userLevel] || { level: 1, xp: 0, totalXP: 0 };
            this.streak = data[this.storageKeys.streak] || { current: 0, longest: 0, lastUpdate: this.getTodayDate() };
            
        } catch (error) {
            console.error('Failed to load tracker data:', error);
            this.initializeDefaultData();
        }
    }

    initializeDefaultData() {
        this.dailyStats = { ...this.defaultStats.daily };
        this.lifetimeStats = { ...this.defaultStats.lifetime };
        this.userAchievements = { ...this.achievements };
        this.userLevel = { level: 1, xp: 0, totalXP: 0 };
        this.streak = { current: 0, longest: 0, lastUpdate: this.getTodayDate() };
    }

    async saveData() {
        try {
            await chrome.storage.local.set({
                [this.storageKeys.dailyStats]: this.dailyStats,
                [this.storageKeys.lifetimeStats]: this.lifetimeStats,
                [this.storageKeys.achievements]: this.userAchievements,
                [this.storageKeys.userLevel]: this.userLevel,
                [this.storageKeys.streak]: this.streak
            });
        } catch (error) {
            console.error('Failed to save tracker data:', error);
        }
    }

    async checkDailyReset() {
        const today = this.getTodayDate();
        
        if (this.dailyStats.date !== today) {
            // Archive yesterday's data
            if (this.dailyStats.promptsOptimized > 0) {
                this.lifetimeStats.dailyHistory.push({
                    date: this.dailyStats.date,
                    prompts: this.dailyStats.promptsOptimized,
                    quality: this.dailyStats.qualityImprovement
                });
                
                // Keep only last 30 days
                if (this.lifetimeStats.dailyHistory.length > 30) {
                    this.lifetimeStats.dailyHistory.shift();
                }
            }
            
            // Reset daily stats
            this.dailyStats = {
                ...this.defaultStats.daily,
                date: today
            };
            
            // Update streak
            await this.updateStreak();
            
            await this.saveData();
        }
    }

    startDailyResetTimer() {
        // Check for daily reset every hour
        setInterval(() => {
            this.checkDailyReset();
        }, 3600000); // 1 hour
    }

    // Record a new optimization
    async recordOptimization(optimizationData) {
        const {
            platform = 'unknown',
            originalPrompt = '',
            optimizedPrompt = '',
            timeSaved = 0, // in minutes
            qualityImprovement = 0, // percentage
            complexityScore = 1 // 1-5 scale
        } = optimizationData;

        // Calculate values
        const apiCostSaved = this.calculateAPICostSaved(originalPrompt, optimizedPrompt, complexityScore);
        const xpEarned = this.calculateXP(complexityScore, qualityImprovement);

        // Update daily stats
        this.dailyStats.promptsOptimized++;
        this.dailyStats.timeSaved += timeSaved;
        this.dailyStats.apiCostsSaved += apiCostSaved;
        this.dailyStats.qualityImprovement = this.calculateAverageQuality([
            ...this.dailyStats.optimizations.map(o => o.qualityImprovement),
            qualityImprovement
        ]);
        
        this.dailyStats.optimizations.push({
            timestamp: Date.now(),
            platform,
            originalPrompt: originalPrompt.substring(0, 200), // Store first 200 chars
            optimizedPrompt: optimizedPrompt.substring(0, 200),
            timeSaved,
            qualityImprovement,
            complexityScore,
            apiCostSaved,
            xpEarned
        });

        // Update lifetime stats
        this.lifetimeStats.totalPrompts++;
        this.lifetimeStats.totalTimeSaved += timeSaved;
        this.lifetimeStats.totalApiCostsSaved += apiCostSaved;
        this.lifetimeStats.averageQuality = this.calculateAverageQuality([
            ...this.lifetimeStats.qualityHistory,
            qualityImprovement
        ]);
        
        // Update platform usage
        const platformKey = this.getPlatformKey(platform);
        this.lifetimeStats.platformUsage[platformKey]++;
        
        // Add to quality history
        this.lifetimeStats.qualityHistory.push(qualityImprovement);
        if (this.lifetimeStats.qualityHistory.length > 100) {
            this.lifetimeStats.qualityHistory.shift();
        }

        // Update XP and level
        await this.addXP(xpEarned);
        
        // Update streak
        await this.updateStreak();
        
        // Check achievements
        await this.checkAchievements();
        
        // Save all data
        await this.saveData();
        
        return {
            xpEarned,
            levelUp: false, // Will be set by addXP if applicable
            newAchievements: this.checkNewAchievements(),
            dailyStats: this.dailyStats,
            lifetimeStats: this.lifetimeStats
        };
    }

    calculateAPICostSaved(originalPrompt, optimizedPrompt, complexityScore) {
        // Estimate API cost based on token count and optimization efficiency
        const originalTokens = this.estimateTokenCount(originalPrompt);
        const optimizedTokens = this.estimateTokenCount(optimizedPrompt);
        const tokensSaved = Math.max(0, originalTokens - optimizedTokens);
        
        // Average API cost per 1K tokens (varies by provider)
        const avgCostPer1KTokens = 0.002; // $0.002 average
        const baseSavings = (tokensSaved / 1000) * avgCostPer1KTokens;
        
        // Multiply by complexity score (more complex optimizations save more)
        const complexityMultiplier = 1 + (complexityScore - 1) * 0.5;
        
        return Math.round((baseSavings * complexityMultiplier) * 100) / 100; // Round to cents
    }

    estimateTokenCount(text) {
        // Rough estimate: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    calculateXP(complexityScore, qualityImprovement) {
        const baseXP = 50;
        const complexityBonus = complexityScore * 20;
        const qualityBonus = Math.floor(qualityImprovement / 10) * 25;
        
        return baseXP + complexityBonus + qualityBonus;
    }

    calculateAverageQuality(qualityArray) {
        if (qualityArray.length === 0) return 0;
        const sum = qualityArray.reduce((acc, val) => acc + val, 0);
        return Math.round((sum / qualityArray.length) * 10) / 10; // Round to 1 decimal
    }

    getPlatformKey(platform) {
        const platformMap = {
            'chat.openai.com': 'chatgpt',
            'openai': 'chatgpt',
            'claude.ai': 'claude',
            'claude': 'claude',
            'gemini.google.com': 'gemini',
            'gemini': 'gemini',
            'www.perplexity.ai': 'perplexity',
            'perplexity': 'perplexity'
        };
        
        return platformMap[platform.toLowerCase()] || 'others';
    }

    async addXP(xpAmount) {
        const oldLevel = this.userLevel.level;
        this.userLevel.xp += xpAmount;
        this.userLevel.totalXP += xpAmount;
        
        // Check for level up
        const newLevel = this.calculateLevel(this.userLevel.totalXP);
        
        if (newLevel > oldLevel) {
            this.userLevel.level = newLevel;
            this.userLevel.xp = this.userLevel.totalXP - this.levelThresholds[newLevel - 1];
            
            // Trigger level up celebration
            if (window.dashboardComponents) {
                window.dashboardComponents.celebrateLevelUp(newLevel);
            }
            
            return { levelUp: true, newLevel, xpEarned: xpAmount };
        }
        
        return { levelUp: false, newLevel: oldLevel, xpEarned: xpAmount };
    }

    calculateLevel(totalXP) {
        for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
            if (totalXP >= this.levelThresholds[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    getXPForCurrentLevel() {
        const currentLevel = this.userLevel.level;
        const currentLevelXP = this.levelThresholds[currentLevel - 1] || 0;
        const nextLevelXP = this.levelThresholds[currentLevel] || this.levelThresholds[this.levelThresholds.length - 1];
        
        return {
            current: this.userLevel.totalXP - currentLevelXP,
            required: nextLevelXP - currentLevelXP,
            percentage: ((this.userLevel.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
        };
    }

    async updateStreak() {
        const today = this.getTodayDate();
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        if (this.streak.lastUpdate === yesterday && this.dailyStats.promptsOptimized > 0) {
            // Continue streak
            this.streak.current++;
            this.streak.lastUpdate = today;
            
            if (this.streak.current > this.streak.longest) {
                this.streak.longest = this.streak.current;
            }
            
            // Check for streak achievements
            if (this.streak.current === 7 && !this.userAchievements.weekStreak.unlocked) {
                await this.unlockAchievement('weekStreak');
            }
            
            if (this.streak.current === 30 && !this.userAchievements.monthStreak.unlocked) {
                await this.unlockAchievement('monthStreak');
            }
            
            // Celebrate streak milestones
            if (window.dashboardComponents && (this.streak.current % 7 === 0 || this.streak.current % 30 === 0)) {
                window.dashboardComponents.celebrateStreak(this.streak.current);
            }
            
        } else if (this.streak.lastUpdate !== today && this.dailyStats.promptsOptimized > 0) {
            // Start new streak
            this.streak.current = 1;
            this.streak.lastUpdate = today;
        } else if (this.streak.lastUpdate < yesterday) {
            // Streak broken
            this.streak.current = 0;
        }
    }

    async checkAchievements() {
        const achievements = [];
        
        // First optimization
        if (this.lifetimeStats.totalPrompts === 1 && !this.userAchievements.firstOptimization.unlocked) {
            achievements.push(await this.unlockAchievement('firstOptimization'));
        }
        
        // 10 optimizations
        if (this.lifetimeStats.totalPrompts === 10 && !this.userAchievements.tenOptimizations.unlocked) {
            achievements.push(await this.unlockAchievement('tenOptimizations'));
        }
        
        // 100 optimizations
        if (this.lifetimeStats.totalPrompts === 100 && !this.userAchievements.hundredOptimizations.unlocked) {
            achievements.push(await this.unlockAchievement('hundredOptimizations'));
        }
        
        // Quality expert (90%+ average)
        if (this.lifetimeStats.averageQuality >= 90 && !this.userAchievements.qualityExpert.unlocked) {
            achievements.push(await this.unlockAchievement('qualityExpert'));
        }
        
        // Time saver (10 hours = 600 minutes)
        if (this.lifetimeStats.totalTimeSaved >= 600 && !this.userAchievements.timeSaver.unlocked) {
            achievements.push(await this.unlockAchievement('timeSaver'));
        }
        
        // Cost optimizer ($100 saved)
        if (this.lifetimeStats.totalApiCostsSaved >= 100 && !this.userAchievements.costOptimizer.unlocked) {
            achievements.push(await this.unlockAchievement('costOptimizer'));
        }
        
        return achievements.filter(Boolean);
    }

    async unlockAchievement(achievementId) {
        if (!this.userAchievements[achievementId]) return null;
        
        const achievement = this.userAchievements[achievementId];
        if (achievement.unlocked) return null;
        
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        
        // Add XP bonus
        await this.addXP(achievement.xp);
        
        // Trigger celebration
        if (window.dashboardComponents) {
            window.dashboardComponents.celebrateAchievement({
                icon: achievement.icon,
                title: achievement.title,
                description: achievement.description,
                element: document.querySelector(`[data-achievement="${achievementId}"]`)
            });
        }
        
        return achievement;
    }

    checkNewAchievements() {
        return Object.values(this.userAchievements)
            .filter(achievement => achievement.unlocked && 
                achievement.unlockedAt && 
                Date.now() - achievement.unlockedAt < 5000); // Within last 5 seconds
    }

    // Get data for UI display
    getDailyMetrics() {
        return {
            promptsOptimized: this.dailyStats.promptsOptimized,
            timeSaved: this.dailyStats.timeSaved,
            apiCostsSaved: this.dailyStats.apiCostsSaved,
            qualityImprovement: this.dailyStats.qualityImprovement,
            todaysOptimizations: this.dailyStats.optimizations.length
        };
    }

    getLifetimeMetrics() {
        return {
            totalPrompts: this.lifetimeStats.totalPrompts,
            totalTimeSaved: this.lifetimeStats.totalTimeSaved,
            totalApiCostsSaved: this.lifetimeStats.totalApiCostsSaved,
            averageQuality: this.lifetimeStats.averageQuality,
            platformUsage: this.calculatePlatformPercentages()
        };
    }

    calculatePlatformPercentages() {
        const total = Object.values(this.lifetimeStats.platformUsage).reduce((sum, count) => sum + count, 0);
        if (total === 0) return this.lifetimeStats.platformUsage;
        
        const percentages = {};
        for (const [platform, count] of Object.entries(this.lifetimeStats.platformUsage)) {
            percentages[platform] = Math.round((count / total) * 100);
        }
        
        return percentages;
    }

    getStreakData() {
        return {
            current: this.streak.current,
            longest: this.streak.longest,
            lastUpdate: this.streak.lastUpdate
        };
    }

    getLevelData() {
        return {
            level: this.userLevel.level,
            totalXP: this.userLevel.totalXP,
            ...this.getXPForCurrentLevel()
        };
    }

    getAchievements() {
        return Object.values(this.userAchievements)
            .map(achievement => ({
                ...achievement,
                unlocked: achievement.unlocked || false
            }))
            .sort((a, b) => {
                if (a.unlocked && !b.unlocked) return -1;
                if (!a.unlocked && b.unlocked) return 1;
                return 0;
            });
    }

    getSparklineData() {
        const dailyData = this.lifetimeStats.dailyHistory
            .slice(-14) // Last 14 days
            .map(day => day.prompts);
            
        const qualityData = this.lifetimeStats.qualityHistory
            .slice(-14) // Last 14 data points
            .map(quality => quality);
            
        return {
            daily: dailyData,
            quality: qualityData
        };
    }

    getLastOptimization() {
        if (this.dailyStats.optimizations.length === 0) return null;
        
        const lastOpt = this.dailyStats.optimizations[this.dailyStats.optimizations.length - 1];
        return {
            originalPrompt: lastOpt.originalPrompt,
            optimizedPrompt: lastOpt.optimizedPrompt,
            qualityImprovement: lastOpt.qualityImprovement,
            timeSaved: lastOpt.timeSaved,
            platform: lastOpt.platform,
            timestamp: lastOpt.timestamp
        };
    }

    // Export data for backup
    async exportData() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            dailyStats: this.dailyStats,
            lifetimeStats: this.lifetimeStats,
            achievements: this.userAchievements,
            userLevel: this.userLevel,
            streak: this.streak
        };
        
        return exportData;
    }

    // Clear all data
    async clearAllData() {
        await chrome.storage.local.remove(Object.values(this.storageKeys));
        this.initializeDefaultData();
        await this.saveData();
    }
}

// Export for use in other modules
window.ValueTracker = ValueTracker;
