/**
 * ILAI Research Lab - Unified Note-Lab Hybrid
 * 
 * Features:
 * - Core Solver: MathLive + Math.js + SymPy backend
 * - Neuro-Search: Agentic RAG with Tavily + Groq reranking
 * - Variable Registry: Postgres-backed with WebSocket sync
 * - Lab Injection: Auto-inject constants from research
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Calculator, Search, Plus, Trash2, Sparkles,
    ChevronDown, ChevronUp, Zap, Loader2, BookOpen,
    ArrowRight, ExternalLink, Beaker, Atom, Variable,
    CheckCircle2, AlertCircle, Lightbulb, Cpu, Wifi, WifiOff,
    Save, FolderOpen
} from 'lucide-react';
import { create, all } from 'mathjs';
import 'mathlive';
import labsService from '../../services/labsService';
import { notesService } from '../../services/notesService';
import { useVariableSync } from '../../hooks/useVariableSync';
import { useUser } from '../../state/UserContext';
import CoolingOffModal from '../../components/CoolingOffModal';
import Visualizer from '../../components/labs/Visualizer';
import MoleculeViewer from '../../components/labs/MoleculeViewer';

// Math.js configuration
const math = create(all);
math.config({ number: 'BigNumber', precision: 64 });

const RESULT_COLOR = '#007AFF';
const ERROR_COLOR = '#FF3B30';

// API base URL
const AGENTIC_RAG_URL = import.meta.env.VITE_AGENTIC_RAG_URL || '';

/**
 * Format Math.js BigNumber results
 */
const formatResult = (result) => {
    if (result === null || result === undefined) return 'undefined';
    if (typeof result === 'object' && result.mathjs === 'BigNumber') {
        return result.value || String(result);
    }
    try {
        return math.format(result, { precision: 10 });
    } catch {
        return typeof result === 'object' ? JSON.stringify(result) : String(result);
    }
};

/**
 * MathField Component - MathLive wrapper
 */
const MathField = ({ value, onChange, onSubmit, placeholder }) => {
    const mathFieldRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const onSubmitRef = useRef(onSubmit);

    useEffect(() => {
        onChangeRef.current = onChange;
        onSubmitRef.current = onSubmit;
    }, [onChange, onSubmit]);

    useEffect(() => {
        const el = mathFieldRef.current;
        if (!el) return;

        const handleInput = (e) => {
            const latex = e.target.value;
            onChangeRef.current(latex);

            // Auto-solve on trailing =
            if (latex.endsWith('=')) {
                setTimeout(() => onSubmitRef.current?.(latex), 50);
            }
        };

        const handleKeyDown = (e) => {
            // Submit on Enter key
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const latex = e.target.value;
                if (latex.trim()) {
                    onSubmitRef.current?.(latex);
                }
            }
        };

        el.addEventListener('input', handleInput);
        el.addEventListener('keydown', handleKeyDown);
        return () => {
            el.removeEventListener('input', handleInput);
            el.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <math-field
            ref={mathFieldRef}
            class="w-full h-full bg-transparent text-white text-lg outline-none"
            style={{ '--caret-color': RESULT_COLOR }}
            placeholder={placeholder}
        >
            {value}
        </math-field>
    );
};

/**
 * Variable Badge Component
 */
const VariableBadge = ({ name, value, unit, source, onInject }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
            ${source === 'search' ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-gray-800 border border-gray-700'}
        `}
    >
        <Variable size={12} className={source === 'search' ? 'text-purple-400' : 'text-gray-400'} />
        <span className="text-gray-300 font-mono">{name}</span>
        <span className="text-gray-500">=</span>
        <span className="text-white">{value}</span>
        {unit && <span className="text-gray-500">{unit}</span>}
        {source === 'search' && onInject && (
            <button
                onClick={onInject}
                className="ml-1 p-0.5 hover:bg-purple-500/30 rounded transition-colors"
                title="Inject to lab"
            >
                <ArrowRight size={10} className="text-purple-400" />
            </button>
        )}
    </motion.div>
);

/**
 * Stream Step Component - Shows agent thinking
 */
const StreamStep = ({ type, message, isActive }) => {
    const icons = {
        thinking: <Brain className="animate-pulse" size={14} />,
        searching: <Search className="animate-bounce" size={14} />,
        reranking: <Zap size={14} />,
        refining: <Lightbulb size={14} />,
        generating: <Sparkles className="animate-spin" size={14} />,
        complete: <CheckCircle2 size={14} />,
        error: <AlertCircle size={14} />
    };

    const colors = {
        thinking: 'text-purple-400',
        searching: 'text-blue-400',
        reranking: 'text-amber-400',
        refining: 'text-cyan-400',
        generating: 'text-green-400',
        complete: 'text-green-400',
        error: 'text-red-400'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-2 text-xs ${colors[type] || 'text-gray-400'}`}
        >
            {icons[type] || <Cpu size={14} />}
            <span className={isActive ? 'opacity-100' : 'opacity-60'}>{message}</span>
        </motion.div>
    );
};

