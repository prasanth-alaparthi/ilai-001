/**
 * EditorToolbar - Comprehensive Word/OneNote-style toolbar
 * Features: Formatting, Clipboard, Tables, AI Tools
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, CheckSquare,
    Link, Image, Table, Code,
    Heading1, Heading2, Heading3,
    Quote, Minus, Redo, Undo,
    Copy, Scissors, Clipboard, ClipboardPaste,
    Type, Palette, Highlighter,
    ZoomIn, ZoomOut, Maximize2,
    Sparkles, Wand2, Languages, BookOpen, Brain, FileText,
    ChevronDown, MoreHorizontal,
    Mic, Download, Printer, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================
// Toolbar Button Component
// ==================
const ToolbarButton = ({ icon: Icon, label, active, disabled, onClick, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={label}
        className={`
      p-1.5 rounded transition-all duration-150
      ${active
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `}
    >
        <Icon size={16} />
    </button>
);

// ==================
// Dropdown Component
// ==================
const ToolbarDropdown = ({ label, icon: Icon, children, className = '' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
                {Icon && <Icon size={14} />}
                <span>{label}</span>
                <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 mt-1 min-w-[160px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DropdownItem = ({ icon: Icon, label, onClick, shortcut }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
        {Icon && <Icon size={14} />}
        <span className="flex-1 text-left">{label}</span>
        {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
    </button>
);

// ==================
// Divider
// ==================
const Divider = () => (
    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
);

// ==================
// Font Size Selector
// ==================
const FontSizeSelector = ({ value, onChange }) => {
    const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

    return (
        <select
            value={value || 16}
            onChange={(e) => onChange(Number(e.target.value))}
            className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
            {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
            ))}
        </select>
    );
};

// ==================
// Font Family Selector
// ==================
const FontFamilySelector = ({ value, onChange }) => {
    const fonts = [
        { value: 'Inter', label: 'Inter' },
        { value: 'Georgia', label: 'Georgia' },
        { value: 'Times New Roman', label: 'Times New Roman' },
        { value: 'Arial', label: 'Arial' },
        { value: 'Courier New', label: 'Courier New' },
        { value: 'Comic Sans MS', label: 'Comic Sans' },
    ];

    return (
        <select
            value={value || 'Inter'}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[100px]"
        >
            {fonts.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
            ))}
        </select>
    );
};

// ==================
// Color Picker
// ==================
const ColorPicker = ({ color, onChange, type = 'text' }) => {
    const colors = [
        '#000000', '#374151', '#6B7280', '#9CA3AF',
        '#EF4444', '#F97316', '#EAB308', '#22C55E',
        '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
    ];

    return (
        <div className="grid grid-cols-6 gap-1 p-2">
            {colors.map(c => (
                <button
                    key={c}
                    onClick={() => onChange(c)}
                    className={`w-5 h-5 rounded border-2 transition-transform hover:scale-110 ${color === c ? 'border-blue-500' : 'border-transparent'
                        }`}
                    style={{ backgroundColor: c }}
                />
            ))}
            <input
                type="color"
                value={color || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer"
            />
        </div>
    );
};

// ==================
// Main Toolbar Component
// ==================
export default function EditorToolbar({
    editor,
    zoom = 100,
    onZoomChange,
    onAIAction,
    onTranslate,
    onInsertTable,
    onExport,
    onPrint
}) {
    const [textColor, setTextColor] = useState('#000000');
    const [highlightColor, setHighlightColor] = useState('#FFFF00');
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);

    if (!editor) return null;

    // Clipboard operations
    const handleCopy = () => {
        document.execCommand('copy');
    };

    const handleCut = () => {
        document.execCommand('cut');
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            editor.commands.insertContent(text);
        } catch (err) {
            document.execCommand('paste');
        }
    };

    // Text color
    const handleTextColor = (color) => {
        setTextColor(color);
        editor.chain().focus().setColor(color).run();
        setShowTextColorPicker(false);
    };

    // Highlight
    const handleHighlight = (color) => {
        setHighlightColor(color);
        editor.chain().focus().setHighlight({ color }).run();
        setShowHighlightPicker(false);
    };

    return (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            {/* Main Toolbar Row */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap">

                {/* Undo/Redo */}
                <ToolbarButton
                    icon={Undo}
                    label="Undo (Ctrl+Z)"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                />
                <ToolbarButton
                    icon={Redo}
                    label="Redo (Ctrl+Y)"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                />

                <Divider />

                {/* Clipboard */}
                <ToolbarButton icon={Scissors} label="Cut (Ctrl+X)" onClick={handleCut} />
                <ToolbarButton icon={Copy} label="Copy (Ctrl+C)" onClick={handleCopy} />
                <ToolbarButton icon={ClipboardPaste} label="Paste (Ctrl+V)" onClick={handlePaste} />

                <Divider />

                {/* Font Family & Size */}
                <FontFamilySelector
                    value={editor.getAttributes('textStyle').fontFamily}
                    onChange={(font) => editor.chain().focus().setFontFamily(font).run()}
                />
                <FontSizeSelector
                    value={parseInt(editor.getAttributes('textStyle').fontSize)}
                    onChange={(size) => editor.chain().focus().setFontSize(`${size}px`).run()}
                />

                <Divider />

                {/* Text Formatting */}
                <ToolbarButton
                    icon={Bold}
                    label="Bold (Ctrl+B)"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarButton
                    icon={Italic}
                    label="Italic (Ctrl+I)"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolbarButton
                    icon={Underline}
                    label="Underline (Ctrl+U)"
                    active={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                />
                <ToolbarButton
                    icon={Strikethrough}
                    label="Strikethrough"
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                />

                {/* Text Color */}
                <div className="relative">
                    <button
                        onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center"
                        title="Text Color"
                    >
                        <Type size={16} className="text-gray-600 dark:text-gray-400" />
                        <div className="w-4 h-1 mt-0.5 rounded" style={{ backgroundColor: textColor }} />
                    </button>
                    {showTextColorPicker && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                            <ColorPicker color={textColor} onChange={handleTextColor} />
                        </div>
                    )}
                </div>

                {/* Highlight */}
                <div className="relative">
                    <button
                        onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center"
                        title="Highlight"
                    >
                        <Highlighter size={16} className="text-gray-600 dark:text-gray-400" />
                        <div className="w-4 h-1 mt-0.5 rounded" style={{ backgroundColor: highlightColor }} />
                    </button>
                    {showHighlightPicker && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                            <ColorPicker color={highlightColor} onChange={handleHighlight} type="highlight" />
                        </div>
                    )}
                </div>

                <Divider />

                {/* Headings */}
                <ToolbarDropdown label="Heading" icon={Heading1}>
                    <DropdownItem
                        icon={Heading1}
                        label="Heading 1"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    />
                    <DropdownItem
                        icon={Heading2}
                        label="Heading 2"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    />
                    <DropdownItem
                        icon={Heading3}
                        label="Heading 3"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    />
                    <DropdownItem
                        icon={Type}
                        label="Normal Text"
                        onClick={() => editor.chain().focus().setParagraph().run()}
                    />
                </ToolbarDropdown>

                <Divider />

                {/* Lists */}
                <ToolbarButton
                    icon={List}
                    label="Bullet List"
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                />
                <ToolbarButton
                    icon={ListOrdered}
                    label="Numbered List"
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                />
                <ToolbarButton
                    icon={CheckSquare}
                    label="Task List"
                    active={editor.isActive('taskList')}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                />

                <Divider />

                {/* Alignment */}
                <ToolbarButton
                    icon={AlignLeft}
                    label="Align Left"
                    active={editor.isActive({ textAlign: 'left' })}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                />
                <ToolbarButton
                    icon={AlignCenter}
                    label="Align Center"
                    active={editor.isActive({ textAlign: 'center' })}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                />
                <ToolbarButton
                    icon={AlignRight}
                    label="Align Right"
                    active={editor.isActive({ textAlign: 'right' })}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                />
                <ToolbarButton
                    icon={AlignJustify}
                    label="Justify"
                    active={editor.isActive({ textAlign: 'justify' })}
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                />

                <Divider />

                {/* Insert */}
                <ToolbarButton
                    icon={Link}
                    label="Insert Link"
                    onClick={() => {
                        const url = window.prompt('Enter URL:');
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                    }}
                />
                <ToolbarButton
                    icon={Image}
                    label="Insert Image"
                    onClick={() => {
                        const url = window.prompt('Enter image URL:');
                        if (url) editor.chain().focus().setImage({ src: url }).run();
                    }}
                />
                <ToolbarButton
                    icon={Table}
                    label="Insert Table"
                    onClick={() => onInsertTable?.() || editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
                />
                <ToolbarButton
                    icon={Code}
                    label="Code Block"
                    active={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                />
                <ToolbarButton
                    icon={Quote}
                    label="Quote"
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                />
                <ToolbarButton
                    icon={Minus}
                    label="Horizontal Rule"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                />

                <Divider />

                {/* Zoom */}
                <div className="flex items-center gap-1">
                    <ToolbarButton
                        icon={ZoomOut}
                        label="Zoom Out"
                        onClick={() => onZoomChange?.(Math.max(50, zoom - 10))}
                    />
                    <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
                    <ToolbarButton
                        icon={ZoomIn}
                        label="Zoom In"
                        onClick={() => onZoomChange?.(Math.min(200, zoom + 10))}
                    />
                </div>

                <Divider />

                {/* AI Tools */}
                <ToolbarDropdown label="AI Tools" icon={Sparkles} className="text-purple-600">
                    <DropdownItem
                        icon={Wand2}
                        label="Improve Writing"
                        onClick={() => onAIAction?.('improve')}
                    />
                    <DropdownItem
                        icon={FileText}
                        label="Summarize"
                        onClick={() => onAIAction?.('summarize')}
                    />
                    <DropdownItem
                        icon={Brain}
                        label="Explain"
                        onClick={() => onAIAction?.('explain')}
                    />
                    <DropdownItem
                        icon={BookOpen}
                        label="Generate Study Guide"
                        onClick={() => onAIAction?.('study-guide')}
                    />
                    <DropdownItem
                        icon={Languages}
                        label="Translate"
                        onClick={() => onTranslate?.()}
                    />
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                    <DropdownItem
                        icon={Mic}
                        label="Voice to Text"
                        onClick={() => onAIAction?.('voice')}
                    />
                </ToolbarDropdown>

                {/* More Options */}
                <ToolbarDropdown label="" icon={MoreHorizontal}>
                    <DropdownItem icon={Search} label="Find & Replace" shortcut="Ctrl+H" />
                    <DropdownItem icon={Printer} label="Print" onClick={onPrint} shortcut="Ctrl+P" />
                    <DropdownItem icon={Download} label="Export as PDF" onClick={() => onExport?.('pdf')} />
                    <DropdownItem icon={Download} label="Export as Word" onClick={() => onExport?.('docx')} />
                </ToolbarDropdown>
            </div>
        </div>
    );
}
