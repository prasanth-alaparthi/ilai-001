import React from 'react';

/**
 * Neutral primary action button.
 * Balanced gradient (indigo -> teal) with warm coral accent for focus states.
 */
export default function PrimaryButton({ children, onClick, className = '', type = 'button', ariaLabel }) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold shadow-sm transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-200 ${className}`}
      style={{
        background: 'linear-gradient(90deg,#5063E3 0%,#06B6D4 70%)',
        color: 'white'
      }}
    >
      {children}
    </button>
  );
}