import React, { useState } from 'react';
import { FileText, Bookmark, Users, Info } from 'lucide-react';

/**
 * ProfileTabs - Tabs for profile content (Posts, Saved, About)
 */
const ProfileTabs = ({
    tabs = ['posts', 'saved', 'groups', 'about'],
    activeTab,
    onTabChange,
    counts = {}
}) => {
    const tabConfig = {
        posts: { label: 'Posts', icon: FileText },
        saved: { label: 'Saved', icon: Bookmark },
        groups: { label: 'Groups', icon: Users },
        about: { label: 'About', icon: Info }
    };

    return (
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
            {tabs.map(tab => {
                const config = tabConfig[tab];
                const Icon = config.icon;
                const count = counts[tab];

                return (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === tab
                                ? 'bg-purple-500 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {config.label}
                        {count !== undefined && count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20' : 'bg-white/10'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ProfileTabs;
