import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Calculator, Sparkles, ArrowRight } from 'lucide-react';

/**
 * Labs Dashboard - Muse Autonomous Research Pipeline
 * Unified entry point for the Research Lab
 */
const LabsDashboard = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <header className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-3 text-purple-500 mb-4"
                    >
                        <Sparkles size={20} className="animate-pulse" />
                        <span className="text-sm tracking-widest font-mono">MUSE RESEARCH PIPELINE</span>
                        <Sparkles size={20} className="animate-pulse" />
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 mb-6">
                        Autonomous Research Lab
                    </h1>

                    <p className="text-gray-400 text-lg max-w-xl mx-auto">
                        Unified workspace combining symbolic computation, agentic search, and intelligent note-taking.
                    </p>
                </header>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Link
                        to="/labs/research"
                        className="block group"
                    >
                        <div className="relative bg-gradient-to-br from-[#111] to-[#0d0d0d] border border-gray-800 hover:border-purple-500/50 rounded-2xl p-8 md:p-12 transition-all duration-500 overflow-hidden">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                                            <Brain size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">Research Lab</h2>
                                            <p className="text-sm text-gray-500 font-mono">Core Solver + Neuro-Search</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-sm">Enter</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                                        <Calculator size={20} className="text-amber-400 mb-2" />
                                        <h3 className="text-sm font-medium text-white mb-1">Core Solver</h3>
                                        <p className="text-xs text-gray-500">SymPy-powered symbolic math with step-by-step derivations</p>
                                    </div>

                                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                                        <Brain size={20} className="text-purple-400 mb-2" />
                                        <h3 className="text-sm font-medium text-white mb-1">Neuro-Search</h3>
                                        <p className="text-xs text-gray-500">Agentic RAG with Tavily + Groq for deep research</p>
                                    </div>

                                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                                        <Sparkles size={20} className="text-blue-400 mb-2" />
                                        <h3 className="text-sm font-medium text-white mb-1">Variable Registry</h3>
                                        <p className="text-xs text-gray-500">Cross-lab persistent variables with auto-injection</p>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative */}
                            <div className="absolute right-0 bottom-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Brain size={200} />
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Coming Soon */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <p className="text-gray-600 text-sm">
                        More labs coming soon: Physics • Chemistry • Biology • Code Editor
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default LabsDashboard;
