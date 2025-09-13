/**
 * MyAyAI Quality Scorer
 * Comprehensive quality evaluation and scoring system for prompts
 */

class QualityScorer {
    constructor() {
        this.scoringCriteria = this.initializeScoringCriteria();
        this.improvementCategories = this.initializeImprovementCategories();
        this.confidenceFactors = this.initializeConfidenceFactors();
        this.timeSavingMetrics = this.initializeTimeSavingMetrics();
    }

    /**
     * Initialize comprehensive scoring criteria
     */
    initializeScoringCriteria() {
        return {
            clarity: {
                weight: 0.25,
                description: 'How clear and understandable the prompt is',
                factors: [
                    { name: 'language_simplicity', weight: 0.3, evaluator: this.evaluateLanguageSimplicity },
                    { name: 'structure_coherence', weight: 0.3, evaluator: this.evaluateStructureCoherence },
                    { name: 'ambiguity_level', weight: 0.2, evaluator: this.evaluateAmbiguityLevel },
                    { name: 'instruction_clarity', weight: 0.2, evaluator: this.evaluateInstructionClarity }
                ]
            },

            specificity: {
                weight: 0.25,
                description: 'How specific and detailed the requirements are',
                factors: [
                    { name: 'detail_level', weight: 0.4, evaluator: this.evaluateDetailLevel },
                    { name: 'constraint_definition', weight: 0.3, evaluator: this.evaluateConstraintDefinition },
                    { name: 'example_usage', weight: 0.2, evaluator: this.evaluateExampleUsage },
                    { name: 'measurable_outcomes', weight: 0.1, evaluator: this.evaluateMeasurableOutcomes }
                ]
            },

            context: {
                weight: 0.2,
                description: 'Amount and relevance of contextual information provided',
                factors: [
                    { name: 'background_info', weight: 0.4, evaluator: this.evaluateBackgroundInfo },
                    { name: 'use_case_clarity', weight: 0.3, evaluator: this.evaluateUseCaseClarity },
                    { name: 'domain_context', weight: 0.2, evaluator: this.evaluateDomainContext },
                    { name: 'stakeholder_info', weight: 0.1, evaluator: this.evaluateStakeholderInfo }
                ]
            },

            structure: {
                weight: 0.15,
                description: 'Organization and formatting of the prompt',
                factors: [
                    { name: 'logical_flow', weight: 0.3, evaluator: this.evaluateLogicalFlow },
                    { name: 'section_organization', weight: 0.3, evaluator: this.evaluateSectionOrganization },
                    { name: 'formatting_quality', weight: 0.2, evaluator: this.evaluateFormattingQuality },
                    { name: 'readability_score', weight: 0.2, evaluator: this.evaluateReadabilityScore }
                ]
            },

            completeness: {
                weight: 0.15,
                description: 'Whether all necessary information is included',
                factors: [
                    { name: 'requirement_coverage', weight: 0.4, evaluator: this.evaluateRequirementCoverage },
                    { name: 'output_specification', weight: 0.3, evaluator: this.evaluateOutputSpecification },
                    { name: 'edge_case_consideration', weight: 0.2, evaluator: this.evaluateEdgeCaseConsideration },
                    { name: 'follow_up_prevention', weight: 0.1, evaluator: this.evaluateFollowUpPrevention }
                ]
            }
        };
    }

    /**
     * Initialize improvement categories for badge generation
     */
    initializeImprovementCategories() {
        return {
            major_improvements: {
                threshold: 25,
                badge: '🚀 Major Enhancement',
                color: '#00C851',
                description: 'Significant improvements that will substantially enhance response quality'
            },
            clarity_boost: {
                threshold: 15,
                badge: '🔍 Clarity Boost',
                color: '#2196F3',
                description: 'Enhanced clarity and understandability'
            },
            structure_upgrade: {
                threshold: 12,
                badge: '📋 Structure Upgrade',
                color: '#FF9800',
                description: 'Better organization and formatting'
            },
            context_enrichment: {
                threshold: 10,
                badge: '🎯 Context Enrichment',
                color: '#9C27B0',
                description: 'Added valuable context and background'
            },
            specificity_enhancement: {
                threshold: 8,
                badge: '🔧 Precision Enhancement',
                color: '#607D8B',
                description: 'More specific requirements and details'
            },
            platform_optimization: {
                threshold: 5,
                badge: '⚡ Platform Optimized',
                color: '#4CAF50',
                description: 'Optimized for the specific AI platform'
            },
            minor_polish: {
                threshold: 2,
                badge: '✨ Polish & Refinement',
                color: '#FFC107',
                description: 'Minor improvements and refinements'
            }
        };
    }

