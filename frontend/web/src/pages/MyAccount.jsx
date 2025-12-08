import React, { useState, useEffect } from 'react';
import { useUser } from '../state/UserContext';
import apiClient from '../services/apiClient';
import {
    User, Lock, Bell, Shield, CircleHelp as HelpCircle, LogOut, Activity, Settings, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, active, onClick, isDanger = false }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-6 py-4 text-left border-l-2 transition-all duration-300
        ${active
                ? 'border-accent-glow bg-white/5 text-primary font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                : 'border-transparent text-secondary hover:text-primary hover:bg-white/5'
            } ${isDanger ? 'hover:text-red-400' : ''}`}
    >
        <Icon size={18} className={active ? 'text-accent-glow' : ''} />
        <span className="text-sm tracking-wide">{label}</span>
    </button>
);

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-8">
        <h2 className="text-3xl font-serif text-primary mb-2">{title}</h2>
        {subtitle && <p className="text-secondary text-sm font-light">{subtitle}</p>}
    </div>
);

const InputField = ({ label, name, value, onChange, disabled, type = "text", helpText }) => (
    <div className="group">
        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full bg-surface-800/50 border border-white/10 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:border-accent-glow/50 focus:ring-1 focus:ring-accent-glow/50 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20'}`}
        />
        {helpText && <p className="text-xs text-secondary/60 mt-2 font-light">{helpText}</p>}
    </div>
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
    const [msgType, setMsgType] = useState(''); // 'success' or 'error'

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await apiClient.put('/users/profile', {
                userId: user.id,
                ...formData
            });
            onUpdate(res.data);
            setMessage('Profile updated successfully');
            setMsgType('success');
        } catch (err) {
            console.error(err);
            setMessage('Failed to update profile');
            setMsgType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
        >
            <SectionHeader title="Edit Profile" subtitle="Update your personal information and public profile." />

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-8 p-6 glass-panel rounded-2xl border border-black/5 dark:border-white/10">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/5 bg-surface-800">
                            <img src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}`} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={24} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-primary mb-1">{user.username}</h3>
                        <p className="text-xs text-secondary mb-4">Recommended dimensions: 400x400px</p>
                        <button type="button" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-primary text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                            Change Photo
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Display Name" name="displayName" value={formData.displayName} onChange={handleChange} helpText="The name displayed on your public profile." />
                    <InputField label="Username" name="username" value={formData.username} onChange={handleChange} />
                </div>

                <div className="group">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Bio</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="4"
                        className="w-full bg-surface-800/50 border border-white/10 rounded-xl px-4 py-3 text-primary text-sm focus:outline-none focus:border-accent-glow/50 focus:ring-1 focus:ring-accent-glow/50 transition-all hover:border-white/20 resize-none"
                    />
                    <p className="text-xs text-secondary/60 mt-2 font-light">Brief description for your profile.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Website" name="website" value={formData.website} onChange={handleChange} />
                    <InputField label="Gender" name="gender" value={formData.gender} onChange={handleChange} />
                </div>

                <div className="pt-6 border-t border-white/10">
                    <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2"><Lock size={14} /> Private Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Email Address" name="email" value={formData.email} disabled={true} helpText="Contact support to change email." />
                        <InputField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    {message && (
                        <span className={`text-sm font-medium ${msgType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {message}
                        </span>
                    )}
                </div>
            </form>
        </motion.div>
    );
};

