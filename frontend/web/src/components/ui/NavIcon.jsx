import React from 'react';

/**
 * Big icon nav item for mobile / kid mode.
 * Icon should be a React component (Heroicons etc.)
 */
export default function NavIcon({ Icon, label }) { // eslint-disable-line no-unused-vars
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center border border-gray-100">
        <Icon className="w-6 h-6 text-slate-700" />
      </div>
      <div className="text-xs font-medium text-slate-700">{label}</div>
    </div>
  );
}