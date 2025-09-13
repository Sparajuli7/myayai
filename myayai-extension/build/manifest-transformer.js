/**
 * Manifest Transformer
 * Converts between Manifest V2 and V3 for different browsers
 */

class ManifestTransformer {
  constructor() {
    this.browserSpecificFeatures = {
      chrome: {
        manifestVersion: 3,
        permissions: ['storage', 'activeTab', 'scripting'],
        hostPermissions: true,
        serviceWorker: true,
        action: true
      },
      firefox: {
        manifestVersion: 2,
        permissions: ['storage', 'activeTab', '<all_urls>'],
        hostPermissions: false,
        serviceWorker: false,
        action: false,
        browserAction: true
      },
      safari: {
        manifestVersion: 3,
        permissions: ['storage', 'activeTab', 'scripting'],
        hostPermissions: true,
        serviceWorker: true,
        action: true,
        safariSpecific: true
      }
    };
  }

  /**
   * Transform manifest for specific browser
   * @param {string} manifestContent - Original manifest content
   * @param {string} browser - Target browser (chrome, firefox, safari)
   * @param {object} env - Environment variables
   * @returns {string} - Transformed manifest
   */
  transform(manifestContent, browser = 'chrome', env = {}) {
    const manifest = JSON.parse(manifestContent);
    const browserConfig = this.browserSpecificFeatures[browser];

    if (!browserConfig) {
      throw new Error(`Unsupported browser: ${browser}`);
    }

    let transformedManifest;

    switch (browser) {
      case 'firefox':
        transformedManifest = this.transformForFirefox(manifest, env);
        break;
      case 'chrome':
      case 'edge':
      case 'brave':
      case 'opera':
        transformedManifest = this.transformForChrome(manifest, env);
        break;
      case 'safari':
        transformedManifest = this.transformForSafari(manifest, env);
        break;
      default:
        transformedManifest = manifest;
    }

    return JSON.stringify(transformedManifest, null, 2);
  }

  /**
   * Transform for Firefox (Manifest V2)
   */
  transformForFirefox(manifest, env) {
    const firefoxManifest = {
      ...manifest,
      manifest_version: 2
    };

    // Convert permissions structure
    if (manifest.host_permissions && manifest.permissions) {
      firefoxManifest.permissions = [
        ...manifest.permissions,
        ...manifest.host_permissions
      ];
      delete firefoxManifest.host_permissions;
    }

    // Convert action to browser_action
    if (manifest.action) {
      firefoxManifest.browser_action = {
        ...manifest.action
      };
      delete firefoxManifest.action;
    }

    // Convert service worker to background scripts
    if (manifest.background && manifest.background.service_worker) {
      firefoxManifest.background = {
        scripts: [manifest.background.service_worker],
        persistent: false
      };
    }

    // Convert web_accessible_resources format
    if (manifest.web_accessible_resources) {
      const resources = [];
      manifest.web_accessible_resources.forEach(resource => {
        if (resource.resources) {
          resources.push(...resource.resources);
        }
      });
      firefoxManifest.web_accessible_resources = resources;
    }

    // Firefox-specific CSP
    if (manifest.content_security_policy && manifest.content_security_policy.extension_pages) {
      firefoxManifest.content_security_policy = manifest.content_security_policy.extension_pages;
    }

    // Add Firefox-specific fields
    firefoxManifest.applications = {
      gecko: {
        id: "myayai@myayai.com",
        strict_min_version: "109.0"
      }
    };

    // Remove Chrome-specific fields
    delete firefoxManifest.minimum_chrome_version;

    return firefoxManifest;
  }

  /**
   * Transform for Chrome/Edge/Brave/Opera (Manifest V3)
   */
  transformForChrome(manifest, env) {
    const chromeManifest = {
      ...manifest,
      manifest_version: 3
    };

    // Ensure proper permissions structure
    if (!chromeManifest.host_permissions && chromeManifest.permissions) {
      const hostPerms = chromeManifest.permissions.filter(perm => 
        perm.includes('://') || perm.includes('*')
      );
      const regularPerms = chromeManifest.permissions.filter(perm => 
        !perm.includes('://') && !perm.includes('*')
      );

      if (hostPerms.length > 0) {
        chromeManifest.host_permissions = hostPerms;
        chromeManifest.permissions = regularPerms;
      }
    }

    // Ensure action is used instead of browser_action
    if (manifest.browser_action) {
      chromeManifest.action = {
        ...manifest.browser_action
      };
      delete chromeManifest.browser_action;
    }

    // Ensure service worker format
    if (chromeManifest.background && chromeManifest.background.scripts) {
      chromeManifest.background = {
        service_worker: chromeManifest.background.scripts[0],
        type: "module"
      };
    }

    // Ensure proper web_accessible_resources format
    if (chromeManifest.web_accessible_resources && Array.isArray(chromeManifest.web_accessible_resources[0])) {
      // Convert from V2 format
      const resources = chromeManifest.web_accessible_resources;
      chromeManifest.web_accessible_resources = [{
        resources: resources,
        matches: chromeManifest.content_scripts ? 
          chromeManifest.content_scripts[0].matches : 
          ["<all_urls>"]
      }];
    }

    // Remove Firefox-specific fields
    delete chromeManifest.applications;
    
    return chromeManifest;
  }

  /**
   * Transform for Safari (Future support)
   */
  transformForSafari(manifest, env) {
    // Start with Chrome V3 base
    const safariManifest = this.transformForChrome(manifest, env);
    
    // Add Safari-specific configurations
    safariManifest.safari_specific = {
      minimum_version: "16.0"
    };

    // Safari may have different permission requirements
    safariManifest.permissions = safariManifest.permissions || [];
    
    return safariManifest;
  }

  /**
   * Validate transformed manifest
   */
  validate(manifest, browser) {
    const browserConfig = this.browserSpecificFeatures[browser];
    
    if (!browserConfig) {
      throw new Error(`Unknown browser: ${browser}`);
    }

    const parsed = typeof manifest === 'string' ? JSON.parse(manifest) : manifest;

    // Basic validation
    if (parsed.manifest_version !== browserConfig.manifestVersion) {
      console.warn(`Manifest version mismatch for ${browser}. Expected: ${browserConfig.manifestVersion}, Got: ${parsed.manifest_version}`);
    }

    // Browser-specific validation
    switch (browser) {
      case 'firefox':
        if (parsed.action) {
          console.warn('Firefox manifest contains "action" field, should use "browser_action"');
        }
        if (parsed.background && parsed.background.service_worker) {
          console.warn('Firefox manifest contains service_worker, should use background scripts');
        }
        break;
      
      case 'chrome':
      case 'edge':
      case 'brave':
      case 'opera':
        if (parsed.browser_action) {
          console.warn('Chrome manifest contains "browser_action" field, should use "action"');
        }
        if (parsed.background && parsed.background.scripts) {
          console.warn('Chrome manifest contains background scripts, should use service_worker');
        }
        break;
    }

    return true;
  }

  /**
   * Get recommended permissions for browser
   */
  getRecommendedPermissions(browser) {
    return this.browserSpecificFeatures[browser]?.permissions || [];
  }
}

module.exports = new ManifestTransformer();
