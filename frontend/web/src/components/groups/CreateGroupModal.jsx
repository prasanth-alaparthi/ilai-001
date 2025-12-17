import React, { useState } from 'react';
import { X, Users, Globe, Lock, Image, Loader2 } from 'lucide-react';
import HashtagInput from '../feed/HashtagInput';
import groupService from '../../services/groupService';

/**
 * CreateGroupModal - Form to create new study group
 */
const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [groupType, setGroupType] = useState('TOPIC');
    const [hashtags, setHashtags] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const groupData = {
                name: name.trim(),
                description: description.trim(),
                visibility,
                groupType,
                hashtags,
                subjects
            };

            const newGroup = await groupService.createGroup(groupData);
            onGroupCreated?.(newGroup);
            onClose();

            // Reset form
            setName('');
            setDescription('');
            setHashtags([]);
        } catch (error) {
            console.error('Create group error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const groupTypes = [
        { value: 'TOPIC', label: '📚 Topic', desc: 'Around a subject' },
        { value: 'CLASS', label: '🏫 Class', desc: 'Classmates group' },
        { value: 'EXAM', label: '📝 Exam', desc: 'Exam preparation' },
        { value: 'SCHOOL', label: '🎓 School', desc: 'School community' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Create Study Group</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Group Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., JEE 2025 Physics Masters"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this group about?"
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Group Type */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Group Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {groupTypes.map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setGroupType(type.value)}
                                    className={`p-3 rounded-xl text-left transition-all ${groupType === type.value
                                            ? 'bg-purple-500/20 border-2 border-purple-500'
                                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className="font-medium text-white">{type.label}</div>
                                    <div className="text-xs text-gray-400">{type.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visibility */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Visibility</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setVisibility('PUBLIC')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${visibility === 'PUBLIC' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                Public
                            </button>
                            <button
                                onClick={() => setVisibility('PRIVATE')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${visibility === 'PRIVATE' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                Private
                            </button>
                        </div>
                    </div>

                    {/* Hashtags */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Topics / Hashtags</label>
                        <HashtagInput hashtags={hashtags} onChange={setHashtags} />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Group'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
