import React, { useState, useCallback } from 'react';
import './StudyGuide.css';

/**
 * StudyGuide Component - Phase 5
 * Displays AI-generated study guides with sections
 */
const StudyGuide = ({ topic: initialTopic, noteIds = [] }) => {
    const [topic, setTopic] = useState(initialTopic || '');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [guide, setGuide] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [error, setError] = useState(null);

    const generateGuide = useCallback(async () => {
        if (!topic.trim() && !content.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notebook/study-guide', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': localStorage.getItem('userId') || '1'
                },
                body: JSON.stringify({
                    topic,
                    noteIds,
                    content // Direct content input
                })
            });

            if (!response.ok) throw new Error('Failed to generate study guide');

            const data = await response.json();
            setGuide(data);
            if (data.sections && Object.keys(data.sections).length > 0) {
                setActiveSection(Object.keys(data.sections)[0]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [topic, content, noteIds]);

    const renderSection = (title, content) => (
        <div
            key={title}
            className={`guide-section ${activeSection === title ? 'active' : ''}`}
            onClick={() => setActiveSection(title)}
        >
            <h3 className="section-title">
                <span className="section-icon">📚</span>
                {title}
            </h3>
            {activeSection === title && (
                <div className="section-content">
                    {content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="study-guide">
            <div className="guide-header">
                <h2>📖 Study Guide Generator</h2>
                <p className="subtitle">Create comprehensive study materials from your notes</p>
            </div>

            <div className="guide-input-section">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic (e.g., Quantum Mechanics)"
                    className="topic-input"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Or paste your notes content here..."
                    className="content-input"
                    rows={4}
                />
                <button
                    onClick={generateGuide}
                    disabled={loading || (!topic.trim() && !content.trim())}
                    className="generate-btn"
                >
                    {loading ? '🔄 Generating...' : '✨ Generate Study Guide'}
                </button>
            </div>

            {error && (
                <div className="guide-error">
                    ⚠️ {error}
                </div>
            )}

            {loading && (
                <div className="guide-loading">
                    <div className="loading-spinner"></div>
                    <p>Creating your personalized study guide...</p>
                </div>
            )}

            {guide && (
                <div className="guide-content">
                    <div className="guide-title-bar">
                        <h3>{guide.topic}</h3>
                        <div className="guide-actions">
                            <button className="action-btn" title="Download">📥</button>
                            <button className="action-btn" title="Print">🖨️</button>
                            <button className="action-btn" title="Share">🔗</button>
                        </div>
                    </div>

                    <div className="sections-nav">
                        {guide.sections && Object.keys(guide.sections).map(title => (
                            <button
                                key={title}
                                className={`nav-btn ${activeSection === title ? 'active' : ''}`}
                                onClick={() => setActiveSection(title)}
                            >
                                {title.replace(/^\d+\.\s*/, '')}
                            </button>
                        ))}
                    </div>

                    <div className="sections-container">
                        {guide.sections && Object.entries(guide.sections).map(([title, content]) =>
                            renderSection(title, content)
                        )}
                    </div>

                    {guide.fullContent && (
                        <details className="full-content-toggle">
                            <summary>View Full Guide</summary>
                            <pre className="full-content">{guide.fullContent}</pre>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudyGuide;
