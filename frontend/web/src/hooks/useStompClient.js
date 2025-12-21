import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useUser } from '../state/UserContext';

/**
 * useStompClient Hook
 * Manages a STOMP over WebSocket connection using the shared JWT from auth-service.
 */
export const useStompClient = (endpoint = '/ws-notes-stomp') => {
    const { user } = useUser();
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('accessToken');
        const socket = new SockJS(`http://localhost:8082${endpoint}`);

        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                // console.log(str);
            },
            onConnect: () => {
                console.log('STOMP: Connected to', endpoint);
                setIsConnected(true);
                setStompClient(client);
            },
            onDisconnect: () => {
                console.log('STOMP: Disconnected');
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('STOMP: Broker error', frame.headers['message']);
                console.error('STOMP: Details', frame.body);
            },
        });

        client.activate();

        return () => {
            if (client) {
                client.deactivate();
            }
        };
    }, [user, endpoint]);

    return { stompClient, isConnected };
};
