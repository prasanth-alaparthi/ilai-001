import React, { useEffect, useState, useRef, useCallback } from "react";
import apiClient from "../services/apiClient";
import RichNoteEditor from "./RichNoteEditor";
import { motion, AnimatePresence } from "framer-motion";

export default function EditorModal({ open, onClose, noteId = null, onSaved }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const localKey = noteId ? `note:draft:${noteId}` : "note:draft:new";
  const firstLoad = useRef(true);
  const [editorInstance, setEditorInstance] = useState(null);

  const handleEditorReady = useCallback((editor) => {
    setEditorInstance(editor);
  }, []);

  useEffect(() => {
    if (!open) return;
    const draft = localStorage.getItem(localKey);
    if (draft && firstLoad.current) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
      } catch (e) { console.error("Failed to parse draft from localStorage", e); }
    }
    firstLoad.current = false;

    if (noteId) {
      apiClient.get(`/notes/${noteId}`).then(res => {
        const n = res.data;
        if (n) {
          setTitle(n.title || "");
          setContent(n.content || "");
        }
      }).catch((e) => { console.error("Failed to fetch note", e); });
    } else {
      setTitle("");
      setContent(draft ? JSON.parse(draft).content : "");
    }
  }, [open, noteId]); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => {
      const currentContent = editorInstance ? editorInstance.getJSON() : content;
      localStorage.setItem(localKey, JSON.stringify({ title, content: currentContent, ts: Date.now() }));
      setStatus("Draft saved locally");
    }, 2000);
    return () => clearInterval(id);
  }, [title, content, localKey, editorInstance]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const currentContent = editorInstance ? editorInstance.getJSON() : content;
      const dto = { title, content: currentContent };
      let res;
      if (noteId) res = await apiClient.put(`/notes/${noteId}`, dto);
      else res = await apiClient.post("/notes", dto);
      localStorage.removeItem(localKey);
      setStatus("Saved");
      onSaved && onSaved(res.data);
      onClose && onClose();
    } catch (err) {
      console.error("save error", err);
      setStatus("Failed to save — try again");
    } finally {
      setSaving(false);
    }
  }, [title, content, noteId, localKey, onSaved, onClose, editorInstance]);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  function insertAtCursor(text) {
    if (editorInstance) {
      editorInstance.commands.insertContent(text);
    } else {
      setContent((c) => c + "\n\n" + text);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-3 border-b dark:border-slate-700">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent w-2/3 text-lg font-semibold focus:outline-none"
            placeholder="Note title..."
          />
          <div className="flex items-center gap-2">
            <MathHelpMenu onInsert={insertAtCursor} templates={mathTemplates} />
            <div className="text-sm text-gray-500">{status}</div>
            <button className="px-3 py-1 rounded-md bg-indigo-600 text-white" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save (Ctrl+S)"}
            </button>
            <button className="px-3 py-1 rounded-md border" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <RichNoteEditor value={content} onChange={setContent} noteId={noteId} onRestore={() => { }} onEditorReady={handleEditorReady} />
        </div>
      </div>
    </div>
  );
}

// Math templates users can insert
const mathTemplates = [
  { label: "Inline math (x^2)", snippet: "$x^2$" },
  { label: "Display integral", snippet: "$$\\int_{a}^{b} f(x)\\,dx$$" },
  { label: "Fraction", snippet: "$$\\frac{a}{b}$$" },
  { label: "Summation", snippet: "$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2}$$" },
  { label: "Matrix", snippet: "$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$" },
  { label: "Equation environment", snippet: "$$\\begin{aligned} E &= mc^2 \\\\ F &= ma \\end{aligned}$$" },
];

// small subcomponent for math-help dropdown
function MathHelpMenu({ templates = [], onInsert }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="px-3 py-1 rounded-md border bg-white dark:bg-slate-800"
        title="Math help and templates"
      >
        Math Help
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-md shadow-lg z-50 p-3 border">
          <div className="text-sm font-semibold mb-2">Insert math template</div>
          <div className="space-y-2">
            {templates.map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="text-sm">{t.label}</div>
                <button
                  onClick={() => { onInsert(t.snippet); setOpen(false); }}
                  className="px-2 py-1 rounded-md border text-sm"
                >
                  Insert
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">Tip: Use the preview pane to see rendered math.</div>
        </div>
      )}
    </div>
  );
}