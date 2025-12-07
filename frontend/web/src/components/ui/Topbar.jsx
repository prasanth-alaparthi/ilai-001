import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon, MagnifyingGlassIcon, UserCircleIcon, ChatBubbleLeftRightIcon, SunIcon, MoonIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import apiClient from '../../services/apiClient';
import { useUser } from '../../state/UserContext';
import { useTheme } from '../theme/ThemeProvider';

export default function Topbar({ isVisible }) {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { isDarkMode, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={`w-full bg-white/70 dark:bg-surface-900/70 backdrop-blur border-b dark:border-surface-800 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-100'}`}>
      <div className="max-w-[1400px] mx-auto flex items-center justify-between p-3">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <button className="md:hidden inline-flex items-center p-2 rounded-md bg-white/60 dark:bg-surface-800/60 shadow" onClick={() => window.dispatchEvent(new CustomEvent('open-mobile-menu'))}>
            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          <Link to="/home" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
              <img src="/ilai-logo-feminine-v2.png" alt="Ilai Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden md:block">
              <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">Ilai</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">Interactive Learning & AI</div>
            </div>
          </Link>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 flex-1 justify-center px-4">
          <div className="max-w-xl w-full flex items-center gap-3">
            <label className="relative text-gray-400 block flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
              </div>
              <input
                placeholder="Search books, videos, notes..."
                className="w-full pl-10 pr-10 py-2 rounded-full border dark:border-surface-700 bg-white/60 dark:bg-surface-800/60 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none dark:text-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/feed?view=explore&q=${encodeURIComponent(searchTerm)}`);
                  }
                }}
              />
            </label>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-chat-drawer'))}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-800 flex items-center gap-1 transition-colors"
              title="Chat"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-800 flex items-center gap-1 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-amber-500" />
              ) : (
                <MoonIcon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <button
              onClick={toggleFullScreen}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-800 flex items-center gap-1 transition-colors"
              title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full bg-white dark:bg-surface-800 shadow hover:shadow-md transition-all">
            <BellIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </button>

          <button onClick={() => navigate('/account')} className="inline-flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors">
            <UserCircleIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <span className="hidden md:block text-sm font-medium dark:text-slate-200 pr-2">{user?.username || 'Me'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}