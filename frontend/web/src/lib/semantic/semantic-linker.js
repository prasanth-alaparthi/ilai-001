/**
 * ILAI Hyper Platform - Semantic Note Linker
 * 
 * Uses Transformers.js to generate embeddings and find semantically
 * related notes - all running locally in the browser!
 * 
 * No API calls, no server costs, works offline.
 */

import { pipeline, env } from '@xenova/transformers';
import { openDB } from 'idb';
import { devLog } from '../../utils/devLog';

// Configure Transformers.js for browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Singleton for the embedding pipeline
let embedder = null;
let isLoading = false;
let loadPromise = null;

// IndexedDB for storing embeddings
const DB_NAME = 'ilai-semantic';
const STORE_NAME = 'embeddings';

/**
 * Initialize the embedding model
 * Uses all-MiniLM-L6-v2 - small, fast, and effective
 */
async function initEmbedder() {
    if (embedder) return embedder;

    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;
    devLog('[Semantic] Loading embedding model...');

    loadPromise = pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
            progress_callback: (progress) => {
                if (progress.status === 'progress') {
                    devLog(`[Semantic] Loading: ${Math.round(progress.progress)}%`);
                }
            }
        }
    ).then((model) => {
        embedder = model;
        isLoading = false;
        devLog('[Semantic] Model loaded successfully');
        return embedder;
    });

    return loadPromise;
}

/**
 * Get or create the IndexedDB database
 */
async function getDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'noteId' });
            }
        },
    });
}

/**
 * Generate embedding for text content
 * @param {string} text - The text to embed
 * @returns {Promise<Float32Array>} The embedding vector
 */
export async function generateEmbedding(text) {
    const model = await initEmbedder();

    // Truncate to ~500 words for performance
    const truncated = text.slice(0, 2000);

    const output = await model(truncated, {
        pooling: 'mean',
        normalize: true
    });

    return output.data;
}

/**
 * Store embedding for a note
 * @param {string} noteId - The note ID
 * @param {string} title - The note title
 * @param {string} content - The note content
 */
export async function storeNoteEmbedding(noteId, title, content) {
    const text = `${title}\n\n${content}`;
    const embedding = await generateEmbedding(text);

    const db = await getDB();
    await db.put(STORE_NAME, {
        noteId,
        title,
        embedding: Array.from(embedding),
        updatedAt: Date.now(),
    });

    devLog(`[Semantic] Stored embedding for note ${noteId}`);
}

/**
 * Find semantically related notes
 * @param {string} noteId - The current note ID (to exclude)
 * @param {string} content - The content to find related notes for
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array<{ noteId: string, title: string, similarity: number }>>}
 */
export async function findRelatedNotes(noteId, content, limit = 5) {
    const queryEmbedding = await generateEmbedding(content);

    const db = await getDB();
    const allNotes = await db.getAll(STORE_NAME);

    // Calculate cosine similarity with all stored notes
    const results = allNotes
        .filter(note => note.noteId !== noteId)
        .map(note => ({
            noteId: note.noteId,
            title: note.title,
            similarity: cosineSimilarity(queryEmbedding, new Float32Array(note.embedding)),
        }))
        .filter(note => note.similarity > 0.5) // Only show relevant matches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    devLog(`[Semantic] Found ${results.length} related notes`);
    return results;
}

/**
 * Delete embedding when note is deleted
 * @param {string} noteId - The note ID
 */
export async function deleteNoteEmbedding(noteId) {
    const db = await getDB();
    await db.delete(STORE_NAME, noteId);
    devLog(`[Semantic] Deleted embedding for note ${noteId}`);
}

/**
 * Get all stored note embeddings (for debugging)
 */
export async function getAllEmbeddings() {
    const db = await getDB();
    return db.getAll(STORE_NAME);
}

/**
 * Check if model is ready
 */
export function isModelReady() {
    return embedder !== null;
}

/**
 * Preload the model (call on app start)
 */
export async function preloadModel() {
    try {
        await initEmbedder();
        return true;
    } catch (error) {
        console.error('[Semantic] Failed to preload model:', error);
        return false;
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default {
    generateEmbedding,
    storeNoteEmbedding,
    findRelatedNotes,
    deleteNoteEmbedding,
    isModelReady,
    preloadModel,
};
