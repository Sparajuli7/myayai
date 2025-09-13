/**
 * MyAyAI Optimization Rules Engine
 * Platform-specific and style-specific optimization rules
 */

class OptimizationRules {
    constructor() {
        this.platformRules = this.initializePlatformRules();
        this.styleRules = this.initializeStyleRules();
        this.taskDetectionPatterns = this.initializeTaskPatterns();
        this.expertRoles = this.initializeExpertRoles();
        this.outputStructures = this.initializeOutputStructures();
        this.contextualConstraints = this.initializeConstraints();
    }

    /**
     * Platform-specific optimization rules
     */
    initializePlatformRules() {
        return {
            chatgpt: {
                name: 'ChatGPT',
                strengths: ['creativity', 'examples', 'conversation', 'code_generation'],
                weaknesses: ['real_time_data', 'citations', 'very_long_context'],
                optimizations: {
                    prefixRules: [
                        'Add role context: "As an expert in [domain]..."',
                        'Request step-by-step reasoning for complex tasks',
                        'Include specific examples when possible',
                        'Use clear, direct instructions'
                    ],
                    structureRules: [
                        'Break complex requests into numbered steps',
                        'Use "First do X, then Y, finally Z" format',
                        'Add constraints and requirements as bullet points',
                        'Specify output format explicitly'
                    ],
                    suffixRules: [
                        'Add: "Explain your reasoning"',
                        'Add: "Provide specific examples"',
                        'Add: "Consider edge cases"',
                        'Request alternatives when appropriate'
                    ],
                    avoidPatterns: [
                        'Overly complex nested instructions',
                        'Requests for real-time information',
                        'Extremely lengthy context (>8000 words)'
                    ]
                },
                maxOptimalLength: 4000,
                preferredStructure: 'conversational_structured'
            },

            claude: {
                name: 'Claude',
                strengths: ['analysis', 'long_context', 'structured_thinking', 'nuanced_reasoning'],
                weaknesses: ['creative_writing', 'real_time_data', 'casual_conversation'],
                optimizations: {
                    prefixRules: [
                        'Use XML-like tags for complex structure: <task></task>',
                        'Add analytical depth requests',
                        'Request thorough consideration of nuances',
                        'Include context about stakes and implications'
                    ],
                    structureRules: [
                        'Use hierarchical organization with clear sections',
                        'Add <context>, <task>, <requirements> tags for complex prompts',
                        'Include background information for better analysis',
                        'Structure multi-part requests clearly'
                    ],
                    suffixRules: [
                        'Add: "Think through this step-by-step"',
                        'Add: "Consider potential counterarguments"',
                        'Add: "Provide nuanced analysis"',
                        'Request evidence-based reasoning'
                    ],
                    avoidPatterns: [
                        'Overly casual language',
                        'Requests for purely creative content',
                        'Vague or ambiguous instructions'
                    ]
                },
                maxOptimalLength: 8000,
                preferredStructure: 'analytical_hierarchical'
            },

            perplexity: {
                name: 'Perplexity',
                strengths: ['research', 'current_information', 'citations', 'factual_accuracy'],
                weaknesses: ['creative_writing', 'code_generation', 'subjective_analysis'],
                optimizations: {
                    prefixRules: [
                        'Frame as research question',
                        'Request current information explicitly',
                        'Ask for multiple perspectives',
                        'Specify time range for information'
                    ],
                    structureRules: [
                        'Lead with specific research question',
                        'Include context about what information is needed',
                        'Request comparative analysis when relevant',
                        'Ask for trend analysis and recent developments'
                    ],
                    suffixRules: [
                        'Add: "Include sources and citations"',
                        'Add: "Focus on recent developments"',
                        'Add: "Provide data and statistics"',
                        'Request credible sources'
                    ],
                    avoidPatterns: [
                        'Creative or artistic requests',
                        'Purely subjective questions',
                        'Code generation requests'
                    ]
                },
                maxOptimalLength: 2000,
                preferredStructure: 'research_focused'
            },

            gemini: {
                name: 'Gemini',
                strengths: ['real_time_data', 'multimodal', 'structured_responses', 'factual_queries'],
                weaknesses: ['long_conversations', 'creative_writing', 'complex_reasoning'],
                optimizations: {
                    prefixRules: [
                        'Be direct and specific',
                        'Break complex requests into simple questions',
                        'Request current information when relevant',
                        'Use clear, unambiguous language'
                    ],
                    structureRules: [
                        'Keep prompts focused and concise',
                        'Use simple, direct question format',
                        'Avoid nested or complex instructions',
                        'Structure as clear, single requests'
                    ],
                    suffixRules: [
                        'Add: "Provide current information"',
                        'Add: "Include recent data"',
                        'Add: "Be specific and factual"',
                        'Request structured format'
                    ],
                    avoidPatterns: [
                        'Overly complex or lengthy prompts',
                        'Highly creative or abstract requests',
                        'Multi-step complex reasoning tasks'
                    ]
                },
                maxOptimalLength: 1500,
                preferredStructure: 'direct_factual'
            }
        };
    }

