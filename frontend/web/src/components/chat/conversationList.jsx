// src/components/chat/ConversationList.jsx
import React from "react";

export default function ConversationList({ conversations = [], onSelect, selectedId, currentUserId }) {
  return (
    <div className="w-80 border-r p-4 space-y-3 overflow-y-auto">
      <h3 className="text-lg font-semibold">Conversations</h3>
      <div className="space-y-2">
        {conversations.map(c => {
          let title = c.name;
          if (!title) {
            if (c.type === "AI") {
              title = "AI Assistant";
            } else if (c.type === "DIRECT") {
              const otherId = c.participantIds?.find(p => p !== currentUserId);
              title = otherId ? `Chat with ${otherId}` : "Direct Chat";
            } else {
              title = "Untitled Chat";
            }
          }

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`w-full text-left p-3 rounded-lg ${selectedId === c.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}
            >
              <div className="font-medium">{title}</div>
              <div className="text-xs text-slate-500">{c.lastMessagePreview || ""}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}