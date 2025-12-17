import React, { useState } from 'react';
import StudyGuide from '../components/StudyGuide';
import MindMap from '../components/MindMap';
import AudioPlayer from '../components/AudioPlayer';
import Timeline from '../components/Timeline';
import ResearchPanel from '../components/ResearchPanel';
import './Notebook.css';

/**
 * Notebook Page - Phase 5 Hub
 * NotebookLM-style features in one place
 */
const Notebook = () => {
    const [activeTab, setActiveTab] = useState('study');
    const [sharedContent, setSharedContent] = useState('');

    const tabs = [
        { id: 'study', label: '📖 Study Guide', icon: '📖' },
        { id: 'mindmap', label: '🧠 Mind Map', icon: '🧠' },
        { id: 'audio', label: '🎙️ Audio', icon: '🎙️' },
        { id: 'timeline', label: '📅 Timeline', icon: '📅' },
        { id: 'research', label: '🔬 Research', icon: '🔬' }
    ];

    const renderActiveComponent = () => {
        switch (activeTab) {
            case 'study':
                return <StudyGuide content={sharedContent} />;
            case 'mindmap':
                return <MindMap content={sharedContent} />;
            case 'audio':
                return <AudioPlayer content={sharedContent} />;
            case 'timeline':
                return <Timeline content={sharedContent} />;
            case 'research':
                return <ResearchPanel />;
            default:
                return <StudyGuide content={sharedContent} />;
        }
    };

    return (
        <div className="notebook-page">
            <header className="notebook-header">
                <div className="header-content">
                    <h1>📓 AI Notebook</h1>
                    <p className="tagline">Your intelligent study companion</p>
                </div>
                <div className="header-actions">
                    <button className="action-btn" title="Import Notes">📥 Import</button>
                    <button className="action-btn primary" title="New Session">✨ New</button>
                </div>
            </header>

            {/* Shared Content Input */}
            <div className="shared-content-section">
                <textarea
                    value={sharedContent}
                    onChange={(e) => setSharedContent(e.target.value)}
                    placeholder="Paste your notes or content here to use across all tools..."
                    className="shared-input"
                    rows={3}
                />
                {sharedContent && (
                    <div className="content-stats">
                        <span>📝 {sharedContent.split(/\s+/).length} words</span>
                        <span>📊 {sharedContent.length} characters</span>
                        <button
                            className="clear-btn"
                            onClick={() => setSharedContent('')}
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <nav className="notebook-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label.split(' ')[1]}</span>
                    </button>
                ))}
            </nav>

            {/* Active Component */}
            <main className="notebook-content">
                {renderActiveComponent()}
            </main>

            {/* Quick Actions Footer */}
            <footer className="notebook-footer">
                <div className="quick-actions">
                    <button className="quick-btn" title="Generate All">
                        ⚡ Generate All
                    </button>
                    <button className="quick-btn" title="Export">
                        📤 Export Package
                    </button>
                    <button className="quick-btn" title="Share">
                        🔗 Share
                    </button>
                </div>
                <div className="credits-info">
                    <span className="credit-icon">💎</span>
                    <span>Premium features enabled</span>
                </div>
            </footer>
        </div>
    );
};

export default Notebook;
