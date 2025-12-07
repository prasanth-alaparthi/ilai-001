import React, { useState, useEffect } from 'react';
import { useUser } from '../state/UserContext';
import apiClient from '../services/apiClient';
import { FiUser, FiLock, FiBell, FiShield, FiHelpCircle, FiLogOut, FiActivity, FiSettings } from 'react-icons/fi';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900 border-l-2 transition-colors ${active ? 'border-black dark:border-white font-semibold text-slate-900 dark:text-white' : 'border-transparent text-slate-600 dark:text-slate-400'}`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </button>
);

const EditProfileForm = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        displayName: user.displayName || '',
        username: user.username || '',
        bio: user.bio || '',
        website: user.website || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || 'Prefer not to say',
        avatarUrl: user.avatarUrl || ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await apiClient.put('/users/profile', {
                userId: user.id, // In real app, token handles this
                ...formData
            });
            onUpdate(res.data);
            setMessage('Profile saved.');
        } catch (err) {
            console.error(err);
            setMessage('Failed to save profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
            <div className="flex items-center gap-6 mb-8">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                    <img src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                    <div className="font-semibold text-lg">{user.username}</div>
                    <button type="button" className="text-sm font-semibold text-blue-500 hover:text-blue-700">Change Profile Photo</button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
                <label className="font-semibold text-right col-span-1">Name</label>
                <div className="col-span-3">
                    <input
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent"
                        placeholder="Name"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Help people discover your account by using the name you're known by: either your full name, nickname, or business name.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
                <label className="font-semibold text-right col-span-1">Username</label>
                <div className="col-span-3">
                    <input
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent"
                        placeholder="Username"
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-start">
                <label className="font-semibold text-right col-span-1 mt-2">Bio</label>
                <div className="col-span-3">
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent"
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
                <label className="font-semibold text-right col-span-1">Website</label>
                <div className="col-span-3">
                    <input
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent"
                        placeholder="Website"
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
                <label className="font-semibold text-right col-span-1">Email</label>
                <div className="col-span-3">
                    <input
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
                <label className="font-semibold text-right col-span-1">Phone Number</label>
                <div className="col-span-3">
                    <input
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent"
                        placeholder="Phone Number"
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 items-center">
                <label className="font-semibold text-right col-span-1">Gender</label>
                <div className="col-span-3">
                    <input
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent"
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-8">
                <div className="col-span-1"></div>
                <div className="col-span-3 flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Submit'}
                    </button>
                    {message && <span className="text-sm text-green-600">{message}</span>}
                </div>
            </div>
        </form>
    );
};

export default function MyAccount() {
    const { user, setUser } = useUser();
    const [activeTab, setActiveTab] = useState('EDIT_PROFILE');

    if (!user) return <div className="p-10 text-center">Please log in.</div>;

    const handleUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    return (
        <div className="max-w-5xl mx-auto my-8 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl flex overflow-hidden min-h-[600px]">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FiSettings /> Settings
                    </h2>
                </div>
                <SidebarItem
                    icon={FiUser}
                    label="Edit Profile"
                    active={activeTab === 'EDIT_PROFILE'}
                    onClick={() => setActiveTab('EDIT_PROFILE')}
                />
                <SidebarItem
                    icon={FiActivity}
                    label="Your Activity"
                    active={activeTab === 'ACTIVITY'}
                    onClick={() => setActiveTab('ACTIVITY')}
                />
                <SidebarItem
                    icon={FiLock}
                    label="Change Password"
                    active={activeTab === 'CHANGE_PASSWORD'}
                    onClick={() => setActiveTab('CHANGE_PASSWORD')}
                />
                <SidebarItem
                    icon={FiBell}
                    label="Notifications"
                    active={activeTab === 'NOTIFICATIONS'}
                    onClick={() => setActiveTab('NOTIFICATIONS')}
                />
                <SidebarItem
                    icon={FiShield}
                    label="Privacy and Security"
                    active={activeTab === 'PRIVACY'}
                    onClick={() => setActiveTab('PRIVACY')}
                />
                <SidebarItem
                    icon={FiHelpCircle}
                    label="Help"
                    active={activeTab === 'HELP'}
                    onClick={() => setActiveTab('HELP')}
                />
                <div className="mt-auto border-t border-slate-200 dark:border-slate-800">
                    <SidebarItem
                        icon={FiLogOut}
                        label="Log Out"
                        active={false}
                        onClick={() => {
                            // Logout logic
                            window.location.href = '/login';
                        }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                {activeTab === 'EDIT_PROFILE' && <EditProfileForm user={user} onUpdate={handleUpdate} />}
                {activeTab === 'ACTIVITY' && (
                    <div className="max-w-xl">
                        <h2 className="text-2xl font-light mb-6">Your Activity</h2>
                        <div className="space-y-6">
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                                <h3 className="font-semibold mb-2">Login History</h3>
                                <p className="text-sm text-slate-500">View where you've logged in from.</p>
                            </div>
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                                <h3 className="font-semibold mb-2">Interactions</h3>
                                <p className="text-sm text-slate-500">Review likes, comments, and other interactions.</p>
                            </div>
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                                <h3 className="font-semibold mb-2">Account History</h3>
                                <p className="text-sm text-slate-500">See changes made to your account.</p>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'CHANGE_PASSWORD' && (
                    <div className="max-w-xl">
                        <h2 className="text-2xl font-light mb-6">Change Password</h2>
                        <p className="text-slate-500 mb-4">
                            For security reasons, password changes are handled via email reset links.
                        </p>
                        <button className="px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600">
                            Send Reset Link
                        </button>
                    </div>
                )}
                {activeTab === 'NOTIFICATIONS' && (
                    <div className="max-w-xl">
                        <h2 className="text-2xl font-light mb-6">Notifications</h2>
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
                    </div>
                )}
                {activeTab === 'PRIVACY' && (
                    <div className="max-w-xl">
                        <h2 className="text-2xl font-light mb-6">Privacy and Security</h2>
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
                    </div>
                )}
                {activeTab === 'HELP' && (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        This section is under construction.
                    </div>
                )}
            </div>
        </div>
    );
}
