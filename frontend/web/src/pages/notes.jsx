import React, { useEffect, useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import RichNoteEditor from "../components/RichNoteEditor";
import apiClient from "../services/apiClient";
import { useSidebarSync } from "../hooks/useSidebarSync";
import { motion, AnimatePresence } from "framer-motion";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

export const NotesPage = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // manual save button state
  const [status, setStatus] = useState("idle"); // idle | loading | autosaving | saved | error | listening
  const [error, setError] = useState("");

  // autosave debounce
  const autoSaveTimerRef = useRef(null);
  const isDirtyRef = useRef(false);
  const initialLoadRef = useRef(true);

  // dictation
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadNotebooks();
  }, []);

  // Real-time Sidebar Sync
  const { hasNewSharedContent, setHasNewSharedContent } = useSidebarSync((payload) => {
    console.log("Real-time Refresh Triggered via STOMP", payload);
    loadNotebooks();
    // Optional: show toast/notification logic here
  });

  const loadNotebooks = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await apiClient.get("/notebooks");
      const data = resp.data;
      const items = Array.isArray(data) ? data : data?.items || [];
      setNotebooks(items);
    } catch (err) {
      console.error("Failed to load notebooks", err);
      setError("Failed to load notebooks");
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (notebookId) => {
    try {
      const resp = await apiClient.get(`/notebooks/${notebookId}/sections`);
      const data = resp.data;
      const items = Array.isArray(data) ? data : data?.items || [];
      setSections(items);
    } catch (err) {
      console.error("Failed to load sections", err);
      setError("Failed to load sections");
    }
  };

  const loadNotes = async (sectionId) => {
    try {
      const resp = await apiClient.get(`/sections/${sectionId}/notes`);
      const data = resp.data;
      const items = Array.isArray(data) ? data : data?.items || [];
      setNotes(items);
    } catch (err) {
      console.error("Failed to load notes", err);
      setError("Failed to load notes");
    }
  };

  const handleSelectNotebook = async (notebookId) => {
    setSelectedNotebookId(notebookId);
    setSelectedSectionId(null);
    setSections([]);
    setNotes([]);
    setSelectedNoteId(null);
    setTitleInput("");
    setContentInput("");
    await loadSections(notebookId);
  };

  const handleSelectSection = async (sectionId) => {
    setSelectedSectionId(sectionId);
    setNotes([]);
    setSelectedNoteId(null);
    setTitleInput("");
    setContentInput("");
    await loadNotes(sectionId);
  };

  const handleSelectNote = (note) => {
    setSelectedNoteId(note.id);
    setTitleInput(note.title || "");
    setContentInput(note.content || "");
    initialLoadRef.current = true; // avoid autosave immediately on load
  };

  const handleCreateNotebook = async () => {
    const title = prompt("Notebook name?");
    if (!title) return;
    try {
      const resp = await apiClient.post("/notebooks", { title });
      const created = resp.data;
      setNotebooks((prev) => [created, ...prev]);
      await handleSelectNotebook(created.id);
    } catch (err) {
      console.error("Create notebook failed", err);
      setError("Create notebook failed");
    }
  };

  const handleCreateSection = async () => {
    if (!selectedNotebookId) {
      alert("Select a notebook first.");
      return;
    }
    const title = prompt("Section name?");
    if (!title) return;
    try {
      const resp = await apiClient.post(
        `/notebooks/${selectedNotebookId}/sections`,
        { title }
      );
      const created = resp.data;
      setSections((prev) => [...prev, created]);
    } catch (err) {
      console.error("Create section failed", err);
      setError("Create section failed");
    }
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setTitleInput("");
    setContentInput("");
    initialLoadRef.current = true;
  };

  const ensureSectionId = async () => {
    if (!selectedNotebookId) {
      throw new Error("Select a notebook first");
    }

    if (selectedSectionId) {
      return selectedSectionId;
    }

    if (sections.length > 0) {
      const first = sections[0];
      setSelectedSectionId(first.id);
      return first.id;
    }

    try {
      const resp = await apiClient.post(
        `/notebooks/${selectedNotebookId}/sections`,
        { title: "General" }
      );
      const created = resp.data;
      setSections((prev) => [...prev, created]);
      setSelectedSectionId(created.id);
      return created.id;
    } catch (err) {
      console.error("Auto-create section failed", err);
      throw new Error("Failed to auto-create section");
    }
  };

  // Manual save (button)
  const handleSaveNote = async () => {
    setError("");

    if (!titleInput.trim() && !contentInput.trim()) {
      setError("Note cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      let sectionId = selectedSectionId;
      if (selectedNoteId == null) {
        sectionId = await ensureSectionId();
      }

      if (selectedNoteId == null) {
        const resp = await apiClient.post(`/sections/${sectionId}/notes`, {
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

  // ---- Autosave (debounced) ----
  const scheduleAutoSave = () => {
    if (!selectedNotebookId) return;
    if (!titleInput.trim() && !contentInput.trim()) return; // don't autosave empty note

    isDirtyRef.current = true;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (isDirtyRef.current) {
        autoSaveNote();
      }
    }, 1200); // 1.2s after last change
  };

  const autoSaveNote = async () => {
    try {
      if (!selectedNotebookId) return;
      setStatus("autosaving");
      isDirtyRef.current = false;

      let sectionId = selectedSectionId;
      if (selectedNoteId == null) {
        sectionId = await ensureSectionId();
      }

      if (selectedNoteId == null) {
        const resp = await apiClient.post(`/sections/${sectionId}/notes`, {
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

  // Trigger autosave when content changes (but not immediately after selecting a note)
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    scheduleAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleInput, contentInput, selectedNotebookId, selectedSectionId, selectedNoteId]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // ---- Dictation (speech to text) ----
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

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    if (result.source.droppableId === 'notes') {
      const items = Array.from(notes);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setNotes(items);

      const noteIds = items.map((item) => item.id);
      apiClient.post('/notes/reorder', { noteIds });
    } else if (result.source.droppableId === 'sections') {
      const items = Array.from(sections);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setSections(items);

      const sectionIds = items.map((item) => item.id);
      apiClient.post(`/notebooks/${selectedNotebookId}/sections/reorder`, { sectionIds });
    }
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
      {/* Left notebooks column */}
      <aside className="w-56 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
              Notebooks
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-500">
              {loading ? "Loading..." : `${notebooks.length} total`}
            </div>
          </div>
          <button
            onClick={handleCreateNotebook}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500 text-xs font-bold text-slate-950 shadow-md shadow-indigo-500/40 hover:bg-indigo-400"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {notebooks.length === 0 && !loading && (
            <div className="text-xs text-slate-500 dark:text-slate-500 px-1 py-2">
              No notebooks yet. Click + to create one.
            </div>
          )}

          {notebooks.map((nb) => (
            <button
              key={nb.id}
              onClick={() => {
                handleSelectNotebook(nb.id);
                if (nb.title === "Shared Notes") setHasNewSharedContent(false);
              }}
              className={[
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition relative",
                selectedNotebookId === nb.id
                  ? "bg-indigo-500/20 border border-indigo-400/80"
                  : "hover:bg-slate-200/70 dark:hover:bg-slate-800/70 border border-transparent",
                nb.title === "Shared Notes" && hasNewSharedContent ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950 animate-pulse" : ""
              ].join(" ")}
            >
              <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-emerald-400" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {nb.title}
                  {nb.title === "Shared Notes" && hasNewSharedContent && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                    />
                  )}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500">
                  {nb.title === "Shared Notes" ? "Shared with you" : "Notebook"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Right side */}
      <section className="flex-1 flex flex-col bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-900/90 dark:via-slate-950 dark:to-slate-950">
        {/* Sections bar */}
        <header className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
          <Droppable droppableId="sections" direction="horizontal">
            {(provided) => (
              <div
                className="flex items-center gap-3 overflow-x-auto"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide border-r border-slate-300 dark:border-slate-700 pr-3">
                  Sections
                </span>

                {!selectedNotebookId && (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    Select a notebook to see sections.
                  </span>
                )}

                {selectedNotebookId && sections.length === 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    No sections yet. We&apos;ll create &quot;General&quot; when
                    you save your first note.
                  </span>
                )}

                {sections.map((sec, index) => (
                  <Draggable key={sec.id} draggableId={`section-${sec.id}`} index={index}>
                    {(provided) => (
                      <button
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => handleSelectSection(sec.id)}
                        className={[
                          "px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                          selectedSectionId === sec.id
                            ? "bg-fuchsia-500 text-slate-50 border-fuchsia-300 shadow-md shadow-fuchsia-500/40"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800",
                        ].join(" ")}
                      >
                        {sec.title}
                      </button>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="flex items-center gap-3">
            {/* Status pill */}
            <span
              className={[
                "hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] border",
                status === "autosaving"
                  ? "border-amber-400/70 text-amber-700 dark:text-amber-300"
                  : status === "error"
                    ? "border-red-400/70 text-red-700 dark:text-red-300"
                    : status === "listening"
                      ? "border-emerald-400/70 text-emerald-600 dark:text-emerald-300"
                      : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400",
              ].join(" ")}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {renderStatusLabel()}
            </span>

            {/* Dictation button */}
            <button
              onClick={toggleDictation}
              className={[
                "px-3 py-1 rounded-full text-xs font-medium border transition flex items-center gap-1",
                isListening
                  ? "bg-red-500 text-white border-red-500 shadow shadow-red-500/40"
                  : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-current" />
              {isListening ? "Stop dictation" : "Dictation"}
            </button>

            <button
              onClick={handleCreateSection}
              disabled={!selectedNotebookId}
              className="px-3 py-1 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Section
            </button>
          </div>
        </header>

        {/* Content: pages + editor */}
        <div className="flex flex-1 overflow-hidden">
          {/* Pages list */}
          <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/90 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Pages
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-500">
                  {selectedNotebookId
                    ? sections.length === 0
                      ? "No sections yet"
                      : `${notes.length} notes`
                    : "Pick a notebook"}
                </div>
              </div>
              <button
                onClick={handleNewNote}
                disabled={!selectedNotebookId}
                className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500 text-slate-950 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                New
              </button>
            </div>

            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="notes">
                {(provided) => (
                  <div
                    className="flex-1 overflow-y-auto px-2 py-1 space-y-1"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {(!selectedNotebookId || notes.length === 0) && (
                      <div className="text-xs text-slate-500 dark:text-slate-500 px-1 py-2">
                        {!selectedNotebookId
                          ? "Select or create a notebook to start writing."
                          : "No notes in this section yet. Click New to create one."}
                      </div>
                    )}

                    {notes.map((n, index) => (
                      <Draggable key={n.id} draggableId={n.id.toString()} index={index}>
                        {(provided) => (
                          <button
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleSelectNote(n)}
                            className={[
                              "w-full text-left px-2.5 py-1.5 rounded-lg border transition",
                              selectedNoteId === n.id
                                ? "bg-indigo-500/80 border-indigo-300 text-slate-50 shadow-sm shadow-indigo-500/40"
                                : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800",
                            ].join(" ")}
                          >
                            <div className="flex justify-between items-start">
                              <div className="text-xs font-semibold truncate">
                                {n.title || "Untitled"}
                              </div>
                              {n.is_pinned && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                </svg>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {n.content?.substring(0, 100) || "No content"}
                            </div>
                          </button>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </aside>

          {/* Editor */}
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
                placeholder={
                  selectedNotebookId
                    ? "Page title"
                    : "Select or create a notebook to begin"
                }
              />
              <RichNoteEditor
                className="flex-1 w-full bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={contentInput}
                onChange={setContentInput}
                noteId={selectedNoteId}
                onRestore={() => handleSelectNote(notes.find(n => n.id === selectedNoteId))}
                placeholder={
                  selectedNotebookId
                    ? "Start typing your notes here… or use dictation."
                    : "Your notebook content will appear here."
                }
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
                disabled={saving || !selectedNotebookId}
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
}

export default NotesPage;

