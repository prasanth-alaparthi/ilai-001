import React, { useState } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { notesService } from '../../services/notesService';
import { FiCpu } from 'react-icons/fi';
import { marked } from 'marked';

const BubbleMenuComponent = ({ editor }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);

  if (!editor) {
    return null;
  }

  const handleElaborate = async () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');

    if (!text) return;

    setIsLoading(true);
    try {
      const response = await notesService.explain(text, 'detailed');

      if (response && response.explanation) {
        setPreviewContent(response.explanation);
      }
    } catch (error) {
      console.error("AI Elaboration failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = async () => {
    if (previewContent) {
      const { to } = editor.state.selection;
      const htmlContent = await marked.parse(previewContent);
      editor.chain().focus().insertContentAt(to, ` ${htmlContent} `).run();
      setPreviewContent(null);
    }
  };

  const handleFix = async () => {
    if (previewContent) {
      const { from, to } = editor.state.selection;
      const htmlContent = await marked.parse(previewContent);
      editor.chain().focus().insertContentAt({ from, to }, htmlContent).run();
      setPreviewContent(null);
    }
  };

  const cancelFix = () => {
    setPreviewContent(null);
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, maxWidth: 800, zIndex: 50 }}
      className="bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden flex items-center"
    >
      {previewContent ? (
        <div className="flex flex-col p-3 max-w-lg">
          <div
            className="text-sm text-surface-700 dark:text-surface-200 max-h-60 overflow-y-auto mb-3 p-2 bg-surface-50 dark:bg-surface-900/50 rounded border border-surface-100 dark:border-surface-700 prose prose-sm dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: marked.parse(previewContent) }}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={cancelFix}
              className="px-3 py-1.5 text-xs font-medium text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFix}
              className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm transition-colors"
              title="Replace selected text"
            >
              Fix (Replace)
            </button>
            <button
              onClick={handleInsert}
              className="px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-300 dark:bg-primary-900/40 dark:hover:bg-primary-900/60 rounded shadow-sm transition-colors"
              title="Insert after selection"
            >
              Insert
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 p-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors ${editor.isActive('bold') ? 'text-primary-600 dark:text-primary-400 bg-surface-100 dark:bg-surface-700' : ''}`}
            title="Bold"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors ${editor.isActive('italic') ? 'text-primary-600 dark:text-primary-400 bg-surface-100 dark:bg-surface-700' : ''}`}
            title="Italic"
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors ${editor.isActive('strike') ? 'text-primary-600 dark:text-primary-400 bg-surface-100 dark:bg-surface-700' : ''}`}
            title="Strike"
          >
            <span className="line-through">S</span>
          </button>

          <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />

          <button
            onClick={handleElaborate}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors disabled:opacity-50"
            title="Elaborate on selection"
          >
            {isLoading ? (
              <span className="animate-spin">⌛</span>
            ) : (
              <FiCpu className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-bold">Elaborate</span>
          </button>
        </div>
      )}
    </BubbleMenu>
  );
};

export default BubbleMenuComponent;
