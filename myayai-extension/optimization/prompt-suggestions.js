// MyAyAI Prompt Suggestions Generator
// Generates intelligent suggestions for prompt improvements

class PromptSuggestions {
    constructor() {
        this.templates = this.initializeTemplates();
        this.improvementPatterns = this.initializeImprovementPatterns();
        this.platformSpecificTips = this.initializePlatformTips();
    }

    initializeTemplates() {
        return {
            general: {
                contextual: "Context: {context}\n\nTask: {task}\n\nRequirements:\n- {requirement1}\n- {requirement2}\n\nExpected Output: {output}",
                structured: "## Objective\n{objective}\n\n## Background\n{background}\n\n## Specific Request\n{request}\n\n## Format\n{format}",
                stepByStep: "Please help me {task} by following these steps:\n\n1. {step1}\n2. {step2}\n3. {step3}\n\nAdditional details: {details}"
            },
            writing: {
                creative: "Write a {type} about {topic} with the following characteristics:\n- Tone: {tone}\n- Audience: {audience}\n- Length: {length}\n- Style: {style}\n\nAdditional requirements: {requirements}",
                analytical: "Please analyze {subject} by examining:\n1. {aspect1}\n2. {aspect2}\n3. {aspect3}\n\nProvide insights on {focus} and conclude with {conclusion}",
                persuasive: "Create a persuasive {format} that:\n- Argues for: {position}\n- Targets: {audience}\n- Uses evidence from: {sources}\n- Addresses counterarguments about: {counterargs}"
            },
            technical: {
                codeReview: "Please review this {language} code for:\n\n```{language}\n{code}\n```\n\nFocus on:\n- Code quality and best practices\n- Performance optimization\n- Security concerns\n- Maintainability\n\nProvide specific recommendations.",
                debugging: "I'm encountering {error} in my {technology} project. Here's the relevant code:\n\n```{language}\n{code}\n```\n\nExpected behavior: {expected}\nActual behavior: {actual}\n\nEnvironment: {environment}",
                architecture: "Help me design a {system} architecture that:\n- Handles {requirements}\n- Scales to {scale}\n- Integrates with {integrations}\n- Meets {constraints}\n\nPlease provide diagrams and implementation recommendations."
            },
            research: {
                comparative: "Compare {item1} and {item2} across these dimensions:\n- {dimension1}\n- {dimension2}\n- {dimension3}\n\nProvide a recommendation for {useCase} with supporting evidence.",
                investigative: "Research {topic} with focus on:\n- Current state and trends\n- Key challenges and opportunities  \n- Recent developments (2024)\n- Future implications\n\nInclude credible sources and data.",
                analytical: "Analyze {dataset} to identify:\n1. Patterns and correlations\n2. Key insights and findings\n3. Actionable recommendations\n\nMethodology: {methodology}\nContext: {context}"
            },
            business: {
                strategy: "Develop a {strategy} for {company} that addresses:\n- Market opportunity: {opportunity}\n- Target audience: {audience}\n- Competitive landscape: {competition}\n- Success metrics: {metrics}\n\nInclude implementation timeline.",
                problemSolving: "Help solve this business problem:\n\nSituation: {situation}\nProblem: {problem}\nConstraints: {constraints}\nStakeholders: {stakeholders}\n\nProvide 3 solution options with pros/cons.",
                planning: "Create a {timeframe} plan for {project} including:\n- Objectives and deliverables\n- Resource requirements\n- Risk mitigation strategies\n- Success measurements\n\nFormat as actionable roadmap."
            }
        };
    }

