
import React from 'react';

/**
 * Neutral elevated card used across the app.
 */
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white/85 backdrop-blur p-4 rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}