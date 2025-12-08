import './polyfills';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css'; // tailwind / global styles
// import '../styles/theme.css'; // Removed for redesign
import { ThemeProvider } from './components/theme/ThemeProvider';

// axios defaults are configured in apiClient.js
// No global defaults are needed here.

const container = document.getElementById('root');

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);