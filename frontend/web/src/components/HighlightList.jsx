// src/components/HighlightsList.jsx
import React from "react";

export default function HighlightsList({ highlights = [], onDelete }) {
  if (!highlights || highlights.length === 0) return <div className="text-sm text-gray-500 mt-2">No highlights yet</div>;
  return (
    <div className="space-y-2 mt-2">
      {highlights.map(h => (
        <div key={h.id} className="p-2 rounded border flex items-start justify-between" style={{ background: h.color || "transparent" }}>
          <div className="min-w-0">
            <div className="text-sm">{h.textExcerpt}</div>
            <div className="text-xs text-slate-500 mt-1">{new Date(h.createdAt).toLocaleString()}</div>
          </div>
          <div className="ml-2">
            <button className="px-2 py-1 rounded border text-sm" onClick={() => onDelete(h.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}