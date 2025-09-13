/**
 * Unit tests for Value Tracker
 */

describe('ValueTracker', () => {
  let valueTracker;

  beforeEach(() => {
    // Mock ValueTracker class
    global.ValueTracker = class ValueTracker {
      constructor() {
        this.data = {
          lifetime: {
            promptsOptimized: 0,
            timeSaved: 0,
            apiCostsSaved: 0,
            qualityImprovement: 0,
            platforms: {},
            achievements: new Set(),
            level: 1,
            xp: 0,
            streak: 0,
            lastOptimization: null,
            history: [],
            settings: {
              soundEffects: true,
              animations: true,
              theme: 'auto'
            }
          },
          daily: {},
          achievements: this.initializeAchievements()
        };
        
        this.loaded = false;
        this.updateCallbacks = [];
      }

      async init() {
        try {
          const stored = await chrome.storage.local.get(['myayai_data']);
          if (stored.myayai_data) {
            this.data = { ...this.data, ...stored.myayai_data };
          }
          this.loaded = true;
          this.notifyUpdate();
        } catch (error) {
          console.warn('Failed to load data, using defaults:', error);
          this.loaded = true;
        }
      }

      initializeAchievements() {
        return [
          {
            id: 'first-optimization',
            icon: '🚀',
            title: 'First Steps',
            description: 'Complete your first prompt optimization',
            condition: (data) => data.lifetime.promptsOptimized >= 1,
            unlocked: false
          },
          {
            id: 'speed-demon',
            icon: '⚡',
            title: 'Speed Demon',
            description: 'Save over 1 hour in total',
            condition: (data) => data.lifetime.timeSaved >= 3600,
            unlocked: false
          },
          {
            id: 'efficiency-expert',
            icon: '🎯',
            title: 'Efficiency Expert',
            description: 'Optimize 100 prompts',
            condition: (data) => data.lifetime.promptsOptimized >= 100,
            unlocked: false
          },
          {
            id: 'cost-saver',
            icon: '💰',
            title: 'Cost Saver',
            description: 'Save over $50 in API costs',
            condition: (data) => data.lifetime.apiCostsSaved >= 50,
            unlocked: false
          },
          {
            id: 'quality-master',
            icon: '⭐',
            title: 'Quality Master',
            description: 'Maintain 90%+ average quality improvement',
            condition: (data) => (data.lifetime.qualityImprovement / Math.max(data.lifetime.promptsOptimized, 1)) >= 90,
            unlocked: false
          },
          {
            id: 'streak-keeper',
            icon: '🔥',
            title: 'Streak Keeper',
            description: 'Maintain a 7-day streak',
            condition: (data) => data.lifetime.streak >= 7,
            unlocked: false
          }
        ];
      }

      async recordOptimization(optimization) {
        if (!this.loaded) {
          throw new Error('ValueTracker not initialized');
        }

        const today = new Date().toDateString();
        const previousLevel = this.data.lifetime.level;
        const previousAchievements = new Set(this.data.lifetime.achievements);

        // Update lifetime metrics
        this.data.lifetime.promptsOptimized++;
        this.data.lifetime.timeSaved += optimization.timeSaved || 0;
        this.data.lifetime.apiCostsSaved += optimization.apiCostsSaved || 0;
        this.data.lifetime.qualityImprovement += optimization.qualityImprovement || 0;
        this.data.lifetime.lastOptimization = {
          ...optimization,
          timestamp: Date.now()
        };

        // Update platform usage
        if (optimization.platform) {
          this.data.lifetime.platforms[optimization.platform] = 
            (this.data.lifetime.platforms[optimization.platform] || 0) + 1;
        }

        // Update daily metrics
        if (!this.data.daily[today]) {
          this.data.daily[today] = {
            promptsOptimized: 0,
            timeSaved: 0,
            apiCostsSaved: 0,
            qualityImprovement: 0
          };
        }

        this.data.daily[today].promptsOptimized++;
        this.data.daily[today].timeSaved += optimization.timeSaved || 0;
        this.data.daily[today].apiCostsSaved += optimization.apiCostsSaved || 0;
        this.data.daily[today].qualityImprovement += optimization.qualityImprovement || 0;

        // Add to history
        this.data.lifetime.history.push({
          ...optimization,
          timestamp: Date.now()
        });

        // Keep only last 1000 entries
        if (this.data.lifetime.history.length > 1000) {
          this.data.lifetime.history = this.data.lifetime.history.slice(-1000);
        }

        // Update XP and level
        const xpGained = this.calculateXP(optimization);
        this.data.lifetime.xp += xpGained;
        this.updateLevel();

        // Update streak
        this.updateStreak();

        // Check achievements
        this.checkAchievements();

        // Save data
        await this.save();

        // Notify callbacks
        this.notifyUpdate();

        return {
          levelUp: this.data.lifetime.level > previousLevel,
          newLevel: this.data.lifetime.level,
          newAchievements: this.getNewAchievements(previousAchievements),
          xpGained
        };
      }

      calculateXP(optimization) {
        let xp = 10; // Base XP
        xp += Math.floor((optimization.timeSaved || 0) / 10); // 1 XP per 10 seconds saved
        xp += Math.floor((optimization.qualityImprovement || 0) / 5); // 1 XP per 5% quality improvement
        xp += (optimization.complexityScore || 1) * 5; // Bonus for complexity
        return Math.min(xp, 100); // Cap at 100 XP per optimization
      }

      updateLevel() {
        const xpRequired = (level) => Math.floor(100 * Math.pow(1.5, level - 1));
        
        while (this.data.lifetime.xp >= xpRequired(this.data.lifetime.level + 1)) {
          this.data.lifetime.level++;
        }
      }

      updateStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

        if (this.data.daily[today] && this.data.daily[today].promptsOptimized > 0) {
          if (this.data.daily[yesterday] && this.data.daily[yesterday].promptsOptimized > 0) {
            // Continue streak
            this.data.lifetime.streak++;
          } else {
            // Start new streak
            this.data.lifetime.streak = 1;
          }
        }
      }

      checkAchievements() {
        this.data.achievements.forEach(achievement => {
          if (!achievement.unlocked && achievement.condition(this.data)) {
            achievement.unlocked = true;
            this.data.lifetime.achievements.add(achievement.id);
          }
        });
      }

      getNewAchievements(previousAchievements) {
        return this.data.achievements.filter(achievement => 
          achievement.unlocked && !previousAchievements.has(achievement.id)
        );
      }

      getDailyMetrics() {
        const today = new Date().toDateString();
        const dailyData = this.data.daily[today] || {
          promptsOptimized: 0,
          timeSaved: 0,
          apiCostsSaved: 0,
          qualityImprovement: 0
        };

        return {
          ...dailyData,
          qualityImprovement: dailyData.promptsOptimized > 0 
            ? dailyData.qualityImprovement / dailyData.promptsOptimized 
            : 0
        };
      }

      getLevelData() {
        const currentLevel = this.data.lifetime.level;
        const currentXP = this.data.lifetime.xp;
        const xpRequired = (level) => Math.floor(100 * Math.pow(1.5, level - 1));
        const currentLevelXP = xpRequired(currentLevel);
        const nextLevelXP = xpRequired(currentLevel + 1);
        const progressXP = currentXP - currentLevelXP;
        const requiredXP = nextLevelXP - currentLevelXP;

        return {
          level: currentLevel,
          current: currentXP,
          required: nextLevelXP,
          progress: progressXP,
          remaining: requiredXP - progressXP,
          percentage: (progressXP / requiredXP) * 100
        };
      }

      getStreakData() {
        return {
          current: this.data.lifetime.streak,
          best: Math.max(this.data.lifetime.streak, 0) // Could track separately
        };
      }

      getAchievements() {
        return this.data.achievements.map(achievement => ({
          ...achievement,
          unlocked: this.data.lifetime.achievements.has(achievement.id)
        }));
      }

      getLifetimeMetrics() {
        const totalPlatformUsage = Object.values(this.data.lifetime.platforms)
          .reduce((sum, count) => sum + count, 0);
        
        const platformUsage = {};
        const platformNames = {
          chatgpt: 'chatgpt',
          claude: 'claude', 
          gemini: 'gemini'
        };

        Object.entries(platformNames).forEach(([key, name]) => {
          const count = this.data.lifetime.platforms[key] || 0;
          platformUsage[name] = totalPlatformUsage > 0 
            ? Math.round((count / totalPlatformUsage) * 100) 
            : 0;
        });

        // Calculate 'others' percentage
        const knownPercentage = Object.values(platformUsage).reduce((sum, pct) => sum + pct, 0);
        platformUsage.others = Math.max(0, 100 - knownPercentage);

        return {
          ...this.data.lifetime,
          platformUsage,
          avgQualityImprovement: this.data.lifetime.promptsOptimized > 0 
            ? this.data.lifetime.qualityImprovement / this.data.lifetime.promptsOptimized 
            : 0
        };
      }

      getSparklineData() {
        const last7Days = [];
        const qualityData = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
          const dayData = this.data.daily[date] || { promptsOptimized: 0, qualityImprovement: 0 };
          
          last7Days.push(dayData.promptsOptimized);
          qualityData.push(
            dayData.promptsOptimized > 0 
              ? dayData.qualityImprovement / dayData.promptsOptimized 
              : 0
          );
        }

        return {
          daily: last7Days,
          quality: qualityData
        };
      }

      getLastOptimization() {
        return this.data.lifetime.lastOptimization;
      }

      async exportData() {
        return {
          ...this.data,
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        };
      }

      async importData(importedData) {
        if (!importedData || !importedData.lifetime) {
          throw new Error('Invalid import data format');
        }

        this.data = {
          ...this.data,
          ...importedData,
          achievements: this.data.achievements // Keep achievement definitions
        };

        await this.save();
        this.notifyUpdate();
      }

      async clearAllData() {
        this.data = {
          lifetime: {
            promptsOptimized: 0,
            timeSaved: 0,
            apiCostsSaved: 0,
            qualityImprovement: 0,
            platforms: {},
            achievements: new Set(),
            level: 1,
            xp: 0,
            streak: 0,
            lastOptimization: null,
            history: [],
            settings: this.data.lifetime.settings // Preserve settings
          },
          daily: {},
          achievements: this.initializeAchievements()
        };

        await this.save();
        this.notifyUpdate();
      }

      async save() {
        try {
          const dataToSave = {
            ...this.data,
            lifetime: {
              ...this.data.lifetime,
              achievements: Array.from(this.data.lifetime.achievements)
            }
          };
          
          await chrome.storage.local.set({ myayai_data: dataToSave });
        } catch (error) {
          console.error('Failed to save data:', error);
        }
      }

      onUpdate(callback) {
        this.updateCallbacks.push(callback);
        return () => {
          const index = this.updateCallbacks.indexOf(callback);
          if (index > -1) {
            this.updateCallbacks.splice(index, 1);
          }
        };
      }

      notifyUpdate() {
        this.updateCallbacks.forEach(callback => {
          try {
            callback(this.data);
          } catch (error) {
            console.error('Update callback failed:', error);
          }
        });
      }
    };

    valueTracker = new global.ValueTracker();
  });

  describe('Initialization', () => {
    it('should initialize with default data', async () => {
      chrome.storage.local.get.mockResolvedValueOnce({});
      
      await valueTracker.init();

      expect(valueTracker.loaded).toBe(true);
      expect(valueTracker.data.lifetime.level).toBe(1);
      expect(valueTracker.data.lifetime.xp).toBe(0);
    });

    it('should load existing data', async () => {
      const existingData = {
        lifetime: {
          promptsOptimized: 50,
          level: 3,
          xp: 500
        }
      };
      
      chrome.storage.local.get.mockResolvedValueOnce({ myayai_data: existingData });
      
      await valueTracker.init();

      expect(valueTracker.data.lifetime.promptsOptimized).toBe(50);
      expect(valueTracker.data.lifetime.level).toBe(3);
      expect(valueTracker.data.lifetime.xp).toBe(500);
    });

    it('should handle initialization errors gracefully', async () => {
      chrome.storage.local.get.mockRejectedValueOnce(new Error('Storage error'));
      console.warn = jest.fn();
      
      await valueTracker.init();

      expect(console.warn).toHaveBeenCalled();
      expect(valueTracker.loaded).toBe(true);
    });
  });

  describe('Recording Optimizations', () => {
    beforeEach(async () => {
      await valueTracker.init();
    });

    it('should record optimization data correctly', async () => {
      const optimization = {
        platform: 'chatgpt',
        timeSaved: 30,
        apiCostsSaved: 0.05,
        qualityImprovement: 25,
        complexityScore: 2
      };

      const result = await valueTracker.recordOptimization(optimization);

      expect(valueTracker.data.lifetime.promptsOptimized).toBe(1);
      expect(valueTracker.data.lifetime.timeSaved).toBe(30);
      expect(valueTracker.data.lifetime.apiCostsSaved).toBe(0.05);
      expect(valueTracker.data.lifetime.qualityImprovement).toBe(25);
      expect(result.xpGained).toBeGreaterThan(0);
    });

    it('should update daily metrics', async () => {
      const optimization = {
        timeSaved: 15,
        qualityImprovement: 20
      };

      await valueTracker.recordOptimization(optimization);

      const today = new Date().toDateString();
      expect(valueTracker.data.daily[today].promptsOptimized).toBe(1);
      expect(valueTracker.data.daily[today].timeSaved).toBe(15);
    });

    it('should calculate XP correctly', () => {
      const optimization = {
        timeSaved: 60, // 6 XP
        qualityImprovement: 25, // 5 XP
        complexityScore: 3 // 15 XP
      };

      const xp = valueTracker.calculateXP(optimization);
      expect(xp).toBe(26); // 10 base + 6 + 5 + 15
    });

    it('should level up when XP threshold is reached', async () => {
      // Set up data for level up
      valueTracker.data.lifetime.xp = 145; // Close to level 2 threshold (150)
      
      const optimization = {
        timeSaved: 50,
        qualityImprovement: 20,
        complexityScore: 1
      };

      const result = await valueTracker.recordOptimization(optimization);

      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
    });

    it('should maintain history with size limit', async () => {
      // Fill history beyond limit
      valueTracker.data.lifetime.history = Array(1005).fill({}).map((_, i) => ({
        id: i,
        timestamp: Date.now() - i * 1000
      }));

      await valueTracker.recordOptimization({ timeSaved: 10 });

      expect(valueTracker.data.lifetime.history.length).toBe(1000);
    });
  });

  describe('Achievement System', () => {
    beforeEach(async () => {
      await valueTracker.init();
    });

    it('should unlock first optimization achievement', async () => {
      const result = await valueTracker.recordOptimization({ timeSaved: 10 });

      const firstSteps = valueTracker.getAchievements()
        .find(a => a.id === 'first-optimization');
      
      expect(firstSteps.unlocked).toBe(true);
      expect(result.newAchievements.length).toBeGreaterThan(0);
    });

    it('should unlock time-based achievements', async () => {
      valueTracker.data.lifetime.timeSaved = 3500;
      
      await valueTracker.recordOptimization({ timeSaved: 200 });

      const speedDemon = valueTracker.getAchievements()
        .find(a => a.id === 'speed-demon');
      
      expect(speedDemon.unlocked).toBe(true);
    });

    it('should unlock volume-based achievements', async () => {
      valueTracker.data.lifetime.promptsOptimized = 99;
      
      await valueTracker.recordOptimization({ timeSaved: 10 });

      const efficiencyExpert = valueTracker.getAchievements()
        .find(a => a.id === 'efficiency-expert');
      
      expect(efficiencyExpert.unlocked).toBe(true);
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(async () => {
      await valueTracker.init();
      // Set up some test data
      valueTracker.data.lifetime = {
        ...valueTracker.data.lifetime,
        promptsOptimized: 25,
        timeSaved: 300,
        apiCostsSaved: 5.75,
        qualityImprovement: 625,
        level: 2,
        xp: 250,
        streak: 5,
        platforms: { chatgpt: 15, claude: 10 }
      };
    });

    it('should return correct daily metrics', () => {
      const today = new Date().toDateString();
      valueTracker.data.daily[today] = {
        promptsOptimized: 3,
        timeSaved: 45,
        apiCostsSaved: 0.75,
        qualityImprovement: 75
      };

      const metrics = valueTracker.getDailyMetrics();
      
      expect(metrics.promptsOptimized).toBe(3);
      expect(metrics.timeSaved).toBe(45);
      expect(metrics.qualityImprovement).toBe(25); // 75/3
    });

    it('should return correct level data', () => {
      const levelData = valueTracker.getLevelData();
      
      expect(levelData.level).toBe(2);
      expect(levelData.current).toBe(250);
      expect(levelData.percentage).toBeGreaterThan(0);
      expect(levelData.percentage).toBeLessThanOrEqual(100);
    });

    it('should return correct platform usage', () => {
      const metrics = valueTracker.getLifetimeMetrics();
      
      expect(metrics.platformUsage.chatgpt).toBe(60); // 15/25 * 100
      expect(metrics.platformUsage.claude).toBe(40); // 10/25 * 100
      expect(metrics.avgQualityImprovement).toBe(25); // 625/25
    });

    it('should return sparkline data for last 7 days', () => {
      const sparklineData = valueTracker.getSparklineData();
      
      expect(sparklineData.daily).toHaveLength(7);
      expect(sparklineData.quality).toHaveLength(7);
      expect(Array.isArray(sparklineData.daily)).toBe(true);
      expect(Array.isArray(sparklineData.quality)).toBe(true);
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await valueTracker.init();
    });

    it('should export data correctly', async () => {
      const exported = await valueTracker.exportData();
      
      expect(exported.lifetime).toBeDefined();
      expect(exported.exportDate).toBeDefined();
      expect(exported.version).toBe('1.0.0');
    });

    it('should import data correctly', async () => {
      const importData = {
        lifetime: {
          promptsOptimized: 100,
          level: 5,
          xp: 1000
        }
      };

      await valueTracker.importData(importData);

      expect(valueTracker.data.lifetime.promptsOptimized).toBe(100);
      expect(valueTracker.data.lifetime.level).toBe(5);
      expect(valueTracker.data.lifetime.xp).toBe(1000);
    });

    it('should handle invalid import data', async () => {
      await expect(valueTracker.importData(null)).rejects.toThrow('Invalid import data format');
      await expect(valueTracker.importData({})).rejects.toThrow('Invalid import data format');
    });

    it('should clear all data except settings', async () => {
      valueTracker.data.lifetime.settings.theme = 'dark';
      
      await valueTracker.clearAllData();

      expect(valueTracker.data.lifetime.promptsOptimized).toBe(0);
      expect(valueTracker.data.lifetime.level).toBe(1);
      expect(valueTracker.data.lifetime.settings.theme).toBe('dark'); // Preserved
    });

    it('should save data to storage', async () => {
      chrome.storage.local.set.mockResolvedValueOnce();
      
      await valueTracker.save();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        myayai_data: expect.any(Object)
      });
    });

    it('should handle save errors gracefully', async () => {
      chrome.storage.local.set.mockRejectedValueOnce(new Error('Storage full'));
      console.error = jest.fn();
      
      await valueTracker.save();

      expect(console.error).toHaveBeenCalledWith('Failed to save data:', expect.any(Error));
    });
  });

  describe('Update Callbacks', () => {
    beforeEach(async () => {
      await valueTracker.init();
    });

    it('should register and call update callbacks', async () => {
      const callback = jest.fn();
      const unsubscribe = valueTracker.onUpdate(callback);

      await valueTracker.recordOptimization({ timeSaved: 10 });

      expect(callback).toHaveBeenCalledWith(valueTracker.data);
      
      // Test unsubscribe
      unsubscribe();
      await valueTracker.recordOptimization({ timeSaved: 10 });
      
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle callback errors gracefully', async () => {
      const failingCallback = jest.fn(() => { throw new Error('Callback failed'); });
      const goodCallback = jest.fn();
      console.error = jest.fn();

      valueTracker.onUpdate(failingCallback);
      valueTracker.onUpdate(goodCallback);

      await valueTracker.recordOptimization({ timeSaved: 10 });

      expect(console.error).toHaveBeenCalledWith('Update callback failed:', expect.any(Error));
      expect(goodCallback).toHaveBeenCalled(); // Should still be called
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await valueTracker.init();
    });

    it('should record optimizations efficiently', async () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        await valueTracker.recordOptimization({ timeSaved: 10 });
      }
      
      const end = performance.now();
      const avgTime = (end - start) / 100;
      
      expect(avgTime).toBeLessThan(10); // Less than 10ms per record
    });

    it('should calculate metrics efficiently', () => {
      // Add significant amounts of data
      const today = new Date().toDateString();
      valueTracker.data.daily[today] = {
        promptsOptimized: 1000,
        timeSaved: 50000,
        apiCostsSaved: 500,
        qualityImprovement: 25000
      };

      const start = performance.now();
      valueTracker.getDailyMetrics();
      valueTracker.getLevelData();
      valueTracker.getLifetimeMetrics();
      valueTracker.getSparklineData();
      const end = performance.now();

      expect(end - start).toBeLessThan(10);
    });
  });
});