    /**
     * Style-specific optimization rules
     */
    initializeStyleRules() {
        return {
            professional: {
                name: 'Professional',
                description: 'Business-focused with clear deliverables and formal language',
                characteristics: {
                    tone: 'formal_business',
                    structure: 'hierarchical_organized',
                    language: 'precise_professional',
                    focus: 'deliverables_outcomes'
                },
                optimizations: {
                    prefixEnhancements: [
                        'Add executive context: "For a [company/role], I need..."',
                        'Frame as business objective or goal',
                        'Include stakeholder considerations',
                        'Specify business impact and outcomes'
                    ],
                    structuralEnhancements: [
                        'Use business document structure (Executive Summary, Details, Action Items)',
                        'Add clear deliverables and timelines',
                        'Include success metrics and KPIs',
                        'Structure with professional headings'
                    ],
                    languageEnhancements: [
                        'Replace casual terms with professional equivalents',
                        'Add business terminology where appropriate',
                        'Use formal sentence structure',
                        'Include industry-specific context'
                    ],
                    outputRequirements: [
                        'Request actionable recommendations',
                        'Ask for risk assessment',
                        'Include implementation timeline',
                        'Specify format (presentation, report, memo)'
                    ]
                },
                expertRoles: [
                    'business consultant', 'strategy advisor', 'project manager',
                    'industry expert', 'executive coach', 'operations specialist'
                ]
            },

            creative: {
                name: 'Creative',
                description: 'Open-ended and inspirational with artistic focus',
                characteristics: {
                    tone: 'inspirational_open',
                    structure: 'flexible_organic',
                    language: 'expressive_imaginative',
                    focus: 'innovation_exploration'
                },
                optimizations: {
                    prefixEnhancements: [
                        'Set creative context: "Imagine..." or "Explore the possibilities..."',
                        'Encourage innovative thinking and novel approaches',
                        'Request multiple creative alternatives',
                        'Frame as exploration or discovery'
                    ],
                    structuralEnhancements: [
                        'Allow for organic, non-linear responses',
                        'Encourage brainstorming format',
                        'Request multiple perspectives or approaches',
                        'Use open-ended question structures'
                    ],
                    languageEnhancements: [
                        'Use evocative and descriptive language',
                        'Include sensory details and metaphors',
                        'Encourage emotional and intuitive responses',
                        'Replace technical terms with accessible language'
                    ],
                    outputRequirements: [
                        'Request creative alternatives and variations',
                        'Ask for inspiration and mood elements',
                        'Include visual or sensory descriptions',
                        'Encourage unconventional solutions'
                    ]
                },
                expertRoles: [
                    'creative director', 'artist', 'designer', 'storyteller',
                    'innovator', 'creative consultant', 'brand strategist'
                ]
            },

            technical: {
                name: 'Technical',
                description: 'Precise specifications with step-by-step methodology',
                characteristics: {
                    tone: 'precise_systematic',
                    structure: 'methodical_detailed',
                    language: 'technical_accurate',
                    focus: 'specifications_implementation'
                },
                optimizations: {
                    prefixEnhancements: [
                        'Define technical context and constraints',
                        'Specify system requirements and environment',
                        'Include relevant technical background',
                        'Frame as engineering or technical problem'
                    ],
                    structuralEnhancements: [
                        'Use systematic, step-by-step structure',
                        'Include technical specifications section',
                        'Add troubleshooting and edge case considerations',
                        'Structure with clear technical phases'
                    ],
                    languageEnhancements: [
                        'Use precise technical terminology',
                        'Include specific metrics and measurements',
                        'Add technical constraints and requirements',
                        'Reference industry standards and best practices'
                    ],
                    outputRequirements: [
                        'Request detailed implementation steps',
                        'Ask for code examples and technical specifics',
                        'Include testing and validation procedures',
                        'Specify technical documentation format'
                    ]
                },
                expertRoles: [
                    'software engineer', 'system architect', 'technical lead',
                    'DevOps engineer', 'data scientist', 'security specialist'
                ]
            },

            academic: {
                name: 'Academic',
                description: 'Research-focused with rigorous methodology and citations',
                characteristics: {
                    tone: 'scholarly_objective',
                    structure: 'rigorous_evidenced',
                    language: 'formal_precise',
                    focus: 'research_evidence'
                },
                optimizations: {
                    prefixEnhancements: [
                        'Frame as research question or hypothesis',
                        'Include academic context and scope',
                        'Specify research methodology preferences',
                        'Add literature review expectations'
                    ],
                    structuralEnhancements: [
                        'Use academic paper structure (intro, methodology, analysis, conclusion)',
                        'Include literature review and citation sections',
                        'Add hypothesis and research question sections',
                        'Structure with academic headings and sub-sections'
                    ],
                    languageEnhancements: [
                        'Use formal academic language and terminology',
                        'Include disciplinary-specific vocabulary',
                        'Add methodological considerations',
                        'Reference academic conventions and standards'
                    ],
                    outputRequirements: [
                        'Request citations and references',
                        'Ask for evidence-based analysis',
                        'Include peer-reviewed source requirements',
                        'Specify academic format (APA, MLA, Chicago)'
                    ]
                },
                expertRoles: [
                    'researcher', 'professor', 'academic analyst', 'scholar',
                    'research scientist', 'subject matter expert', 'doctoral advisor'
                ]
            }
        };
    }

