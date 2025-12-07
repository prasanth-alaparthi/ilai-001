import React from 'react';

/**
 * Small badge (neutral). Good for labels like "New", "Kid Mode", "Beta".
 */
export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-white to-slate-50 border border-gray-100 text-slate-700 ${className}`}>
      {children}
    </span>
  );
}