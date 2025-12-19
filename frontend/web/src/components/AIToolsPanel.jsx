import React, { useState, useCallback } from 'react';
import {
    BookOpen, Brain, Mic, Clock, Search, ChevronDown, ChevronUp,
    Sparkles, X, Loader2, Download, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AIToolsPanel.css';

/**
 * AIToolsPanel - Integrated AI Tools for Notes
 * Provides Study Guide, Mind Map, Audio, Timeline generation from note content
 */
const AIToolsPanel = ({
    isOpen,
    onClose,
    noteContent,
    noteTitle,
    onInsertContent
}) => {
    const [activeTab, setActiveTab] = useState('study');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const tabs = [
        { id: 'study', label: 'Study Guide', icon: BookOpen },
        { id: 'concepts', label: 'Key Concepts', icon: Sparkles },
        { id: 'mindmap', label: 'Mind Map', icon: Brain },
        { id: 'audio', label: 'Audio', icon: Mic },
        { id: 'timeline', label: 'Timeline', icon: Clock },
        { id: 'faq', label: 'FAQ', icon: Search }
    ];

    const getContentText = useCallback(() => {
        if (!noteContent) return '';

        if (typeof noteContent === 'string') return noteContent;

        // Extract text from TipTap/ProseMirror JSON
        const extractText = (node) => {
            if (!node) return '';
            if (node.text) return node.text;
            if (node.content) return node.content.map(extractText).join(' ');
            return '';
        };

        return extractText(noteContent);
    }, [noteContent]);

    const generateContent = useCallback(async () => {
        const content = getContentText();
        if (!content.trim()) {
            setError('Please add some content to your note first.');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const userId = localStorage.getItem('userId') || '1';
        const headers = {
            'Content-Type': 'application/json',
            'X-User-Id': userId
        };

        try {
            let endpoint = '';
            let body = {};

            switch (activeTab) {
                case 'study':
                    endpoint = '/api/ai/study-guide';
                    body = { topic: noteTitle || 'Study Guide', content, noteIds: [] };
                    break;
                case 'concepts':
                    endpoint = '/api/ai/key-concepts';
                    body = { content };
                    break;
                case 'mindmap':
                    endpoint = '/api/ai/mind-map';
                    body = { content, centralTopic: noteTitle || 'Main Topic' };
                    break;
                case 'audio':
                    endpoint = '/api/ai/podcast-script';
                    body = { content, topic: noteTitle || 'Audio Overview' };
                    break;
                case 'timeline':
                    endpoint = '/api/ai/timeline';
                    body = { content };
                    break;
                case 'faq':
                    endpoint = '/api/ai/faq';
                    body = { content, count: 5 };
                    break;
                default:
                    throw new Error('Unknown tool type');
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Failed to generate ${activeTab}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error('AI generation error:', err);
            setError(err.message || 'Failed to generate content. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [activeTab, getContentText, noteTitle]);

    const copyToClipboard = useCallback((text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const renderResult = () => {
        if (!result) return null;

        switch (activeTab) {
            case 'study':
                return (
                    <div className="result-content study-guide-result">
                        <h4>{result.topic}</h4>
                        {result.sections && Object.entries(result.sections).map(([title, content]) => (
                            <div key={title} className="section-block">
                                <h5>{title}</h5>
                                <p>{content}</p>
                            </div>
                        ))}
                        {result.fullContent && (
                            <details className="full-content-toggle">
                                <summary>View Full Guide</summary>
                                <pre>{result.fullContent}</pre>
                            </details>
                        )}
                    </div>
                );

            case 'concepts':
                return (
                    <div className="result-content concepts-result">
                        {Array.isArray(result) && result.map((concept, i) => (
                            <div key={i} className="concept-card">
                                <div className="concept-header">
                                    <span className="concept-term">{concept.term}</span>
                                    <span className={`importance ${concept.importance}`}>
                                        {concept.importance}
                                    </span>
                                </div>
                                <p className="concept-def">{concept.definition}</p>
                                {concept.relatedTerms?.length > 0 && (
                                    <div className="related-terms">
                                        {concept.relatedTerms.map((term, j) => (
                                            <span key={j} className="related-tag">{term}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );

            case 'mindmap':
                return (
                    <div className="result-content mindmap-result">
                        <div className="mindmap-preview">
                            <h4>🧠 {result.central?.label || 'Mind Map'}</h4>
                            {result.branches?.map((branch, i) => (
                                <div key={i} className="branch-node">
                                    <span className="branch-label">→ {branch.label}</span>
                                    {branch.children?.map((child, j) => (
                                        <span key={j} className="child-node">• {child.label}</span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'audio':
                return (
                    <div className="result-content audio-result">
                        <h4>🎙️ {result.topic}</h4>
                        <div className="audio-meta">
                            <span>⏱️ ~{Math.round((result.estimatedSeconds || 300) / 60)} min</span>
                            <span>👥 {result.dialogue?.length || 0} exchanges</span>
                        </div>
                        <div className="dialogue-preview">
                            {result.dialogue?.slice(0, 5).map((line, i) => (
                                <div key={i} className="dialogue-line">
                                    <span className={`speaker ${line.speaker?.toLowerCase()}`}>
                                        {line.speaker}:
                                    </span>
                                    <span className="text">{line.text}</span>
                                </div>
                            ))}
                            {result.dialogue?.length > 5 && (
                                <p className="more-indicator">...and {result.dialogue.length - 5} more exchanges</p>
                            )}
                        </div>
                    </div>
                );

            case 'timeline':
                return (
                    <div className="result-content timeline-result">
                        {Array.isArray(result) && result.map((event, i) => (
                            <div key={i} className="timeline-event">
                                <div className="event-date">{event.date}</div>
                                <div className="event-content">
                                    <h5>{event.event}</h5>
                                    {event.significance && (
                                        <p className="significance">{event.significance}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'faq':
                return (
                    <div className="result-content faq-result">
                        {Array.isArray(result) && result.map((faq, i) => (
                            <div key={i} className="faq-item">
                                <h5 className="question">Q: {faq.question}</h5>
                                <p className="answer">A: {faq.answer}</p>
                            </div>
                        ))}
                    </div>
                );

            default:
                return <pre>{JSON.stringify(result, null, 2)}</pre>;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.3 }}
                className="ai-tools-panel"
            >
                {/* Header */}
                <div className="panel-header">
                    <div className="header-title">
                        <Sparkles size={18} className="sparkle-icon" />
                        <h3>AI Study Tools</h3>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="panel-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setResult(null); setError(null); }}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            title={tab.label}
                        >
                            <tab.icon size={16} />
                            <span className="tab-label">{tab.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="panel-content">
                    {/* Generate Button */}
                    <button
                        onClick={generateContent}
                        disabled={loading}
                        className="generate-btn"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate {tabs.find(t => t.id === activeTab)?.label}
                            </>
                        )}
                    </button>

                    {/* Error */}
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="results-container">
                            <div className="results-header">
                                <h4>Generated Content</h4>
                                <div className="result-actions">
                                    <button
                                        onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                                        className="action-btn"
                                        title="Copy"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                    <button className="action-btn" title="Download">
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                            {renderResult()}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !result && !error && (
                        <div className="empty-state">
                            <p>
                                Select a tool and click generate to create {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} from your note content.
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AIToolsPanel;
