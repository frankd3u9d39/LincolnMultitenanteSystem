'use client';

import React, { useState } from 'react';
import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';

export interface ConfirmRequest {
  title: string;
  /** Explains exactly what will happen, in the user's terms. */
  body: React.ReactNode;
  confirmLabel: string;
  eyebrow?: string;
  tone?: 'default' | 'danger';
  /** When set, the operator must type this exact word before the action unlocks. */
  typeToConfirm?: string;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  request: ConfirmRequest;
  onClose: () => void;
}

/** Confirmation step for actions that change or revoke access. */
export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const unlocked = !request.typeToConfirm || typed.trim().toUpperCase() === request.typeToConfirm.toUpperCase();
  const danger = request.tone === 'danger';

  return (
    <ModalShell
      eyebrow={request.eyebrow ?? 'Confirm Action'}
      title={request.title}
      onClose={onClose}
      widthClass="max-w-md"
      footer={
        <>
          <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
          <ModalPrimaryButton
            disabled={!unlocked}
            onClick={() => {
              request.onConfirm();
              onClose();
            }}
          >
            {request.confirmLabel}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div
          className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
            danger ? 'border-red-200 bg-red-50/60 text-red-900' : 'border-zinc-200 bg-zinc-50/60 text-zinc-700'
          }`}
        >
          {request.body}
        </div>

        {request.typeToConfirm && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5" htmlFor="confirm-phrase">
              Type <span className="font-mono text-[#B81D22]">{request.typeToConfirm}</span> to continue
            </label>
            <input
              id="confirm-phrase"
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all font-mono"
            />
          </div>
        )}
      </div>
    </ModalShell>
  );
}