    initializeImprovementPatterns() {
        return {
            addContext: {
                triggers: ['vague', 'short', 'unclear'],
                suggestions: [
                    "Add background information about your situation",
                    "Explain why this is important or what you'll do with the response",
                    "Provide relevant context about your industry/domain",
                    "Describe your current state or starting point"
                ]
            },
            improveSpecificity: {
                triggers: ['vague', 'general'],
                suggestions: [
                    "Replace vague terms with specific details",
                    "Add concrete examples of what you're looking for",
                    "Specify exact requirements or criteria",
                    "Include measurable outcomes or formats"
                ]
            },
            enhanceStructure: {
                triggers: ['unstructured', 'complex'],
                suggestions: [
                    "Break your request into numbered steps or bullet points",
                    "Organize information into clear sections",
                    "Use headers to separate different parts of your request",
                    "Present requirements as a structured list"
                ]
            },
            clarifyOutput: {
                triggers: ['unclear_output', 'no_format'],
                suggestions: [
                    "Specify the exact format you want (list, paragraph, table, etc.)",
                    "Indicate desired length or level of detail",
                    "Explain how you'll use the response",
                    "Request specific deliverables or components"
                ]
            },
            addConstraints: {
                triggers: ['open_ended', 'too_broad'],
                suggestions: [
                    "Set word or length limits",
                    "Specify time constraints or deadlines",
                    "Define scope boundaries",
                    "Add quality or style requirements"
                ]
            },
            improveClarity: {
                triggers: ['confusing', 'ambiguous'],
                suggestions: [
                    "Use simpler, more direct language",
                    "Define technical terms or acronyms",
                    "Separate multiple requests into distinct questions",
                    "Remove unnecessary qualifiers or hedge words"
                ]
            }
        };
    }

    initializePlatformTips() {
        return {
            openai: {
                strengths: ["detailed reasoning", "creative tasks", "code generation", "conversational AI"],
                tips: [
                    "Use system messages to define roles and behavior",
                    "Provide examples in your prompt for better results",
                    "Ask for step-by-step reasoning for complex problems",
                    "Specify output format clearly (JSON, markdown, etc.)"
                ],
                avoid: [
                    "Don't make prompts too long (over 4000 words)",
                    "Avoid asking for real-time information",
                    "Don't expect knowledge beyond training cutoff"
                ]
            },
            claude: {
                strengths: ["analysis", "long-form writing", "code review", "careful reasoning"],
                tips: [
                    "Use XML-like tags to structure complex prompts",
                    "Ask Claude to think step-by-step for complex analysis",
                    "Provide extensive context - Claude handles long prompts well",
                    "Request citations and source verification"
                ],
                avoid: [
                    "Don't expect creative writing to be as open-ended as other models",
                    "Avoid requests that might seem harmful or unethical",
                    "Don't assume knowledge of very recent events"
                ]
            },
            gemini: {
                strengths: ["multimodal input", "real-time info", "factual accuracy", "structured responses"],
                tips: [
                    "Be direct and specific in your requests",
                    "Break complex tasks into smaller, focused questions",
                    "Ask for current information when relevant",
                    "Use clear, unambiguous language"
                ],
                avoid: [
                    "Don't make overly long or complex prompts",
                    "Avoid highly creative or abstract requests",
                    "Don't rely on conversational context over multiple turns"
                ]
            },
            perplexity: {
                strengths: ["research", "current events", "factual queries", "source citations"],
                tips: [
                    "Ask for specific sources and citations",
                    "Request analysis of current trends and data",
                    "Specify time ranges for information (e.g., 'since 2023')",
                    "Ask for comparisons with credible data"
                ],
                avoid: [
                    "Don't use for creative writing or opinion pieces",
                    "Avoid purely conversational interactions",
                    "Don't expect detailed code generation"
                ]
            },
            copilot: {
                strengths: ["Microsoft integration", "business context", "productivity", "professional tasks"],
                tips: [
                    "Reference Microsoft Office tools when relevant",
                    "Frame requests in business/professional context",
                    "Ask for actionable insights and recommendations",
                    "Use formal, professional tone"
                ],
                avoid: [
                    "Don't use overly casual language",
                    "Avoid highly creative or artistic requests",
                    "Don't expect extensive code debugging"
                ]
            }
        };
    }

