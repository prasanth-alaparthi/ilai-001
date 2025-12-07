import React from 'react';
import SecondaryButton from './SecondaryButton';

/**
 * Small toggle component. Use in profile/settings to switch Kid Mode on/off.
 * Persisting value is the app's responsibility (call API or localStorage).
 */
export default function KidModeToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-medium text-slate-800">Kid Mode</div>
      <SecondaryButton ariaLabel="Toggle kid mode" onClick={() => onToggle(!enabled)}>
        {enabled ? 'ON' : 'OFF'}
      </SecondaryButton>
    </div>
  );
}