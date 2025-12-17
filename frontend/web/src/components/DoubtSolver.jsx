import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle, Send, BookOpen, Lightbulb, Quote, ChevronDown,
    ChevronUp, Sparkles, Calculator, Atom, FlaskConical, Dna, History
} from 'lucide-react';
import { useDoubtSolver } from '../hooks/useAIEnhancements';
import ReactMarkdown from 'react-markdown';

const SUBJECTS = [
    { id: 'auto', label: 'Auto-detect', icon: Sparkles },
    { id: 'mathematics', label: 'Mathematics', icon: Calculator },
    { id: 'physics', label: 'Physics', icon: Atom },
    { id: 'chemistry', label: 'Chemistry', icon: FlaskConical },
    { id: 'biology', label: 'Biology', icon: Dna },
    { id: 'history', label: 'History', icon: History },
];

/**
 * Doubt Solver Component - AI Q&A with citations
 */
export function DoubtSolver({ noteContext = null, onClose = null }) {
    const [question, setQuestion] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('auto');
    const [followUps, setFollowUps] = useState([]);
    const [showSections, setShowSections] = useState({});

    const { solveDoubt, getFollowUpQuestions, loading, result, error, history } = useDoubtSolver();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim() || loading) return;

        const subject = selectedSubject === 'auto' ? null : selectedSubject;
        const contexts = noteContext ? [noteContext] : null;

        const response = await solveDoubt(question, subject, contexts);

        if (response?.success) {
            const followUpQuestions = await getFollowUpQuestions(question, response.answer);
            setFollowUps(followUpQuestions);
        }
    };

    const handleFollowUpClick = (followUp) => {
        setQuestion(followUp);
        setFollowUps([]);
    };

    const toggleSection = (section) => {
        setShowSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
            {/* Header */}
            <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-blue-500" />
                        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">
                            Doubt Solver
                        </h2>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                            ×
                        </button>
                    )}
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                    Ask any academic question - get answers with sources
                </p>
            </div>

            {/* Subject Selector */}
            <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-2">
                {SUBJECTS.map(subject => (
                    <button
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${selectedSubject === subject.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                            }`}
                    >
                        <subject.icon className="w-4 h-4" />
                        {subject.label}
                    </button>
                ))}
            </div>

            {/* Result Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-surface-600">Thinking...</span>
                    </div>
                )}

                {result?.success && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Question */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {result.question}
                            </p>
                        </div>

                        {/* Answer */}
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{result.answer}</ReactMarkdown>
                        </div>

                        {/* Citations */}
                        {result.citations?.length > 0 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <div
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => toggleSection('citations')}
                                >
                                    <Quote className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                        Sources ({result.citations.length})
                                    </span>
                                    {showSections.citations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                                <AnimatePresence>
                                    {showSections.citations && (
                                        <motion.ul
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-2 space-y-1 overflow-hidden"
                                        >
                                            {result.citations.map((citation, i) => (
                                                <li key={i} className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                                                    <BookOpen className="w-3 h-3" />
                                                    {citation.source}
                                                </li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Follow-up Questions */}
                        {followUps.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-surface-600 dark:text-surface-400 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4" />
                                    Related questions
                                </p>
                                {followUps.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleFollowUpClick(q)}
                                        className="w-full text-left p-2 text-sm bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* History */}
                {!result && !loading && history.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
                            Recent questions
                        </p>
                        {history.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => setQuestion(item.question)}
                                className="w-full text-left p-3 bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 transition-colors"
                            >
                                <p className="text-sm font-medium truncate">{item.question}</p>
                                <p className="text-xs text-surface-500">{item.subject}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-surface-200 dark:border-surface-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask your doubt..."
                        className="flex-1 px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg border-none focus:ring-2 focus:ring-blue-500 text-surface-900 dark:text-surface-100"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !question.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default DoubtSolver;
