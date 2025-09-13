// MyAyAI Data Manager - GDPR/CCPA/PIPEDA Compliant Data Export & Deletion
// Handles user data export, complete deletion, and data inventory

class DataManager {
    constructor() {
        this.contactEmail = 'privacy@myayai.com';
        this.companyName = 'MyAyAI';
        this.dataCategories = {
            userSettings: {
                name: 'User Settings & Preferences',
                description: 'Extension settings, optimization preferences, UI choices',
                retention: '13 months',
                storageType: 'chrome.storage.sync'
            },
            promptHistory: {
                name: 'Prompt Optimization History',
                description: 'Previously optimized prompts and suggestions',
                retention: '30 days',
                storageType: 'chrome.storage.local'
            },
            usageAnalytics: {
                name: 'Usage Analytics',
                description: 'Anonymous usage statistics and performance metrics',
                retention: '90 days',
                storageType: 'chrome.storage.local'
            },
            consentData: {
                name: 'Privacy Consent Records',
                description: 'Your privacy choices and consent history',
                retention: '7 years (legal requirement)',
                storageType: 'chrome.storage.local'
            }
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('Data Manager initialized - Ready for privacy operations');
            this.setupMessageListener();
        } catch (error) {
            console.error('Data Manager initialization failed:', error);
        }
    }