    /**
     * Task detection patterns for automatic role assignment
     */
    initializeTaskPatterns() {
        return {
            business: {
                patterns: [
                    /business|strategy|market|company|revenue|profit|ROI|KPI/i,
                    /management|leadership|team|organization|operations/i,
                    /sales|marketing|customer|client|stakeholder/i,
                    /budget|financial|investment|cost|pricing/i
                ],
                confidence: 0.8,
                suggestedStyles: ['professional', 'technical'],
                expertRoles: ['business consultant', 'strategy advisor', 'operations specialist']
            },

            technical: {
                patterns: [
                    /code|programming|software|development|API|database/i,
                    /algorithm|architecture|system|infrastructure|deployment/i,
                    /bug|debug|error|exception|performance|optimization/i,
                    /framework|library|technology|integration|security/i
                ],
                confidence: 0.9,
                suggestedStyles: ['technical', 'professional'],
                expertRoles: ['software engineer', 'system architect', 'technical lead']
            },

            creative: {
                patterns: [
                    /creative|design|art|story|narrative|content/i,
                    /brand|visual|aesthetic|style|theme|concept/i,
                    /writing|copy|blog|article|social media/i,
                    /brainstorm|ideation|innovation|inspiration/i
                ],
                confidence: 0.8,
                suggestedStyles: ['creative', 'professional'],
                expertRoles: ['creative director', 'designer', 'content strategist']
            },

            research: {
                patterns: [
                    /research|study|analysis|investigate|examine/i,
                    /data|statistics|survey|findings|evidence/i,
                    /academic|scholarly|peer.?reviewed|literature/i,
                    /hypothesis|methodology|conclusions|references/i
                ],
                confidence: 0.9,
                suggestedStyles: ['academic', 'professional'],
                expertRoles: ['researcher', 'analyst', 'academic expert']
            },

            educational: {
                patterns: [
                    /teach|learn|explain|understand|tutorial|guide/i,
                    /lesson|course|curriculum|training|education/i,
                    /beginner|intermediate|advanced|step.?by.?step/i,
                    /example|practice|exercise|assessment/i
                ],
                confidence: 0.8,
                suggestedStyles: ['academic', 'technical'],
                expertRoles: ['educator', 'trainer', 'subject matter expert']
            }
        };
    }

