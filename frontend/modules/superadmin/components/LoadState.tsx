'use client';

import React from 'react';

/** Placeholder blocks shown while a page's first response is on its way. */
export function LoadingBlock({ rows = 4, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3 animate-pulse">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-12 rounded-xl bg-zinc-100" />
      ))}
    </div>
  );
}

/** A failed load, with a way to try again. */
export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/60 p-6 text-center space-y-3">
      <p className="text-sm font-bold text-red-900">This could not be loaded</p>
      <p className="text-xs text-red-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all"
      >
        Try again
      </button>
    </div>
  );
}
