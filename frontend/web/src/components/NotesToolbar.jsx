// src/components/NotesToolbar.jsx
import React from "react";

export default function NotesToolbar({
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleFullScreen,
  onRefresh,
  onPrint,
  selectedNote,
  studyMode,
  onToggleStudyMode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded-md border" title="Refresh" onClick={onRefresh}>⟳</button>
        <button className="px-3 py-2 rounded-md border" onClick={onPrint}>Print</button>
        <div className="ml-3 p-2 rounded-md text-sm text-gray-600 dark:text-slate-300">
          {selectedNote ? <span>{selectedNote.title}</span> : <span>No note selected</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">Zoom</div>
          <button className="px-2 py-1 rounded-md border" onClick={onZoomOut} title="Zoom out">−</button>
          <div className="px-3 py-1 border rounded-md text-sm">{Math.round(zoom * 100)}%</div>
          <button className="px-2 py-1 rounded-md border" onClick={onZoomIn} title="Zoom in">+</button>
          <button className="px-3 py-1 ml-2 rounded-md border" onClick={onResetZoom} title="Reset zoom">Reset</button>
        </div>

        <button
          onClick={onToggleStudyMode}
          className={`px-3 py-2 rounded-md border ${studyMode ? "bg-amber-100 dark:bg-amber-900/30" : ""}`}
          title="Toggle Study Mode (narrow measure, larger type)"
        >
          {studyMode ? "Study Mode" : "Reader"}
        </button>

        <button className="ml-2 px-3 py-2 rounded-md bg-indigo-600 text-white" onClick={onToggleFullScreen}>Fullscreen</button>
      </div>
    </div>
  );
}