    /**
     * Generate suggestions based on prompt analysis
     */
    generateSuggestions(prompt, analysis, options = {}) {
        const suggestions = {
            immediate: [],
            structural: [],
            enhancement: [],
            platformSpecific: [],
            templates: []
        };

        // Generate immediate fixes
        suggestions.immediate = this.generateImmediateFixes(prompt, analysis);
        
        // Generate structural improvements
        suggestions.structural = this.generateStructuralSuggestions(prompt, analysis);
        
        // Generate enhancement suggestions
        suggestions.enhancement = this.generateEnhancementSuggestions(prompt, analysis);
        
        // Generate platform-specific suggestions
        if (options.platform) {
            suggestions.platformSpecific = this.generatePlatformSuggestions(prompt, analysis, options.platform);
        }
        
        // Suggest relevant templates
        suggestions.templates = this.suggestTemplates(prompt, analysis);
        
        return suggestions;
    }

    generateImmediateFixes(prompt, analysis) {
        const fixes = [];
        
        // Length issues
        if (analysis.metadata.wordCount < 10) {
            fixes.push({
                type: 'length',
                priority: 'high',
                issue: 'Prompt is too short',
                suggestion: 'Add more detail and context to get better results',
                example: `Original: "${prompt}"\nImproved: "Context: [add background]\n\n${prompt}\n\nSpecific requirements: [list what you need]"`
            });
        }
        
        // Vague language fixes
        const vagueWords = ['thing', 'stuff', 'something', 'anything'];
        const hasVague = vagueWords.some(word => 
            prompt.toLowerCase().includes(word)
        );
        
        if (hasVague) {
            fixes.push({
                type: 'vagueness',
                priority: 'high',
                issue: 'Contains vague language',
                suggestion: 'Replace vague words with specific terms',
                example: 'Instead of "something about AI", try "a comprehensive guide to machine learning algorithms"'
            });
        }
        
        // Missing question fix
        if (analysis.metadata.questionCount === 0 && !/(create|generate|write|make|develop)/i.test(prompt)) {
            fixes.push({
                type: 'unclear_request',
                priority: 'medium',
                issue: 'No clear question or request',
                suggestion: 'End with a specific question or instruction',
                example: 'Add: "What are the key considerations I should keep in mind?"'
            });
        }
        
        // Format specification
        if (analysis.metadata.wordCount > 30 && !/(format|structure|organize)/i.test(prompt)) {
            fixes.push({
                type: 'format',
                priority: 'low',
                issue: 'No output format specified',
                suggestion: 'Specify how you want the response formatted',
                example: 'Add: "Please format as a bulleted list" or "Provide a step-by-step guide"'
            });
        }
        
        return fixes.slice(0, 3); // Top 3 immediate fixes
    }

    generateStructuralSuggestions(prompt, analysis) {
        const suggestions = [];
        
        // Add structure for long prompts
        if (analysis.metadata.wordCount > 50 && analysis.metadata.paragraphCount === 1) {
            suggestions.push({
                type: 'organization',
                title: 'Break into sections',
                description: 'Organize your prompt into clear sections',
                template: 'Background:\n[Context]\n\nObjective:\n[What you want]\n\nRequirements:\n[Specific needs]',
                benefit: 'Clearer structure leads to better organized responses'
            });
        }
        
        // Add numbered lists for complex requests
        if (analysis.complexity > 6) {
            suggestions.push({
                type: 'listing',
                title: 'Use numbered requirements',
                description: 'Break complex requests into numbered points',
                template: 'Please help me with [task] by addressing:\n1. [First requirement]\n2. [Second requirement]\n3. [Third requirement]',
                benefit: 'Ensures all requirements are addressed systematically'
            });
        }
        
        // Add examples section
        if (analysis.metadata.wordCount > 40 && !/(example|instance|like|such as)/i.test(prompt)) {
            suggestions.push({
                type: 'examples',
                title: 'Include examples',
                description: 'Add specific examples to clarify your request',
                template: 'Examples of what I\'m looking for:\n- [Example 1]\n- [Example 2]\n\n[Your original prompt]',
                benefit: 'Examples help AI understand exactly what you want'
            });
        }
        
        return suggestions;
    }

