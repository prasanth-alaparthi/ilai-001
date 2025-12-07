import React, { useState } from "react";
import apiClient from "../../services/apiClient";

export default function JournalPublicationsPage() {
  const [courseCode, setCourseCode] = useState("");
  const [publications, setPublications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const loadPubs = async () => {
    if (!courseCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const resp = await apiClient.get("/journal/publications", {
        params: { courseCode },
      });
      setPublications(resp.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load publications.");
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="flex flex-1 min-h-0 w-full px-4 py-4">
      <div className="flex flex-col flex-1 max-w-6xl mx-auto gap-3">
        <div className="flex items-center gap-3">
          <input
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            placeholder="Course code (e.g. BCA-2-OS)"
            className="flex-1 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 px-3 py-2 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
          />
          <button
            onClick={loadPubs}
            disabled={loading}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load publications"}
          </button>
        </div>

{error && (
          <div className="rounded-xl border border-red-400/80 bg-red-50/95 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 overflow-y-auto">
          {publications.length === 0 && !loading && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              No publications loaded yet. Enter a course code and click
              &quot;Load publications&quot;.
            </div>
          )}
          {publications.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md shadow-glass p-3 flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  Publication #{p.id}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-400/60 text-[10px]">
                  {p.courseCode}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Published by{" "}
                <span className="font-medium">{p.publishedBy}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Entry ID: {p.entryId} · Submission ID: {p.submissionId}
              </div>
              {p.tags && (
                <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  Tags: {p.tags}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}