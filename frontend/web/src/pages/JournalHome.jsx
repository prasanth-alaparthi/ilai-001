import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Calendar, Book, PenTool, Search,
  ChevronRight, MoreVertical, Mic, Save, X,
  FileText, Wand2
} from "lucide-react";
import { format } from "date-fns";
import RichNoteEditor from "../components/RichNoteEditor";
import VoiceRecorder from "../components/VoiceRecorder";
import WritingAssistant from "../components/editor/WritingAssistant";
import TemplateGallery from "../components/TemplateGallery";
import { useNavigate } from "react-router-dom";

export default function JournalHome() {
  const [entries, setEntries] = useState([]);
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Editor State
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mood, setMood] = useState("Neutral");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);

  const moods = ["Happy", "Neutral", "Sad", "Excited", "Stressed", "Calm"];

  const [showTrash, setShowTrash] = useState(false);
  const [trashEntries, setTrashEntries] = useState([]);
  const [tags, setTags] = useState([]); // Selected tags for current entry

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const res = await apiClient.get("/journal/entries");
      const list = res.data || [];
      // Sort by date desc
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setEntries(list);
    } catch (e) { console.error(e); }
  };

  const loadTrash = async () => {
    try {
      const res = await apiClient.get("/journal/entries/trash");
      setTrashEntries(res.data || []);
      setShowTrash(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEntries();
      return;
    }
    try {
      const res = await apiClient.get(`/journal/entries/search?q=${encodeURIComponent(searchQuery)}`);
      setEntries(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartWriting = () => {
    setSelectedEntry(null);
    setEditorTitle("");
    setEditorContent(null);
    setMood("Neutral");
    setTags([]);
    setIsWriting(true);
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setEditorTitle(entry.title);
    setEditorContent(entry.contentJson ? JSON.parse(entry.contentJson) : null);
    setMood(entry.mood || "Neutral");
    setTags(entry.tags || []);
    setIsWriting(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Move this entry to trash?")) return;
    try {
      await apiClient.delete(`/journal/entries/${id}`);
      loadEntries();
    } catch (e) {
      console.error(e);
      alert("Failed to delete entry");
    }
  };

  const handleRestore = async (id) => {
    try {
      await apiClient.post(`/journal/entries/${id}/restore`);
      loadTrash();
      loadEntries();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete this entry? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/journal/entries/${id}/permanent`);
      loadTrash();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm("Empty trash? All items will be permanently deleted.")) return;
    try {
      await apiClient.delete("/journal/entries/trash");
      loadTrash();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!editorTitle.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: editorTitle,
        contentJson: JSON.stringify(editorContent),
        mood: mood,
        tags: tags,
        isPublic: false
      };

      let savedEntry;
      if (selectedEntry) {
        const res = await apiClient.put(`/journal/entries/${selectedEntry.id}`, payload);
        savedEntry = res.data;
      } else {
        const res = await apiClient.post("/journal/entries", payload);
        savedEntry = res.data;
      }

      // Sync tags separately if needed by your API, but here we include it in payload
      // If your backend needs a separate call for tags:
      await apiClient.put(`/journal/entries/${savedEntry.id || selectedEntry.id}/tags`, { tags });

      await loadEntries();
      setIsWriting(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save journal");
    } finally {
      setSaving(false);
    }
  };

  // Group entries by month/year for timeline
  const filteredEntries = entries.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.tags && e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const date = new Date(entry.createdAt);
    const key = updateKey(date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  function updateKey(date) {
    return format(date, "MMMM yyyy");
  }

  return (
    <div className="min-h-screen bg-background text-primary flex relative overflow-hidden">

      {/* --- Main Timeline View --- */}
      <motion.div
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-500 ${isWriting || showTrash ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}
      >
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 md:px-12 backdrop-blur-sm z-10">
          <div>
            <h1 className="text-3xl font-serif font-medium">My Journal</h1>
            <p className="text-secondary text-sm">Reflect, record, and remember.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={loadTrash}
              className="p-2.5 text-secondary hover:text-primary hover:bg-surface rounded-full transition-all"
              title="Trash"
            >
              <MoreVertical size={20} />
            </button>
            <button
              onClick={handleStartWriting}
              className="group flex items-center gap-2 px-5 py-2.5 bg-primary text-background rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <PenTool size={18} />
              <span>Write Entry</span>
            </button>
          </div>
        </header>

        {/* Search & content */}
        <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-20 scrollbar-thin">
          <div className="max-w-3xl mx-auto mt-8">
            <div className="relative mb-12">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50" size={18} />
              <input
                type="text"
                placeholder="Search memories or #tags..."
                className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-accent-blue/50 transition-colors placeholder:text-secondary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Timeline */}
            <div className="relative border-l border-border/50 ml-6 space-y-12">
              {Object.entries(groupedEntries).map(([month, monthEntries]) => (
                <div key={month} className="relative pl-8">
                  {/* Month Marker */}
                  <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-accent-blue rounded-full ring-4 ring-background" />
                  <h3 className="text-sm font-medium text-accent-blue mb-6 uppercase tracking-wider">{month}</h3>

                  <div className="space-y-6">
                    {monthEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-surface/40 hover:bg-surface/80 border border-transparent hover:border-border/50 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3" onClick={() => handleEditEntry(entry)}>
                            <span className="text-2xl font-serif font-bold text-primary">{format(new Date(entry.createdAt), "dd")}</span>
                            <div className="flex flex-col">
                              <span className="text-xs text-secondary uppercase font-medium">{format(new Date(entry.createdAt), "EEEE")}</span>
                              <span className="text-xs text-secondary/50">{format(new Date(entry.createdAt), "hh:mm a")}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                              className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <div onClick={() => handleEditEntry(entry)}>
                          <h4 className="text-xl font-medium mb-2 group-hover:text-accent-blue transition-colors">{entry.title}</h4>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {entry.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-full uppercase tracking-tighter">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-secondary/70 text-sm line-clamp-3 font-light leading-relaxed">
                            {entry.highlights || "Click to read more..."}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="pl-8 text-secondary/50 italic">
                  No entries yet. Start writing your first thought...
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- Trash View Overlay --- */}
      <AnimatePresence>
        {showTrash && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-background/80 backdrop-blur-xl border-l border-border z-[60] shadow-2xl flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-border/30">
              <div className="flex items-center gap-2">
                <X className="cursor-pointer" size={20} onClick={() => setShowTrash(false)} />
                <h3 className="font-medium">Recycle Bin</h3>
              </div>
              <button
                onClick={handleEmptyTrash}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Empty Trash
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {trashEntries.length === 0 && (
                <div className="mt-20 text-center text-secondary/50">
                  <p className="italic">Trash is empty</p>
                </div>
              )}
              {trashEntries.map(entry => (
                <div key={entry.id} className="bg-surface/50 border border-border rounded-xl p-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{entry.title}</h4>
                    <div className="flex gap-1">
                      <button onClick={() => handleRestore(entry.id)} className="p-1 px-2 text-[10px] bg-accent-blue/10 text-accent-blue rounded hover:bg-accent-blue/20 transition-colors">Restore</button>
                      <button onClick={() => handlePermanentDelete(entry.id)} className="p-1 px-2 text-[10px] bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors">Delete</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-secondary/50">{entry.deletedAt ? format(new Date(entry.deletedAt), "MMM dd, yyyy HH:mm") : ""}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Distraction Free Editor Overlay --- */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-background z-50 flex flex-col"
          >
            {/* Editor Header */}
            <header className="h-16 flex items-center justify-between px-8 border-b border-border/30">
              <button
                onClick={() => setIsWriting(false)}
                className="p-2 -ml-2 text-secondary hover:text-primary rounded-full hover:bg-surface transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4">
                <div className="text-xs text-secondary font-mono">
                  {saving ? "Saving..." : "Draft"}
                </div>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-background rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Save size={16} /> Save
                </button>
              </div>
            </header>

            {/* Editor Body */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto py-12 px-8">
                  {/* Toolbar area */}
                  <div className="flex items-center gap-4 mb-8 flex-wrap">
                    <VoiceRecorder onTranscriptionComplete={(text) => {
                      // Simple append for now
                      const newContent = editorContent ? JSON.parse(JSON.stringify(editorContent)) : { type: 'doc', content: [] };
                      if (!newContent.content) newContent.content = [];
                      newContent.content.push({ type: 'paragraph', content: [{ type: 'text', text }] });
                      setEditorContent(newContent);
                    }} />

                    {/* Template Button */}
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors border border-indigo-200 dark:border-indigo-700"
                    >
                      <FileText size={14} />
                      Use Template
                    </button>

                    {/* Writing Assistant Button */}
                    <button
                      onClick={() => setShowWritingAssistant(!showWritingAssistant)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${showWritingAssistant
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-800/50'
                        }`}
                    >
                      <Wand2 size={14} />
                      {showWritingAssistant ? 'Hide Assistant' : 'Writing Assistant'}
                    </button>

                    <div className="flex bg-surface-100 dark:bg-surface-800 rounded-full p-1 border border-border">
                      {moods.map(m => (
                        <button
                          key={m}
                          onClick={() => setMood(m)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${mood === m ? 'bg-primary text-background' : 'text-secondary hover:text-primary'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags Input */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-surface-200 dark:bg-surface-700 rounded-full text-xs font-medium border border-border">
                        #{tag}
                        <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setTags(tags.filter(t => t !== tag))} />
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add #tag..."
                      className="bg-transparent border-none outline-none text-xs text-secondary placeholder:text-secondary/30 min-w-[80px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const newTag = e.target.value.trim().replace(/^#/, '');
                          if (!tags.includes(newTag)) setTags([...tags, newTag]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Title your thought..."
                    className="w-full text-4xl md:text-5xl font-serif font-bold bg-transparent border-none outline-none placeholder:text-secondary/20 text-primary mb-8"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    autoFocus
                  />
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <RichNoteEditor
                      content={editorContent}
                      onChange={setEditorContent}
                      placeholder="What's on your mind today?"
                    />
                  </div>
                </div>
              </div>

              {/* Writing Assistant Sidebar */}
              <AnimatePresence>
                {showWritingAssistant && (
                  <WritingAssistant
                    text={editorContent ? JSON.stringify(editorContent) : ''}
                    isOpen={showWritingAssistant}
                    onClose={() => setShowWritingAssistant(false)}
                    onApplySuggestion={(original, replacement) => {
                      // Apply suggestion to content - simplified
                      console.log('Apply suggestion:', original, '->', replacement);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Template Gallery Modal */}
            <TemplateGallery
              isOpen={showTemplates}
              onClose={() => setShowTemplates(false)}
              onSelectTemplate={(templateContent) => {
                // Apply template to editor
                try {
                  const parsed = typeof templateContent === 'string' ? JSON.parse(templateContent) : templateContent;
                  setEditorContent(parsed);
                } catch (e) {
                  console.error('Failed to parse template:', e);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}