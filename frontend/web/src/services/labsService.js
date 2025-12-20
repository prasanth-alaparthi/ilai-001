import axios from 'axios';

// In production, use relative URLs that go through Nginx proxy
// In development, VITE_COMPUTE_ENGINE_URL can be set to http://localhost:8000
const COMPUTE_ENGINE_URL = import.meta.env.VITE_COMPUTE_ENGINE_URL || '';

// Create axios instance - uses relative URLs in production (proxied by Nginx)
const computeClient = axios.create({
    baseURL: COMPUTE_ENGINE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Labs Compute Service
 * Provides API calls to the muse-compute-engine Python backend
 */
const labsService = {
    // ==================== PHYSICS ====================

    /**
     * Solve physics/math equation using SymPy
     * @param {string} equation - The equation to solve (e.g., "x**2 - 4")
     * @param {string} equationType - 'algebraic' or 'ode'
     * @param {string} variable - Variable to solve for (default: 'x')
     */
    async solvePhysics(equation, equationType = 'algebraic', variable = 'x') {
        const response = await computeClient.post('/api/physics/solve', {
            equation,
            equation_type: equationType,
            variable
        });
        return response.data;
    },

    // ==================== CHEMISTRY ====================

    /**
     * Analyze molecule from SMILES string using RDKit
     * @param {string} smiles - SMILES string (e.g., "CCO" for ethanol)
     */
    async analyzeChemistry(smiles) {
        const response = await computeClient.post('/api/chemistry/analyze', { smiles });
        return response.data;
    },

    // ==================== BIOLOGY ====================

    /**
     * Transcribe DNA to mRNA and protein using BioPython
     * @param {string} dnaSequence - DNA sequence (e.g., "ATGCGATCG")
     */
    async transcribeBiology(dnaSequence) {
        const response = await computeClient.post('/api/biology/transcribe', {
            dna_sequence: dnaSequence
        });
        return response.data;
    },

    // ==================== ECONOMICS ====================

    /**
     * Calculate market equilibrium using SciPy
     * @param {object} params - Supply/demand parameters
     */
    async calculateEquilibrium(params) {
        const response = await computeClient.post('/api/economics/equilibrium', {
            supply_intercept: params.supplyIntercept,
            supply_slope: params.supplySlope,
            demand_intercept: params.demandIntercept,
            demand_slope: params.demandSlope
        });
        return response.data;
    },

    // ==================== LITERATURE ====================

    /**
     * Analyze poetry scansion and meter using NLTK
     * @param {string} text - Poetry text to analyze
     */
    async analyzeScansion(text) {
        const response = await computeClient.post('/api/literature/scansion', { text });
        return response.data;
    },

    // ==================== LANGUAGES ====================

    /**
     * Parse sentence for dependency/POS using SpaCy
     * @param {string} sentence - Sentence to parse
     */
    async parseLanguage(sentence) {
        const response = await computeClient.post('/api/language/parse', { sentence });
        return response.data;
    },

    // ==================== FASHION ====================

    /**
     * Draft pattern from body measurements using Gilewska method
     * @param {object} measurements - {bust, waist, hips} in cm
     */
    async draftPattern(measurements) {
        const response = await computeClient.post('/api/fashion/draft', {
            bust: measurements.bust,
            waist: measurements.waist,
            hips: measurements.hips
        });
        return response.data;
    },

    // ==================== NETWORK/CULTURE ====================

    /**
     * Analyze social network using NetworkX
     * @param {Array} edges - Array of [node1, node2] pairs
     */
    async analyzeNetwork(edges) {
        const response = await computeClient.post('/api/culture/network', { edges });
        return response.data;
    },

    // ==================== CODE EXECUTION ====================

    /**
     * Execute code (Python only locally)
     * @param {string} language - Programming language
     * @param {string} code - Source code to execute
     */
    async executeCode(language, code) {
        const response = await computeClient.post('/api/code/execute', { language, code });
        return response.data;
    }
};

export default labsService;
