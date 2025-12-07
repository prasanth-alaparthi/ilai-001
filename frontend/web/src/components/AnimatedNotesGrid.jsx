// src/components/AnimatedNotesGrid.jsx
import React from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function AnimatedNotesGrid({ notes = [], onOpen }) {
  if (!notes.length)
    return <div className="text-sm text-surface-500 dark:text-surface-400">No notes yet — create one to get started.</div>;

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((n, i) => (
        <motion.button
          key={n.id}
          onClick={() => onOpen(n.id)}
          initial={{ opacity: 0, y: 10, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: Math.min(i * 0.03, 0.5), type: "spring", stiffness: 110, damping: 16 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="group relative text-left p-6 rounded-2xl border border-surface-200 dark:border-surface-700
                     bg-white dark:bg-surface-800/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700
                     transition-all duration-200 ease-out flex flex-col h-48"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100 truncate mb-2">
              {n.title || "Untitled"}
            </h3>
            <div
              className="text-sm text-surface-600 dark:text-surface-300 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: n.content || "No content" }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-surface-400 dark:text-surface-500 border-t border-surface-100 dark:border-surface-700/50 pt-3 w-full">
            <span>{n.updatedAt ? formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true }) : "Just now"}</span>
            {n.isPinned && <span className="text-amber-400">★</span>}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

