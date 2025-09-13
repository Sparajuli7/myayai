// MyAyAI GDPR/CCPA/PIPEDA Compliant Consent Manager
// CRITICAL: Blocks ALL data collection until explicit consent

class ConsentManager {
    constructor() {
        this.consentRequired = true;
        this.consentVersion = '2025-01-01';
        this.privacyPolicyDate = '2025-01-01';
        this.contactEmail = 'privacy@myayai.com';
        this.companyName = 'MyAyAI';
        
        this.consentTypes = {
            essential: {
                name: 'Essential Functionality',
                description: 'Required for basic extension features',
                required: true,
                granted: false
            },
            analytics: {
                name: 'Analytics & Performance',
                description: 'Help us improve the extension with usage data',
                required: false,
                granted: false
            },
            storage: {
                name: 'Data Storage',
                description: 'Store your preferences and optimization history',
                required: false,
                granted: false
            },
            improvements: {
                name: 'Product Improvements',
                description: 'Use data to enhance features and user experience',
                required: false,
                granted: false
            }
        };
        
        this.consentGranted = false;
        this.ageVerified = false;
        this.isMinor = false;
        
        this.init();
    }

    async init() {
        try {
            // Check existing consent first
            await this.loadConsentStatus();
            
            // If no valid consent exists, show consent modal immediately
            if (!this.hasValidConsent()) {
                await this.showConsentModal();
            }
            
            console.log('Consent Manager initialized - Data collection:', this.canCollectData());
        } catch (error) {
            console.error('Consent Manager initialization failed:', error);
            // Fail safe - block all data collection
            this.blockAllDataCollection();
        }
    }

    async loadConsentStatus() {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                return;
            }

            const data = await chrome.storage.local.get([
                'consentStatus',
                'consentTimestamp',
                'consentVersion',
                'ageVerification'
            ]);
            
