// src/components/NotesList.jsx
import React from "react";

export default function NotesList({ notes = [], selectedId, onSelect, loading = false }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 h-[80vh] overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Notes</h3>
        <div className="text-xs text-gray-500">{notes.length}</div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {!loading && notes.length === 0 && <div className="text-sm text-gray-500">No notes yet.</div>}

      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => onSelect(n.id)}
              className={`w-full text-left p-2 rounded-md ${n.id === selectedId ? "bg-indigo-50" : "hover:bg-slate-50"}`}
            >
              <div className="font-medium text-sm">{n.title || "Untitled"}</div>
              <div className="text-xs text-gray-500">{n.excerpt || (n.content || "").slice(0, 80)}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}