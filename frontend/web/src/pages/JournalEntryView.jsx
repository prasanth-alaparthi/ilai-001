// src/pages/JournalEntryView.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import DOMPurify from "dompurify";
import { marked } from "marked";
import jsPDF from "jspdf";
import "katex/dist/katex.min.css";
import katex from "katex";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-cpp";
import HighlightToolbar from "../components/HighlightToolbar";
import HighlightsList from "../components/HighlightsList";
import ShareButton from "../components/ShareButton";
import FlashcardDrill from "../components/FlashcardDrill";


function renderMath(markdown) {
  if (!markdown) return markdown;
  markdown = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (m, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return m;
    }
  });
  markdown = markdown.replace(/(^|[^\\])\\(.+?)\\/g, (m, p, expr) => {
    try {
      return p + katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return m;
    }
  });
  return markdown;
}

export default function JournalEntryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [zoom, setZoom] = useState(1);
  const utterRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const [highlights, setHighlights] = useState([]);
  const [flashDrillOpen, setFlashDrillOpen] = useState(false);

  useEffect(() => { if (id) loadEntry(id); }, [id]);
  useEffect(() => { if (entry?.id) loadHighlights(entry.id); }, [entry]);

  async function loadEntry(eid) {
    try {
      const res = await apiClient.get(`/journals/${eid}`);
      setEntry(res.data);
      setTimeout(() => { try { Prism.highlightAll(); } catch (err) { console.error("Prism highlighting failed:", err); } }, 50);
    } catch (e) { console.error(e); setEntry(null); }
  }

  async function loadHighlights(jid) {
    try {
      const res = await apiClient.get(`/journals/${jid}/highlights`);
      setHighlights(res.data || []);
    } catch (e) { console.error(e); }
  }

  async function saveHighlight(payload) {
    // payload: {textExcerpt, color}
    try {
      await apiClient.post(`/journals/${entry.id}/highlights`, payload);
      loadHighlights(entry.id);
      alert("Highlight saved");
    } catch (e) { console.error(e); alert("Failed to save highlight"); }
  }

  async function deleteHighlight(hid) {
    try {
      await apiClient.delete(`/journals/${entry.id}/highlights/${hid}`);
      loadHighlights(entry.id);
    } catch (e) { console.error(e); alert("Failed to delete"); }
  }

  function renderContent(ent) {
    if (!ent) return { __html: "" };
    const withMath = renderMath(ent.content || "");
    const html = marked.parse(withMath || "");
    const clean = DOMPurify.sanitize(html, { ADD_TAGS: ["math", "mi"], ADD_ATTR: ["class", "style"] });
    return { __html: clean };
  }

  function playTts(text) {
    if (!("speechSynthesis" in window)) return alert("TTS not supported");
    stopTts();
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => { };
    utterRef.current = u; synthRef.current.speak(u);
  }
  function pauseTts() { if (synthRef.current.speaking) { synthRef.current.pause(); } }

  function stopTts() { try { synthRef.current.cancel(); } catch (err) { console.error("Error stopping TTS:", err); } utterRef.current = null; }

  function exportPdf() {
    if (!entry) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18); doc.text(entry.title || "Journal", 40, 60);
    doc.setFontSize(12);
    const lines = (entry.content || "").split("\n");
    let y = 90;
    lines.forEach(line => {
      doc.text(line.replace(/\r/g, ''), 40, y);
      y += 14; if (y > 750) { doc.addPage(); y = 40; }
    });
    doc.save(`${(entry.title || "journal").slice(0, 40)}.pdf`);
  }

  function exportTxt() {
    if (!entry) return;
    const txt = `${entry.title || ""}\n\n${entry.content || ""}`;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(entry.title || "journal").replace(/\s+/g, '_').slice(0, 40)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDiscuss() {
    if (!entry) return;
    try {
      // Check if conversation exists
      const res = await apiClient.get(`/chat/conversations?contextType=JOURNAL&contextId=${entry.id}`);
      let conversation = res.data && res.data.length > 0 ? res.data[0] : null;

      if (!conversation) {
        // Create new
        const createRes = await apiClient.post("/chat/conversations", {
          type: "GROUP",
          name: entry.title || "Journal Discussion",
          contextType: "JOURNAL",
          contextId: entry.id,
          participantIds: []
        });
        conversation = createRes.data;
      }

      navigate(`/chatapp?conversationId=${conversation.id}`);
    } catch (e) {
      console.error("Failed to start discussion", e);
      alert("Failed to start discussion");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6" style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">{entry?.title || "Untitled"}</h1>
            <div className="text-sm text-slate-500 mt-1">{entry?.mood ? `Mood: ${entry.mood}` : ""} {entry?.createdAt ? ` • ${new Date(entry.createdAt).toLocaleString()}` : ""}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600">Zoom {Math.round(zoom * 100)}%</div>
            <button className="px-2 py-1 border rounded" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(2)))}>−</button>
            <button className="px-2 py-1 border rounded" onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(2)))}>+</button>
            <button className="px-2 py-1 border rounded" onClick={() => setZoom(1)}>Reset</button>
            <button className="px-3 py-1 border rounded" onClick={() => playTts((entry?.title || "") + ". " + (entry?.content || ""))}>Play</button>
            <button className="px-3 py-1 border rounded" onClick={() => pauseTts()}>Pause</button>
            <button className="px-3 py-1 border rounded" onClick={() => stopTts()}>Stop</button>
            <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={exportPdf}>Export PDF</button>
            <button className="px-3 py-1 rounded border ml-2" onClick={exportTxt}>Export TXT</button>
            <button className="px-3 py-1 rounded border ml-2 bg-indigo-50 text-indigo-700 border-indigo-200" onClick={handleDiscuss}>Discuss</button>
            <button className="px-3 py-1 rounded border ml-2" onClick={() => setFlashDrillOpen(true)}>Flashcard Drill</button>
          </div>
        </div>

        <HighlightToolbar saveHighlight={saveHighlight} />

        <article className="prose max-w-none" dangerouslySetInnerHTML={renderContent(entry)} />

        <HighlightsList highlights={highlights} deleteHighlight={deleteHighlight} />

        {flashDrillOpen && (
          <FlashcardDrill
            open={flashDrillOpen}
            onClose={() => setFlashDrillOpen(false)}
            // Assuming FlashcardDrill needs entry data for the drill
            entry={entry}
            highlights={highlights}
          />
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-500">Tip: Use headphones for quiet listening.</div>
          <div>
            <button className="px-3 py-1 rounded border mr-2" onClick={() => navigate(-1)}>Back</button>
            <button className="px-3 py-1 rounded border" onClick={() => navigate(`/journal/${entry?.id}/edit`)}>Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
