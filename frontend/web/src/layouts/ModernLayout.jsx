import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import BottomNav from '../components/mobile/BottomNav';
import { useTheme } from '../state/ThemeContext';
import { useUser } from '../state/UserContext';
import { useSearchStore } from '../stores/searchStore';
import { useNotificationStore } from '../stores/notificationStore';
import { ToastContainer } from '../components/ui/ToastContainer';
import { NotificationDrawer } from '../components/ui/NotificationDrawer';
import {
    Home,
    BookOpen,
    Hash,
    Calendar,
    PenTool,
    Settings,
    LogOut,
    ChevronRight,
    Menu,
    X,
    Beaker,
    Users,
    GraduationCap,
    LayoutGrid,
    MessageCircle,
    Bell,
    Search,
    Sun,
    Moon,
    User,
    Sparkles,
    Trophy
} from 'lucide-react';
import TextSelectionPopup from '../components/TextSelectionPopup';

const Navigation = ({ isMobileOpen, setIsMobileOpen }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();
    const { user } = useUser();
    const { canAccess, getRequiredTier } = useFeatureAccess();

    const navItems = [
        { icon: Home, label: 'Home', path: '/home' },
        { icon: PenTool, label: 'Notes', path: '/notes' },
        { icon: Sparkles, label: 'NeuroFeed', path: '/social' },
        { icon: Trophy, label: 'Bounties', path: '/bounties' },
        { icon: User, label: 'Profile', path: '/social/profile' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: BookOpen, label: 'Journal', path: '/journal' },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
        { icon: MessageCircle, label: 'Chat', path: '/chat' },
        { icon: Beaker, label: 'Labs', path: '/labs', feature: 'quantum_lab' },
        { icon: GraduationCap, label: 'Classroom', path: '/classroom', feature: 'classroom' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <motion.nav
                initial={{ width: '80px' }}
                animate={{
                    width: isExpanded ? '240px' : '80px',
                }}
                className={`fixed left-0 top-0 h-screen bg-surface border-r border-border z-50 flex flex-col justify-between py-8 backdrop-blur-md bg-opacity-95 md:flex ${isMobileOpen ? 'flex' : 'hidden md:flex'}`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className="flex flex-col gap-2 flex-1 min-h-0">
                    {/* Logo / Brand */}
                    <div className={`px-6 mb-8 flex items-center ${isExpanded || isMobileOpen ? 'justify-between' : 'justify-center'} overwrite-transition duration-200 flex-shrink-0`}>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-blue to-accent-green flex-shrink-0" />
                            {(isExpanded || isMobileOpen) && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="ml-4 font-serif text-xl font-medium tracking-wide"
                                >
                                    Ilai
                                </motion.span>
                            )}
                        </div>
                        {isExpanded && isMobileOpen && (
                            <button onClick={() => setIsMobileOpen(false)} className="md:hidden">
                                <X size={20} className="text-secondary" />
                            </button>
                        )}
                        {/* Always show close button on mobile regardless of expanded state */}
                        {isMobileOpen && !isExpanded && (
                            <button onClick={() => setIsMobileOpen(false)} className="md:hidden absolute right-6">
                                <X size={20} className="text-secondary" />
                            </button>
                        )}
                    </div>

                    {/* Links - Scrollable Area */}
                    <div className="flex flex-col w-full overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`relative flex items-center h-12 px-6 py-2 mx-3 rounded-lg transition-all duration-300 group flex-shrink-0 ${isActive ? 'bg-white/5 text-primary' : 'text-secondary hover:text-primary hover:bg-white/5'
                                        }`}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05, filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))" }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex w-full items-center"
                                    >
                                        <item.icon size={20} strokeWidth={1.5} className="flex-shrink-0" />

                                        {(isExpanded || isMobileOpen) && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="ml-4 text-sm font-light tracking-wide whitespace-nowrap flex items-center gap-2"
                                            >
                                                {item.label}
                                                {item.feature && !canAccess(item.feature) && (
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${getRequiredTier(item.feature) === 'INSTITUTIONAL'
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'bg-amber-500/20 text-amber-400'
                                                        }`}>
                                                        {getRequiredTier(item.feature) === 'INSTITUTIONAL' ? 'INST' : 'PRO'}
                                                    </span>
                                                )}
                                            </motion.span>
                                        )}
                                    </motion.div>

                                    {/* Active Indicator */}
                                    {isActive && !isExpanded && !isMobileOpen && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute right-2 w-1.5 h-1.5 rounded-full bg-accent-glow shadow-[0_0_8px_rgba(74,144,226,0.5)]"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Footer / Profile - Fixed at bottom */}
                <div className="px-6 space-y-4 pb-4 flex-shrink-0 mt-auto border-t border-border/10 pt-4">
                    <Link to="/settings" className="flex items-center group">
                        <Settings size={20} className="text-secondary group-hover:text-primary transition-colors" />
                        {(isExpanded || isMobileOpen) && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="ml-4 text-sm text-secondary group-hover:text-primary transition-colors"
                            >
                                Settings
                            </motion.span>
                        )}
                    </Link>
                </button>
                <motion.button
                    whileHover={{ scale: 1.05, color: '#F87171' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        try {
                            localStorage.removeItem("accessToken");
                            localStorage.removeItem("refreshToken");
                            window.location.href = "/login";
                        } catch (error) {
                            console.error("Logout failed", error);
                        }
                    }}
                    className="flex items-center group w-full text-left"
                >
                    <LogOut size={20} className="text-secondary group-hover:text-red-400 transition-colors" />
                    {(isExpanded || isMobileOpen) && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-4 text-sm text-secondary group-hover:text-red-400 transition-colors"
                        >
                            Logout
                        </motion.span>
                    )}
                </motion.button>
            </div>
        </motion.nav >
        </>
    );
};

