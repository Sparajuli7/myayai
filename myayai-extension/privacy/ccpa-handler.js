// MyAyAI CCPA Compliance Handler
// Handles California Consumer Privacy Act (CCPA) compliance

class CCPAHandler {
    constructor(options = {}) {
        this.options = {
            companyName: 'MyAyAI',
            privacyPolicyUrl: 'https://myayai.com/privacy',
            ccpaRequestUrl: 'https://myayai.com/ccpa-request',
            contactEmail: 'privacy@myayai.com',
            businessInfo: {
                name: 'MyAyAI Ltd',
                address: '123 Privacy Street, CA 90210',
                phone: '+1-555-PRIVACY'
            },
            ...options
        };
        
        this.personalInfoCategories = {
            identifiers: {
                name: 'Identifiers',
                description: 'User ID, device ID, browser information',
                collected: true,
                sources: ['Direct user interaction', 'Automatic collection'],
                purposes: ['Extension functionality', 'User identification'],
                shared: false
            },
            usage_data: {
                name: 'Usage Data',
                description: 'How you interact with the extension',
                collected: true,
                sources: ['Extension usage'],
                purposes: ['Analytics', 'Product improvement'],
                shared: false
            },
            preferences: {
                name: 'Preferences',
                description: 'Settings and preferences',
                collected: true,
                sources: ['User settings'],
                purposes: ['Personalization', 'Service provision'],
                shared: false
            },
            prompts: {
                name: 'Prompt Content',
                description: 'Text content you optimize',
                collected: true,
                sources: ['User input'],
                purposes: ['Service provision', 'Optimization'],
                shared: false
            }
        };
        
        this.consumerRights = [
            'know', 'delete', 'opt_out', 'non_discrimination'
        ];
        
        this.init();
    }

    async init() {
        try {
            await this.loadCCPASettings();
            await this.checkOptOutStatus();
            this.setupEventListeners();
            console.log('CCPA Handler initialized');
        } catch (error) {
            console.error('Failed to initialize CCPA handler:', error);
        }
    }

    /**
     * Load CCPA settings
     */
    async loadCCPASettings() {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                this.settings = this.getDefaultSettings();
                return;
            }

            const data = await chrome.storage.sync.get(['ccpaSettings', 'ccpaOptOutStatus']);
            
