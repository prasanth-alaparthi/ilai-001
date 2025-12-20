/**
 * useVariableSync - WebSocket hook for real-time variable sync
 * 
 * Connects to the backend WebSocket and maintains a synchronized
 * variable registry that updates in real-time across tabs/devices.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_BASE_URL = import.meta.env.VITE_WS_URL ||
    (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
    window.location.host;

export const useVariableSync = (userId) => {
    const [variables, setVariables] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // Convert array of variables to object keyed by symbol
    const variablesToObject = (varsArray) => {
        return varsArray.reduce((acc, v) => {
            const key = v.subject !== 'general' ? `${v.subject}:${v.symbol}` : v.symbol;
            acc[key] = {
                ...v,
                numericValue: parseFloat(v.value) || v.value
            };
            return acc;
        }, {});
    };

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!userId) return;

        const wsUrl = `${WS_BASE_URL}/ws/variables/${userId}`;
        console.log('Connecting to WebSocket:', wsUrl);

        try {
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                reconnectAttempts.current = 0;
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    switch (message.type) {
                        case 'initial_sync':
                            // Initial load of all variables
                            setVariables(variablesToObject(message.data));
                            setLastSync(new Date());
                            break;

                        case 'variable_update':
                            // Single variable updated
                            setVariables(prev => {
                                const v = message.data;
                                const key = v.subject !== 'general' ? `${v.subject}:${v.symbol}` : v.symbol;
                                return {
                                    ...prev,
                                    [key]: {
                                        ...v,
                                        numericValue: parseFloat(v.value) || v.value
                                    }
                                };
                            });
                            break;

                        case 'variable_delete':
                            // Variable deleted
                            setVariables(prev => {
                                const { symbol, subject } = message.data;
                                const key = subject !== 'general' ? `${subject}:${symbol}` : symbol;
                                const { [key]: _, ...rest } = prev;
                                return rest;
                            });
                            break;

                        case 'variable_injected':
                            // Variable injected from search
                            const v = message.data;
                            const key = v.subject !== 'general' ? `${v.subject}:${v.symbol}` : v.symbol;
                            setVariables(prev => ({
                                ...prev,
                                [key]: {
                                    ...v,
                                    numericValue: parseFloat(v.value) || v.value,
                                    isNew: true // Flag for UI highlight
                                }
                            }));
                            break;

                        case 'pong':
                            // Heartbeat response
                            break;

                        default:
                            console.log('Unknown WebSocket message:', message);
                    }
                } catch (e) {
                    console.error('WebSocket message parse error:', e);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setIsConnected(false);

                // Attempt reconnect
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    console.log(`Reconnecting in ${delay}ms...`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connect();
                    }, delay);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (e) {
            console.error('WebSocket connection error:', e);
        }
    }, [userId]);

    // Disconnect
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    // Send message via WebSocket
    const send = useCallback((message) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            return true;
        }
        return false;
    }, []);

    // Upsert a variable (create or update)
    const upsertVariable = useCallback((symbol, value, options = {}) => {
        const { unit, subject = 'general', source = 'user', metadata } = options;

        // Optimistic update
        const key = subject !== 'general' ? `${subject}:${symbol}` : symbol;
        setVariables(prev => ({
            ...prev,
            [key]: {
                symbol,
                value: String(value),
                unit,
                subject,
                source,
                metadata,
                numericValue: parseFloat(value) || value,
                updated_at: new Date().toISOString()
            }
        }));

        // Send to server
        send({
            type: 'upsert',
            data: { symbol, value: String(value), unit, subject, source, metadata }
        });
    }, [send]);

    // Delete a variable
    const deleteVariable = useCallback((symbol, subject = 'general') => {
        const key = subject !== 'general' ? `${subject}:${symbol}` : symbol;

        // Optimistic update
        setVariables(prev => {
            const { [key]: _, ...rest } = prev;
            return rest;
        });

        // Send to server
        send({
            type: 'delete',
            data: { symbol, subject }
        });
    }, [send]);

    // Get variables as a simple object for calculations
    const getVariablesForCalc = useCallback(() => {
        return Object.entries(variables).reduce((acc, [key, v]) => {
            // Use just the symbol (not the subject:symbol key)
            acc[v.symbol] = v.numericValue;
            return acc;
        }, {});
    }, [variables]);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    // Heartbeat to keep connection alive
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            send({ type: 'ping' });
        }, 30000);

        return () => clearInterval(interval);
    }, [isConnected, send]);

    return {
        variables,
        isConnected,
        lastSync,
        upsertVariable,
        deleteVariable,
        getVariablesForCalc,
        reconnect: connect
    };
};

export default useVariableSync;
