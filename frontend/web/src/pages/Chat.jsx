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
  FiSidebar, FiCheckSquare, FiCalendar, FiFile, FiMoreHorizontal,
  FiPhone, FiVideo, FiSearch, FiPlus, FiX, FiClock, FiCpu, FiUsers, FiHash
} from "react-icons/fi";

// --- Right Panel Components ---

const TaskItem = ({ task }) => (
  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm mb-2 flex items-start gap-3 group">
    <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-500'}`}>
      {task.completed && <FiCheckSquare size={10} className="text-white" />}
    </div>
    <div className="flex-1">
      <div className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</div>
      {task.dueDate && (
        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <FiClock size={10} /> {task.dueDate}
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
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('TASKS')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'TASKS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FiCheckSquare /> Tasks
            </button>
            <button
              onClick={() => setActiveTab('SCHEDULE')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'SCHEDULE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FiCalendar /> Schedule
            </button>
            <button
              onClick={() => setActiveTab('FILES')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'FILES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FiFile /> Files
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            {activeTab === 'TASKS' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">To-Do List</h3>
                  <button onClick={onAddTask} className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200">
                    <FiPlus size={16} />
                  </button>
                </div>
                {tasks.map(t => <TaskItem key={t.id} task={t} />)}
                {tasks.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No tasks yet. <br /> Create one from a message!
                  </div>
                )}
              </>
            )}

            {activeTab === 'SCHEDULE' && (
              <div className="text-center py-10 text-slate-400 text-sm">
                <FiCalendar size={32} className="mx-auto mb-3 opacity-50" />
                No upcoming events.
              </div>
            )}

            {activeTab === 'FILES' && (
              <div className="text-center py-10 text-slate-400 text-sm">
                <FiFile size={32} className="mx-auto mb-3 opacity-50" />
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
    if (!stompClient || !stompClient.connected || !selectedConversation) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = stompClient.subscribe(
      `/topic/conversation/${selectedConversation.id}`,
      (message) => {
        const newMsg = JSON.parse(message.body);
        setMessages((prev) => [newMsg, ...prev]);
      }
    );

    return () => {
      if (subscriptionRef.current) {
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
      case 'AI': return <FiCpu />;
      case 'GROUP': return <FiUsers />;
      default: return conv.contextType !== 'GENERAL' ? <FiHash /> : null;
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-black overflow-hidden font-sans">
      {/* Left Sidebar */}
      <div className="w-80 h-full flex-shrink-0 border-r border-slate-200 dark:border-slate-800">
        <ChatSidebar
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          onNewChat={() => setShowCreateModal(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedConversation.type === 'AI'
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                  }`}>
                  {getConversationIcon(selectedConversation) || selectedConversation.name?.[0] || '#'}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {selectedConversation.name || (selectedConversation.type === 'AI' ? 'AI Assistant' : 'Chat')}
                    {selectedConversation.contextType !== 'GENERAL' && (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                        {selectedConversation.contextType}
                      </span>
                    )}
                  </h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedConversation.participantIds?.length || 1} members
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <FiPhone size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <FiVideo size={18} />
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                  className={`p-2 rounded-full transition-colors ${isRightPanelOpen ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <FiSidebar size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              meUserId={userId}
              onReply={setReplyingTo}
              onAction={handleMessageAction}
            />

            {/* Input */}
            <MessageInput
              onSend={handleSend}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FiMoreHorizontal size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">No Chat Selected</h3>
            <p className="text-sm">Select a conversation to start collaborating.</p>
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