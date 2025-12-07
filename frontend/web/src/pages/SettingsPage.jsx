import React, { useState, useEffect } from 'react';
import { useUser } from '../state/UserContext';
import apiClient from '../services/apiClient';
import { FiLock, FiBell, FiEye, FiShield, FiHelpCircle } from 'react-icons/fi';

export default function SettingsPage() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('privacy');

    const tabs = [
        { id: 'privacy', label: 'Privacy', icon: <FiLock /> },
        { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
        { id: 'security', label: 'Security', icon: <FiShield /> },
        { id: 'help', label: 'Help', icon: <FiHelpCircle /> },
    ];

    return (
        <div className="flex min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-200 dark:border-slate-800 p-6 hidden md:block">
                <h2 className="text-xl font-bold mb-6">Settings</h2>
                <div className="space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 max-w-2xl">
                <h1 className="text-2xl font-bold mb-8 capitalize">{activeTab}</h1>

                {activeTab === 'privacy' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Private Account</h3>
                                <p className="text-sm text-slate-500">Only people you approve can see your photos and videos.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Activity Status</h3>
                                <p className="text-sm text-slate-500">Allow accounts you follow to see when you were last active.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Pause All</h3>
                                <p className="text-sm text-slate-500">Temporarily pause all notifications.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Post Interactions</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Likes</span>
                                    <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-md text-sm p-2">
                                        <option>From everyone</option>
                                        <option>From people I follow</option>
                                        <option>Off</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Comments</span>
                                    <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-md text-sm p-2">
                                        <option>From everyone</option>
                                        <option>From people I follow</option>
                                        <option>Off</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Other tabs placeholders */}
                {(activeTab === 'security' || activeTab === 'help') && (
                    <div className="text-center py-10 text-slate-500">
                        <p>This section is under construction.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
