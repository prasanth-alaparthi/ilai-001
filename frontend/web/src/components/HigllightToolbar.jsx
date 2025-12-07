// src/components/HighlightToolbar.jsx
import React, { useState } from "react";

const COLORS = [
  { name: "Yellow", value: "#fff176" },
  { name: "Green", value: "#c8e6c9" },
  { name: "Pink", value: "#f8bbd0" },
  { name: "Blue", value: "#bbdefb" },
];

export default function HighlightToolbar({ onSave }) {
  const [color, setColor] = useState(COLORS[0].value);

  function captureSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      alert("Select some text to highlight");
      return;
    }
    const text = sel.toString();
    // try to compute offsets — approximate by searching in full content (caller can refine)
    onSave({ textExcerpt: text, color });
  }

  return (
    <div className="p-2 border rounded-md bg-white dark:bg-slate-800 flex items-center gap-2">
      <select value={color} onChange={(e)=>setColor(e.target.value)} className="px-2 py-1 rounded border">
        {COLORS.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
      </select>
      <button className="px-3 py-1 rounded border" onClick={captureSelection}>Save Highlight</button>
    </div>
  );
}