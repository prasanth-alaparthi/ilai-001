// src/components/editor/WritingAssistant.jsx
// AI-powered writing assistant with grammar, spelling, and style suggestions
import React, { useState, useEffect, useCallback } from 'react';
import { notesService } from '../../services/notesService';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck, FiX, FiAlertCircle, FiEdit3, FiRefreshCw,
    FiZap, FiBookOpen, FiTarget, FiTrendingUp
} from 'react-icons/fi';

const WritingAssistant = ({ text, onApplySuggestion, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('score');
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(null);
    const [grammarIssues, setGrammarIssues] = useState([]);
    const [spellingErrors, setSpellingErrors] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [improvedText, setImprovedText] = useState('');

    // Debounced analysis
    const analyzeText = useCallback(async () => {
        if (!text || text.length < 20) return;

        setLoading(true);
        try {
            // Get writing score (always available)
            const scoreResult = await notesService.getWritingScore(text);
            setScore(scoreResult.metrics);
        } catch (error) {
            console.error('Error analyzing text:', error);
        } finally {
            setLoading(false);
        }
    }, [text]);

    useEffect(() => {
        if (isOpen && text) {
            const timer = setTimeout(analyzeText, 1000);
            return () => clearTimeout(timer);
        }
    }, [text, isOpen, analyzeText]);

    const handleGrammarCheck = async () => {
        setLoading(true);
        try {
            const result = await notesService.grammarCheck(text);
            setGrammarIssues(result.issues || []);
            setActiveTab('grammar');
        } catch (error) {
            console.error('Grammar check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSpellCheck = async () => {
        setLoading(true);
        try {
            const result = await notesService.spellCheck(text);
            setSpellingErrors(result.errors || []);
            setActiveTab('spelling');
        } catch (error) {
            console.error('Spell check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGetSuggestions = async () => {
        setLoading(true);
        try {
            const result = await notesService.getWritingSuggestions(text);
            setSuggestions(result.suggestions || []);
            setActiveTab('suggestions');
        } catch (error) {
            console.error('Failed to get suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImprove = async (style = 'academic') => {
        setLoading(true);
        try {
            const result = await notesService.improveSentence(text, style);
            setImprovedText(result.improved || '');
            setActiveTab('improve');
        } catch (error) {
            console.error('Failed to improve text:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getScoreColor = (score) => {
        if (score >= 70) return 'text-emerald-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreBg = (score) => {
        if (score >= 70) return 'bg-emerald-500/10 border-emerald-500/30';
        if (score >= 50) return 'bg-amber-500/10 border-amber-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-80 h-full flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <FiEdit3 className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                        Writing Assistant
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <FiX className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            {/* Score Card */}
            {score && (
                <div className={`mx-4 mt-4 p-4 rounded-xl border ${getScoreBg(score.readabilityScore)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                Writing Score
                            </div>
                            <div className={`text-3xl font-bold ${getScoreColor(score.readabilityScore)}`}>
                                {score.readabilityScore}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{score.readabilityLevel}</div>
                        </div>
                        <div className="text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
                            <div>{score.wordCount} words</div>
                            <div>{score.sentenceCount} sentences</div>
                            <div>{score.avgWordsPerSentence} words/sentence</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
                <button
                    onClick={handleGrammarCheck}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                    <FiAlertCircle className="w-3.5 h-3.5" />
                    Grammar
                </button>
                <button
                    onClick={handleSpellCheck}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                    <FiBookOpen className="w-3.5 h-3.5" />
                    Spelling
                </button>
                <button
                    onClick={handleGetSuggestions}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                    <FiZap className="w-3.5 h-3.5" />
                    Suggestions
                </button>
                <button
                    onClick={() => handleImprove('academic')}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50"
                >
                    <FiTrendingUp className="w-3.5 h-3.5" />
                    Improve
                </button>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <FiRefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="ml-2 text-sm text-slate-500">Analyzing...</span>
                    </div>
                )}

                {/* Grammar Issues */}
                {activeTab === 'grammar' && !loading && (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500 mb-2">
                            Grammar Issues ({grammarIssues.length})
                        </div>
                        {grammarIssues.length === 0 ? (
                            <div className="text-center py-4 text-sm text-emerald-600 dark:text-emerald-400">
                                <FiCheck className="w-6 h-6 mx-auto mb-2" />
                                No grammar issues found!
                            </div>
                        ) : (
                            grammarIssues.map((issue, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50">
                                    <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                        "{issue.text}"
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                        {issue.message}
                                    </div>
                                    {issue.suggestions && issue.suggestions.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {issue.suggestions.map((sug, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => onApplySuggestion?.(issue.text, sug)}
                                                    className="px-2 py-1 rounded text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                                                >
                                                    {sug}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Spelling Errors */}
                {activeTab === 'spelling' && !loading && (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500 mb-2">
                            Spelling Errors ({spellingErrors.length})
                        </div>
                        {spellingErrors.length === 0 ? (
                            <div className="text-center py-4 text-sm text-emerald-600 dark:text-emerald-400">
                                <FiCheck className="w-6 h-6 mx-auto mb-2" />
                                No spelling errors found!
                            </div>
                        ) : (
                            spellingErrors.map((error, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
                                    <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                                        "{error.word}"
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {error.suggestions?.map((sug, i) => (
                                            <button
                                                key={i}
                                                onClick={() => onApplySuggestion?.(error.word, sug)}
                                                className="px-2 py-1 rounded text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                                            >
                                                {sug}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Writing Suggestions */}
                {activeTab === 'suggestions' && !loading && (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500 mb-2">
                            Writing Suggestions ({suggestions.length})
                        </div>
                        {suggestions.length === 0 ? (
                            <div className="text-center py-4 text-sm text-slate-500">
                                No additional suggestions.
                            </div>
                        ) : (
                            suggestions.map((sug, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${sug.importance === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                sug.importance === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                            {sug.type}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-700 dark:text-slate-300">
                                        {sug.suggestion}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Improved Text */}
                {activeTab === 'improve' && !loading && improvedText && (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500 mb-2">
                            Improved Version
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {improvedText}
                            </div>
                            <button
                                onClick={() => onApplySuggestion?.(text, improvedText)}
                                className="mt-3 w-full px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                            >
                                Apply Improved Version
                            </button>
                        </div>
                    </div>
                )}

                {/* Tips */}
                {score?.tips && score.tips.length > 0 && !loading && activeTab === 'score' && (
                    <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-500 mb-2">Tips</div>
                        {score.tips.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-2 mb-2">
                                <FiTarget className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-slate-600 dark:text-slate-400">{tip}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default WritingAssistant;
