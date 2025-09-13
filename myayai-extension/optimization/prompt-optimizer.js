/**
 * MyAyAI Prompt Optimizer
 * Sophisticated prompt optimization engine with multiple styles and platform-specific enhancements
 */

class PromptOptimizer {
    constructor(options = {}) {
        this.options = {
            defaultStyle: 'professional',
            defaultPlatform: 'chatgpt',
            preserveIntent: true,
            maxOptimizationLength: 5000,
            enableAnalytics: true,
            ...options
        };
        
        // Initialize dependencies
        this.rules = new (self.OptimizationRules || OptimizationRules)();
        this.scorer = new (self.QualityScorer || QualityScorer)();
        this.platformDetector = new (self.PlatformDetectors || PlatformDetectors)();
        
        // Initialize style processors
        this.styleProcessors = this.initializeStyleProcessors();
        this.platformProcessors = this.initializePlatformProcessors();
        
        // Performance tracking
        this.analytics = {
            optimizations: 0,
            averageImprovement: 0,
            styleUsage: {},
            platformUsage: {},
            timeSavings: 0
        };
        
        this.init();
    }

    async init() {
        try {
            // Load any saved analytics
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const data = await chrome.storage.local.get(['promptOptimizerAnalytics']);
                if (data.promptOptimizerAnalytics) {
                    this.analytics = { ...this.analytics, ...data.promptOptimizerAnalytics };
                }
            }
            
            console.log('[PromptOptimizer] Initialized successfully');
        } catch (error) {
            console.error('[PromptOptimizer] Initialization failed:', error);
        }
    }

    /**
     * Initialize style-specific processors
     */
    initializeStyleProcessors() {
        return {
            professional: {
                name: 'Professional',
                processor: this.processProfessionalStyle.bind(this),
                characteristics: ['formal_business', 'clear_deliverables', 'actionable_outcomes']
            },
            
            creative: {
                name: 'Creative',
                processor: this.processCreativeStyle.bind(this),
                characteristics: ['inspirational_framing', 'open_ended', 'multiple_perspectives']
            },
            
            technical: {
                name: 'Technical',
                processor: this.processTechnicalStyle.bind(this),
                characteristics: ['precise_specifications', 'step_by_step', 'implementation_focused']
            },
            
            academic: {
                name: 'Academic',
                processor: this.processAcademicStyle.bind(this),
                characteristics: ['research_focused', 'citation_requests', 'methodological_rigor']
            }
        };
    }

    /**
     * Initialize platform-specific processors
     */
    initializePlatformProcessors() {
        return {
            chatgpt: this.processChatGPTOptimization.bind(this),
            claude: this.processClaudeOptimization.bind(this),
            perplexity: this.processPerplexityOptimization.bind(this),
            gemini: this.processGeminiOptimization.bind(this)
        };
    }

    /**
     * Main optimization function - optimizes prompt with specified style and platform
     */
    optimizePrompt(text, platform = null, style = null) {
        try {
            // Validate input
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                throw new Error('Invalid prompt: text must be a non-empty string');
            }

            // Auto-detect platform if not specified
            if (!platform) {
                const detectedPlatform = this.platformDetector.detectCurrentPlatform();
                platform = detectedPlatform ? detectedPlatform.id : this.options.defaultPlatform;
            }

            // Auto-select style if not specified
            if (!style) {
                style = this.detectOptimalStyle(text) || this.options.defaultStyle;
            }

            // Validate style and platform
            if (!this.styleProcessors[style]) {
                console.warn(`[PromptOptimizer] Unknown style '${style}', using default`);
                style = this.options.defaultStyle;
            }

            if (!this.rules.getPlatformRules(platform)) {
                console.warn(`[PromptOptimizer] Unknown platform '${platform}', using default`);
                platform = this.options.defaultPlatform;
            }

            const startTime = Date.now();
            
            // Step 1: Analyze original prompt
            const originalScore = this.scorer.calculateQualityScore(text, style, platform);
            
            // Step 2: Detect task type for expert role assignment
            const taskDetection = this.rules.detectTaskType(text);
            const expertRole = this.rules.getExpertRole(taskDetection?.[0], style);
            
            // Step 3: Apply core optimization algorithm
            let optimizedText = this.applyCoreOptimizations(text, originalScore, taskDetection);
            
            // Step 4: Apply style-specific enhancements
            optimizedText = this.applyStyleOptimizations(optimizedText, style, expertRole, taskDetection);
            
            // Step 5: Apply platform-specific optimizations
            optimizedText = this.applyPlatformOptimizations(optimizedText, platform, style);
            
            // Step 6: Ensure length constraints
            if (optimizedText.length > this.options.maxOptimizationLength) {
                optimizedText = this.trimToOptimalLength(optimizedText, platform);
            }
            
            // Step 7: Calculate improvements and confidence
            const optimizedScore = this.scorer.calculateQualityScore(optimizedText, style, platform);
            const confidence = this.scorer.calculateConfidence(text, optimizedText, platform, style);
            const improvements = this.scorer.explainImprovements(text, optimizedText, platform, style);
            const timeSaved = this.scorer.calculateTimeSaved({
                improvement: improvements,
                platformOptimized: platform !== this.options.defaultPlatform
            });

            // Step 8: Create result object
            const result = {
                original: text,
                optimized: optimizedText,
                style: style,
                platform: platform,
                taskType: taskDetection?.[0] || 'general',
                expertRole: expertRole,
                scores: {
                    original: originalScore.overall,
                    optimized: optimizedScore.overall,
                    improvement: optimizedScore.overall - originalScore.overall,
                    grade: optimizedScore.grade
                },
                confidence: confidence,
                improvements: improvements,
                timeSaved: timeSaved,
                metadata: {
                    processingTime: Date.now() - startTime,
                    version: '1.0.0',
                    timestamp: Date.now(),
                    wordCountChange: this.countWords(optimizedText) - this.countWords(text),
                    lengthChange: optimizedText.length - text.length
                }
            };

            // Track analytics
            this.trackOptimization(result);

            return result;

        } catch (error) {
            console.error('[PromptOptimizer] Optimization failed:', error);
            throw new Error(`Prompt optimization failed: ${error.message}`);
        }
    }

    /**
     * Calculate confidence score between original and optimized prompts
     */
    calculateConfidence(original, optimized) {
        return this.scorer.calculateConfidence(original, optimized);
    }

    /**
     * Explain improvements between original and optimized prompts
     */
    explainImprovements(original, optimized) {
        return this.scorer.explainImprovements(original, optimized);
    }

    /**
     * Calculate estimated time saved through optimization
     */
    calculateTimeSaved(optimization) {
        return this.scorer.calculateTimeSaved(optimization);
    }

    /**
     * Core optimization algorithm that preserves intent while enhancing clarity
     */
    applyCoreOptimizations(text, originalScore, taskDetection) {
        let optimized = text.trim();
        
        // 1. Preserve user intent while enhancing clarity
        optimized = this.preserveIntentWhileEnhancingClarity(optimized, originalScore);
        
        // 2. Add expert role framing if beneficial
        if (taskDetection && originalScore.breakdown.context.score < 70) {
            optimized = this.addExpertRoleFraming(optimized, taskDetection);
        }
        
        // 3. Structure output requirements if missing
        if (originalScore.breakdown.completeness.score < 70) {
            optimized = this.addOutputRequirements(optimized, originalScore);
        }
        
        // 4. Add relevant context and constraints
        if (originalScore.breakdown.context.score < 60 || originalScore.breakdown.specificity.score < 60) {
            optimized = this.addContextAndConstraints(optimized, originalScore);
        }
        
        return optimized;
    }

    /**
     * Preserve user intent while enhancing clarity
     */
    preserveIntentWhileEnhancingClarity(text, originalScore) {
        let enhanced = text;
        
        // Clarity improvements without changing intent
        if (originalScore.breakdown.clarity.score < 70) {
            // Fix vague language
            const vagueReplacements = {
                'thing': 'specific item',
                'stuff': 'specific elements',
                'something': 'specific solution',
                'anything': 'any relevant option',
                'some': 'specific',
                'kinda': 'somewhat',
                'sorta': 'somewhat'
            };
            
            for (const [vague, specific] of Object.entries(vagueReplacements)) {
                const regex = new RegExp(`\\b${vague}\\b`, 'gi');
                enhanced = enhanced.replace(regex, specific);
            }
            
            // Improve sentence structure without changing meaning
            enhanced = this.improveSentenceStructure(enhanced);
        }
        
        return enhanced;
    }

    /**
     * Add expert role framing based on detected task
     */
    addExpertRoleFraming(text, taskDetection) {
        const [taskType, taskData] = taskDetection;
        const expertRole = taskData.expertRoles[0];
        const roleData = this.rules.expertRoles[expertRole];
        
        if (!roleData) return text;
        
        const rolePrefix = `${roleData.prefix}, `;
        
        // Add role framing if not already present
        if (!text.toLowerCase().includes('as a') && !text.toLowerCase().includes('you are')) {
            return `${rolePrefix}${text}`;
        }
        
        return text;
    }

    /**
     * Add output requirements structure
     */
    addOutputRequirements(text, originalScore) {
        let enhanced = text;
        
        // Add format specification if missing
        if (originalScore.breakdown.completeness.score < 60) {
            if (!/(format|structure|organize)/i.test(enhanced)) {
                enhanced += '\n\nPlease structure your response with clear headings and provide specific, actionable recommendations.';
            }
        }
        
        return enhanced;
    }

    /**
     * Add relevant context and constraints
     */
    addContextAndConstraints(text, originalScore) {
        let enhanced = text;
        
        // Add context prompts if missing
        if (originalScore.breakdown.context.score < 60 && !/(context|background)/i.test(enhanced)) {
            const contextPrompt = '\n\nContext: Please consider relevant industry best practices and current trends in your response.';
            enhanced = `${enhanced}${contextPrompt}`;
        }
        
        // Add constraints if missing
        if (originalScore.breakdown.specificity.score < 60 && !/(specific|detailed|comprehensive)/i.test(enhanced)) {
            enhanced += '\n\nProvide specific examples and detailed explanations to ensure comprehensive understanding.';
        }
        
        return enhanced;
    }

    /**
     * Apply style-specific optimizations
     */
    applyStyleOptimizations(text, style, expertRole, taskDetection) {
        const processor = this.styleProcessors[style]?.processor;
        if (!processor) {
            console.warn(`[PromptOptimizer] No processor for style '${style}'`);
            return text;
        }
        
        return processor(text, expertRole, taskDetection);
    }

    /**
     * Professional style processor
     */
    processProfessionalStyle(text, expertRole, taskDetection) {
        let professional = text;
        const styleRules = this.rules.getStyleRules('professional');
        
        // Add business context framing
        if (!professional.toLowerCase().includes('business') && !professional.toLowerCase().includes('professional')) {
            professional = this.addBusinessFraming(professional, taskDetection);
        }
        
        // Ensure formal language
        professional = this.enhanceFormalLanguage(professional);
        
        // Add deliverables focus
        if (!/(deliverable|outcome|result|objective)/i.test(professional)) {
            professional += '\n\nPlease provide clear, actionable deliverables with specific success metrics and implementation timeline.';
        }
        
        // Add risk assessment request for business contexts
        if (taskDetection && taskDetection[0] === 'business') {
            professional += '\n\nInclude risk assessment and mitigation strategies where relevant.';
        }
        
        return professional;
    }

    /**
     * Creative style processor
     */
    processCreativeStyle(text, expertRole, taskDetection) {
        let creative = text;
        const styleRules = this.rules.getStyleRules('creative');
        
        // Add inspirational framing
        if (!/(imagine|explore|creative|innovative)/i.test(creative)) {
            creative = `Explore creative possibilities for: ${creative}`;
        }
        
        // Encourage multiple perspectives
        if (!/(alternative|different|various|multiple)/i.test(creative)) {
            creative += '\n\nProvide multiple creative approaches and alternative perspectives. Think outside conventional boundaries.';
        }
        
        // Add sensory and emotional elements
        creative += '\n\nConsider visual, emotional, and experiential aspects in your response. Include inspiring examples and innovative solutions.';
        
        return creative;
    }

    /**
     * Technical style processor
     */
    processTechnicalStyle(text, expertRole, taskDetection) {
        let technical = text;
        const styleRules = this.rules.getStyleRules('technical');
        
        // Add technical specifications request
        if (!/(specification|requirement|technical)/i.test(technical)) {
            technical = `Technical requirements: ${technical}`;
        }
        
        // Ensure step-by-step methodology
        if (!/(step|process|methodology|implementation)/i.test(technical)) {
            technical += '\n\nProvide detailed implementation steps with specific technical considerations.';
        }
        
        // Add code examples request for software tasks
        if (taskDetection && taskDetection[0] === 'technical') {
            technical += '\n\nInclude relevant code examples, best practices, and potential pitfalls to avoid.';
        }
        
        // Add testing and validation
        technical += '\n\nAddress testing procedures, validation methods, and maintenance considerations.';
        
        return technical;
    }

    /**
     * Academic style processor
     */
    processAcademicStyle(text, expertRole, taskDetection) {
        let academic = text;
        const styleRules = this.rules.getStyleRules('academic');
        
        // Frame as research question
        if (!/(research|study|analyze|investigate)/i.test(academic)) {
            academic = `Research question: ${academic}`;
        }
        
        // Add methodology and evidence requirements
        if (!/(evidence|source|citation|reference)/i.test(academic)) {
            academic += '\n\nProvide evidence-based analysis with relevant citations and sources.';
        }
        
        // Add literature review component
        if (taskDetection && taskDetection[0] === 'research') {
            academic += '\n\nInclude review of relevant literature and current research findings.';
        }
        
        // Add methodological rigor
        academic += '\n\nUse rigorous methodology, consider limitations, and suggest areas for further research.';
        
        return academic;
    }

    /**
     * Apply platform-specific optimizations
     */
    applyPlatformOptimizations(text, platform, style) {
        const processor = this.platformProcessors[platform];
        if (!processor) {
            console.warn(`[PromptOptimizer] No processor for platform '${platform}'`);
            return text;
        }
        
        return processor(text, style);
    }

    /**
     * ChatGPT-specific optimizations
     */
    processChatGPTOptimization(text, style) {
        let optimized = text;
        const platformRules = this.rules.getPlatformRules('chatgpt');
        
        // Add example requests for better results
        if (!/(example|instance)/i.test(optimized)) {
            optimized += '\n\nProvide specific examples to illustrate your points.';
        }
        
        // Add reasoning request for complex tasks
        if (text.length > 200) {
            optimized += '\n\nExplain your reasoning step-by-step.';
        }
        
        // Optimize length for ChatGPT
        if (optimized.length > platformRules.maxOptimalLength) {
            optimized = this.trimToOptimalLength(optimized, 'chatgpt');
        }
        
        return optimized;
    }

    /**
     * Claude-specific optimizations
     */
    processClaudeOptimization(text, style) {
        let optimized = text;
        const platformRules = this.rules.getPlatformRules('claude');
        
        // Add analytical depth
        if (!/(analyze|consider|examine)/i.test(optimized)) {
            optimized += '\n\nProvide thorough analysis with nuanced considerations.';
        }
        
        // Use structured format for complex prompts
        if (text.length > 300) {
            optimized = this.addClaudeStructure(optimized);
        }
        
        // Add thinking prompt
        optimized += '\n\nThink through this step-by-step before providing your final response.';
        
        return optimized;
    }

    /**
     * Perplexity-specific optimizations
     */
    processPerplexityOptimization(text, style) {
        let optimized = text;
        
        // Frame as research question
        if (!/(research|find|what|how|why)/i.test(optimized)) {
            optimized = `Research: ${optimized}`;
        }
        
        // Add source requirements
        if (!/(source|citation|reference)/i.test(optimized)) {
            optimized += '\n\nInclude credible sources and citations in your response.';
        }
        
        // Add current information request
        if (!/(current|recent|latest|2024)/i.test(optimized)) {
            optimized += '\n\nFocus on recent developments and current information.';
        }
        
        return optimized;
    }

    /**
     * Gemini-specific optimizations
     */
    processGeminiOptimization(text, style) {
        let optimized = text;
        const platformRules = this.rules.getPlatformRules('gemini');
        
        // Keep it direct and focused
        optimized = this.simplifyForGemini(optimized);
        
        // Add current information request
        if (!/(current|recent|today)/i.test(optimized)) {
            optimized += '\n\nProvide current, factual information.';
        }
        
        // Ensure optimal length for Gemini
        if (optimized.length > platformRules.maxOptimalLength) {
            optimized = this.trimToOptimalLength(optimized, 'gemini');
        }
        
        return optimized;
    }

    /**
     * Detect optimal style based on prompt content
     */
    detectOptimalStyle(text) {
        const taskDetection = this.rules.detectTaskType(text);
        
        if (!taskDetection) return this.options.defaultStyle;
        
        const [taskType, taskData] = taskDetection;
        return taskData.suggestedStyles[0];
    }

    /**
     * Helper methods
     */
    improveSentenceStructure(text) {
        // Split very long sentences
        return text.replace(/([.!?]+)\s*([A-Z])/g, '$1\n\n$2')
                  .replace(/,\s+and\s+([^,]{50,})/g, '. Additionally, $1');
    }

    addBusinessFraming(text, taskDetection) {
        if (taskDetection && taskDetection[0] === 'business') {
            return `From a business perspective: ${text}`;
        }
        return `In a professional context: ${text}`;
    }

    enhanceFormalLanguage(text) {
        const informalReplacements = {
            "don't": "do not",
            "won't": "will not",
            "can't": "cannot",
            "isn't": "is not",
            "aren't": "are not",
            "wasn't": "was not",
            "weren't": "were not",
            "haven't": "have not",
            "hasn't": "has not",
            "hadn't": "had not"
        };
        
        let formal = text;
        for (const [informal, formalVersion] of Object.entries(informalReplacements)) {
            const regex = new RegExp(`\\b${informal}\\b`, 'gi');
            formal = formal.replace(regex, formalVersion);
        }
        
        return formal;
    }

    addClaudeStructure(text) {
        if (text.length > 500) {
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const firstPart = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ').trim() + '.';
            const secondPart = sentences.slice(Math.ceil(sentences.length / 2)).join('. ').trim() + '.';
            
            return `<context>\n${firstPart}\n</context>\n\n<request>\n${secondPart}\n</request>`;
        }
        return text;
    }

    simplifyForGemini(text) {
        // Break complex sentences and simplify structure
        return text.replace(/([;:])\s*/g, '. ')
                  .replace(/\s*\([^)]+\)/g, '') // Remove parenthetical expressions
                  .replace(/\s{2,}/g, ' ')
                  .trim();
    }

    trimToOptimalLength(text, platform) {
        const platformRules = this.rules.getPlatformRules(platform);
        const maxLength = platformRules.maxOptimalLength;
        
        if (text.length <= maxLength) return text;
        
        // Try to trim at sentence boundaries
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        let trimmed = '';
        
        for (const sentence of sentences) {
            const potential = trimmed + sentence + '. ';
            if (potential.length > maxLength - 100) break;
            trimmed = potential;
        }
        
        return trimmed.trim() || text.substring(0, maxLength - 3) + '...';
    }

    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Track optimization analytics
     */
    async trackOptimization(result) {
        if (!this.options.enableAnalytics) return;
        
        try {
            this.analytics.optimizations++;
            this.analytics.averageImprovement = 
                ((this.analytics.averageImprovement * (this.analytics.optimizations - 1)) + result.scores.improvement) 
                / this.analytics.optimizations;
            
            // Track style usage
            this.analytics.styleUsage[result.style] = (this.analytics.styleUsage[result.style] || 0) + 1;
            
            // Track platform usage
            this.analytics.platformUsage[result.platform] = (this.analytics.platformUsage[result.platform] || 0) + 1;
            
            // Track time savings
            this.analytics.timeSavings += result.timeSaved;
            
            // Save to storage
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    promptOptimizerAnalytics: this.analytics
                });
            }
        } catch (error) {
            console.error('[PromptOptimizer] Analytics tracking failed:', error);
        }
    }

    /**
     * Get optimizer statistics
     */
    getAnalytics() {
        return {
            ...this.analytics,
            averageTimeSaved: this.analytics.optimizations > 0 ? 
                this.analytics.timeSavings / this.analytics.optimizations : 0
        };
    }

    /**
     * Reset analytics
     */
    resetAnalytics() {
        this.analytics = {
            optimizations: 0,
            averageImprovement: 0,
            styleUsage: {},
            platformUsage: {},
            timeSavings: 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptOptimizer;
} else if (typeof window !== 'undefined') {
    window.PromptOptimizer = PromptOptimizer;
} else {
    self.PromptOptimizer = PromptOptimizer;
}
