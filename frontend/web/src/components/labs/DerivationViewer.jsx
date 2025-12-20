import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, Database, FlaskConical, Loader2 } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

/**
 * DerivationViewer Component
 * Displays PhD-level derivation artifacts with LaTeX rendering.
 * Shows assumptions, step-by-step derivation, and evidence.
 */
const DerivationViewer = ({
    latex,
    assumptions = [],
    evidence = '',
    subject = '',
    isLoading = false,
    error = null
}) => {
    const [expanded, setExpanded] = useState(false);

    if (isLoading) {
        return (
            <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
                <div className="flex items-center justify-center gap-4 text-secondary">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-lg font-medium">Computing derivation...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
                <div className="flex items-center gap-3 text-red-400">
                    <FlaskConical className="w-5 h-5" />
                    <span className="font-medium">Computation Error: {error}</span>
                </div>
            </div>
        );
    }

    if (!latex) return null;

    return (
        <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-primary">Show Derivation</span>
                    {subject && (
                        <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                            {subject}
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-secondary" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-secondary" />
                )}
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 border-t border-border/30 space-y-6">
                            {/* LaTeX Derivation */}
                            <div className="bg-black/40 rounded-xl p-6 overflow-x-auto">
                                <div className="text-center text-lg">
                                    <BlockMath math={latex} />
                                </div>
                            </div>

                            {/* Assumptions */}
                            {assumptions.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
                                        <Database className="w-4 h-4" />
                                        Constants & Assumptions
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {assumptions.map((a, i) => (
                                            <div
                                                key={i}
                                                className="bg-white/5 rounded-lg p-3 border border-white/10"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-primary font-mono font-semibold">
                                                        {a.name}
                                                    </span>
                                                    {a.unit && (
                                                        <span className="text-xs text-secondary">{a.unit}</span>
                                                    )}
                                                </div>
                                                <div className="text-lg font-bold mt-1">{a.value}</div>
                                                {a.description && (
                                                    <div className="text-xs text-secondary mt-1">
                                                        {a.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Evidence */}
                            {evidence && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="text-green-400 font-medium text-sm">{evidence}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DerivationViewer;
