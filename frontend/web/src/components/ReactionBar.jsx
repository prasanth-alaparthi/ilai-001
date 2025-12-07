import React from "react";

/*
Simple reaction bar with animated small icons.
Later connect counts and animation.
*/
const REACTIONS = [
  { key: "like", label: "👍" },
  { key: "love", label: "💖" },
  { key: "star", label: "⭐" },
  { key: "clap", label: "👏" },
  { key: "think", label: "🤔" }
];

export default function ReactionBar({ onReact }) {
  return (
    <div className="flex items-center gap-2">
      {REACTIONS.map(r => (
        <button key={r.key} className="px-2 py-1 rounded hover:scale-110 transition" onClick={() => onReact(r.key)}>
          <span className="text-lg">{r.label}</span>
        </button>
      ))}
    </div>
  );
}
