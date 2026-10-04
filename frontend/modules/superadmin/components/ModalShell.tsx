'use client';

import React, { useEffect } from 'react';

interface ModalShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class; defaults to a medium dialog. */
  widthClass?: string;
}

/**
 * Shared dialog chrome for the SuperAdmin module: backdrop, Escape handling,
 * header with close control, scrollable body, and an optional sticky footer.
 */
export function ModalShell({
  eyebrow,
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClass = 'max-w-lg',
}: ModalShellProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full ${widthClass} max-h-full flex flex-col rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-zinc-200 shrink-0">
          <div className="min-w-0">
            {eyebrow && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{eyebrow}</span>
            )}
            <h2 className="text-base font-bold text-zinc-900 mt-0.5">{title}</h2>
            {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 p-5 border-t border-zinc-200 bg-zinc-50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Secondary (cancel-style) dialog button. */
export function ModalSecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', type = 'button', ...rest } = props;
  return (
    <button
      type={type}
      {...rest}
      className={`px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-white/60 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    />
  );
}

/** Primary (confirm-style) dialog button in the platform crimson. */
export function ModalPrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', type = 'button', ...rest } = props;
  return (
    <button
      type={type}
      {...rest}
      className={`px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    />
  );
}