/**
 * Source Card Component
 */
const SourceCard = ({ title, url, snippet }) => (
    <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="block p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-purple-500/30 transition-colors"
    >
        <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-white line-clamp-1">{title}</h4>
            <ExternalLink size={12} className="text-gray-500 flex-shrink-0" />
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{snippet}</p>
    </motion.a>
);

/**
 * Main Research Lab Component
 */
const ResearchLab = () => {
    // User context for user ID
    const { user } = useUser() || {};
    const userId = user?.id || 'anonymous';

    // WebSocket-synced variable registry (Postgres-backed)
    const {
        variables: wsVariables,
        isConnected,
        upsertVariable,
        deleteVariable,
        getVariablesForCalc
    } = useVariableSync(userId);

    // Core Solver State
    const [expressions, setExpressions] = useState([{ id: 1, input: '', result: null, error: null }]);
    const [isProSolving, setIsProSolving] = useState(false);

    // Neuro-Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchSteps, setSearchSteps] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [sources, setSources] = useState([]);
    const [injectableVars, setInjectableVars] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState('solver'); // 'solver' | 'search'
    const [showVariables, setShowVariables] = useState(true);

    // Save to Workspace State
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeSubject, setActiveSubject] = useState('Maths');

    // Rate Limiting / Jail State
    const [showCoolingModal, setShowCoolingModal] = useState(false);
    const [jailInfo, setJailInfo] = useState(null);
    const [violationInfo, setViolationInfo] = useState(null);

    // Get variables as simple object for calculations
    const variables = getVariablesForCalc();

    // Check if expression needs Pro solver
    const needsProSolver = (expr) => {
        const proPatterns = [
            /diff\(/i, /integrate\(/i, /derivative\(/i, /limit\(/i,
            /\d+\s*(m|cm|mm|km|g|kg|s|N|J|W)\b/i, // Units
            /^[A-Za-z0-9@+\-\[\]\(\)\\/#=%]+$/ // SMILES-like
        ];
        return proPatterns.some(p => p.test(expr));
    };

    // Local solve with Math.js
    const solveLocal = useCallback((expression) => {
        try {
            let cleanExpr = expression
                .replace(/×/g, '*').replace(/÷/g, '/')
                .replace(/²/g, '^2').replace(/³/g, '^3')
                .replace(/√/g, 'sqrt').replace(/π/g, 'pi')
                .replace(/\s*=\s*$/, '').trim();

            // Variable assignment - sync to Postgres via WebSocket
            const assignMatch = cleanExpr.match(/^([a-z_]\w*)\s*=\s*(.+)$/i);
            if (assignMatch) {
                const [, varName, valueExpr] = assignMatch;
                const value = math.evaluate(valueExpr, variables);
                // Persist to Postgres via WebSocket
                upsertVariable(varName, value, { subject: 'math', source: 'user' });
                return { result: value, variable: varName };
            }

            const result = math.evaluate(cleanExpr, variables);
            return { result };
        } catch (err) {
            return { error: err.message };
        }
    }, [variables, upsertVariable]);

    // Pro solve via API (calculus, chemistry)
    const solvePro = async (expression) => {
        setIsProSolving(true);
        try {
            const response = await labsService.post('/solver/solve', {
                expression,
                variables: variables,
                user_id: userId  // Include user_id for variable persistence
            });
            const data = response.data;
            if (data.success) {
                return {
                    result: data.result,
                    steps: data.steps,
                    derivation: data.derivation_latex
                };
            } else {
                return { error: data.error };
            }
        } catch (err) {
            const status = err.response?.status;
            const errorData = err.response?.data;

            // Handle rate limiting (429) or jail (403)
            if (status === 429 || (status === 403 && errorData?.code === 'JAILED')) {
                if (errorData?.jail) {
                    setJailInfo(errorData.jail);
                } else {
                    setViolationInfo({ remaining: 5 });
                }
                setShowCoolingModal(true);
                return { error: 'Rate limit exceeded. Please wait before trying again.' };
            }

            return { error: errorData?.error || err.message };
        } finally {
            setIsProSolving(false);
        }
    };

    // Handle expression solve
    const handleSolve = async (index, input) => {
        if (!input.trim()) return;

        const isPro = needsProSolver(input);
        const solution = isPro ? await solvePro(input) : solveLocal(input);

        setExpressions(prev => prev.map((exp, i) =>
            i === index ? { ...exp, ...solution } : exp
        ));
    };

    // Add new expression
    const addExpression = () => {
        setExpressions(prev => [...prev, { id: Date.now(), input: '', result: null, error: null }]);
    };

    // Auto-path generator for Save to Workspace
    const generateAutoPath = (subject = 'Maths') => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, '-');
        return {
            notebook: `${subject} Lab`,
            section: dateStr,
            title: 'Research Session'
        };
    };

    // Save to Workspace - Persistent Save
    const saveToWorkspace = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const currentExpression = expressions[0]?.input || '';
            const currentResult = expressions[0]?.result != null ? String(expressions[0].result) : '';

            const payload = {
                autoPath: generateAutoPath(activeSubject),
                equation: currentExpression,
                solution: currentResult,
                variables: Object.fromEntries(wsVariables.map(v => [v.symbol, v.value])),
                researchResults: searchResults || '',
                sources: sources.map(s => ({ title: s.title, url: s.url, content: s.content })),
                subject: activeSubject
            };

            const response = await notesService.saveLabResearch(payload);

            if (response?.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Save to workspace failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Neuro-Search with SSE streaming
    const performSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchSteps([]);
        setSearchResults(null);
        setSources([]);
        setInjectableVars([]);

        try {
            const response = await fetch(`${AGENTIC_RAG_URL}/api/rag/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery, max_hops: 3, include_private: true })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Append new data to buffer
                buffer += decoder.decode(value, { stream: true });

                // Process complete lines from buffer
                const lines = buffer.split('\n');
                // Keep incomplete last line in buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;

                    try {
                        const jsonStr = line.slice(6).trim();
                        if (!jsonStr || jsonStr === '[DONE]') continue;

                        const data = JSON.parse(jsonStr);

                        switch (data.type) {
                            case 'thinking':
                            case 'searching':
                            case 'reranking':
                            case 'refining':
                            case 'generating':
                                setSearchSteps(prev => [...prev, { type: data.type, message: data.message }]);
                                break;
                            case 'result':
                                setSearchResults(data.answer);
                                setSources(data.sources || []);
                                if (data.lab_data?.variables) {
                                    setInjectableVars(data.lab_data.variables);
                                }
                                setSearchSteps(prev => [...prev, { type: 'complete', message: 'Research complete' }]);
                                break;
                            case 'error':
                                setSearchSteps(prev => [...prev, { type: 'error', message: data.message }]);
                                break;
                        }
                    } catch (e) {
                        // Only log if it's not an empty line
                        if (line.trim().length > 6) {
                            console.debug('SSE parse skip:', line.slice(0, 50));
                        }
                    }
                }
            }
        } catch (err) {
            setSearchSteps(prev => [...prev, { type: 'error', message: `Search failed: ${err.message}` }]);
        } finally {
            setIsSearching(false);
        }
    };

    // Inject variable from search (persisted to Postgres via WebSocket)
    const injectVariable = (name, value, unit) => {
        upsertVariable(name, value, { unit, subject: 'search', source: 'search' });
        setActiveTab('solver');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                            <Brain size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Research Lab</h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                Core Solver + Neuro-Search
                                {isConnected ? (
                                    <Wifi size={10} className="text-green-400" />
                                ) : (
                                    <WifiOff size={10} className="text-red-400" />
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-gray-900 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('solver')}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${activeTab === 'solver' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Calculator size={16} className="inline mr-2" />
                            Solver
                        </button>
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${activeTab === 'search' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Search size={16} className="inline mr-2" />
                            Research
                        </button>
                    </div>

                    {/* Save to Workspace Button */}
                    <motion.button
                        onClick={saveToWorkspace}
                        disabled={isSaving}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${saveSuccess
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30 hover:border-purple-400/50'}
                            ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : saveSuccess ? (
                            <CheckCircle2 size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {saveSuccess ? 'Saved!' : 'Save to Workspace'}
                    </motion.button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'solver' ? (
                                <motion.div
                                    key="solver"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-4"
                                >
                                    {/* Expression Inputs */}
                                    {expressions.map((exp, index) => (
                                        <div key={exp.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-black/50 rounded-lg px-4 py-3">
                                                    <MathField
                                                        value={exp.input}
                                                        onChange={(val) => setExpressions(prev =>
                                                            prev.map((e, i) => i === index ? { ...e, input: val } : e)
                                                        )}
                                                        onSubmit={(val) => handleSolve(index, val)}
                                                        placeholder="Enter expression..."
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setExpressions(prev => prev.filter((_, i) => i !== index))}
                                                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Result */}
                                            {(exp.result !== null || exp.error) && (
                                                <div className={`mt-3 px-4 py-2 rounded-lg ${exp.error ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10'
                                                    }`}>
                                                    {exp.error ? (
                                                        <span className="text-sm">{exp.error}</span>
                                                    ) : (
                                                        <span className="text-lg font-mono" style={{ color: RESULT_COLOR }}>
                                                            = {formatResult(exp.result)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Visualizer for function plots */}
                                            {exp.result && exp.input && exp.input.includes('x') && (
                                                <Visualizer
                                                    expression={exp.input}
                                                    result={String(exp.result)}
                                                    derivation={exp.derivation}
                                                    className="mt-3"
                                                />
                                            )}

                                            {/* MoleculeViewer for SMILES/Chemistry */}
                                            {exp.result && typeof exp.result === 'object' && exp.result.formula && (
                                                <MoleculeViewer
                                                    smiles={exp.input}
                                                    formula={exp.result.formula}
                                                    molecularWeight={exp.result.molecular_weight}
                                                    className="mt-3"
                                                />
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        onClick={addExpression}
                                        className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add Expression
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Search Input */}
                                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                                                placeholder="What would you like to research?"
                                                className="flex-1 bg-black/50 px-4 py-3 rounded-lg text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-purple-500/50"
                                            />
                                            <button
                                                onClick={performSearch}
                                                disabled={isSearching}
                                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                            >
                                                {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'Research'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Agent Activity */}
                                    {searchSteps.length > 0 && (
                                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                                            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                                <Brain size={14} />
                                                Agent Activity
                                            </h3>
                                            <div className="space-y-2">
                                                {searchSteps.map((step, i) => (
                                                    <StreamStep
                                                        key={i}
                                                        type={step.type}
                                                        message={step.message}
                                                        isActive={i === searchSteps.length - 1}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Search Results */}
                                    {searchResults && (
                                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                                            <h3 className="text-lg font-medium text-white mb-4">Research Summary</h3>
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                <p className="text-gray-300 whitespace-pre-wrap">{searchResults}</p>
                                            </div>

                                            {/* Injectable Variables */}
                                            {injectableVars.length > 0 && (
                                                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                                    <h4 className="text-sm font-medium text-purple-400 mb-2">
                                                        Found Constants - Click to inject
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {injectableVars.map((v, i) => (
                                                            <VariableBadge
                                                                key={i}
                                                                name={v.name}
                                                                value={v.value}
                                                                unit={v.unit}
                                                                source="search"
                                                                onInject={() => injectVariable(v.name, v.value, v.unit)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Sources */}
                                    {sources.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-gray-400">Sources</h3>
                                            <div className="grid gap-2">
                                                {sources.slice(0, 5).map((src, i) => (
                                                    <SourceCard
                                                        key={i}
                                                        title={src.title}
                                                        url={src.url}
                                                        snippet={src.content || src.snippet}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar - Variables */}
                    <div className="space-y-4">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <button
                                onClick={() => setShowVariables(!showVariables)}
                                className="w-full flex items-center justify-between text-sm font-medium text-gray-400"
                            >
                                <span className="flex items-center gap-2">
                                    <Variable size={16} />
                                    Variable Registry
                                </span>
                                {showVariables ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            <AnimatePresence>
                                {showVariables && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 space-y-2"
                                    >
                                        {Object.keys(wsVariables).length === 0 ? (
                                            <p className="text-xs text-gray-600">No variables defined yet</p>
                                        ) : (
                                            Object.entries(wsVariables).map(([key, v]) => (
                                                <VariableBadge
                                                    key={key}
                                                    name={v.symbol}
                                                    value={formatResult(v.numericValue)}
                                                    unit={v.unit}
                                                    source={v.source || 'user'}
                                                />
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Examples</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        setSearchQuery('density of graphene');
                                        setActiveTab('search');
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    🔬 Search: "density of graphene"
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('solver');
                                        setExpressions([{ id: Date.now(), input: 'diff(x^2, x)=', result: null, error: null }]);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    📐 Solve: diff(x², x) =
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('solver');
                                        setExpressions([{ id: Date.now(), input: 'E = m * c^2', result: null, error: null }]);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    ⚡ Define: E = m·c²
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cooling Off Modal */}
            <CoolingOffModal
                isOpen={showCoolingModal}
                onClose={() => {
                    setShowCoolingModal(false);
                    setJailInfo(null);
                    setViolationInfo(null);
                }}
                jailInfo={jailInfo}
                violationInfo={violationInfo}
            />
        </div>
    );
};

export default ResearchLab;