    /**
     * Expert role definitions with specific prompt enhancements
     */
    initializeExpertRoles() {
        return {
            'business consultant': {
                prefix: 'As an experienced business consultant with expertise in strategic planning and operations optimization',
                enhancements: [
                    'Consider market dynamics and competitive landscape',
                    'Focus on ROI and business impact',
                    'Include risk assessment and mitigation strategies',
                    'Provide actionable recommendations with timelines'
                ]
            },
            
            'software engineer': {
                prefix: 'As a senior software engineer with extensive experience in system design and development',
                enhancements: [
                    'Consider scalability, maintainability, and performance',
                    'Include best practices and design patterns',
                    'Address security and reliability concerns',
                    'Provide code examples and implementation details'
                ]
            },
            
            'creative director': {
                prefix: 'As a creative director with extensive experience in brand strategy and innovative design',
                enhancements: [
                    'Focus on brand consistency and visual impact',
                    'Consider audience psychology and engagement',
                    'Explore multiple creative directions',
                    'Balance creativity with business objectives'
                ]
            },
            
            'researcher': {
                prefix: 'As a research specialist with expertise in methodology and data analysis',
                enhancements: [
                    'Ensure methodological rigor and validity',
                    'Consider sample size and statistical significance',
                    'Include relevant literature and citations',
                    'Address limitations and future research directions'
                ]
            }
        };
    }

    /**
     * Output structure templates for different styles
     */
    initializeOutputStructures() {
        return {
            professional: {
                structure: [
                    'Executive Summary',
                    'Current Situation',
                    'Recommendations',
                    'Implementation Plan',
                    'Success Metrics',
                    'Next Steps'
                ],
                format: 'formal_business_document'
            },

            creative: {
                structure: [
                    'Creative Vision',
                    'Conceptual Exploration',
                    'Multiple Approaches',
                    'Visual/Sensory Elements',
                    'Implementation Ideas'
                ],
                format: 'inspirational_brainstorm'
            },

            technical: {
                structure: [
                    'Technical Overview',
                    'Requirements and Constraints',
                    'Proposed Solution',
                    'Implementation Steps',
                    'Testing and Validation',
                    'Maintenance Considerations'
                ],
                format: 'technical_specification'
            },

            academic: {
                structure: [
                    'Research Question',
                    'Literature Review',
                    'Methodology',
                    'Analysis and Findings',
                    'Discussion and Implications',
                    'References'
                ],
                format: 'academic_paper'
            }
        };
    }

