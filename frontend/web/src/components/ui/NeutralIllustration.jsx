import React from 'react';

/**
 * Small neutral SVG illustration (minimal, recolorable).
 * Use as inline hero imagery (keeps bundle small).
 */
export default function NeutralIllustration({ className = 'w-36 h-36' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Friendly illustration">
      <rect x="8" y="8" width="104" height="104" rx="16" fill="#F8FAFC" stroke="#E6EEF7" />
      <circle cx="60" cy="52" r="16" fill="#E6EEF7" />
      <path d="M40 84c6-6 20-8 40 0" stroke="#CFEAF3" strokeWidth="4" strokeLinecap="round" />
      <rect x="36" y="28" width="48" height="6" rx="3" fill="#EEF2FF" />
    </svg>
  );
}