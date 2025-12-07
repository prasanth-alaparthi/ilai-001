
import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";

export default function DailyPromptWidget() {
  const [prompt, setPrompt] = useState(null);
  const [response, setResponse] = useState("");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get("/journal/prompt/today");
        setPrompt(res.data.prompt);
        const me = await apiClient.get("/journal/prompt/myresponses");
        setStreak(me.data.streak || 0);
      } catch (err) {
        console.error("Failed to load daily prompt", err);
      }
    }
    load();
  }, []);

  async function submit() {
    if (!prompt || !prompt.id) return alert("No prompt available");
    try {
      const res = await apiClient.post(`/journal/prompt/${prompt.id}/respond`, { response });
      setStreak(res.data.streak.streak);
      setResponse("");
      alert("Saved — streak: " + res.data.streak.streak);
    } catch (e) { console.error(e); alert("Failed to save"); }
  }

  if (!prompt) return <div className="p-3 rounded border">Loading prompt…</div>;

  return (
    <div className="p-3 rounded border">
      <div className="text-sm text-slate-200 font-medium">Daily prompt</div>
      <div className="mt-2 text-sm text-slate-100">{prompt.prompt}</div>
      <textarea value={response} onChange={e => setResponse(e.target.value)} className="w-full mt-3 p-2 rounded bg-slate-900 border border-slate-800" rows={4} />
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-slate-400">Streak: {streak}</div>
        <div>
          <button onClick={submit} className="px-3 py-1 rounded bg-indigo-600 text-white">Save response</button>
        </div>
      </div>
    </div>
  );
}