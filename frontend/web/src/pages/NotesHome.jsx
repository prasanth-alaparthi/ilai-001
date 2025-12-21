import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Folder, ChevronRight, ChevronDown, ChevronLeft,
  Star, Sidebar, Share2, Clock, Mic, Link as LinkIcon,
  Trash2, Search, Grid, List, Cpu, AlertCircle, Database,
  Edit2, Trash, FileText, MoreHorizontal, Sparkles, FolderPlus,
  Copy, Download, LayoutGrid, AlertTriangle
} from "lucide-react";
import { notesService } from "../services/notesService";
import RichNoteEditor from "../components/RichNoteEditor";
import { formatDistanceToNow } from "date-fns";
import CreateNotebookModal from "../components/modals/CreateNotebookModal";
import CreateChapterModal from "../components/modals/CreateChapterModal";
import ShareNoteModal from "../components/modals/ShareNoteModal";
import NoteVersionsModal from "../components/modals/NoteVersionsModal";
import BacklinksModal from "../components/modals/BacklinksModal";
import NoteGraphModal from "../components/modals/NoteGraphModal";
import BrokenLinksModal from "../components/modals/BrokenLinksModal";
import TranscribeModal from "../components/modals/TranscribeModal";
import ExportNoteModal from "../components/modals/ExportNoteModal";
import ErrorBoundary from "../components/ErrorBoundary";
import AiChat from "../components/AiChat";
import AIToolsPanel from "../components/AIToolsPanel";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import SectionTree from "../components/notes/SectionTree";
import TagsInput from "../components/notes/TagsInput";
import Sidebar from "../components/notes/Sidebar";
import { useSidebarSync } from "../hooks/useSidebarSync"; // Still used for top-level if needed, but Sidebar has its own