const TopBar = ({ onMenuClick }) => {
    const { user } = useUser();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/50">
            <div className="flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="md:hidden text-secondary hover:text-primary">
                        <Menu size={24} />
                    </button>
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                        <input
                            type="text"
                            value={useSearchStore.getState().query}
                            onChange={(e) => useSearchStore.getState().setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    window.location.href = `/search?q=${e.target.value}`;
                                }
                            }}
                            placeholder="Search..."
                            className="bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-primary focus:outline-none focus:border-accent-glow/50 transition-all w-64 placeholder:text-secondary/50"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <Link to="/chat" className="relative text-secondary hover:text-primary transition-colors">
                        <MessageCircle size={20} />
                    </Link>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => useNotificationStore.getState().toggleDrawer()}
                        className="relative text-secondary hover:text-primary transition-colors"
                    >
                        <Bell size={20} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
                    </motion.button>


                    <div className="h-6 w-[1px] bg-white/10 mx-2 hidden md:block" />

                    <Link to={`/profile/${user?.username}`} className="flex items-center gap-3 group">
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-medium text-primary group-hover:text-accent-glow transition-colors">{user?.displayName || user?.username || 'Guest'}</div>
                            <div className="text-xs text-secondary">Student</div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent-blue to-accent-green p-[2px]">
                            <img
                                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover border border-background"
                            />
                        </div>
                    </Link>
                </div>
            </div>
        </header >
    );
}

const ModernLayout = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    // Pages that should be full height/width without standard padding (App-like feel)
    const isAppPage = ['/chat', '/live', '/notes'].some(path => location.pathname.startsWith(path));
    // Labs has its own internal scrolling so we handle it separately
    const isLabsPage = location.pathname.startsWith('/labs');

    return (
        <div className="h-screen bg-background text-primary flex selection:bg-accent-blue selection:text-white overflow-hidden">
            {/* Desktop Sidebar - Hidden on mobile */}
            <Navigation isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-[80px] w-full md:w-[calc(100%-80px)] h-full relative flex flex-col overflow-hidden">
                <TopBar onMenuClick={() => setIsMobileOpen(true)} />

                {/* Content with bottom padding for mobile nav */}
                <div className={`flex-1 w-full relative pb-20 md:pb-0 ${isAppPage ? 'overflow-hidden p-0 pb-20 md:pb-0' :
                    isLabsPage ? 'overflow-y-auto p-0 pb-20 md:pb-0' :
                        'overflow-y-auto p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto'
                    }`}>
                    <AnimatePresence mode="wait">
                        <PageWrapper>
                            <Outlet />
                        </PageWrapper>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav />

            {/* Global Text Selection Popup */}
            <TextSelectionPopup />

            {/* Notification Drawer */}
            <NotificationDrawer />
        </div>
    );
};

const PageWrapper = ({ children }) => {
    const location = useLocation();

    return (
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};

export default ModernLayout;
