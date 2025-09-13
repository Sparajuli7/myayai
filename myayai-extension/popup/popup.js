/**
 * MyAyAI Popup Dashboard - Main Interactive Controller
 * Integrates all components and handles user interactions
 */

class MyAyAIDashboard {
    constructor() {
        this.valueTracker = null;
        this.components = null;
        this.currentTab = null;
        this.isAIPage = false;
        this.updateInterval = null;
        this.mockDataMode = false; // For demo purposes
        
        this.aiDomains = [
            'chat.openai.com',
            'claude.ai', 
            'www.perplexity.ai',
            'gemini.google.com',
            'copilot.microsoft.com',
            'poe.com',
            'character.ai'
        ];
        
        this.init();
    }

    async init() {
        try {
            // Initialize core components
            this.valueTracker = new ValueTracker();
            this.components = new DashboardComponents();
            
            // Wait for value tracker to load data
            await this.valueTracker.init();
            
            // Get current tab info
            await this.getCurrentTab();
            
            // Setup UI
            this.initializeUI();
            this.attachEventListeners();
            this.startAutoUpdate();
            
            // Initial data load and animations
            await this.updateDashboard();
            
            console.log('MyAyAI Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    async getCurrentTab() {
        try {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                this.currentTab = tab;
                this.isAIPage = this.aiDomains.some(domain => 
                    tab?.url?.includes(domain)
                );
            } else {
                // Mock for development
                this.mockDataMode = true;
                this.isAIPage = true;
            }
        } catch (error) {
            console.warn('Could not get current tab, using mock mode:', error);
            this.mockDataMode = true;
            this.isAIPage = true;
        }
    }

    initializeUI() {
        // Apply saved theme
        this.loadTheme();
        
        // Initialize component effects
        this.components.initializeCardEffects();
        
        // Set initial toggle state
        const masterToggle = document.getElementById('master-toggle');
        if (masterToggle) {
            masterToggle.checked = this.isAIPage;
        }
    }

    async loadTheme() {
        try {
            const settings = await chrome.storage.sync.get(['selectedTheme']);
            const theme = settings.selectedTheme || 'auto';
            this.components.switchTheme(theme);
            
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                themeSelector.value = theme;
            }
        } catch (error) {
            console.warn('Could not load theme:', error);
        }
    }

