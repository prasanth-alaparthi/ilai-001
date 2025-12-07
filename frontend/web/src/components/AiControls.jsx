// src/components/AiControls.jsx
import React, { useState, useRef } from "react";
import apiClient from "../services/apiClient";

/*
  AiControls:
  - props.note: the full note object { id, title, content }
  - endpoints (backend):
    POST /api/ai/summarize { noteId, content } -> { summary }
    POST /api/ai/explain { noteId, content, level } -> { explanation }
    POST /api/ai/flashcards { noteId, content } -> { flashcards: [{q,a}, ...] }
    POST /api/notes/share/{id} -> { token, url }
*/

export default function AiControls({ note }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [explain, setExplain] = useState(null);
  const [flashcards, setFlashcards] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [ttsState, setTtsState] = useState("idle"); // idle, playing, paused
  const synthRef = useRef(window.speechSynthesis);

  // Text-to-speech using Web Speech API
  function playTts(text) {
    if (!window.speechSynthesis) {
      alert("Speech synthesis not supported in this browser.");
      return;
    }
    stopTts();
    const utter = new SpeechSynthesisUtterance(text);
    // choose voice if you want
    // const voices = speechSynthesis.getVoices();
    // utter.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.onend = () => setTtsState("idle");
    utterRef.current = utter;
    synthRef.current.speak(utter);
    setTtsState("playing");
  }
  function pauseTts() {
    if (synthRef.current.speaking) {
      synthRef.current.pause();
      setTtsState("paused");
    }
  }
  function resumeTts() {
    if (synthRef.current.paused) {
      synthRef.current.resume();
      setTtsState("playing");
    }
  }
  function stopTts() {
    if (synthRef.current.speaking || synthRef.current.paused) {
      synthRef.current.cancel();
    }
    utterRef.current = null;
    setTtsState("idle");
  }

  return (
    <div className="mt-4 p-3 rounded-md border bg-white dark:bg-slate-800">
      <div className="flex items-center gap-3">
        <button className="px-3 py-1 rounded-md border" onClick={doSummary} disabled={loading}>Summarize</button>
        <button className="px-3 py-1 rounded-md border" onClick={() => doExplain("easy")} disabled={loading}>Explain (easy)</button>
        <button className="px-3 py-1 rounded-md border" onClick={() => doExplain("detailed")} disabled={loading}>Explain (detailed)</button>
        <button className="px-3 py-1 rounded-md border" onClick={doFlashcards} disabled={loading}>Flashcards</button>
        <button className="px-3 py-1 rounded-md border" onClick={doShare} disabled={loading}>Share</button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="text-sm font-medium">Listen:</div>
        <button className="px-3 py-1 rounded-md border" onClick={() => playTts(note?.title + ". " + (note?.content || ""))}>Play</button>
        <button className="px-3 py-1 rounded-md border" onClick={pauseTts}>Pause</button>
        <button className="px-3 py-1 rounded-md border" onClick={resumeTts}>Resume</button>
        <button className="px-3 py-1 rounded-md border" onClick={stopTts}>Stop</button>
        <div className="ml-3 text-xs text-gray-500">Status: {ttsState}</div>
      </div>

      {summary && (
        <div className="mt-3 p-3 rounded-md bg-gray-50 dark:bg-slate-900">
          <div className="font-semibold">Summary</div>
          <div className="mt-2 text-sm">{summary}</div>
          <div className="mt-2">
            <button className="px-2 py-1 rounded-md border" onClick={() => playTts(summary)}>Listen summary</button>
          </div>
        </div>
      )}

      {explain && (
        <div className="mt-3 p-3 rounded-md bg-gray-50 dark:bg-slate-900">
          <div className="font-semibold">Explanation</div>
          <div className="mt-2 text-sm">{explain}</div>
          <div className="mt-2">
            <button className="px-2 py-1 rounded-md border" onClick={() => playTts(explain)}>Listen explanation</button>
          </div>
        </div>
      )}

      {flashcards && flashcards.length > 0 && (
        <div className="mt-3 p-3 rounded-md bg-gray-50 dark:bg-slate-900">
          <div className="font-semibold">Flashcards</div>
          <ul className="mt-2 space-y-2">
            {flashcards.map((f, idx) => (
              <li key={idx} className="p-2 border rounded-md">
                <div className="font-medium">Q: {f.q}</div>
                <div className="text-sm text-gray-600">A: {f.a}</div>
                <div className="mt-2">
                  <button className="px-2 py-1 rounded-md border mr-2" onClick={() => playTts(f.q)}>Listen Q</button>
                  <button className="px-2 py-1 rounded-md border" onClick={() => playTts(f.a)}>Listen A</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shareUrl && (
        <div className="mt-3 text-sm">
          Share link (public, expires depending on backend):{" "}
          <a href={shareUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">{shareUrl}</a>
        </div>
      )}
    </div>
  );
}