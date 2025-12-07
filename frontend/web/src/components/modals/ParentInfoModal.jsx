// src/components/modals/ParentInfoModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ParentInfoModal:
 * - short explanation of parental features
 * - CTA to go to Parent Settings (where parent can set PIN)
 */
export default function ParentInfoModal({ onClose }) {
  const navigate = useNavigate();

  function goToParentSettings() {
    onClose?.();
    // navigate to profile settings or parental settings page if exists
    navigate('/profile/me'); // update to your parent settings route when available
    // optionally dispatch a custom event to open the PIN setup modal
    window.dispatchEvent(new CustomEvent('open-parent-settings'));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Parent controls & safety</h3>
            <p className="text-sm text-slate-500 mt-1">Everything here is built to keep your child safe while learning.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">Close</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <h4 className="font-medium">Parental PIN</h4>
              <p className="text-sm text-slate-600 mt-1">Set a PIN to approve purchases and unlock restricted features.</p>
            </div>
            <div className="p-3 bg-sky-50 rounded-lg">
              <h4 className="font-medium">Moderation</h4>
              <p className="text-sm text-slate-600 mt-1">Report and block content. We review flagged items quickly.</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/80">
            <p className="text-sm text-slate-600">Want to set up a Parent PIN now?</p>
            <div className="mt-3 flex gap-2">
              <button onClick={goToParentSettings} className="px-4 py-2 rounded-md bg-indigo-600 text-white">Set Parent PIN</button>
              <button onClick={onClose} className="px-4 py-2 rounded-md border">Maybe later</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}