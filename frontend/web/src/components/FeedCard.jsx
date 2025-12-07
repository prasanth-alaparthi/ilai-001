import React, { useEffect, useRef, useState } from "react";
import apiClient from "../services/apiClient";
import ReactionBar from "./ReactionBar";
import FlashcardModal from "./FlashCardModel";
import QuizModal from "./QuizModel";

export default function FeedCard({ item }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [playingTts, setPlayingTts] = useState(false);
  const viewSentRef = useRef(false);
  const [showFlashModal, setShowFlashModal] = useState(false);
const [flashcardData, setFlashcardData] = useState(null);
const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => { loadMeta(); }, []);

  async function loadMeta() {
    try {
      // placeholder: could fetch aggregated counts if backend provides them
    } catch (e) { console.error(e); }
  }

  async function toggleBookmark() {
    try {
      const res = await apiClient.post(`/feed/${item.id}/bookmark`);
      setBookmarked(res.data.status === 'added');
    } catch (e) { console.error(e); }
  }

  async function sendReaction(type) {
    try {
      await apiClient.post(`/feed/${item.id}/reaction`, { reaction: type });
      // optional: update local UI
    } catch (e) { console.error(e); }
  }

  function sendView(duration = 5) {
    if (viewSentRef.current) return;
    apiClient.post(`/feed/${item.id}/view`, { duration }).catch(()=>{});
    viewSentRef.current = true;
  }

  function playTTS() {
    if (!("speechSynthesis" in window)) return alert("TTS not supported");
    const text = (item.title ? item.title + ". " : "") + (item.content || "");
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = ()=>setPlayingTts(false);
    utter.onerror = ()=>setPlayingTts(false);
    setPlayingTts(true);
    window.speechSynthesis.speak(utter);
    sendView(Math.max(5, Math.floor((text.length / 5) / 1)));
  }

  function openReader() {
    // basic: open in a new tab; you can replace with in-app reader route
    window.open(`/journal/${item.id}/view`, "_blank");
  }

  async function openFlashcards() {
  // try GET then fallback to generate (same as modal logic); modal handles create if missing
  setShowFlashModal(true);
}
function handleStartQuiz(flashcard, items) {
  setFlashcardData({ flashcard, items });
  setShowFlashModal(false);
  setShowQuiz(true);
}
async function handleQuizCompleted(result) {
  // optionally refresh XP or show toast
  try {
    // if server returns awardedXp, you could update UI; fetch user xp if needed
    console.log("Quiz completed:", result);
  } catch (e) { console.error(e); }
}

  return (
    <article className="p-4 bg-white rounded shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{item.title}</h3>
          <div className="text-sm text-slate-600 mt-2 line-clamp-4" dangerouslySetInnerHTML={{ __html: (item.content || "").slice(0, 500) }} />
          <div className="mt-3 flex items-center gap-2">
            <button className="px-3 py-1 rounded border text-sm" onClick={openReader}>Open</button>
            <button className="px-3 py-1 rounded border text-sm" onClick={playTTS}>{playingTts ? "Playing…" : "Read aloud"}</button>
            <button className="px-3 py-1 rounded border text-sm" onClick={()=>sendReaction("like")}>Like</button>
            <button className="px-3 py-1 rounded border text-sm" onClick={openFlashcards}>Flashcards</button>

            <div className="ml-auto flex items-center gap-2">
              <button className={`px-2 py-1 rounded ${bookmarked ? "bg-yellow-200" : "border"}`} onClick={toggleBookmark}>{bookmarked ? "Saved" : "Save"}</button>
            </div>
          </div>

          <div className="mt-3">
            <ReactionBar onReact={sendReaction} />
          </div>
        </div>
      </div>
    </article>
  );
}

