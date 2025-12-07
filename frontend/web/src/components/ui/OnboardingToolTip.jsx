// File: src/components/ui/OnboardingTooltip.jsx
import React from 'react';

export default function OnboardingTooltip({ text }) {
  return (
    <div className="absolute top-14 right-6 bg-white shadow-md p-3 rounded-lg w-64 text-sm">
      <div className="font-medium mb-1">Tip</div>
      <div className="text-gray-600">{text}</div>
    </div>
  );
}