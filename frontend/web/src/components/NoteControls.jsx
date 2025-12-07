// src/components/NoteControls.jsx
import React, { useState, useEffect } from "react";
import debounce from "debounce";
import { motion } from "framer-motion";

export default function NoteControls({ onSearch, onNew, tags = [], onFilterTag }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const handler = debounce(() => onSearch(q), 350);
    handler();
    return () => handler.clear && handler.clear();
  }, [q]); // eslint-disable-line

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <motion.input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes..."
          className="px-3 py-2 rounded-md border w-64"
          whileFocus={{ scale: 1.02, boxShadow: "0 0 0 3px rgba(99,102,241,0.5)" }} // Indigo focus ring
          transition={{ duration: 0.2 }}
        />
        <motion.button
          onClick={() => onNew()}
          className="px-3 py-2 rounded-md border bg-indigo-500 text-white hover:bg-indigo-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          New note
        </motion.button>      </div>

      <div className="flex items-center gap-2">
        {tags.slice(0,6).map(t => (
          <motion.button
            key={t}
            onClick={() => onFilterTag(t)}
            className="px-2 py-1 text-sm rounded-md border bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            #{t}
          </motion.button>
        ))}
      </div>
    </div>
  );
}