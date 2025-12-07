// frontend/src/components/FlashcardModal.jsx

import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

export default function FlashcardModal({ feedItemId, onClose, onStartQuiz }) {
  const [flashcard, setFlashcard] = useState(null);
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ if (feedItemId) load(); }, [feedItemId]);

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.get(`/feed/${feedItemId}/flashcards`);
      setFlashcard(res.data.flashcard);
      setItems(res.data.items || []);
      setIndex(0);
      setFlipped(false);
    } catch (e) {
      // if not exist, generate
      try {
        const gen = await apiClient.post(`/feed/${feedItemId}/flashcards`);
        setFlashcard(gen.data.flashcard);
        setItems(gen.data.items || []);
        setIndex(0);
        setFlipped(false);
      } catch (err) {
        console.error(err);
      }
    } finally { setLoading(false); }
  }

  if (!flashcard) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow w-[90%] max-w-xl">
          {loading ? <div>Loading flashcards…</div> : <div>No flashcards available.</div>}
          <div className="mt-4 text-right">
            <button className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const current = items[index];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow w-full max-w-2xl p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{flashcard.title}</h3>
          <div>
            <button className="px-3 py-1 rounded border" onClick={() => onStartQuiz && onStartQuiz(flashcard, items)}>Start Quiz</button>
            <button className="ml-2 px-3 py-1 rounded border" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="mt-6">
          {items.length === 0 ? <div className="text-sm text-slate-500">No items found</div> : (
            <div className="flex flex-col items-center">
              <div className={`w-full max-w-2xl p-6 rounded-lg shadow-md transition-transform ${flipped ? "rotateY-180" : ""}`} style={{ perspective: 1000 }}>
                <div>
                  <div className="text-sm text-slate-500">Card {index + 1} / {items.length}</div>
                  <div className="mt-2 text-xl font-medium">{current?.question}</div>
                </div>
                {flipped && <div className="mt-4 p-3 bg-gray-50 w-full rounded">{current?.answer}</div>}
              </div>

              <div className="mt-4 flex gap-2">
                <button className="px-3 py-1 rounded border" onClick={() => { setFlipped(!flipped); }}>{flipped ? "Hide answer" : "Show answer"}</button>
                <button className="px-3 py-1 rounded border" onClick={() => setIndex(Math.max(0, index -1))}>Prev</button>
                <button className="px-3 py-1 rounded border" onClick={() => setIndex(Math.min(items.length -1, index +1))}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}