    attachEventListeners() {
        // Master toggle
        const masterToggle = document.getElementById('master-toggle');
        if (masterToggle) {
            masterToggle.addEventListener('change', (e) => {
                this.handleMasterToggle(e.target.checked);
            });
        }

        // Theme selector
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => {
                this.components.switchTheme(e.target.value);
            });
        }

        // Sound effects toggle
        const soundEffects = document.getElementById('sound-effects');
        if (soundEffects) {
            soundEffects.addEventListener('change', (e) => {
                this.components.soundEffectsEnabled = e.target.checked;
                chrome.storage.sync.set({ soundEffects: e.target.checked });
            });
        }

        // Animations toggle
        const animations = document.getElementById('animations-enabled');
        if (animations) {
            animations.addEventListener('change', (e) => {
                this.components.animationsEnabled = e.target.checked;
                chrome.storage.sync.set({ animations: e.target.checked });
            });
        }

        // Preview tabs
        const previewTabs = document.querySelectorAll('.preview-tab');
        previewTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchPreviewTab(e.target.dataset.tab);
            });
        });

        // Action buttons
        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clear-data')?.addEventListener('click', () => {
            this.clearData();
        });

        document.getElementById('privacy-settings')?.addEventListener('click', () => {
            this.openPrivacySettings();
        });

        // Metric cards (for demo interactions)
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('click', () => {
                if (this.mockDataMode) {
                    this.simulateOptimization();
                }
            });
        });

        // Achievement items
        document.querySelectorAll('.achievement-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.showAchievementDetails(e.currentTarget);
            });
        });
    }

    async updateDashboard() {
        await this.updateMetrics();
        await this.updateProgress();
        await this.updateStats();
        await this.updateLastOptimization();
    }

    async updateMetrics() {
        const dailyMetrics = this.valueTracker.getDailyMetrics();
        
        // Animate counter updates
        this.components.animateCounter(
            document.getElementById('prompts-optimized'),
            0, 
            dailyMetrics.promptsOptimized,
            800
        );

        this.components.animateCounter(
            document.getElementById('time-saved'),
            0,
            dailyMetrics.timeSaved,
            1000
        );

        this.components.animateCurrency(
            document.getElementById('api-costs'),
            0,
            dailyMetrics.apiCostsSaved,
            1200
        );

        this.components.animatePercentage(
            document.getElementById('quality-improvement'),
            0,
            Math.round(dailyMetrics.qualityImprovement),
            1000
        );

        // Update change indicators
        document.getElementById('prompts-change').textContent = dailyMetrics.promptsOptimized;
        document.getElementById('time-change').textContent = dailyMetrics.timeSaved;
        document.getElementById('cost-change').textContent = dailyMetrics.apiCostsSaved.toFixed(2);
        document.getElementById('quality-change').textContent = Math.round(dailyMetrics.qualityImprovement);
    }

    async updateProgress() {
        const levelData = this.valueTracker.getLevelData();
        const streakData = this.valueTracker.getStreakData();
        const achievements = this.valueTracker.getAchievements();

        // Update level
        document.getElementById('user-level').textContent = levelData.level;

        // Update XP bar
        document.getElementById('current-xp').textContent = levelData.current.toLocaleString();
        document.getElementById('next-level-xp').textContent = levelData.required.toLocaleString();
        
        const xpFill = document.getElementById('xp-fill');
        this.components.animateXPBar(xpFill, levelData.percentage);

        // Update streak
        document.getElementById('streak-count').textContent = streakData.current;

        // Update achievements
        this.updateAchievements(achievements);
    }

    updateAchievements(achievements) {
        const achievementItems = document.querySelectorAll('.achievement-item');
        
        achievements.slice(0, achievementItems.length).forEach((achievement, index) => {
            const item = achievementItems[index];
            const icon = item.querySelector('.achievement-icon');
            
            if (icon) {
                icon.textContent = achievement.icon;
            }
            
            item.title = achievement.title;
            item.dataset.achievement = achievement.id;
            
            if (achievement.unlocked) {
                item.classList.add('unlocked');
                item.classList.remove('locked');
            } else {
                item.classList.add('locked');
                item.classList.remove('unlocked');
            }
        });
    }

    async updateStats() {
        const lifetimeMetrics = this.valueTracker.getLifetimeMetrics();
        const sparklineData = this.valueTracker.getSparklineData();

        // Update platform usage
        const platforms = ['chatgpt', 'claude', 'gemini', 'others'];
        const platformBars = document.querySelectorAll('.platform-bar');
        
        platforms.forEach((platform, index) => {
            const bar = platformBars[index];
            if (bar) {
                const fill = bar.querySelector('.platform-fill');
                const percent = bar.querySelector('.platform-percent');
                const percentage = lifetimeMetrics.platformUsage[platform] || 0;
                
                if (fill && percent) {
                    this.components.animateProgressBar(fill, percentage, 1000 + index * 200);
                    percent.textContent = percentage + '%';
                }
            }
        });

        // Draw sparklines
        this.drawSparklines(sparklineData);
    }

    drawSparklines(data) {
        const dailyCanvas = document.getElementById('daily-sparkline');
        const qualityCanvas = document.getElementById('quality-sparkline');

        if (dailyCanvas && data.daily.length > 0) {
            this.components.drawSparkline(dailyCanvas, data.daily, {
                strokeColor: '#4F46E5',
                fillColor: 'rgba(79, 70, 229, 0.2)'
            });
        }

        if (qualityCanvas && data.quality.length > 0) {
            this.components.drawSparkline(qualityCanvas, data.quality, {
                strokeColor: '#10B981',
                fillColor: 'rgba(16, 185, 129, 0.2)'
            });
        }
    }

    async updateLastOptimization() {
        const lastOpt = this.valueTracker.getLastOptimization();
        const previewContainer = document.getElementById('preview-container');
        const previewContent = document.getElementById('preview-content');

        if (lastOpt && previewContainer && previewContent) {
            // Show preview content
            previewContainer.querySelector('.preview-placeholder').style.display = 'none';
            previewContent.style.display = 'block';

            // Update preview panes
            document.getElementById('original-prompt').textContent = lastOpt.originalPrompt;
            document.getElementById('optimized-prompt').textContent = lastOpt.optimizedPrompt;

            // Generate diff view
            this.generateDiffView(lastOpt.originalPrompt, lastOpt.optimizedPrompt);
        }
    }

    generateDiffView(original, optimized) {
        const diffContainer = document.getElementById('diff-content');
        if (!diffContainer) return;

        // Simple diff highlighting (for demo purposes)
        const originalWords = original.split(' ');
        const optimizedWords = optimized.split(' ');
        
        let diffHTML = '';
        let i = 0, j = 0;
        
        while (i < originalWords.length || j < optimizedWords.length) {
            const originalWord = originalWords[i];
            const optimizedWord = optimizedWords[j];
            
            if (originalWord === optimizedWord) {
                diffHTML += originalWord + ' ';
                i++;
                j++;
            } else if (i < originalWords.length && (j >= optimizedWords.length || !optimizedWords.includes(originalWord))) {
                diffHTML += `<span class="diff-removed">${originalWord}</span> `;
                i++;
            } else if (j < optimizedWords.length) {
                diffHTML += `<span class="diff-added">${optimizedWord}</span> `;
                j++;
            }
        }
        
        diffContainer.innerHTML = diffHTML;
    }

    switchPreviewTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.preview-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update panes
        document.querySelectorAll('.preview-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-pane`).classList.add('active');
    }

    async handleMasterToggle(enabled) {
        // In a real extension, this would enable/disable the content script
        console.log('Master toggle:', enabled ? 'enabled' : 'disabled');
        
        try {
            await chrome.storage.sync.set({ extensionEnabled: enabled });
        } catch (error) {
            console.warn('Could not save toggle state:', error);
        }
    }

    async simulateOptimization() {
        if (!this.mockDataMode) return;

        // Mock optimization data
        const mockOptimization = {
            platform: 'chatgpt',
            originalPrompt: 'Write a blog post about AI',
            optimizedPrompt: 'Write a comprehensive, SEO-optimized blog post about the current state and future prospects of artificial intelligence, targeting a general audience with technical depth but accessible language.',
            timeSaved: Math.floor(Math.random() * 15) + 5,
            qualityImprovement: Math.floor(Math.random() * 30) + 70,
            complexityScore: Math.floor(Math.random() * 3) + 2
        };

        console.log('Simulating optimization:', mockOptimization);

        // Record the optimization
        const result = await this.valueTracker.recordOptimization(mockOptimization);

        // Update dashboard
        await this.updateDashboard();

        // Show success feedback
        this.components.createSparkleEffect(document.querySelector('.metric-card'));
        
        // Play sound
        this.components.playSound('achievement');

        // Check for celebrations
        if (result.levelUp) {
            setTimeout(() => {
                this.components.celebrateLevelUp(result.newLevel);
            }, 500);
        }

        if (result.newAchievements.length > 0) {
            result.newAchievements.forEach((achievement, index) => {
                setTimeout(() => {
                    this.components.celebrateAchievement(achievement);
                }, 1000 + index * 2000);
            });
        }
    }

    showAchievementDetails(achievementElement) {
        const achievementId = achievementElement.dataset.achievement;
        const achievements = this.valueTracker.getAchievements();
        const achievement = achievements.find(a => a.id === achievementId);
        
        if (achievement) {
            // Show tooltip or modal with achievement details
            console.log('Achievement details:', achievement);
            
            // Simple implementation: show as notification
            this.components.showAchievementNotification({
                icon: achievement.icon,
                title: achievement.title,
                description: achievement.unlocked 
                    ? achievement.description 
                    : `🔒 ${achievement.description}`
            });
        }
    }

    async exportData() {
        try {
            const data = await this.valueTracker.exportData();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `myayai-dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.components.showAchievementNotification({
                icon: '📤',
                title: 'Data Exported',
                description: 'Your dashboard data has been exported successfully'
            });
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export data');
        }
    }

    async clearData() {
        if (!confirm('Are you sure you want to clear all dashboard data? This action cannot be undone.')) {
            return;
        }
        
        try {
            await this.valueTracker.clearAllData();
            await this.updateDashboard();
            
            this.components.showAchievementNotification({
                icon: '🗑️',
                title: 'Data Cleared',
                description: 'All dashboard data has been cleared'
            });
            
        } catch (error) {
            console.error('Clear data failed:', error);
            this.showError('Failed to clear data');
        }
    }

    openPrivacySettings() {
        try {
            chrome.tabs.create({
                url: chrome.runtime.getURL('docs/privacy-policy.html')
            });
        } catch (error) {
            // Fallback for development
            window.open('https://myayai.com/privacy', '_blank');
        }
    }

    startAutoUpdate() {
        // Update dashboard every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateDashboard();
        }, 30000);
    }

    showError(message) {
        this.components.showAchievementNotification({
            icon: '❌',
            title: 'Error',
            description: message
        });
    }

    // Clean up
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.components) {
            this.components.destroy();
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.myayaiDashboard = new MyAyAIDashboard();
});

// Handle extension messages
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'optimizationCompleted') {
            // Handle optimization completed from content script
            if (window.myayaiDashboard && window.myayaiDashboard.valueTracker) {
                window.myayaiDashboard.valueTracker.recordOptimization(request.data)
                    .then(() => {
                        window.myayaiDashboard.updateDashboard();
                        sendResponse({ success: true });
                    })
                    .catch(error => {
                        console.error('Failed to record optimization:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true; // Keep message channel open for async response
            }
        }
        
        if (request.action === 'updateDashboard') {
            // Force dashboard update
            if (window.myayaiDashboard) {
                window.myayaiDashboard.updateDashboard();
            }
        }
    });
}

// Cleanup on window unload
window.addEventListener('beforeunload', () => {
    if (window.myayaiDashboard) {
        window.myayaiDashboard.destroy();
    }
});