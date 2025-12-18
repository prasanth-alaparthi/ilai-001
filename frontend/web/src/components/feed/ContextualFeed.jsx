/**
 * ILAI Hyper Platform - Contextual Feed
 * 
 * Intelligently shows study materials related to your
 * next 2 hours of calendar events.
 */

import React, { useMemo, useEffect, useState } from 'react';
import './ContextualFeed.css';

/**
 * Contextual Feed Component
 * Shows content relevant to upcoming calendar events
 */
export function ContextualFeed({ calendarEvents = [], feedItems = [], onItemClick }) {
    const [contextKeywords, setContextKeywords] = useState([]);

    // Get upcoming events within next 2 hours
    const upcomingEvents = useMemo(() => {
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        return calendarEvents.filter(event => {
            const eventStart = new Date(event.start);
            return eventStart >= now && eventStart <= twoHoursLater;
        }).sort((a, b) => new Date(a.start) - new Date(b.start));
    }, [calendarEvents]);

    // Extract keywords from upcoming events
    useEffect(() => {
        const keywords = upcomingEvents.flatMap(event =>
            extractKeywords(event.title, event.description)
        );
        setContextKeywords([...new Set(keywords)]);
    }, [upcomingEvents]);

    // Filter and rank feed items by relevance
    const relevantFeed = useMemo(() => {
        if (contextKeywords.length === 0) {
            return feedItems.slice(0, 10);
        }

        return feedItems
            .map(item => ({
                ...item,
                relevanceScore: calculateRelevance(item, contextKeywords)
            }))
            .filter(item => item.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 10);
    }, [feedItems, contextKeywords]);

    const nextEvent = upcomingEvents[0];

    return (
        <div className="contextual-feed">
            {nextEvent && (
                <div className="context-header">
                    <div className="context-icon">📚</div>
                    <div className="context-info">
                        <h3>Prep for your next class</h3>
                        <p className="event-title">{nextEvent.title}</p>
                        <p className="event-time">
                            {formatTimeUntil(new Date(nextEvent.start))}
                        </p>
                    </div>
                </div>
            )}

            {contextKeywords.length > 0 && (
                <div className="context-keywords">
                    {contextKeywords.slice(0, 5).map((keyword, i) => (
                        <span key={i} className="keyword-tag">{keyword}</span>
                    ))}
                </div>
            )}

            <div className="feed-items">
                {relevantFeed.length === 0 ? (
                    <div className="no-items">
                        <p>No relevant content found. Check back later!</p>
                    </div>
                ) : (
                    relevantFeed.map(item => (
                        <FeedCard
                            key={item.id}
                            item={item}
                            onClick={() => onItemClick?.(item)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

/**
 * Feed Card Component
 */
function FeedCard({ item, onClick }) {
    return (
        <div className="feed-card" onClick={onClick}>
            {item.thumbnail && (
                <img src={item.thumbnail} alt="" className="thumbnail" />
            )}
            <div className="content">
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
                <div className="meta">
                    <span className="source">{item.source}</span>
                    {item.relevanceScore && (
                        <span className="relevance">
                            {Math.round(item.relevanceScore * 100)}% relevant
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Extract keywords from text
 */
function extractKeywords(title = '', description = '') {
    const text = `${title} ${description}`.toLowerCase();

    // Common academic keywords
    const academicTerms = [
        'math', 'science', 'physics', 'chemistry', 'biology',
        'history', 'geography', 'english', 'literature',
        'algebra', 'geometry', 'calculus', 'statistics',
        'programming', 'coding', 'computer', 'algorithm',
        'essay', 'project', 'exam', 'quiz', 'test',
        'lecture', 'class', 'study', 'review', 'homework'
    ];

    const foundTerms = academicTerms.filter(term => text.includes(term));

    // Extract capitalized words as potential keywords
    const words = text.split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['the', 'and', 'for', 'with', 'from'].includes(word));

    return [...new Set([...foundTerms, ...words.slice(0, 5)])];
}

/**
 * Calculate relevance score between item and keywords
 */
function calculateRelevance(item, keywords) {
    const itemText = `${item.title || ''} ${item.summary || ''} ${item.source || ''}`.toLowerCase();

    let matches = 0;
    for (const keyword of keywords) {
        if (itemText.includes(keyword.toLowerCase())) {
            matches++;
        }
    }

    return keywords.length > 0 ? matches / keywords.length : 0;
}

/**
 * Format time until event
 */
function formatTimeUntil(date) {
    const now = new Date();
    const diff = date - now;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 60) {
        return `In ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `In ${hours}h ${remainingMinutes}m`;
}

export default ContextualFeed;
