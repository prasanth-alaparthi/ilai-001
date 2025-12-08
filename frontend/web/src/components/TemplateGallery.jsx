// src/components/TemplateGallery.jsx
// Journal template gallery with preview and insertion - Professional & Personal
import React, { useState, useEffect } from 'react';
import { notesService } from '../services/notesService';
import apiClient from '../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiFileText, FiX, FiSearch, FiCheckCircle, FiBookOpen,
    FiClipboard, FiLayers, FiAward, FiStar, FiSun, FiHeart,
    FiEdit3, FiCompass, FiCalendar, FiBriefcase, FiUser
} from 'react-icons/fi';

// Professional template icons
const templateIcons = {
    'Research Article': FiFileText,
    'Literature Review': FiBookOpen,
    'Lab Report': FiClipboard,
    'Case Study': FiLayers,
    'Thesis Chapter': FiAward,
    'Conference Paper': FiStar,
    'Grant Proposal': FiFileText,
    'Technical Report': FiClipboard,
    'Methodology Paper': FiLayers,
    'Meta-Analysis': FiBookOpen,
    'Systematic Review': FiBookOpen,
    'Position Paper': FiFileText,
    'Book Review': FiBookOpen,
    'Project Proposal': FiClipboard,
    'Research Brief': FiFileText,
    // Personal template icons
    'Morning Pages': FiSun,
    'Gratitude Journal': FiHeart,
    'Daily Reflection': FiEdit3,
    'Self-Discovery Journal': FiCompass,
    'Weekly Review': FiCalendar,
};

// Professional template colors
const templateColors = {
    'Research Article': 'from-indigo-500 to-purple-500',
    'Literature Review': 'from-emerald-500 to-teal-500',
    'Lab Report': 'from-blue-500 to-cyan-500',
    'Case Study': 'from-orange-500 to-amber-500',
    'Thesis Chapter': 'from-violet-500 to-purple-500',
    'Conference Paper': 'from-pink-500 to-rose-500',
    'Grant Proposal': 'from-green-500 to-emerald-500',
    'Technical Report': 'from-slate-500 to-gray-500',
    'Methodology Paper': 'from-cyan-500 to-blue-500',
    'Meta-Analysis': 'from-teal-500 to-green-500',
    'Systematic Review': 'from-purple-500 to-indigo-500',
    'Position Paper': 'from-red-500 to-orange-500',
    'Book Review': 'from-amber-500 to-yellow-500',
    'Project Proposal': 'from-sky-500 to-blue-500',
    'Research Brief': 'from-rose-500 to-pink-500',
    // Personal template colors (warm, inviting tones)
    'Morning Pages': 'from-amber-400 to-orange-400',
    'Gratitude Journal': 'from-pink-400 to-rose-400',
    'Daily Reflection': 'from-sky-400 to-indigo-400',
    'Self-Discovery Journal': 'from-violet-400 to-purple-400',
    'Weekly Review': 'from-teal-400 to-cyan-400',
};

// Template categories
const personalTemplateNames = ['Morning Pages', 'Gratitude Journal', 'Daily Reflection', 'Self-Discovery Journal', 'Weekly Review'];

