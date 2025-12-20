/**
 * ILAI Agentic RAG Lab
 * Global Research Agent with real-time streaming visualization
 * 
 * Features:
 * - Multi-hop retrieval with "AI Thinking" visualization
 * - Real-time SSE streaming of search progress
 * - Cross-encoder reranking display
 * - Vision analysis for STEM diagrams
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Brain, Globe, FileText, Sparkles, Eye,
    ChevronDown, ChevronRight, ExternalLink, Loader2,
    CheckCircle2, AlertCircle, Zap, RefreshCw, BookOpen
} from 'lucide-react';

const COMPUTE_URL = import.meta.env.VITE_COMPUTE_ENGINE_URL || '';

// Status colors
const STATUS_COLORS = {
    thinking: '#8B5CF6',
    searching: '#3B82F6',
    reranking: '#F59E0B',
    refining: '#EC4899',
    vision: '#10B981',
    result: '#22C55E',
    error: '#EF4444'
};

/**
 * Streaming step component - shows individual agent actions
 */
const StreamStep = ({ step, isLatest }) => {
    const getIcon = () => {
        switch (step.type) {
            case 'thinking': return <Brain size={16} className="text-purple-400" />;
            case 'searching': return <Search size={16} className="text-blue-400" />;
            case 'reranking': return <Zap size={16} className="text-amber-400" />;
            case 'refining': return <RefreshCw size={16} className="text-pink-400" />;
            case 'vision': return <Eye size={16} className="text-emerald-400" />;
            case 'result': return <CheckCircle2 size={16} className="text-green-400" />;
            case 'error': return <AlertCircle size={16} className="text-red-400" />;
            default: return <Sparkles size={16} className="text-gray-400" />;
        }
    };

    const getSourceIcon = () => {
        if (step.source === 'tavily') return <Globe size={12} />;
        if (step.source === 'notes') return <FileText size={12} />;
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-3 py-2 px-3 rounded-lg ${isLatest ? 'bg-gray-800/50' : ''
                }`}
        >
            <div className="flex-shrink-0 mt-0.5">
                {isLatest && step.type !== 'result' ? (
                    <Loader2 size={16} className="animate-spin text-blue-400" />
                ) : (
                    getIcon()
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-200">
                        {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                    </span>
                    {step.iteration && (
                        <span className="text-xs text-gray-500">
                            (Hop {step.iteration})
                        </span>
                    )}
                    {step.source && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            {getSourceIcon()}
                            {step.source}
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-400 truncate">
                    {step.message || step.query || ''}
                </p>

                {step.count !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                        Found {step.count} results
                    </p>
                )}
            </div>
        </motion.div>
    );
};

/**
 * Source card component
 */
const SourceCard = ({ source, index }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-3 flex items-start gap-3 text-left hover:bg-gray-800/70 transition-colors"
            >
                <span className="text-xs text-gray-500 font-mono mt-0.5">
                    [{index + 1}]
                </span>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-200 truncate">
                        {source.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        {source.source === 'tavily' && (
                            <Globe size={12} className="text-blue-400" />
                        )}
                        {source.source === 'notes' && (
                            <FileText size={12} className="text-purple-400" />
                        )}
                        <span className="text-xs text-gray-500 truncate">
                            {source.url}
                        </span>
                    </div>
                </div>
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 pt-0 border-t border-gray-700">
                            <p className="text-sm text-gray-400">
                                {source.content?.slice(0, 300)}
                                {source.content?.length > 300 && '...'}
                            </p>
                            {source.url && (
                                <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:underline"
                                >
                                    Open source <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/**
 * Main Agentic RAG Lab component
 */
const AgenticRAGLab = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [steps, setSteps] = useState([]);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const handleSearch = useCallback(async () => {
        if (!query.trim() || isSearching) return;

        setIsSearching(true);
        setSteps([]);
        setResult(null);
        setError(null);

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(`${COMPUTE_URL}/api/rag/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query.trim(),
                    include_private_notes: true,
                    max_hops: 3,
                    include_vision: true
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            // Read SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'result') {
                                setResult(data);
                            } else if (data.type === 'error') {
                                setError(data.message);
                            } else if (data.type !== 'done') {
                                setSteps(prev => [...prev, data]);
                            }
                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }

        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setIsSearching(false);
        }
    }, [query, isSearching]);

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsSearching(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                        <Brain size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Agentic RAG Research
                        </h1>
                        <p className="text-sm text-gray-500">
                            Multi-hop retrieval • Cross-encoder reranking • Vision analysis
                        </p>
                    </div>
                </div>

                {/* Search Input */}
                <div className="mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ask anything... (e.g., 'Explain quantum entanglement')"
                            className="w-full px-5 py-4 pr-32 bg-gray-900 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                            disabled={isSearching}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                            {isSearching ? (
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            ) : (
                                <button
                                    onClick={handleSearch}
                                    disabled={!query.trim()}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <Search size={16} />
                                    Research
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Agent Activity Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-4">
                                <Sparkles size={14} className="text-purple-400" />
                                Agent Activity
                            </h3>

                            {steps.length === 0 && !isSearching && (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    Start a search to see the agent think...
                                </p>
                            )}

                            <div className="space-y-1 max-h-96 overflow-y-auto">
                                {steps.map((step, i) => (
                                    <StreamStep
                                        key={i}
                                        step={step}
                                        isLatest={i === steps.length - 1 && isSearching}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-2">
                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-900/30 border border-red-800 rounded-xl">
                                <div className="flex items-center gap-2 text-red-400">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Answer */}
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle2 size={16} className="text-green-400" />
                                        <span className="text-sm text-gray-400">
                                            Answer ({result.iterations} hop{result.iterations > 1 ? 's' : ''})
                                        </span>
                                    </div>

                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-gray-200 whitespace-pre-wrap">
                                            {result.answer}
                                        </p>
                                    </div>

                                    {/* Lab Data */}
                                    {result.lab_data && Object.keys(result.lab_data).length > 0 && (
                                        <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-800/50">
                                            <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
                                                <Zap size={14} />
                                                Lab Data Extracted
                                            </div>
                                            <pre className="text-xs text-gray-400 overflow-x-auto">
                                                {JSON.stringify(result.lab_data, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Sources */}
                        {result?.sources && result.sources.length > 0 && (
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
                                    <BookOpen size={14} />
                                    Sources ({result.sources.length})
                                </h3>
                                <div className="space-y-2">
                                    {result.sources.map((source, i) => (
                                        <SourceCard key={i} source={source} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {!result && !error && !isSearching && (
                            <div className="text-center py-16">
                                <Brain size={48} className="mx-auto text-gray-700 mb-4" />
                                <h3 className="text-lg font-medium text-gray-400 mb-2">
                                    Ready to Research
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md mx-auto">
                                    Enter a question and the agent will search the web,
                                    analyze your notes, and synthesize a comprehensive answer.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgenticRAGLab;
