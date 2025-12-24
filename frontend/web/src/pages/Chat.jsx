import React, { useEffect, useState, useCallback, useRef } from "react";
import apiClient from "../services/apiClient";
import ChatSidebar from "../components/chat/ChatSidebar";
import MessageList from "../components/chat/messageList";
import MessageInput from "../components/chat/messageInput";
import UserSearchModal from "../components/chat/UserSearchModal";
import { useUser } from "../state/UserContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar, CheckSquare, Calendar, FileText, MoreHorizontal,
  Phone, Video, Search, Plus, X, Clock, Cpu, Users, Hash
} from "lucide-react";

// --- Right Panel Components ---

const TaskItem = ({ task }) => (
  <div className="p-4 glass-panel rounded-xl mb-3 flex items-start gap-4 group hover:bg-white/5 transition-colors">
    <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${task.completed ? 'bg-accent-green border-accent-green' : 'border-secondary/50 hover:border-primary'}`}>
      {task.completed && <CheckSquare size={14} className="text-white" />}
    </div>
    <div className="flex-1">
      <div className={`text-sm font-medium ${task.completed ? 'text-secondary line-through' : 'text-primary'}`}>{task.title}</div>
      {task.dueDate && (
        <div className="text-xs text-secondary mt-1 flex items-center gap-1.5 font-mono">
          <Clock size={12} /> {task.dueDate}
        </div>
      )}
    </div>
  </div>
);

const RightPanel = ({ isOpen, onClose, activeTab, setActiveTab, tasks, onAddTask }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-surface/30 backdrop-blur-xl border-l border-black/5 dark:border-white/10 flex flex-col overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex items-center border-b border-black/5 dark:border-white/10 bg-surface/50">
            {['TASKS', 'SCHEDULE', 'FILES'].map((tab) => {
              const isActive = activeTab === tab;
              const Icons = { TASKS: CheckSquare, SCHEDULE: Calendar, FILES: FileText };
              const Icon = Icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isActive ? 'text-accent-glow bg-white/5' : 'text-secondary hover:text-primary hover:bg-white/5'}`}
                >
                  <Icon size={14} /> {tab}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {activeTab === 'TASKS' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif font-bold text-primary">To-Do List</h3>
                  <button onClick={onAddTask} className="p-2 bg-accent-glow/10 text-accent-glow rounded-lg hover:bg-accent-glow/20 transition-all">
                    <Plus size={16} />
                  </button>
                </div>
                {tasks.map(t => <TaskItem key={t.id} task={t} />)}
                {tasks.length === 0 && (
                  <div className="text-center py-12 text-secondary text-sm glass-panel rounded-xl border-dashed">
                    No tasks yet. <br /> Create one from a message!
                  </div>
                )}
              </>
            )}

            {activeTab === 'SCHEDULE' && (
              <div className="text-center py-20 text-secondary text-sm">
                <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                No upcoming events.
              </div>
            )}

            {activeTab === 'FILES' && (
              <div className="text-center py-20 text-secondary text-sm">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                No shared files.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function ChatApp() {
  const { user } = useUser();
  const userId = user?.id;
  const [searchParams] = useSearchParams();

  // Chat State
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const subscriptionRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);

  // Right Panel State
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('TASKS');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Review project proposal', completed: false, dueDate: 'Today, 2pm' },
    { id: 2, title: 'Send feedback to Sarah', completed: true },
  ]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await apiClient.get("/chat/conversations");
      setConversations(res.data || []);
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  }, []);

  // Connect to WebSocket & Subscribe
  useEffect(() => {
    if (!userId) return;
    const socket = new SockJS("/ws-chat");
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log("STOMP connected");
        setStompClient(client);
      },
      onStompError: (frame) => console.error("Broker error: " + frame.headers["message"]),
    });
    client.activate();
    return () => client.deactivate();
  }, [userId]);

  // Handle Subscription when conversation changes
  useEffect(() => {
    console.log('[Chat] Subscription effect:', {
      hasClient: !!stompClient,
      connected: stompClient?.connected,
      hasConversation: !!selectedConversation,
      conversationId: selectedConversation?.id
    });

    if (!stompClient || !stompClient.connected || !selectedConversation) return;

    if (subscriptionRef.current) {
      console.log('[Chat] Unsubscribing from previous topic');
      subscriptionRef.current.unsubscribe();
    }

    const topic = `/topic/conversation/${selectedConversation.id}`;
    console.log('[Chat] Subscribing to:', topic);

    subscriptionRef.current = stompClient.subscribe(
      topic,
      (message) => {
        console.log('[Chat] Message received on topic:', topic, message.body);
        const newMsg = JSON.parse(message.body);
        console.log('[Chat] Parsed message:', newMsg);
        setMessages((prev) => {
          const updated = [newMsg, ...prev];
          console.log('[Chat] Messages state updated. Count:', updated.length, 'Latest:', updated[0]);
          return updated;
        });
      }
    );

    console.log('[Chat] Subscription active for:', topic);

    return () => {
      if (subscriptionRef.current) {
        console.log('[Chat] Cleaning up subscription');
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [stompClient, selectedConversation]);

  // Initial Load & Params Handling
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Message Handling
  const loadMessages = async (conversation) => {
    try {
      const res = await apiClient.get(`/chat/conversations/${conversation.id}/messages`);
      setMessages(res.data.content || []);
    } catch (e) {
      console.error("Failed to load messages", e);
      setMessages([]);
    }
  };

  const handleSelectConversation = (c) => {
    setSelectedConversation(c);
    loadMessages(c);
    // On mobile, maybe close sidebar?
  };

  const handleSend = async (text, mediaUrl) => {
    if (!selectedConversation) return;
    try {
      await apiClient.post(`/chat/conversations/${selectedConversation.id}/messages`, {
        content: text,
        type: mediaUrl ? "IMAGE" : "TEXT",
        mediaUrl,
        replyToId: replyingTo?.id
      });
      setReplyingTo(null);
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  // Actions
  const handleMessageAction = (msg, action) => {
    if (action === 'TASK') {
      const newTask = {
        id: Date.now(),
        title: msg.content || 'New Task from Chat',
        completed: false,
        dueDate: 'Tomorrow'
      };
      setTasks(prev => [newTask, ...prev]);
      setActiveTab('TASKS');
      if (!isRightPanelOpen) setIsRightPanelOpen(true);
    }
  };

  const handleAddTask = () => {
    const title = window.prompt("Task Name");
    if (title) {
      setTasks(prev => [{ id: Date.now(), title, completed: false }, ...prev]);
    }
  };

  const getConversationIcon = (conv) => {
    switch (conv.type) {
      case 'AI': return <Cpu />;
      case 'GROUP': return <Users />;
      default: return conv.contextType !== 'GENERAL' ? <Hash /> : null;
    }
  };

  return (
    <div className="flex h-full bg-background overflow-hidden font-sans">
      {/* Left Sidebar - Hidden on mobile when conversation selected */}
      <div className={`w-80 h-full flex-shrink-0 border-r border-black/5 dark:border-white/10 bg-surface/30 backdrop-blur-md ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <ChatSidebar
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          onNewChat={() => setShowCreateModal(true)}
        />
      </div>

      {/* Main Chat Area - Full width on mobile when conversation selected */}
      <div className={`flex-1 flex flex-col h-full relative min-w-0 overflow-hidden bg-background ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="h-20 px-8 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-xl z-10 shadow-sm">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-inner ${selectedConversation.type === 'AI'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                  }`}>
                  {getConversationIcon(selectedConversation) || <span className="text-lg">{selectedConversation.name?.[0] || '#'}</span>}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary flex items-center gap-3">
                    {selectedConversation.name || (selectedConversation.type === 'AI' ? 'AI Assistant' : 'Chat')}
                    {selectedConversation.contextType !== 'GENERAL' && (
                      <span className="text-[10px] px-2 py-0.5 bg-white/5 text-secondary rounded-full border border-black/5 dark:border-white/10 uppercase tracking-wide font-mono">
                        {selectedConversation.contextType}
                      </span>
                    )}
                  </h2>
                  <div className="text-xs text-secondary/70 font-medium">
                    {selectedConversation.participantIds?.length || 1} members
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-3 text-secondary hover:text-accent-glow hover:bg-white/5 rounded-xl transition-all">
                  <Phone size={20} />
                </button>
                <button className="p-3 text-secondary hover:text-accent-glow hover:bg-white/5 rounded-xl transition-all">
                  <Video size={20} />
                </button>
                <div className="w-px h-8 bg-white/10 mx-2" />
                <button
                  onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                  className={`p-3 rounded-xl transition-all ${isRightPanelOpen ? 'text-accent-glow bg-accent-glow/10' : 'text-secondary hover:text-primary hover:bg-white/5'}`}
                >
                  <Sidebar size={20} />
                </button>
              </div>
            </div>

            {/* Messages Container - Flex wrapper for proper height */}
            <div className="flex-1 overflow-hidden">
              <MessageList
                key={`messages-${messages.length}-${messages[0]?.id || 'empty'}`}
                messages={messages}
                meUserId={userId}
                onReply={setReplyingTo}
                onAction={handleMessageAction}
              />
            </div>

            {/* Input */}
            <div className="p-6">
              <MessageInput
                onSend={handleSend}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-background text-secondary">
            <div className="w-24 h-24 bg-surface/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <MoreHorizontal size={40} className="text-secondary/50" />
            </div>
            <h3 className="text-xl font-serif font-medium text-primary mb-2">No Chat Selected</h3>
            <p className="text-sm font-light opacity-70">Select a conversation to start collaborating.</p>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <RightPanel
        isOpen={isRightPanelOpen && !!selectedConversation}
        onClose={() => setIsRightPanelOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tasks={tasks}
        onAddTask={handleAddTask}
      />

      {showCreateModal && (
        <UserSearchModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newConv) => {
            setConversations(prev => [newConv, ...prev]);
            handleSelectConversation(newConv);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}