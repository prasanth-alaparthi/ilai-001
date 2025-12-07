import React, { useState } from 'react';
import {
    FiBold, FiItalic, FiUnderline, FiList, FiCheckSquare, FiImage, FiType,
    FiLink, FiCode, FiMinus, FiRotateCcw, FiRotateCw, FiTrash2,
    FiMaximize, FiMinimize, FiDroplet, FiEdit3, FiCpu, FiAlignLeft, FiAlignCenter, FiAlignRight
} from 'react-icons/fi';
import AiMenu from '../AiMenu';

const RibbonToolbar = ({ editor }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showAiMenu, setShowAiMenu] = useState(false);
    const menuRef = React.useRef(null);

    if (!editor) return null;

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowAiMenu(false);
            }
        };

        if (showAiMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAiMenu]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const ToolButton = ({ onClick, isActive, icon: Icon, label, title, color, disabled }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title || label}
            className={`
                group relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl transition-all duration-200
                ${isActive
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shadow-sm scale-105'
                    : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 hover:scale-110'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
            `}
        >
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color ? color : ''}`} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {label}
            </span>
        </button>
    );

    const Divider = () => (
        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1 self-center flex-shrink-0" />
    );

    const FontSelect = () => (
        <div className="flex flex-col justify-center mx-1">
            <select
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                value={editor.getAttributes('textStyle').fontFamily || ''}
                className="h-8 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-1 focus:ring-primary-500 w-24 px-1 appearance-none cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                title="Font Family"
            >
                <option value="" disabled>Font</option>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Comic Sans MS">Comic</option>
                <option value="Courier New">Courier</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times</option>
                <option value="Verdana">Verdana</option>
            </select>
        </div>
    );

    const FontSizeSelect = () => (
        <div className="flex flex-col justify-center mx-1">
            <select
                onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
                value={editor.getAttributes('textStyle').fontSize || ''}
                className="h-8 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-1 focus:ring-primary-500 w-14 px-1 appearance-none cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                title="Font Size"
            >
                <option value="" disabled>Size</option>
                <option value="12">12</option>
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="24">24</option>
                <option value="30">30</option>
                <option value="36">36</option>
                <option value="48">48</option>
            </select>
        </div>
    );

    return (
        <div className="relative z-50 flex justify-center px-4 py-2 pointer-events-none w-full">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 p-2 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md border border-surface-200 dark:border-surface-700 rounded-2xl shadow-lg shadow-surface-200/50 dark:shadow-black/20 transition-all hover:shadow-xl max-w-full">

                {/* AI & Magic (Moved to Start) */}
                <div className="flex items-center gap-0.5 relative flex-shrink-0" ref={menuRef}>
                    <button
                        onClick={() => setShowAiMenu(!showAiMenu)}
                        className={`
                            group relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl transition-all duration-200
                            ${showAiMenu
                                ? 'bg-gradient-to-tr from-primary-500 to-purple-600 text-white shadow-lg scale-105'
                                : 'bg-surface-100 dark:bg-surface-800 text-primary-600 dark:text-primary-400 hover:scale-110'
                            }
                        `}
                        title="AI Tools"
                    >
                        <FiCpu className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            AI Magic
                        </span>
                    </button>
                    {showAiMenu && (
                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 p-2 min-w-[200px] z-[9999] animate-in fade-in zoom-in-95 duration-200">
                            <AiMenu editor={editor} variant="ribbon" />
                        </div>
                    )}
                </div>

                <Divider />

                {/* History */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <ToolButton onClick={() => editor.chain().focus().undo().run()} icon={FiRotateCcw} label="Undo" disabled={!editor.can().undo()} />
                    <ToolButton onClick={() => editor.chain().focus().redo().run()} icon={FiRotateCw} label="Redo" disabled={!editor.can().redo()} />
                </div>

                <Divider />

                {/* Font Controls */}
                <div className="flex items-center flex-shrink-0">
                    <FontSelect />
                    <FontSizeSelect />
                </div>

                <Divider />

                {/* Text Formatting */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={FiBold} label="Bold" />
                    <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={FiItalic} label="Italic" />
                    <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={FiUnderline} label="Underline" />
                    <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={FiCode} label="Code" />

                    {/* Highlight Color Picker */}
                    <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 group">
                        <div className={`
                            absolute inset-0 rounded-xl transition-all duration-200 pointer-events-none
                            ${editor.isActive('highlight') ? 'bg-primary-100 dark:bg-primary-900/40' : 'group-hover:bg-surface-100 dark:group-hover:bg-surface-800'}
                        `} />
                        <FiEdit3 className={`relative z-10 w-4 h-4 md:w-5 md:h-5 ${editor.isActive('highlight') ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'}`} />
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                            title="Highlight Color"
                            value={editor.getAttributes('highlight').color || '#ffff00'}
                            onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                        />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Highlight
                        </span>
                    </div>

                    {/* Text Color Picker */}
                    <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 group">
                        <div className={`
                            absolute inset-0 rounded-xl transition-all duration-200 pointer-events-none
                            ${editor.getAttributes('textStyle').color ? 'bg-primary-100 dark:bg-primary-900/40' : 'group-hover:bg-surface-100 dark:group-hover:bg-surface-800'}
                        `} />
                        <FiDroplet className={`relative z-10 w-4 h-4 md:w-5 md:h-5 ${editor.getAttributes('textStyle').color ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'}`} />
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                            title="Text Color"
                            value={editor.getAttributes('textStyle').color || '#000000'}
                            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                        />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Text Color
                        </span>
                    </div>
                </div>

                <Divider />

                {/* Structure & Alignment */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={FiAlignLeft} label="Left" />
                    <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={FiAlignCenter} label="Center" />
                    <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={FiType} label="H1" />
                    <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={FiType} label="H2" color="scale-75" />
                    <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={FiList} label="List" />
                    <ToolButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} icon={FiCheckSquare} label="Tasks" />
                </div>

                <Divider />

                {/* Insert */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <ToolButton onClick={() => { const url = window.prompt('Enter image URL'); if (url) editor.chain().focus().setImage({ src: url }).run(); }} icon={FiImage} label="Image" />
                    <ToolButton onClick={() => { const url = window.prompt('Enter link URL'); if (url) editor.chain().focus().setLink({ href: url }).run(); }} isActive={editor.isActive('link')} icon={FiLink} label="Link" />
                    <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={FiMinus} label="Divider" />
                </div>

                <Divider />

                {/* View & Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <ToolButton onClick={() => editor.chain().focus().unsetAllMarks().run()} icon={FiTrash2} label="Clear Format" />
                    <ToolButton onClick={toggleFullscreen} icon={isFullscreen ? FiMinimize : FiMaximize} label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} />
                </div>

            </div>
        </div>
    );
};

export default RibbonToolbar;
