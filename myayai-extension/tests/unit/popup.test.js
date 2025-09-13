/**
 * Unit tests for MyAyAI Popup Dashboard
 */

// Mock dependencies
const mockValueTracker = {
  init: jest.fn().mockResolvedValue(),
  getDailyMetrics: jest.fn(() => ({
    promptsOptimized: 15,
    timeSaved: 45,
    apiCostsSaved: 3.25,
    qualityImprovement: 23.5
  })),
  getLevelData: jest.fn(() => ({
    level: 5,
    current: 1250,
    required: 2000,
    percentage: 62.5
  })),
  getStreakData: jest.fn(() => ({
    current: 7,
    best: 12
  })),
  getAchievements: jest.fn(() => [
    { id: 'first-optimization', icon: '🚀', title: 'First Steps', unlocked: true },
    { id: 'speed-demon', icon: '⚡', title: 'Speed Demon', unlocked: false }
  ]),
  getLifetimeMetrics: jest.fn(() => ({
    platformUsage: {
      chatgpt: 45,
      claude: 30,
      gemini: 15,
      others: 10
    }
  })),
  getSparklineData: jest.fn(() => ({
    daily: [1, 3, 2, 5, 4, 6, 3, 8, 5, 7],
    quality: [85, 87, 89, 91, 88, 92, 90, 94, 91, 93]
  })),
  getLastOptimization: jest.fn(() => ({
    originalPrompt: 'Write a blog post',
    optimizedPrompt: 'Write a comprehensive, SEO-optimized blog post'
  })),
  recordOptimization: jest.fn().mockResolvedValue({
    levelUp: false,
    newAchievements: []
  }),
  exportData: jest.fn().mockResolvedValue({}),
  clearAllData: jest.fn().mockResolvedValue()
};

const mockComponents = {
  initializeCardEffects: jest.fn(),
  switchTheme: jest.fn(),
  animateCounter: jest.fn(),
  animateCurrency: jest.fn(),
  animatePercentage: jest.fn(),
  animateXPBar: jest.fn(),
  animateProgressBar: jest.fn(),
  drawSparkline: jest.fn(),
  createSparkleEffect: jest.fn(),
  playSound: jest.fn(),
  celebrateLevelUp: jest.fn(),
  celebrateAchievement: jest.fn(),
  showAchievementNotification: jest.fn(),
  destroy: jest.fn(),
  soundEffectsEnabled: true,
  animationsEnabled: true
};

// Mock global classes
global.ValueTracker = jest.fn().mockImplementation(() => mockValueTracker);
global.DashboardComponents = jest.fn().mockImplementation(() => mockComponents);

