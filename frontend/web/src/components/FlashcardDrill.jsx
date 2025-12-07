// src/components/FlashcardDrill.jsx
import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../services/apiClient";

export default function FlashcardDrill({ journalId, onClose }) {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);

  const gen = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.post(`/journals/${journalId}/flashcards`);
      const arr = res.data?.flashcards || res.data || [];
      setCards(arr);
      setIndex(0);
      setShowAnswer(false);
    } catch {
      console.error("Flashcard generation failed");
      alert("Flashcard generation failed");
    } finally { setLoading(false); }
  }, [journalId]);

  useEffect(() => { if (journalId) gen(); }, [journalId, gen]);

  if (loading) return <div className="p-4">Generating…</div>;
  if (!cards || cards.length === 0) return <div className="p-4">No flashcards available.</div>;

  const card = cards[index];

  return (
    <div className="p-4 bg-white rounded shadow max-w-xl mx-auto">
      <div className="text-sm text-slate-500">Card {index + 1} / {cards.length}</div>
      <div className="mt-4 p-6 border rounded">
        <div className="font-semibold text-lg">Q</div>
        <div className="mt-2">{card.q}</div>
        {showAnswer && (
          <>
            <div className="font-semibold text-lg mt-4">A</div>
            <div className="mt-2">{card.a}</div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button className="px-3 py-1 rounded border" onClick={() => setShowAnswer(s => !s)}>{showAnswer ? "Hide" : "Show Answer"}</button>
        <button className="px-3 py-1 rounded border" onClick={() => { if (index > 0) { setIndex(i => i - 1); setShowAnswer(false); } }}>Prev</button>
        <button className="px-3 py-1 rounded border" onClick={() => { if (index < cards.length - 1) { setIndex(i => i + 1); setShowAnswer(false); } else { alert('Done!'); onClose && onClose(); } }}>Next</button>
        <button className="ml-auto px-3 py-1 rounded border" onClick={() => gen()}>Regenerate</button>
      </div>
    </div>
  );
}