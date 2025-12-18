/**
 * ILAI Hyper Platform - AI Context Enhancer
 * 
 * Injects user learning profile into AI prompts automatically.
 * This bridges the background learning to the agentic AI.
 */

import { getLearningService } from './background-learning';

/**
 * Enhance AI prompt with user learning context
 * 
 * @param {string} originalPrompt - The original AI prompt
 * @returns {Promise<string>} - Enhanced prompt with user context
 */
export async function enhancePromptWithLearning(originalPrompt) {
    try {
        const service = await getLearningService();
        const context = await service.getLearningContext();

        if (!context.promptContext) {
            return originalPrompt;
        }

        // Prepend learning context to prompt
        return `${context.promptContext}\n\n---\n\n${originalPrompt}`;
    } catch (error) {
        console.error('[AI Enhancer] Failed to get learning context:', error);
        return originalPrompt;
    }
}

/**
 * Get personalized AI system prompt additions
 */
export async function getPersonalizedSystemPrompt() {
    try {
        const service = await getLearningService();
        const context = await service.getLearningContext();

        const additions = [];

        // Add weak areas focus
        if (context.weakAreas?.length > 0) {
            const topics = context.weakAreas.map(w => w.topic).join(', ');
            additions.push(
                `The student is struggling with: ${topics}. Provide extra help and simpler explanations on these topics.`
            );
        }

        // Add learning style
        if (context.preferences?.engagementStyle) {
            switch (context.preferences.engagementStyle) {
                case 'thorough':
                    additions.push('This student prefers detailed, comprehensive explanations.');
                    break;
                case 'skimmer':
                    additions.push('This student prefers brief, to-the-point answers. Keep responses concise.');
                    break;
                default:
                    additions.push('This student prefers balanced explanations.');
            }
        }

        // Add content length preference
        if (context.preferences?.preferredContentLength) {
            switch (context.preferences.preferredContentLength) {
                case 'short':
                    additions.push('Keep responses under 100 words when possible.');
                    break;
                case 'long':
                    additions.push('Provide thorough explanations with examples.');
                    break;
            }
        }

        // Add strengths to leverage
        if (context.strengths) {
            const strongTopics = Object.entries(context.strengths)
                .filter(([_, s]) => s >= 80)
                .map(([t]) => t);

            if (strongTopics.length > 0) {
                additions.push(
                    `The student is strong in: ${strongTopics.join(', ')}. You can use these as anchor points for analogies.`
                );
            }
        }

        return additions.join('\n');
    } catch (error) {
        console.error('[AI Enhancer] Failed to build personalized prompt:', error);
        return '';
    }
}

/**
 * Middleware for AI service calls
 * Wraps any AI call to automatically enhance with learning context
 */
export function createLearningEnhancedAI(aiService) {
    return {
        ...aiService,

        async generate(prompt, options = {}) {
            const enhancedPrompt = await enhancePromptWithLearning(prompt);
            return aiService.generate(enhancedPrompt, options);
        },

        async chat(messages, options = {}) {
            // Enhance system message with personalization
            const personalizedAddition = await getPersonalizedSystemPrompt();

            if (personalizedAddition && messages.length > 0) {
                const systemIndex = messages.findIndex(m => m.role === 'system');
                if (systemIndex >= 0) {
                    messages[systemIndex].content += `\n\n${personalizedAddition}`;
                } else {
                    messages.unshift({
                        role: 'system',
                        content: personalizedAddition
                    });
                }
            }

            return aiService.chat(messages, options);
        }
    };
}

/**
 * Get recommended content based on learning profile
 */
export async function getRecommendedTopics() {
    try {
        const service = await getLearningService();
        const context = await service.getLearningContext();

        const recommendations = [];

        // Priority 1: Weak areas
        for (const weak of context.weakAreas || []) {
            recommendations.push({
                topic: weak.topic,
                reason: 'Needs improvement',
                priority: 'high',
                strength: weak.strength
            });
        }

        // Priority 2: Not practiced recently (would need more event tracking)
        // This could be enhanced with recency data

        // Priority 3: Building on strengths
        const strengths = context.strengths || {};
        for (const [topic, strength] of Object.entries(strengths)) {
            if (strength >= 80) {
                recommendations.push({
                    topic: topic + ' - Advanced',
                    reason: 'Ready for next level',
                    priority: 'medium',
                    strength
                });
            }
        }

        return recommendations;
    } catch (error) {
        console.error('[AI Enhancer] Failed to get recommendations:', error);
        return [];
    }
}

export default {
    enhancePromptWithLearning,
    getPersonalizedSystemPrompt,
    createLearningEnhancedAI,
    getRecommendedTopics
};
