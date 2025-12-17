/**
 * SectionTree - Recursive tree view for nested sections/chapters
 * Features: Expand/collapse, context menu, create sub-section, drag indicators
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronDown, Folder, FolderOpen,
    Plus, MoreHorizontal, Trash2, Edit2, FolderPlus
} from 'lucide-react';

// Single tree node
const TreeNode = ({
    section,
    level = 0,
    expandedIds,
    selectedId,
    onToggle,
    onSelect,
    onCreateChild,
    onRename,
    onDelete,
    onContextMenu,
}) => {
    const [showActions, setShowActions] = useState(false);
    const isExpanded = expandedIds.has(section.id);
    const isSelected = selectedId === section.id;
    const hasChildren = section.children && section.children.length > 0;

    const handleClick = (e) => {
        e.stopPropagation();
        onSelect(section);
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        onToggle(section.id);
    };

    const handleAddChild = (e) => {
        e.stopPropagation();
        onCreateChild(section.id);
    };

    return (
        <div className="select-none">
            {/* Node Row */}
            <div
                className={`
          group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer
          transition-all duration-150
          ${isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
        `}
                style={{ paddingLeft: `${8 + level * 16}px` }}
                onClick={handleClick}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
                onContextMenu={(e) => onContextMenu?.(e, section)}
            >
                {/* Expand/Collapse Toggle */}
                <button
                    onClick={handleToggle}
                    className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${hasChildren ? 'visible' : 'invisible'
                        }`}
                >
                    {isExpanded ? (
                        <ChevronDown size={14} className="text-gray-400" />
                    ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                    )}
                </button>

                {/* Folder Icon */}
                {isExpanded ? (
                    <FolderOpen size={16} className="text-amber-500 flex-shrink-0" />
                ) : (
                    <Folder size={16} className="text-amber-500 flex-shrink-0" />
                )}

                {/* Title */}
                <span className="flex-1 truncate text-sm font-medium">
                    {section.title}
                </span>

                {/* Quick Actions */}
                <div className={`flex items-center gap-0.5 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                    <button
                        onClick={handleAddChild}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Add Sub-folder"
                    >
                        <FolderPlus size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onContextMenu?.(e, section);
                        }}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="More options"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            </div>

            {/* Children */}
            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        {section.children.map((child) => (
                            <TreeNode
                                key={child.id}
                                section={child}
                                level={level + 1}
                                expandedIds={expandedIds}
                                selectedId={selectedId}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                onCreateChild={onCreateChild}
                                onRename={onRename}
                                onDelete={onDelete}
                                onContextMenu={onContextMenu}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Context Menu
const ContextMenu = ({ x, y, section, onClose, onRename, onDelete, onCreateChild }) => {
    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Menu */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
                style={{ left: x, top: y }}
            >
                <button
                    onClick={() => { onCreateChild(section.id); onClose(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <FolderPlus size={14} />
                    Add Sub-folder
                </button>
                <button
                    onClick={() => { onRename(section); onClose(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <Edit2 size={14} />
                    Rename
                </button>
                <div className="h-px bg-gray-200 dark:border-gray-700 my-1" />
                <button
                    onClick={() => { onDelete(section); onClose(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <Trash2 size={14} />
                    Delete
                </button>
            </motion.div>
        </>
    );
};

// Main SectionTree Component
export default function SectionTree({
    sections = [],
    selectedId,
    onSelect,
    onCreateSection,
    onCreateSubSection,
    onRenameSection,
    onDeleteSection,
    emptyMessage = "No chapters yet",
}) {
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [contextMenu, setContextMenu] = useState(null);

    const handleToggle = useCallback((id) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleContextMenu = useCallback((e, section) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            section,
        });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleSelect = useCallback((section) => {
        onSelect(section);
    }, [onSelect]);

    if (sections.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 text-sm">
                <Folder size={32} strokeWidth={1} className="mx-auto mb-2 opacity-50" />
                <p>{emptyMessage}</p>
                <button
                    onClick={() => onCreateSection?.()}
                    className="mt-2 text-blue-500 hover:text-blue-600 text-xs flex items-center gap-1 mx-auto"
                >
                    <Plus size={12} />
                    Create first chapter
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            {sections.map((section) => (
                <TreeNode
                    key={section.id}
                    section={section}
                    level={0}
                    expandedIds={expandedIds}
                    selectedId={selectedId}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                    onCreateChild={onCreateSubSection}
                    onRename={onRenameSection}
                    onDelete={onDeleteSection}
                    onContextMenu={handleContextMenu}
                />
            ))}

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        section={contextMenu.section}
                        onClose={handleCloseContextMenu}
                        onRename={onRenameSection}
                        onDelete={onDeleteSection}
                        onCreateChild={onCreateSubSection}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