    /**
     * Initialize confidence calculation factors
     */
    initializeConfidenceFactors() {
        return {
            prompt_length: { min: 20, optimal: 200, max: 1000, weight: 0.1 },
            word_count: { min: 5, optimal: 50, max: 300, weight: 0.1 },
            sentence_count: { min: 2, optimal: 8, max: 20, weight: 0.1 },
            complexity_match: { weight: 0.2 },
            platform_alignment: { weight: 0.2 },
            style_consistency: { weight: 0.15 },
            task_clarity: { weight: 0.15 }
        };
    }

    /**
     * Initialize time-saving calculation metrics
     */
    initializeTimeSavingMetrics() {
        return {
            base_interaction_time: 2, // minutes for basic back-and-forth
            clarification_time: 3, // minutes per clarification needed
            revision_time: 4, // minutes per major revision
            context_gathering_time: 5, // minutes for missing context
            specificity_time: 2, // minutes for vague requirements
            structure_time: 1.5, // minutes for poor organization
            platform_mismatch_penalty: 3 // minutes for platform-inappropriate prompts
        };
    }

    /**
     * Calculate comprehensive quality score for a prompt
     */
    calculateQualityScore(prompt, style = 'professional', platform = 'chatgpt') {
        const analysis = this.analyzePrompt(prompt);
        const scores = {};
        let totalWeightedScore = 0;
        let totalWeight = 0;

        // Calculate score for each criterion
        for (const [criterion, config] of Object.entries(this.scoringCriteria)) {
            const criterionScore = this.calculateCriterionScore(prompt, analysis, criterion, config, style, platform);
            scores[criterion] = {
                score: criterionScore,
                weight: config.weight,
                weightedScore: criterionScore * config.weight,
                description: config.description
            };
            
            totalWeightedScore += criterionScore * config.weight;
            totalWeight += config.weight;
        }

        const overallScore = Math.round(totalWeightedScore / totalWeight);
        const grade = this.calculateGrade(overallScore);

        return {
            overall: overallScore,
            grade,
            breakdown: scores,
            analysis,
            recommendations: this.generateRecommendations(scores, analysis, style, platform)
        };
    }

    /**
     * Analyze prompt characteristics
     */
    analyzePrompt(prompt) {
        const words = prompt.trim().split(/\s+/).filter(w => w.length > 0);
        const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const paragraphs = prompt.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        
        return {
            length: prompt.length,
            wordCount: words.length,
            sentenceCount: sentences.length,
            paragraphCount: paragraphs.length,
            averageWordsPerSentence: words.length / Math.max(sentences.length, 1),
            averageSentencesPerParagraph: sentences.length / Math.max(paragraphs.length, 1),
            hasQuestions: /\?/.test(prompt),
            hasExamples: /(example|instance|such as|like|e\.g\.|for example)/i.test(prompt),
            hasConstraints: /(must|should|required|need|limit|constraint)/i.test(prompt),
            hasContext: /(context|background|situation|currently|because)/i.test(prompt),
            hasFormatting: /(\n|•|*|-|\d+\.|\#)/test(prompt),
            hasStructure: paragraphs.length > 1 || /(\n.*:|\#.*\n|^\d+\.|\n\s*-|\n\s*\*)/m.test(prompt),
            complexityIndicators: this.calculateComplexityIndicators(prompt, words, sentences)
        };
    }

    /**
     * Calculate complexity indicators
     */
    calculateComplexityIndicators(prompt, words, sentences) {
        const technicalTerms = words.filter(word => 
            /^[A-Z]{2,}$/.test(word) || // Acronyms
            /[A-Z][a-z]+[A-Z]/.test(word) || // CamelCase
            word.includes('_') || // snake_case
            word.includes('-') // kebab-case
        ).length;
        
        const complexWords = words.filter(word => word.length > 6).length;
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
        const nestedStructures = (prompt.match(/\([^)]*\)/g) || []).length + 
                               (prompt.match(/\[[^\]]*\]/g) || []).length;
        
        return {
            technicalTerms,
            complexWords,
            avgWordsPerSentence,
            nestedStructures,
            complexityScore: Math.min(100, 
                (technicalTerms * 3) + 
                (complexWords * 1.5) + 
                (avgWordsPerSentence > 20 ? 10 : 0) + 
                (nestedStructures * 2)
            )
        };
    }