    generateEnhancementSuggestions(prompt, analysis) {
        const enhancements = [];
        
        // Add context enhancement
        if (analysis.scores.context < 70) {
            enhancements.push({
                type: 'context',
                title: 'Add contextual background',
                description: 'Provide relevant background information',
                suggestions: [
                    'Explain your current situation or starting point',
                    'Describe why this information is important to you',
                    'Mention your industry, role, or relevant background',
                    'Include any constraints or limitations you face'
                ],
                example: 'Context: I\'m a [role] at a [company type] working on [project]. I need this because [reason].'
            });
        }
        
        // Add specificity enhancement
        if (analysis.scores.specificity < 70) {
            enhancements.push({
                type: 'specificity',
                title: 'Increase specificity',
                description: 'Make your request more specific and detailed',
                suggestions: [
                    'Replace general terms with specific ones',
                    'Add measurable criteria or requirements',
                    'Specify the audience or use case',
                    'Include technical specifications or constraints'
                ],
                example: 'Instead of "write about marketing", try "write a 500-word email marketing guide for B2B SaaS companies"'
            });
        }
        
        // Add quality indicators
        if (!/(best|quality|effective|optimal)/i.test(prompt)) {
            enhancements.push({
                type: 'quality',
                title: 'Add quality indicators',
                description: 'Specify the quality level or approach you want',
                suggestions: [
                    'Request "best practices" or "industry standards"',
                    'Ask for "proven methods" or "evidence-based approaches"',
                    'Specify "professional quality" or "expert-level" content',
                    'Request "detailed analysis" or "comprehensive overview"'
                ],
                example: 'Please provide best practices for [your topic] with evidence-based recommendations.'
            });
        }
        
        return enhancements;
    }

    generatePlatformSuggestions(prompt, analysis, platform) {
        const platformData = this.platformSpecificTips[platform];
        if (!platformData) return [];
        
        const suggestions = [];
        
        // Platform-specific optimizations
        switch (platform) {
            case 'openai':
                suggestions.push(...this.generateOpenAISuggestions(prompt, analysis, platformData));
                break;
            case 'claude':
                suggestions.push(...this.generateClaudeSuggestions(prompt, analysis, platformData));
                break;
            case 'gemini':
                suggestions.push(...this.generateGeminiSuggestions(prompt, analysis, platformData));
                break;
            case 'perplexity':
                suggestions.push(...this.generatePerplexitySuggestions(prompt, analysis, platformData));
                break;
        }
        
        return suggestions;
    }

    generateOpenAISuggestions(prompt, analysis, platformData) {
        const suggestions = [];
        
        if (analysis.complexity > 6) {
            suggestions.push({
                platform: 'openai',
                type: 'reasoning',
                suggestion: 'Ask ChatGPT to explain its reasoning',
                example: 'Add: "Please explain your reasoning step-by-step"',
                benefit: 'Better transparency and logic in complex responses'
            });
        }
        
        if (!/(format|style)/i.test(prompt)) {
            suggestions.push({
                platform: 'openai',
                type: 'format',
                suggestion: 'Specify output format for ChatGPT',
                example: 'Add: "Format as JSON" or "Use markdown headers"',
                benefit: 'Consistent, structured output format'
            });
        }
        
        return suggestions;
    }

    generateClaudeSuggestions(prompt, analysis, platformData) {
        const suggestions = [];
        
        if (analysis.complexity > 7) {
            suggestions.push({
                platform: 'claude',
                type: 'structure',
                suggestion: 'Use XML-like tags for complex prompts',
                example: '<task>[your task]</task>\n<context>[background]</context>\n<requirements>[needs]</requirements>',
                benefit: 'Claude processes structured prompts more effectively'
            });
        }
        
        if (analysis.metadata.wordCount > 100) {
            suggestions.push({
                platform: 'claude',
                type: 'analysis',
                suggestion: 'Ask Claude to think through the problem',
                example: 'Add: "Please think through this step-by-step before providing your answer"',
                benefit: 'More thorough and accurate analysis from Claude'
            });
        }
        
        return suggestions;
    }

