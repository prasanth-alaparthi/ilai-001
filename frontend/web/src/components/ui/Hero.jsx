import React from 'react';
import PrimaryButton from './PrimaryButton';

/**
 * Hero section: friendly, modern and neutral.
 * Pass cta as an element (PrimaryButton recommended).
 */
export default function Hero({ title, subtitle, cta }) {
  return (
    <section className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-sky-50 to-white border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm md:text-base text-slate-600 max-w-xl">{subtitle}</p>
        </div>
        <div>
          {cta ? cta : <PrimaryButton ariaLabel="Get started">Get started</PrimaryButton>}
        </div>
      </div>
    </section>
  );
}