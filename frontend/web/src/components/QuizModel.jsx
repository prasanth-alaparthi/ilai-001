import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

/**
 * Props:
 *  - flashcard (object)
 *  - items (array of {question, answer})
 *  - onClose
 * Shows a quick 5-question quiz (or less if few items).
 */
export default function QuizModal({ flashcard, items = [], onClose, onCompleted }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(()=>{ prepare(); }, [flashcard, items]);

  function prepare() {
    // build multiple-choice questions: correct answer + 3 random answers from other items
    const pool = items.map(it => ({ q: it.question, a: it.answer }));
    // pick up to 5 questions
    const take = Math.min(5, pool.length);
    const qs = [];
    const rnd = [...pool];
    shuffle(rnd);
    for (let i=0;i<take;i++) {
      const correct = rnd[i];
      const other = rnd.filter((_, idx) => idx !== i).slice(0,3).map(x => x.a);
      const choices = shuffleArray([correct.a, ...other]).slice(0,4);
      qs.push({ question: correct.q, correct: correct.a, choices });
    }
    setQuestions(qs);
    setIndex(0); setSelected(null); setScore(0); setFinished(false);
  }

  function shuffle(a) { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
  function shuffleArray(arr) { const copy = [...arr]; shuffle(copy); return copy; }

  async function submitAnswer() {
    const q = questions[index];
    if (!q || selected === null) return;
    if (selected === q.correct) setScore(s => s + 1);
    if (index + 1 >= questions.length) {
      // finish
      setFinished(true);
      // send attempt to server and award xp
      setSubmitting(true);
      try {
        const res = await apiClient.post(`/flashcards/${flashcard.id}/attempt`, { score: score + (selected === q.correct ? 1 : 0), total: questions.length });
        // inform parent of awarded XP
        onCompleted && onCompleted(res.data);
      } catch (e) {
        console.error(e);
      } finally { setSubmitting(false); }
    } else {
      setIndex(i => i + 1);
      setSelected(null);
    }
  }

  if (!flashcard) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow w-full max-w-2xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Quick Drill — {flashcard.title}</h3>
          <div>
            <button className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="mt-4">
          {!finished ? (
            <>
              <div className="text-sm text-slate-500">Question {index+1} / {questions.length}</div>
              <div className="mt-3 p-4 bg-gray-50 rounded">
                <div className="font-medium">{questions[index]?.question}</div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {questions[index]?.choices.map((c,i) => (
                    <button key={i} className={`text-left p-2 rounded border ${selected === c ? "bg-indigo-100" : ""}`} onClick={()=>setSelected(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button className="px-3 py-1 rounded border" onClick={()=>{ setIndex(Math.max(0, index-1)); setSelected(null); }}>Prev</button>
                <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={submitAnswer}>{index+1 === questions.length ? (submitting ? "Submitting..." : "Finish") : "Next"}</button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-semibold">Score: {score} / {questions.length}</div>
              <div className="mt-3 text-sm text-slate-600">Nice work — XP awarded automatically.</div>
              <div className="mt-4">
                <button className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}