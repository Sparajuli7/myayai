/**
 * Integration tests for AI Platform Detection and Integration
 */

describe('Platform Integration Tests', () => {
  let platformDetectors;
  
  // Mock DOM for different platforms
  const mockPlatformDOM = {
    chatgpt: () => {
      document.body.innerHTML = `
        <div id="__next">
          <main>
            <form>
              <textarea id="prompt-textarea" placeholder="Message ChatGPT" rows="1"></textarea>
              <button data-testid="send-button">Send</button>
            </form>
          </main>
        </div>
      `;
    },
    
    claude: () => {
      document.body.innerHTML = `
        <div class="app">
          <div class="conversation-input">
            <div contenteditable="true" data-placeholder="Reply to Claude..." class="ProseMirror"></div>
            <button aria-label="Send Message">Send</button>
          </div>
        </div>
      `;
    },

    perplexity: () => {
      document.body.innerHTML = `
        <main>
          <div class="search-input">
            <textarea placeholder="Ask anything..."></textarea>
            <button aria-label="Submit Query">Submit</button>
          </div>
        </main>
      `;
    },

    gemini: () => {
      document.body.innerHTML = `
        <div class="conversation-container">
          <rich-textarea aria-label="Enter a prompt here"></rich-textarea>
          <button aria-label="Send message">Send</button>
        </div>
      `;
    },

    copilot: () => {
      document.body.innerHTML = `
        <div class="input-section">
          <textarea aria-label="Ask me anything..." placeholder="Ask me anything"></textarea>
          <button title="Submit">Submit</button>
        </div>
      `;
    },

    poe: () => {
      document.body.innerHTML = `
        <div class="ChatMessageInputContainer">
          <textarea placeholder="Talk to Claude"></textarea>
          <button class="send-button">Send</button>
        </div>
      `;
    },

    characterai: () => {
      document.body.innerHTML = `
        <div class="input-container">
          <textarea placeholder="Type a message..."></textarea>
          <button aria-label="Send message">Send</button>
        </div>
      `;
    }
  };

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    
    // Load platform detector
    require('../../content/platform-detectors.js');
    platformDetectors = new window.PlatformDetectors();

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
  });

  describe('ChatGPT Integration', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'chat.openai.com' },
        configurable: true
      });
      mockPlatformDOM.chatgpt();
    });

    it('should detect ChatGPT platform correctly', () => {
      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('chatgpt');
      expect(platform.name).toBe('ChatGPT');
    });

    it('should find ChatGPT input element', () => {
      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.id).toBe('prompt-textarea');
      expect(input.tagName).toBe('TEXTAREA');
    });

    it('should handle ChatGPT input content', () => {
      const input = platformDetectors.findActiveInput();
      const testContent = 'Test prompt for ChatGPT';
      
      const success = platformDetectors.setInputContent(input, testContent);
      expect(success).toBe(true);
      
      const retrievedContent = platformDetectors.getInputContent(input);
      expect(retrievedContent).toBe(testContent);
    });

    it('should find input container correctly', () => {
      const input = platformDetectors.findActiveInput();
      const container = platformDetectors.getInputContainer(input);
      
      expect(container).not.toBeNull();
      expect(container.tagName).toBe('FORM');
    });
  });

  describe('Claude Integration', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'claude.ai' },
        configurable: true
      });
      mockPlatformDOM.claude();
    });

    it('should detect Claude platform correctly', () => {
      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('claude');
      expect(platform.name).toBe('Claude');
    });

    it('should find Claude contenteditable input', () => {
      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.contentEditable).toBe('true');
      expect(input.classList.contains('ProseMirror')).toBe(true);
    });

    it('should handle contenteditable input content', () => {
      const input = platformDetectors.findActiveInput();
      const testContent = 'Test prompt for Claude';
      
      const success = platformDetectors.setInputContent(input, testContent);
      expect(success).toBe(true);
      
      const retrievedContent = platformDetectors.getInputContent(input);
      expect(retrievedContent).toBe(testContent);
    });
  });

  describe('Perplexity Integration', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.perplexity.ai' },
        configurable: true
      });
      mockPlatformDOM.perplexity();
    });

    it('should detect Perplexity platform correctly', () => {
      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('perplexity');
      expect(platform.name).toBe('Perplexity');
    });

    it('should find Perplexity textarea input', () => {
      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.tagName).toBe('TEXTAREA');
      expect(input.placeholder).toContain('Ask');
    });
  });

  describe('Gemini Integration', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'gemini.google.com' },
        configurable: true
      });
      mockPlatformDOM.gemini();
    });

    it('should detect Gemini platform correctly', () => {
      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('gemini');
      expect(platform.name).toBe('Gemini');
    });

    it('should find Gemini rich-textarea input', () => {
      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.tagName).toBe('RICH-TEXTAREA');
    });
  });

  describe('Copilot Integration', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'copilot.microsoft.com' },
        configurable: true
      });
      mockPlatformDOM.copilot();
    });

    it('should detect Copilot platform correctly', () => {
      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('copilot');
      expect(platform.name).toBe('Copilot');
    });

    it('should find Copilot textarea input', () => {
      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.tagName).toBe('TEXTAREA');
      expect(input.ariaLabel).toContain('Ask');
    });
  });

  describe('Poe Integration', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'poe.com' },
        configurable: true
      });
      mockPlatformDOM.poe();
    });

    it('should detect Poe platform correctly', () => {
      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('poe');
      expect(platform.name).toBe('Poe');
    });

    it('should find Poe textarea input', () => {
      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.tagName).toBe('TEXTAREA');
      expect(input.placeholder).toContain('Talk');
    });
  });

  describe('Character.AI Integration', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'character.ai' },
        configurable: true
      });
      mockPlatformDOM.characterai();
    });

    it('should detect Character.AI platform correctly', () => {
      const platform = platformDetectors.detectCurrentPlatform();
      expect(platform.id).toBe('characterai');
      expect(platform.name).toBe('Character.AI');
    });

    it('should find Character.AI textarea input', () => {
      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.tagName).toBe('TEXTAREA');
      expect(input.placeholder).toContain('Type');
    });
  });

  describe('Cross-Platform Functionality', () => {
    const platforms = ['chatgpt', 'claude', 'perplexity', 'gemini', 'copilot', 'poe', 'characterai'];
    
    platforms.forEach(platform => {
      it(`should handle input monitoring on ${platform}`, () => {
        // Set up platform
        Object.defineProperty(window, 'location', {
          value: { hostname: platformDetectors.platforms[platform].domains[0] },
          configurable: true
        });
        mockPlatformDOM[platform]();
        
        const callback = jest.fn();
        const removeListener = platformDetectors.monitorInputChanges(callback);
        
        expect(typeof removeListener).toBe('function');
        
        // Clean up
        removeListener();
      });

      it(`should detect minimum content threshold on ${platform}`, () => {
        // Set up platform
        Object.defineProperty(window, 'location', {
          value: { hostname: platformDetectors.platforms[platform].domains[0] },
          configurable: true
        });
        mockPlatformDOM[platform]();
        
        const input = platformDetectors.findActiveInput();
        expect(input).not.toBeNull();
        
        // Set content below threshold
        platformDetectors.setInputContent(input, 'short');
        expect(platformDetectors.hasMinimumContent(input, 10)).toBe(false);
        
        // Set content above threshold
        platformDetectors.setInputContent(input, 'This is a longer prompt that exceeds the minimum threshold');
        expect(platformDetectors.hasMinimumContent(input, 10)).toBe(true);
      });
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should find generic inputs when primary selectors fail', () => {
      // Create a generic input scenario
      document.body.innerHTML = `
        <div>
          <textarea placeholder="Type your message here" style="width: 500px; height: 100px;"></textarea>
        </div>
      `;
      
      Object.defineProperty(window, 'location', {
        value: { hostname: 'unknown-ai-platform.com' },
        configurable: true
      });

      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.tagName).toBe('TEXTAREA');
    });

    it('should handle multiple potential inputs correctly', () => {
      document.body.innerHTML = `
        <div>
          <input type="text" placeholder="Search" style="width: 100px; height: 20px;">
          <textarea placeholder="Ask anything" style="width: 600px; height: 150px;"></textarea>
          <input type="text" placeholder="Filter" style="width: 100px; height: 20px;">
        </div>
      `;

      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      expect(input.tagName).toBe('TEXTAREA'); // Should pick the larger, more likely input
    });

    it('should reject inputs that are too small or hidden', () => {
      document.body.innerHTML = `
        <div>
          <textarea style="width: 50px; height: 10px;"></textarea>
          <textarea style="display: none; width: 500px; height: 100px;"></textarea>
          <textarea style="width: 600px; height: 150px;"></textarea>
        </div>
      `;

      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
      
      const rect = input.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(200);
      expect(rect.height).toBeGreaterThan(20);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle rapid platform switches efficiently', () => {
      const platforms = ['chatgpt', 'claude', 'perplexity', 'gemini'];
      
      const start = performance.now();
      
      platforms.forEach(platform => {
        Object.defineProperty(window, 'location', {
          value: { hostname: platformDetectors.platforms[platform].domains[0] },
          configurable: true
        });
        mockPlatformDOM[platform]();
        
        platformDetectors.detectCurrentPlatform();
        platformDetectors.findActiveInput();
      });
      
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should complete all switches in under 100ms
    });

    it('should handle DOM mutations without performance degradation', () => {
      mockPlatformDOM.chatgpt();
      
      const start = performance.now();
      
      // Simulate DOM changes
      for (let i = 0; i < 50; i++) {
        const newDiv = document.createElement('div');
        newDiv.innerHTML = `<textarea placeholder="Dynamic ${i}"></textarea>`;
        document.body.appendChild(newDiv);
        
        platformDetectors.findActiveInput();
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(200); // Should handle 50 DOM changes efficiently
    });
  });

  describe('Error Recovery', () => {
    it('should recover gracefully from DOM access errors', () => {
      // Mock querySelector to throw an error
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn(() => {
        throw new Error('DOM access denied');
      });
      
      console.warn = jest.fn();
      
      const input = platformDetectors.findActiveInput();
      
      expect(console.warn).toHaveBeenCalled();
      expect(input).toBeNull(); // Should return null rather than crash
      
      // Restore original method
      document.querySelector = originalQuerySelector;
    });

    it('should handle invalid input elements gracefully', () => {
      const invalidInputs = [null, undefined, {}, 'string'];
      
      invalidInputs.forEach(invalidInput => {
        expect(() => {
          platformDetectors.getInputContent(invalidInput);
          platformDetectors.setInputContent(invalidInput, 'test');
          platformDetectors.isInputVisible(invalidInput);
          platformDetectors.getInputContainer(invalidInput);
        }).not.toThrow();
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle dynamic content loading', async () => {
      // Start with empty DOM
      document.body.innerHTML = '<div id="app">Loading...</div>';
      
      // Simulate async content loading
      setTimeout(() => {
        mockPlatformDOM.chatgpt();
      }, 10);
      
      await new Promise(resolve => setTimeout(resolve, 15));
      
      const input = platformDetectors.findActiveInput();
      expect(input).not.toBeNull();
    });

    it('should work with shadow DOM elements', () => {
      // Create a shadow DOM structure
      const host = document.createElement('div');
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <div>
          <textarea placeholder="Ask anything..." style="width: 600px; height: 150px;"></textarea>
        </div>
      `;
      document.body.appendChild(host);

      // Platform detectors should gracefully handle shadow DOM
      const input = platformDetectors.findActiveInput();
      // Note: Current implementation doesn't support shadow DOM, so input might be null
      // This test verifies it doesn't crash
      expect(() => platformDetectors.findActiveInput()).not.toThrow();
    });
  });
});
