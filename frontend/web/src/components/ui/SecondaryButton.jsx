import React from 'react';

/**
 * Subtle secondary button used for non-primary actions.
 */
export default function SecondaryButton({ children, onClick, className = '', ariaLabel }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-100 ${className}`}
    >
      {children}
    </button>
  );
}