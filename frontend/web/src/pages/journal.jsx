import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import RichNoteEditor from "../components/RichNoteEditor";
import VoiceRecorder from "../components/VoiceRecorder";

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [contentJson, setContentJson] = useState("");
  const [status, setStatus] = useState("DRAFT");

  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoadingEntries(true);
    setError("");
    try {
      const resp = await apiClient.get("/journal/entries");
      setEntries(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load entries.");
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSelectEntry = async (entryId) => {
    setError("");
    setInfo("");
    try {
      const resp = await apiClient.get(`/journal/entries/${entryId}`);
      const e = resp.data;
      setSelectedId(e.id);
      setTitle(e.title || "");
      setCourseCode(e.courseCode || "");
      setContentJson(e.contentJson || "");
      setStatus(e.status || "DRAFT");
    } catch (e) {
      console.error(e);
      setError("Failed to load entry.");
    }
  };

  const handleNewEntry = () => {
    setSelectedId(null);
    setTitle("");
    setCourseCode("");
    setContentJson("");
    setStatus("DRAFT");
    setError("");
    setInfo("");
  };

  const handleSaveDraft = async () => {
    if (!title.trim() && !contentJson.trim()) {
      setError("Entry cannot be completely empty.");
      return;
    }
    setSaving(true);
    setError("");
    setInfo("");

    try {
      if (selectedId == null) {
        const resp = await apiClient.post("/journal/entries", {
          title,
          contentJson,
          contentHtml: null,
          courseCode,
        });
        const created = resp.data;
        setSelectedId(created.id);
        setStatus(created.status || "DRAFT");
        await loadEntries();
        setInfo("Draft saved.");
      } else {
        const resp = await apiClient.put(`/journal/entries/${selectedId}`, {
          title,
          contentJson,
          contentHtml: null,
          courseCode,
        });
        const updated = resp.data;
        setStatus(updated.status || "DRAFT");
        await loadEntries();
        setInfo("Draft updated.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedId) {
      setError("Save the entry first before submitting.");
      return;
    }
    if (!courseCode.trim()) {
      setError("Please set a course/class code before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    setInfo("");

    try {
      await apiClient.post(`/journal/entries/${selectedId}/submit`, {
        courseCode,
        className: "", // later you can add a separate field
      });
      await loadEntries();
      setStatus("SUBMITTED");
      setInfo("Submitted for review.");
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data || "Failed to submit entry for review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAudioUpload = (uploadResult) => {
    if (uploadResult && uploadResult.url) {
      const currentContent = contentJson ? JSON.parse(contentJson) : { type: 'doc', content: [] };
      currentContent.content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: `Audio recording: ${uploadResult.url}` }]
      });
      setContentJson(JSON.stringify(currentContent));
    }
  }

  return (
    <div className="flex flex-1 min-h-0 w-full px-4 py-4">
      <div className="flex flex-1 min-h-0 gap-4 max-w-6xl mx-auto">
        {/* Left panel: entries */}
        <aside className="w-72 flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md shadow-glass">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                My journal entries
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {loadingEntries
                  ? "Loading…"
                  : `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
              </div>
            </div>
            <button
              onClick={handleNewEntry}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-400 shadow-md shadow-indigo-500/40"
            >
              New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {entries.length === 0 && !loadingEntries && (
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1 py-2">
                No entries yet. Click &quot;New&quot; to start journalling.
              </div>
            )}
            {entries.map((e) => (
              <button
                key={e.id}
                onClick={() => handleSelectEntry(e.id)}
                className={[
                  "w-full text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                  selectedId === e.id
                    ? "bg-indigo-500/80 border-indigo-300 text-white shadow-sm shadow-indigo-500/50"
                    : "bg-white/40 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
                ].join(" ")}
              >
                <div className="font-semibold truncate">{e.title || "Untitled"}</div>
                <div className="flex items-center justify-between mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{e.courseCode || "No course"}</span>
                  <span>{e.status || "DRAFT"}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right panel: editor */}
        <section className="flex-1 flex flex-col min-h-0 gap-2">
          {error && (
            <div className="rounded-xl border border-red-400/80 bg-red-50/95 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-200">
              {String(error)}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-emerald-400/80 bg-emerald-50/95 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-200">
              {info}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title"
              className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
            <input
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="Course / class (e.g. BCA-2-OS)"
              className="w-56 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 px-3 py-2 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex-1 min-h-0">
            <RichNoteEditor
              value={contentJson ? JSON.parse(contentJson) : undefined}
              onChange={(content) => setContentJson(JSON.stringify(content))}
              noteId={selectedId}
            />
          </div>
          {selectedId && (
            <div className="mt-2">
              <VoiceRecorder journalId={selectedId} onUploaded={handleAudioUpload} />
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-950/80 px-3 py-1 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Status: <strong>{status}</strong>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900/80 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                onClick={handleSubmitForReview}
                disabled={submitting || !selectedId}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/50"
              >
                {submitting ? "Submitting…" : "Submit for review"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