const TemplateGallery = ({ isOpen, onClose, onSelectTemplate }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [category, setCategory] = useState('all'); // 'all', 'professional', 'personal'

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/notes/templates');
            setTemplates(res.data || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
            // Use default templates if API fails
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());

        if (category === 'all') return matchesSearch;
        if (category === 'personal') return matchesSearch && personalTemplateNames.includes(t.name);
        if (category === 'professional') return matchesSearch && !personalTemplateNames.includes(t.name);
        return matchesSearch;
    });

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setPreviewOpen(true);
    };

    const handleUseTemplate = () => {
        if (selectedTemplate && onSelectTemplate) {
            onSelectTemplate(selectedTemplate.content);
            onClose();
        }
    };

    const getIcon = (name) => {
        const IconComponent = templateIcons[name] || FiFileText;
        return IconComponent;
    };

    const getGradient = (name) => {
        return templateColors[name] || 'from-slate-500 to-gray-500';
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-700/50"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                Journal Templates
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Professional & Personal templates for every need
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <FiX className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="px-6 pt-3 flex gap-2">
                        {[
                            { key: 'all', label: 'All Templates', icon: FiFileText },
                            { key: 'professional', label: 'Professional', icon: FiBriefcase },
                            { key: 'personal', label: 'Personal', icon: FiUser },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setCategory(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === key
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="px-6 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search templates..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Templates Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <FiFileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No templates found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.map((template) => {
                                    const IconComponent = getIcon(template.name);
                                    const gradient = getGradient(template.name);

                                    return (
                                        <motion.button
                                            key={template.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelectTemplate(template)}
                                            className="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:shadow-lg transition-all"
                                        >
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                                                <IconComponent className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {template.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                {template.description}
                                            </p>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Preview Modal */}
                    <AnimatePresence>
                        {previewOpen && selectedTemplate && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                                >
                                    {/* Preview Header */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradient(selectedTemplate.name)} flex items-center justify-center`}>
                                                {React.createElement(getIcon(selectedTemplate.name), { className: "w-5 h-5 text-white" })}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                                                    {selectedTemplate.name}
                                                </h3>
                                                <p className="text-xs text-slate-500">{selectedTemplate.description?.slice(0, 60)}...</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPreviewOpen(false)}
                                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <FiX className="w-5 h-5 text-slate-500" />
                                        </button>
                                    </div>

                                    {/* Preview Content */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <PreviewContent content={selectedTemplate.content} />
                                        </div>
                                    </div>

                                    {/* Preview Actions */}
                                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                        <button
                                            onClick={() => setPreviewOpen(false)}
                                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUseTemplate}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                                        >
                                            <FiCheckCircle className="w-4 h-4" />
                                            Use This Template
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
};

// Helper component to render template content preview
const PreviewContent = ({ content }) => {
    if (!content) return <p className="text-slate-500">No preview available</p>;

    const renderNode = (node, key) => {
        if (!node) return null;

        switch (node.type) {
            case 'doc':
                return <>{node.content?.map((child, i) => renderNode(child, i))}</>;
            case 'heading':
                const HeadingTag = `h${node.attrs?.level || 2}`;
                return (
                    <HeadingTag key={key} className="font-semibold mt-4 mb-2">
                        {node.content?.map((child, i) => renderTextNode(child, i))}
                    </HeadingTag>
                );
            case 'paragraph':
                return (
                    <p key={key} className="mb-2 text-slate-600 dark:text-slate-400">
                        {node.content?.map((child, i) => renderTextNode(child, i)) || ' '}
                    </p>
                );
            case 'bulletList':
                return (
                    <ul key={key} className="list-disc list-inside mb-2">
                        {node.content?.map((child, i) => renderNode(child, i))}
                    </ul>
                );
            case 'orderedList':
                return (
                    <ol key={key} className="list-decimal list-inside mb-2">
                        {node.content?.map((child, i) => renderNode(child, i))}
                    </ol>
                );
            case 'listItem':
                return (
                    <li key={key}>
                        {node.content?.map((child, i) => renderNode(child, i))}
                    </li>
                );
            default:
                return null;
        }
    };

    const renderTextNode = (node, key) => {
        if (!node) return null;
        if (node.type === 'text') {
            let text = node.text;
            if (node.marks) {
                node.marks.forEach(mark => {
                    if (mark.type === 'bold') {
                        text = <strong key={key}>{text}</strong>;
                    } else if (mark.type === 'italic') {
                        text = <em key={key}>{text}</em>;
                    }
                });
            }
            return <span key={key}>{text}</span>;
        }
        return renderNode(node, key);
    };

    try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        return renderNode(parsed, 0);
    } catch (e) {
        return <p className="text-slate-500">Preview not available</p>;
    }
};

export default TemplateGallery;
