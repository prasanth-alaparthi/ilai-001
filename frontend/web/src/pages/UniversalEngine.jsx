import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu,
    Binary,
    Atom,
    Dna,
    FlaskConical,
    Database,
    Globe,
    TrendingUp,
    Gavel,
    Scissors,
    BookOpen,
    Users,
    Search,
    CheckCircle2,
    Info,
    ChevronRight,
    Loader2,
    Code
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import apiClient from '../services/apiClient';

const UniversalEngine = () => {
    const [problem, setProblem] = useState('');
    const [isSolving, setIsSolving] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const clusters = [
        { id: 'STEM', name: 'STEM Logic Cluster', icon: Atom, color: 'text-blue-400' },
        { id: 'EARTH', name: 'Earth & Society Cluster', icon: Globe, color: 'text-green-400' },
        { id: 'ARTS', name: 'Arts & Humanities Cluster', icon: Scissors, color: 'text-purple-400' }
    ];

    const handleSolve = async () => {
        if (!problem.trim()) return;

        setIsSolving(true);
        setError(null);
        setResult(null);

        try {
            // Calling our new SubjectRouter microservice
            const response = await apiClient.post('/api/engine/solve', problem);
            setResult(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'The computational logic was interrupted. Please check the derivation path.');
        } finally {
            setIsSolving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-8 font-sans selection:bg-blue-500/30">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                            <Cpu className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                                ilai Universal Master Engine
                            </h1>
                            <p className="text-gray-500 font-medium">Multi-Agent Computational Framework • v1.0 (PhD Logic)</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {clusters.map(c => (
                            <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
                                {c.id}
                            </div>
                        ))}
                    </div>
                </header>

                {/* Search Input Section */}
                <div className="relative mb-8 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-[#12121e] rounded-3xl border border-white/10 p-2 shadow-2xl flex items-center gap-4">
                        <div className="pl-6">
                            <Search className="w-6 h-6 text-gray-500" />
                        </div>
                        <textarea
                            value={problem}
                            onChange={(e) => setProblem(e.target.value)}
                            placeholder="Input PhD-level problem (e.g., 'Draft a 2D sewing pattern for a 3D tailored jacket' or 'Derive the wave equation')..."
                            className="flex-1 bg-transparent border-none text-xl focus:ring-0 placeholder:text-gray-600 py-6 min-h-[140px] resize-none"
                        />
                        <button
                            onClick={handleSolve}
                            disabled={isSolving || !problem.trim()}
                            className={`mr-4 px-10 py-5 rounded-2xl font-bold flex items-center gap-3 transition-all ${isSolving
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isSolving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    ROUTING...
                                </>
                            ) : (
                                <>
                                    SOLVE
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 flex items-center gap-4"
                        >
                            <Info className="w-6 h-6" />
                            <p className="font-medium">{error}</p>
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            {/* Left Column: Derivation & Artifact */}
                            <div className="lg:col-span-2 space-y-8">
                                <section className="bg-[#12121e] rounded-3xl border border-white/10 p-10 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-500/50" />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-500 mb-8 flex items-center gap-2">
                                        <Binary className="w-4 h-4" />
                                        Formal Derivation Artifact
                                    </h2>

                                    <div className="prose prose-invert max-w-none">
                                        <div className="p-8 bg-black/40 rounded-2xl border border-white/5 font-serif text-2xl leading-relaxed text-center italic">
                                            {result.derivationLatex && <BlockMath math={result.derivationLatex} />}
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-white/5">
                                        <h3 className="text-gray-500 font-bold mb-4 uppercase text-xs tracking-widest">Evidence Verification</h3>
                                        <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Code className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-mono text-gray-400 uppercase tracking-tighter">System Output</p>
                                                <p className="font-semibold text-blue-300">{result.evidence?.content || 'Verified by ' + result.cluster + ' Logic Cluster'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Metadata & Assumptions */}
                            <div className="space-y-6">
                                <section className="bg-[#12121e] rounded-3xl border border-white/10 p-8">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                        <Database className="w-4 h-4" />
                                        Constants & Assumptions
                                    </h3>
                                    <div className="space-y-4">
                                        {result.assumptions?.length > 0 ? result.assumptions.map((a, i) => (
                                            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-blue-400 font-bold font-mono">{a.name}</span>
                                                    <span className="text-xs text-gray-600 font-bold uppercase">{a.unit || 'unitless'}</span>
                                                </div>
                                                <div className="text-lg font-bold">{a.value}</div>
                                                <div className="text-xs text-gray-500 mt-2">{a.description}</div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-8 text-gray-600 italic">No static constants for this derivation</div>
                                        )}
                                    </div>
                                </section>

                                <section className="p-1 px-1 bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded-3xl overflow-hidden">
                                    <div className="bg-[#12121e] p-8 rounded-[22px]">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Subject Routing</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                <Atom className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold">{result.subject}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{result.cluster}</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    )}

                    {isSolving && !result && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8 opacity-40 grayscale"
                        >
                            {/* Skeleton UI for Loading State */}
                            <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-3xl border border-white/10 animate-pulse"></div>
                            <div className="space-y-6">
                                <div className="h-64 bg-white/5 rounded-3xl border border-white/10 animate-pulse"></div>
                                <div className="h-32 bg-white/5 rounded-3xl border border-white/10 animate-pulse"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default UniversalEngine;
