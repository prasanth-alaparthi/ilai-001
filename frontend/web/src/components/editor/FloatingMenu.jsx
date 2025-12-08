import React from 'react';
import { FloatingMenu } from '@tiptap/react';

const FloatingMenuComponent = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <FloatingMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="bg-white dark:bg-surface text-secondary border border-black/10 dark:border-white/10 rounded-lg p-1 flex gap-1 shadow-lg"
    >
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-accent-blue bg-accent-blue/10' : ''}`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-accent-blue bg-accent-blue/10' : ''}`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs font-medium transition-colors ${editor.isActive('bulletList') ? 'text-accent-blue bg-accent-blue/10' : ''}`}
      >
        Bullet List
      </button>
    </FloatingMenu>
  );
};

export default FloatingMenuComponent;
