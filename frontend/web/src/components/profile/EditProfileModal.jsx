import React, { useState } from 'react';
import { X, Camera, Loader2, Save } from 'lucide-react';
import socialService from '../../services/socialService';

/**
 * EditProfileModal - Edit user profile form
 */
const EditProfileModal = ({ isOpen, onClose, profile, onProfileUpdated }) => {
    const [formData, setFormData] = useState({
        displayName: profile?.displayName || '',
        bio: profile?.bio || '',
        credentials: profile?.credentials || '',
        institution: profile?.institution || '',
        educationLevel: profile?.educationLevel || '',
        graduationYear: profile?.graduationYear || '',
        subjects: profile?.subjects || []
    });
    const [subjectInput, setSubjectInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addSubject = () => {
        const subject = subjectInput.trim();
        if (subject && !formData.subjects.includes(subject)) {
            handleChange('subjects', [...formData.subjects, subject]);
        }
        setSubjectInput('');
    };

    const removeSubject = (subject) => {
        handleChange('subjects', formData.subjects.filter(s => s !== subject));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const updated = await socialService.updateProfile(formData);
            onProfileUpdated?.(updated);
            onClose();
        } catch (error) {
            console.error('Profile update error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const educationLevels = [
        'High School', '10th', '11th', '12th',
        'Undergraduate', 'Graduate', 'Postgraduate'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Avatar/Cover Upload */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">
                                    {formData.displayName?.charAt(0) || '?'}
                                </span>
                            </div>
                            <button className="absolute bottom-0 right-0 p-1.5 bg-purple-500 rounded-full hover:bg-purple-600">
                                <Camera className="w-3 h-3 text-white" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-400">
                            Click to upload profile photo
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Display Name *</label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => handleChange('displayName', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Credentials */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Credentials / Title</label>
                        <input
                            type="text"
                            value={formData.credentials}
                            onChange={(e) => handleChange('credentials', e.target.value)}
                            placeholder="e.g., IIT Delhi • B.Tech CS"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Institution */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Institution / School</label>
                        <input
                            type="text"
                            value={formData.institution}
                            onChange={(e) => handleChange('institution', e.target.value)}
                            placeholder="Your school or college"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Education Level */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Education Level</label>
                        <select
                            value={formData.educationLevel}
                            onChange={(e) => handleChange('educationLevel', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                            <option value="">Select level</option>
                            {educationLevels.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>

                    {/* Graduation Year */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Graduation Year</label>
                        <input
                            type="number"
                            value={formData.graduationYear}
                            onChange={(e) => handleChange('graduationYear', parseInt(e.target.value))}
                            placeholder="e.g., 2025"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Subjects */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Subjects / Interests</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.subjects.map(subject => (
                                <span
                                    key={subject}
                                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1 text-sm"
                                >
                                    {subject}
                                    <button onClick={() => removeSubject(subject)} className="ml-1 hover:text-red-400">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={subjectInput}
                                onChange={(e) => setSubjectInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                                placeholder="Add subject..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                            <button onClick={addSubject} className="px-4 py-2 bg-purple-500 text-white rounded-lg">
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!formData.displayName.trim() || isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
