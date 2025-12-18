/**
 * ILAI Hyper Platform - Socratic AI Engine
 * 
 * Local AI tutor that NEVER gives direct answers.
 * Uses Transformers.js with a small language model (Phi-3/Gemma)
 * to run entirely in the browser for offline capability.
 * 
 * Pedagogical Approach:
 * - Only ask guiding questions
 * - Build on student's current understanding
 * - Celebrate discoveries
 */

import { pipeline, env } from '@xenova/transformers';

// Configure for browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Socratic system prompt - the core rules
const SOCRATIC_PROMPT = `You are a Socratic tutor. Your rules:
1. NEVER give direct answers
2. Ask ONE question at a time
3. Guide through progressive hints
4. Celebrate when they discover the answer
5. Use phrases like:
   - "What do you already know about...?"
   - "What might happen if...?"
   - "Can you think of an example where...?"
   
Example:
Student: "What's the capital of France?"
You: "Let's think about this. France is famous for a tower - do you know which city that tower is in?"

Example:
Student: "What is photosynthesis?"
You: "Great question! What do plants need to survive and grow?"`;

// Model loading state
let generator = null;
let isLoading = false;
let loadPromise = null;

/**
 * Initialize the local text generation model
 * Uses Phi-3-mini for good quality with reasonable size
 */
async function initGenerator() {
    if (generator) return generator;

    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;
    console.log('[Socratic] Loading local AI model...');

    // Try smaller model first for faster loading
    loadPromise = pipeline(
        'text-generation',
        'Xenova/Qwen2-0.5B-Instruct',  // Small but capable model
        {
            progress_callback: (progress) => {
                if (progress.status === 'progress') {
                    console.log(`[Socratic] Loading: ${Math.round(progress.progress)}%`);
                }
            }
        }
    ).then((model) => {
        generator = model;
        isLoading = false;
        console.log('[Socratic] Model loaded successfully');
        return generator;
    }).catch(async (error) => {
        console.warn('[Socratic] Failed to load Qwen, trying fallback...', error);
        // Fallback to even smaller model
        return pipeline('text-generation', 'Xenova/gpt2').then((model) => {
            generator = model;
            isLoading = false;
            console.log('[Socratic] Fallback model loaded');
            return generator;
        });
    });

    return loadPromise;
}

/**
 * Generate a Socratic response to a student's question
 * @param {string} question - The student's question
 * @param {string} context - Optional context about what they're studying
 * @param {Array<{role: string, content: string}>} history - Conversation history
 * @returns {Promise<string>} The Socratic response
 */
export async function socraticResponse(question, context = '', history = []) {
    const model = await initGenerator();

    // Build the prompt
    let prompt = `${SOCRATIC_PROMPT}\n\n`;

    if (context) {
        prompt += `Context: The student is studying ${context}.\n\n`;
    }

    prompt += `Conversation:\n`;

    // Add history
    for (const msg of history.slice(-4)) { // Keep last 4 exchanges for context
        const role = msg.role === 'user' ? 'Student' : 'Tutor';
        prompt += `${role}: ${msg.content}\n`;
    }

    // Add current question
    prompt += `Student: ${question}\nTutor:`;

    try {
        const response = await model(prompt, {
            max_new_tokens: 100,
            temperature: 0.7,
            do_sample: true,
            top_p: 0.9,
        });

        // Extract the generated text
        let text = response[0].generated_text;

        // Remove the prompt from the response
        if (text.startsWith(prompt)) {
            text = text.slice(prompt.length);
        }

        // Clean up the response
        text = text.trim();

        // Stop at first newline (to get just the question)
        const newlineIndex = text.indexOf('\n');
        if (newlineIndex > 0) {
            text = text.slice(0, newlineIndex);
        }

        // Ensure it ends with a question mark (Socratic method!)
        if (!text.endsWith('?') && !text.endsWith('!')) {
            // If it doesn't look like a question, add a guiding question
            text = text + ' What do you think?';
        }

        return text;
    } catch (error) {
        console.error('[Socratic] Generation error:', error);
        return "That's an interesting question! What do you already know about this topic?";
    }
}

/**
 * Check if the model is ready for generation
 */
export function isModelReady() {
    return generator !== null;
}

/**
 * Preload the model (call on app start or when entering study mode)
 */
export async function preloadSocraticModel() {
    try {
        await initGenerator();
        return true;
    } catch (error) {
        console.error('[Socratic] Failed to preload model:', error);
        return false;
    }
}

/**
 * Get a hint without giving the answer
 * Used when student is stuck
 */
export async function getHint(topic, studentAttempt = '') {
    const question = studentAttempt
        ? `I'm trying to understand ${topic}. I think ${studentAttempt}`
        : `I'm stuck on understanding ${topic}`;

    return socraticResponse(question, topic);
}

/**
 * Celebrate a correct discovery
 */
export function celebrateDiscovery(discovery) {
    const celebrations = [
        `Excellent! You've discovered that ${discovery}! 🎉`,
        `That's exactly right! ${discovery} - you figured it out yourself! ✨`,
        `Brilliant thinking! You've understood that ${discovery}. 🌟`,
        `You got it! ${discovery} - and you discovered it through your own reasoning! 💡`,
    ];

    return celebrations[Math.floor(Math.random() * celebrations.length)];
}

/**
 * Generate a sequence of guiding questions for a topic
 * @param {string} topic - The topic to teach
 * @param {number} steps - Number of questions to generate
 */
export async function generateGuidingQuestions(topic, steps = 3) {
    const model = await initGenerator();

    const prompt = `Generate ${steps} simple guiding questions to help a student discover the concept of "${topic}" on their own. 
Each question should build on the previous one. Format as numbered list.
Questions:`;

    try {
        const response = await model(prompt, {
            max_new_tokens: 200,
            temperature: 0.7,
        });

        let text = response[0].generated_text.slice(prompt.length).trim();

        // Parse into array
        const questions = text
            .split('\n')
            .filter(line => line.match(/^\d+\./))
            .map(line => line.replace(/^\d+\.\s*/, '').trim());

        return questions;
    } catch (error) {
        console.error('[Socratic] Failed to generate questions:', error);
        return [
            `What do you already know about ${topic}?`,
            `Can you think of an example of ${topic} in real life?`,
            `How would you explain ${topic} to a friend?`,
        ];
    }
}

export default {
    socraticResponse,
    isModelReady,
    preloadSocraticModel,
    getHint,
    celebrateDiscovery,
    generateGuidingQuestions,
    SOCRATIC_PROMPT,
};