const getDisplayTitle = (note, isPlaceholder = false) => {
  if (note.title && note.title.trim() !== "" && note.title !== "Untitled Note") {
    return note.title;
  }
  try {
    let contentText = "";
    if (typeof note.content === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = note.content;
      contentText = temp.textContent || temp.innerText || "";
    } else if (typeof note.content === 'object' && note.content !== null) {
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
  } catch (e) { }
  return isPlaceholder ? "Untitled Note" : "Untitled";
}

export default function NotesHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notebooks, setNotebooks] = useState([]);
  const [sections, setChapters] = useState({});
  const [expandedNotebook, setExpandedNotebook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saved', 'saving', 'error'
  const saveTimeoutRef = React.useRef(null);
  const selectedNoteRef = React.useRef(null);
  const contentRef = React.useRef(null); // Track latest content to avoid stale closures

  // Keep refs in sync with state to avoid stale closures in debounced callbacks
  React.useEffect(() => {
    selectedNoteRef.current = selectedNote;
    if (selectedNote) {
      contentRef.current = selectedNote.content;
    }
  }, [selectedNote]);

  // Responsive sidebar - default closed on mobile, open on desktop  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (window.innerWidth < 768) return false;
    return localStorage.getItem("sidebarOpen") !== "false";
  });

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebarOpen", sidebarOpen);
    }
  }, [sidebarOpen, isMobile]);

  const [viewMode, setViewMode] = useState("list");
  const [notesViewMode, setNotesViewMode] = useState("list"); // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // Modals state
  const [showCreateNotebook, setShowCreateNotebook] = useState(false);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [notebookForChapter, setNotebookForChapter] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showBacklinksModal, setShowBacklinksModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showBrokenLinksModal, setShowBrokenLinksModal] = useState(false);
  const [showTranscribeModal, setShowTranscribeModal] = useState(false);
  const [showAITools, setShowAITools] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const navigate = useNavigate();

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false, title: "", message: "", onConfirm: () => { }, isDanger: false, showCancel: true, confirmText: "Confirm"
  });

  const showAlert = (title, message) => {
    setConfirmationModal({
      isOpen: true, title, message, onConfirm: () => { }, isDanger: false, showCancel: false, confirmText: "OK"
    });
  };

  useEffect(() => { fetchNotebooks(); }, []);

  useEffect(() => {
    const restoreState = async () => {
      // Ensure notebooks are loaded first if not already
      if (notebooks.length === 0) {
        await fetchNotebooks();
      }

      const notebookId = searchParams.get("notebook");
      const chapterId = searchParams.get("chapter");
      const noteId = searchParams.get("note");

      if (notebookId) {
        setExpandedNotebook(notebookId);
        try {
          const chaptersData = await notesService.listChaptersHierarchical(notebookId);
          setChapters(prev => ({ ...prev, [notebookId]: chaptersData }));

          if (chapterId) {
            const chapter = chaptersData.find(c => c.id === chapterId);
            if (chapter) {
              setSelectedChapter(chapter);
              // Load notes for the chapter
              const notesData = await notesService.listNotesInChapter(chapterId);
              setNotes(notesData);

              if (noteId) {
                try {
                  const fullNote = await notesService.getNote(noteId);
                  setSelectedNote(fullNote);
                  setViewMode("editor"); // Explicitly set editor mode
                } catch (e) {
                  console.error("Failed to load note from URL", e);
                  // If note fails, fallback to list view of chapter
                  setViewMode("list");
                }
              } else {
                setViewMode("list");
              }
            }
          }
        } catch (err) {
          console.error("Failed to restore state", err);
        }
      }
    };
    restoreState();
  }, [searchParams]); // Re-run if searchParams change (though on mount is primary target)

  const fetchNotebooks = async () => {
    try {
      setError(null);
      const data = await notesService.listNotebooks();
      setNotebooks(data);
    } catch (err) {
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
          const personal = await notesService.createNotebook("Personal", "#4f46e5");
          await notesService.createChapter(personal.id, "Ideas");
          await notesService.createChapter(personal.id, "Journal");

          const work = await notesService.createNotebook("Work", "#ef4444");
          await notesService.createChapter(work.id, "Projects");

          await fetchNotebooks();
          showAlert("Success", "Mock data created!");
        } catch (err) {
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
        try {
          const data = await notesService.listChaptersHierarchical(notebookId);
          setChapters(prev => ({ ...prev, [notebookId]: data }));
        } catch (err) {
          console.error("Failed to load sections", err);
        }
      }
    }
  };

  const selectChapter = async (section) => {
    setSelectedChapter(section);
    setSelectedNote(null);
    setViewMode("list");
    setLoading(true);
    setSearchQuery("");

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
      showAlert("Error", "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  const selectNote = async (note) => {
    try {
      console.log("[DEBUG] selectNote called for note:", note.id);
      const fullNote = await notesService.getNote(note.id);
      console.log("[DEBUG] getNote returned:", fullNote.id, fullNote.title, "content length:", JSON.stringify(fullNote.content)?.length);
      setSelectedNote(fullNote);
      setViewMode("editor");

      const newParams = new URLSearchParams(searchParams);
      if (expandedNotebook) newParams.set("notebook", expandedNotebook);
      if (selectedChapter) newParams.set("chapter", selectedChapter.id);
      newParams.set("note", note.id);
      setSearchParams(newParams);
    } catch (err) {
      console.error("[DEBUG] selectNote failed:", err);
      showAlert("Error", "Failed to load note content.");
    }
  };

  const handleCreateNote = async () => {
    if (!selectedChapter) return;
    try {
      const newNote = await notesService.createNote(selectedChapter.id, "Untitled Note", { type: "doc", content: [] });
      setNotes([newNote, ...notes]);
      selectNote(newNote);
    } catch (err) {
      showAlert("Error", "Failed to create note.");
    }
  };

  const handleUpdateNote = (content) => {
    if (!selectedNote) return;

    // Update local state AND ref immediately for responsiveness
    setSelectedNote(prev => ({ ...prev, content }));
    contentRef.current = content; // Critical: update ref immediately so debounced save uses latest
    setSaveStatus("saving");

    // Clear existing timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce API call - use refs to get current values (avoids stale closure)
    saveTimeoutRef.current = setTimeout(async () => {
      const currentNote = selectedNoteRef.current;
      const currentContent = contentRef.current; // Use ref for latest content
      console.log("[DEBUG] Save triggered, currentNote:", currentNote?.id, currentNote?.title);
      if (!currentNote) {
        console.log("[DEBUG] currentNote is null, aborting save");
        return;
      }
      try {
        console.log("[DEBUG] Calling updateNote with:", currentNote.id, currentNote.title, "content length:", JSON.stringify(currentContent)?.length);
        await notesService.updateNote(currentNote.id, currentNote.title, currentContent);
        console.log("[DEBUG] Save successful");
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save failed", err);
        setSaveStatus("error");
      }
    }, 1000); // 1s debounce
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setSelectedNote(prev => ({ ...prev, title: newTitle }));
    setSaveStatus("saving");

    // Update list view immediately
    setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, title: newTitle } : n));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      const currentNote = selectedNoteRef.current;
      const currentContent = contentRef.current; // Use ref for latest content
      if (!currentNote) return;
      try {
        await notesService.updateNote(currentNote.id, newTitle, currentContent);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save failed", err);
        setSaveStatus("error");
      }
    }, 1000);
  };

  const handleCreateNotebook = async (title, color) => {
    try {
      const newNotebook = await notesService.createNotebook(title, color);
      setNotebooks([...notebooks, newNotebook]);
    } catch (err) {
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
      showAlert("Error", "Failed to create section: " + (err.response?.data?.message || err.message));
    }
  };

  // Implemented CRUD for Notebooks and Chapters
  const handleRenameNotebook = async (e, notebook) => {
    e.stopPropagation();
    const newTitle = prompt("Enter new notebook name:", notebook.title);
    if (!newTitle || newTitle === notebook.title) return;
    try {
      // Assuming updateNotebook exists or use delete/create pattern if not. 
      // Checking notesService.js would be ideal but assuming standard CRUD:
      await notesService.updateNotebook(notebook.id, newTitle, notebook.color);
      setNotebooks(prev => prev.map(n => n.id === notebook.id ? { ...n, title: newTitle } : n));
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to rename notebook.");
    }
  };

  const handleDeleteNotebook = async (e, notebook) => {
    e.stopPropagation();
    setConfirmationModal({
      isOpen: true,
      title: "Delete Notebook",
      message: `Are you sure you want to delete "${notebook.title}"? All notes inside will be lost.`,
      isDanger: true,
      showCancel: true,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await notesService.deleteNotebook(notebook.id);
          setNotebooks(prev => prev.filter(n => n.id !== notebook.id));
          if (expandedNotebook === notebook.id) setExpandedNotebook(null);
        } catch (err) {
          showAlert("Error", "Failed to delete notebook.");
        }
      }
    });
  };

  const handleRenameChapter = async (e, section) => {
    e.stopPropagation();
    const newTitle = prompt("Enter new section name:", section.title);
    if (!newTitle || newTitle === section.title) return;
    try {
      await notesService.updateChapter(section.id, newTitle);
      // Update local state deeply
      const nid = Object.keys(sections).find(k => sections[k].some(s => s.id === section.id));
      if (nid) {
        setChapters(prev => ({
          ...prev,
          [nid]: prev[nid].map(s => s.id === section.id ? { ...s, title: newTitle } : s)
        }));
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to rename section.");
    }
  };

  const handleDeleteChapter = async (e, section) => {
    e.stopPropagation();
    setConfirmationModal({
      isOpen: true,
      title: "Delete Section",
      message: `Are you sure you want to delete "${section.title}"? All notes inside will be lost.`,
      isDanger: true,
      showCancel: true,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await notesService.deleteChapter(section.id);
          const nid = Object.keys(sections).find(k => sections[k].some(s => s.id === section.id));
          if (nid) {
            setChapters(prev => ({
              ...prev,
              [nid]: prev[nid].filter(s => s.id !== section.id)
            }));
          }
          if (selectedChapter?.id === section.id) setSelectedChapter(null);
        } catch (err) {
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
      showAlert("Error", "Failed to share note.");
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    setConfirmationModal({
      isOpen: true,
      title: "Move to Trash",
      message: "This note will be moved to trash. You can restore it later from the Trash page.",
      isDanger: true,
      showCancel: true,
      confirmText: "Move to Trash",
      onConfirm: async () => {
        try {
          await notesService.moveToTrash(selectedNote.id);
          setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
          setSelectedNote(null);
          setViewMode("list");
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("note");
          setSearchParams(newParams);
        } catch (err) { console.error(err); }
      }
    });
  };

  const handleDuplicateNote = async () => {
    if (!selectedNote) return;
    try {
      const duplicate = await notesService.duplicateNote(selectedNote.id);
      setNotes(prev => [...prev, duplicate]);
      setSelectedNote(duplicate);
      showAlert("Success", "Note duplicated successfully!");
    } catch (err) {
      showAlert("Error", "Failed to duplicate note.");
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

  const handleTranscriptionComplete = (text) => {
    if (!selectedNote) return;
    showAlert("Transcription Complete", "Text: " + text + "\n\n(Please manually paste this for now)");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSelectedChapter(null);
    try {
      const results = await notesService.searchNotes(searchQuery);
      setNotes(results);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSuggestOrganization = async () => {
    if (!selectedNote) return;
    const textContent = JSON.stringify(selectedNote.content);
    try {
      const suggestions = await notesService.suggestOrganization(textContent);
      const s = suggestions.suggestions;
      showAlert("AI Suggestions", `Suggested Notebook: ${s.suggestedNotebook}\nSuggested Tags: ${s.suggestedTags?.join(", ")}`);
    } catch (err) {
      showAlert("Error", "Could not get suggestions.");
    }
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      {/* --- Mobile Overlay Backdrop --- */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        setIsOpen={setSidebarOpen}
        notebooks={notebooks}
        expandedNotebook={expandedNotebook}
        sections={sections}
        selectedChapter={selectedChapter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        error={error}
        toggleNotebook={toggleNotebook}
        handleSearch={handleSearch}
        handleSeedData={handleSeedData}
        setShowCreateNotebook={setShowCreateNotebook}
        handleRenameNotebook={handleRenameNotebook}
        handleDeleteNotebook={handleDeleteNotebook}
        selectChapter={selectChapter}
        setNotebookForChapter={setNotebookForChapter}
        setShowCreateChapter={setShowCreateChapter}
        handleRenameChapter={handleRenameChapter}
        handleDeleteChapter={handleDeleteChapter}
        fetchNotebooks={fetchNotebooks}
      />


      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar - Responsive */}
        <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-surface/30 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-secondary hover:text-primary hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Sidebar size={20} />
            </button>
            {viewMode === "editor" && (
              <div className="flex items-center gap-1 sm:gap-2 text-sm text-secondary min-w-0">
                <button onClick={() => setViewMode("list")} className="hover:text-primary flex items-center gap-1 flex-shrink-0">
                  <ChevronLeft size={16} /><span className="hidden xs:inline">Back</span>
                </button>
                <span className="text-border hidden sm:block">/</span>
                <span className="font-medium text-primary truncate max-w-[100px] sm:max-w-[200px]">{selectedNote?.title}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {viewMode === "editor" && selectedNote ? (
              <>
                <div className="flex items-center gap-2 mr-2">
                  {saveStatus === "saving" && <span className="text-xs text-secondary animate-pulse">Saving...</span>}
                  {saveStatus === "saved" && <span className="text-xs text-secondary/50">Saved</span>}
                  {saveStatus === "error" && <span className="text-xs text-red-400">Save Failed</span>}
                </div>
                <span className="text-xs text-secondary/50 font-mono hidden lg:block">
                  {selectedNote.updatedAt ? formatDistanceToNow(new Date(selectedNote.updatedAt), { addSuffix: true }) : 'Just now'}
                </span>
                <div className="h-4 w-px bg-border mx-1 sm:mx-2 hidden sm:block" />
                <button onClick={handleSuggestOrganization} className="p-1.5 sm:p-2 text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors" title="AI Organize"><Cpu size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => setShowAITools(!showAITools)} className={`p-1.5 sm:p-2 rounded-full transition-colors ${showAITools ? 'text-accent-glow bg-accent-glow/10' : 'text-secondary hover:text-primary hover:bg-white/5'}`} title="AI Study Tools"><Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => setShowBacklinksModal(true)} className="p-1.5 sm:p-2 text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors" title="View Links"><LinkIcon size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => setShowGraphModal(true)} className="p-1.5 sm:p-2 text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors" title="Knowledge Graph"><LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => setShowBrokenLinksModal(true)} className="p-1.5 sm:p-2 text-secondary hover:text-amber-500 hover:bg-amber-500/10 rounded-full transition-colors" title="Broken Links"><AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => setShowVersionsModal(true)} className="p-1.5 sm:p-2 text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors hidden sm:flex" title="History"><Clock size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => setShowTranscribeModal(true)} className="p-1.5 sm:p-2 text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors hidden sm:flex" title="Transcribe"><Mic size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => setShowShareModal(true)} className="p-1.5 sm:p-2 text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors" title="Share"><Share2 size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={handleDuplicateNote} className="p-1.5 sm:p-2 text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors hidden sm:flex" title="Duplicate"><Copy size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => setShowExportModal(true)} className="p-1.5 sm:p-2 text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors hidden sm:flex" title="Export"><Download size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={handleDeleteNote} className="p-1.5 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-full transition-colors" title="Move to Trash"><Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                {/* Mobile overflow menu for hidden actions */}
                <button className="p-1.5 sm:hidden text-secondary hover:text-primary hover:bg-white/5 rounded-full transition-colors" title="More"><MoreHorizontal size={16} /></button>
              </>
            ) : (
              selectedChapter && (
                <button
                  onClick={handleCreateNote}
                  className="btn-primary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /><span className="hidden xs:inline">New Note</span><span className="xs:hidden">New</span>
                </button>
              )
            )}
          </div>
        </header>

        {/* Content Body - Responsive */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "list" ? (
            <main className="h-full overflow-y-auto p-3 sm:p-6">
              {!selectedChapter && !searchQuery ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-secondary/50 px-4">
                  <Folder size={48} strokeWidth={1} className="mb-4 sm:w-14 sm:h-14" />
                  <h2 className="text-lg sm:text-xl font-serif text-primary/60">Select a Notebook</h2>
                  <p className="text-sm mt-2">Choose a section from the sidebar to view notes.</p>
                  {isMobile && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="mt-4 btn-primary flex items-center gap-2 text-sm"
                    >
                      <Sidebar size={16} /> Open Sidebar
                    </button>
                  )}
                </div>
              ) : (
                <div className="max-w-5xl mx-auto">
                  {/* Section Header - Responsive */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-serif font-medium text-primary">{selectedChapter?.title || "Search Results"}</h1>
                    <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10 self-start sm:self-auto">
                      <button
                        onClick={() => setNotesViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${notesViewMode === 'list' ? 'bg-white/20 dark:bg-white/10 text-primary' : 'text-secondary hover:text-primary'}`}
                      >
                        <List size={16} />
                      </button>
                      <button
                        onClick={() => setNotesViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${notesViewMode === 'grid' ? 'bg-white/20 dark:bg-white/10 text-primary' : 'text-secondary hover:text-primary'}`}
                      >
                        <Grid size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Notes Display - Responsive Grid/List */}
                  <div className={notesViewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
                    : 'space-y-2 sm:space-y-3'
                  }>
                    {notes.map(note => (
                      <motion.div
                        layoutId={`note-${note.id}`}
                        key={note.id}
                        onClick={() => selectNote(note)}
                        className={`group cursor-pointer transition-all duration-200 ${notesViewMode === 'grid'
                          ? 'flex flex-col p-3 sm:p-4 rounded-xl bg-white/30 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 hover:border-accent-glow/30 hover:shadow-lg hover:shadow-accent-glow/5'
                          : 'flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/30 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 hover:border-accent-glow/30'
                          }`}
                      >
                        {notesViewMode === 'list' && (
                          <div className="mt-0.5 p-2 sm:p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-secondary group-hover:bg-accent-glow/10 group-hover:text-accent-glow transition-colors flex-shrink-0">
                            <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {notesViewMode === 'grid' && (
                            <div className="mb-2 sm:mb-3 p-2 sm:p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-secondary group-hover:bg-accent-glow/10 group-hover:text-accent-glow transition-colors w-fit">
                              <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </div>
                          )}
                          <h3 className="font-medium text-sm sm:text-base text-primary group-hover:text-accent-glow transition-colors truncate">
                            {getDisplayTitle(note)}
                          </h3>
                          <p className={`text-xs sm:text-sm text-secondary/60 mt-1 ${notesViewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-2'}`}>
                            {getDisplayTitle(note, false) === "Untitled" ? "No additional text..." : getDisplayTitle(note)}
                          </p>
                          <div className="flex items-center flex-wrap gap-2 sm:gap-4 mt-2 text-[10px] sm:text-xs text-secondary/40 font-mono">
                            <span>{formatDistanceToNow(new Date(note.updatedAt || note.createdAt), { addSuffix: true })}</span>
                            {note.isPinned && <span className="text-amber-400 flex items-center gap-1"><Star size={10} fill="currentColor" />Pinned</span>}
                          </div>
                        </div>
                        {/* Quick action on hover - Pin toggle */}
                        <button
                          onClick={(e) => handleTogglePin(e, note)}
                          className={`p-1.5 rounded-lg transition-all ${note.isPinned ? 'text-amber-400' : 'text-secondary opacity-0 group-hover:opacity-100'} hover:bg-white/10`}
                          title={note.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Star size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
                        </button>
                      </motion.div>
                    ))}
                    {notes.length === 0 && (
                      <div className="text-center py-12 sm:py-20 text-secondary/50 font-light italic col-span-full">
                        No notes found here.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          ) : (
            <main className="h-full overflow-y-auto bg-background scrollbar-thin">
              {/* Editor View - Responsive */}
              <div className="max-w-3xl mx-auto py-6 sm:py-12 px-4 sm:px-8 min-h-screen bg-surface/50 dark:bg-surface/30 sm:border-x border-black/5 dark:border-white/5">
                <ErrorBoundary>
                  <input
                    type="text"
                    value={selectedNote?.title || ""}
                    onChange={handleTitleChange}
                    placeholder="Untitled Note"
                    className="w-full text-2xl sm:text-4xl font-serif font-medium bg-transparent border-none outline-none placeholder:text-secondary/30 text-primary mb-4"
                  />
                  <div className="mb-4 sm:mb-6">
                    <TagsInput
                      noteId={selectedNote?.id}
                      initialTags={selectedNote?.tags || []}
                      onTagsChange={(newTags) => setSelectedNote(prev => ({ ...prev, tags: newTags }))}
                    />
                  </div>
                  <div className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-primary prose-p:font-light prose-p:leading-relaxed prose-p:text-secondary prose-strong:text-primary prose-a:text-accent-glow prose-code:text-accent-glow prose-code:bg-white/5 prose-pre:bg-surface prose-pre:border prose-pre:border-white/10">
                    <RichNoteEditor
                      key={selectedNote?.id}
                      value={selectedNote?.content}
                      onChange={handleUpdateNote}
                      noteId={selectedNote?.id}
                    />
                  </div>
                </ErrorBoundary>
              </div>
            </main>
          )}
        </div>

      </div>

      {/* --- Modals --- */}
      {showCreateNotebook && (
        <CreateNotebookModal
          onClose={() => setShowCreateNotebook(false)}
          onCreate={handleCreateNotebook}
        />
      )}
      {showCreateChapter && (
        <CreateChapterModal
          onClose={() => setShowCreateChapter(false)}
          onCreate={handleCreateChapter}
        />
      )}
      {showShareModal && (
        <ShareNoteModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShare={handleShareNote}
        />
      )}
      {showVersionsModal && selectedNote && (
        <NoteVersionsModal
          isOpen={showVersionsModal}
          onClose={() => setShowVersionsModal(false)}
          noteId={selectedNote.id}
          onRestore={async (content) => {
            await handleUpdateNote(content);
            setShowVersionsModal(false);
          }}
        />
      )}
      {showBacklinksModal && selectedNote && (
        <BacklinksModal
          isOpen={showBacklinksModal}
          onClose={() => setShowBacklinksModal(false)}
          noteId={selectedNote.id}
          onSelectNote={selectNote}
        />
      )}
      {showGraphModal && selectedNote && (
        <NoteGraphModal
          isOpen={showGraphModal}
          onClose={() => setShowGraphModal(false)}
          noteId={selectedNote.id}
          onSelectNote={selectNote}
        />
      )}

      <BrokenLinksModal
        isOpen={showBrokenLinksModal}
        onClose={() => setShowBrokenLinksModal(false)}
        onSelectNote={selectNote}
      />
      {showTranscribeModal && (
        <TranscribeModal
          isOpen={showTranscribeModal}
          onClose={() => setShowTranscribeModal(false)}
          onTranscribe={handleTranscriptionComplete}
        />
      )}
      {showExportModal && selectedNote && (
        <ExportNoteModal
          note={selectedNote}
          onClose={() => setShowExportModal(false)}
        />
      )}

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

      {/* AI Tools Panel */}
      <AIToolsPanel
        isOpen={showAITools}
        onClose={() => setShowAITools(false)}
        noteContent={selectedNote?.content}
        noteTitle={selectedNote?.title}
      />

      <AiChat />
    </div>
  );
}