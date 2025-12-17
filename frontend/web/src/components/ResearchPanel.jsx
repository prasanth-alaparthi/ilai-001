import React, { useState, useCallback } from 'react';
import './ResearchPanel.css';

/**
 * ResearchPanel - Phase 3 Deep Research UI
 * Displays research results with citations and follow-up questions
 */
const ResearchPanel = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [depth, setDepth] = useState('deep');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [expandedCitation, setExpandedCitation] = useState(null);

    const handleResearch = useCallback(async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/research', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': localStorage.getItem('userId') || '1'
                },
                body: JSON.stringify({ query, depth })
            });

            if (!response.ok) throw new Error('Research failed');

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [query, depth]);

    const handleFollowUp = (question) => {
        setQuery(question);
        handleResearch();
    };

    const renderCitationBadge = (num) => (
        <span
            className="citation-badge"
            onClick={() => setExpandedCitation(expandedCitation === num ? null : num)}
        >
            [{num}]
        </span>
    );

    const formatAnswer = (text) => {
        if (!text) return null;

        // Replace [n] with clickable citation badges
        const parts = text.split(/(\[\d+\])/g);
        return parts.map((part, i) => {
            const match = part.match(/\[(\d+)\]/);
            if (match) {
                return <span key={i}>{renderCitationBadge(parseInt(match[1]))}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const getCitationIcon = (type) => {
        switch (type) {
            case 'note': return '📝';
            case 'wikipedia': return '🌐';
            case 'web': return '🔍';
            case 'arxiv': return '📄';
            default: return '📌';
        }
    };

    return (
        <div className="research-panel">
            <div className="research-header">
                <h2>🔬 Deep Research</h2>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>×</button>
                )}
            </div>

            <div className="research-input-section">
                <div className="search-container">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What would you like to research?"
                        className="research-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                    />
                    <select
                        value={depth}
                        onChange={(e) => setDepth(e.target.value)}
                        className="depth-select"
                    >
                        <option value="quick">⚡ Quick</option>
                        <option value="deep">🔍 Deep</option>
                        <option value="academic">📚 Academic</option>
                    </select>
                    <button
                        onClick={handleResearch}
                        disabled={loading || !query.trim()}
                        className="research-btn"
                    >
                        {loading ? '🔄 Researching...' : '🚀 Research'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="research-error">
                    ⚠️ {error}
                </div>
            )}

            {loading && (
                <div className="research-loading">
                    <div className="loading-animation">
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                    </div>
                    <p>Searching your notes and the web...</p>
                </div>
            )}

            {result && (
                <div className="research-results">
                    <div className="confidence-bar">
                        <div
                            className="confidence-fill"
                            style={{ width: `${result.confidence * 100}%` }}
                        />
                        <span className="confidence-label">
                            {Math.round(result.confidence * 100)}% confident
                        </span>
                    </div>

                    <div className="answer-section">
                        <h3>Answer</h3>
                        <div className="answer-text">
                            {formatAnswer(result.answer)}
                        </div>
                    </div>

                    {result.citations && result.citations.length > 0 && (
                        <div className="citations-section">
                            <h3>📚 Sources ({result.citations.length})</h3>
                            <div className="citations-grid">
                                {result.citations.map((citation) => (
                                    <div
                                        key={citation.number}
                                        className={`citation-card ${expandedCitation === citation.number ? 'expanded' : ''}`}
                                        onClick={() => setExpandedCitation(
                                            expandedCitation === citation.number ? null : citation.number
                                        )}
                                    >
                                        <div className="citation-header">
                                            <span className="citation-icon">
                                                {getCitationIcon(citation.sourceType)}
                                            </span>
                                            <span className="citation-number">[{citation.number}]</span>
                                            <span className="citation-title">{citation.title}</span>
                                        </div>
                                        {expandedCitation === citation.number && (
                                            <div className="citation-details">
                                                <p className="citation-snippet">{citation.snippet}</p>
                                                {citation.url && !citation.url.startsWith('note:') && (
                                                    <a
                                                        href={citation.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="citation-link"
                                                    >
                                                        View source →
                                                    </a>
                                                )}
                                                <div className="citation-relevance">
                                                    Relevance: {Math.round(citation.relevance * 100)}%
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.followUpQuestions && result.followUpQuestions.length > 0 && (
                        <div className="followup-section">
                            <h3>🤔 Learn More</h3>
                            <div className="followup-questions">
                                {result.followUpQuestions.map((question, i) => (
                                    <button
                                        key={i}
                                        className="followup-btn"
                                        onClick={() => handleFollowUp(question)}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResearchPanel;
