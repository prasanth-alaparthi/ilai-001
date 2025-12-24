import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, Clock } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';

export const NotificationDrawer = () => {
    const { isDrawerOpen, setDrawerOpen, notifications, removeNotification, clearAll } = useNotificationStore();

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDrawerOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-l border-white/20 z-[70] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-rose-quartz/20 text-rose-quartz">
                                    <Bell size={20} />
                                </div>
                                <h2 className="text-xl font-bold font-serif">Notifications</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="p-2 text-secondary hover:text-red-400 transition-colors"
                                        title="Clear All"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="p-2 text-secondary hover:text-primary transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                                    <Clock size={48} strokeWidth={1} className="mb-4" />
                                    <p className="text-lg font-light">All quiet for now...</p>
                                    <p className="text-sm mt-1">Your recent alerts will appear here.</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <motion.div
                                        layout
                                        key={n.id}
                                        className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-rose-quartz/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-primary">{n.message}</p>
                                                <p className="text-[10px] text-secondary mt-1 font-mono">
                                                    {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeNotification(n.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-red-400 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-black/5 dark:border-white/10 text-center">
                            <p className="text-xs text-secondary/50 font-light italic">
                                Learning is a flow. Strive for focus.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