    /**
     * Calculate score for individual criterion
     */
    calculateCriterionScore(prompt, analysis, criterion, config, style, platform) {
        let totalScore = 0;
        let totalWeight = 0;

        for (const factor of config.factors) {
            const factorScore = factor.evaluator.call(this, prompt, analysis, style, platform);
            totalScore += factorScore * factor.weight;
            totalWeight += factor.weight;
        }

        return Math.round(totalScore / totalWeight);
    }

    /**
     * Individual evaluation methods for clarity factors
     */
    evaluateLanguageSimplicity(prompt, analysis) {
        const complexWordRatio = analysis.complexityIndicators.complexWords / Math.max(analysis.wordCount, 1);
        const avgWordsPerSentence = analysis.complexityIndicators.avgWordsPerSentence;
        
        let score = 100;
        if (complexWordRatio > 0.3) score -= 20;
        if (avgWordsPerSentence > 25) score -= 15;
        if (avgWordsPerSentence > 30) score -= 15;
        if (analysis.complexityIndicators.nestedStructures > 3) score -= 10;
        
        return Math.max(0, score);
    }

    evaluateStructureCoherence(prompt, analysis) {
        let score = 60; // Base score
        
        if (analysis.hasStructure) score += 20;
        if (analysis.paragraphCount > 1) score += 10;
        if (analysis.hasFormatting) score += 10;
        
        // Penalize if structure is inconsistent
        const inconsistentFormatting = /(\n\s*\d+\..*\n\s*[a-zA-Z])|(\n\s*-.*\n\s*\d+\.)/m.test(prompt);
        if (inconsistentFormatting) score -= 15;
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateAmbiguityLevel(prompt, analysis) {
        let score = 100;
        
        // Check for vague terms
        const vagueTerms = ['thing', 'stuff', 'something', 'anything', 'some', 'any', 'various'];
        const vagueCount = vagueTerms.filter(term => prompt.toLowerCase().includes(term)).length;
        score -= vagueCount * 8;
        
        // Check for unclear pronouns without clear antecedents
        const unclearPronouns = (prompt.match(/\b(this|that|these|those|it)\b/gi) || []).length;
        if (unclearPronouns > analysis.sentenceCount * 0.3) score -= 10;
        
        // Check for multiple interpretations
        const ambiguousWords = ['might', 'maybe', 'possibly', 'perhaps', 'could be'];
        const ambiguousCount = ambiguousWords.filter(word => prompt.toLowerCase().includes(word)).length;
        score -= ambiguousCount * 5;
        
        return Math.max(0, score);
    }

    evaluateInstructionClarity(prompt, analysis) {
        let score = 70; // Base score
        
        // Boost for clear action words
        const actionWords = ['create', 'write', 'analyze', 'explain', 'compare', 'list', 'describe'];
        const hasActionWords = actionWords.some(word => prompt.toLowerCase().includes(word));
        if (hasActionWords) score += 15;
        
        // Boost for questions
        if (analysis.hasQuestions) score += 10;
        
        // Boost for specific instructions
        if (/please\s+(provide|give|show|explain|create|write)/i.test(prompt)) score += 5;
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Specificity evaluation methods
     */
    evaluateDetailLevel(prompt, analysis) {
        let score = 50; // Base score
        
        // Word count factor
        if (analysis.wordCount > 30) score += 15;
        if (analysis.wordCount > 50) score += 10;
        if (analysis.wordCount > 100) score += 10;
        
        // Specific details
        if (analysis.hasExamples) score += 15;
        if (analysis.hasConstraints) score += 10;
        
        // Numbers and measurements
        const hasNumbers = /\d+/.test(prompt);
        if (hasNumbers) score += 5;
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateConstraintDefinition(prompt, analysis) {
        let score = 40; // Base score
        
        if (analysis.hasConstraints) score += 30;
        
        // Look for specific constraint types
        const constraintTypes = [
            /length|word count|characters/i,
            /format|style|tone/i,
            /deadline|time|urgent/i,
            /budget|cost|resource/i
        ];
        
        const constraintCount = constraintTypes.filter(pattern => pattern.test(prompt)).length;
        score += constraintCount * 7.5;
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateExampleUsage(prompt, analysis) {
        let score = 30; // Base score
        
        if (analysis.hasExamples) score += 40;
        
        // Count different types of examples
        const examplePatterns = [
            /for example/i,
            /such as/i,
            /like\s+[a-zA-Z]/i,
            /e\.g\./i,
            /instance/i
        ];
        
        const exampleCount = examplePatterns.filter(pattern => pattern.test(prompt)).length;
        score += Math.min(30, exampleCount * 10);
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateMeasurableOutcomes(prompt, analysis) {
        let score = 40; // Base score
        
        // Look for measurable terms
        const measurableTerms = [
            /\d+%/,
            /\d+\s+(words?|characters?|pages?|items?|points?)/i,
            /(increase|decrease|improve)\s+by/i,
            /within\s+\d+/i,
            /(goal|target|objective|metric)/i
        ];
        
        const measurableCount = measurableTerms.filter(pattern => pattern.test(prompt)).length;
        score += Math.min(60, measurableCount * 20);
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Context evaluation methods
     */
    evaluateBackgroundInfo(prompt, analysis) {
        let score = 30; // Base score
        
        if (analysis.hasContext) score += 30;
        
        // Look for background indicators
        const backgroundIndicators = [
            /currently/i,
            /background/i,
            /context/i,
            /situation/i,
            /working on/i,
            /need\s+(this|it)\s+for/i
        ];
        
        const backgroundCount = backgroundIndicators.filter(pattern => pattern.test(prompt)).length;
        score += Math.min(40, backgroundCount * 10);
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateUseCaseClarity(prompt, analysis) {
        let score = 40; // Base score
        
        // Look for use case indicators
        const useCasePatterns = [
            /will use this (for|to)/i,
            /need this (for|to)/i,
            /purpose/i,
            /goal/i,
            /objective/i,
            /intended for/i
        ];
        
        const useCaseCount = useCasePatterns.filter(pattern => pattern.test(prompt)).length;
        score += Math.min(60, useCaseCount * 20);
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateDomainContext(prompt, analysis) {
        let score = 50; // Base score
        
        // Check for domain-specific terminology
        const domainIndicators = [
            /(company|business|enterprise|organization)/i,
            /(technical|software|programming|code)/i,
            /(academic|research|study|paper)/i,
            /(creative|design|art|brand)/i,
            /(medical|legal|financial|marketing)/i
        ];
        
        const domainMatches = domainIndicators.filter(pattern => pattern.test(prompt)).length;
        if (domainMatches > 0) score += 30;
        if (domainMatches > 1) score += 20;
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateStakeholderInfo(prompt, analysis) {
        let score = 50; // Base score
        
        // Look for stakeholder mentions
        const stakeholderTerms = [
            /(team|colleague|client|customer|user)/i,
            /(manager|boss|supervisor|director)/i,
            /(audience|reader|viewer|participant)/i,
            /(stakeholder|decision maker)/i
        ];
        
        const stakeholderCount = stakeholderTerms.filter(pattern => pattern.test(prompt)).length;
        score += Math.min(50, stakeholderCount * 15);
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Structure evaluation methods
     */
    evaluateLogicalFlow(prompt, analysis) {
        let score = 60; // Base score
        
        if (analysis.paragraphCount > 1) score += 20;
        if (analysis.hasStructure) score += 20;
        
        // Check for logical connectors
        const connectors = ['first', 'then', 'next', 'finally', 'because', 'therefore', 'however'];
        const connectorCount = connectors.filter(conn => prompt.toLowerCase().includes(conn)).length;
        if (connectorCount > 0) score += Math.min(15, connectorCount * 5);
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateSectionOrganization(prompt, analysis) {
        let score = 40; // Base score
        
        if (analysis.hasStructure) score += 30;
        if (analysis.paragraphCount > 2) score += 15;
        if (analysis.hasFormatting) score += 15;
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateFormattingQuality(prompt, analysis) {
        let score = 50; // Base score
        
        if (analysis.hasFormatting) score += 25;
        
        // Check for consistent formatting
        const hasBullets = /^\s*[-*•]\s/m.test(prompt);
        const hasNumbers = /^\s*\d+\.\s/m.test(prompt);
        const hasHeaders = /^#+\s+/m.test(prompt);
        
        if (hasBullets || hasNumbers || hasHeaders) score += 25;
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateReadabilityScore(prompt, analysis) {
        // Simplified readability calculation
        const avgWordsPerSentence = analysis.averageWordsPerSentence;
        const complexWordRatio = analysis.complexityIndicators.complexWords / Math.max(analysis.wordCount, 1);
        
        let score = 100;
        if (avgWordsPerSentence > 20) score -= 15;
        if (avgWordsPerSentence > 30) score -= 15;
        if (complexWordRatio > 0.3) score -= 20;
        
        // Boost for good structure
        if (analysis.hasStructure) score += 10;
        if (analysis.paragraphCount > 1) score += 5;
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Completeness evaluation methods
     */
    evaluateRequirementCoverage(prompt, analysis) {
        let score = 50; // Base score
        
        // Check for comprehensive requirement indicators
        if (analysis.hasConstraints) score += 20;
        if (analysis.hasContext) score += 15;
        if (analysis.hasExamples) score += 15;
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateOutputSpecification(prompt, analysis) {
        let score = 30; // Base score
        
        // Look for output format specifications
        const formatSpecifiers = [
            /format/i,
            /structure/i,
            /organize/i,
            /(list|bullet|table|paragraph)/i,
            /(json|xml|csv|markdown)/i
        ];
        
        const formatCount = formatSpecifiers.filter(pattern => pattern.test(prompt)).length;
        score += Math.min(70, formatCount * 20);
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateEdgeCaseConsideration(prompt, analysis) {
        let score = 40; // Base score
        
        // Look for edge case indicators
        const edgeCaseTerms = [
            /edge case/i,
            /exception/i,
            /what if/i,
            /consider/i,
            /handle/i,
            /address/i
        ];
        
        const edgeCaseCount = edgeCaseTerms.filter(pattern => pattern.test(prompt)).length;
        score += Math.min(60, edgeCaseCount * 15);
        
        return Math.max(0, Math.min(100, score));
    }

    evaluateFollowUpPrevention(prompt, analysis) {
        let score = 50; // Base score
        
        // Comprehensive prompts reduce follow-ups
        if (analysis.wordCount > 50) score += 15;
        if (analysis.hasContext && analysis.hasConstraints) score += 20;
        if (analysis.hasExamples) score += 15;
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate confidence score between original and optimized prompts
     */
    calculateConfidence(originalPrompt, optimizedPrompt, platform = 'chatgpt', style = 'professional') {
        const originalScore = this.calculateQualityScore(originalPrompt, style, platform);
        const optimizedScore = this.calculateQualityScore(optimizedPrompt, style, platform);
        
        const improvement = optimizedScore.overall - originalScore.overall;
        const factors = this.confidenceFactors;
        
        let confidence = 50; // Base confidence
        
        // Factor in the improvement magnitude
        if (improvement > 0) confidence += Math.min(30, improvement * 1.5);
        if (improvement < 0) confidence -= Math.min(30, Math.abs(improvement) * 2);
        
        // Length optimization factor
        const originalLength = originalPrompt.length;
        const optimizedLength = optimizedPrompt.length;
        const lengthRatio = optimizedLength / Math.max(originalLength, 1);
        
        if (lengthRatio >= 1.2 && lengthRatio <= 2.5) confidence += 10;
        if (lengthRatio > 3) confidence -= 5;
        
        // Structural improvements
        const originalAnalysis = this.analyzePrompt(originalPrompt);
        const optimizedAnalysis = this.analyzePrompt(optimizedPrompt);
        
        if (optimizedAnalysis.hasStructure && !originalAnalysis.hasStructure) confidence += 15;
        if (optimizedAnalysis.hasContext && !originalAnalysis.hasContext) confidence += 10;
        if (optimizedAnalysis.hasExamples && !originalAnalysis.hasExamples) confidence += 8;
        
        return Math.max(0, Math.min(100, Math.round(confidence)));
    }

    /**
     * Generate improvement explanations as badges
     */
    explainImprovements(originalPrompt, optimizedPrompt, platform = 'chatgpt', style = 'professional') {
        const originalScore = this.calculateQualityScore(originalPrompt, style, platform);
        const optimizedScore = this.calculateQualityScore(optimizedPrompt, style, platform);
        
        const improvements = [];
        const overallImprovement = optimizedScore.overall - originalScore.overall;
        
        // Analyze improvements by category
        for (const [category, originalData] of Object.entries(originalScore.breakdown)) {
            const optimizedData = optimizedScore.breakdown[category];
            const categoryImprovement = optimizedData.score - originalData.score;
            
            if (categoryImprovement >= 5) {
                improvements.push({
                    category,
                    improvement: categoryImprovement,
                    description: this.scoringCriteria[category].description,
                    impact: categoryImprovement >= 15 ? 'high' : categoryImprovement >= 8 ? 'medium' : 'low'
                });
            }
        }
        
        // Generate badges based on improvements
        const badges = [];
        
        if (overallImprovement >= this.improvementCategories.major_improvements.threshold) {
            badges.push(this.improvementCategories.major_improvements);
        }
        
        // Specific improvement badges
        const clarityImprovement = optimizedScore.breakdown.clarity.score - originalScore.breakdown.clarity.score;
        if (clarityImprovement >= this.improvementCategories.clarity_boost.threshold) {
            badges.push(this.improvementCategories.clarity_boost);
        }
        
        const structureImprovement = optimizedScore.breakdown.structure.score - originalScore.breakdown.structure.score;
        if (structureImprovement >= this.improvementCategories.structure_upgrade.threshold) {
            badges.push(this.improvementCategories.structure_upgrade);
        }
        
        const contextImprovement = optimizedScore.breakdown.context.score - originalScore.breakdown.context.score;
        if (contextImprovement >= this.improvementCategories.context_enrichment.threshold) {
            badges.push(this.improvementCategories.context_enrichment);
        }
        
        const specificityImprovement = optimizedScore.breakdown.specificity.score - originalScore.breakdown.specificity.score;
        if (specificityImprovement >= this.improvementCategories.specificity_enhancement.threshold) {
            badges.push(this.improvementCategories.specificity_enhancement);
        }
        
        // Platform optimization badge
        if (this.isPlatformOptimized(optimizedPrompt, platform)) {
            badges.push(this.improvementCategories.platform_optimization);
        }
        
        // Minor improvements
        if (overallImprovement >= this.improvementCategories.minor_polish.threshold && badges.length === 0) {
            badges.push(this.improvementCategories.minor_polish);
        }
        
        return {
            overallImprovement,
            categoryImprovements: improvements,
            badges,
            summary: this.generateImprovementSummary(overallImprovement, improvements, badges)
        };
    }

    /**
     * Calculate estimated time saved through optimization
     */
    calculateTimeSaved(optimization) {
        const metrics = this.timeSavingMetrics;
        let timeSaved = 0;
        
        // Base time saved from fewer clarifications needed
        const qualityImprovement = optimization.improvement?.overallImprovement || 0;
        if (qualityImprovement > 15) {
            timeSaved += metrics.clarification_time * 2; // Avoid 2 clarification rounds
        } else if (qualityImprovement > 8) {
            timeSaved += metrics.clarification_time; // Avoid 1 clarification round
        }
        
        // Time saved from better structure
        const structureImprovement = optimization.improvement?.categoryImprovements?.find(
            imp => imp.category === 'structure'
        )?.improvement || 0;
        
        if (structureImprovement > 10) {
            timeSaved += metrics.structure_time;
        }
        
        // Time saved from better context
        const contextImprovement = optimization.improvement?.categoryImprovements?.find(
            imp => imp.category === 'context'
        )?.improvement || 0;
        
        if (contextImprovement > 10) {
            timeSaved += metrics.context_gathering_time * 0.5;
        }
        
        // Time saved from better specificity
        const specificityImprovement = optimization.improvement?.categoryImprovements?.find(
            imp => imp.category === 'specificity'
        )?.improvement || 0;
        
        if (specificityImprovement > 10) {
            timeSaved += metrics.specificity_time;
        }
        
        // Platform optimization savings
        if (optimization.platformOptimized) {
            timeSaved += metrics.platform_mismatch_penalty * 0.3;
        }
        
        // Add base interaction improvement
        if (qualityImprovement > 5) {
            timeSaved += metrics.base_interaction_time * 0.5;
        }
        
        return Math.round(Math.max(0, timeSaved));
    }

    /**
     * Calculate letter grade from numerical score
     */
    calculateGrade(score) {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 87) return 'A-';
        if (score >= 83) return 'B+';
        if (score >= 80) return 'B';
        if (score >= 77) return 'B-';
        if (score >= 73) return 'C+';
        if (score >= 70) return 'C';
        if (score >= 67) return 'C-';
        if (score >= 63) return 'D+';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Check if prompt is optimized for specific platform
     */
    isPlatformOptimized(prompt, platform) {
        const platformIndicators = {
            chatgpt: [/step.?by.?step/i, /example/i, /explain.*reasoning/i],
            claude: [/<\w+>/i, /think.*through/i, /consider/i, /analysis/i],
            perplexity: [/research/i, /source/i, /citation/i, /current/i],
            gemini: [/current.*information/i, /recent/i, /data/i, /factual/i]
        };
        
        const indicators = platformIndicators[platform] || [];
        return indicators.some(pattern => pattern.test(prompt));
    }

    /**
     * Generate recommendations for quality improvement
     */
    generateRecommendations(scores, analysis, style, platform) {
        const recommendations = [];
        
        for (const [category, scoreData] of Object.entries(scores)) {
            if (scoreData.score < 70) {
                recommendations.push({
                    category,
                    priority: scoreData.score < 50 ? 'high' : 'medium',
                    suggestion: this.getCategoryRecommendation(category, scoreData.score, analysis, style, platform),
                    expectedImprovement: this.estimateImprovementPotential(category, scoreData.score)
                });
            }
        }
        
        return recommendations.sort((a, b) => {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        });
    }

    /**
     * Get specific recommendation for category
     */
    getCategoryRecommendation(category, score, analysis, style, platform) {
        const recommendations = {
            clarity: [
                'Use simpler, more direct language',
                'Break down complex sentences into shorter ones',
                'Define technical terms and acronyms',
                'Remove ambiguous words and phrases'
            ],
            specificity: [
                'Add specific details and requirements',
                'Include concrete examples',
                'Define measurable outcomes',
                'Specify constraints and limitations'
            ],
            context: [
                'Provide relevant background information',
                'Explain the use case and purpose',
                'Include domain or industry context',
                'Mention stakeholders and their needs'
            ],
            structure: [
                'Organize content with clear sections',
                'Use bullet points or numbered lists',
                'Add headers and formatting',
                'Ensure logical flow between ideas'
            ],
            completeness: [
                'Cover all necessary requirements',
                'Specify desired output format',
                'Consider edge cases and exceptions',
                'Include success criteria'
            ]
        };
        
        return recommendations[category] || ['General improvement needed'];
    }

    /**
     * Estimate improvement potential
     */
    estimateImprovementPotential(category, currentScore) {
        const maxImprovement = 100 - currentScore;
        const typicalImprovement = {
            clarity: 0.7,
            specificity: 0.8,
            context: 0.6,
            structure: 0.9,
            completeness: 0.75
        };
        
        return Math.round(maxImprovement * (typicalImprovement[category] || 0.7));
    }

    /**
     * Generate improvement summary text
     */
    generateImprovementSummary(overallImprovement, categoryImprovements, badges) {
        if (overallImprovement < 2) {
            return 'Minor refinements made to enhance prompt effectiveness';
        }
        
        const topImprovements = categoryImprovements
            .filter(imp => imp.improvement >= 8)
            .sort((a, b) => b.improvement - a.improvement)
            .slice(0, 2);
        
        if (topImprovements.length === 0) {
            return `Overall quality improved by ${overallImprovement} points through various enhancements`;
        }
        
        const improvementList = topImprovements.map(imp => imp.category.replace('_', ' ')).join(' and ');
        return `Significant improvements in ${improvementList}, boosting overall quality by ${overallImprovement} points`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QualityScorer;
} else if (typeof window !== 'undefined') {
    window.QualityScorer = QualityScorer;
} else {
    self.QualityScorer = QualityScorer;
}
