
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BookOpenIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

export default function MobileBottomNav() {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur shadow-lg rounded-2xl px-3 py-2 flex justify-around items-center">
        <NavLink to="/home" className={({isActive}) => `flex flex-col items-center text-xs ${isActive ? 'text-indigo-600' : 'text-slate-600'}`}>
          <HomeIcon className="w-6 h-6" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/library" className={({isActive}) => `flex flex-col items-center text-xs ${isActive ? 'text-indigo-600' : 'text-slate-600'}`}>
          <BookOpenIcon className="w-6 h-6" />
          <span>Library</span>
        </NavLink>

        <NavLink to="/feed" className={({isActive}) => `flex flex-col items-center text-xs ${isActive ? 'text-indigo-600' : 'text-slate-600'}`}>
          <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
          <span>Feed</span>
        </NavLink>
      </div>
    </div>
  );
}