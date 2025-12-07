// src/pages/NoteViewerFull.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import DOMPurify from "dompurify";
import { marked } from "marked";
import Prism from "../lib/prism"; // Updated Prism import
import "prismjs/themes/prism-tomorrow.css";
import "katex/dist/katex.min.css";
import katex from "katex";

const DEFAULT_ZOOM = 1;

function renderMathPreprocess(markdown) {
  if (!markdown) return markdown;
  markdown = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (m, expr) => {
    try { return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }); }
    catch { return m; }
  });
  markdown = markdown.replace(/(^|[^\\])\$(.+?)\$/g, (m, p, expr) => {
    try { return p + katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }); }
    catch { return m; }
  });
  return markdown;
}

export default function NoteViewerFull() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [notesList, setNotesList] = useState([]);
  // loading state removed as it was unused
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [studyMode, setStudyMode] = useState(false);
  const [ttsState, setTtsState] = useState("idle"); // idle|playing|paused
  const utterRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => { loadList(); }, []); // load titles for left rail
  useEffect(() => { if (id) loadNote(id); }, [id]);

  async function loadList() {
    try {
      const res = await apiClient.get("/notes?size=50");
      const list = res.data?.content || res.data || [];
      setNotesList(list);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (note) {
      Prism.highlightAll();
    }
  }, [note]);

  async function loadNote(noteId) {
    try {
      const res = await apiClient.get(`/notes/${noteId}`);
      setNote(res.data);
    } catch (e) {
      console.error(e);
      setNote(null);
    }
  }

  function renderContent(n) {
    if (!n) return { __html: "" };
    const withMath = renderMathPreprocess(n.content || "");
    const html = marked.parse(withMath || "");
    const clean = DOMPurify.sanitize(html, { ADD_TAGS: ["span", "math", "mi"], ADD_ATTR: ["class", "style"] });
    return { __html: clean };
  }

  function toggleFullScreen() {
    const el = document.getElementById("note-viewer-full-root");
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch((e) => { console.error("Error entering fullscreen", e); });
    else document.exitFullscreen?.().catch((e) => { console.error("Error exiting fullscreen", e); });
  }

  function playTts(text) {
    if (!("speechSynthesis" in window)) return alert("Speech synthesis not available");
    stopTts();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1.0;
    u.onend = () => setTtsState("idle");
    utterRef.current = u;
    synthRef.current.speak(u);
    setTtsState("playing");
  }
  function pauseTts() {
    if (synthRef.current.speaking) { synthRef.current.pause(); setTtsState("paused"); }
  }
  function resumeTts() {
    if (synthRef.current.paused) { synthRef.current.resume(); setTtsState("playing"); }
  }
  function stopTts() {
    try { synthRef.current.cancel(); } catch (e) { console.error("Error canceling TTS", e); }
    utterRef.current = null;
    setTtsState("idle");
  }

  async function fetchSummary() {
    if (!note?.id) return;
    try {
      const res = await apiClient.get(`/notes/${note.id}/summary`);
      // backend stub returns { summary, status, message }
      if (res.data && (res.data.summary || res.data.status)) {
        return res.data;
      }
      return { summary: null, status: "not-available" };
    } catch (e) {
      console.error(e);
      return { summary: null, status: "error", message: e.message };
    }
  }

  // keyboard zoom and fullscreen
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && (e.key === "+" || e.key === "=")) { e.preventDefault(); setZoom(z => Math.min(3, +(z + 0.1).toFixed(2))); }
      if (e.ctrlKey && (e.key === "-" || e.key === "_")) { e.preventDefault(); setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(2))); }
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); toggleFullScreen(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div id="note-viewer-full-root" className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left rail: list */}
        <aside className="hidden lg:block">
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Notes</h3>
              <button className="text-sm text-slate-500" onClick={() => loadList()}>Refresh</button>
            </div>
            <div className="space-y-2 max-h-[72vh] overflow-auto">
              {notesList.map(n => (
                <button key={n.id} className={`w-full text-left p-2 rounded ${n.id === note?.id ? "bg-indigo-50" : "hover:bg-slate-50"}`} onClick={() => navigate(`/notes/${n.id}/view`)}>
                  <div className="font-medium truncate">{n.title}</div>
                  <div className="text-xs text-slate-500 truncate">{(n.excerpt || (n.content || "").slice(0, 100))}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className={`bg-white rounded-xl shadow p-6 overflow-auto ${studyMode ? "reader study" : "reader"}`} style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold">{note?.title || "Untitled"}</h1>
              <div className="text-sm text-slate-500 mt-1">{note?.authorName ? `by ${note.authorName}` : ""} {note?.updatedAt ? ` • ${new Date(note.updatedAt).toLocaleString()}` : ""}</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-600">Zoom {Math.round(zoom * 100)}%</div>
              <button className="px-2 py-1 border rounded" onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(2)))}>−</button>
              <button className="px-2 py-1 border rounded" onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}>+</button>
              <button className="px-2 py-1 border rounded" onClick={() => setZoom(DEFAULT_ZOOM)}>Reset</button>

              <button className={`px-3 py-1 rounded border ${studyMode ? "bg-amber-100" : ""}`} onClick={() => setStudyMode(s => !s)}>{studyMode ? "Study Mode" : "Reader"}</button>
              <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={() => toggleFullScreen()}>Fullscreen</button>
            </div>
          </div>

          {/* AI & TTS controls */}
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <button className="px-3 py-1 rounded border" onClick={async () => {
              const r = await fetchSummary();
              if (r?.summary) {
                // small modal-ish behaviour: show summary in alert for now
                alert("Summary:\n\n" + r.summary);
              } else {
                alert(r?.message || "Summary not available (AI not enabled).");
              }
            }}>Summarize</button>

            <button className="px-3 py-1 rounded border" onClick={() => playTts((note?.title || "") + ". " + (note?.content || ""))}>Play</button>
            <button className="px-3 py-1 rounded border" onClick={() => pauseTts()}>Pause</button>
            <button className="px-3 py-1 rounded border" onClick={() => resumeTts()}>Resume</button>
            <button className="px-3 py-1 rounded border" onClick={() => stopTts()}>Stop</button>
            <div className="text-xs text-slate-500 ml-2">TTS: {ttsState}</div>
          </div>

          {/* Note content */}
          <article className="prose max-w-none" dangerouslySetInnerHTML={renderContent(note)} />

          {/* Footer small actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">Tip: Ctrl/Cmd + +/- to zoom, Ctrl/Cmd+F to fullscreen</div>
            <div>
              <button className="px-3 py-1 rounded border mr-2" onClick={() => navigate(-1)}>Back</button>
              <button className="px-3 py-1 rounded border" onClick={() => navigate(`/notes/${note?.id}/edit`)}>Edit</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}