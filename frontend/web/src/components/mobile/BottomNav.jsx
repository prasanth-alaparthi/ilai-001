import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home,
    PenTool,
    Plus,
    MessageCircle,
    User
} from 'lucide-react';

/**
 * Mobile Bottom Navigation - Instagram/WhatsApp style
 * Shows on screens < 768px (md breakpoint)
 */
const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Home', path: '/home' },
        { icon: PenTool, label: 'Notes', path: '/notes' },
        { icon: Plus, label: 'Create', path: '/create', isCenter: true },
        { icon: MessageCircle, label: 'Chat', path: '/chat' },
        { icon: User, label: 'Profile', path: '/social/profile' },
    ];

    const isActive = (path) => {
        if (path === '/create') return false;
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Backdrop blur effect */}
            <div className="absolute inset-0 bg-surface/90 backdrop-blur-xl border-t border-border/50" />

            {/* Safe area padding for iOS */}
            <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
                {navItems.map((item) => {
                    const active = isActive(item.path);

                    // Center FAB button
                    if (item.isCenter) {
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative -mt-6"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-accent-blue to-accent-green flex items-center justify-center shadow-lg shadow-accent-blue/30"
                                >
                                    <Plus size={28} className="text-white" strokeWidth={2} />
                                </motion.div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-center py-2 px-4 min-w-[64px]"
                        >
                            <motion.div
                                whileHover={{ scale: 1.1, color: "var(--accent-glow)" }}
                                whileTap={{ scale: 0.9 }}
                                className="relative"
                            >
                                <item.icon
                                    size={24}
                                    className={`transition-colors duration-200 ${active ? 'text-accent-glow' : 'text-secondary'
                                        }`}
                                    strokeWidth={active ? 2 : 1.5}
                                />
                                {active && (
                                    <motion.div
                                        layoutId="bottomnav-indicator"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-glow"
                                    />
                                )}
                            </motion.div>
                            <span
                                className={`text-[10px] mt-1 transition-colors duration-200 ${active ? 'text-accent-glow font-medium' : 'text-secondary'
                                    }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
