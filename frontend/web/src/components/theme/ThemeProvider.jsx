import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [kidMode, setKidMode] = useState(() => localStorage.getItem('ui.kidMode') === 'true');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('ui.theme') === 'dark');
  const [accent, setAccent] = useState('primary'); // 'primary' or 'kid'

  useEffect(() => {
    if (kidMode) {
      document.body.classList.add('kid-mode');
      setAccent('kid');
    } else {
      document.body.classList.remove('kid-mode');
      setAccent('primary');
    }
    localStorage.setItem('ui.kidMode', String(kidMode));
  }, [kidMode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ui.theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleKidMode = () => setKidMode(k => !k);
  const toggleTheme = () => setIsDarkMode(d => !d);

  return (
    <ThemeContext.Provider value={{ kidMode, toggleKidMode, isDarkMode, toggleTheme, accent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}