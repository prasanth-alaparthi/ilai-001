import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../state/UserContext';
import { useTheme } from '../../state/ThemeContext';
import {
    ArrowLeft,
    Search,
    Bell,
    Sun,
    Moon,
    X,
    MoreVertical
} from 'lucide-react';

/**
 * Mobile-optimized header component
 * Shows back button when in nested pages
 */
const MobileHeader = ({
    title,
    showBack = false,
    showSearch = true,
    rightAction = null
}) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { theme, toggleTheme } = useTheme();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-border/50 md:hidden">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left Section */}
                <div className="flex items-center gap-3">
                    {showBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-secondary hover:text-primary rounded-full hover:bg-white/5"
                        >
                            <ArrowLeft size={22} />
                        </button>
                    )}

                    {!isSearchOpen && (
                        <h1 className="text-lg font-medium text-primary truncate max-w-[180px]">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Search Overlay */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '100%' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="absolute left-0 right-0 top-0 h-14 bg-surface flex items-center px-4"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    autoFocus
                                    className="w-full bg-white/5 border border-border rounded-full pl-10 pr-4 py-2 text-primary focus:outline-none focus:border-accent-glow/50"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                }}
                                className="ml-3 p-2 text-secondary hover:text-primary"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Right Section */}
                {!isSearchOpen && (
                    <div className="flex items-center gap-2">
                        {showSearch && (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2 text-secondary hover:text-primary rounded-full hover:bg-white/5"
                            >
                                <Search size={20} />
                            </button>
                        )}

                        <button
                            onClick={toggleTheme}
                            className="p-2 text-secondary hover:text-primary rounded-full hover:bg-white/5"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button className="relative p-2 text-secondary hover:text-primary rounded-full hover:bg-white/5">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {rightAction && (
                            <button className="p-2 text-secondary hover:text-primary rounded-full hover:bg-white/5">
                                <MoreVertical size={20} />
                            </button>
                        )}

                        {/* Profile Avatar */}
                        <Link to={`/profile/${user?.username}`}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-blue to-accent-green p-[2px]">
                                <img
                                    src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=random`}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
};

export default MobileHeader;
