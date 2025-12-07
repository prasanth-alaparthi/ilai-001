// src/pages/SemanticSearch.jsx
import React, { useState } from "react";
import apiClient from "../services/apiClient";

export default function SemanticSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  async function doSearch() {
    setLoading(true);
    try {
      // Try the semantic search endpoint
      const res = await apiClient.get("/ai/search", { params: { q, source: "journals", topK: 10 } });
      setResults(res.data || []);
    } catch (e) {
      console.error(e);
      alert("Semantic search not enabled on server. Falling back to text search.");
      // Fallback to server text search
      try {
        const res2 = await apiClient.get("/journals", { params: { q } });
        setResults((res2.data && res2.data.content) ? res2.data.content : res2.data || []);
      } catch (e2) {
        console.error(e2);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Semantic search</h2>
      <div className="flex gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search semantically..." className="px-3 py-2 rounded border w-full" />
        <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={doSearch} disabled={loading}>{loading ? "Searching..." : "Search"}</button>
      </div>

      <div className="space-y-3">
        {results.map((r, idx) => (
          <div key={idx} className="p-3 border rounded">
            <div className="font-semibold">{r.title || r.id}</div>
            <div className="text-sm mt-1">{r.excerpt || r.content?.slice(0, 200)}</div>
            <div className="text-xs text-slate-500 mt-2">{r.mood ? `Mood: ${r.mood}` : ""} {r.updatedAt ? ` • ${new Date(r.updatedAt).toLocaleString()}` : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