    setupMessageListener() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                switch (message.action) {
                    case 'exportUserData':
                        this.exportAllUserData().then(sendResponse).catch(err => sendResponse({ error: err.message }));
                        return true;
                    case 'deleteAllUserData':
                        this.deleteAllUserData().then(sendResponse).catch(err => sendResponse({ error: err.message }));
                        return true;
                    case 'getDataInventory':
                        this.getDataInventory().then(sendResponse).catch(err => sendResponse({ error: err.message }));
                        return true;
                }
            });
        }
    }

    /**
     * Export all user data as downloadable JSON
     * GDPR Article 20 - Right to data portability
     */
    async exportAllUserData() {
        try {
            console.log('🔄 Starting complete data export...');
            
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    exportType: 'complete_user_data',
                    version: '1.0.0',
                    companyName: this.companyName,
                    contactEmail: this.contactEmail,
                    dataSubject: 'chrome_extension_user',
                    legalBasis: 'GDPR Article 20 - Data Portability'
                },
                categories: {}
            };

            // Export all data categories
            for (const [categoryKey, categoryInfo] of Object.entries(this.dataCategories)) {
                exportData.categories[categoryKey] = await this.exportDataCategory(categoryKey, categoryInfo);
            }

            // Calculate data summary
            exportData.summary = this.generateDataSummary(exportData.categories);

            // Create downloadable file
            await this.createDownloadableExport(exportData);

            console.log('✅ Data export completed successfully');
            
            return {
                success: true,
                message: 'Your data has been exported successfully',
                exportSize: JSON.stringify(exportData).length,
                categories: Object.keys(exportData.categories).length,
                timestamp: exportData.metadata.exportDate
            };

        } catch (error) {
            console.error('❌ Data export failed:', error);
            throw new Error(`Data export failed: ${error.message}`);
        }
    }

    async exportDataCategory(categoryKey, categoryInfo) {
        const categoryData = {
            metadata: {
                name: categoryInfo.name,
                description: categoryInfo.description,
                retention: categoryInfo.retention,
                storageType: categoryInfo.storageType,
                exportTimestamp: new Date().toISOString()
            },
            data: null,
            itemCount: 0
        };

        try {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                categoryData.data = { note: 'Chrome storage not available' };
                return categoryData;
            }

            let rawData = {};

            // Get data based on storage type
            if (categoryInfo.storageType === 'chrome.storage.sync') {
                rawData = await chrome.storage.sync.get();
            } else if (categoryInfo.storageType === 'chrome.storage.local') {
                rawData = await chrome.storage.local.get();
            }

            // Filter data by category
            categoryData.data = this.filterDataByCategory(categoryKey, rawData);
            categoryData.itemCount = this.countDataItems(categoryData.data);

        } catch (error) {
            console.error(`Failed to export ${categoryKey}:`, error);
            categoryData.data = { error: `Export failed: ${error.message}` };
        }

        return categoryData;
    }

    filterDataByCategory(categoryKey, rawData) {
        const categoryFilters = {
            userSettings: ['settings', 'preferences', 'userConfig', 'theme', 'language'],
            promptHistory: ['savedPrompts', 'promptHistory', 'optimizationResults'],
            usageAnalytics: ['analyticsEvents', 'usageStats', 'performanceMetrics'],
            consentData: ['consentStatus', 'consentTimestamp', 'consentVersion', 'ageVerification']
        };

        const filters = categoryFilters[categoryKey] || [];
        const filtered = {};

        for (const key of filters) {
            if (rawData[key] !== undefined) {
                filtered[key] = rawData[key];
            }
        }

        return filtered;
    }

    countDataItems(data) {
        if (!data || typeof data !== 'object') return 0;
        
        return Object.keys(data).reduce((count, key) => {
            const value = data[key];
            if (Array.isArray(value)) {
                return count + value.length;
            } else if (typeof value === 'object' && value !== null) {
                return count + Object.keys(value).length;
            }
            return count + 1;
        }, 0);
    }

    generateDataSummary(categories) {
        const summary = {
            totalCategories: Object.keys(categories).length,
            totalItems: 0,
            categoriesWithData: 0,
            oldestData: null,
            newestData: null
        };

        for (const category of Object.values(categories)) {
            summary.totalItems += category.itemCount;
            
            if (category.itemCount > 0) {
                summary.categoriesWithData++;
            }

            // Track data timestamps for age analysis
            if (category.data && typeof category.data === 'object') {
                this.updateDataTimestamps(category.data, summary);
            }
        }

        return summary;
    }

    updateDataTimestamps(data, summary) {
        const findTimestamps = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            
            for (const [key, value] of Object.entries(obj)) {
                if (key.includes('timestamp') || key.includes('Timestamp') || key.includes('date') || key.includes('Date')) {
                    const timestamp = typeof value === 'number' ? value : Date.parse(value);
                    if (!isNaN(timestamp)) {
                        if (!summary.oldestData || timestamp < summary.oldestData) {
                            summary.oldestData = timestamp;
                        }
                        if (!summary.newestData || timestamp > summary.newestData) {
                            summary.newestData = timestamp;
                        }
                    }
                } else if (typeof value === 'object') {
                    findTimestamps(value);
                }
            }
        };

        findTimestamps(data);
    }

    async createDownloadableExport(exportData) {
        try {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `myayai-data-export-${timestamp}.json`;
            
            // For Chrome extensions, we need to use chrome.downloads API
            if (typeof chrome !== 'undefined' && chrome.downloads) {
                await chrome.downloads.download({
                    url: url,
                    filename: filename,
                    saveAs: true
                });
            } else {
                // Fallback for other environments
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
            }
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
        } catch (error) {
            console.error('Failed to create downloadable export:', error);
            throw error;
        }
    }

    /**
     * Complete data deletion - GDPR Article 17 Right to erasure
     */
    async deleteAllUserData() {
        try {
            console.log('🔄 Starting complete data deletion...');
            
            const deletionLog = {
                timestamp: new Date().toISOString(),
                requestType: 'complete_deletion',
                deletedCategories: [],
                errors: []
            };

            if (typeof chrome === 'undefined' || !chrome.storage) {
                throw new Error('Chrome storage not available');
            }

            // Delete all sync storage (settings, preferences)
            try {
                const syncData = await chrome.storage.sync.get();
                await chrome.storage.sync.clear();
                deletionLog.deletedCategories.push({
                    category: 'chrome.storage.sync',
                    itemCount: Object.keys(syncData).length,
                    items: Object.keys(syncData)
                });
                console.log('🗑️ Cleared chrome.storage.sync');
            } catch (error) {
                deletionLog.errors.push(`sync storage: ${error.message}`);
            }

            // Delete all local storage (usage data, history)
            try {
                const localData = await chrome.storage.local.get();
                // Keep only the deletion log temporarily
                await chrome.storage.local.clear();
                deletionLog.deletedCategories.push({
                    category: 'chrome.storage.local',
                    itemCount: Object.keys(localData).length,
                    items: Object.keys(localData)
                });
                console.log('🗑️ Cleared chrome.storage.local');
            } catch (error) {
                deletionLog.errors.push(`local storage: ${error.message}`);
            }

            // Store deletion log (required for compliance)
            await chrome.storage.local.set({
                lastDataDeletion: deletionLog
            });

            // Notify other components about data deletion
            if (chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: 'dataDeleted',
                    log: deletionLog
                });
            }

            console.log('✅ Complete data deletion successful');

            return {
                success: true,
                message: 'All your data has been permanently deleted',
                deletedCategories: deletionLog.deletedCategories.length,
                errors: deletionLog.errors.length,
                timestamp: deletionLog.timestamp
            };

        } catch (error) {
            console.error('❌ Data deletion failed:', error);
            throw new Error(`Data deletion failed: ${error.message}`);
        }
    }

    /**
     * Get complete data inventory - shows exactly what data is stored
     */
    async getDataInventory() {
        try {
            console.log('🔍 Generating data inventory...');
            
            const inventory = {
                timestamp: new Date().toISOString(),
                categories: {},
                summary: {
                    totalSize: 0,
                    totalItems: 0,
                    storageBreakdown: {}
                }
            };

            if (typeof chrome === 'undefined' || !chrome.storage) {
                return { 
                    ...inventory,
                    note: 'Chrome storage not available - no data stored'
                };
            }

            // Analyze sync storage
            try {
                const syncData = await chrome.storage.sync.get();
                const syncInfo = this.analyzeStorageData(syncData, 'sync');
                inventory.categories.syncStorage = syncInfo;
                inventory.summary.totalSize += syncInfo.sizeEstimate;
                inventory.summary.totalItems += syncInfo.itemCount;
                inventory.summary.storageBreakdown.sync = syncInfo;
            } catch (error) {
                inventory.categories.syncStorage = { error: error.message };
            }

            // Analyze local storage
            try {
                const localData = await chrome.storage.local.get();
                const localInfo = this.analyzeStorageData(localData, 'local');
                inventory.categories.localStorage = localInfo;
                inventory.summary.totalSize += localInfo.sizeEstimate;
                inventory.summary.totalItems += localInfo.itemCount;
                inventory.summary.storageBreakdown.local = localInfo;
            } catch (error) {
                inventory.categories.localStorage = { error: error.message };
            }

            // Add data classification
            inventory.classification = this.classifyStoredData(inventory.categories);
            
            console.log('✅ Data inventory generated');
            
            return inventory;

        } catch (error) {
            console.error('❌ Data inventory failed:', error);
            throw new Error(`Data inventory failed: ${error.message}`);
        }
    }

    analyzeStorageData(data, storageType) {
        const analysis = {
            storageType,
            itemCount: Object.keys(data).length,
            keys: Object.keys(data),
            sizeEstimate: JSON.stringify(data).length,
            dataTypes: {},
            personalDataDetected: false
        };

        // Analyze each key
        for (const [key, value] of Object.entries(data)) {
            const keyAnalysis = {
                type: this.getDataType(value),
                size: JSON.stringify(value).length,
                isPersonalData: this.isPersonalData(key, value),
                category: this.categorizeDataKey(key)
            };

            if (keyAnalysis.isPersonalData) {
                analysis.personalDataDetected = true;
            }

            analysis.dataTypes[key] = keyAnalysis;
        }

        return analysis;
    }

    getDataType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return `array[${value.length}]`;
        if (typeof value === 'object') return `object[${Object.keys(value).length}]`;
        return typeof value;
    }

    isPersonalData(key, value) {
        const personalDataIndicators = [
            'user', 'prompt', 'history', 'preference', 'consent', 
            'email', 'name', 'analytics', 'usage'
        ];

        const keyLower = key.toLowerCase();
        return personalDataIndicators.some(indicator => 
            keyLower.includes(indicator)
        );
    }

    categorizeDataKey(key) {
        const categories = {
            settings: ['settings', 'config', 'preference', 'theme'],
            privacy: ['consent', 'privacy', 'gdpr', 'ccpa'],
            usage: ['analytics', 'usage', 'stats', 'metrics'],
            content: ['prompt', 'history', 'saved', 'optimization'],
            system: ['version', 'timestamp', 'last', 'cache']
        };

        const keyLower = key.toLowerCase();
        
        for (const [category, indicators] of Object.entries(categories)) {
            if (indicators.some(indicator => keyLower.includes(indicator))) {
                return category;
            }
        }

        return 'uncategorized';
    }

    classifyStoredData(categories) {
        const classification = {
            personalData: [],
            technicalData: [],
            consentData: [],
            temporaryData: []
        };

        // Classify data from all storage types
        for (const category of Object.values(categories)) {
            if (category.dataTypes) {
                for (const [key, analysis] of Object.entries(category.dataTypes)) {
                    const item = { key, ...analysis };
                    
                    if (analysis.category === 'privacy') {
                        classification.consentData.push(item);
                    } else if (analysis.isPersonalData) {
                        classification.personalData.push(item);
                    } else if (analysis.category === 'usage') {
                        classification.temporaryData.push(item);
                    } else {
                        classification.technicalData.push(item);
                    }
                }
            }
        }

        return classification;
    }

    /**
     * Show data inventory UI
     */
    async showDataInventoryModal() {
        const inventory = await this.getDataInventory();
        const modal = this.createInventoryModal(inventory);
        document.body.appendChild(modal);
        this.injectInventoryStyles();
        
        return new Promise((resolve) => {
            modal.querySelector('.inventory-close').addEventListener('click', () => {
                modal.remove();
                resolve();
            });

            modal.querySelector('.inventory-export').addEventListener('click', async () => {
                try {
                    await this.exportAllUserData();
                    this.showSuccessMessage('Data exported successfully!');
                } catch (error) {
                    this.showErrorMessage('Export failed: ' + error.message);
                }
            });

            modal.querySelector('.inventory-delete').addEventListener('click', async () => {
                if (confirm('⚠️ This will permanently delete ALL your data. This cannot be undone. Continue?')) {
                    try {
                        await this.deleteAllUserData();
                        this.showSuccessMessage('All data deleted successfully!');
                        setTimeout(() => modal.remove(), 2000);
                    } catch (error) {
                        this.showErrorMessage('Deletion failed: ' + error.message);
                    }
                }
            });
        });
    }

    createInventoryModal(inventory) {
        const modal = document.createElement('div');
        modal.className = 'data-inventory-modal';
        modal.innerHTML = `
            <div class="inventory-content">
                <div class="inventory-header">
                    <h2>📊 Your Data Inventory</h2>
                    <button class="inventory-close">×</button>
                </div>
                
                <div class="inventory-summary">
                    <div class="summary-stats">
                        <div class="stat">
                            <span class="stat-number">${inventory.summary.totalItems}</span>
                            <span class="stat-label">Data Items</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${Math.round(inventory.summary.totalSize / 1024)}KB</span>
                            <span class="stat-label">Storage Used</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${inventory.classification?.personalData?.length || 0}</span>
                            <span class="stat-label">Personal Data Items</span>
                        </div>
                    </div>
                </div>

                <div class="inventory-categories">
                    ${this.generateCategoryHTML(inventory.classification)}
                </div>

                <div class="inventory-actions">
                    <button class="inventory-btn inventory-export">📥 Export Data</button>
                    <button class="inventory-btn inventory-delete danger">🗑️ Delete All Data</button>
                </div>

                <div class="inventory-footer">
                    <p><small>Last updated: ${new Date(inventory.timestamp).toLocaleString()}</small></p>
                    <p><small>Contact: <a href="mailto:${this.contactEmail}">${this.contactEmail}</a></small></p>
                </div>
            </div>
        `;
        
        return modal;
    }

    generateCategoryHTML(classification) {
        if (!classification) return '<p>No data classification available</p>';

        return `
            <div class="data-category">
                <h4>🔒 Personal Data (${classification.personalData.length})</h4>
                ${this.generateDataItemsHTML(classification.personalData)}
            </div>
            
            <div class="data-category">
                <h4>⚙️ Technical Data (${classification.technicalData.length})</h4>
                ${this.generateDataItemsHTML(classification.technicalData)}
            </div>
            
            <div class="data-category">
                <h4>✅ Consent Records (${classification.consentData.length})</h4>
                ${this.generateDataItemsHTML(classification.consentData)}
            </div>
            
            <div class="data-category">
                <h4>📊 Temporary Data (${classification.temporaryData.length})</h4>
                ${this.generateDataItemsHTML(classification.temporaryData)}
            </div>
        `;
    }

    generateDataItemsHTML(items) {
        if (!items.length) return '<p class="no-data">No data in this category</p>';
        
        return items.map(item => `
            <div class="data-item">
                <span class="item-key">${item.key}</span>
                <span class="item-type">${item.type}</span>
                <span class="item-size">${Math.round(item.size / 1024)}KB</span>
            </div>
        `).join('');
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const notification = document.createElement('div');
        notification.className = `data-manager-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${type === 'success' ? '✅' : '❌'} ${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    injectInventoryStyles() {
        if (document.getElementById('data-inventory-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'data-inventory-styles';
        styles.textContent = `
            .data-inventory-modal {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .inventory-content {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                position: relative;
            }
            
            .inventory-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 24px;
            }
            
            .inventory-header h2 {
                margin: 0;
                color: #1f2937;
                font-size: 24px;
            }
            
            .inventory-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
                padding: 4px;
            }
            
            .inventory-summary {
                background: #f8fafc;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 24px;
            }
            
            .summary-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 16px;
            }
            
            .stat {
                text-align: center;
            }
            
            .stat-number {
                display: block;
                font-size: 24px;
                font-weight: 600;
                color: #3b82f6;
            }
            
            .stat-label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
            }
            
            .inventory-categories {
                margin-bottom: 24px;
            }
            
            .data-category {
                margin-bottom: 20px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .data-category h4 {
                margin: 0;
                padding: 12px 16px;
                background: #f9fafb;
                color: #1f2937;
                font-size: 14px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .data-item {
                display: grid;
                grid-template-columns: 2fr 1fr 80px;
                gap: 12px;
                padding: 12px 16px;
                border-bottom: 1px solid #f3f4f6;
                align-items: center;
                font-size: 13px;
            }
            
            .data-item:last-child {
                border-bottom: none;
            }
            
            .item-key {
                font-weight: 500;
                color: #1f2937;
                word-break: break-word;
            }
            
            .item-type {
                color: #6b7280;
                font-family: monospace;
            }
            
            .item-size {
                color: #9ca3af;
                text-align: right;
                font-family: monospace;
            }
            
            .no-data {
                padding: 12px 16px;
                color: #9ca3af;
                font-style: italic;
                margin: 0;
            }
            
            .inventory-actions {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .inventory-btn {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #3b82f6;
                border-radius: 8px;
                background: white;
                color: #3b82f6;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .inventory-btn:hover {
                background: #3b82f6;
                color: white;
            }
            
            .inventory-btn.danger {
                border-color: #ef4444;
                color: #ef4444;
            }
            
            .inventory-btn.danger:hover {
                background: #ef4444;
                color: white;
            }
            
            .inventory-footer {
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                border-top: 1px solid #e5e7eb;
                padding-top: 16px;
            }
            
            .inventory-footer a {
                color: #3b82f6;
                text-decoration: none;
            }
            
            .data-manager-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                border-radius: 8px;
                padding: 16px;
                max-width: 300px;
                z-index: 1000000;
                animation: slideIn 0.3s ease-out;
            }
            
            .data-manager-notification.success {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                color: #166534;
            }
            
            .data-manager-notification.error {
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #991b1b;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: inherit;
                opacity: 0.7;
                padding: 0;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Initialize and export
const dataManager = new DataManager();

if (typeof window !== 'undefined') {
    window.MyAyAIDataManager = dataManager;
}

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
