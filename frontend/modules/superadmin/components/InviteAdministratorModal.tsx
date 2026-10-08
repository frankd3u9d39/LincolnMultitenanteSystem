'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SchoolAdministrator } from '../types';
import { TENANT_OPTIONS } from '../services';
import { ADMIN_ROLE_LABELS } from '../utils';

export interface InviteDraft {
  fullName: string;
  email: string;
  phone: string;
  schoolCode: string;
  role: SchoolAdministrator['role'];
  requireMfa: boolean;
  message: string;
}

const EMPTY_DRAFT: InviteDraft = {
  fullName: '',
  email: '',
  phone: '',
  schoolCode: '',
  role: 'deputy_admin',
  requireMfa: true,
  message: '',
};

type FieldErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'schoolCode', string>>;

interface InviteAdministratorModalProps {
  onClose: () => void;
  onInvite: (draft: InviteDraft) => void;
  existingEmails: string[];
}

export function InviteAdministratorModal({
  onClose,
  onInvite,
  existingEmails,
}: InviteAdministratorModalProps) {
  const [draft, setDraft] = useState<InviteDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const update = <K extends keyof InviteDraft>(key: K, value: InviteDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const email = draft.email.trim().toLowerCase();

    if (draft.fullName.trim().length < 3) next.fullName = 'Enter the administrator’s full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = 'Enter a valid work email address.';
    else if (existingEmails.includes(email)) next.email = 'An account with this email already exists.';
    if (draft.phone.trim().length < 7) next.phone = 'Enter a reachable phone number.';
    if (!draft.schoolCode) next.schoolCode = 'Select the tenant boundary to grant access to.';

    return next;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onInvite({
      ...draft,
      fullName: draft.fullName.trim(),
      email: draft.email.trim().toLowerCase(),
      phone: draft.phone.trim(),
      message: draft.message.trim(),
    });
  };

  const inputClass = (field: keyof FieldErrors) =>
    `w-full px-3 py-2 text-xs rounded-xl border bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
        : 'border-zinc-200 focus:ring-[#B81D22]/20 focus:border-[#B81D22]'
    }`;
  const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5';
  const errorClass = 'mt-1 text-[11px] font-semibold text-red-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-admin-title"
        className="relative z-10 w-full max-w-lg max-h-full overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-3 p-5 border-b border-zinc-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Tenant Governance
              </span>
              <h2 id="invite-admin-title" className="text-base font-bold text-zinc-900 mt-0.5">
                Invite School Administrator
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                The account is created in an invited state until the recipient completes first sign-in.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors shrink-0"
              aria-label="Close invitation form"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="invite-name">Full Name</label>
                <input
                  ref={firstFieldRef}
                  id="invite-name"
                  type="text"
                  value={draft.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Dr. Adaeze Okafor"
                  aria-invalid={Boolean(errors.fullName)}
                  className={inputClass('fullName')}
                />
                {errors.fullName && <p className={errorClass}>{errors.fullName}</p>}
              </div>

              <div>
                <label className={labelClass} htmlFor="invite-email">Work Email</label>
                <input
                  id="invite-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="a.okafor@school.edu.ng"
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass('email')}
                />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </div>

              <div>
                <label className={labelClass} htmlFor="invite-phone">Phone Number</label>
                <input
                  id="invite-phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+234 802 000 0000"
                  aria-invalid={Boolean(errors.phone)}
                  className={inputClass('phone')}
                />
                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
              </div>

              <div>
                <label className={labelClass} htmlFor="invite-role">Administrator Role</label>
                <select
                  id="invite-role"
                  value={draft.role}
                  onChange={(e) => update('role', e.target.value as SchoolAdministrator['role'])}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
                >
                  {(Object.keys(ADMIN_ROLE_LABELS) as SchoolAdministrator['role'][]).map((role) => (
                    <option key={role} value={role}>
                      {ADMIN_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="invite-school">Tenant Boundary</label>
              <select
                id="invite-school"
                value={draft.schoolCode}
                onChange={(e) => update('schoolCode', e.target.value)}
                aria-invalid={Boolean(errors.schoolCode)}
                className={inputClass('schoolCode')}
              >
                <option value="">Select the school this account administers…</option>
                {TENANT_OPTIONS.map((tenant) => (
                  <option key={tenant.code} value={tenant.code}>
                    {tenant.name} ({tenant.code})
                  </option>
                ))}
              </select>
              {errors.schoolCode && <p className={errorClass}>{errors.schoolCode}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="invite-message">Invitation Note (optional)</label>
              <textarea
                id="invite-message"
                rows={3}
                value={draft.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Included in the invitation email sent to the recipient."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all resize-none"
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3.5 cursor-pointer hover:bg-zinc-50/60 transition-colors">
              <input
                type="checkbox"
                checked={draft.requireMfa}
                onChange={(e) => update('requireMfa', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0"
              />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-zinc-900">
                  Require MFA enrolment at first sign-in
                </span>
                <span className="block text-[11px] text-zinc-500 mt-0.5">
                  The account cannot reach the dashboard until an authenticator is registered.
                </span>
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 p-5 border-t border-zinc-200 bg-zinc-50">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-white/60 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
