import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiFolder, FiChevronRight, FiChevronDown, FiChevronLeft,
  FiStar, FiSidebar, FiShare2, FiClock, FiMic, FiLink,
  FiTrash2, FiSearch, FiGrid, FiList, FiCpu, FiAlertCircle, FiDatabase,
  FiEdit2, FiTrash
} from "react-icons/fi";
import { notesService } from "../services/notesService";
import RichNoteEditor from "../components/RichNoteEditor";
import { formatDistanceToNow } from "date-fns";
import CreateNotebookModal from "../components/modals/CreateNotebookModal";
import CreateChapterModal from "../components/modals/CreateChapterModal";
import ShareNoteModal from "../components/modals/ShareNoteModal";
import NoteVersionsModal from "../components/modals/NoteVersionsModal";
import BacklinksModal from "../components/modals/BacklinksModal";
import TranscribeModal from "../components/modals/TranscribeModal";
import ErrorBoundary from "../components/ErrorBoundary";
import AiChat from "../components/AiChat";
import ConfirmationModal from "../components/ui/ConfirmationModal";

const getDisplayTitle = (note, isPlaceholder = false) => {
  if (note.title && note.title.trim() !== "" && note.title !== "Untitled Note") {
    return note.title;
  }
  // Try to extract from content
  try {
    let contentText = "";
    if (typeof note.content === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = note.content;
      contentText = temp.textContent || temp.innerText || "";
    } else if (typeof note.content === 'object' && note.content !== null) {
      // Tiptap JSON
      // Simple extraction: traverse content
      const extractText = (node) => {
        if (node.text) return node.text;
        if (node.content) return node.content.map(extractText).join(" ");
        return "";
      };
      contentText = extractText(note.content);
    }

    if (contentText.trim()) {
      const text = contentText.trim();
      return text.slice(0, 30) + (text.length > 30 ? "..." : "");
    }
  } catch (e) {
    // ignore
  }
  return isPlaceholder ? "Untitled Note" : "Untitled";
}

