import React, { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";

export default function AdminUsersPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

const loadPending = async () => {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const resp = await apiClient.get("/admin/users/pending");
      setPending(resp.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to load pending users. Are you an admin?"
      );
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    loadPending();
  }, []);

const handleAction = async (id, action) => {
    setActionLoadingId(id);
    setError("");
    setInfo("");
    try {
      await apiClient.post(`/admin/users/${id}/${action}`);
      setInfo(`User ${action}d successfully.`);
      await loadPending();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          `Failed to ${action} user. You might not have permission.`
      );
    } finally {
      setActionLoadingId(null);
    }
  };

return (
    <div className="flex flex-1 min-h-0 w-full px-4 py-4 bg-transparent">
      <div className="flex flex-col flex-1 max-w-6xl mx-auto gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Pending users
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Approve, block or mark accounts as deleted. Only visible to system
            admins.
          </p>
        </div>

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

<div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-glass p-3 flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {loading
                ? "Loading pending users…"
                : `${pending.length} account${
                    pending.length === 1 ? "" : "s"
                  } awaiting verification`}
            </div>
            <button
              onClick={loadPending}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

<div className="flex-1 overflow-y-auto space-y-2">
            {pending.length === 0 && !loading && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                No pending accounts at the moment.
              </div>
            )}

{pending.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 px-3 py-2 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 dark:text-slate-50">
                    {u.username}
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-400/50">
                      {u.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    #{u.id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {u.email}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Status:{" "}
                    <span className="font-medium text-amber-600 dark:text-amber-300">
                      {u.status}
                    </span>
                    {" · "}
                    Email verified:{" "}
                    <span className="font-medium">
                      {u.emailVerified ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(u.id, "approve")}
                      disabled={actionLoadingId === u.id}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {actionLoadingId === u.id ? "Working…" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleAction(u.id, "block")}
                      disabled={actionLoadingId === u.id}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-60"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => handleAction(u.id, "delete")}
                      disabled={actionLoadingId === u.id}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold bg-red-500 text-white hover:bg-red-400 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}