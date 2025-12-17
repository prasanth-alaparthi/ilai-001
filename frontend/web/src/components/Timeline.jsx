import React, { useState, useCallback } from 'react';
import './Timeline.css';

/**
 * Timeline Component - Phase 5
 * Displays chronological events extracted from content
 */
const Timeline = ({ content: initialContent }) => {
    const [content, setContent] = useState(initialContent || '');
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const generateTimeline = useCallback(async () => {
        if (!content.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/notebook/timeline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': localStorage.getItem('userId') || '1'
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) throw new Error('Failed to generate timeline');

            const data = await response.json();
            setEvents(data);
        } catch (err) {
            console.error('Timeline error:', err);
        } finally {
            setLoading(false);
        }
    }, [content]);

    return (
        <div className="timeline-container">
            <div className="timeline-header">
                <h2>📅 Timeline Generator</h2>
                <p className="subtitle">Extract chronological events from your content</p>
            </div>

            <div className="timeline-input">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste historical or sequential content here..."
                    className="content-input"
                    rows={4}
                />
                <button
                    onClick={generateTimeline}
                    disabled={loading || !content.trim()}
                    className="generate-btn"
                >
                    {loading ? '🔄 Extracting Events...' : '📊 Generate Timeline'}
                </button>
            </div>

            {loading && (
                <div className="timeline-loading">
                    <div className="clock-animation">🕐</div>
                    <p>Analyzing chronological events...</p>
                </div>
            )}

            {events.length > 0 && (
                <div className="timeline-content">
                    <div className="timeline-line">
                        {events.map((event, i) => (
                            <div
                                key={i}
                                className={`timeline-event ${selectedEvent === i ? 'selected' : ''} ${i % 2 === 0 ? 'left' : 'right'}`}
                                onClick={() => setSelectedEvent(selectedEvent === i ? null : i)}
                            >
                                <div className="event-marker">
                                    <div className="marker-dot"></div>
                                    <div className="marker-line"></div>
                                </div>

                                <div className="event-card">
                                    <div className="event-date">{event.date}</div>
                                    <h4 className="event-title">{event.event}</h4>
                                    {selectedEvent === i && event.significance && (
                                        <p className="event-significance">
                                            <span className="sig-icon">💡</span>
                                            {event.significance}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="timeline-summary">
                        <h4>📊 Timeline Summary</h4>
                        <p>{events.length} events extracted</p>
                        {events[0] && events[events.length - 1] && (
                            <p className="span-info">
                                Spans from <strong>{events[0].date}</strong> to <strong>{events[events.length - 1].date}</strong>
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timeline;
