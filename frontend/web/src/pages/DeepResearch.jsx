import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Loader2, BookOpen, FileText, Link2, Clock,
    CheckCircle, ChevronDown, ChevronRight, Download, Copy,
    Sparkles, Globe, BookMarked, AlertCircle
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { agentService } from '../services/agentService';

const DeepResearch = () => {
    // State
    const [topic, setTopic] = useState('');
    const [isResearching, setIsResearching] = useState(false);
    const [research, setResearch] = useState(null);
    const [streamUpdates, setStreamUpdates] = useState([]);
    const [expandedSections, setExpandedSections] = useState({});
    const [error, setError] = useState(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup event source on unmount
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const handleResearch = async () => {
        if (!topic.trim()) return;

        setIsResearching(true);
        setResearch(null);
        setStreamUpdates([]);
        setError(null);

        try {
            // Start the research agent
            const agent = await agentService.createAgent('RESEARCH', topic);

            // Subscribe to SSE updates
            eventSourceRef.current = agentService.subscribeToAgent(
                agent.id,
                (update) => {
                    setStreamUpdates(prev => [...prev, update]);
                    if (update.type === 'result') {
                        setResearch(update.result || update);
                        setIsResearching(false);
                    }
                },
                (err) => {
                    console.error('SSE error:', err);
                    // Fallback to regular API call
                    fetchResearchFallback(topic);
                }
            );

            // Also trigger execution
            await agentService.executeAgent(agent.id);
        } catch (err) {
            console.error('Research failed:', err);
            // Fallback to direct API
            fetchResearchFallback(topic);
        }
    };

    const fetchResearchFallback = async (researchTopic) => {
        try {
            const res = await aiService.deepResearch(researchTopic);
            setResearch(res);
        } catch (err) {
            setError('Research failed. Please try again.');
        } finally {
            setIsResearching(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const downloadAsMarkdown = () => {
        if (!research) return;

        let markdown = `# ${research.topic || topic}\n\n`;

        if (research.summary) {
            markdown += `## Summary\n${research.summary}\n\n`;
        }

        if (research.sections) {
            research.sections.forEach(section => {
                markdown += `## ${section.title}\n${section.content}\n\n`;
            });
        }

        if (research.sources) {
            markdown += `## Sources\n`;
            research.sources.forEach((src, i) => {
                markdown += `${i + 1}. [${src.title}](${src.url})\n`;
            });
        }

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research-${topic.replace(/\s+/g, '-').toLowerCase()}.md`;
        a.click();
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
                    <Globe className="w-8 h-8 text-emerald-500" />
                    Deep Research
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-2">
                    AI-powered research assistant that explores topics in depth
                </p>
            </div>

            {/* Research Input */}
            <div className="mb-8">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                            placeholder="Enter a topic to research deeply..."
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                        />
                    </div>
                    <button
                        onClick={handleResearch}
                        disabled={isResearching || !topic.trim()}
                        className="px-8 py-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isResearching ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Researching...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Research
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stream Updates */}
            <AnimatePresence>
                {isResearching && streamUpdates.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
                    >
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-3">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="font-medium">Research in progress...</span>
                        </div>
                        <div className="space-y-1 text-sm text-emerald-600 dark:text-emerald-400">
                            {streamUpdates.slice(-5).map((update, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{update.message || update.step || JSON.stringify(update)}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-red-700 dark:text-red-300">{error}</span>
                </div>
            )}

            {/* Research Result */}
            {research && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => copyToClipboard(JSON.stringify(research, null, 2))}
                            className="px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-sm hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            Copy
                        </button>
                        <button
                            onClick={downloadAsMarkdown}
                            className="px-4 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-sm hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>

                    {/* Summary */}
                    {research.summary && (
                        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-3">
                                <BookOpen className="w-5 h-5" />
                                <span className="font-semibold">Summary</span>
                            </div>
                            <p className="text-surface-700 dark:text-surface-300 leading-relaxed">
                                {research.summary}
                            </p>
                        </div>
                    )}

                    {/* Sections */}
                    {research.sections && research.sections.map((section, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                        >
                            <button
                                onClick={() => toggleSection(idx)}
                                className="w-full p-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-surface-500" />
                                    <span className="font-medium text-surface-900 dark:text-surface-100">
                                        {section.title}
                                    </span>
                                </div>
                                {expandedSections[idx] ? (
                                    <ChevronDown className="w-5 h-5 text-surface-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-surface-400" />
                                )}
                            </button>
                            <AnimatePresence>
                                {expandedSections[idx] && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-0 text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">
                                            {section.content}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {/* Key Points */}
                    {research.keyPoints && (
                        <div className="p-6 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                            <div className="flex items-center gap-2 text-surface-900 dark:text-surface-100 mb-4">
                                <BookMarked className="w-5 h-5 text-purple-500" />
                                <span className="font-semibold">Key Points</span>
                            </div>
                            <ul className="space-y-2">
                                {research.keyPoints.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-surface-600 dark:text-surface-400">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Sources */}
                    {research.sources && research.sources.length > 0 && (
                        <div className="p-6 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                            <div className="flex items-center gap-2 text-surface-900 dark:text-surface-100 mb-4">
                                <Link2 className="w-5 h-5 text-blue-500" />
                                <span className="font-semibold">Sources</span>
                            </div>
                            <div className="space-y-3">
                                {research.sources.map((source, idx) => (
                                    <a
                                        key={idx}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors group"
                                    >
                                        <Globe className="w-4 h-4 text-surface-400 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-surface-900 dark:text-surface-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                                {source.title}
                                            </div>
                                            <div className="text-sm text-surface-500 truncate">
                                                {source.url}
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    {research.timestamp && (
                        <div className="flex items-center justify-center gap-2 text-sm text-surface-400">
                            <Clock className="w-4 h-4" />
                            <span>Researched on {new Date(research.timestamp).toLocaleString()}</span>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default DeepResearch;
