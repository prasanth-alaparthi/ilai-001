// src/components/modals/OnboardingModal.jsx
import React, { useState } from 'react';

/**
 * Lightweight onboarding modal to showcase app for kids & parents.
 * - Step 1: Welcome
 * - Step 2: Kid Mode explanation
 * - Step 3: Parent reassurance + CTA
 *
 * Keep this simple — replace content with your final flows later.
 */
export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);

  const next = () => setStep(s => Math.min(2, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Welcome to Doctrina</h3>
            <p className="text-sm text-slate-500 mt-1">A safe, playful learning place for kids — parents can control access.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">Close</button>
        </div>

        <div className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h4 className="text-xl font-medium">Quick tour</h4>
              <p className="text-sm text-slate-600">Doctrina helps kids learn with short videos, notes, and friendly lessons. Parents can enable safety features.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-indigo-50">
                  <div className="font-semibold">Easy</div>
                  <div className="text-sm text-slate-600">Simple UI for kids and powerful tools for older students.</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50">
                  <div className="font-semibold">Safe</div>
                  <div className="text-sm text-slate-600">Parental locks and moderation keep content kid-friendly.</div>
                </div>
                <div className="p-3 rounded-lg bg-sky-50">
                  <div className="font-semibold">Fun</div>
                  <div className="text-sm text-slate-600">Badges, achievements and friendly design motivate learning.</div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-xl font-medium">Kid Mode</h4>
              <p className="text-sm text-slate-600">Turn on Kid Mode for a simplified interface — bigger buttons, fewer options, and age-appropriate content filters.</p>
              <div className="mt-4 p-3 bg-white/80 rounded-lg">
                <div className="text-sm">Try Kid Mode from the left sidebar. Parents can turn it off with a PIN.</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-xl font-medium">Parents: Peace of mind</h4>
              <p className="text-sm text-slate-600">Set a Parent PIN to lock purchases and certain actions. Moderation and reporting help keep the community safe.</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    // open ParentInfoModal via global event; AppLayout listens to this
                    window.dispatchEvent(new CustomEvent('open-parent-info'));
                  }}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white"
                >
                  Learn about parental controls
                </button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-onboarding'))} className="px-4 py-2 rounded-md border">
                  Repeat tour
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <div>
            {step > 0 && <button onClick={back} className="px-3 py-1 rounded-md border mr-2">Back</button>}
            <button onClick={() => { onClose(); }} className="px-3 py-1 rounded-md border">Close</button>
          </div>

          <div>
            {step < 2 ? (
              <button onClick={next} className="px-4 py-1 rounded-md bg-indigo-600 text-white">Next</button>
            ) : (
              <button onClick={() => { onClose(); }} className="px-4 py-1 rounded-md bg-indigo-600 text-white">Finish</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}