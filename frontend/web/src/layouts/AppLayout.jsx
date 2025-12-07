// src/layouts/AppLayout.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from '../components/ui/Sidebar';
import Topbar from '../components/ui/Topbar';
import MobileBottomNav from '../components/ui/MobileBottomNav';

import OnboardingModal from '../components/modals/OnboardingModal';
import ParentInfoModal from '../components/modals/ParentInfoModal';
import GlobalChatDrawer from '../components/chat/GlobalChatDrawer';

/**
 * AppLayout
 * - Renders Topbar, Sidebar, main content via <Outlet />, and MobileBottomNav
 * - Listens for window events to open onboarding & parent-info modals
 * - Simple example for wiring new-note event
 */
export default function AppLayout() {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showParentInfo, setShowParentInfo] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [topbarVisible, setTopbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const topbarHeight = 64; // Assuming a fixed topbar height (e.g., h-16 in Tailwind)


  useEffect(() => {
    const openOnboarding = () => setShowOnboarding(true);
    const openParentInfo = () => setShowParentInfo(true);
    const toggleChatDrawer = () => setShowChatDrawer(prev => !prev);
    const openNewNote = () => {
      // Example: emit a global event other components can listen to
      window.dispatchEvent(new CustomEvent('open-new-note-modal'));
    };

    window.addEventListener('open-onboarding', openOnboarding);
    window.addEventListener('open-parent-info', openParentInfo);
    window.addEventListener('toggle-chat-drawer', toggleChatDrawer);
    window.addEventListener('open-new-note', openNewNote);

    const storedCollapsed = localStorage.getItem('ui.collapsed') === 'true';
    setSidebarCollapsed(storedCollapsed);

    // Scroll handling for topbar
    const handleScroll = () => {
      // Debounce/throttle can be added here if needed, but for simplicity, let's keep it direct for now.
      if (window.scrollY > lastScrollY.current && window.scrollY > topbarHeight) {
        // Scrolling down and past the topbar height
        setTopbarVisible(false);
      } else if (window.scrollY < lastScrollY.current) {
        // Scrolling up
        setTopbarVisible(true);
      }
      lastScrollY.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('open-onboarding', openOnboarding);
      window.removeEventListener('open-parent-info', openParentInfo);
      window.removeEventListener('toggle-chat-drawer', toggleChatDrawer);
      window.removeEventListener('open-new-note', openNewNote);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('ui.collapsed', String(newState));
      return newState;
    });
  };

  return (
    <div
      className="h-screen flex overflow-hidden bg-gradient-to-b from-white via-sky-50 to-white dark:from-surface-900 dark:via-surface-900 dark:to-surface-900 text-gray-900 dark:text-surface-100 transition-colors duration-300"
      style={{ '--sidebar-width': sidebarCollapsed ? '5rem' : '18rem' }}
    >
      {/* Sidebar - Fixed width, full height, scrollable */}
      <aside className="hidden md:flex flex-col h-full overflow-y-auto border-r border-gray-100 dark:border-surface-800 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 bg-white/50 dark:bg-surface-900/50 backdrop-blur-xl transition-colors duration-300">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </aside>

      {/* Main Content - Flex 1, full height, scrollable */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar isVisible={topbarVisible} />

        <main className="flex-1 overflow-y-auto p-0 scroll-smooth relative">
          {/* Fade effect overlay on the left edge for smooth visual transition */}
          <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-r from-white/40 to-transparent dark:from-surface-900/40 z-10" />

          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {!location.pathname.startsWith('/feed') && <MobileBottomNav />}

      {/* Modals */}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      {showParentInfo && <ParentInfoModal onClose={() => setShowParentInfo(false)} />}

      <GlobalChatDrawer isOpen={showChatDrawer} onClose={() => setShowChatDrawer(false)} />
    </div>
  );
}