    generateGeminiSuggestions(prompt, analysis, platformData) {
        const suggestions = [];
        
        if (analysis.metadata.wordCount > 150) {
            suggestions.push({
                platform: 'gemini',
                type: 'simplification',
                suggestion: 'Break into simpler, focused questions',
                example: 'Split complex prompt into 2-3 separate questions',
                benefit: 'Gemini performs better with clear, direct questions'
            });
        }
        
        if (!/current|recent|2024/i.test(prompt) && analysis.patterns.research) {
            suggestions.push({
                platform: 'gemini',
                type: 'currency',
                suggestion: 'Ask for current information',
                example: 'Add: "Please include recent developments from 2024"',
                benefit: 'Leverage Gemini\'s real-time information access'
            });
        }
        
        return suggestions;
    }

    generatePerplexitySuggestions(prompt, analysis, platformData) {
        const suggestions = [];
        
        if (!/(source|citation|reference)/i.test(prompt)) {
            suggestions.push({
                platform: 'perplexity',
                type: 'sources',
                suggestion: 'Request sources and citations',
                example: 'Add: "Please include sources and citations for your information"',
                benefit: 'Leverage Perplexity\'s strength in providing credible sources'
            });
        }
        
        if (!/(research|analysis|study|data)/i.test(prompt)) {
            suggestions.push({
                platform: 'perplexity',
                type: 'research',
                suggestion: 'Frame as research question',
                example: 'Rephrase as: "Research and analyze [your topic] including recent trends and data"',
                benefit: 'Optimize for Perplexity\'s research capabilities'
            });
        }
        
        return suggestions;
    }

    suggestTemplates(prompt, analysis) {
        const suggestions = [];
        const promptLower = prompt.toLowerCase();
        
        // Detect intent and suggest appropriate templates
        if (/(write|create|compose)/i.test(prompt)) {
            const category = this.detectWritingCategory(prompt);
            suggestions.push({
                category: 'writing',
                subcategory: category,
                template: this.templates.writing[category],
                title: `${category.charAt(0).toUpperCase() + category.slice(1)} Writing Template`,
                description: `Structured template for ${category} writing tasks`
            });
        }
        
        if (/(code|debug|review|program)/i.test(prompt)) {
            suggestions.push({
                category: 'technical',
                subcategory: 'codeReview',
                template: this.templates.technical.codeReview,
                title: 'Code Review Template',
                description: 'Comprehensive template for code review requests'
            });
        }
        
        if (/(compare|analyze|research|study)/i.test(prompt)) {
            suggestions.push({
                category: 'research',
                subcategory: 'comparative',
                template: this.templates.research.comparative,
                title: 'Comparative Analysis Template',
                description: 'Structure for comparing and analyzing topics'
            });
        }
        
        if (/(plan|strategy|business|project)/i.test(prompt)) {
            suggestions.push({
                category: 'business',
                subcategory: 'planning',
                template: this.templates.business.planning,
                title: 'Business Planning Template',
                description: 'Framework for business and project planning'
            });
        }
        
        // Always suggest general structured template if prompt lacks structure
        if (analysis.scores.structure < 60) {
            suggestions.push({
                category: 'general',
                subcategory: 'structured',
                template: this.templates.general.structured,
                title: 'Structured Prompt Template',
                description: 'General template for well-organized prompts'
            });
        }
        
        return suggestions.slice(0, 3); // Top 3 template suggestions
    }

    detectWritingCategory(prompt) {
        const promptLower = prompt.toLowerCase();
        
        if (/(story|creative|fiction|narrative|character)/i.test(prompt)) {
            return 'creative';
        } else if (/(analyze|examine|evaluate|assess|study)/i.test(prompt)) {
            return 'analytical';
        } else if (/(convince|persuade|argue|proposal)/i.test(prompt)) {
            return 'persuasive';
        }
        
        return 'creative'; // Default
    }

