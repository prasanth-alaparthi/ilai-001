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
      className="bg-white dark:bg-surface text-primary rounded-lg shadow-xl border border-black/10 dark:border-white/10 overflow-hidden flex items-center"
    >
      {previewContent ? (
        <div className="flex flex-col p-3 max-w-lg">
          <div
            className="text-sm text-secondary max-h-60 overflow-y-auto mb-3 p-2 bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10 prose prose-sm dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: marked.parse(previewContent) }}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={cancelFix}
              className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFix}
              className="px-3 py-1.5 text-xs font-bold text-background bg-accent-blue hover:bg-accent-blue/90 rounded shadow-sm transition-colors"
              title="Replace selected text"
            >
              Fix (Replace)
            </button>
            <button
              onClick={handleInsert}
              className="px-3 py-1.5 text-xs font-bold text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 rounded shadow-sm transition-colors"
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
            className={`px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${editor.isActive('bold') ? 'text-accent-blue bg-accent-blue/10' : 'text-secondary'}`}
            title="Bold"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${editor.isActive('italic') ? 'text-accent-blue bg-accent-blue/10' : 'text-secondary'}`}
            title="Italic"
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${editor.isActive('strike') ? 'text-accent-blue bg-accent-blue/10' : 'text-secondary'}`}
            title="Strike"
          >
            <span className="line-through">S</span>
          </button>

          <div className="w-px h-5 bg-black/10 dark:bg-white/10 mx-1" />

          <button
            onClick={handleElaborate}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent-blue/10 text-accent-blue transition-colors disabled:opacity-50"
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
