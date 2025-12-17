import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Users, Link, Copy, Check, Mail } from 'lucide-react';

/**
 * ShareModal - Share notebooks, sections, or notes with users
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onShare - (targetUsername, permissionLevel, message) => void
 * @param {function} props.onGenerateLink - () => Promise<{url: string}>
 * @param {string} props.resourceType - 'NOTE' | 'SECTION' | 'NOTEBOOK'
 * @param {string} props.resourceTitle - Title of the resource being shared
 */
export default function ShareNoteModal({
    isOpen,
    onClose,
    onShare,
    onGenerateLink,
    resourceType = 'NOTE',
    resourceTitle = 'Untitled'
}) {
    const [username, setUsername] = useState('');
    const [permissionLevel, setPermissionLevel] = useState('VIEWER');
    const [message, setMessage] = useState('');
    const [shareLink, setShareLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const resourceLabel = resourceType === 'NOTEBOOK' ? 'Notebook' :
        resourceType === 'SECTION' ? 'Section' : 'Note';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError('');

        try {
            await onShare(username.trim(), permissionLevel, message);
            setSuccess(`Shared with ${username} successfully!`);
            setUsername('');
            setMessage('');
            setTimeout(() => { setSuccess(''); onClose(); }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to share');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        if (!onGenerateLink) return;
        setLoading(true);
        try {
            const result = await onGenerateLink();
            setShareLink(result.url);
        } catch (err) {
            setError('Failed to generate link');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-blue-500" />
                            Share {resourceLabel}
                        </h3>
                        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Resource Info */}
                    <div className="px-5 pt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sharing: <span className="font-medium text-gray-900 dark:text-white">{resourceTitle}</span>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Username Input */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Users className="w-4 h-4" />
                                Share with user
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username or email"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                autoFocus
                            />
                        </div>

                        {/* Permission Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Permission Level
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPermissionLevel('VIEWER')}
                                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${permissionLevel === 'VIEWER'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                        }`}
                                >
                                    👁️ Viewer
                                    <p className="text-xs font-normal mt-0.5 opacity-70">Can view only</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPermissionLevel('EDITOR')}
                                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${permissionLevel === 'EDITOR'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                        }`}
                                >
                                    ✏️ Editor
                                    <p className="text-xs font-normal mt-0.5 opacity-70">Can edit</p>
                                </button>
                            </div>
                        </div>

                        {/* Optional Message */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Mail className="w-4 h-4" />
                                Message (optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Add a message..."
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        {/* Error/Success Messages */}
                        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
                        {success && <p className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">{success}</p>}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!username.trim() || loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sharing...' : <><Share2 className="w-4 h-4" /> Share {resourceLabel}</>}
                        </button>
                    </form>

                    {/* Link Sharing Section */}
                    {onGenerateLink && (
                        <div className="px-5 pb-5 pt-2 border-t border-gray-200 dark:border-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Or share via link:</p>
                            {shareLink ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={shareLink}
                                        readOnly
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {linkCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerateLink}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Link className="w-4 h-4" />
                                    Generate shareable link
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