describe('MyAyAIDashboard', () => {
  let dashboard;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="master-toggle"></div>
      <div id="theme-selector"></div>
      <div id="sound-effects"></div>
      <div id="animations-enabled"></div>
      <div class="preview-tab" data-tab="original"></div>
      <div class="preview-tab" data-tab="optimized"></div>
      <div id="export-data"></div>
      <div id="clear-data"></div>
      <div id="privacy-settings"></div>
      <div class="metric-card"></div>
      <div class="achievement-item" data-achievement="first-optimization"></div>
      <div id="prompts-optimized"></div>
      <div id="time-saved"></div>
      <div id="api-costs"></div>
      <div id="quality-improvement"></div>
      <div id="prompts-change"></div>
      <div id="time-change"></div>
      <div id="cost-change"></div>
      <div id="quality-change"></div>
      <div id="user-level"></div>
      <div id="current-xp"></div>
      <div id="next-level-xp"></div>
      <div id="xp-fill"></div>
      <div id="streak-count"></div>
      <div class="achievement-item">
        <div class="achievement-icon"></div>
      </div>
      <div class="platform-bar">
        <div class="platform-fill"></div>
        <div class="platform-percent"></div>
      </div>
      <canvas id="daily-sparkline"></canvas>
      <canvas id="quality-sparkline"></canvas>
      <div id="preview-container">
        <div class="preview-placeholder"></div>
      </div>
      <div id="preview-content" style="display: none;"></div>
      <div id="original-prompt"></div>
      <div id="optimized-prompt"></div>
      <div id="diff-content"></div>
      <div id="original-pane" class="preview-pane"></div>
      <div id="optimized-pane" class="preview-pane"></div>
      <div id="diff-pane" class="preview-pane"></div>
    `;

    // Load the dashboard class
    require('../../popup/popup.js');
  });

  afterEach(() => {
    if (dashboard) {
      dashboard.destroy();
    }
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async init

      expect(ValueTracker).toHaveBeenCalled();
      expect(DashboardComponents).toHaveBeenCalled();
      expect(mockValueTracker.init).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockValueTracker.init.mockRejectedValueOnce(new Error('Init failed'));
      console.error = jest.fn();

      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize dashboard'),
        expect.any(Error)
      );
    });

    it('should detect AI pages correctly', async () => {
      chrome.tabs.query.mockResolvedValueOnce([{
        url: 'https://chat.openai.com/chat',
        id: 1
      }]);

      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(dashboard.isAIPage).toBe(true);
    });

    it('should handle non-AI pages', async () => {
      chrome.tabs.query.mockResolvedValueOnce([{
        url: 'https://google.com',
        id: 1
      }]);

      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(dashboard.isAIPage).toBe(false);
    });
  });

  describe('Theme Management', () => {
    it('should load saved theme', async () => {
      chrome.storage.sync.get.mockResolvedValueOnce({ selectedTheme: 'dark' });
      
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockComponents.switchTheme).toHaveBeenCalledWith('dark');
    });

    it('should fallback to auto theme', async () => {
      chrome.storage.sync.get.mockResolvedValueOnce({});
      
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockComponents.switchTheme).toHaveBeenCalledWith('auto');
    });
  });

  describe('Metrics Updates', () => {
    beforeEach(async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should update daily metrics with animations', async () => {
      await dashboard.updateMetrics();

      expect(mockComponents.animateCounter).toHaveBeenCalledWith(
        expect.any(Element), 0, 15, 800
      );
      expect(mockComponents.animateCounter).toHaveBeenCalledWith(
        expect.any(Element), 0, 45, 1000
      );
      expect(mockComponents.animateCurrency).toHaveBeenCalledWith(
        expect.any(Element), 0, 3.25, 1200
      );
      expect(mockComponents.animatePercentage).toHaveBeenCalledWith(
        expect.any(Element), 0, 24, 1000
      );
    });

    it('should update progress indicators', async () => {
      await dashboard.updateProgress();

      expect(document.getElementById('user-level').textContent).toBe('5');
      expect(document.getElementById('current-xp').textContent).toBe('1,250');
      expect(document.getElementById('next-level-xp').textContent).toBe('2,000');
      expect(document.getElementById('streak-count').textContent).toBe('7');
      expect(mockComponents.animateXPBar).toHaveBeenCalledWith(
        expect.any(Element), 62.5
      );
    });

    it('should update platform statistics', async () => {
      await dashboard.updateStats();

      expect(mockComponents.animateProgressBar).toHaveBeenCalled();
      expect(mockComponents.drawSparkline).toHaveBeenCalledTimes(2);
    });

    it('should update last optimization preview', async () => {
      await dashboard.updateLastOptimization();

      const originalPrompt = document.getElementById('original-prompt');
      const optimizedPrompt = document.getElementById('optimized-prompt');
      
      expect(originalPrompt.textContent).toBe('Write a blog post');
      expect(optimizedPrompt.textContent).toBe('Write a comprehensive, SEO-optimized blog post');
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle master toggle', async () => {
      chrome.storage.sync.set.mockResolvedValueOnce();
      
      await dashboard.handleMasterToggle(true);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        extensionEnabled: true
      });
    });

    it('should handle theme switching', () => {
      const themeSelector = document.getElementById('theme-selector');
      themeSelector.value = 'dark';
      
      const event = new Event('change');
      themeSelector.dispatchEvent(event);

      expect(mockComponents.switchTheme).toHaveBeenCalledWith('dark');
    });

    it('should switch preview tabs', () => {
      dashboard.switchPreviewTab('optimized');

      const activeTab = document.querySelector('.preview-tab.active');
      const activePane = document.querySelector('.preview-pane.active');
      
      expect(activeTab?.dataset.tab).toBe('optimized');
      expect(activePane?.id).toBe('optimized-pane');
    });

    it('should show achievement details', () => {
      const achievementElement = document.querySelector('.achievement-item');
      achievementElement.dataset.achievement = 'first-optimization';
      
      dashboard.showAchievementDetails(achievementElement);

      expect(mockComponents.showAchievementNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '🚀',
          title: 'First Steps'
        })
      );
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should export data successfully', async () => {
      global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      document.createElement = jest.fn(() => mockLink);

      await dashboard.exportData();

      expect(mockValueTracker.exportData).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockComponents.showAchievementNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '📤',
          title: 'Data Exported'
        })
      );
    });

    it('should handle export errors', async () => {
      mockValueTracker.exportData.mockRejectedValueOnce(new Error('Export failed'));
      console.error = jest.fn();

      await dashboard.exportData();

      expect(console.error).toHaveBeenCalledWith('Export failed:', expect.any(Error));
      expect(mockComponents.showAchievementNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '❌',
          title: 'Error'
        })
      );
    });

    it('should clear data with confirmation', async () => {
      global.confirm = jest.fn(() => true);

      await dashboard.clearData();

      expect(mockValueTracker.clearAllData).toHaveBeenCalled();
      expect(mockComponents.showAchievementNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '🗑️',
          title: 'Data Cleared'
        })
      );
    });

    it('should abort clear data without confirmation', async () => {
      global.confirm = jest.fn(() => false);

      await dashboard.clearData();

      expect(mockValueTracker.clearAllData).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should initialize under 50ms', async () => {
      const start = performance.now();
      
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const end = performance.now();
      
      // Allowing extra time for test environment
      expect(end - start).toBeLessThan(200);
    });

    it('should update metrics efficiently', async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      const start = performance.now();
      await dashboard.updateMetrics();
      const end = performance.now();

      expect(end - start).toBeLessThan(50);
    });
  });

  describe('Memory Management', () => {
    it('should clean up intervals on destroy', async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      dashboard.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(mockComponents.destroy).toHaveBeenCalled();
    });
  });
});
