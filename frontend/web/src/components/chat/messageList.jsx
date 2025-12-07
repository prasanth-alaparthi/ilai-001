import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCpu, FiCheck, FiCheckCircle, FiCornerUpLeft, FiCheckSquare } from "react-icons/fi";

export default function MessageList({ messages = [], meUserId, onReply, onAction }) {
  const elRef = useRef();

  // No manual scroll needed with flex-col-reverse

  return (
    <div ref={elRef} className="flex-1 overflow-y-auto p-6 flex flex-col-reverse gap-6 bg-slate-50 dark:bg-slate-900 custom-scrollbar scrollbar-hide">
      {messages.map((m, i) => {
        const isMe = m.senderId === meUserId;
        const isAi = m.type === "AI_RESPONSE" || m.senderId === "AI_BOT";
        const isSystem = m.type === "SYSTEM";
        const repliedMsg = m.replyToId ? messages.find(msg => msg.id === m.replyToId) : null;

        if (isSystem) {
          return (
            <div key={m.id || i} className="flex justify-center my-4">
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {m.content}
              </span>
            </div>
          )
        }

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={m.id || i}
            className={`flex gap-3 group/msg ${isMe ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${isMe ? "bg-indigo-100 text-indigo-600" :
              isAi ? "bg-purple-100 text-purple-600" : "bg-white text-slate-600 border border-slate-200"
              }`}>
              {isMe ? "ME" : isAi ? <FiCpu size={14} /> : (m.senderId || "?").substring(0, 2).toUpperCase()}
            </div>

            <div className={`max-w-[70%] flex flex-col relative ${isMe ? "items-end" : "items-start"}`}>

              {/* Actions */}
              <div className={`absolute top-2 ${isMe ? "-left-16" : "-right-16"} flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                <button
                  onClick={() => onReply(m)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
                  title="Reply"
                >
                  <FiCornerUpLeft size={14} />
                </button>
                <button
                  onClick={() => onAction && onAction(m, 'TASK')}
                  className="p-1.5 text-slate-400 hover:text-green-600 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
                  title="Create Task"
                >
                  <FiCheckSquare size={14} />
                </button>
              </div>

              <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed relative group ${isMe
                ? "bg-indigo-600 text-white rounded-tr-none"
                : isAi
                  ? "bg-white border border-purple-100 text-slate-800 rounded-tl-none shadow-purple-100"
                  : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                }`}>

                {/* Replied Context */}
                {repliedMsg && (
                  <div className={`mb-2 text-xs border-l-2 pl-2 opacity-80 ${isMe ? "border-indigo-300" : "border-slate-300"}`}>
                    <div className="font-semibold opacity-75">{repliedMsg.senderId === meUserId ? "You" : repliedMsg.senderId}</div>
                    <div className="truncate">{repliedMsg.content || "Media"}</div>
                  </div>
                )}

                {/* Media */}
                {m.mediaUrl && (
                  <div className="mb-2">
                    {m.type === 'VIDEO' ? (
                      <video src={m.mediaUrl} controls className="rounded-lg max-w-full max-h-60 object-cover" />
                    ) : m.type === 'AUDIO' ? (
                      <audio src={m.mediaUrl} controls className="w-full" />
                    ) : (
                      <img src={m.mediaUrl} alt="Attachment" className="rounded-lg max-w-full max-h-60 object-cover" />
                    )}
                  </div>
                )}

                {m.content}
              </div>
              <div className={`text-[10px] mt-1 px-1 flex items-center gap-1 ${isMe ? "justify-end text-slate-400" : "text-slate-400"}`}>
                <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isMe && (
                  <span className="ml-1">
                    {m.status === 'READ' ? <FiCheckCircle size={12} className="text-blue-500" /> : <FiCheck size={12} />}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}