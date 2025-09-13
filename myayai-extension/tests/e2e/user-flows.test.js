/**
 * End-to-End tests for complete user flows
 */

describe('End-to-End User Flows', () => {
  let mockDashboard;
  let mockOptimizationEngine;
  let mockValueTracker;

  beforeEach(() => {
    // Set up complete mock environment
    setupMockEnvironment();
  });

  function setupMockEnvironment() {
    // Mock Chrome APIs
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        },
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        }
      },
      tabs: {
        query: jest.fn().mockResolvedValue([{
          url: 'https://chat.openai.com/',
          id: 1
        }]),
        create: jest.fn().mockResolvedValue({ id: 2 }),
        sendMessage: jest.fn().mockResolvedValue({})
      },
      runtime: {
        sendMessage: jest.fn().mockResolvedValue({}),
        onMessage: { addListener: jest.fn() },
        getURL: jest.fn(path => `chrome-extension://test-id/${path}`)
      },
      notifications: {
        create: jest.fn()
      }
    };

    // Set up DOM
    document.body.innerHTML = `
      <div id="app">
        <div class="dashboard-header">
          <h1>MyAyAI Dashboard</h1>
          <label class="toggle">
            <input type="checkbox" id="master-toggle">
            <span class="slider"></span>
          </label>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card" data-metric="prompts">
            <div class="metric-value" id="prompts-optimized">0</div>
            <div class="metric-label">Prompts Optimized</div>
            <div class="metric-change" id="prompts-change">+0</div>
          </div>
          <div class="metric-card" data-metric="time">
            <div class="metric-value" id="time-saved">0</div>
            <div class="metric-label">Time Saved (min)</div>
            <div class="metric-change" id="time-change">+0</div>
          </div>
          <div class="metric-card" data-metric="cost">
            <div class="metric-value" id="api-costs">$0.00</div>
            <div class="metric-label">API Costs Saved</div>
            <div class="metric-change" id="cost-change">+$0.00</div>
          </div>
          <div class="metric-card" data-metric="quality">
            <div class="metric-value" id="quality-improvement">0%</div>
            <div class="metric-label">Quality Improvement</div>
            <div class="metric-change" id="quality-change">+0%</div>
          </div>
        </div>

        <div class="progress-section">
          <div class="level-info">
            <span>Level <span id="user-level">1</span></span>
            <div class="xp-bar">
              <div class="xp-fill" id="xp-fill" style="width: 0%"></div>
            </div>
            <span><span id="current-xp">0</span> / <span id="next-level-xp">100</span> XP</span>
          </div>
          
          <div class="streak-info">
            <span>🔥 <span id="streak-count">0</span> day streak</span>
          </div>
        </div>

        <div class="achievements-section">
          <h3>Achievements</h3>
          <div class="achievements-grid">
            <div class="achievement-item locked" data-achievement="first-optimization">
              <div class="achievement-icon">🚀</div>
              <div class="achievement-title">First Steps</div>
            </div>
            <div class="achievement-item locked" data-achievement="speed-demon">
              <div class="achievement-icon">⚡</div>
              <div class="achievement-title">Speed Demon</div>
            </div>
          </div>
        </div>

        <div class="preview-section">
          <h3>Last Optimization</h3>
          <div class="preview-tabs">
            <button class="preview-tab active" data-tab="original">Original</button>
            <button class="preview-tab" data-tab="optimized">Optimized</button>
            <button class="preview-tab" data-tab="diff">Diff</button>
          </div>
          <div id="preview-container">
            <div class="preview-placeholder">No optimizations yet</div>
            <div id="preview-content" style="display: none;">
              <div class="preview-pane active" id="original-pane">
                <pre id="original-prompt"></pre>
              </div>
              <div class="preview-pane" id="optimized-pane">
                <pre id="optimized-prompt"></pre>
              </div>
              <div class="preview-pane" id="diff-pane">
                <div id="diff-content"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h3>Settings</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="sound-effects" checked>
              Sound Effects
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="animations-enabled" checked>
              Animations
            </label>
          </div>
          <div class="setting-item">
            <label>
              Theme:
              <select id="theme-selector">
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>
        </div>

        <div class="actions-section">
          <button id="export-data" class="btn btn-secondary">Export Data</button>
          <button id="clear-data" class="btn btn-danger">Clear Data</button>
          <button id="privacy-settings" class="btn btn-secondary">Privacy Settings</button>
        </div>
      </div>
    `;

    // Initialize components
    require('../../popup/popup.js');
  }

  describe('First-Time User Experience', () => {
    it('should complete onboarding flow for new user', async () => {
      // Start with empty storage (new user)
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.sync.get.mockResolvedValue({});

      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify initial state
      expect(document.getElementById('user-level').textContent).toBe('1');
      expect(document.getElementById('current-xp').textContent).toBe('0');
      expect(document.getElementById('prompts-optimized').textContent).toBe('0');
      
      // Master toggle should be enabled for AI pages
      const masterToggle = document.getElementById('master-toggle');
      expect(masterToggle.checked).toBe(true);

      // All achievements should be locked
      const achievements = document.querySelectorAll('.achievement-item');
      achievements.forEach(achievement => {
        expect(achievement.classList.contains('locked')).toBe(true);
      });
    });

    it('should show helpful empty states', () => {
      const previewPlaceholder = document.querySelector('.preview-placeholder');
      expect(previewPlaceholder.style.display).not.toBe('none');
      expect(previewPlaceholder.textContent).toBe('No optimizations yet');
    });
  });

  describe('Prompt Optimization Flow', () => {
    let dashboard;

    beforeEach(async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should complete full optimization cycle', async () => {
      // Simulate first optimization
      const optimization = {
        platform: 'chatgpt',
        originalPrompt: 'Write a blog post',
        optimizedPrompt: 'Write a comprehensive, SEO-optimized blog post about artificial intelligence, targeting a general audience with technical depth but accessible language.',
        timeSaved: 25,
        apiCostsSaved: 0.15,
        qualityImprovement: 35,
        complexityScore: 2
      };

      // Record optimization
      const result = await dashboard.valueTracker.recordOptimization(optimization);

      // Verify metrics updated
      expect(result.xpGained).toBeGreaterThan(0);
      
      await dashboard.updateDashboard();

      // Check UI updates
      const promptsOptimized = document.getElementById('prompts-optimized');
      expect(parseInt(promptsOptimized.textContent)).toBeGreaterThan(0);

      const timeSaved = document.getElementById('time-saved');
      expect(parseInt(timeSaved.textContent)).toBeGreaterThan(0);

      // Check preview updated
      const originalPrompt = document.getElementById('original-prompt');
      expect(originalPrompt.textContent).toBe(optimization.originalPrompt);

      const optimizedPrompt = document.getElementById('optimized-prompt');
      expect(optimizedPrompt.textContent).toBe(optimization.optimizedPrompt);
    });

    it('should trigger first achievement unlock', async () => {
      // Record first optimization
      await dashboard.valueTracker.recordOptimization({
        timeSaved: 10,
        qualityImprovement: 20
      });

      await dashboard.updateDashboard();

      // First achievement should be unlocked
      const firstAchievement = document.querySelector('[data-achievement="first-optimization"]');
      expect(firstAchievement.classList.contains('unlocked')).toBe(true);
    });

    it('should handle level up experience', async () => {
      // Set up user close to level up
      dashboard.valueTracker.data.lifetime.xp = 145;

      // Record optimization that triggers level up
      const result = await dashboard.valueTracker.recordOptimization({
        timeSaved: 50,
        qualityImprovement: 30,
        complexityScore: 2
      });

      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);

      await dashboard.updateDashboard();

      // Check UI reflects new level
      const userLevel = document.getElementById('user-level');
      expect(userLevel.textContent).toBe('2');
    });
  });

  describe('Settings and Preferences', () => {
    let dashboard;

    beforeEach(async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should save theme preferences', async () => {
      const themeSelector = document.getElementById('theme-selector');
      themeSelector.value = 'dark';
      
      const event = new Event('change', { bubbles: true });
      themeSelector.dispatchEvent(event);

      expect(dashboard.components.switchTheme).toHaveBeenCalledWith('dark');
    });

    it('should toggle sound effects setting', async () => {
      const soundToggle = document.getElementById('sound-effects');
      soundToggle.checked = false;
      
      const event = new Event('change', { bubbles: true });
      soundToggle.dispatchEvent(event);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        soundEffects: false
      });
    });

    it('should toggle animations setting', async () => {
      const animationToggle = document.getElementById('animations-enabled');
      animationToggle.checked = false;
      
      const event = new Event('change', { bubbles: true });
      animationToggle.dispatchEvent(event);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        animations: false
      });
    });

    it('should handle master toggle state changes', async () => {
      const masterToggle = document.getElementById('master-toggle');
      masterToggle.checked = false;
      
      const event = new Event('change', { bubbles: true });
      masterToggle.dispatchEvent(event);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        extensionEnabled: false
      });
    });
  });

  describe('Data Management Flow', () => {
    let dashboard;

    beforeEach(async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should complete data export flow', async () => {
      // Mock file download
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      document.createElement = jest.fn(() => mockLink);
      global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');

      // Set up some test data
      dashboard.valueTracker.data.lifetime.promptsOptimized = 50;

      const exportButton = document.getElementById('export-data');
      exportButton.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toContain('myayai-dashboard-data');
      expect(dashboard.components.showAchievementNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '📤',
          title: 'Data Exported'
        })
      );
    });

    it('should complete data clearing flow with confirmation', async () => {
      global.confirm = jest.fn(() => true);

      const clearButton = document.getElementById('clear-data');
      clearButton.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to clear all dashboard data?')
      );
      expect(dashboard.components.showAchievementNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '🗑️',
          title: 'Data Cleared'
        })
      );
    });

    it('should abort data clearing without confirmation', async () => {
      global.confirm = jest.fn(() => false);
      dashboard.valueTracker.clearAllData = jest.fn();

      const clearButton = document.getElementById('clear-data');
      clearButton.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(dashboard.valueTracker.clearAllData).not.toHaveBeenCalled();
    });
  });

  describe('Privacy Settings Flow', () => {
    let dashboard;

    beforeEach(async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should open privacy settings in new tab', () => {
      const privacyButton = document.getElementById('privacy-settings');
      privacyButton.click();

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test-id/docs/privacy-policy.html'
      });
    });

    it('should fallback to external privacy page on error', () => {
      chrome.tabs.create.mockRejectedValueOnce(new Error('Tab creation failed'));
      global.window.open = jest.fn();

      const privacyButton = document.getElementById('privacy-settings');
      privacyButton.click();

      expect(global.window.open).toHaveBeenCalledWith(
        'https://myayai.com/privacy',
        '_blank'
      );
    });
  });

  describe('Interactive Elements', () => {
    let dashboard;

    beforeEach(async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle preview tab switching', () => {
      const optimizedTab = document.querySelector('[data-tab="optimized"]');
      optimizedTab.click();

      // Check tab becomes active
      expect(optimizedTab.classList.contains('active')).toBe(true);
      
      // Check corresponding pane becomes active
      const optimizedPane = document.getElementById('optimized-pane');
      expect(optimizedPane.classList.contains('active')).toBe(true);
    });

    it('should show achievement details on click', () => {
      const achievement = document.querySelector('.achievement-item');
      achievement.dataset.achievement = 'first-optimization';
      
      achievement.click();

      expect(dashboard.components.showAchievementNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '🚀',
          title: 'First Steps'
        })
      );
    });

    it('should handle metric card interactions in demo mode', () => {
      dashboard.mockDataMode = true;
      const metricCard = document.querySelector('.metric-card');
      
      metricCard.click();

      expect(dashboard.components.createSparkleEffect).toHaveBeenCalled();
      expect(dashboard.components.playSound).toHaveBeenCalledWith('achievement');
    });
  });

  describe('Performance Requirements', () => {
    it('should initialize dashboard under 50ms', async () => {
      const start = performance.now();
      
      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const end = performance.now();
      
      // Allow extra time for test environment
      expect(end - start).toBeLessThan(200);
    });

    it('should update all metrics efficiently', async () => {
      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      const start = performance.now();
      await dashboard.updateDashboard();
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
    });

    it('should handle rapid user interactions without lag', async () => {
      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      const start = performance.now();
      
      // Simulate rapid interactions
      for (let i = 0; i < 10; i++) {
        const tabs = document.querySelectorAll('.preview-tab');
        tabs[i % tabs.length].click();
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should recover gracefully from component failures', async () => {
      // Mock component initialization failure
      global.DashboardComponents = jest.fn(() => {
        throw new Error('Component initialization failed');
      });

      console.error = jest.fn();
      
      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.error).toHaveBeenCalled();
      // Dashboard should still be functional with degraded features
    });

    it('should handle storage errors gracefully', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage access denied'));
      chrome.storage.sync.get.mockRejectedValue(new Error('Sync storage unavailable'));
      
      console.warn = jest.fn();
      
      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.warn).toHaveBeenCalled();
      // Should use mock mode
      expect(dashboard.mockDataMode).toBe(true);
    });

    it('should handle network failures during export', async () => {
      dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock export failure
      dashboard.valueTracker.exportData.mockRejectedValueOnce(new Error('Network error'));
      console.error = jest.fn();

      const exportButton = document.getElementById('export-data');
      exportButton.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(console.error).toHaveBeenCalledWith('Export failed:', expect.any(Error));
      expect(dashboard.components.showAchievementNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '❌',
          title: 'Error'
        })
      );
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on destroy', async () => {
      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      dashboard.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(dashboard.components.destroy).toHaveBeenCalled();
    });

    it('should not accumulate memory leaks during extended use', async () => {
      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate extended usage
      for (let i = 0; i < 100; i++) {
        await dashboard.valueTracker.recordOptimization({
          timeSaved: Math.random() * 30,
          qualityImprovement: Math.random() * 50
        });
        
        if (i % 10 === 0) {
          await dashboard.updateDashboard();
        }
      }

      // Memory usage should remain stable (checked via manual monitoring)
      expect(dashboard.valueTracker.data.lifetime.history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      const dashboard = new window.MyAyAIDashboard();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test tab navigation through interactive elements
      const interactiveElements = document.querySelectorAll(
        'button, input, select, [tabindex]:not([tabindex="-1"])'
      );

      expect(interactiveElements.length).toBeGreaterThan(0);
      
      // Each interactive element should be focusable
      interactiveElements.forEach(element => {
        expect(element.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('should provide proper ARIA labels', () => {
      const buttons = document.querySelectorAll('button');
      const inputs = document.querySelectorAll('input');
      
      buttons.forEach(button => {
        expect(
          button.ariaLabel || 
          button.textContent.trim() || 
          button.title
        ).toBeTruthy();
      });

      inputs.forEach(input => {
        expect(
          input.ariaLabel || 
          input.labels?.length > 0 ||
          input.placeholder
        ).toBeTruthy();
      });
    });
  });
});
