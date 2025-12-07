import React, { useState } from "react";
import apiClient from "../services/apiClient";

export default function ShareLinkButton({ noteId }) {
  const [url, setUrl] = useState(null);
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    try {
      const res = await apiClient.post(`/notes/${noteId}/share`, { days: 30 });
      const u = res.data.url;
      // full URL (adjust base as needed)
      const full = window.location.origin + u;
      navigator.clipboard.writeText(full);
      setUrl(full);
      alert("Share link copied to clipboard");
    } catch (e) {
      console.error(e);
      alert("Failed to create share link");
    } finally { setCreating(false); }
  }

  return (
    <div>
      <button onClick={create} className="px-3 py-1 rounded border">{creating ? "Creating…" : "Create share link"}</button>
      {url && <div className="text-xs mt-2 text-slate-400">Copied: {url}</div>}
    </div>
  );
}