// src/pages/PublicJournalView.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../services/apiClient";
import DOMPurify from "dompurify";
import { marked } from "marked";

export default function PublicJournalView() {
  const { token } = useParams();
  const [entry, setEntry] = useState(null);
  useEffect(() => { (async () => { try { const res = await apiClient.get(`/public/journal/${token}`); setEntry(res.data); } catch { setEntry(null); } })() }, [token]);
  if (!entry) return <div className="p-6">Not found</div>;
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">{entry.title}</h1>
      <div className="mt-4 prose" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(entry.content || "")) }} />
    </div>
  );
}
