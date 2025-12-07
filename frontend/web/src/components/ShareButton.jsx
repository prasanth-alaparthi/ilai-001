// src/components/ShareButton.jsx
import React, { useState } from "react";
import apiClient from "../services/apiClient";

export default function ShareButton({ journalId }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  async function createShare() {
    if (!journalId) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`/journals/${journalId}/share`);
      const u = res.data?.url || res.data?.shareUrl;
      setUrl(u);
      // copy to clipboard
      try { await navigator.clipboard.writeText(u); alert("Share link copied to clipboard"); } catch (e) { console.error("Failed to copy to clipboard", e); }
    } catch (e) {
      console.error(e);
      alert("Failed to create share link");
    } finally { setLoading(false); }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button className="px-3 py-1 rounded border" onClick={createShare} disabled={loading}>{loading ? "Creating…" : "Create share link"}</button>
      {url && <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">{url}</a>}
    </div>
  );
}