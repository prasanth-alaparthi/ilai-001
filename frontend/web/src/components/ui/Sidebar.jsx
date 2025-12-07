// src/components/ui/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HomeIcon,
  SparklesIcon,
  BookOpenIcon,
  DocumentTextIcon,
  UserGroupIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  Bars3Icon,
  XMarkIcon,
  CheckBadgeIcon,
  UserIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../theme/ThemeProvider';
import { useUser } from '../../state/UserContext';

/**
 * Dynamic, friendly & trust-focused Sidebar
 * - kid-friendly colors and large touch targets
 * - trust badge + parental controls
 * - onboarding CTA and friendly microcopy
 * - responsive (desktop + mobile drawer)
 */

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
  { to: '/feed', label: 'Feed', icon: <SparklesIcon className="w-5 h-5" /> },
  { to: '/classroom', label: 'Classroom', icon: <AcademicCapIcon className="w-5 h-5" /> },
  { to: '/labs', label: 'Labs', icon: <BeakerIcon className="w-5 h-5" /> },
  { to: '/clubs', label: 'Clubs', icon: <UserGroupIcon className="w-5 h-5" /> },
  { to: '/notes', label: 'Notes', icon: <DocumentTextIcon className="w-5 h-5" /> },
  { to: '/library', label: 'Library', icon: <BookOpenIcon className="w-5 h-5" /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarIcon className="w-5 h-5" /> },
  { to: '/chat', label: 'Messages', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" /> },
  { to: '/account', label: 'My Account', icon: <UserIcon className="w-5 h-5" /> },
];

const logoUrl = '/ilai-logo-feminine-v2.png'; // Ilai logo path

function IconWrapper({ children }) {
  return (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 shadow-sm text-primary-600 dark:text-primary-400">
      {children}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [parentLocked, setParentLocked] = useState(false);

  const { user } = useUser();
  const isParent = user?.role === 'PARENT';
  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'INSTITUTION_ADMIN';

  // Filter nav items based on role
  let navItems = [];

  if (isAdmin) {
    // Admins see a restricted list + Admin Dashboard
    const allowedPaths = ['/calendar', '/chat', '/account', '/notes'];
    navItems = NAV_ITEMS.filter(item => allowedPaths.includes(item.to));
    navItems.unshift({ to: '/admin-dashboard', label: 'Admin', icon: <BuildingLibraryIcon className="w-5 h-5" /> });
  } else {
    // Everyone else sees standard items + role specific
    navItems = [...NAV_ITEMS];
    if (isParent) {
      navItems.push({ to: '/parent-dashboard', label: 'Parents', icon: <UsersIcon className="w-5 h-5" /> });
      navItems.push({ to: '/parent-settings', label: 'Parent Settings', icon: <UserGroupIcon className="w-5 h-5" /> });
    }
    if (isTeacher) {
      navItems.push({ to: '/teacher-dashboard', label: 'Teachers', icon: <AcademicCapIcon className="w-5 h-5" /> });
    }
  }

  useEffect(() => {
    // remember preferences in localStorage
    const p = localStorage.getItem('ui.parentLocked') === 'true';
    setParentLocked(p);
  }, []);

  useEffect(() => {
    localStorage.setItem('ui.parentLocked', String(parentLocked));
  }, [parentLocked]);

  // subtle color theme swap for kid mode vs normal
  const sidebarBg = 'bg-white/80 dark:bg-surface-900/80';

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden p-2">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="inline-flex items-center justify-center p-2 rounded-lg bg-white shadow text-primary-700"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 p-4 border-r ${sidebarBg} backdrop-blur-md ${collapsed ? 'w-20' : 'w-72'} min-h-full transition-all duration-300`}
        aria-label="Main sidebar"
      >
        {/* header: logo + name */}
        <div className={`flex items-center ${collapsed ? 'justify-center flex-col gap-4' : 'justify-between'} mb-4`}>
          <div className="flex items-center gap-3">
            <div className={`${collapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl overflow-hidden shadow-inner transition-all`}>
              <img src={logoUrl} alt="Ilai logo" className="object-cover w-full h-full" />
            </div>

            {!collapsed && (
              <div>
                <div className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Ilai</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Interactive Learning & AI</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!collapsed && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/60 text-xs text-slate-700 shadow-sm">
                <CheckBadgeIcon className="w-4 h-4 text-primary-600" />
                <span>Verified</span>
              </span>
            )}

            <button
              onClick={onToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-surface-800 dark:text-slate-300"
            >
              <ChevronLeftIcon className={`w-5 h-5 transform transition-transform ${collapsed ? 'rotate-180' : 'rotate-0'}`} />
            </button>
          </div>
        </div>

        {/* friendly trust microcopy for parents - ONLY FOR PARENTS */}
        {!collapsed && isParent && (
          <div className="mb-3 text-xs text-slate-600 dark:text-slate-400 rounded-md px-3 py-2 bg-white/70 dark:bg-surface-800/70">
            <strong className="block text-sm text-slate-800 dark:text-slate-200">Parents</strong>
            <div>Secure, moderated content.</div>
          </div>
        )}

        {/* nav items */}
        <nav className="flex-1 space-y-2" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 p-2 rounded-lg transition-all duration-150
                 ${isActive ? 'bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 text-primary-700 dark:text-primary-300 shadow-inner' : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-surface-800/60'}`
              }
              aria-label={item.label}
            >
              <IconWrapper>{item.icon}</IconWrapper>
              {!collapsed && (
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Quick access</div>
                </div>
              )}
              {/* small playful badge for kids */}
              {!collapsed && (
                <div className="ml-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs">Go</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* features row */}
        <div className="mt-4 space-y-3">
          {isParent && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-surface-800/60">
              <button
                onClick={() => setParentLocked(p => !p)}
                aria-pressed={parentLocked}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 shadow-sm"
              >
                <LockClosedIcon className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                {!collapsed && <span className="text-sm font-medium text-rose-700 dark:text-rose-300">{parentLocked ? 'Parent Lock: ON' : 'Parent Lock'}</span>}
              </button>

              {!collapsed && <div className="text-xs text-slate-500 dark:text-slate-400">Toggle for content & purchases</div>}
            </div>
          )}
        </div>

        {/* CTA / onboarding - ONLY FOR PARENTS */}
        {!collapsed && isParent && (
          <div className="mt-4 px-2">
            <div className="rounded-xl p-3 bg-gradient-to-r from-white to-secondary-50 dark:from-surface-800 dark:to-surface-800 border border-slate-100 dark:border-surface-700 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">New here?</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Take a 2-min tour with your child</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-onboarding'))}
                      className="px-3 py-1 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm transition-colors"
                    >
                      Start tour
                    </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('open-parent-info'))} className="px-3 py-1 rounded-md border border-slate-200 dark:border-surface-600 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors">
                      Parents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <motion.aside
              className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-surface-900 p-4 shadow-xl"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md overflow-hidden"><img src={logoUrl} alt="logo" className="w-full h-full object-cover" /></div>
                  <div className="font-semibold dark:text-slate-100">Doctrina</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-md dark:text-slate-300">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map(item => (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-surface-800'}`} onClick={() => setMobileOpen(false)}>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-surface-800 flex items-center justify-center">{item.icon}</div>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Quick</div>
                    </div>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}