import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Play, Square, Clock, CheckCircle, XCircle, Loader2,
    Sparkles, Brain, BookOpen, Search, Calendar, FileText,
    Lightbulb, Target, Zap, ChevronRight, RefreshCw, History
} from 'lucide-react';
import { agentService } from '../services/agentService';

// Agent type icons
const AGENT_ICONS = {
    RESEARCH: Search,
    NOTES: FileText,
    QUIZ: Lightbulb,
    SCHEDULE: Calendar,
    TUTOR: Brain,
    FLASHCARD: Zap,
    SUMMARY: BookOpen,
    WRITING: FileText,
    CUSTOM: Bot
};

const AGENT_COLORS = {
    RESEARCH: 'purple',
    NOTES: 'blue',
    QUIZ: 'amber',
    SCHEDULE: 'green',
    TUTOR: 'indigo',
    FLASHCARD: 'orange',
    SUMMARY: 'cyan',
    WRITING: 'pink',
    CUSTOM: 'slate'
};

const AgentDashboard = () => {
    // State
    const [templates, setTemplates] = useState([]);
    const [activeAgents, setActiveAgents] = useState([]);
    const [agentHistory, setAgentHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);

    // Quick prompt
    const [quickPrompt, setQuickPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [assistantResponse, setAssistantResponse] = useState(null);

    useEffect(() => {
        loadData();
        // Poll active agents every 10 seconds
        const interval = setInterval(loadActiveAgents, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [templatesRes, activeRes, historyRes] = await Promise.all([
                agentService.getTemplates().catch(() => []),
                agentService.getActiveAgents().catch(() => []),
                agentService.getAgentHistory(10).catch(() => [])
            ]);
            setTemplates(templatesRes || []);
            setActiveAgents(activeRes || []);
            setAgentHistory(historyRes || []);
        } catch (err) {
            console.error('Failed to load agent data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadActiveAgents = async () => {
        try {
            const res = await agentService.getActiveAgents();
            setActiveAgents(res || []);
        } catch (err) {
            console.error('Failed to load active agents:', err);
        }
    };

    const handleQuickPrompt = async () => {
        if (!quickPrompt.trim()) return;

        setIsProcessing(true);
        setAssistantResponse(null);

        try {
            const response = await agentService.askAssistant(quickPrompt);
            setAssistantResponse(response);
            setQuickPrompt('');
            // Reload active agents in case new ones were created
            loadActiveAgents();
        } catch (err) {
            console.error('Assistant request failed:', err);
            setAssistantResponse({ error: 'Failed to process your request. Please try again.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreateAgent = async (type) => {
        const goal = prompt(`What would you like the ${type} agent to do?`);
        if (!goal) return;

        try {
            const agent = await agentService.createAgent(type, goal);
            setActiveAgents([...activeAgents, agent]);
            // Auto-execute
            await agentService.executeAgent(agent.id);
            loadActiveAgents();
        } catch (err) {
            console.error('Failed to create agent:', err);
        }
    };

    const handleCancelAgent = async (agentId) => {
        try {
            await agentService.cancelAgent(agentId);
            loadActiveAgents();
        } catch (err) {
            console.error('Failed to cancel agent:', err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'RUNNING': return 'text-blue-500';
            case 'COMPLETED': return 'text-green-500';
            case 'FAILED': return 'text-red-500';
            case 'CANCELLED': return 'text-gray-500';
            default: return 'text-yellow-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'RUNNING': return <Loader2 className="w-4 h-4 animate-spin" />;
            case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
            case 'FAILED': return <XCircle className="w-4 h-4" />;
            case 'CANCELLED': return <Square className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
                    <Bot className="w-8 h-8 text-purple-500" />
                    AI Agents
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-2">
                    Create and manage AI agents to automate your learning tasks
                </p>
            </div>

            {/* Quick Assistant */}
            <div className="mb-8 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-4">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-medium">Personal Assistant</span>
                </div>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={quickPrompt}
                        onChange={(e) => setQuickPrompt(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleQuickPrompt()}
                        placeholder="Ask me anything... 'Research quantum computing' or 'Create flashcards for biology'"
                        className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleQuickPrompt}
                        disabled={isProcessing || !quickPrompt.trim()}
                        className="px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Bot className="w-5 h-5" />
                                Ask
                            </>
                        )}
                    </button>
                </div>

                {/* Assistant Response */}
                <AnimatePresence>
                    {assistantResponse && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-white dark:bg-surface-800 rounded-xl"
                        >
                            {assistantResponse.error ? (
                                <p className="text-red-600 dark:text-red-400">{assistantResponse.error}</p>
                            ) : (
                                <div>
                                    {assistantResponse.message && (
                                        <p className="text-surface-700 dark:text-surface-300 mb-2">
                                            {assistantResponse.message}
                                        </p>
                                    )}
                                    {assistantResponse.agentCreated && (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <CheckCircle className="w-4 h-4" />
                                            Agent created and running
                                        </div>
                                    )}
                                    {assistantResponse.result && (
                                        <pre className="mt-2 p-3 rounded-lg bg-surface-100 dark:bg-surface-700 text-sm overflow-auto">
                                            {JSON.stringify(assistantResponse.result, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Active Agents */}
            {activeAgents.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                            <Play className="w-5 h-5 text-blue-500" />
                            Active Agents
                        </h2>
                        <button
                            onClick={loadActiveAgents}
                            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 text-surface-500" />
                        </button>
                    </div>
                    <div className="grid gap-4">
                        {activeAgents.map((agent) => {
                            const Icon = AGENT_ICONS[agent.type] || Bot;
                            return (
                                <motion.div
                                    key={agent.id}
                                    layout
                                    className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-surface-900 dark:text-surface-100">
                                                    {agent.goal || agent.type}
                                                </div>
                                                <div className={`text-sm flex items-center gap-1 ${getStatusColor(agent.status)}`}>
                                                    {getStatusIcon(agent.status)}
                                                    <span>{agent.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {agent.status === 'RUNNING' && (
                                            <button
                                                onClick={() => handleCancelAgent(agent.id)}
                                                className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                    {agent.result && (
                                        <div className="mt-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-700 text-sm">
                                            <pre className="overflow-auto text-surface-600 dark:text-surface-400">
                                                {typeof agent.result === 'string'
                                                    ? agent.result
                                                    : JSON.stringify(agent.result, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Agent Templates */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { type: 'RESEARCH', name: 'Research', desc: 'Deep dive into a topic', icon: Search },
                        { type: 'QUIZ', name: 'Quiz Me', desc: 'Test your knowledge', icon: Lightbulb },
                        { type: 'FLASHCARD', name: 'Flashcards', desc: 'Create study cards', icon: Zap },
                        { type: 'SUMMARY', name: 'Summarize', desc: 'Condense content', icon: BookOpen },
                        { type: 'TUTOR', name: 'Tutor', desc: 'Get explanations', icon: Brain },
                        { type: 'WRITING', name: 'Writing', desc: 'Help with essays', icon: FileText },
                        { type: 'SCHEDULE', name: 'Plan', desc: 'Study schedule', icon: Calendar },
                        { type: 'CUSTOM', name: 'Custom', desc: 'Create your own', icon: Bot }
                    ].map(({ type, name, desc, icon: Icon }) => (
                        <motion.button
                            key={type}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCreateAgent(type)}
                            className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors text-left group"
                        >
                            <div className={`p-2 rounded-lg inline-block bg-${AGENT_COLORS[type]}-100 dark:bg-${AGENT_COLORS[type]}-900/30 mb-3`}>
                                <Icon className={`w-5 h-5 text-${AGENT_COLORS[type]}-600 dark:text-${AGENT_COLORS[type]}-400`} />
                            </div>
                            <div className="font-medium text-surface-900 dark:text-surface-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {name}
                            </div>
                            <div className="text-sm text-surface-500">{desc}</div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Agent History */}
            {agentHistory.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2 mb-4">
                        <History className="w-5 h-5 text-surface-500" />
                        Recent History
                    </h2>
                    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-200 dark:divide-surface-700">
                        {agentHistory.map((agent) => {
                            const Icon = AGENT_ICONS[agent.type] || Bot;
                            return (
                                <div
                                    key={agent.id}
                                    className="p-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5 text-surface-400" />
                                        <div>
                                            <div className="text-surface-900 dark:text-surface-100">
                                                {agent.goal || agent.type}
                                            </div>
                                            <div className="text-sm text-surface-500">
                                                {new Date(agent.createdAt || Date.now()).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm ${getStatusColor(agent.status)}`}>
                                        {getStatusIcon(agent.status)}
                                        <span>{agent.status}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentDashboard;
