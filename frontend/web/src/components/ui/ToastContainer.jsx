import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    return { toasts, showToast, removeToast: (id) => setToasts(prev => prev.filter(t => t.id !== id)) };
};

// Global instance for easy import if needed, but standard way is via Context or Store
// Here we'll just create a simple component that listens to a global event or store
import { useNotificationStore } from '../../stores/notificationStore';

export const ToastContainer = () => {
    const { notifications, removeNotification } = useNotificationStore();
    const [visibleToasts, setVisibleToasts] = useState([]);

    // We distinguish between persistent notifications (drawer) and transient toasts
    // For this implementation, we'll assume any notification with `isToast: true` shows here
    useEffect(() => {
        const toasts = notifications.filter(n => n.isToast);
        setVisibleToasts(toasts);
    }, [notifications]);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {visibleToasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md min-w-[280px] ${toast.type === 'error'
                                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                : 'bg-white/10 border-[#F8C3CD]/30 text-[#2D2A2A] dark:text-white'
                            }`}
                    >
                        {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} className="text-[#F8C3CD]" />}
                        <span className="flex-1 text-sm font-medium">{toast.message}</span>
                        <button
                            onClick={() => removeNotification(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
