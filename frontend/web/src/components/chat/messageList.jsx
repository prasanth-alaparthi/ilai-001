import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Cpu, Check, CheckCircle, CornerUpLeft, CheckSquare } from "lucide-react";

export default function MessageList({ messages = [], meUserId, onReply, onAction }) {
  const elRef = useRef();

  console.log('[MessageList] Rendering with', messages.length, 'messages. Latest:', messages[0]);

  // Auto-scroll to show newest message (at top in flex-col-reverse)
  React.useEffect(() => {
    if (elRef.current && messages.length > 0) {
      elRef.current.scrollTop = 0;
    }
  }, [messages.length]);

  return (
    <div ref={elRef} className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col-reverse gap-6 custom-scrollbar scrollbar-hide">
      {messages.map((m, i) => {
        const isMe = m.senderId === meUserId;
        const isAi = m.type === "AI_RESPONSE" || m.senderId === "AI_BOT";
        const isSystem = m.type === "SYSTEM";
        const repliedMsg = m.replyToId ? messages.find(msg => msg.id === m.replyToId) : null;

        if (isSystem) {
          return (
            <div key={m.id || i} className="flex justify-center my-4">
              <span className="text-xs font-mono font-bold text-secondary bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full border border-black/10 dark:border-black/5 dark:border-white/10 uppercase tracking-wide">
                {m.content}
              </span>
            </div>
          )
        }

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            key={m.id || i}
            className={`flex gap-4 group/msg ${isMe ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg flex-shrink-0 border border-black/5 dark:border-white/10 ${isMe ? "bg-accent-glow text-white shadow-glow" :
              isAi ? "bg-purple-500/20 text-purple-400" : "bg-black/5 dark:bg-white/5 text-secondary"
              }`}>
              {isMe ? "ME" : isAi ? <Cpu size={16} /> : (m.senderId || "?").substring(0, 2).toUpperCase()}
            </div>

            <div className={`max-w-[75%] md:max-w-[65%] flex flex-col relative ${isMe ? "items-end" : "items-start"}`}>

              {/* Actions */}
              <div className={`absolute top-0 ${isMe ? "-left-14" : "-right-14"} flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200`}>
                <button
                  onClick={() => onReply(m)}
                  className="p-2 text-secondary hover:text-accent-glow bg-black/5 dark:bg-white/5 rounded-full shadow-lg border border-black/10 dark:border-black/5 dark:border-white/10 hover:border-accent-glow/50 transition-all"
                  title="Reply"
                >
                  <CornerUpLeft size={14} />
                </button>
                <button
                  onClick={() => onAction && onAction(m, 'TASK')}
                  className="p-2 text-secondary hover:text-green-400 bg-black/5 dark:bg-white/5 rounded-full shadow-lg border border-black/10 dark:border-black/5 dark:border-white/10 hover:border-green-400/50 transition-all"
                  title="Create Task"
                >
                  <CheckSquare size={14} />
                </button>
              </div>

              <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed relative shadow-xl backdrop-blur-sm border ${isMe
                ? "bg-accent-glow text-white rounded-tr-sm border-white/10"
                : isAi
                  ? "bg-black/5 dark:bg-white/5 text-primary rounded-tl-sm border-purple-500/20 shadow-purple-900/10"
                  : "bg-black/5 dark:bg-white/5 text-primary rounded-tl-sm border-black/10 dark:border-black/5 dark:border-white/10"
                }`}>

                {/* Replied Context */}
                {repliedMsg && (
                  <div className={`mb-2 text-xs border-l-2 pl-3 py-1 rounded bg-black/10 ${isMe ? "border-black/5 dark:border-white/100 text-white/80" : "border-accent-glow text-secondary"}`}>
                    <div className="font-bold mb-0.5">{repliedMsg.senderId === meUserId ? "You" : repliedMsg.senderId}</div>
                    <div className="truncate opacity-80 italic">{repliedMsg.content || "Media"}</div>
                  </div>
                )}

                {/* Media */}
                {m.mediaUrl && (
                  <div className="mb-3 mt-1 overflow-hidden rounded-lg">
                    {m.type === 'VIDEO' ? (
                      <video src={m.mediaUrl} controls className="w-full max-h-60 object-cover" />
                    ) : m.type === 'AUDIO' ? (
                      <audio src={m.mediaUrl} controls className="w-full" />
                    ) : (
                      <img src={m.mediaUrl} alt="Attachment" className="w-full max-h-60 object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>

              <div className={`text-[10px] mt-1.5 px-1 flex items-center gap-1.5 font-mono ${isMe ? "justify-end text-secondary/70" : "text-secondary/50"}`}>
                <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                {isMe && (
                  <span className="ml-1">
                    {m.status === 'READ' ? <CheckCircle size={12} className="text-accent-glow" /> : <Check size={12} />}
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