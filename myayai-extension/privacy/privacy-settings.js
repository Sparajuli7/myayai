// MyAyAI Privacy Settings Manager
// Centralized privacy preference management with live updates

class PrivacySettings {
    constructor() {
        this.settings = {
            version: '1.0.0',
            lastUpdated: null,
            consentGiven: false,
            
            // Granular privacy controls
            dataCollection: {
                essential: true,      // Cannot be disabled
                analytics: false,
                storage: false,
                improvements: false
            },
            
            // Data retention preferences
            dataRetention: {
                promptHistory: 30,    // days
                usageAnalytics: 90,   // days
                userSettings: 365     // days
            },
            
            // Privacy features
            features: {
                autoDeleteExpiredData: true,
                minimizeDataCollection: false,
                anonymizeAnalytics: true,
                exportReminder: true  // Remind users they can export data
            },
            
            // Compliance settings
            compliance: {
                gdprApplies: false,
                ccpaApplies: false,
                pipedaApplies: false,
                region: 'unknown'
            },
            
            // Contact and notification preferences
            notifications: {
                privacyUpdates: true,
                dataExportReady: true,
                retentionReminders: true
            }
        };
        
        this.listeners = [];
        this.init();
    }

    async init() {
        try {
            await this.loadSettings();
            await this.detectComplianceRegion();
            this.setupAutoCleanup();
            this.startPeriodicChecks();
            
            console.log('Privacy Settings Manager initialized');
        } catch (error) {
            console.error('Privacy Settings initialization failed:', error);
        }
    }

    async loadSettings() {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                console.log('Chrome storage not available, using defaults');
                return;
            }