            this.settings = data.ccpaSettings || this.getDefaultSettings();
            this.optOutStatus = data.ccpaOptOutStatus || {
                saleOptOut: false,
                timestamp: null
            };
            
        } catch (error) {
            console.error('Failed to load CCPA settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            showCCPANotice: true,
            dataProcessingDisclosed: false,
            lastUpdated: null
        };
    }

    /**
     * Check if user is in California (basic heuristic)
     */
    async checkCaliforniaUser() {
        try {
            // This is a simple heuristic - in production, you might use IP geolocation
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const californiaTimezones = ['America/Los_Angeles', 'America/Tijuana'];
            
            return californiaTimezones.includes(timezone);
        } catch (error) {
            console.error('Failed to check California status:', error);
            return false; // Assume not California if check fails
        }
    }

    /**
     * Check opt-out status
     */
    async checkOptOutStatus() {
        const isCaliforniaUser = await this.checkCaliforniaUser();
        
        if (isCaliforniaUser && this.settings.showCCPANotice && !this.settings.dataProcessingDisclosed) {
            await this.showDataProcessingDisclosure();
        }
        
        return this.optOutStatus;
    }

    /**
     * Show CCPA data processing disclosure
     */
    async showDataProcessingDisclosure() {
        return new Promise((resolve) => {
            const disclosure = this.createDataProcessingDisclosure();
            document.body.appendChild(disclosure);
            
            const handleResponse = async (acknowledged) => {
                this.settings.dataProcessingDisclosed = true;
                this.settings.lastUpdated = Date.now();
                this.settings.showCCPANotice = false;
                
                await this.saveCCPASettings();
                disclosure.remove();
                resolve(acknowledged);
            };
            
            disclosure.querySelector('.ccpa-acknowledge').addEventListener('click', () => {
                handleResponse(true);
            });
            
            disclosure.querySelector('.ccpa-opt-out').addEventListener('click', () => {
                this.handleOptOutRequest().then(() => handleResponse(true));
            });
        });
    }

    createDataProcessingDisclosure() {
        const disclosure = document.createElement('div');
        disclosure.className = 'ccpa-disclosure-modal';
        
        disclosure.innerHTML = `
            <div class="ccpa-modal-content">
                <div class="ccpa-header">
                    <h2>California Privacy Rights</h2>
                    <p>As a California resident, you have specific rights regarding your personal information.</p>
                </div>
                
                <div class="ccpa-body">
                    <div class="ccpa-section">
                        <h3>Personal Information We Collect</h3>
                        <div class="ccpa-categories">
                            ${this.generateCategoriesHTML()}
                        </div>
                    </div>
                    
                    <div class="ccpa-section">
                        <h3>Your Rights</h3>
                        <ul class="ccpa-rights-list">
                            <li><strong>Right to Know:</strong> Request information about personal information collected</li>
                            <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                            <li><strong>Right to Opt-Out:</strong> Opt-out of sale of personal information</li>
                            <li><strong>Right to Non-Discrimination:</strong> Not be discriminated against for exercising rights</li>
                        </ul>
                    </div>
                    
                    <div class="ccpa-section">
                        <h3>Sale of Personal Information</h3>
                        <p>We <strong>do not sell</strong> your personal information to third parties. 
                        However, if our practices change, we will provide you with notice and opt-out rights.</p>
                    </div>
                    
                    <div class="ccpa-contact">
                        <p>To exercise your rights, contact us at: 
                        <a href="mailto:${this.options.contactEmail}">${this.options.contactEmail}</a></p>
                    </div>
                </div>
                
                <div class="ccpa-actions">
                    <button class="ccpa-btn ccpa-acknowledge">I Understand</button>
                    <button class="ccpa-btn ccpa-opt-out">Opt-Out of Data Processing</button>
                </div>
            </div>
        `;
        
        this.injectCCPAStyles();
        
        return disclosure;
    }

    generateCategoriesHTML() {
        return Object.entries(this.personalInfoCategories)
            .map(([key, category]) => `
                <div class="ccpa-category">
                    <h4>${category.name}</h4>
                    <p>${category.description}</p>
                    <div class="ccpa-category-details">
                        <span class="ccpa-collected ${category.collected ? 'yes' : 'no'}">
                            ${category.collected ? '✓ Collected' : '✗ Not Collected'}
                        </span>
                        ${category.collected ? `
                            <div class="ccpa-purposes">
                                <strong>Purposes:</strong> ${category.purposes.join(', ')}
                            </div>
                            <div class="ccpa-shared">
                                <strong>Shared:</strong> ${category.shared ? 'Yes' : 'No'}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');
    }

    injectCCPAStyles() {
        if (document.getElementById('ccpa-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ccpa-styles';
        styles.textContent = `
            .ccpa-disclosure-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .ccpa-modal-content {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            
            .ccpa-header h2 {
                margin: 0 0 8px 0;
                color: #1f2937;
                font-size: 20px;
            }
            
            .ccpa-body {
                margin: 16px 0;
                color: #4b5563;
                line-height: 1.6;
            }
            
            .ccpa-section {
                margin: 20px 0;
            }
            
            .ccpa-section h3 {
                color: #1f2937;
                font-size: 16px;
                margin: 0 0 12px 0;
            }
            
            .ccpa-categories {
                display: grid;
                gap: 16px;
            }
            
            .ccpa-category {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                background: #f9fafb;
            }
            
            .ccpa-category h4 {
                margin: 0 0 8px 0;
                color: #1f2937;
                font-size: 14px;
            }
            
            .ccpa-category-details {
                margin-top: 12px;
                font-size: 13px;
            }
            
            .ccpa-collected.yes {
                color: #059669;
                font-weight: 500;
            }
            
            .ccpa-collected.no {
                color: #dc2626;
                font-weight: 500;
            }
            
            .ccpa-purposes,
            .ccpa-shared {
                margin-top: 8px;
                color: #6b7280;
            }
            
            .ccpa-rights-list {
                margin: 12px 0;
                padding-left: 20px;
            }
            
            .ccpa-rights-list li {
                margin: 8px 0;
            }
            
            .ccpa-contact {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
            }
            
            .ccpa-contact a {
                color: #3b82f6;
                text-decoration: none;
            }
            
            .ccpa-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 24px;
            }
            
            .ccpa-btn {
                padding: 10px 20px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: white;
                color: #374151;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .ccpa-acknowledge {
                background: #3b82f6 !important;
                color: white !important;
                border-color: #3b82f6 !important;
            }
            
            .ccpa-btn:hover {
                background: #f3f4f6;
            }
            
            .ccpa-acknowledge:hover {
                background: #2563eb !important;
            }
            
            .ccpa-opt-out {
                background: #ef4444 !important;
                color: white !important;
                border-color: #ef4444 !important;
            }
            
            .ccpa-opt-out:hover {
                background: #dc2626 !important;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Handle consumer rights requests
     */
    async handleConsumerRequest(requestType, options = {}) {
        const requestId = `ccpa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            switch (requestType) {
                case 'know':
                    return await this.handleRightToKnow(options);
                    
                case 'delete':
                    return await this.handleRightToDelete(options);
                    
                case 'opt_out':
                    return await this.handleOptOutRequest(options);
                    
                default:
                    throw new Error(`Unknown CCPA request type: ${requestType}`);
            }
            
        } catch (error) {
            console.error('CCPA consumer request failed:', error);
            throw error;
        }
    }

    /**
     * Handle Right to Know request
     */
    async handleRightToKnow(options) {
        try {
            const personalInfo = await this.collectPersonalInformation();
            
            const response = {
                requestType: 'know',
                timestamp: new Date().toISOString(),
                businessName: this.options.businessInfo.name,
                personalInformation: personalInfo,
                categories: this.personalInfoCategories,
                disclosures: this.generateDisclosures(),
                retentionPeriod: '13 months for consent, 30 days for optimization data'
            };
            
            await this.logCCPARequest('know', response);
            
            return response;
            
        } catch (error) {
            throw new Error(`Right to Know request failed: ${error.message}`);
        }
    }

    /**
     * Handle Right to Delete request
     */
    async handleRightToDelete(options) {
        try {
            const deletedData = await this.deletePersonalInformation();
            
            const response = {
                requestType: 'delete',
                timestamp: new Date().toISOString(),
                status: 'completed',
                deletedData: deletedData,
                exceptions: [] // List any data that couldn't be deleted due to legal requirements
            };
            
            await this.logCCPARequest('delete', response);
            
            return response;
            
        } catch (error) {
            throw new Error(`Right to Delete request failed: ${error.message}`);
        }
    }

    /**
     * Handle Opt-Out request
     */
    async handleOptOutRequest(options = {}) {
        try {
            // Update opt-out status
            this.optOutStatus = {
                saleOptOut: true,
                timestamp: Date.now(),
                scope: options.scope || 'all'
            };
            
            // Save opt-out preference
            await this.saveCCPASettings();
            
            // Stop any data sharing (if applicable)
            await this.stopDataSharing();
            
            const response = {
                requestType: 'opt_out',
                timestamp: new Date().toISOString(),
                status: 'completed',
                scope: this.optOutStatus.scope,
                note: 'We do not currently sell personal information, but your opt-out preference has been recorded.'
            };
            
            await this.logCCPARequest('opt_out', response);
            
            // Notify user
            this.showOptOutConfirmation();
            
            return response;
            
        } catch (error) {
            throw new Error(`Opt-Out request failed: ${error.message}`);
        }
    }

    async collectPersonalInformation() {
        const personalInfo = {
            categories: {},
            lastUpdated: new Date().toISOString()
        };
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            try {
                // Collect identifiers
                const userData = await chrome.storage.sync.get();
                personalInfo.categories.identifiers = {
                    userId: userData.userId || null,
                    settings: userData.settings || null
                };
                
                // Collect usage data
                const localData = await chrome.storage.local.get();
                personalInfo.categories.usage_data = {
                    analyticsEvents: localData.analyticsEvents || [],
                    optimizationAnalytics: localData.optimizationAnalytics || {}
                };
                
                // Collect preferences
                personalInfo.categories.preferences = {
                    gdprConsents: userData.gdprConsents || {},
                    ccpaSettings: userData.ccpaSettings || {}
                };
                
                // Collect prompt data
                personalInfo.categories.prompts = {
                    savedPrompts: localData.savedPrompts || [],
                    promptHistory: localData.promptHistory || []
                };
                
            } catch (error) {
                console.error('Error collecting personal information:', error);
            }
        }
        
        return personalInfo;
    }

    async deletePersonalInformation() {
        const deletedData = [];
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            try {
                // Clear sync storage
                await chrome.storage.sync.clear();
                deletedData.push('User settings and preferences');
                
                // Clear local storage
                await chrome.storage.local.clear();
                deletedData.push('Usage data and analytics');
                deletedData.push('Saved prompts and history');
                
                console.log('All personal information deleted for CCPA compliance');
                
            } catch (error) {
                console.error('Error deleting personal information:', error);
                throw error;
            }
        }
        
        return deletedData;
    }

    async stopDataSharing() {
        // Since we don't currently sell data, this is mostly preventive
        // In a real app, this would disable any data sharing mechanisms
        console.log('Data sharing stopped (Note: We do not sell personal information)');
    }

    showOptOutConfirmation() {
        const notification = document.createElement('div');
        notification.className = 'ccpa-opt-out-notification';
        notification.innerHTML = `
            <div class="ccpa-notification-content">
                <h3>✓ Opt-Out Confirmed</h3>
                <p>Your preference to opt-out of the sale of personal information has been recorded.</p>
                <p><small>Note: We do not sell personal information to third parties.</small></p>
                <button class="ccpa-notification-close">Close</button>
            </div>
        `;
        
        notification.querySelector('.ccpa-notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    generateDisclosures() {
        return {
            businessPurposes: [
                'Providing and maintaining the extension',
                'Improving user experience',
                'Analytics and performance monitoring',
                'Customer support'
            ],
            thirdPartySharing: {
                sold: false,
                sharedForBusinessPurpose: false,
                categories: []
            },
            retentionPeriods: {
                identifiers: '13 months',
                usage_data: '90 days',
                preferences: '13 months',
                prompts: '30 days'
            }
        };
    }

    async saveCCPASettings() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set({
                    ccpaSettings: this.settings,
                    ccpaOptOutStatus: this.optOutStatus
                });
            }
        } catch (error) {
            console.error('Failed to save CCPA settings:', error);
        }
    }

    async logCCPARequest(requestType, response) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const data = await chrome.storage.local.get(['ccpaRequests']);
                const requests = data.ccpaRequests || [];
                
                requests.push({
                    id: `ccpa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: requestType,
                    timestamp: Date.now(),
                    response: response
                });
                
                // Keep only last 100 requests
                const recentRequests = requests.slice(-100);
                
                await chrome.storage.local.set({ ccpaRequests: recentRequests });
            }
        } catch (error) {
            console.error('Failed to log CCPA request:', error);
        }
    }

    setupEventListeners() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.action === 'ccpa_consumer_request') {
                    this.handleConsumerRequest(message.requestType, message.options)
                        .then(sendResponse)
                        .catch(error => sendResponse({ error: error.message }));
                    return true;
                } else if (message.action === 'ccpa_show_disclosure') {
                    this.showDataProcessingDisclosure().then(sendResponse);
                    return true;
                }
            });
        }
    }

    /**
     * Get CCPA compliance status
     */
    getCCPAStatus() {
        return {
            isOptedOut: this.optOutStatus.saleOptOut,
            optOutTimestamp: this.optOutStatus.timestamp,
            disclosureShown: this.settings.dataProcessingDisclosed,
            availableRights: this.consumerRights,
            businessInfo: this.options.businessInfo,
            contactInfo: this.options.contactEmail
        };
    }

    /**
     * Check if data processing should be limited based on CCPA
     */
    shouldLimitProcessing() {
        return this.optOutStatus.saleOptOut && this.optOutStatus.scope === 'all';
    }

    /**
     * Get data categories disclosure
     */
    getDataCategoriesDisclosure() {
        return {
            categories: this.personalInfoCategories,
            disclosures: this.generateDisclosures(),
            lastUpdated: this.settings.lastUpdated
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CCPAHandler;
} else if (typeof window !== 'undefined') {
    window.CCPAHandler = CCPAHandler;
} else {
    self.CCPAHandler = CCPAHandler;
}
