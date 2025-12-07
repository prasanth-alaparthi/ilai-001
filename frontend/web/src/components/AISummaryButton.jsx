// src/components/AISummaryButton.jsx
import React, { useState } from "react";
import apiClient from "../services/apiClient";

export default function AISummaryButton({ source = "journals", id, onDone }) {
  const [loading, setLoading] = useState(false);

  async function requestSummary() {
    setLoading(true);
    try {
      // Enqueue summarize job
      const resp = await apiClient.post("/ai/summary", null, { params: { source, id } });
      alert("Summary job queued. It will be available shortly.");
      onDone && onDone(resp.data);
    } catch (e) {
      console.error(e);
      alert("Failed to request summary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="px-3 py-1 rounded border" onClick={requestSummary} disabled={loading}>
      {loading ? "Queuing…" : "Generate AI Summary"}
    </button>
  );
}