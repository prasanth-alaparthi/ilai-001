import React, { useState, useRef } from "react";
import { Send, Paperclip, X } from "lucide-react";
import apiClient from "../../services/apiClient";

export default function MessageInput({ onSend, disabled, replyingTo, onCancelReply }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onSend(text, null);
    setText("");
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post("/chat/media", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const url = res.data.url;
      await onSend(null, url);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col relative w-full">
      {replyingTo && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 px-4 py-3 bg-black/10 dark:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-1 h-8 bg-accent-glow rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(74,144,226,0.6)]" />
            <div className="flex flex-col text-xs">
              <span className="font-bold text-accent-glow">Replying to {replyingTo.senderId}</span>
              <span className="text-secondary truncate max-w-[200px] opacity-80">{replyingTo.content || "Media"}</span>
            </div>
          </div>
          <button onClick={onCancelReply} className="p-1.5 hover:bg-white/10 rounded-full text-secondary hover:text-primary transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-3 bg-surface/30 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg relative z-10 w-full">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*"
        />

        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-secondary hover:text-accent-glow transition-all rounded-full hover:bg-white/5 mx-1">
          <Paperclip size={20} />
        </button>

        <div className="flex-1 relative">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full bg-transparent border-none text-primary placeholder:text-secondary/50 focus:ring-0 text-sm font-medium py-2"
            placeholder={uploading ? "Uploading..." : "Type a message..."}
            disabled={disabled || uploading}
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled || uploading}
          className="p-3 bg-gradient-to-r from-accent-blue to-accent-glow text-white rounded-full shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/40 disabled:opacity-50 disabled:shadow-none transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center m-1"
        >
          <Send size={18} className={text.trim() ? "translate-x-0.5 transition-transform" : ""} />
        </button>
      </form>
    </div>
  );
}