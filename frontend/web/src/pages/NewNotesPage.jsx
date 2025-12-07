import React, { useEffect, useRef, useState } from "react";
import RichNoteEditor from "../components/RichNoteEditor";
import apiClient from "../services/apiClient";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

export const NewNotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const autoSaveTimerRef = useRef(null);
  const isDirtyRef = useRef(false);
  const initialLoadRef = useRef(true);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await apiClient.get("/notes");
      const data = resp.data;
      const items = Array.isArray(data) ? data : data?.items || [];
      setNotes(items);
    } catch (err) {
      console.error("Failed to load notes", err);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = (note) => {
    setSelectedNoteId(note.id);
    setTitleInput(note.title || "");
    setContentInput(note.content || "");
    initialLoadRef.current = true;
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setTitleInput("");
    setContentInput("");
    initialLoadRef.current = true;
  };

  const handleSaveNote = async () => {
    setError("");

    if (!titleInput.trim() && !contentInput.trim()) {
      setError("Note cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      if (selectedNoteId == null) {
        const resp = await apiClient.post(`/notes`, {
          title: titleInput,
          content: contentInput,
        });
        const created = resp.data;
        setNotes((prev) => [created, ...prev]);
        setSelectedNoteId(created.id);
      } else {
        const resp = await apiClient.put(`/notes/${selectedNoteId}`, {
          title: titleInput,
          content: contentInput,
        });
        const updated = resp.data;
        setNotes((prev) =>
          prev.map((n) => (n.id === updated.id ? updated : n))
        );
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 800);
    } catch (err) {
      console.error("Save note failed", err);
      setError(err.message || "Save note failed");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const scheduleAutoSave = () => {
    if (!titleInput.trim() && !contentInput.trim()) return;

    isDirtyRef.current = true;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (isDirtyRef.current) {
        autoSaveNote();
      }
    }, 1200);
  };

  const autoSaveNote = async () => {
    try {
      setStatus("autosaving");
      isDirtyRef.current = false;

      if (selectedNoteId == null) {
        const resp = await apiClient.post(`/notes`, {
          title: titleInput || "Untitled",
          content: contentInput ?? "",
        });
        const created = resp.data;
        setNotes((prev) => [created, ...prev]);
        setSelectedNoteId(created.id);
      } else {
        const resp = await apiClient.put(`/notes/${selectedNoteId}`, {
          title: titleInput || "Untitled",
          content: contentInput ?? "",
        });
        const updated = resp.data;
        setNotes((prev) =>
          prev.map((n) => (n.id === updated.id ? updated : n))
        );
      }

      setStatus("saved");
      setTimeout(() => {
        if (status !== "error" && !isListening) {
          setStatus("idle");
        }
      }, 800);
    } catch (err) {
      console.error("Auto-save failed", err);
      setError("Auto-save failed. Changes may not be saved.");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    scheduleAutoSave();
  }, [titleInput, contentInput, selectedNoteId]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleDictation = () => {
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("listening");
      setError("");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setError("Dictation error: " + event.error);
      setIsListening(false);
      setStatus("error");
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status === "listening") setStatus("idle");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        }
      }
      if (finalText) {
        setContentInput((prev) => (prev ? prev + " " + finalText : finalText));
      }
    };

    recognition.start();
  };

  const renderStatusLabel = () => {
    if (status === "loading") return "Loading…";
    if (status === "autosaving") return "Saving…";
    if (status === "saved") return "Saved";
    if (status === "error") return "Error";
    if (status === "listening") return "Listening…";
    return "All changes saved";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex rounded-2xl border border-slate-300/70 dark:border-slate-800/70 overflow-hidden bg-slate-50 dark:bg-slate-950 shadow-2xl shadow-black/30 dark:shadow-black/60">
      <section className="flex-1 flex flex-col bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-900/90 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/90 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Pages
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-500">
                  {`${notes.length} notes`}
                </div>
              </div>
              <button
                onClick={handleNewNote}
                className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500 text-slate-950 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
              {notes.length === 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-500 px-1 py-2">
                  "No notes yet. Click New to create one."
                </div>
              )}

              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelectNote(n)}
                  className={[
                    "w-full text-left px-2.5 py-1.5 rounded-lg border transition",
                    selectedNoteId === n.id
                      ? "bg-indigo-500/80 border-indigo-300 text-slate-50 shadow-sm shadow-indigo-500/40"
                      : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  <div className="text-xs font-semibold truncate">
                    {n.title || "Untitled"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {n.content || "No content"}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-transparent">
            {error && (
              <div className="m-3 rounded-md border border-red-400/70 bg-red-500/10 px-3 py-2 text-xs text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="flex-1 flex flex-col m-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/95 shadow-xl shadow-slate-300/40 dark:shadow-slate-900/70">
              <input
                className="w-full border-b border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-base font-semibold text-slate-900 dark:text-slate-50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Page title"
              />
              <RichNoteEditor
                className="flex-1 w-full bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={contentInput}
                onChange={setContentInput}
                placeholder="Start typing your notes here… or use dictation."
              />
            </div>

            <div className="flex items-center justify-between px-4 pb-3 gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-950/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Notes are private to your account. Teachers and universities
                only see what you explicitly submit.
              </span>
              <button
                onClick={handleSaveNote}
                disabled={saving}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500 text-slate-50 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-500/40"
              >
                {saving ? "Saving…" : "Save now"}
              </button>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};

export default NewNotesPage;