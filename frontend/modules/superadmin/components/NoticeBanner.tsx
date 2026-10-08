'use client';

import React from 'react';
import { Notice } from '../hooks';

const TONE_STYLES: Record<Notice['tone'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

const TONE_ICON_STYLES: Record<Notice['tone'], string> = {
  success: 'text-emerald-600',
  info: 'text-blue-600',
  warning: 'text-amber-600',
};

const TONE_PATHS: Record<Notice['tone'], string> = {
  success: 'M4.5 12.75l6 6 9-13.5',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  warning:
    'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
};

interface NoticeBannerProps {
  notice: Notice | null;
  onDismiss: () => void;
}

/** Inline result banner shown after an action completes. */
export function NoticeBanner({ notice, onDismiss }: NoticeBannerProps) {
  if (!notice) return null;

  return (
    <div
      role="status"
      className={`rounded-xl border px-3.5 py-2.5 flex items-start gap-2 ${TONE_STYLES[notice.tone]}`}
    >
      <svg
        className={`w-4 h-4 shrink-0 mt-0.5 ${TONE_ICON_STYLES[notice.tone]}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={TONE_PATHS[notice.tone]} />
      </svg>
      <span className="text-xs font-semibold flex-1">{notice.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="p-0.5 rounded hover:bg-black/5 transition-colors shrink-0"
        aria-label="Dismiss message"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
