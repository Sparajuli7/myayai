/**
 * Unit tests for Platform Detection System
 */

describe('PlatformDetectors', () => {
  let platformDetectors;
  let mockElement;

  beforeEach(() => {
    // Load the class
    require('../../content/platform-detectors.js');
    platformDetectors = new window.PlatformDetectors();

    // Create mock DOM element
    mockElement = {
      tagName: 'TEXTAREA',
      value: '',
      disabled: false,
      readOnly: false,
      getBoundingClientRect: () => ({
        width: 500,
        height: 100,
        left: 100,
        right: 600,
        top: 200,
        bottom: 300
      }),
      style: {},
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      closest: jest.fn(),
      parentElement: document.createElement('div')
    };

    // Mock getComputedStyle
    global.getComputedStyle = jest.fn(() => ({
      display: 'block',
      visibility: 'visible',
      opacity: '1'
    }));

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  describe('Platform Detection', () => {
    it('should detect ChatGPT platform correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'chat.openai.com' }
      });

      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('chatgpt');
      expect(platform.name).toBe('ChatGPT');
      expect(platform.domains).toContain('chat.openai.com');
    });

    it('should detect Claude platform correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'claude.ai' }
      });

      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('claude');
      expect(platform.name).toBe('Claude');
    });

    it('should detect Perplexity platform correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.perplexity.ai' }
      });

      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('perplexity');
      expect(platform.name).toBe('Perplexity');
    });

    it('should detect Gemini platform correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'gemini.google.com' }
      });

      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('gemini');
      expect(platform.name).toBe('Gemini');
    });

    it('should detect Copilot platform correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'copilot.microsoft.com' }
      });

      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('copilot');
      expect(platform.name).toBe('Copilot');
    });

    it('should detect Poe platform correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'poe.com' }
      });

      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('poe');
      expect(platform.name).toBe('Poe');
    });

    it('should detect Character.AI platform correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'character.ai' }
      });

      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('characterai');
      expect(platform.name).toBe('Character.AI');
    });

    it('should return null for unknown platforms', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'unknown.com' }
      });

      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform).toBeNull();
    });
  });

  describe('Input Detection', () => {
    it('should detect visible input elements', () => {
      const isVisible = platformDetectors.isInputVisible(mockElement);
      expect(isVisible).toBe(true);
    });

    it('should reject hidden input elements', () => {
      global.getComputedStyle = jest.fn(() => ({
        display: 'none',
        visibility: 'visible',
        opacity: '1'
      }));

      const isVisible = platformDetectors.isInputVisible(mockElement);
      expect(isVisible).toBe(false);
    });

    it('should reject disabled input elements', () => {
      mockElement.disabled = true;
      const isVisible = platformDetectors.isInputVisible(mockElement);
      expect(isVisible).toBe(false);
    });

    it('should reject readonly input elements', () => {
      mockElement.readOnly = true;
      const isVisible = platformDetectors.isInputVisible(mockElement);
      expect(isVisible).toBe(false);
    });

    it('should identify likely main input', () => {
      const isMainInput = platformDetectors.isLikelyMainInput(mockElement);
      expect(isMainInput).toBe(true);
    });

    it('should reject small input elements', () => {
      mockElement.getBoundingClientRect = () => ({
        width: 50,
        height: 20,
        left: 100,
        right: 150,
        top: 200,
        bottom: 220
      });

      const isMainInput = platformDetectors.isLikelyMainInput(mockElement);
      expect(isMainInput).toBe(false);
    });
  });

  describe('Content Management', () => {
    it('should get content from textarea', () => {
      mockElement.value = 'Test content';
      const content = platformDetectors.getInputContent(mockElement);
      expect(content).toBe('Test content');
    });

    it('should get content from contenteditable div', () => {
      const divElement = {
        tagName: 'DIV',
        contentEditable: 'true',
        textContent: 'Editable content',
        innerText: 'Editable content'
      };

      const content = platformDetectors.getInputContent(divElement);
      expect(content).toBe('Editable content');
    });

    it('should set content in textarea', () => {
      const success = platformDetectors.setInputContent(mockElement, 'New content');
      expect(success).toBe(true);
      expect(mockElement.value).toBe('New content');
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(2);
    });

    it('should set content in contenteditable div', () => {
      const divElement = {
        tagName: 'DIV',
        contentEditable: 'true',
        textContent: '',
        dispatchEvent: jest.fn()
      };

      const success = platformDetectors.setInputContent(divElement, 'New content');
      expect(success).toBe(true);
      expect(divElement.textContent).toBe('New content');
      expect(divElement.dispatchEvent).toHaveBeenCalledTimes(3);
    });

    it('should check minimum content threshold', () => {
      mockElement.value = 'Short text';
      expect(platformDetectors.hasMinimumContent(mockElement, 5)).toBe(true);
      expect(platformDetectors.hasMinimumContent(mockElement, 15)).toBe(false);
    });
  });

  describe('Input Monitoring', () => {
    it('should set up input monitoring with callback', () => {
      const callback = jest.fn();
      const removeListener = platformDetectors.monitorInputChanges(callback);

      expect(typeof removeListener).toBe('function');

      // Simulate input event
      const mockEvent = {
        target: mockElement,
        type: 'input'
      };

      // Since we can't easily trigger real events, we verify the setup
      expect(document.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Container Detection', () => {
    it('should find input container', () => {
      const formElement = document.createElement('form');
      formElement.appendChild(mockElement.parentElement);
      mockElement.closest = jest.fn().mockReturnValue(formElement);

      const container = platformDetectors.getInputContainer(mockElement);
      expect(container).toBe(formElement);
    });

    it('should fallback to parent element if no form found', () => {
      mockElement.closest = jest.fn().mockReturnValue(null);
      
      const container = platformDetectors.getInputContainer(mockElement);
      expect(container).toBe(mockElement.parentElement);
    });
  });

  describe('Performance', () => {
    it('should complete platform detection under 10ms', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'chat.openai.com' }
      });

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        platformDetectors.detectCurrentPlatform();
      }
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Allow 0.1ms per detection
    });

    it('should efficiently find inputs', () => {
      document.querySelector = jest.fn().mockReturnValue(mockElement);

      const start = performance.now();
      platformDetectors.findActiveInput();
      const end = performance.now();

      expect(end - start).toBeLessThan(10);
    });
  });
});
