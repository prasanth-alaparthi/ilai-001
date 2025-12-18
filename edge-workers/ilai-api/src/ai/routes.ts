/**
 * AI Routes - Edge Layer
 * 
 * Routes AI requests through Cloudflare AI Gateway for:
 * - Response caching (reduce API costs)
 * - Failover between providers (Gemini -> Groq -> Claude)
 * - Rate limiting and analytics
 */

import { Hono } from 'hono';

interface Env {
    AI_CACHE: KVNamespace;
    ORIGIN_API_URL: string;
    GEMINI_API_KEY: string;
    GROQ_API_KEY?: string;
}

export const aiRoutes = new Hono<{ Bindings: Env }>();

// Cache TTL for AI responses (5 minutes)
const CACHE_TTL = 300;

/**
 * Generate AI response with edge caching
 */
aiRoutes.post('/generate', async (c) => {
    const body = await c.req.json();
    const { prompt, model = 'gemini-1.5-flash', options = {} } = body;

    // Create cache key from prompt hash
    const cacheKey = await hashPrompt(prompt, model);

    // Check cache first
    if (!options.noCache) {
        const cached = await c.env.AI_CACHE.get(cacheKey);
        if (cached) {
            return c.json({
                text: cached,
                cached: true,
                model,
            });
        }
    }

    // Try primary provider (Gemini)
    let response = await callGemini(c.env.GEMINI_API_KEY, prompt, model);

    // Fallback to Groq if Gemini fails
    if (!response.ok && c.env.GROQ_API_KEY) {
        console.log('Gemini failed, falling back to Groq');
        response = await callGroq(c.env.GROQ_API_KEY, prompt);
    }

    if (!response.ok) {
        return c.json({ error: 'AI generation failed' }, 500);
    }

    const data = await response.json();
    const text = extractText(data, model);

    // Cache successful response
    await c.env.AI_CACHE.put(cacheKey, text, { expirationTtl: CACHE_TTL });

    return c.json({
        text,
        cached: false,
        model,
    });
});

/**
 * Elaborate text - commonly used, heavily cached
 */
aiRoutes.post('/elaborate', async (c) => {
    const { text, style = 'detailed' } = await c.req.json();

    const prompts: Record<string, string> = {
        detailed: `Elaborate on the following text with more details and examples:\n\n${text}`,
        simple: `Explain the following text in simpler terms:\n\n${text}`,
        academic: `Rewrite the following in academic style with proper terminology:\n\n${text}`,
    };

    const prompt = prompts[style] || prompts.detailed;
    const cacheKey = await hashPrompt(prompt, 'elaborate');

    // Check cache
    const cached = await c.env.AI_CACHE.get(cacheKey);
    if (cached) {
        return c.json({ text: cached, cached: true });
    }

    // Generate
    const response = await callGemini(c.env.GEMINI_API_KEY, prompt, 'gemini-1.5-flash');
    if (!response.ok) {
        return c.json({ error: 'Elaboration failed' }, 500);
    }

    const data = await response.json();
    const result = extractText(data, 'gemini');

    await c.env.AI_CACHE.put(cacheKey, result, { expirationTtl: CACHE_TTL });

    return c.json({ text: result, cached: false });
});

/**
 * Generate quiz from content
 */
aiRoutes.post('/quiz', async (c) => {
    const { content, count = 5 } = await c.req.json();

    const prompt = `Generate ${count} multiple-choice questions based on the following content. 
Format as JSON array with: question, options (array of 4), correctIndex (0-3), explanation.

Content:
${content}

Respond with ONLY valid JSON, no markdown.`;

    const response = await callGemini(c.env.GEMINI_API_KEY, prompt, 'gemini-1.5-flash');
    if (!response.ok) {
        return c.json({ error: 'Quiz generation failed' }, 500);
    }

    const data = await response.json();
    const text = extractText(data, 'gemini');

    try {
        const quiz = JSON.parse(text);
        return c.json({ quiz });
    } catch {
        return c.json({ error: 'Failed to parse quiz', raw: text }, 500);
    }
});

/**
 * Socratic mode - guides without giving answers
 */
aiRoutes.post('/socratic', async (c) => {
    const { question, context, history = [] } = await c.req.json();

    const systemPrompt = `You are a Socratic tutor. Your rules:
1. NEVER give direct answers
2. Ask ONE guiding question at a time
3. Use the student's current understanding to guide them
4. Celebrate when they discover the answer
5. If they're stuck, give a hint as a question

Context about what they're studying:
${context}`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: question },
    ];

    const response = await callGemini(
        c.env.GEMINI_API_KEY,
        messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        'gemini-1.5-flash'
    );

    if (!response.ok) {
        return c.json({ error: 'Socratic response failed' }, 500);
    }

    const data = await response.json();
    return c.json({
        response: extractText(data, 'gemini'),
        mode: 'socratic'
    });
});

// Helper functions
async function hashPrompt(prompt: string, model: string): Promise<string> {
    const data = new TextEncoder().encode(prompt + model);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function callGemini(apiKey: string, prompt: string, model: string): Promise<Response> {
    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
            }),
        }
    );
}

async function callGroq(apiKey: string, prompt: string): Promise<Response> {
    return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });
}

function extractText(data: any, model: string): string {
    if (model.includes('gemini')) {
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    // Groq/OpenAI format
    return data.choices?.[0]?.message?.content || '';
}
