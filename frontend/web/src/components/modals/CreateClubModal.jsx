import React, { useState } from 'react';
import { X, Plus, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClub, CLUB_CATEGORIES } from '../../services/clubService';

const CreateClubModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'ACADEMIC',
        imageUrl: '',
        isPrivate: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Club name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const club = await createClub(formData);
            onSuccess?.(club);
            onClose();
            setFormData({
                name: '',
                description: '',
                category: 'ACADEMIC',
                imageUrl: '',
                isPrivate: false,
            });
        } catch (err) {
            console.error('Create club error:', err);
            const status = err.response?.status;
            if (status === 401) {
                setError('You must be logged in to create a club. Please refresh and login again.');
            } else if (status === 403) {
                setError('You do not have permission to create clubs.');
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to create club. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-background border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col my-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-primary">Create New Club</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-secondary hover:text-primary hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Club Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter club name..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-glow/50 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="What's your club about?"
                                rows={3}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-glow/50 focus:border-transparent transition-all resize-none"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Category
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {CLUB_CATEGORIES.map((cat) => (
                                    <button
                                        type="button"
                                        key={cat.id}
                                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${formData.category === cat.id
                                            ? 'bg-accent-glow/20 border-accent-glow text-primary'
                                            : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-xl">{cat.icon}</span>
                                        <span className="text-sm font-medium">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image URL */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Cover Image URL
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <input
                                        type="url"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-glow/50 focus:border-transparent transition-all"
                                    />
                                </div>
                                {formData.imageUrl && (
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="w-12 h-12 rounded-lg object-cover"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Private Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isPrivate"
                                name="isPrivate"
                                checked={formData.isPrivate}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-accent-glow focus:ring-accent-glow/50"
                            />
                            <label htmlFor="isPrivate" className="text-sm text-secondary">
                                Make this club private (invite only)
                            </label>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-white/10 text-primary rounded-xl hover:bg-white/20 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent-glow text-background rounded-xl hover:bg-accent-glow/90 transition-colors font-medium disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-spin">⏳</span>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        Create Club
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CreateClubModal;
