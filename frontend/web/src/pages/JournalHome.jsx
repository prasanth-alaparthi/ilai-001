// src/pages/JournalHome.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import AnimatedJournalGrid from "../components/AnimatedNotesGrid";
import JournalControls from "../components/JournalControls";
import JournalEditorModal from "../components/JournalEditorModal";
import { useNavigate } from "react-router-dom";

export default function JournalHome() {
  const [entries, setEntries] = useState([]);
  const [openEditor, setOpenEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState(null);
  const [moods, setMoods] = useState([]);
  const navigate = useNavigate();

  async function load(q = "", mood = null) {
    try {
      const params = {};
      if (q) params.q = q;
      if (mood) params.mood = mood;
      const res = await apiClient.get("/journals", { params });
      const list = res.data?.content || res.data || [];
      setEntries(list);
      const setm = new Set(); list.forEach(e => (e.mood && setm.add(e.mood)));
      setMoods(Array.from(setm));
    } catch (e) { console.error(e); }
  }

  useEffect(() => { load(query, moodFilter); }, [query, moodFilter]);

  function onNew() {
    setEditingId(null);
    setOpenEditor(true);
  }
  function onSaved(entry) {
    load(query, moodFilter);
    navigate(`/journal/${entry.id}/view`);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <JournalControls onSearch={(q) => setQuery(q)} onNew={onNew} moods={moods} onFilterMood={(m) => setMoodFilter(m)} />
      </div>

      <div className="mb-6">
        <AnimatedJournalGrid entries={entries} onOpen={(id) => navigate(`/journal/${id}/view`)} />
      </div>

      <JournalEditorModal open={openEditor} onClose={() => setOpenEditor(false)} entryId={editingId} onSaved={onSaved} />
    </div>
  );
}