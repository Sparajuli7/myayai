const ACHIEVEMENTS = {
  first: {
    id: 'first',
    title: '🎉 Welcome to AI Mastery!',
    description: 'Complete your first optimization',
    condition: (stats) => stats.totalOptimizations >= 1
  },
  speed: {
    id: 'speed',
    title: '⚡ Speed Demon',
    description: 'Perform 10 optimizations in one day',
    condition: (stats) => stats.maxDailyOptimizations >= 10
  },
  quality: {
    id: 'quality',
    title: '🎯 Quality Master',
    description: 'Achieve 10 prompts with >80% improvement',
    condition: (stats) => stats.highQualityOptimizations >= 10
  },
  time: {
    id: 'time',
    title: '⏰ Time Traveler',
    description: 'Save 10+ hours total',
    condition: (stats) => stats.totalTimeSaved >= 10 * 60 * 60 // seconds
  },
  platform: {
    id: 'platform',
    title: '🌍 Platform Explorer',
    description: 'Use on 5+ AI platforms',
    condition: (stats) => stats.uniquePlatforms.size >= 5
  },
  streak: {
    id: 'streak',
    title: '🔥 Streak Hero',
    description: 'Maintain 7-day optimization streak',
    condition: (stats) => stats.currentStreak >= 7
  },
  master: {
    id: 'master',
    title: '🎓 Prompt Master',
    description: 'Reach level 10',
    condition: (stats) => stats.level >= 10
  }
};

class Achievements {
  constructor() {
    this.stats = null;
    this.unlocked = new Set();
    this.level = 1;
    this.xp = 0;
    this.loadData();
  }

  async loadData() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['achievementsStats', 'unlockedAchievements', 'userXP', 'userLevel'], (data) => {
        this.stats = {
          ...data.achievementsStats,
          uniquePlatforms: new Set(data.achievementsStats?.uniquePlatforms || [])
        } || {
          totalOptimizations: 0,
          highQualityOptimizations: 0,
          totalTimeSaved: 0, // seconds
          uniquePlatforms: new Set(),
          currentStreak: 0,
          lastOptimizationDate: null,
          dailyOptimizations: {},
          maxDailyOptimizations: 0,
          level: 1 // Ensure level is loaded
        };
        this.unlocked = new Set(data.unlockedAchievements || []);
        this.xp = data.userXP || 0;
        this.level = data.userLevel || 1;
        resolve();
      });
    });
  }

  async saveData() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({
        achievementsStats: {
          ...this.stats,
          uniquePlatforms: Array.from(this.stats.uniquePlatforms)
        },
        unlockedAchievements: Array.from(this.unlocked),
        userXP: this.xp,
        userLevel: this.level
      }, resolve);
    });
  }

  getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  updateStreak() {
    const today = this.getTodayKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

    if (this.stats.lastOptimizationDate === today) {
      // Already optimized today, no change
    } else if (this.stats.lastOptimizationDate === yesterdayKey) {
      this.stats.currentStreak++;
    } else {
      this.stats.currentStreak = 1;
    }
    this.stats.lastOptimizationDate = today;
  }

  updateDailyCount() {
    const today = this.getTodayKey();
    this.stats.dailyOptimizations[today] = (this.stats.dailyOptimizations[today] || 0) + 1;
    this.stats.maxDailyOptimizations = Math.max(this.stats.maxDailyOptimizations, this.stats.dailyOptimizations[today]);
  }

  async trackOptimization(improvement, platform, timeSaved = 60) { // default 1 min saved
    await this.loadData();

    this.stats.totalOptimizations++;
    if (improvement > 80) this.stats.highQualityOptimizations++;
    this.stats.totalTimeSaved += timeSaved;
    this.stats.uniquePlatforms.add(platform);
    this.stats.level = this.level; // Ensure level is updated in stats

    this.updateStreak();
    this.updateDailyCount();

    // Award XP: base 10 + improvement percentage
    const xpGained = 10 + Math.floor(improvement);
    this.xp += xpGained;

    // Check level up
    const newLevel = this.calculateLevel(this.xp);
    const leveledUp = newLevel > this.level;
    if (leveledUp) {
      this.level = newLevel;
      // Trigger level up celebration
      // showLevelUp(this.level); // Assuming imported from animations.js
    }

    // Check achievements
    const newlyUnlocked = [];
    Object.values(ACHIEVEMENTS).forEach(ach => {
      if (!this.unlocked.has(ach.id) && ach.condition(this.stats)) {
        this.unlocked.add(ach.id);
        newlyUnlocked.push(ach);
      }
    });

    await this.saveData();

    // Trigger celebrations
    // if (newlyUnlocked.length > 0) {
    //   newlyUnlocked.forEach(ach => {
    //     showBadgeUnlock(ach.title);
    //   });
    //   showConfetti();
    // }

    // if (leveledUp) {
    //   showConfetti(5000);
    // }

    // Show XP float
    // Assuming we have a target element, perhaps pass it or find
    // For now, assume document.body
    // showFloatingXP(xpGained, document.body);

    return { xpGained, newlyUnlocked, leveledUp, newLevel: this.level };
  }

  calculateLevel(xp) {
    // Simple level system: level = floor(sqrt(xp / 100)) + 1, max 10
    return Math.min(Math.floor(Math.sqrt(xp / 100)) + 1, 10);
  }

  getProgressToNextLevel() {
    const nextLevel = this.level + 1;
    const xpNeeded = Math.pow(nextLevel - 1, 2) * 100;
    return { current: this.xp, needed: xpNeeded };
  }
}

export const achievements = new Achievements();

// For Prompt Master achievement, perhaps trigger on level up, but user said level up system, so maybe separate
// Add to ACHIEVEMENTS if needed, but for now, levels are separate.