            const data = await chrome.storage.local.get(['privacySettings']);
            if (data.privacySettings) {
                // Merge with defaults to handle new settings
                this.settings = this.mergeSettings(this.settings, data.privacySettings);
            }
        } catch (error) {
            console.error('Failed to load privacy settings:', error);
        }
    }

    mergeSettings(defaults, stored) {
        const merged = JSON.parse(JSON.stringify(defaults));
        
        const deepMerge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };
        
        deepMerge(merged, stored);
        return merged;
    }

    async detectComplianceRegion() {
        try {
            const region = await this.detectUserRegion();
            this.settings.compliance.region = region;
            
            // Set compliance flags
            this.settings.compliance.gdprApplies = region === 'EU';
            this.settings.compliance.ccpaApplies = region === 'CA' || region === 'US-CA';
            this.settings.compliance.pipedaApplies = region === 'CA';
            
            await this.saveSettings();
            
        } catch (error) {
            console.error('Region detection failed:', error);
        }
    }

    async detectUserRegion() {
        // Multiple detection methods
        const methods = [
            () => this.detectByTimezone(),
            () => this.detectByLanguage(),
            () => this.detectByStoredPreference()
        ];
        
        for (const method of methods) {
            try {
                const region = await method();
                if (region) return region;
            } catch (error) {
                console.warn('Region detection method failed:', error);
            }
        }
        
        return 'US'; // Default fallback
    }

    detectByTimezone() {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        if (timezone.includes('Europe/')) return 'EU';
        if (timezone.includes('America/Los_Angeles') || timezone.includes('America/Tijuana')) return 'CA';
        if (timezone.includes('America/')) return 'US';
        
        return null;
    }

    detectByLanguage() {
        const language = navigator.language || navigator.languages[0];
        const euLanguages = ['en-GB', 'de', 'fr', 'es-ES', 'it', 'nl', 'pl', 'pt-PT'];
        
        if (euLanguages.includes(language)) return 'EU';
        if (language === 'en-CA' || language === 'fr-CA') return 'CA';
        
        return null;
    }

    async detectByStoredPreference() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const data = await chrome.storage.sync.get(['userRegion']);
                return data.userRegion || null;
            }
        } catch (error) {
            console.error('Failed to get stored region:', error);
        }
        return null;
    }

    // Public API Methods

    /**
     * Update privacy settings with validation
     */
    async updateSettings(newSettings) {
        try {
            // Validate settings
            const validated = this.validateSettings(newSettings);
            
            // Merge with existing settings
            this.settings = this.mergeSettings(this.settings, validated);
            this.settings.lastUpdated = Date.now();
            
            // Save to storage
            await this.saveSettings();
            
            // Notify listeners
            this.notifyListeners('settingsUpdated', this.settings);
            
            // Apply settings immediately
            await this.applySettings();
            
            return true;
            
        } catch (error) {
            console.error('Failed to update privacy settings:', error);
            return false;
        }
    }

    validateSettings(settings) {
        const validated = JSON.parse(JSON.stringify(settings));
        
        // Ensure essential data collection cannot be disabled
        if (validated.dataCollection) {
            validated.dataCollection.essential = true;
        }
        
        // Validate retention periods (minimum 1 day, maximum 7 years)
        if (validated.dataRetention) {
            Object.keys(validated.dataRetention).forEach(key => {
                const days = validated.dataRetention[key];
                if (typeof days === 'number') {
                    validated.dataRetention[key] = Math.max(1, Math.min(days, 2555)); // 7 years max
                }
            });
        }
        
        return validated;
    }

    async applySettings() {
        try {
            // Apply data collection settings
            await this.applyDataCollectionSettings();
            
            // Apply retention settings
            if (this.settings.features.autoDeleteExpiredData) {
                await this.cleanupExpiredData();
            }
            
            // Apply privacy features
            await this.applyPrivacyFeatures();
            
        } catch (error) {
            console.error('Failed to apply privacy settings:', error);
        }
    }

    async applyDataCollectionSettings() {
        const { dataCollection } = this.settings;
        
        // Send settings to background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'updatePrivacySettings',
                settings: {
                    analytics: dataCollection.analytics,
                    storage: dataCollection.storage,
                    improvements: dataCollection.improvements
                }
            });
        }
        
        // Update global flags
        window.MYAYAI_ANALYTICS_ENABLED = dataCollection.analytics;
        window.MYAYAI_STORAGE_ENABLED = dataCollection.storage;
        window.MYAYAI_IMPROVEMENTS_ENABLED = dataCollection.improvements;
    }

    async applyPrivacyFeatures() {
        const { features } = this.settings;
        
        // Configure analytics anonymization
        if (features.anonymizeAnalytics) {
            window.MYAYAI_ANONYMIZE_ANALYTICS = true;
        }
        
        // Configure data minimization
        if (features.minimizeDataCollection) {
            window.MYAYAI_MINIMIZE_DATA = true;
        }
    }

    /**
     * Get current privacy settings
     */
    getSettings() {
        return JSON.parse(JSON.stringify(this.settings));
    }

    /**
     * Get privacy dashboard data
     */
    async getPrivacyDashboardData() {
        try {
            const data = {
                settings: this.getSettings(),
                dataStats: await this.getDataStatistics(),
                complianceStatus: this.getComplianceStatus(),
                recentActivity: await this.getRecentPrivacyActivity(),
                recommendations: this.getPrivacyRecommendations()
            };
            
            return data;
            
        } catch (error) {
            console.error('Failed to get privacy dashboard data:', error);
            return null;
        }
    }

    async getDataStatistics() {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                return { totalItems: 0, totalSize: 0, categories: {} };
            }

            const [syncData, localData] = await Promise.all([
                chrome.storage.sync.get(),
                chrome.storage.local.get()
            ]);
            
            const syncSize = JSON.stringify(syncData).length;
            const localSize = JSON.stringify(localData).length;
            
            return {
                totalItems: Object.keys(syncData).length + Object.keys(localData).length,
                totalSize: syncSize + localSize,
                categories: {
                    settings: Object.keys(syncData).length,
                    temporary: Object.keys(localData).length
                },
                breakdown: {
                    sync: { items: Object.keys(syncData).length, size: syncSize },
                    local: { items: Object.keys(localData).length, size: localSize }
                }
            };
            
        } catch (error) {
            console.error('Failed to get data statistics:', error);
            return { totalItems: 0, totalSize: 0, categories: {} };
        }
    }

    getComplianceStatus() {
        const { compliance } = this.settings;
        
        return {
            region: compliance.region,
            applicableLaws: [
                ...(compliance.gdprApplies ? ['GDPR'] : []),
                ...(compliance.ccpaApplies ? ['CCPA'] : []),
                ...(compliance.pipedaApplies ? ['PIPEDA'] : [])
            ],
            consentRequired: compliance.gdprApplies,
            rightToDelete: true,
            rightToExport: true,
            rightToOptOut: compliance.ccpaApplies
        };
    }

    async getRecentPrivacyActivity() {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                return [];
            }

            const data = await chrome.storage.local.get(['privacyActivity']);
            return data.privacyActivity || [];
            
        } catch (error) {
            console.error('Failed to get recent privacy activity:', error);
            return [];
        }
    }

    getPrivacyRecommendations() {
        const recommendations = [];
        const { dataCollection, features, dataRetention } = this.settings;
        
        // Recommend enabling auto-cleanup
        if (!features.autoDeleteExpiredData) {
            recommendations.push({
                type: 'feature',
                priority: 'medium',
                title: 'Enable Auto Data Cleanup',
                description: 'Automatically delete expired data to minimize storage',
                action: 'enable_auto_cleanup'
            });
        }
        
        // Recommend shorter retention for analytics
        if (dataRetention.usageAnalytics > 90) {
            recommendations.push({
                type: 'retention',
                priority: 'low',
                title: 'Reduce Analytics Retention',
                description: 'Consider shorter retention period for usage analytics',
                action: 'reduce_analytics_retention'
            });
        }
        
        // Recommend data minimization if lots of data collection enabled
        const enabledCollections = Object.values(dataCollection).filter(Boolean).length;
        if (enabledCollections > 2 && !features.minimizeDataCollection) {
            recommendations.push({
                type: 'privacy',
                priority: 'medium',
                title: 'Enable Data Minimization',
                description: 'Reduce data collection to only what is necessary',
                action: 'enable_minimization'
            });
        }
        
        return recommendations;
    }

    /**
     * Data cleanup and maintenance
     */
    setupAutoCleanup() {
        if (this.settings.features.autoDeleteExpiredData) {
            // Run cleanup every 24 hours
            setInterval(() => {
                this.cleanupExpiredData();
            }, 24 * 60 * 60 * 1000);
            
            // Run initial cleanup after 5 minutes
            setTimeout(() => {
                this.cleanupExpiredData();
            }, 5 * 60 * 1000);
        }
    }

    async cleanupExpiredData() {
        try {
            console.log('🧹 Starting automatic data cleanup...');
            
            if (typeof chrome === 'undefined' || !chrome.storage) return;
            
            const now = Date.now();
            const { dataRetention } = this.settings;
            
            const localData = await chrome.storage.local.get();
            const updatedData = { ...localData };
            let cleanedItems = 0;
            
            // Clean up prompt history
            if (updatedData.promptHistory) {
                const retentionMs = dataRetention.promptHistory * 24 * 60 * 60 * 1000;
                updatedData.promptHistory = updatedData.promptHistory.filter(item => {
                    const itemAge = now - (item.timestamp || 0);
                    if (itemAge > retentionMs) {
                        cleanedItems++;
                        return false;
                    }
                    return true;
                });
            }
            
            // Clean up analytics data
            if (updatedData.analyticsEvents) {
                const retentionMs = dataRetention.usageAnalytics * 24 * 60 * 60 * 1000;
                updatedData.analyticsEvents = updatedData.analyticsEvents.filter(event => {
                    const eventAge = now - (event.timestamp || 0);
                    if (eventAge > retentionMs) {
                        cleanedItems++;
                        return false;
                    }
                    return true;
                });
            }
            
            // Save cleaned data
            if (cleanedItems > 0) {
                await chrome.storage.local.set(updatedData);
                console.log(`✅ Cleaned up ${cleanedItems} expired data items`);
                
                // Log cleanup activity
                await this.logPrivacyActivity('data_cleanup', {
                    itemsCleaned: cleanedItems,
                    timestamp: now
                });
            }
            
        } catch (error) {
            console.error('Data cleanup failed:', error);
        }
    }

    startPeriodicChecks() {
        // Check for privacy policy updates weekly
        setInterval(() => {
            this.checkForPrivacyUpdates();
        }, 7 * 24 * 60 * 60 * 1000);
        
        // Remind users about data export monthly (if enabled)
        if (this.settings.features.exportReminder) {
            setInterval(() => {
                this.checkExportReminder();
            }, 30 * 24 * 60 * 60 * 1000);
        }
    }

    async checkForPrivacyUpdates() {
        // In a real implementation, this would check for policy updates
        console.log('🔍 Checking for privacy policy updates...');
    }

    async checkExportReminder() {
        try {
            const data = await chrome.storage.local.get(['lastExportReminder']);
            const lastReminder = data.lastExportReminder || 0;
            const now = Date.now();
            
            // Show reminder every 90 days
            if (now - lastReminder > 90 * 24 * 60 * 60 * 1000) {
                this.showExportReminder();
                await chrome.storage.local.set({ lastExportReminder: now });
            }
            
        } catch (error) {
            console.error('Export reminder check failed:', error);
        }
    }

    showExportReminder() {
        const reminder = document.createElement('div');
        reminder.className = 'privacy-export-reminder';
        reminder.innerHTML = `
            <div class="reminder-content">
                <h4>📥 Data Export Reminder</h4>
                <p>Remember that you can export your data anytime. Would you like to export it now?</p>
                <div class="reminder-actions">
                    <button class="reminder-btn export-now">Export Now</button>
                    <button class="reminder-btn remind-later">Remind Later</button>
                    <button class="reminder-btn disable-reminders">Disable Reminders</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(reminder);
        
        reminder.querySelector('.export-now').addEventListener('click', () => {
            // Trigger data export
            if (window.MyAyAIDataManager) {
                window.MyAyAIDataManager.exportAllUserData();
            }
            reminder.remove();
        });
        
        reminder.querySelector('.remind-later').addEventListener('click', () => {
            reminder.remove();
        });
        
        reminder.querySelector('.disable-reminders').addEventListener('click', async () => {
            this.settings.features.exportReminder = false;
            await this.saveSettings();
            reminder.remove();
        });
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (reminder.parentNode) reminder.remove();
        }, 30000);
    }

    /**
     * Event system
     */
    addEventListener(event, callback) {
        this.listeners.push({ event, callback });
    }

    removeEventListener(event, callback) {
        this.listeners = this.listeners.filter(
            listener => listener.event !== event || listener.callback !== callback
        );
    }

    notifyListeners(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => {
                try {
                    listener.callback(data);
                } catch (error) {
                    console.error('Privacy settings listener error:', error);
                }
            });
    }

    /**
     * Activity logging
     */
    async logPrivacyActivity(action, details = {}) {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) return;
            
            const activity = {
                id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                action,
                details,
                timestamp: Date.now()
            };
            
            const data = await chrome.storage.local.get(['privacyActivity']);
            const activities = data.privacyActivity || [];
            
            activities.unshift(activity);
            
            // Keep only last 100 activities
            const recentActivities = activities.slice(0, 100);
            
            await chrome.storage.local.set({ privacyActivity: recentActivities });
            
        } catch (error) {
            console.error('Failed to log privacy activity:', error);
        }
    }

    /**
     * Utility methods
     */
    async saveSettings() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ privacySettings: this.settings });
            }
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
        }
    }

    /**
     * Factory reset - restore all defaults
     */
    async factoryReset() {
        try {
            // Clear all stored privacy settings
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const keysToRemove = [
                    'privacySettings',
                    'privacyActivity',
                    'consentStatus',
                    'consentTimestamp',
                    'ageVerification'
                ];
                
                await chrome.storage.local.remove(keysToRemove);
                await chrome.storage.sync.remove(keysToRemove);
            }
            
            // Reset to defaults
            this.settings = JSON.parse(JSON.stringify(this.constructor.prototype.settings || {}));
            
            // Reinitialize
            await this.init();
            
            console.log('✅ Privacy settings factory reset completed');
            return true;
            
        } catch (error) {
            console.error('Factory reset failed:', error);
            return false;
        }
    }
}

// Initialize and export
const privacySettings = new PrivacySettings();

if (typeof window !== 'undefined') {
    window.MyAyAIPrivacySettings = privacySettings;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivacySettings;
}
