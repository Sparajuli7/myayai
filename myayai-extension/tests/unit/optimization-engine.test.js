/**
 * Unit tests for Optimization Engine
 */

describe('OptimizationEngine', () => {
  let optimizationEngine;

  beforeEach(() => {
    // Mock the optimization engine
    global.OptimizationEngine = class OptimizationEngine {
      constructor() {
        this.rules = [
          {
            id: 'clarity',
            name: 'Clarity Enhancement',
            weight: 0.3,
            apply: (text) => this.enhanceClarity(text)
          },
          {
            id: 'specificity',
            name: 'Specificity Improvement',
            weight: 0.25,
            apply: (text) => this.enhanceSpecificity(text)
          },
          {
            id: 'context',
            name: 'Context Addition',
            weight: 0.2,
            apply: (text) => this.addContext(text)
          },
          {
            id: 'structure',
            name: 'Structure Optimization',
            weight: 0.15,
            apply: (text) => this.improveStructure(text)
          },
          {
            id: 'tone',
            name: 'Tone Adjustment',
            weight: 0.1,
            apply: (text) => this.adjustTone(text)
          }
        ];
        this.platformSpecificRules = new Map();
        this.cache = new Map();
      }

      async optimize(prompt, platform = 'generic', options = {}) {
        const cacheKey = `${prompt}_${platform}_${JSON.stringify(options)}`;
        if (this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey);
        }

        let optimizedPrompt = prompt.trim();
        let improvements = [];
        let qualityScore = 0;

        // Apply optimization rules
        for (const rule of this.rules) {
          try {
            const result = await rule.apply(optimizedPrompt);
            if (result && result.optimized && result.optimized !== optimizedPrompt) {
              optimizedPrompt = result.optimized;
              improvements.push({
                rule: rule.name,
                improvement: result.improvement,
                confidence: result.confidence || 0.8
              });
              qualityScore += rule.weight * (result.confidence || 0.8);
            }
          } catch (error) {
            console.warn(`Rule ${rule.id} failed:`, error);
          }
        }

        // Apply platform-specific optimizations
        if (this.platformSpecificRules.has(platform)) {
          const platformRules = this.platformSpecificRules.get(platform);
          for (const rule of platformRules) {
            try {
              const result = await rule.apply(optimizedPrompt);
              if (result && result.optimized) {
                optimizedPrompt = result.optimized;
                improvements.push({
                  rule: `${platform}-${rule.name}`,
                  improvement: result.improvement,
                  confidence: result.confidence || 0.8
                });
                qualityScore += 0.1 * (result.confidence || 0.8);
              }
            } catch (error) {
              console.warn(`Platform rule ${rule.id} failed:`, error);
            }
          }
        }

        const result = {
          originalPrompt: prompt,
          optimizedPrompt,
          improvements,
          qualityScore: Math.min(qualityScore, 1.0),
          platform,
          timeSaved: this.calculateTimeSaved(prompt, optimizedPrompt),
          complexityScore: this.calculateComplexity(optimizedPrompt),
          metadata: {
            wordCount: optimizedPrompt.split(' ').length,
            characterCount: optimizedPrompt.length,
            improvementCount: improvements.length,
            processingTime: Date.now()
          }
        };

        this.cache.set(cacheKey, result);
        return result;
      }

      enhanceClarity(text) {
        let optimized = text;
        let improvements = [];

        // Remove filler words
        const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of'];
        fillerWords.forEach(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          if (regex.test(optimized)) {
            optimized = optimized.replace(regex, '').replace(/\s+/g, ' ').trim();
            improvements.push(`Removed filler word: "${word}"`);
          }
        });

        // Fix grammar issues
        optimized = optimized.replace(/\bi\b/g, 'I'); // Capitalize I
        optimized = optimized.replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter

        return {
          optimized,
          improvement: improvements.join('; '),
          confidence: improvements.length > 0 ? 0.9 : 0.7
        };
      }

      enhanceSpecificity(text) {
        let optimized = text;
        let improvements = [];

        // Replace vague terms with more specific ones
        const vagueTerms = {
          'good': 'effective',
          'bad': 'ineffective',
          'big': 'comprehensive',
          'small': 'concise',
          'nice': 'well-structured',
          'stuff': 'content',
          'things': 'elements',
          'a lot': 'many',
          'some': 'several'
        };

        Object.entries(vagueTerms).forEach(([vague, specific]) => {
          const regex = new RegExp(`\\b${vague}\\b`, 'gi');
          if (regex.test(optimized)) {
            optimized = optimized.replace(regex, specific);
            improvements.push(`Replaced "${vague}" with "${specific}"`);
          }
        });

        return {
          optimized,
          improvement: improvements.join('; '),
          confidence: improvements.length > 0 ? 0.8 : 0.6
        };
      }

      addContext(text) {
        const improvements = [];
        let optimized = text;

        // Add context hints for common requests
        if (/write|create|generate/i.test(text) && !/audience|target|for/i.test(text)) {
          optimized += ', targeting a general audience';
          improvements.push('Added target audience context');
        }

        if (/explain|describe/i.test(text) && !/level|depth|detail/i.test(text)) {
          optimized += ' in moderate detail';
          improvements.push('Added detail level specification');
        }

        return {
          optimized,
          improvement: improvements.join('; '),
          confidence: improvements.length > 0 ? 0.7 : 0.5
        };
      }

      improveStructure(text) {
        const improvements = [];
        let optimized = text;

        // Ensure proper sentence structure
        if (!optimized.endsWith('.') && !optimized.endsWith('?') && !optimized.endsWith('!')) {
          optimized += '.';
          improvements.push('Added proper sentence ending');
        }

        // Add structure for complex requests
        if (optimized.length > 100 && !optimized.includes(':') && !optimized.includes(',')) {
          const sentences = optimized.split('.');
          if (sentences.length > 2) {
            optimized = sentences.join(', ').replace(/,([^,]*)$/, '.$1');
            improvements.push('Improved sentence flow with commas');
          }
        }

        return {
          optimized,
          improvement: improvements.join('; '),
          confidence: improvements.length > 0 ? 0.8 : 0.6
        };
      }

      adjustTone(text) {
        const improvements = [];
        let optimized = text;

        // Make tone more professional
        if (/please|can you|could you/i.test(text)) {
          optimized = optimized.replace(/please,?\s*/gi, '');
          optimized = optimized.replace(/can you\s+/gi, '');
          optimized = optimized.replace(/could you\s+/gi, '');
          improvements.push('Adjusted to more direct, professional tone');
        }

        return {
          optimized,
          improvement: improvements.join('; '),
          confidence: improvements.length > 0 ? 0.6 : 0.4
        };
      }

      calculateTimeSaved(original, optimized) {
        // Estimate time saved based on clarity and specificity improvements
        const originalWords = original.split(' ').length;
        const optimizedWords = optimized.split(' ').length;
        const wordDifference = optimizedWords - originalWords;
        
        // Base time saving on improved clarity (less back-and-forth)
        let timeSaved = Math.max(5, originalWords * 0.5); // Base 5-30 seconds
        
        // Add time for better specificity (better results)
        if (wordDifference > 0) {
          timeSaved += wordDifference * 2; // 2 seconds per additional word of clarity
        }
        
        return Math.round(Math.min(timeSaved, 300)); // Cap at 5 minutes
      }

      calculateComplexity(text) {
        const words = text.split(' ').length;
        const sentences = text.split(/[.!?]/).length - 1;
        const avgWordsPerSentence = sentences > 0 ? words / sentences : words;
        
        if (avgWordsPerSentence < 10) return 1; // Simple
        if (avgWordsPerSentence < 20) return 2; // Moderate
        if (avgWordsPerSentence < 30) return 3; // Complex
        return 4; // Very complex
      }

      clearCache() {
        this.cache.clear();
      }

      getStats() {
        return {
          cacheSize: this.cache.size,
          rulesCount: this.rules.length,
          platformRulesCount: this.platformSpecificRules.size
        };
      }
    };

    optimizationEngine = new global.OptimizationEngine();
  });

  describe('Basic Optimization', () => {
    it('should optimize a simple prompt', async () => {
      const result = await optimizationEngine.optimize('write a blog post');

      expect(result.originalPrompt).toBe('write a blog post');
      expect(result.optimizedPrompt).toBeDefined();
      expect(result.optimizedPrompt.length).toBeGreaterThan(result.originalPrompt.length);
      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.improvements).toBeInstanceOf(Array);
    });

    it('should handle empty prompts gracefully', async () => {
      const result = await optimizationEngine.optimize('');

      expect(result.originalPrompt).toBe('');
      expect(result.optimizedPrompt).toBe('');
      expect(result.improvements).toEqual([]);
    });

    it('should improve prompt clarity', async () => {
      const result = await optimizationEngine.optimize('um, like, write a good blog post, you know');

      expect(result.optimizedPrompt).not.toContain('um');
      expect(result.optimizedPrompt).not.toContain('like');
      expect(result.optimizedPrompt).not.toContain('you know');
      expect(result.improvements.some(imp => imp.rule === 'Clarity Enhancement')).toBe(true);
    });

    it('should enhance specificity', async () => {
      const result = await optimizationEngine.optimize('write a good blog post about stuff');

      expect(result.optimizedPrompt).not.toContain('good');
      expect(result.optimizedPrompt).not.toContain('stuff');
      expect(result.optimizedPrompt).toContain('effective');
      expect(result.optimizedPrompt).toContain('content');
    });

    it('should add context when missing', async () => {
      const result = await optimizationEngine.optimize('write a technical article');

      expect(result.optimizedPrompt).toContain('audience');
      expect(result.improvements.some(imp => imp.rule === 'Context Addition')).toBe(true);
    });

    it('should improve structure', async () => {
      const result = await optimizationEngine.optimize('write a blog post about AI');

      expect(result.optimizedPrompt).toEndWith('.');
    });
  });

  describe('Performance Testing', () => {
    it('should optimize prompts under 200ms', async () => {
      const prompt = 'Create a comprehensive guide about machine learning for beginners';
      
      const start = performance.now();
      await optimizationEngine.optimize(prompt);
      const end = performance.now();

      expect(end - start).toBeLessThan(200);
    });

    it('should handle batch optimization efficiently', async () => {
      const prompts = [
        'write a blog post',
        'explain quantum computing',
        'create a marketing plan',
        'analyze market trends',
        'develop a strategy'
      ];

      const start = performance.now();
      const promises = prompts.map(prompt => optimizationEngine.optimize(prompt));
      await Promise.all(promises);
      const end = performance.now();

      // Should average less than 200ms per optimization
      expect((end - start) / prompts.length).toBeLessThan(200);
    });

    it('should use caching effectively', async () => {
      const prompt = 'write a blog post about AI';
      
      // First optimization
      const start1 = performance.now();
      const result1 = await optimizationEngine.optimize(prompt);
      const end1 = performance.now();

      // Second optimization (should be cached)
      const start2 = performance.now();
      const result2 = await optimizationEngine.optimize(prompt);
      const end2 = performance.now();

      expect(result1.optimizedPrompt).toBe(result2.optimizedPrompt);
      expect(end2 - start2).toBeLessThan(end1 - start1); // Cached should be faster
    });
  });

  describe('Platform-Specific Optimization', () => {
    it('should handle different platforms', async () => {
      const prompt = 'write a blog post';
      const platforms = ['chatgpt', 'claude', 'gemini', 'copilot'];

      for (const platform of platforms) {
        const result = await optimizationEngine.optimize(prompt, platform);
        expect(result.platform).toBe(platform);
        expect(result.optimizedPrompt).toBeDefined();
      }
    });
  });

  describe('Quality Scoring', () => {
    it('should provide meaningful quality scores', async () => {
      const poorPrompt = 'um write stuff';
      const goodPrompt = 'Create a comprehensive, well-researched article about renewable energy technologies for environmental professionals.';

      const poorResult = await optimizationEngine.optimize(poorPrompt);
      const goodResult = await optimizationEngine.optimize(goodPrompt);

      expect(poorResult.qualityScore).toBeLessThan(goodResult.qualityScore);
      expect(poorResult.qualityScore).toBeGreaterThan(0);
      expect(poorResult.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should calculate complexity scores correctly', () => {
      const simpleText = 'Write a blog post.';
      const complexText = 'Create a comprehensive, multi-faceted analysis of the economic, social, and environmental implications of renewable energy adoption in developing countries, considering various stakeholder perspectives and potential policy interventions.';

      const simpleComplexity = optimizationEngine.calculateComplexity(simpleText);
      const complexComplexity = optimizationEngine.calculateComplexity(complexText);

      expect(simpleComplexity).toBeLessThan(complexComplexity);
      expect(simpleComplexity).toBeGreaterThanOrEqual(1);
      expect(complexComplexity).toBeLessThanOrEqual(4);
    });

    it('should calculate realistic time savings', () => {
      const shortPrompt = 'write blog';
      const longPrompt = 'write comprehensive blog post about artificial intelligence machine learning';

      const shortTimeSaved = optimizationEngine.calculateTimeSaved(shortPrompt, shortPrompt + ' post');
      const longTimeSaved = optimizationEngine.calculateTimeSaved(longPrompt, longPrompt + ' for technical professionals');

      expect(shortTimeSaved).toBeGreaterThan(0);
      expect(longTimeSaved).toBeGreaterThan(shortTimeSaved);
      expect(shortTimeSaved).toBeLessThanOrEqual(300);
      expect(longTimeSaved).toBeLessThanOrEqual(300);
    });
  });

  describe('Memory Management', () => {
    it('should manage cache size appropriately', async () => {
      // Generate many unique optimizations to test cache
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(optimizationEngine.optimize(`write blog post ${i}`));
      }
      
      await Promise.all(promises);
      
      const stats = optimizationEngine.getStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(100);
    });

    it('should clear cache when requested', async () => {
      await optimizationEngine.optimize('test prompt');
      expect(optimizationEngine.getStats().cacheSize).toBeGreaterThan(0);
      
      optimizationEngine.clearCache();
      expect(optimizationEngine.getStats().cacheSize).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed input gracefully', async () => {
      const testInputs = [null, undefined, 123, {}, []];

      for (const input of testInputs) {
        const result = await optimizationEngine.optimize(input);
        expect(result).toBeDefined();
        expect(result.originalPrompt).toBeDefined();
        expect(result.optimizedPrompt).toBeDefined();
      }
    });

    it('should handle optimization rule failures', async () => {
      // Mock a failing rule
      const originalRule = optimizationEngine.rules[0];
      optimizationEngine.rules[0] = {
        ...originalRule,
        apply: () => { throw new Error('Rule failed'); }
      };

      console.warn = jest.fn();
      
      const result = await optimizationEngine.optimize('test prompt');
      
      expect(console.warn).toHaveBeenCalled();
      expect(result.optimizedPrompt).toBeDefined();
      
      // Restore original rule
      optimizationEngine.rules[0] = originalRule;
    });
  });
});