    /**
     * Generate an optimized version of the prompt
     */
    generateOptimizedPrompt(prompt, analysis, suggestions, options = {}) {
        let optimized = prompt;
        const level = options.optimizationLevel || 'advanced';
        
        // Apply immediate fixes first
        if (suggestions.immediate?.length > 0) {
            optimized = this.applyImmediateFixes(optimized, suggestions.immediate, level);
        }
        
        // Apply structural improvements
        if (suggestions.structural?.length > 0 && level !== 'basic') {
            optimized = this.applyStructuralImprovements(optimized, suggestions.structural, analysis);
        }
        
        // Apply enhancements for expert level
        if (suggestions.enhancement?.length > 0 && level === 'expert') {
            optimized = this.applyEnhancements(optimized, suggestions.enhancement, analysis);
        }
        
        // Apply platform-specific optimizations
        if (suggestions.platformSpecific?.length > 0 && options.platform) {
            optimized = this.applyPlatformOptimizations(optimized, suggestions.platformSpecific, options.platform);
        }
        
        return optimized;
    }

    applyImmediateFixes(prompt, fixes, level) {
        let improved = prompt;
        
        fixes.forEach(fix => {
            switch (fix.type) {
                case 'length':
                    if (improved.length < 50) {
                        improved = `Context: [Please provide relevant background information]\n\n${improved}\n\nSpecific requirements: [List what you need in the response]`;
                    }
                    break;
                    
                case 'vagueness':
                    // Replace common vague terms
                    improved = improved
                        .replace(/\bthing\b/gi, '[specific item]')
                        .replace(/\bstuff\b/gi, '[specific items]')
                        .replace(/\bsomething\b/gi, '[specific topic]');
                    break;
                    
                case 'unclear_request':
                    improved += '\n\nPlease provide a detailed response with specific examples.';
                    break;
                    
                case 'format':
                    improved += '\n\nPlease format your response with clear headings and bullet points.';
                    break;
            }
        });
        
        return improved;
    }

    applyStructuralImprovements(prompt, improvements, analysis) {
        let structured = prompt;
        
        // If prompt is long but unstructured, restructure it
        if (analysis.metadata.wordCount > 50 && analysis.metadata.paragraphCount === 1) {
            const sentences = structured.split(/[.!?]+/).filter(s => s.trim().length > 0);
            if (sentences.length > 3) {
                structured = `## Background\n${sentences[0].trim()}.\n\n## Request\n${sentences.slice(1).join('. ').trim()}.`;
            }
        }
        
        return structured;
    }

    applyEnhancements(prompt, enhancements, analysis) {
        let enhanced = prompt;
        
        // Add context section if missing
        if (analysis.scores.context < 70 && !/(context|background)/i.test(enhanced)) {
            enhanced = `Context: [Add relevant background information about your situation]\n\n${enhanced}`;
        }
        
        // Add quality indicators
        if (!/(best|quality|effective)/i.test(enhanced)) {
            enhanced += '\n\nPlease provide best practices and evidence-based recommendations.';
        }
        
        return enhanced;
    }

    applyPlatformOptimizations(prompt, optimizations, platform) {
        let optimized = prompt;
        
        optimizations.forEach(opt => {
            switch (opt.type) {
                case 'reasoning':
                    optimized += '\n\nPlease explain your reasoning step-by-step.';
                    break;
                    
                case 'sources':
                    optimized += '\n\nPlease include credible sources and citations.';
                    break;
                    
                case 'format':
                    optimized += '\n\nPlease structure your response with clear headings and formatting.';
                    break;
                    
                case 'structure':
                    if (platform === 'claude') {
                        optimized = `<request>\n${optimized}\n</request>\n\nPlease provide a thorough, well-structured response.`;
                    }
                    break;
            }
        });
        
        return optimized;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptSuggestions;
} else if (typeof window !== 'undefined') {
    window.PromptSuggestions = PromptSuggestions;
} else {
    self.PromptSuggestions = PromptSuggestions;
}
