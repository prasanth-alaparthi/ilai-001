/**
 * Research Panel Component
 * Displays agentic research results with "Send to Lab" functionality
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ExternalLink, ArrowRight, Beaker,
    Plus, Check, Loader2, ChevronDown, ChevronUp,
    BookOpen, Lightbulb, Variable
} from 'lucide-react';
import { useVariableSync } from '../../hooks/useVariableSync';
import { useUser } from '../../state/UserContext';

/**
 * Parse research text to find injectable values
 * Looks for patterns like: "G = 6.674e-11 m³/(kg·s²)"
 */
const parseInjectableValues = (text) => {
    const values = [];

    // Pattern: symbol = value unit (e.g., "c = 299792458 m/s")
    const patterns = [
        // Scientific notation with units
        /([a-zA-Z_][a-zA-Z_0-9]*)\s*[=:≈]\s*([+-]?\d+\.?\d*(?:e[+-]?\d+)?)\s*([a-zA-Z/·⁻¹²³⁴⁵⁶⁷⁸⁹⁰\(\)]+)?/gi,
        // Named constants
        /(?:speed of light|planck.?s? constant|gravitational constant|avogadro.?s? number|boltzmann constant)\s*[=:≈]?\s*([+-]?\d+\.?\d*(?:e[+-]?\d+)?)/gi,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            if (match[1] && match[2]) {
                values.push({
                    symbol: match[1],
                    value: match[2],
                    unit: match[3] || null,
                    raw: match[0]
                });
            }
        }
    }

    // Also look for pre-parsed injectable_variables
    return values;
};

/**
 * Send to Lab Button - Injects value into Variable Registry
 */
const SendToLabButton = ({ variable, onInject }) => {
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success'

    const handleClick = async () => {
        setStatus('loading');
        try {
            await onInject(variable);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            setStatus('idle');
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={status !== 'idle'}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all ${status === 'success'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                }`}
            title={`Inject ${variable.symbol} = ${variable.value} into Lab`}
        >
            {status === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'success' && <Check className="w-3 h-3" />}
            {status === 'idle' && <Beaker className="w-3 h-3" />}
            <span>Send to Lab</span>
        </button>
    );
};

/**
 * Research Result Card
 */
const ResearchResultCard = ({ result, onInjectVariable }) => {
    const [expanded, setExpanded] = useState(false);

    // Parse for injectable values
    const injectableValues = parseInjectableValues(result.content || result.snippet || '');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden"
        >
            {/* Header */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-200 line-clamp-2">
                        {result.title}
                    </h4>
                    {result.url && (
                        <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                    )}
                </div>

                {/* Snippet */}
                <p className={`text-xs text-gray-400 mt-1 ${expanded ? '' : 'line-clamp-3'}`}>
                    {result.content || result.snippet}
                </p>

                {/* Expand toggle */}
                {(result.content?.length > 200 || result.snippet?.length > 200) && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-purple-400 hover:text-purple-300 mt-1 flex items-center gap-1"
                    >
                        {expanded ? (
                            <>Less <ChevronUp className="w-3 h-3" /></>
                        ) : (
                            <>More <ChevronDown className="w-3 h-3" /></>
                        )}
                    </button>
                )}
            </div>

            {/* Injectable Values */}
            {injectableValues.length > 0 && (
                <div className="px-3 pb-3">
                    <div className="flex flex-wrap gap-2">
                        {injectableValues.slice(0, 5).map((val, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-900/50 rounded-lg px-2 py-1">
                                <span className="text-xs font-mono text-gray-300">
                                    {val.symbol} = {val.value}
                                    {val.unit && <span className="text-gray-500 ml-1">{val.unit}</span>}
                                </span>
                                <SendToLabButton
                                    variable={val}
                                    onInject={onInjectVariable}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Source badge */}
            <div className="px-3 py-2 bg-gray-900/30 border-t border-gray-700/30 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                    {result.source || new URL(result.url || 'https://unknown').hostname}
                </span>
                {result.score && (
                    <span className="text-xs text-gray-600">
                        Score: {(result.score * 100).toFixed(0)}%
                    </span>
                )}
            </div>
        </motion.div>
    );
};

/**
 * Main Research Panel Component
 */
const ResearchPanel = ({
    results = [],
    thinkingLog = [],
    isSearching = false,
    onInjectVariable,
    className = ''
}) => {
    const { user } = useUser() || {};
    const { upsertVariable, isConnected } = useVariableSync(user?.id);

    // Handle variable injection
    const handleInject = useCallback(async (variable) => {
        if (!upsertVariable) {
            console.error('Variable sync not available');
            return;
        }

        await upsertVariable({
            symbol: variable.symbol,
            value: variable.value,
            unit: variable.unit || null,
            subject: 'physics',
            source: 'research'
        });

        // Also call external handler if provided
        if (onInjectVariable) {
            onInjectVariable(variable);
        }
    }, [upsertVariable, onInjectVariable]);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <h3 className="font-medium text-white">Research Results</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Lab Connected
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                            Offline
                        </span>
                    )}
                </div>
            </div>

            {/* Thinking Log */}
            {thinkingLog.length > 0 && (
                <div className="px-4 py-2 bg-yellow-500/5 border-b border-yellow-500/20">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <div className="text-xs text-yellow-300/80">
                            {thinkingLog.slice(-3).map((log, i) => (
                                <p key={i} className="mb-0.5">{log}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Researching...</span>
                        </div>
                    </div>
                ) : results.length > 0 ? (
                    results.map((result, idx) => (
                        <ResearchResultCard
                            key={idx}
                            result={result}
                            onInjectVariable={handleInject}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Search className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No research results yet</p>
                        <p className="text-xs mt-1">Enter a query in the search bar</p>
                    </div>
                )}
            </div>

            {/* Quick Constants */}
            <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
                <p className="text-xs text-gray-500 mb-2">Quick Constants:</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { symbol: 'c', value: '299792458', unit: 'm/s', description: 'Speed of light' },
                        { symbol: 'G', value: '6.674e-11', unit: 'm³/(kg·s²)', description: 'Gravitational constant' },
                        { symbol: 'h', value: '6.626e-34', unit: 'J·s', description: 'Planck constant' },
                        { symbol: 'N_A', value: '6.022e23', unit: '1/mol', description: 'Avogadro number' },
                    ].map((constant) => (
                        <button
                            key={constant.symbol}
                            onClick={() => handleInject(constant)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                            title={constant.description}
                        >
                            <Variable className="w-3 h-3 text-purple-400" />
                            <span className="text-gray-300">{constant.symbol}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResearchPanel;
