import React, { useState, useEffect, useRef } from 'react';
import './AgentMonitor.css';

/**
 * AgentMonitor - Displays real-time agent execution status
 * Phase 2: Shows "Thinking...", "Searching...", progress updates via SSE
 */
const AgentMonitor = ({ agentId, onComplete, onError }) => {
    const [events, setEvents] = useState([]);
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const eventSourceRef = useRef(null);

    useEffect(() => {
        if (!agentId) return;

        // Connect to SSE stream
        const token = localStorage.getItem('accessToken');
        const url = `/api/agents/stream/${agentId}`;

        const eventSource = new EventSource(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        eventSourceRef.current = eventSource;

        // Handle different event types
        eventSource.addEventListener('started', (e) => {
            const data = JSON.parse(e.data);
            setStatus('started');
            setCurrentStep(data.message);
            addEvent(data);
        });

        eventSource.addEventListener('thinking', (e) => {
            const data = JSON.parse(e.data);
            setStatus('thinking');
            setCurrentStep(data.message);
            setProgress(data.progress);
            addEvent(data);
        });

        eventSource.addEventListener('tool_call', (e) => {
            const data = JSON.parse(e.data);
            setStatus('tool_call');
            setCurrentStep(`🔧 ${data.toolName}: ${data.message}`);
            setProgress(data.progress);
            addEvent(data);
        });

        eventSource.addEventListener('tool_result', (e) => {
            const data = JSON.parse(e.data);
            setProgress(data.progress);
            addEvent(data);
        });

        eventSource.addEventListener('progress', (e) => {
            const data = JSON.parse(e.data);
            setProgress(data.progress);
            setCurrentStep(data.message);
            addEvent(data);
        });

        eventSource.addEventListener('streaming', (e) => {
            const data = JSON.parse(e.data);
            setStatus('streaming');
            addEvent(data);
        });

        eventSource.addEventListener('complete', (e) => {
            const data = JSON.parse(e.data);
            setStatus('complete');
            setProgress(100);
            setCurrentStep('✅ ' + data.message);
            addEvent(data);
            eventSource.close();
            if (onComplete) onComplete(data);
        });

        eventSource.addEventListener('error', (e) => {
            const data = e.data ? JSON.parse(e.data) : { message: 'Connection error' };
            setStatus('error');
            setCurrentStep('❌ ' + data.message);
            addEvent(data);
            eventSource.close();
            if (onError) onError(data);
        });

        eventSource.onerror = () => {
            setStatus('error');
            eventSource.close();
        };

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [agentId, onComplete, onError]);

    const addEvent = (event) => {
        setEvents(prev => [...prev, { ...event, id: Date.now() }]);
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'thinking': return '🤔';
            case 'tool_call': return '🔧';
            case 'streaming': return '💬';
            case 'complete': return '✅';
            case 'error': return '❌';
            default: return '⏳';
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'thinking': return 'Thinking...';
            case 'tool_call': return 'Working...';
            case 'streaming': return 'Generating...';
            case 'complete': return 'Complete';
            case 'error': return 'Error';
            default: return 'Starting...';
        }
    };

    if (!agentId) return null;

    return (
        <div className={`agent-monitor ${status}`}>
            <div className="agent-monitor-header">
                <span className="status-icon">{getStatusIcon()}</span>
                <span className="status-label">{getStatusLabel()}</span>
            </div>

            <div className="progress-container">
                <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                />
                <span className="progress-text">{progress}%</span>
            </div>

            <div className="current-step">
                {currentStep}
            </div>

            <div className="events-log">
                {events.slice(-5).map((event) => (
                    <div key={event.id} className={`event-item ${event.type?.toLowerCase()}`}>
                        <span className="event-time">
                            {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="event-message">{event.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgentMonitor;
