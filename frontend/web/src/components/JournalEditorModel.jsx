// src/components/JournalEditorModal.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import RichNoteEditor from "./RichNoteEditor";
import TemplatesManager from "./TemplatesManager";
import localforage from "localforage";
import apiClient from "../services/apiClient";

/*
  Editor modal with:
  - TemplatesManager inserted in left column
  - Autosave to IndexedDB via localforage every 2s (debounced)
  - Ctrl/Cmd+S to save
*/

localforage.config({ name: "app_journal", storeName: "journal_drafts" });

export default function JournalEditorModal({ open, onClose, entryId = null, onSaved }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [status, setStatus] = useState("");
  const firstLoad = useRef(true);
  const localKey = entryId ? `journal:draft:${entryId}` : "journal:draft:new";

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const d = await localforage.getItem(localKey);
        if (d && firstLoad.current) {
          setTitle(d.title || "");
          setContent(d.content || "");
          setMood(d.mood || "");
        }
        firstLoad.current = false;
        if (entryId) {
          const r = await apiClient.get(`/journals/${entryId}`);
          const e = r.data;
          setTitle(e.title || "");
          setContent(e.content || "");
          setMood(e.mood || "");
        }
      } catch { console.error("Failed to load draft"); }
    })();
  }, [open, entryId]); // eslint-disable-line

  const [editorInstance, setEditorInstance] = useState(null);

  const handleEditorReady = useCallback((editor) => {
    setEditorInstance(editor);
  }, []);

  // persist to indexeddb every 2s (replace interval with debounced handler)
  useEffect(() => {
    let t = setInterval(async () => {
      try {
        const currentContent = editorInstance ? editorInstance.getJSON() : content;
        await localforage.setItem(localKey, { title, content: currentContent, mood, ts: Date.now() });
        setStatus("Draft saved locally");
      } catch (err) { console.error("Failed to save draft locally", err) }
    }, 2000);
    return () => clearInterval(t);
  }, [title, content, mood, localKey, editorInstance]);

  const handleSave = useCallback(async () => {
    setStatus("Saving...");
    try {
      const currentContent = editorInstance ? editorInstance.getJSON() : content;
      const dto = { title, content: currentContent, mood };
      let res;
      if (entryId) res = await apiClient.put(`/journals/${entryId}`, dto);
      else res = await apiClient.post(`/journals`, dto);
      await localforage.removeItem(localKey);
      setStatus("Saved");
      onSaved && onSaved(res.data);
      onClose && onClose();
    } catch {
      console.error("Failed to save");
      setStatus("Failed to save");
    }
  }, [title, content, mood, entryId, localKey, onSaved, onClose, editorInstance]);

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

  function insertTemplate(markdown) {
    if (editorInstance) {
      editorInstance.commands.insertContent(markdown);
    } else {
      setContent((c) => c + "\n\n" + markdown);
    }
    ```jsx
// src/components/JournalEditorModal.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import RichNoteEditor from "./RichNoteEditor";
import TemplatesManager from "./TemplatesManager";
import localforage from "localforage";
import apiClient from "../services/apiClient";

/*
  Editor modal with:
  - TemplatesManager inserted in left column
  - Autosave to IndexedDB via localforage every 2s (debounced)
  - Ctrl/Cmd+S to save
*/

localforage.config({ name: "app_journal", storeName: "journal_drafts" });

export default function JournalEditorModal({ open, onClose, entryId = null, onSaved }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [status, setStatus] = useState("");
  const firstLoad = useRef(true);
  const localKey = entryId ? `journal: draft:${ entryId } ` : "journal:draft:new";

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const d = await localforage.getItem(localKey);
        if (d && firstLoad.current) {
          setTitle(d.title || "");
          setContent(d.content || "");
          setMood(d.mood || "");
        }
        firstLoad.current = false;
        if (entryId) {
          const r = await apiClient.get(`/ journals / ${ entryId } `);
          const e = r.data;
          setTitle(e.title || "");
          setContent(e.content || "");
          setMood(e.mood || "");
        }
      } catch { console.error("Failed to load draft"); }
    })();
  }, [open, entryId]); // eslint-disable-line

  const [editorInstance, setEditorInstance] = useState(null);

  const handleEditorReady = useCallback((editor) => {
    setEditorInstance(editor);
  }, []);

  // persist to indexeddb every 2s (replace interval with debounced handler)
  useEffect(() => {
    let t = setInterval(async () => {
      try {
        const currentContent = editorInstance ? editorInstance.getJSON() : content;
        await localforage.setItem(localKey, { title, content: currentContent, mood, ts: Date.now() });
        setStatus("Draft saved locally");
      } catch (err) { console.error("Failed to save draft locally", err) }
    }, 2000);
    return () => clearInterval(t);
  }, [title, content, mood, localKey, editorInstance]);

  const handleSave = useCallback(async () => {
    setStatus("Saving...");
    try {
      const currentContent = editorInstance ? editorInstance.getJSON() : content;
      const dto = { title, content: currentContent, mood };
      let res;
      if (entryId) res = await apiClient.put(`/ journals / ${ entryId } `, dto);
      else res = await apiClient.post(`/ journals`, dto);
      await localforage.removeItem(localKey);
      setStatus("Saved");
      onSaved && onSaved(res.data);
      onClose && onClose();
    } catch {
      console.error("Failed to save");
      setStatus("Failed to save");
    }
  }, [title, content, mood, entryId, localKey, onSaved, onClose, editorInstance]);

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

  function insertTemplate(markdown) {
    if (editorInstance) {
      editorInstance.commands.insertContent(markdown);
    } else {
      setContent((c) => c + "\n\n" + markdown);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title" className="bg-transparent w-2/3 text-lg font-semibold focus:outline-none" />
          <div className="flex items-center gap-2">
            <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Mood (e.g. happy, anxious)" className="px-2 py-1 rounded border" />
            <div className="text-sm text-gray-500">{status}</div>
            <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={handleSave}>Save</button>
            <button className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4">
          <aside className="overflow-y-auto h-full">
            <TemplatesManager onInsert={insertTemplate} />
          </aside>

          <div className="h-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <RichNoteEditor value={content} onChange={setContent} noteId={entryId} onEditorReady={handleEditorReady} />
          </div>
        </div>
      </div>
    </div>
  );
}
```