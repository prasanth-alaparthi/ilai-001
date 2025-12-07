import React, { useState } from "react";
import apiClient from "../../services/apiClient";
import JournalEditor from "../../components/JournalEditor";

export default function JournalReviewPage() {
  const [courseCode, setCourseCode] = useState("");
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [entryContent, setEntryContent] = useState("");
  const [decision, setDecision] = useState("ACCEPTED");
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadQueue = async () => {
    if (!courseCode.trim()) return;
    setError("");
    setInfo("");
    try {
      const resp = await apiClient.get(
        `/journal/teacher/queue`,
        { params: { courseCode } }
      );
      setQueue(resp.data || []);
      setSelected(null);
      setEntryContent("");
    } catch (e) {
      console.error(e);
      setError("Failed to load review queue.");
    }
  };

  const loadEntry = async (submission) => {
    setSelected(submission);
    setError("");
    setInfo("");
    try {
      const resp = await apiClient.get(`/journal/entries/${submission.entryId}`);
      const e = resp.data;
      setEntryContent(e.contentJson || "");
    } catch (e) {
      console.error(e);
      setError("Failed to load entry content.");
    }
  };

  const handleDecision = async () => {
    if (!selected) return;
    setError("");
    setInfo("");
    try {
      await apiClient.post(
        `/journal/teacher/submissions/${selected.id}/decision`,
        {
          status: decision,
          comments,
        }
      );
      setInfo("Decision applied.");
      await loadQueue();
    } catch (e) {
      console.error(e);
      setError("Failed to apply decision.");
    }
  };

  return (
    <div className="flex flex-1 min-h-0 w-full px-4 py-4">
      <div className="flex flex-1 min-h-0 gap-4 max-w-6xl mx-auto">
        {/* Left: filter + queue */}
        <aside className="w-80 flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md shadow-glass">
          <div className="px-3 py-3 border-b border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Review queue
            </div>
            <input
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="Course code, e.g. BCA-2-OS"
              className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-950/70 px-3 py-2 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
            <button
              onClick={loadQueue}
              className="w-full px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-400"
            >
              Load queue
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {queue.length === 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1 py-2">
                No submissions loaded. Set a course code and click &quot;Load
                queue&quot;.
              </div>
            )}
            {queue.map((s) => (
              <button
                key={s.id}
                onClick={() => loadEntry(s)}
                className={[
                  "w-full text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                  selected && selected.id === s.id
                    ? "bg-indigo-500/80 border-indigo-300 text-white shadow-sm shadow-indigo-500/50"
                    : "bg-white/40 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
                ].join(" ")}
              >
                <div className="font-semibold truncate">{s.authorUsername}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {s.courseCode} · {s.status}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right: entry + decision */}
        <section className="flex-1 flex flex-col min-h-0 gap-2">
          {error && (
            <div className="rounded-xl border border-red-400/80 bg-red-50/95 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-200">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-emerald-400/80 bg-emerald-50/95 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-200">
              {info}
            </div>
          )}

          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {selected
              ? `Reviewing ${selected.authorUsername}'s entry (${selected.courseCode})`
              : "Select a submission from the left to review"}
          </div>

          <div className="flex-1 min-h-0">
            <JournalEditor
              valueJson={entryContent}
              onChangeJson={() => { }}
              readOnly={true}
            />
          </div>

          {selected && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-600 dark:text-slate-300">
                  Decision:
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="ACCEPTED">Accept & publish</option>
                  <option value="REVISION_REQUESTED">Request revision</option>
                  <option value="REJECTED">Reject</option>
                </select>
              </div>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Feedback for the student (optional but recommended)…"
                className="w-full min-h-[80px] rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-950/80 px-3 py-2 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleDecision}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-400 shadow-md shadow-indigo-500/50"
                >
                  Apply decision
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}