export default function NotesHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notebooks, setNotebooks] = useState([]);
  const [sections, setChapters] = useState({}); // Map notebookId -> sections
  const [expandedNotebook, setExpandedNotebook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", sidebarOpen);
  }, [sidebarOpen]);
  const [viewMode, setViewMode] = useState("list"); // "list" or "editor"
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // Modals
  const [showCreateNotebook, setShowCreateNotebook] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [notebookForChapter, setNotebookForChapter] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showBacklinksModal, setShowBacklinksModal] = useState(false);
  const [showTranscribeModal, setShowTranscribeModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    isDanger: false,
    showCancel: true,
    confirmText: "Confirm"
  });

  const showAlert = (title, message) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => { },
      isDanger: false,
      showCancel: false,
      confirmText: "OK"
    });
  };

  // Load Notebooks on mount
  useEffect(() => {
    loadNotebooks();
  }, []);

  // Restore state from URL
  useEffect(() => {
    const restoreState = async () => {
      const notebookId = searchParams.get("notebook");
      const chapterId = searchParams.get("chapter");
      const noteId = searchParams.get("note");

      if (notebookId) {
        setExpandedNotebook(notebookId);
        try {
          // Load chapters
          const chaptersData = await notesService.listChapters(notebookId);
          setChapters(prev => ({ ...prev, [notebookId]: chaptersData }));

          if (chapterId) {
            const chapter = chaptersData.find(c => c.id === chapterId);
            if (chapter) {
              setSelectedChapter(chapter);
              // Load notes
              const notesData = await notesService.listNotesInChapter(chapterId);
              setNotes(notesData);

              if (noteId) {
                // Load full note
                try {
                  const fullNote = await notesService.getNote(noteId);
                  setSelectedNote(fullNote);
                  setViewMode("editor");
                } catch (e) {
                  console.error("Failed to load note from URL", e);
                }
              }
            }
          }
        } catch (err) {
          console.error("Failed to restore state", err);
        }
      }
    };
    restoreState();
  }, []); // Run once on mount

  const loadNotebooks = async () => {
    try {
      setError(null);
      const data = await notesService.listNotebooks();
      console.log("Loaded notebooks:", data);
      setNotebooks(data);
    } catch (err) {
      console.error("Failed to load notebooks", err);
      setError("Failed to load notebooks. Please check your connection.");
    }
  };

  const handleSeedData = async () => {
    setConfirmationModal({
      isOpen: true,
      title: "Seed Mock Data",
      message: "Create mock notebooks and sections?",
      showCancel: true,
      confirmText: "Confirm",
      onConfirm: async () => {
        setLoading(true);
        try {
          // Personal
          const personal = await notesService.createNotebook("Personal", "#4f46e5"); // Indigo
          await notesService.createChapter(personal.id, "Ideas");
          await notesService.createChapter(personal.id, "Journal");

          // Work
          const work = await notesService.createNotebook("Work", "#ef4444"); // Red
          await notesService.createChapter(work.id, "Projects");
          await notesService.createChapter(work.id, "Meetings");

          // Learning
          const learning = await notesService.createNotebook("Learning", "#10b981"); // Emerald
          await notesService.createChapter(learning.id, "React");
          await notesService.createChapter(learning.id, "Spring Boot");

          await loadNotebooks(); // Refresh list
          showAlert("Success", "Mock data created!");
        } catch (err) {
          console.error("Failed to seed data", err);
          showAlert("Error", "Failed to seed data: " + (err.response?.data?.message || err.message));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const toggleNotebook = async (notebookId) => {
    if (expandedNotebook === notebookId) {
      setExpandedNotebook(null);
    } else {
      setExpandedNotebook(notebookId);
      if (!sections[notebookId]) {
        // Load sections for this notebook
        try {
          const data = await notesService.listChapters(notebookId);
          console.log(`Loaded sections for notebook ${notebookId}:`, data);
          setChapters(prev => ({ ...prev, [notebookId]: data }));
        } catch (err) {
          console.error("Failed to load sections", err);
          showAlert("Error", "Failed to load sections: " + (err.response?.data?.message || err.message));
        }
      }
    }
  };

  const selectChapter = async (section) => {
    setSelectedChapter(section);
    setSelectedNote(null);
    setViewMode("list");
    setLoading(true);
    setSearchQuery(""); // Clear search when changing section

    const newParams = new URLSearchParams(searchParams);
    const notebookId = Object.keys(sections).find(nid => sections[nid].some(s => s.id === section.id));
    if (notebookId) newParams.set("notebook", notebookId);
    newParams.set("chapter", section.id);
    newParams.delete("note");
    setSearchParams(newParams);
    try {
      const data = await notesService.listNotesInChapter(section.id);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load notes", err);
      showAlert("Error", "Failed to load notes: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const selectNote = async (note) => {
    // Fetch full note content
    try {
      const fullNote = await notesService.getNote(note.id);
      setSelectedNote(fullNote);
      setViewMode("editor");

      const newParams = new URLSearchParams(searchParams);
      if (expandedNotebook) newParams.set("notebook", expandedNotebook);
      if (selectedChapter) newParams.set("chapter", selectedChapter.id);
      newParams.set("note", note.id);
      setSearchParams(newParams);
    } catch (err) {
      console.error("Failed to load note", err);
      showAlert("Error", "Failed to load note content: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateNote = async () => {
    if (!selectedChapter) return;
    try {
      // Send JSON object payload
      const newNote = await notesService.createNote(selectedChapter.id, "Untitled Note", { type: "doc", content: [] });
      setNotes([newNote, ...notes]);
      selectNote(newNote);
    } catch (err) {
      console.error("Failed to create note", err);
      showAlert("Error", "Failed to create note: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateNote = async (content) => {
    if (!selectedNote) return;
    // Update local state so handleTitleChange has latest content
    setSelectedNote(prev => ({ ...prev, content }));
    try {
      await notesService.updateNote(selectedNote.id, selectedNote.title, content);
    } catch (err) {
      console.error("Failed to save note", err);
    }
  };

  const handleTitleChange = async (e) => {
    const newTitle = e.target.value;
    setSelectedNote(prev => ({ ...prev, title: newTitle }));
    try {
      await notesService.updateNote(selectedNote.id, newTitle, selectedNote.content);
      setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, title: newTitle } : n));
    } catch (err) {
      console.error("Failed to save title", err);
    }
  };

  const handleCreateNotebook = async (title, color) => {
    try {
      const newNotebook = await notesService.createNotebook(title, color);
      setNotebooks([...notebooks, newNotebook]);
    } catch (err) {
      console.error("Failed to create notebook", err);
      showAlert("Error", "Failed to create notebook: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateChapter = async (title) => {
    if (!notebookForChapter) return;
    try {
      const newChapter = await notesService.createChapter(notebookForChapter.id, title);
      setChapters(prev => ({
        ...prev,
        [notebookForChapter.id]: [...(prev[notebookForChapter.id] || []), newChapter]
      }));
    } catch (err) {
      console.error("Failed to create section", err);
      showAlert("Error", "Failed to create section: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Notebook Operations ---
  const handleRenameNotebook = async (e, notebook) => {
    e.stopPropagation();
    const newTitle = window.prompt("Enter new notebook name:", notebook.title);
    if (!newTitle || newTitle === notebook.title) return;
    try {
      const updated = await notesService.updateNotebook(notebook.id, newTitle, notebook.color);
      setNotebooks(prev => prev.map(n => n.id === notebook.id ? updated : n));
    } catch (err) {
      console.error("Failed to rename notebook", err);
      showAlert("Error", "Failed to rename notebook.");
    }
  };

  const handleDeleteNotebook = async (e, notebook) => {
    e.stopPropagation();
    setConfirmationModal({
      isOpen: true,
      title: "Delete Notebook",
      message: `Are you sure you want to delete notebook "${notebook.title}"? This will delete all sections and notes inside it.`,
      isDanger: true,
      showCancel: true,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await notesService.deleteNotebook(notebook.id);
          setNotebooks(prev => prev.filter(n => n.id !== notebook.id));
          if (selectedChapter && sections[notebook.id]?.find(s => s.id === selectedChapter.id)) {
            setSelectedChapter(null);
            setNotes([]);
          }
        } catch (err) {
          console.error("Failed to delete notebook", err);
          showAlert("Error", "Failed to delete notebook.");
        }
      }
    });
  };

  // --- Chapter Operations ---
  const handleRenameChapter = async (e, section) => {
    e.stopPropagation();
    const newTitle = window.prompt("Enter new section name:", section.title);
    if (!newTitle || newTitle === section.title) return;
    try {
      const updated = await notesService.updateChapter(section.id, newTitle);
      // Update state deeply
      setChapters(prev => {
        const notebookId = Object.keys(prev).find(nid => prev[nid].some(s => s.id === section.id));
        if (!notebookId) return prev;
        return {
          ...prev,
          [notebookId]: prev[notebookId].map(s => s.id === section.id ? updated : s)
        };
      });
      if (selectedChapter?.id === section.id) {
        setSelectedChapter(updated);
      }
    } catch (err) {
      console.error("Failed to rename section", err);
      showAlert("Error", "Failed to rename section.");
    }
  };

  const handleDeleteChapter = async (e, section) => {
    e.stopPropagation();
    setConfirmationModal({
      isOpen: true,
      title: "Delete Section",
      message: `Are you sure you want to delete section "${section.title}"? This will delete all notes inside it.`,
      isDanger: true,
      showCancel: true,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await notesService.deleteChapter(section.id);
          setChapters(prev => {
            const notebookId = Object.keys(prev).find(nid => prev[nid].some(s => s.id === section.id));
            if (!notebookId) return prev;
            return {
              ...prev,
              [notebookId]: prev[notebookId].filter(s => s.id !== section.id)
            };
          });
          if (selectedChapter?.id === section.id) {
            setSelectedChapter(null);
            setNotes([]);
          }
        } catch (err) {
          console.error("Failed to delete section", err);
          showAlert("Error", "Failed to delete section.");
        }
      }
    });
  };

  const handleShareNote = async (username, permissionLevel) => {
    if (!selectedNote) return;
    try {
      await notesService.shareNote(selectedNote.id, username, permissionLevel);
      showAlert("Success", "Note shared successfully!");
    } catch (err) {
      console.error("Failed to share note", err);
      showAlert("Error", "Failed to share note.");
    }
  };

  const handleTogglePin = async (e, note) => {
    e.stopPropagation();
    try {
      const updatedNote = await notesService.togglePin(note.id);
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isPinned: updatedNote.isPinned } : n));
      if (selectedNote && selectedNote.id === note.id) {
        setSelectedNote(prev => ({ ...prev, isPinned: updatedNote.isPinned }));
      }
    } catch (err) {
      console.error("Failed to toggle pin", err);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    setConfirmationModal({
      isOpen: true,
      title: "Delete Note",
      message: "Are you sure you want to delete this note?",
      isDanger: true,
      showCancel: true,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await notesService.deleteNote(selectedNote.id);
          setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
          setSelectedNote(null);
          setViewMode("list");

          const newParams = new URLSearchParams(searchParams);
          newParams.delete("note");
          setSearchParams(newParams);
        } catch (err) {
          console.error("Failed to delete note", err);
        }
      }
    });
  };

  const handleTranscriptionComplete = (text) => {
    if (!selectedNote) return;
    showAlert("Transcription Complete", "Text: " + text + "\n\n(Please manually paste this for now as we integrate the editor)");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSelectedChapter(null); // Clear section selection to show search results
    try {
      const results = await notesService.searchNotes(searchQuery);
      setNotes(results);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestOrganization = async () => {
    if (!selectedNote) return;
    // Extract text content from JSON for the AI
    const textContent = JSON.stringify(selectedNote.content);
    try {
      const suggestions = await notesService.suggestOrganization(textContent);
      // Show suggestions in a nice way. For now, alert.
      const s = suggestions.suggestions; // Assuming structure
      showAlert("AI Suggestions", `Suggested Notebook: ${s.suggestedNotebook}\nSuggested Tags: ${s.suggestedTags?.join(", ")}`);
    } catch (err) {
      console.error("Failed to get suggestions", err);
      showAlert("Error", "Could not get suggestions.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-surface-50 dark:bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={{ width: 280 }}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="bg-surface-100 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col overflow-hidden"
      >
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </form>

          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-surface-900 dark:text-surface-100">Notebooks</h2>
            <div className="flex gap-1">
              <button
                onClick={handleSeedData}
                className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-500"
                title="Seed Mock Data"
              >
                <FiDatabase />
              </button>
              <button
                onClick={() => setShowCreateNotebook(true)}
                className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-500"
                title="Create Notebook"
              >
                <FiPlus />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg mx-2 flex items-start gap-2">
              <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>{error}</p>
                <button onClick={loadNotebooks} className="text-xs underline mt-1">Retry</button>
              </div>
            </div>
          )}

          {!error && notebooks.length === 0 && (
            <div className="text-center py-4 text-surface-400 text-sm">
              No notebooks found.
            </div>
          )}

          {notebooks.map(notebook => (
            <div key={notebook.id}>
              <div className="group flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
                <button
                  onClick={() => toggleNotebook(notebook.id)}
                  className="flex-1 flex items-center gap-2 text-surface-700 dark:text-surface-300 text-sm font-medium overflow-hidden"
                >
                  {expandedNotebook === notebook.id ? <FiChevronDown className="flex-shrink-0" /> : <FiChevronRight className="flex-shrink-0" />}
                  <FiFolder className={`flex-shrink-0 ${expandedNotebook === notebook.id ? "text-primary-500" : ""}`} style={{ color: notebook.color }} />
                  <span className="truncate">{notebook.title}</span>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleRenameNotebook(e, notebook)} className="p-1 hover:text-primary-500 text-surface-400" title="Rename"><FiEdit2 size={12} /></button>
                  <button onClick={(e) => handleDeleteNotebook(e, notebook)} className="p-1 hover:text-red-500 text-surface-400" title="Delete"><FiTrash size={12} /></button>
                </div>
              </div>

              <AnimatePresence>
                {expandedNotebook === notebook.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-6 border-l border-surface-200 dark:border-surface-700 pl-2 space-y-0.5"
                  >
                    {sections[notebook.id] ? (
                      sections[notebook.id].length > 0 ? (
                        sections[notebook.id].map(section => (
                          <div key={section.id} className="group flex items-center justify-between w-full pr-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
                            <button
                              onClick={() => selectChapter(section)}
                              className={`flex-1 flex items-center gap-2 px-3 py-1.5 text-sm transition-colors overflow-hidden ${selectedChapter?.id === section.id
                                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg"
                                : "text-surface-600 dark:text-surface-400"
                                }`}
                            >
                              <span className="truncate">{section.title}</span>
                            </button>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => handleRenameChapter(e, section)} className="p-1 hover:text-primary-500 text-surface-400" title="Rename"><FiEdit2 size={12} /></button>
                              <button onClick={(e) => handleDeleteChapter(e, section)} className="p-1 hover:text-red-500 text-surface-400" title="Delete"><FiTrash size={12} /></button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-1.5 text-xs text-surface-400">No sections</div>
                      )
                    ) : (
                      <div className="px-3 py-1.5 text-xs text-surface-400">Loading...</div>
                    )}
                    <button
                      onClick={() => {
                        setNotebookForChapter(notebook);
                        setShowCreateChapter(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-surface-400 hover:text-primary-500"
                    >
                      <FiPlus className="w-3 h-3" /> Add Chapter
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-background overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 bg-white/80 dark:bg-background/80 backdrop-blur-md sticky top-0 z-10 flex-none">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
            >
              <FiSidebar />
            </button>
            <div className="flex items-center gap-2 text-sm text-surface-500">
              {selectedChapter ? (
                <>
                  <span className="font-medium text-surface-900 dark:text-surface-100">{selectedChapter.title}</span>
                  <span>/</span>
                </>
              ) : (
                <span className="font-medium text-surface-900 dark:text-surface-100">All Notes</span>
              )}
              <span>{loading ? "Loading..." : `${notes.length} Notes`}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedChapter && !selectedNote && (
              <button
                onClick={handleCreateNote}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                <FiPlus /> New Note
              </button>
            )}
            {selectedNote && (
              <>
                <button
                  onClick={handleSuggestOrganization}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                  title="Suggest Organization (AI)"
                >
                  <FiCpu />
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                  title="Share Note"
                >
                  <FiShare2 />
                </button>
                <button
                  onClick={() => setShowVersionsModal(true)}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                  title="Version History"
                >
                  <FiClock />
                </button>
                <button
                  onClick={() => setShowBacklinksModal(true)}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                  title="Backlinks"
                >
                  <FiLink />
                </button>
                <button
                  onClick={() => setShowTranscribeModal(true)}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                  title="Voice to Text"
                >
                  <FiMic />
                </button>
                <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />
                <button
                  onClick={handleDeleteNote}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                  title="Delete Note"
                >
                  <FiTrash2 />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {!selectedChapter && !searchQuery && notes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-surface-400">
              <div className="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
                <FiFolder className="w-10 h-10" />
              </div>
              <p className="text-lg font-medium text-surface-600 dark:text-surface-300">Select a notebook to start</p>
              <button
                onClick={() => setShowCreateNotebook(true)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                Create Notebook
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map(note => (
                  <motion.div
                    key={note.id}
                    layoutId={`note-${note.id}`}
                    onClick={() => selectNote(note)}
                    className="group relative bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-surface-900 dark:text-surface-100 line-clamp-1 flex-1">
                        {getDisplayTitle(note)}
                      </h3>
                      <button
                        onClick={(e) => handleTogglePin(e, note)}
                        className={`p-1 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors ${note.isPinned ? "text-amber-400" : "text-surface-300 opacity-0 group-hover:opacity-100"}`}
                      >
                        <FiStar className={note.isPinned ? "fill-amber-400" : ""} />
                      </button>
                    </div>

                    <div
                      className="text-sm text-surface-500 dark:text-surface-400 line-clamp-3 mb-4 h-12"
                      dangerouslySetInnerHTML={{ __html: typeof note.content === 'string' ? note.content : "Rich content" }}
                    />
                    <div className="flex items-center justify-between text-xs text-surface-400">
                      <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </motion.div>
                ))}
                {notes.length === 0 && !loading && (
                  <div className="col-span-full text-center py-20 text-surface-400">
                    <p>No notes found.</p>
                    {selectedChapter && (
                      <button onClick={handleCreateNote} className="text-primary-500 hover:underline mt-2">Create one?</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 w-full px-4 pb-4">
              <div className="flex-none py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className="p-1 -ml-2 text-surface-400 hover:text-primary-500 transition-colors rounded-full hover:bg-surface-100 dark:hover:bg-surface-800"
                    title="Back to list"
                  >
                    <FiChevronLeft className="w-8 h-8" />
                  </button>
                  <input
                    type="text"
                    value={selectedNote?.title || ""}
                    onChange={handleTitleChange}
                    className="flex-1 text-3xl font-display font-bold bg-transparent border-none outline-none placeholder-surface-300 text-surface-900 dark:text-surface-50"
                    placeholder={getDisplayTitle(selectedNote, true)}
                  />
                  <button
                    onClick={(e) => handleTogglePin(e, selectedNote)}
                    className={`p-2 rounded-lg transition-colors ${selectedNote?.isPinned ? "text-amber-400 bg-amber-50 dark:bg-amber-900/20" : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"}`}
                    title={selectedNote?.isPinned ? "Unpin Note" : "Pin Note"}
                  >
                    <FiStar className={selectedNote?.isPinned ? "fill-amber-400" : ""} />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-9 text-xs text-surface-400">
                  <span>Last edited {selectedNote?.updatedAt && formatDistanceToNow(new Date(selectedNote.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="flex-1 bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col overflow-hidden">
                <ErrorBoundary>
                  <RichNoteEditor
                    value={selectedNote?.content}
                    onChange={handleUpdateNote}
                    noteId={selectedNote?.id}
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateNotebookModal
        isOpen={showCreateNotebook}
        onClose={() => setShowCreateNotebook(false)}
        onCreate={handleCreateNotebook}
      />
      <CreateChapterModal
        isOpen={showCreateChapter}
        onClose={() => setShowCreateChapter(false)}
        onCreate={handleCreateChapter}
        notebookTitle={notebookForChapter?.title}
      />
      <ShareNoteModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShareNote}
        noteTitle={selectedNote?.title}
      />
      <NoteVersionsModal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        noteId={selectedNote?.id}
        onRestore={() => selectNote(selectedNote)} // Reload note after restore
      />
      <TranscribeModal
        isOpen={showTranscribeModal}
        onClose={() => setShowTranscribeModal(false)}
        onTranscriptionComplete={handleTranscriptionComplete}
      />
      {showBacklinksModal && (
        <BacklinksModal
          noteId={selectedNote?.id}
          onSelectNote={() => {
            // Logic to select the note by ID would go here
            // For now, simple close as selectNote requires full note object
            setShowBacklinksModal(false);
          }}
          onClose={() => setShowBacklinksModal(false)}
        />
      )}
      <AiChat />
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        isDanger={confirmationModal.isDanger}
        showCancel={confirmationModal.showCancel}
        confirmText={confirmationModal.confirmText}
      />
    </div>
  );
}