import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useUser } from '../state/UserContext';

/**
 * useSidebarSync Hook
 * Subscribes to /user/topic/sidebar for real-time notebook/folder updates.
 * 
 * @param {Function} onRefresh Callback to trigger when a REFRESH_SIDEBAR message is received.
 */
export const useSidebarSync = (onRefresh) => {
    const { user } = useUser();
    const [lastSync, setLastSync] = useState(null);
    const [hasNewSharedContent, setHasNewSharedContent] = useState(false);

    useEffect(() => {
        if (!user || !user.username) return;

        // Use 'user_' + userId if that's the channel name, or just username if that's configured.
        // The backend uses 'user_' + recipientId.
        const userId = user.id; // Assuming user.id exists
        const destinationUser = `user_${userId}`;

        // Use dynamic base URL to support both dev (http) and prod (https)
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const host = window.location.host || 'localhost';
        const baseUrl = `${protocol}//${host}`;

        const socket = new SockJS(`${baseUrl}/ws-notes-stomp`);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log('STOMP (Notes):', str),
            onConnect: () => {
                console.log('Connected to Stomp (Notes Sidebar)');
                stompClient.subscribe(`/user/${destinationUser}/topic/sidebar`, (message) => {
                    const payload = JSON.parse(message.body);
                    console.log('Sidebar Sync Message received:', payload);

                    if (payload.type === 'REFRESH_SIDEBAR') {
                        setLastSync(new Date());
                        setHasNewSharedContent(true);
                        if (onRefresh) onRefresh(payload);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        stompClient.activate();

        return () => {
            if (stompClient) stompClient.deactivate();
        };
    }, [user, onRefresh]);

    return { lastSync, hasNewSharedContent, setHasNewSharedContent };
};
