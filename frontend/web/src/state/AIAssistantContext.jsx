import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AIAssistantContext = createContext();

export function useAIAssistant() {
    return useContext(AIAssistantContext);
}

export function AIAssistantProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeAgents, setActiveAgents] = useState([]);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const response = await apiClient.get('/assistant/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }, []);

    const startConversation = useCallback(async (title, contextType = 'general', contextId = null) => {
        try {
            const response = await apiClient.post('/assistant/conversations', {
                title,
                contextType,
                contextId
            });
            const newConversation = response.data;
            setConversations(prev => [newConversation, ...prev]);
            setCurrentConversation(newConversation);
            setMessages([]);
            return newConversation;
        } catch (error) {
            console.error('Failed to start conversation:', error);
            throw error;
        }
    }, []);

    const loadMessages = useCallback(async (conversationId) => {
        try {
            const response = await apiClient.get(`/assistant/conversations/${conversationId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }, []);

    const selectConversation = useCallback(async (conversation) => {
        setCurrentConversation(conversation);
        await loadMessages(conversation.id);
    }, [loadMessages]);

    const sendMessage = useCallback(async (message) => {
        if (!currentConversation) {
            // Start a new conversation if none exists
            await startConversation('New Chat');
        }

        // Add user message optimistically
        const userMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: message,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await apiClient.post(
                `/assistant/conversations/${currentConversation.id}/chat`,
                { message }
            );
            const assistantMessage = response.data;
            setMessages(prev => [...prev, assistantMessage]);
            return assistantMessage;
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== userMessage.id));
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [currentConversation, startConversation]);

    const quickChat = useCallback(async (message) => {
        setIsLoading(true);
        try {
            const response = await apiClient.post('/assistant/quick-chat', { message });
            return response.data.response;
        } catch (error) {
            console.error('Quick chat failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteConversation = useCallback(async (conversationId) => {
        try {
            await apiClient.delete(`/assistant/conversations/${conversationId}`);
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (currentConversation?.id === conversationId) {
                setCurrentConversation(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    }, [currentConversation]);

    const toggleAssistant = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const value = {
        // State
        isOpen,
        conversations,
        currentConversation,
        messages,
        isLoading,
        activeAgents,

        // Actions
        toggleAssistant,
        setIsOpen,
        startConversation,
        selectConversation,
        sendMessage,
        quickChat,
        deleteConversation,
        loadConversations,
    };

    return (
        <AIAssistantContext.Provider value={value}>
            {children}
        </AIAssistantContext.Provider>
    );
}

export default AIAssistantContext;
