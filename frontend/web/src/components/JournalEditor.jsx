import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export default function JournalEditor({ valueJson, onChangeJson, readOnly = false }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your journal entry…",
      }),
    ],
    content: valueJson
      ? JSON.parse(valueJson)
      : {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
        },
    editable: !readOnly,
    onUpdate({ editor }) {
      const json = editor.getJSON();
      onChangeJson && onChangeJson(JSON.stringify(json));
    },
  });

useEffect(() => {
    if (!editor) return;
    if (valueJson) {
      try {
        editor.commands.setContent(JSON.parse(valueJson), false);
      } catch {
        // ignore parse errors
      }
    }
  }, [valueJson, editor]);

if (!editor) return null;

const toolbarButton = (active, label, onClick) =>
    readOnly ? null : (
      <button
        type="button"
        onClick={onClick}
        className={[
          "px-2 py-1 rounded-md border text-xs font-medium",
          active
            ? "bg-indigo-500/80 border-indigo-300 text-white"
            : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/80",
        ].join(" ")}
      >
        {label}
      </button>
    );

return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md shadow-glass">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs">
          {toolbarButton(
            editor.isActive("bold"),
            "B",
            () => editor.chain().focus().toggleBold().run()
          )}
          {toolbarButton(
            editor.isActive("italic"),
            "I",
            () => editor.chain().focus().toggleItalic().run()
          )}
          {toolbarButton(
            editor.isActive("strike"),
            "S",
            () => editor.chain().focus().toggleStrike().run()
          )}
          <span className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-700" />
          {toolbarButton(
            editor.isActive("heading", { level: 2 }),
            "H2",
            () => editor.chain().focus().toggleHeading({ level: 2 }).run()
          )}
          {toolbarButton(
            editor.isActive("heading", { level: 3 }),
            "H3",
            () => editor.chain().focus().toggleHeading({ level: 3 }).run()
          )}
          <span className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-700" />
          {toolbarButton(
            editor.isActive("bulletList"),
            "• List",
            () => editor.chain().focus().toggleBulletList().run()
          )}
          {toolbarButton(
            editor.isActive("orderedList"),
            "1. List",
            () => editor.chain().focus().toggleOrderedList().run()
          )}
          {toolbarButton(
            editor.isActive("blockquote"),
            "Quote",
            () => editor.chain().focus().toggleBlockquote().run()
          )}
          <span className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-700" />
          {toolbarButton(false, "Undo", () => editor.chain().focus().undo().run())}
          {toolbarButton(false, "Redo", () => editor.chain().focus().redo().run())}
        </div>
      )}

{/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 text-sm">
        <EditorContent
          editor={editor}
          className="prose max-w-none prose-sm dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-slate-100"
        />
      </div>
    </div>
  );
}