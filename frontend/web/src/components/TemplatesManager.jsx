// src/components/TemplatesManager.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

export default function TemplatesManager({ onInsert }) {
  const [templates, setTemplates] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await apiClient.get("/templates");
      setTemplates(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function saveTemplate() {
    if (!title || !content) return alert("Title and content required");
    try {
      await apiClient.post("/templates", { title, content });
      setTitle(""); setContent("");
      load();
    } catch (e) { console.error(e); alert("Failed to save template"); }
  }

  async function removeTemplate(id) {
    if (!confirm("Delete template?")) return;
    try { await apiClient.delete(`/templates/${id}`); load(); } catch (e) { console.error(e); alert("Failed"); }
  }

  return (
    <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Templates</div>
        <div className="text-xs text-gray-500">{templates.length}</div>
      </div>

      <div className="space-y-2 mb-3">
        {templates.map(t => (
          <div key={t.id} className="flex items-start justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
            <div className="min-w-0">
              <div className="font-medium truncate">{t.title}</div>
              <div className="text-xs text-gray-500 truncate">{(t.content || "").slice(0, 100)}</div>
            </div>
            <div className="ml-3 flex flex-col gap-1">
              <button className="px-2 py-1 rounded border text-sm" onClick={() => onInsert(t.content)}>Insert</button>
              <button className="px-2 py-1 rounded border text-sm" onClick={() => removeTemplate(t.id)}>Delete</button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <div className="text-sm text-gray-500">No templates yet</div>}
      </div>

      <div className="pt-2 border-t">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Template title" className="w-full px-2 py-1 rounded border mb-2" />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Template content (Markdown allowed)" rows={4} className="w-full px-2 py-1 rounded border mb-2" />
        <div className="flex justify-end">
          <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={saveTemplate} disabled={loading}>Save template</button>
        </div>
      </div>
    </div>
  );
}