    /**
     * Contextual constraints and considerations
     */
    initializeConstraints() {
        return {
            length: {
                short: { min: 50, max: 200, purpose: 'quick_answers' },
                medium: { min: 200, max: 800, purpose: 'detailed_explanations' },
                long: { min: 800, max: 2000, purpose: 'comprehensive_analysis' },
                extensive: { min: 2000, max: 5000, purpose: 'in_depth_research' }
            },

            complexity: {
                basic: { level: 1, audience: 'general_public' },
                intermediate: { level: 2, audience: 'informed_users' },
                advanced: { level: 3, audience: 'professionals' },
                expert: { level: 4, audience: 'specialists' }
            },

            urgency: {
                immediate: { timeframe: 'real_time', detail_level: 'essential' },
                quick: { timeframe: 'minutes', detail_level: 'summary' },
                thorough: { timeframe: 'hours', detail_level: 'comprehensive' },
                research: { timeframe: 'days', detail_level: 'exhaustive' }
            }
        };
    }

    /**
     * Get platform-specific optimization rules
     */
    getPlatformRules(platform) {
        return this.platformRules[platform] || this.platformRules.chatgpt;
    }

    /**
     * Get style-specific optimization rules
     */
    getStyleRules(style) {
        return this.styleRules[style] || this.styleRules.professional;
    }

    /**
     * Detect task type from prompt text
     */
    detectTaskType(prompt) {
        const results = {};
        
        for (const [taskType, config] of Object.entries(this.taskDetectionPatterns)) {
            let matches = 0;
            let totalPatterns = config.patterns.length;
            
            for (const pattern of config.patterns) {
                if (pattern.test(prompt)) {
                    matches++;
                }
            }
            
            const confidence = (matches / totalPatterns) * config.confidence;
            if (confidence > 0.3) {
                results[taskType] = {
                    confidence,
                    suggestedStyles: config.suggestedStyles,
                    expertRoles: config.expertRoles
                };
            }
        }
        
        // Return the highest confidence task type
        const sortedResults = Object.entries(results)
            .sort(([,a], [,b]) => b.confidence - a.confidence);
        
        return sortedResults.length > 0 ? sortedResults[0] : null;
    }

    /**
     * Get expert role for detected task and style
     */
    getExpertRole(taskType, style) {
        const styleRules = this.getStyleRules(style);
        const expertRoles = styleRules.expertRoles || ['expert'];
        
        if (taskType && this.taskDetectionPatterns[taskType]) {
            const taskRoles = this.taskDetectionPatterns[taskType].expertRoles;
            // Find intersection of style and task roles
            const intersection = expertRoles.filter(role => taskRoles.includes(role));
            if (intersection.length > 0) {
                return intersection[0];
            }
        }
        
        return expertRoles[0];
    }

    /**
     * Generate contextual constraints based on prompt analysis
     */
    generateConstraints(prompt, style, platform) {
        const constraints = [];
        const promptLength = prompt.length;
        const wordCount = prompt.split(/\s+/).length;
        
        // Length-based constraints
        if (wordCount < 10) {
            constraints.push('Provide comprehensive detail to ensure complete understanding');
        } else if (wordCount > 100) {
            constraints.push('Organize response with clear sections and headings');
        }
        
        // Platform-based constraints
        const platformRules = this.getPlatformRules(platform);
        if (promptLength > platformRules.maxOptimalLength) {
            constraints.push(`Keep response focused - this platform works best with concise prompts`);
        }
        
        // Style-based constraints
        const styleRules = this.getStyleRules(style);
        if (style === 'professional') {
            constraints.push('Include actionable next steps and success metrics');
        } else if (style === 'academic') {
            constraints.push('Support all claims with evidence and provide citations');
        } else if (style === 'technical') {
            constraints.push('Include specific implementation details and code examples');
        } else if (style === 'creative') {
            constraints.push('Explore multiple creative approaches and alternatives');
        }
        
        return constraints;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizationRules;
} else if (typeof window !== 'undefined') {
    window.OptimizationRules = OptimizationRules;
} else {
    self.OptimizationRules = OptimizationRules;
}