export default function MyAccount() {
    const { user, setUser } = useUser();
    const [activeTab, setActiveTab] = useState('EDIT_PROFILE');

    if (!user) return <div className="h-screen flex items-center justify-center text-secondary">Please log in to view account settings.</div>;

    const handleUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    return (
        <div className="min-h-screen bg-background text-primary p-6 md:p-12">
            <div className="max-w-6xl mx-auto glass-card rounded-3xl overflow-hidden flex min-h-[700px] border border-black/5 dark:border-white/10 shadow-2xl">

                {/* Sidebar */}
                <div className="w-72 bg-surface-900/30 backdrop-blur-xl border-r border-black/5 dark:border-white/10 flex flex-col">
                    <div className="p-8 border-b border-black/5 dark:border-white/10">
                        <h2 className="text-xl font-serif font-bold flex items-center gap-3">
                            <Settings className="text-accent-glow" size={20} />
                            <span>Settings</span>
                        </h2>
                    </div>
                    <div className="py-4">
                        <SidebarItem icon={User} label="Edit Profile" active={activeTab === 'EDIT_PROFILE'} onClick={() => setActiveTab('EDIT_PROFILE')} />
                        <SidebarItem icon={Activity} label="Your Activity" active={activeTab === 'ACTIVITY'} onClick={() => setActiveTab('ACTIVITY')} />
                        <SidebarItem icon={Lock} label="Change Password" active={activeTab === 'CHANGE_PASSWORD'} onClick={() => setActiveTab('CHANGE_PASSWORD')} />
                        <SidebarItem icon={Bell} label="Notifications" active={activeTab === 'NOTIFICATIONS'} onClick={() => setActiveTab('NOTIFICATIONS')} />
                        <SidebarItem icon={Shield} label="Privacy & Security" active={activeTab === 'PRIVACY'} onClick={() => setActiveTab('PRIVACY')} />
                        <SidebarItem icon={HelpCircle} label="Help & Support" active={activeTab === 'HELP'} onClick={() => setActiveTab('HELP')} />
                    </div>
                    <div className="mt-auto p-4 border-t border-black/5 dark:border-white/10">
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full flex items-center gap-3 px-4 py-3 text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Log Out</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-surface-900/10 backdrop-blur-sm p-10 md:p-16 overflow-y-auto">
                    {activeTab === 'EDIT_PROFILE' && <EditProfileForm user={user} onUpdate={handleUpdate} />}

                    {activeTab === 'ACTIVITY' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <SectionHeader title="Your Activity" subtitle="Review your login history and interactions." />
                            <div className="grid gap-4">
                                {['Login History', 'Interactions', 'Account Changes'].map((item, i) => (
                                    <div key={i} className="p-6 glass-panel rounded-xl border border-black/5 dark:border-white/10 hover:border-accent-glow/30 transition-colors cursor-pointer group">
                                        <h3 className="font-medium group-hover:text-accent-glow transition-colors">{item}</h3>
                                        <p className="text-sm text-secondary mt-1">View details regarding your {item.toLowerCase()}.</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'CHANGE_PASSWORD' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
                            <SectionHeader title="Change Password" subtitle="Manage your password and security settings." />
                            <div className="p-8 glass-panel rounded-2xl text-center border border-black/5 dark:border-white/10">
                                <Lock size={48} className="mx-auto text-accent-glow mb-4" />
                                <h3 className="text-lg font-medium mb-2">Secure Password Change</h3>
                                <p className="text-secondary text-sm mb-6">For enhanced security, we handle password resets via email verification.</p>
                                <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium">
                                    Send Reset Link
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'NOTIFICATIONS' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
                            <SectionHeader title="Notifications" subtitle="Choose how you want to be notified." />
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 glass-panel rounded-xl border border-black/5 dark:border-white/10">
                                    <div>
                                        <h3 className="font-medium">Pause All</h3>
                                        <p className="text-xs text-secondary mt-1">Temporarily pause notifications for 8 hours.</p>
                                    </div>
                                    <div className="w-12 h-6 bg-surface-800 rounded-full relative cursor-pointer border border-white/10">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-secondary rounded-full"></div>
                                    </div>
                                </div>
                                {/* More placeholders styled similarly */}
                            </div>
                        </motion.div>
                    )}

                    {/* Other tabs can be added similarly with the new glass-panel style */}
                    {['PRIVACY', 'HELP'].includes(activeTab) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center opacity-50">
                            <Settings size={48} className="mb-4" />
                            <p className="text-lg">This section is coming soon.</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
