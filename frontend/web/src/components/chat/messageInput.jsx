import React, { useState, useRef } from "react";
import { FiSend, FiPaperclip, FiX } from "react-icons/fi";
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
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col">
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-1 h-8 bg-indigo-500 rounded-full flex-shrink-0" />
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Replying to {replyingTo.senderId}</span>
              <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{replyingTo.content || "Media"}</span>
            </div>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400">
            <FiX size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*"
        />

        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
          <FiPaperclip size={20} />
        </button>

        <div className="flex-1 relative">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-transparent focus:border-indigo-500 rounded-full py-3 px-5 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100"
            placeholder={uploading ? "Uploading..." : "Type a message..."}
            disabled={disabled || uploading}
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled || uploading}
          className="p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95 flex items-center justify-center"
        >
          <FiSend size={18} className={text.trim() ? "ml-0.5" : ""} />
        </button>
      </form>
    </div>
  );
}