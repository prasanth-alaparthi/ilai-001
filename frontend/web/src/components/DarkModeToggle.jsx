// src/components/DarkModeToggle.jsx
import React, { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("ui:dark") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("ui:dark", "1");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("ui:dark", "0");
    }
  }, [dark]);

  return (
    <button aria-pressed={dark} onClick={() => setDark(d => !d)}
            className="px-3 py-1 rounded-md border dark:bg-slate-800 dark:border-slate-700"
            title={dark ? "Switch to light" : "Switch to dark"}>
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}