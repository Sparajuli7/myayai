/**
 * Accessibility Manager - Ensures WCAG 2.1 AA compliance
 * Handles keyboard navigation, ARIA attributes, screen readers, and focus management
 */

class AccessibilityManager {
  constructor() {
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.trapFocus = false;
    this.announcements = [];
    this.keyboardShortcuts = new Map();
    this.highContrastMode = false;
    this.reducedMotion = false;
    
    this.init();
  }

  init() {
    this.detectUserPreferences();
    this.setupKeyboardNavigation();
    this.setupARIALiveRegion();
    this.setupFocusManagement();
    this.setupKeyboardShortcuts();
    this.enhanceExistingElements();
    this.setupColorContrastToggle();
  }

  // Detect user accessibility preferences
  detectUserPreferences() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.reducedMotion = true;
      document.documentElement.classList.add('reduce-motion');
      
      // Disable animations in performance manager
      if (window.performanceManager) {
        window.performanceManager.pauseAnimations();
      }
    }

    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.highContrastMode = true;
      document.documentElement.classList.add('high-contrast');
    }

    // Check for color scheme preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkModeQuery.matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.highContrastMode = e.matches;
      document.documentElement.classList.toggle('high-contrast', e.matches);
    });
  }

  // Setup ARIA live region for screen reader announcements
  setupARIALiveRegion() {
    let liveRegion = document.getElementById('aria-live-region');
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    this.liveRegion = liveRegion;
  }

  // Announce message to screen readers
  announce(message, priority = 'polite') {
    if (!message || !this.liveRegion) return;

    // Clear any pending announcements
    clearTimeout(this.announceTimeout);

    // Set the priority level
    this.liveRegion.setAttribute('aria-live', priority);

    // Clear and set new message
    this.liveRegion.textContent = '';
    
    this.announceTimeout = setTimeout(() => {
      this.liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        this.liveRegion.textContent = '';
      }, 1000);
    }, 100);
  }

  // Setup keyboard navigation
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Tab':
          this.handleTabNavigation(e);
          break;
        case 'Escape':
          this.handleEscapeKey(e);
          break;
        case 'Enter':
        case ' ':
          this.handleActivation(e);
          break;
        case 'ArrowDown':
        case 'ArrowUp':
          this.handleArrowNavigation(e);
          break;
        case 'Home':
        case 'End':
          this.handleHomeEndNavigation(e);
          break;
      }
    });

    // Visual focus indicators
    document.addEventListener('focusin', (e) => {
      e.target.classList.add('keyboard-focused');
    });

    document.addEventListener('focusout', (e) => {
      e.target.classList.remove('keyboard-focused');
    });

    // Mouse focus should not show keyboard focus styles
    document.addEventListener('mousedown', (e) => {
      e.target.classList.add('mouse-focused');
    });

    document.addEventListener('mouseup', (e) => {
      setTimeout(() => {
        e.target.classList.remove('mouse-focused');
      }, 100);
    });
  }

  // Handle Tab navigation
  handleTabNavigation(e) {
    this.updateFocusableElements();
    
    if (this.trapFocus && this.focusableElements.length > 0) {
      e.preventDefault();
      
      let nextIndex;
      if (e.shiftKey) {
        // Backward navigation
        nextIndex = this.currentFocusIndex > 0 
          ? this.currentFocusIndex - 1 
          : this.focusableElements.length - 1;
      } else {
        // Forward navigation
        nextIndex = this.currentFocusIndex < this.focusableElements.length - 1 
          ? this.currentFocusIndex + 1 
          : 0;
      }
      
      this.focusableElements[nextIndex].focus();
      this.currentFocusIndex = nextIndex;
    }
  }

  // Handle Escape key
  handleEscapeKey(e) {
    // Close any open modals or dropdowns
    const openModal = document.querySelector('.modal.show, .dropdown.open, .tooltip.show');
    if (openModal) {
      openModal.classList.remove('show', 'open');
      this.announce('Dialog closed');
      
      // Return focus to trigger element
      const trigger = openModal.dataset.trigger;
      if (trigger) {
        const triggerElement = document.getElementById(trigger);
        if (triggerElement) {
          triggerElement.focus();
        }
      }
    }

    // Exit focus trap
    if (this.trapFocus) {
      this.disableFocusTrap();
    }
  }

  // Handle Enter and Space activation
  handleActivation(e) {
    const target = e.target;
    
    // Don't interfere with native button/link behavior
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
      return;
    }

    // Handle custom interactive elements
    if (target.getAttribute('role') === 'button' || target.getAttribute('tabindex') === '0') {
      e.preventDefault();
      target.click();
    }

    // Handle achievement items
    if (target.classList.contains('achievement-item')) {
      e.preventDefault();
      target.click();
      this.announce(`Achievement details: ${target.getAttribute('aria-label') || target.textContent}`);
    }
  }

  // Handle arrow key navigation for lists/grids
  handleArrowNavigation(e) {
    const target = e.target;
    const parent = target.closest('[role="grid"], [role="listbox"], [role="menu"], .achievements-grid');
    
    if (!parent) return;

    e.preventDefault();
    
    const items = parent.querySelectorAll('[tabindex], button, [role="gridcell"], [role="option"], [role="menuitem"]');
    const currentIndex = Array.from(items).indexOf(target);
    
    let newIndex;
    if (e.key === 'ArrowDown') {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    }
    
    if (newIndex !== undefined && items[newIndex]) {
      items[newIndex].focus();
    }
  }

  // Handle Home/End navigation
  handleHomeEndNavigation(e) {
    const target = e.target;
    const parent = target.closest('[role="grid"], [role="listbox"], [role="menu"]');
    
    if (!parent) return;

    e.preventDefault();
    
    const items = parent.querySelectorAll('[tabindex], button, [role="gridcell"], [role="option"], [role="menuitem"]');
    
    if (e.key === 'Home' && items[0]) {
      items[0].focus();
    } else if (e.key === 'End' && items[items.length - 1]) {
      items[items.length - 1].focus();
    }
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    // Alt + M: Toggle master switch
    this.addKeyboardShortcut('Alt+KeyM', () => {
      const masterToggle = document.getElementById('master-toggle');
      if (masterToggle) {
        masterToggle.checked = !masterToggle.checked;
        masterToggle.dispatchEvent(new Event('change'));
        this.announce(`Extension ${masterToggle.checked ? 'enabled' : 'disabled'}`);
      }
    });

    // Alt + T: Toggle theme
    this.addKeyboardShortcut('Alt+KeyT', () => {
      const themeSelector = document.getElementById('theme-selector');
      if (themeSelector) {
        const options = themeSelector.options;
        const currentIndex = themeSelector.selectedIndex;
        const nextIndex = (currentIndex + 1) % options.length;
        themeSelector.selectedIndex = nextIndex;
        themeSelector.dispatchEvent(new Event('change'));
        this.announce(`Theme changed to ${options[nextIndex].textContent}`);
      }
    });

    // Alt + E: Export data
    this.addKeyboardShortcut('Alt+KeyE', () => {
      const exportButton = document.getElementById('export-data');
      if (exportButton) {
        exportButton.click();
      }
    });

    // Alt + H: Show help/shortcuts
    this.addKeyboardShortcut('Alt+KeyH', () => {
      this.showKeyboardShortcuts();
    });

    // Setup shortcut listener
    document.addEventListener('keydown', (e) => {
      const shortcut = this.getShortcutKey(e);
      if (this.keyboardShortcuts.has(shortcut)) {
        e.preventDefault();
        this.keyboardShortcuts.get(shortcut)();
      }
    });
  }

  // Add keyboard shortcut
  addKeyboardShortcut(combination, callback) {
    this.keyboardShortcuts.set(combination, callback);
  }

  // Get shortcut key combination
  getShortcutKey(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    parts.push(e.code);
    return parts.join('+');
  }

  // Show keyboard shortcuts help
  showKeyboardShortcuts() {
    const shortcuts = [
      { key: 'Tab', description: 'Navigate through elements' },
      { key: 'Shift + Tab', description: 'Navigate backward' },
      { key: 'Enter / Space', description: 'Activate buttons and links' },
      { key: 'Escape', description: 'Close modals and dialogs' },
      { key: 'Arrow Keys', description: 'Navigate within grids and lists' },
      { key: 'Alt + M', description: 'Toggle extension on/off' },
      { key: 'Alt + T', description: 'Change theme' },
      { key: 'Alt + E', description: 'Export data' },
      { key: 'Alt + H', description: 'Show this help' }
    ];

    const helpContent = shortcuts.map(s => `${s.key}: ${s.description}`).join('\n');
    this.announce(`Keyboard shortcuts: ${helpContent}`, 'assertive');

    // Could also show visual help dialog
    console.info('MyAyAI Keyboard Shortcuts:', shortcuts);
  }

  // Focus management
  updateFocusableElements() {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])'
    ].join(',');

    this.focusableElements = Array.from(document.querySelectorAll(focusableSelectors))
      .filter(el => this.isElementVisible(el));

    // Update current focus index
    const activeElement = document.activeElement;
    this.currentFocusIndex = this.focusableElements.indexOf(activeElement);
  }

  // Check if element is visible and focusable
  isElementVisible(element) {
    const style = getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetParent !== null;
  }

  // Enable focus trapping (for modals)
  enableFocusTrap(container) {
    this.trapFocus = true;
    this.focusContainer = container;
    this.updateFocusableElements();
    
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
      this.currentFocusIndex = 0;
    }
  }

  // Disable focus trapping
  disableFocusTrap() {
    this.trapFocus = false;
    this.focusContainer = null;
  }

  // Enhance existing elements with accessibility features
  enhanceExistingElements() {
    // Add ARIA labels to buttons without text
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.textContent.trim()) {
        const icon = button.querySelector('i, .icon');
        if (icon) {
          const ariaLabel = this.getAriaLabelFromIcon(icon.className);
          if (ariaLabel) {
            button.setAttribute('aria-label', ariaLabel);
          }
        }
      }
    });

    // Enhance metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
      if (!card.getAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }
      
      if (!card.getAttribute('role')) {
        card.setAttribute('role', 'button');
      }

      const metricType = card.dataset.metric || `metric-${index + 1}`;
      const value = card.querySelector('.metric-value')?.textContent || '';
      const label = card.querySelector('.metric-label')?.textContent || '';
      
      if (!card.getAttribute('aria-label')) {
        card.setAttribute('aria-label', `${label}: ${value}. Click for details.`);
      }
    });

    // Enhance achievement items
    const achievements = document.querySelectorAll('.achievement-item');
    achievements.forEach((achievement, index) => {
      if (!achievement.getAttribute('tabindex')) {
        achievement.setAttribute('tabindex', '0');
      }
      
      if (!achievement.getAttribute('role')) {
        achievement.setAttribute('role', 'button');
      }

      const icon = achievement.querySelector('.achievement-icon')?.textContent || '';
      const title = achievement.querySelector('.achievement-title')?.textContent || `Achievement ${index + 1}`;
      const isUnlocked = !achievement.classList.contains('locked');
      
      const ariaLabel = `${title} achievement ${isUnlocked ? 'unlocked' : 'locked'}. ${icon}. Click for details.`;
      achievement.setAttribute('aria-label', ariaLabel);
    });

    // Enhance form controls
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.getAttribute('aria-label') && !input.labels?.length) {
        const placeholder = input.getAttribute('placeholder');
        const id = input.id;
        
        if (placeholder) {
          input.setAttribute('aria-label', placeholder);
        } else if (id) {
          // Try to find associated label text
          const label = document.querySelector(`label[for="${id}"]`);
          if (!label) {
            const nearbyText = this.findNearbyLabelText(input);
            if (nearbyText) {
              input.setAttribute('aria-label', nearbyText);
            }
          }
        }
      }
    });

    // Enhance progress bars
    const progressBars = document.querySelectorAll('.progress-bar, .xp-fill');
    progressBars.forEach(bar => {
      if (!bar.getAttribute('role')) {
        bar.setAttribute('role', 'progressbar');
      }
      
      // Add aria-valuenow, aria-valuemin, aria-valuemax if not present
      if (!bar.getAttribute('aria-valuenow')) {
        const width = parseFloat(bar.style.width) || 0;
        bar.setAttribute('aria-valuenow', width);
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');
      }
    });
  }

  // Find nearby text that could serve as label
  findNearbyLabelText(element) {
    const parent = element.parentElement;
    if (!parent) return null;

    // Look for text in parent
    const textNodes = Array.from(parent.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
      .map(node => node.textContent.trim());
    
    if (textNodes.length > 0) {
      return textNodes[0];
    }

    // Look for nearby elements with text
    const siblings = Array.from(parent.children);
    const elementIndex = siblings.indexOf(element);
    
    for (let i = elementIndex - 1; i >= 0; i--) {
      const sibling = siblings[i];
      if (sibling.textContent.trim()) {
        return sibling.textContent.trim();
      }
    }

    return null;
  }

  // Get ARIA label from icon class names
  getAriaLabelFromIcon(className) {
    const iconMap = {
      'fa-play': 'Play',
      'fa-pause': 'Pause',
      'fa-stop': 'Stop',
      'fa-settings': 'Settings',
      'fa-gear': 'Settings',
      'fa-cog': 'Settings',
      'fa-export': 'Export',
      'fa-download': 'Download',
      'fa-upload': 'Upload',
      'fa-trash': 'Delete',
      'fa-edit': 'Edit',
      'fa-close': 'Close',
      'fa-times': 'Close',
      'fa-menu': 'Menu',
      'fa-bars': 'Menu',
      'fa-home': 'Home',
      'fa-search': 'Search'
    };

    for (const [iconClass, label] of Object.entries(iconMap)) {
      if (className.includes(iconClass)) {
        return label;
      }
    }

    return null;
  }

  // Setup high contrast mode toggle
  setupColorContrastToggle() {
    // Add contrast toggle button if not exists
    let contrastToggle = document.getElementById('contrast-toggle');
    
    if (!contrastToggle) {
      contrastToggle = document.createElement('button');
      contrastToggle.id = 'contrast-toggle';
      contrastToggle.className = 'accessibility-toggle';
      contrastToggle.setAttribute('aria-label', 'Toggle high contrast mode');
      contrastToggle.textContent = '🎨';
      contrastToggle.style.position = 'fixed';
      contrastToggle.style.top = '10px';
      contrastToggle.style.right = '10px';
      contrastToggle.style.zIndex = '10000';
      contrastToggle.style.background = 'var(--surface)';
      contrastToggle.style.border = '2px solid var(--border)';
      contrastToggle.style.borderRadius = '4px';
      contrastToggle.style.padding = '8px';
      contrastToggle.style.cursor = 'pointer';
      
      document.body.appendChild(contrastToggle);
    }

    contrastToggle.addEventListener('click', () => {
      this.toggleHighContrast();
    });
  }

  // Toggle high contrast mode
  toggleHighContrast() {
    this.highContrastMode = !this.highContrastMode;
    document.documentElement.classList.toggle('high-contrast', this.highContrastMode);
    
    // Save preference
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ highContrast: this.highContrastMode });
    }

    this.announce(`High contrast mode ${this.highContrastMode ? 'enabled' : 'disabled'}`);
  }

  // Color contrast validation
  checkColorContrast(foreground, background) {
    const rgb1 = this.hexToRgb(foreground);
    const rgb2 = this.hexToRgb(background);
    
    if (!rgb1 || !rgb2) return null;

    const l1 = this.getRelativeLuminance(rgb1);
    const l2 = this.getRelativeLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    const ratio = (lighter + 0.05) / (darker + 0.05);
    
    return {
      ratio,
      AA: ratio >= 4.5,
      AAA: ratio >= 7,
      AALarge: ratio >= 3
    };
  }

  // Helper functions for contrast calculation
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  getRelativeLuminance({ r, g, b }) {
    const normalize = (color) => {
      color = color / 255;
      return color <= 0.03928 ? color / 12.92 : Math.pow((color + 0.055) / 1.055, 2.4);
    };

    const rNorm = normalize(r);
    const gNorm = normalize(g);
    const bNorm = normalize(b);

    return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
  }

  // Update progress bar accessibility
  updateProgressBarAccessibility(element, value, max = 100, label = '') {
    if (!element) return;

    element.setAttribute('aria-valuenow', value);
    element.setAttribute('aria-valuemax', max);
    element.setAttribute('aria-valuemin', '0');
    
    if (label) {
      element.setAttribute('aria-label', `${label}: ${value} out of ${max}`);
    }

    // Announce significant changes
    const percentage = Math.round((value / max) * 100);
    if (percentage % 25 === 0 && percentage > 0) {
      this.announce(`Progress: ${percentage}%`);
    }
  }

  // Cleanup
  destroy() {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    
    clearTimeout(this.announceTimeout);
    this.keyboardShortcuts.clear();
  }
}

// Global accessibility manager instance
window.AccessibilityManager = AccessibilityManager;
window.accessibilityManager = new AccessibilityManager();
