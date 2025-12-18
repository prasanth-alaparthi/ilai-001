/**
 * ILAI Hyper Platform - Learning Module
 * 
 * Background learning service that observes user behavior
 * and enhances AI responses with personalization.
 */

export { default as BackgroundLearningService, getLearningService } from './background-learning';
export { useLearningTracker, useScrollTracker, useLearningInsights } from './useLearningTracker';
export {
    enhancePromptWithLearning,
    getPersonalizedSystemPrompt,
    createLearningEnhancedAI,
    getRecommendedTopics
} from './ai-enhancer';
