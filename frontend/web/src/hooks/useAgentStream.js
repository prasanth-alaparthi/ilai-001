import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useAgentStream - Hook for SSE streaming of agent events
 * Phase 2: Provides real-time agent execution feedback
 */
export const useAgentStream = () => {
    const [events, setEvents] = useState([]);
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const eventSourceRef = useRef(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    /**
     * Stream assistant response with real-time events
     */
    const streamAssistant = useCallback(async (message) => {
        // Reset state
        setEvents([]);
        setStatus('starting');
        setProgress(0);
        setError(null);
        setResult(null);

        const token = localStorage.getItem('accessToken');

        try {
            // Use fetch with streaming for POST requests
            const response = await fetch('/api/agents/assistant/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error('Failed to start stream');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            const data = JSON.parse(line.slice(5));
                            handleEvent(data);
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (err) {
            setError(err.message);
            setStatus('error');
        }
    }, []);

    /**
     * Stream a specific tool execution
     */
    const streamTool = useCallback(async (toolName, params) => {
        setEvents([]);
        setStatus('starting');
        setProgress(0);
        setError(null);
        setResult(null);

        const token = localStorage.getItem('accessToken');

        try {
            const response = await fetch('/api/agents/tools/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({ toolName, params })
            });

            if (!response.ok) {
                throw new Error('Failed to start tool stream');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        try {
                            const data = JSON.parse(line.slice(5));
                            handleEvent(data);
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (err) {
            setError(err.message);
            setStatus('error');
        }
    }, []);

    /**
     * Connect to an existing agent stream by ID
     */
    const connectToAgent = useCallback((agentId) => {
        setEvents([]);
        setStatus('connecting');
        setProgress(0);
        setError(null);
        setResult(null);

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const token = localStorage.getItem('accessToken');
        const url = `/api/agents/stream/${agentId}`;

        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        const eventTypes = ['started', 'thinking', 'tool_call', 'tool_result',
            'progress', 'streaming', 'complete', 'error'];

        eventTypes.forEach(type => {
            eventSource.addEventListener(type, (e) => {
                try {
                    const data = JSON.parse(e.data);
                    handleEvent(data);
                } catch (err) {
                    // Skip invalid JSON
                }
            });
        });

        eventSource.onerror = () => {
            setStatus('error');
            setError('Connection lost');
            eventSource.close();
        };
    }, []);

    /**
     * Handle incoming SSE event
     */
    const handleEvent = (event) => {
        setEvents(prev => [...prev, { ...event, id: Date.now() }]);

        if (event.progress !== undefined) {
            setProgress(event.progress);
        }

        switch (event.type) {
            case 'STARTED':
                setStatus('started');
                break;
            case 'THINKING':
                setStatus('thinking');
                break;
            case 'TOOL_CALL':
                setStatus('tool_call');
                break;
            case 'TOOL_RESULT':
                setStatus('tool_result');
                break;
            case 'STREAMING':
                setStatus('streaming');
                break;
            case 'PROGRESS':
                setStatus('progress');
                break;
            case 'COMPLETE':
                setStatus('complete');
                setResult(event.data);
                break;
            case 'ERROR':
                setStatus('error');
                setError(event.message);
                break;
            default:
                break;
        }
    };

    /**
     * Cancel current stream
     */
    const cancel = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setStatus('cancelled');
    }, []);

    /**
     * Reset state
     */
    const reset = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setEvents([]);
        setStatus('idle');
        setProgress(0);
        setError(null);
        setResult(null);
    }, []);

    return {
        // State
        events,
        status,
        progress,
        error,
        result,
        isLoading: ['starting', 'started', 'thinking', 'tool_call', 'streaming', 'progress'].includes(status),
        isComplete: status === 'complete',
        isError: status === 'error',

        // Actions
        streamAssistant,
        streamTool,
        connectToAgent,
        cancel,
        reset
    };
};

export default useAgentStream;