            if (data.consentStatus && data.consentVersion === this.consentVersion) {
                this.consentTypes = { ...this.consentTypes, ...data.consentStatus };
                this.consentGranted = true;
                this.ageVerified = data.ageVerification?.verified || false;
                this.isMinor = data.ageVerification?.isMinor || false;
            }
        } catch (error) {
            console.error('Failed to load consent status:', error);
        }
    }

    hasValidConsent() {
        return this.consentGranted && this.ageVerified && 
               this.consentTypes.essential.granted;
    }

    canCollectData(type = 'any') {
        if (!this.hasValidConsent()) return false;
        
        if (type === 'any') {
            return Object.values(this.consentTypes).some(consent => consent.granted);
        }
        
        return this.consentTypes[type]?.granted || false;
    }

    async showConsentModal() {
        return new Promise((resolve) => {
            const modal = this.createConsentModal();
            document.body.appendChild(modal);
            
            // Block all background functionality
            this.blockAllDataCollection();
            
            const handleConsent = async (accepted, customConsents = null) => {
                if (accepted) {
                    if (customConsents) {
                        // Custom granular consents
                        Object.keys(customConsents).forEach(key => {
                            if (this.consentTypes[key]) {
                                this.consentTypes[key].granted = customConsents[key];
                            }
                        });
                    } else {
                        // Accept all
                        Object.keys(this.consentTypes).forEach(key => {
                            this.consentTypes[key].granted = true;
                        });
                    }
                    
                    this.consentGranted = true;
                    await this.saveConsentStatus();
                    this.enableDataCollection();
                } else {
                    // Reject all non-essential
                    Object.keys(this.consentTypes).forEach(key => {
                        this.consentTypes[key].granted = key === 'essential';
                    });
                    
                    this.consentGranted = true; // Still granted, just minimal
                    await this.saveConsentStatus();
                }
                
                modal.remove();
                resolve(accepted);
            };

            // Event listeners
            modal.querySelector('.consent-accept-all').addEventListener('click', () => {
                handleConsent(true);
            });

            modal.querySelector('.consent-reject-all').addEventListener('click', () => {
                handleConsent(false);
            });

            modal.querySelector('.consent-customize').addEventListener('click', () => {
                this.showGranularConsentOptions(modal, handleConsent);
            });

            // Age verification handlers
            modal.querySelector('.age-13-plus').addEventListener('click', () => {
                this.ageVerified = true;
                this.isMinor = false;
                this.updateAgeVerificationUI(modal, false);
            });

            modal.querySelector('.age-under-13').addEventListener('click', () => {
                this.ageVerified = true;
                this.isMinor = true;
                this.updateAgeVerificationUI(modal, true);
            });

            // Prevent modal closure without consent
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    e.stopPropagation();
                    this.showConsentRequired();
                }
            });
        });
    }

    createConsentModal() {
        const modal = document.createElement('div');
        modal.className = 'consent-modal-overlay';
        modal.innerHTML = `
            <div class="consent-modal">
                <div class="consent-header">
                    <div class="consent-logo">🔒</div>
                    <h2>Privacy & Consent</h2>
                    <div class="consent-required-badge">REQUIRED</div>
                </div>
                
                <div class="age-verification-section">
                    <h3>Age Verification</h3>
                    <p>We need to verify your age to provide appropriate privacy protections.</p>
                    <div class="age-buttons">
                        <button class="age-btn age-13-plus">I am 13 years or older</button>
                        <button class="age-btn age-under-13">I am under 13 years old</button>
                    </div>
                    <div class="age-notice" style="display: none;">
                        <p class="minor-notice">As someone under 13, we will collect minimal data and require parental consent for some features.</p>
                    </div>
                </div>

                <div class="consent-content" style="display: none;">
                    <div class="privacy-notice">
                        <h3>Your Privacy Matters</h3>
                        <p>Before using MyAyAI, we need your consent to process data. You have full control over what data we collect.</p>
                        <p><strong>We do NOT collect any data without your explicit consent.</strong></p>
                    </div>

                    <div class="data-collection-info">
                        <h4>What data might we collect?</h4>
                        <div class="consent-options">
                            ${this.generateConsentOptionsHTML()}
                        </div>
                    </div>

                    <div class="privacy-rights">
                        <h4>Your Rights</h4>
                        <ul>
                            <li>✅ Right to access your data</li>
                            <li>✅ Right to delete your data</li>
                            <li>✅ Right to change consent anytime</li>
                            <li>✅ Right to data portability</li>
                            <li>✅ No data sharing with third parties</li>
                        </ul>
                    </div>

                    <div class="privacy-links">
                        <p>
                            <a href="#" class="privacy-policy-link">Privacy Policy</a> • 
                            <a href="#" class="terms-link">Terms of Service</a> • 
                            Contact: <a href="mailto:${this.contactEmail}">${this.contactEmail}</a>
                        </p>
                        <p class="policy-date">Privacy Policy updated: ${this.privacyPolicyDate}</p>
                    </div>

                    <div class="consent-actions">
                        <button class="consent-btn consent-reject-all">Reject All</button>
                        <button class="consent-btn consent-customize">Customize</button>
                        <button class="consent-btn consent-accept-all primary">Accept All</button>
                    </div>

                    <div class="consent-footer">
                        <p><small>⚠️ Extension will not function without essential consent. You can change these settings anytime in the extension options.</small></p>
                    </div>
                </div>
            </div>
        `;

        this.injectConsentStyles();
        return modal;
    }

    updateAgeVerificationUI(modal, isMinor) {
        const ageSection = modal.querySelector('.age-verification-section');
        const consentContent = modal.querySelector('.consent-content');
        const minorNotice = modal.querySelector('.minor-notice');
        
        // Hide age buttons, show results
        ageSection.querySelector('.age-buttons').style.display = 'none';
        
        if (isMinor) {
            minorNotice.style.display = 'block';
            // For minors, only allow essential functionality
            Object.keys(this.consentTypes).forEach(key => {
                if (key !== 'essential') {
                    this.consentTypes[key].required = false;
                }
            });
        }
        
        consentContent.style.display = 'block';
    }

    generateConsentOptionsHTML() {
        return Object.entries(this.consentTypes).map(([key, consent]) => `
            <div class="consent-option">
                <div class="consent-option-header">
                    <span class="consent-name">${consent.name}</span>
                    ${consent.required ? '<span class="required-badge">Required</span>' : ''}
                </div>
                <p class="consent-description">${consent.description}</p>
            </div>
        `).join('');
    }

    showGranularConsentOptions(modal, handleConsent) {
        const granularModal = document.createElement('div');
        granularModal.className = 'granular-consent-overlay';
        granularModal.innerHTML = `
            <div class="granular-consent-modal">
                <div class="granular-header">
                    <h3>Customize Your Privacy</h3>
                    <p>Choose exactly what data you're comfortable sharing:</p>
                </div>
                
                <div class="granular-options">
                    ${this.generateGranularOptionsHTML()}
                </div>
                
                <div class="granular-actions">
                    <button class="consent-btn granular-back">Back</button>
                    <button class="consent-btn granular-save primary">Save Preferences</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(granularModal);
        
        granularModal.querySelector('.granular-back').addEventListener('click', () => {
            granularModal.remove();
        });
        
        granularModal.querySelector('.granular-save').addEventListener('click', () => {
            const customConsents = {};
            granularModal.querySelectorAll('.granular-checkbox').forEach(checkbox => {
                customConsents[checkbox.dataset.consentType] = checkbox.checked;
            });
            
            granularModal.remove();
            handleConsent(true, customConsents);
        });
    }

    generateGranularOptionsHTML() {
        return Object.entries(this.consentTypes).map(([key, consent]) => `
            <div class="granular-option">
                <label class="granular-label">
                    <input type="checkbox" 
                           class="granular-checkbox" 
                           data-consent-type="${key}"
                           ${consent.required ? 'checked disabled' : ''}
                           ${key === 'essential' ? 'checked disabled' : ''}>
                    <div class="granular-option-content">
                        <div class="granular-name">
                            ${consent.name}
                            ${consent.required ? '<span class="required-badge">Required</span>' : ''}
                        </div>
                        <div class="granular-description">${consent.description}</div>
                    </div>
                </label>
            </div>
        `).join('');
    }

    async saveConsentStatus() {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                return;
            }

            await chrome.storage.local.set({
                consentStatus: this.consentTypes,
                consentTimestamp: Date.now(),
                consentVersion: this.consentVersion,
                ageVerification: {
                    verified: this.ageVerified,
                    isMinor: this.isMinor,
                    timestamp: Date.now()
                }
            });

            console.log('Consent status saved:', this.consentTypes);
        } catch (error) {
            console.error('Failed to save consent status:', error);
        }
    }

    blockAllDataCollection() {
        // Disable all tracking/analytics
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'blockDataCollection',
                reason: 'No consent granted'
            });
        }
        
        // Set flag to prevent any data collection
        window.MYAYAI_DATA_COLLECTION_BLOCKED = true;
        console.log('🔒 Data collection BLOCKED - No consent');
    }

    enableDataCollection() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'enableDataCollection',
                consents: this.consentTypes
            });
        }
        
        window.MYAYAI_DATA_COLLECTION_BLOCKED = false;
        console.log('✅ Data collection enabled with consents:', this.consentTypes);
    }

    showConsentRequired() {
        const notice = document.createElement('div');
        notice.className = 'consent-required-notice';
        notice.innerHTML = `
            <div class="notice-content">
                <h4>⚠️ Consent Required</h4>
                <p>You must provide consent to use this extension. We respect your privacy and won't collect any data without permission.</p>
            </div>
        `;
        
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 3000);
    }

    // Public API methods
    async updateConsent(consentType, granted) {
        if (this.consentTypes[consentType] && !this.consentTypes[consentType].required) {
            this.consentTypes[consentType].granted = granted;
            await this.saveConsentStatus();
            
            // Update data collection permissions
            if (granted) {
                this.enableDataCollection();
            }
            
            return true;
        }
        return false;
    }

    async revokeAllConsent() {
        Object.keys(this.consentTypes).forEach(key => {
            this.consentTypes[key].granted = key === 'essential';
        });
        
        await this.saveConsentStatus();
        this.blockAllDataCollection();
        
        // Show confirmation
        this.showConsentRevoked();
    }

    showConsentRevoked() {
        const notice = document.createElement('div');
        notice.className = 'consent-revoked-notice';
        notice.innerHTML = `
            <div class="notice-content">
                <h4>✅ Consent Revoked</h4>
                <p>Your consent has been revoked. Only essential functionality will remain active.</p>
            </div>
        `;
        
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 4000);
    }

    getConsentStatus() {
        return {
            hasValidConsent: this.hasValidConsent(),
            consents: this.consentTypes,
            timestamp: Date.now(),
            version: this.consentVersion,
            ageVerified: this.ageVerified,
            isMinor: this.isMinor
        };
    }

    injectConsentStyles() {
        if (document.getElementById('consent-modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'consent-modal-styles';
        styles.textContent = `
            .consent-modal-overlay, .granular-consent-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .consent-modal, .granular-consent-modal {
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                position: relative;
            }
            
            .consent-header {
                text-align: center;
                margin-bottom: 24px;
                position: relative;
            }
            
            .consent-logo {
                font-size: 48px;
                margin-bottom: 16px;
            }
            
            .consent-header h2 {
                margin: 0 0 8px 0;
                color: #1f2937;
                font-size: 24px;
                font-weight: 600;
            }
            
            .consent-required-badge {
                background: #ef4444;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                display: inline-block;
            }
            
            .age-verification-section {
                margin-bottom: 24px;
                padding: 20px;
                border: 2px solid #f3f4f6;
                border-radius: 12px;
                background: #f9fafb;
            }
            
            .age-verification-section h3 {
                margin: 0 0 8px 0;
                color: #1f2937;
                font-size: 18px;
            }
            
            .age-buttons {
                display: flex;
                gap: 12px;
                margin-top: 16px;
            }
            
            .age-btn {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #3b82f6;
                border-radius: 8px;
                background: white;
                color: #3b82f6;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .age-btn:hover {
                background: #3b82f6;
                color: white;
            }
            
            .minor-notice {
                background: #fef3c7;
                color: #92400e;
                padding: 12px;
                border-radius: 8px;
                margin-top: 12px;
                font-size: 14px;
            }
            
            .privacy-notice {
                background: #ecfdf5;
                border: 1px solid #10b981;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
            }
            
            .privacy-notice h3 {
                margin: 0 0 12px 0;
                color: #065f46;
                font-size: 18px;
            }
            
            .privacy-notice p {
                margin: 8px 0;
                color: #047857;
                line-height: 1.6;
            }
            
            .data-collection-info {
                margin-bottom: 24px;
            }
            
            .data-collection-info h4 {
                margin: 0 0 16px 0;
                color: #1f2937;
                font-size: 16px;
            }
            
            .consent-options {
                display: grid;
                gap: 12px;
            }
            
            .consent-option {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                background: #fafafa;
            }
            
            .consent-option-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
            }
            
            .consent-name {
                font-weight: 600;
                color: #1f2937;
            }
            
            .required-badge {
                background: #f59e0b;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
            }
            
            .consent-description {
                color: #6b7280;
                font-size: 14px;
                margin: 0;
                line-height: 1.5;
            }
            
            .privacy-rights {
                background: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
            }
            
            .privacy-rights h4 {
                margin: 0 0 12px 0;
                color: #0c4a6e;
                font-size: 16px;
            }
            
            .privacy-rights ul {
                margin: 0;
                padding: 0;
                list-style: none;
            }
            
            .privacy-rights li {
                color: #075985;
                margin: 8px 0;
                font-size: 14px;
            }
            
            .privacy-links {
                text-align: center;
                margin-bottom: 24px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
            }
            
            .privacy-links a {
                color: #3b82f6;
                text-decoration: none;
            }
            
            .privacy-links a:hover {
                text-decoration: underline;
            }
            
            .policy-date {
                font-size: 12px;
                color: #6b7280;
                margin-top: 8px;
            }
            
            .consent-actions {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .consent-btn {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #d1d5db;
                border-radius: 8px;
                background: white;
                color: #374151;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .consent-btn:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
            }
            
            .consent-btn.primary {
                background: #3b82f6;
                border-color: #3b82f6;
                color: white;
            }
            
            .consent-btn.primary:hover {
                background: #2563eb;
                border-color: #2563eb;
            }
            
            .consent-reject-all {
                background: #ef4444 !important;
                border-color: #ef4444 !important;
                color: white !important;
            }
            
            .consent-reject-all:hover {
                background: #dc2626 !important;
                border-color: #dc2626 !important;
            }
            
            .consent-footer {
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
            
            .granular-options {
                margin: 20px 0;
            }
            
            .granular-option {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 12px;
                overflow: hidden;
            }
            
            .granular-label {
                display: block;
                padding: 16px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .granular-label:hover {
                background: #f9fafb;
            }
            
            .granular-checkbox {
                margin-right: 12px;
            }
            
            .granular-option-content {
                display: inline-block;
                vertical-align: top;
                width: calc(100% - 32px);
            }
            
            .granular-name {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
            }
            
            .granular-description {
                color: #6b7280;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .consent-required-notice, .consent-revoked-notice {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fee2e2;
                border: 1px solid #fecaca;
                border-left: 4px solid #ef4444;
                border-radius: 8px;
                padding: 16px;
                max-width: 300px;
                z-index: 1000000;
                animation: slideIn 0.3s ease-out;
            }
            
            .consent-revoked-notice {
                background: #f0fdf4;
                border-color: #bbf7d0;
                border-left-color: #10b981;
            }
            
            .notice-content h4 {
                margin: 0 0 8px 0;
                color: #1f2937;
                font-size: 14px;
            }
            
            .notice-content p {
                margin: 0;
                color: #6b7280;
                font-size: 13px;
                line-height: 1.4;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Initialize consent manager immediately
const consentManager = new ConsentManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MyAyAIConsentManager = consentManager;
}

// Utility function for other scripts to check consent
window.checkMyAyAIConsent = (type) => {
    return consentManager.canCollectData(type);
};

// Block data collection flag for immediate checking
window.MYAYAI_DATA_COLLECTION_BLOCKED = true;
