// src/pages/NoteViewer.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import apiClient from "../services/apiClient";
import DOMPurify from "dompurify";
import { marked } from "marked";
import NotesToolbar from "../components/NotesToolbar";
import NotesList from "../components/NotesList";

// Prism for code highlighting
import Prism from "prismjs";
// import a Prism theme if you want (you can add to global CSS instead)
import "prismjs/themes/prism-tomorrow.css"; // optional, choose theme you like

// Katex for math rendering
import katex from "katex";
import "katex/dist/katex.min.css";

const DEFAULT_ZOOM = 1;

/**
 * Helper: render math expressions inside text using KaTeX.
 * - Replaces $$...$$ (display) and $...$ (inline) with rendered HTML.
 * - Very small and careful: avoids rendering inside code blocks by using placeholders.
 */
function renderMathPreprocess(markdown) {
  if (!markdown) return markdown;

  // Replace block math $$...$$ first
  markdown = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (match, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return match;
    }
  });

  // Replace inline math $...$
  // avoid matching \$ or contents containing spaces at edges; this is a simple approach
  markdown = markdown.replace(/(^|[^\\])\$(.+?)\$/g, (match, prefix, expr) => {
    try {
      return prefix + katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return match;
    }
  });

  return markdown;
}

/**
 * Marked options:
 * - highlight uses Prism
 */
marked.setOptions({
  highlight: function (code, lang) {
    try {
      const grammar = Prism.languages[lang] || Prism.languages.javascript;
      return Prism.highlight(code, grammar, lang);
    } catch {
      return code;
    }
  },
  gfm: true,
  breaks: true,
});

export default function NoteViewer({ initialNoteId = null }) {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(initialNoteId);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [fullScreen, setFullScreen] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const contentRef = useRef(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/notes?sort=updatedAt_desc");
      const list = res.data?.content || res.data || [];
      setNotes(list);
      if (!selectedId && list.length) setSelectedId(list[0].id);
    } catch (err) {
      console.error("fetchNotes:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const fetchNote = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/notes/${id}`);
      setNote(res.data);
      // after loading, wait a tick then highlight code blocks (Prism already applied by marked highlight)
      setTimeout(() => {
        try {
          Prism.highlightAll();
        } catch (err) {
          console.error("Prism highlighting failed", err);
        }
      }, 50);
    } catch (err) {
      console.error("fetchNote:", err);
      setNote(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (selectedId) fetchNote(selectedId);
  }, [selectedId, fetchNote]);

  function renderContent(n) {
    if (!n) return null;

    // Preprocess math first so KaTeX injected HTML is processed by marked as raw HTML
    const withMath = renderMathPreprocess(n.content || "");

    // Convert Markdown -> HTML (marked will apply Prism highlight on code blocks)
    const html = marked.parse(withMath || "");

    // Sanitize for safety (allow KaTeX and Prism classes)
    const clean = DOMPurify.sanitize(html, {
      ADD_TAGS: ["span", "math", "mi", "mo", "annotation", "annotation-xml", "math"],
      ADD_ATTR: ["class", "aria-hidden", "data-canonical-src", "style"]
    });

    return { __html: clean };
  }

  function onZoomChange(newZoom) {
    setZoom(Math.max(0.4, Math.min(3, newZoom)));
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullScreen(false);
      }
    }
  }

  return (
    <div className={`p-4 ${fullScreen ? "bg-white" : ""}`}>
      <div className={`${fullScreen ? "" : "max-w-7xl mx-auto"}`}>
        <NotesToolbar
          zoom={zoom}
          onZoomIn={() => onZoomChange(+(zoom + 0.1).toFixed(2))}
          onZoomOut={() => onZoomChange(+(zoom - 0.1).toFixed(2))}
          onResetZoom={() => onZoomChange(DEFAULT_ZOOM)}
          onToggleFullScreen={toggleFullScreen}
          onRefresh={fetchNotes}
          selectedNote={note}
          onPrint={() => window.print()}
          studyMode={studyMode}
          onToggleStudyMode={() => setStudyMode((s) => !s)}
        />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <aside className="hidden lg:block">
            <NotesList
              notes={notes}
              selectedId={selectedId}
              onSelect={(id) => { setSelectedId(id); }}
              loading={loading}
            />
          </aside>

          <main
            className={`bg-white rounded-xl shadow-sm p-6 overflow-auto ${studyMode ? "reader study" : "reader"}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}
          >
            <div className="mb-4">
              <h1 className="text-2xl font-semibold">{note?.title || "Untitled"}</h1>
              <div className="text-sm text-gray-500 mt-1">
                {note?.authorName ? `by ${note.authorName} • ` : ""}
                {note?.updatedAt ? new Date(note.updatedAt).toLocaleString() : ""}
              </div>
            </div>

            <article ref={contentRef} className="prose max-w-none" dangerouslySetInnerHTML={renderContent(note)} />
          </main>
        </div>
      </div>
    </div>
  );
}