import React, { useState } from 'react';
import './CitationCard.css';

/**
 * CitationCard - Hover preview for research citations
 */
const CitationCard = ({ citation, isInline = false }) => {
    const [showPreview, setShowPreview] = useState(false);

    const getCitationIcon = (type) => {
        switch (type) {
            case 'note': return '📝';
            case 'wikipedia': return '🌐';
            case 'web': return '🔍';
            case 'arxiv': return '📄';
            default: return '📌';
        }
    };

    const getSourceLabel = (type) => {
        switch (type) {
            case 'note': return 'Your Notes';
            case 'wikipedia': return 'Wikipedia';
            case 'web': return 'Web';
            case 'arxiv': return 'arXiv Paper';
            default: return 'Source';
        }
    };

    if (isInline) {
        return (
            <span
                className="citation-inline"
                onMouseEnter={() => setShowPreview(true)}
                onMouseLeave={() => setShowPreview(false)}
            >
                <span className="citation-badge-inline">[{citation.number}]</span>

                {showPreview && (
                    <div className="citation-preview">
                        <div className="preview-header">
                            <span className="preview-icon">{getCitationIcon(citation.sourceType)}</span>
                            <span className="preview-source">{getSourceLabel(citation.sourceType)}</span>
                        </div>
                        <h4 className="preview-title">{citation.title}</h4>
                        <p className="preview-snippet">{citation.snippet}</p>
                        {citation.url && !citation.url.startsWith('note:') && (
                            <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="preview-link"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Open source →
                            </a>
                        )}
                        <div className="preview-relevance">
                            <div className="relevance-bar">
                                <div
                                    className="relevance-fill"
                                    style={{ width: `${citation.relevance * 100}%` }}
                                />
                            </div>
                            <span>{Math.round(citation.relevance * 100)}% relevant</span>
                        </div>
                    </div>
                )}
            </span>
        );
    }

    return (
        <div className="citation-card-full">
            <div className="card-header">
                <span className="card-icon">{getCitationIcon(citation.sourceType)}</span>
                <span className="card-number">[{citation.number}]</span>
                <span className="card-source">{getSourceLabel(citation.sourceType)}</span>
            </div>
            <h4 className="card-title">{citation.title}</h4>
            <p className="card-snippet">{citation.snippet}</p>
            <div className="card-footer">
                <div className="card-relevance">
                    <div className="relevance-bar">
                        <div
                            className="relevance-fill"
                            style={{ width: `${citation.relevance * 100}%` }}
                        />
                    </div>
                    <span>{Math.round(citation.relevance * 100)}%</span>
                </div>
                {citation.url && !citation.url.startsWith('note:') && (
                    <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-link"
                    >
                        View →
                    </a>
                )}
            </div>
        </div>
    );
};

export default CitationCard;
