'use client';

import React, { useRef, useState, useEffect } from 'react';

import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';
import { DEFAULT_RESOURCE_LIMITS } from '../utils';

export interface OnboardDraft {
  name: string;
  code: string;
  domain: string;
  city: string;
  storageQuotaGb: number;
  principalAdmin: string;
  principalEmail: string;
  activateImmediately: boolean;
}

interface OnboardSchoolModalProps {
  onClose: () => void;
  onProvision: (draft: OnboardDraft) => void;
  existingCodes: string[];
  existingDomains: string[];
  /** Used to suggest the next sequential tenant code. */
  nextSequence: number;
}

type FieldErrors = Partial<Record<'name' | 'code' | 'domain' | 'city' | 'principalAdmin' | 'principalEmail', string>>;

/** Derives an acronym-style tenant code prefix from the school name. */
function suggestPrefix(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => word.length > 2);
  if (words.length === 0) return '';
  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function OnboardSchoolModal({
  onClose,
  onProvision,
  existingCodes,
  existingDomains,
  nextSequence,
}: OnboardSchoolModalProps) {
  const [draft, setDraft] = useState<OnboardDraft>({
    name: '',
    code: '',
    domain: '',
    city: '',
    storageQuotaGb: DEFAULT_RESOURCE_LIMITS.storageQuotaGb,
    principalAdmin: '',
    principalEmail: '',
    activateImmediately: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [codeTouched, setCodeTouched] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const update = <K extends keyof OnboardDraft>(key: K, value: OnboardDraft[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      // Keep the tenant code in step with the name until the operator edits it directly.
      if (key === 'name' && !codeTouched) {
        const prefix = suggestPrefix(String(value));
        next.code = prefix ? `${prefix}-SMTS-${String(nextSequence).padStart(3, '0')}` : '';
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const code = draft.code.trim().toUpperCase();
    const domain = draft.domain.trim().toLowerCase();
    const email = draft.principalEmail.trim().toLowerCase();

    if (draft.name.trim().length < 4) next.name = 'Enter the full registered school name.';
    if (!/^[A-Z]{2,6}-SMTS-\d{3}$/.test(code)) next.code = 'Use the format ABC-SMTS-001.';
    else if (existingCodes.includes(code)) next.code = 'This tenant code is already allocated.';
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) next.domain = 'Enter a valid domain, e.g. school.edu.ng.';
    else if (existingDomains.includes(domain)) next.domain = 'This domain is bound to another tenant.';
    if (draft.city.trim().length < 2) next.city = 'Enter the campus city.';
    if (draft.principalAdmin.trim().length < 3) next.principalAdmin = 'Name the principal administrator.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.principalEmail = 'Enter a valid administrator email.';

    return next;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onProvision({
      ...draft,
      name: draft.name.trim(),
      code: draft.code.trim().toUpperCase(),
      domain: draft.domain.trim().toLowerCase(),
      city: draft.city.trim(),
      principalAdmin: draft.principalAdmin.trim(),
      principalEmail: draft.principalEmail.trim().toLowerCase(),
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
    <form onSubmit={handleSubmit}>
      <ModalShell
        eyebrow="Tenant Provisioning"
        title="Onboard School"
        subtitle="Creates an isolated tenant boundary with its own database schema and storage bucket."
        onClose={onClose}
        widthClass="max-w-2xl"
        footer={
          <>
            <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
            <ModalPrimaryButton type="submit">Provision Tenant</ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="onboard-name">Registered School Name</label>
              <input
                ref={firstFieldRef}
                id="onboard-name"
                type="text"
                value={draft.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Riverside Institute of Technology"
                className={inputClass('name')}
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-code">Tenant Code</label>
              <input
                id="onboard-code"
                type="text"
                value={draft.code}
                onChange={(e) => {
                  setCodeTouched(true);
                  update('code', e.target.value.toUpperCase());
                }}
                placeholder="RIT-SMTS-022"
                className={`${inputClass('code')} font-mono`}
              />
              {errors.code ? (
                <p className={errorClass}>{errors.code}</p>
              ) : (
                <p className="mt-1 text-[11px] text-zinc-400">Suggested from the school name; edit to override.</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-domain">Primary Domain</label>
              <input
                id="onboard-domain"
                type="text"
                value={draft.domain}
                onChange={(e) => update('domain', e.target.value)}
                placeholder="riverside-tech.edu.ng"
                className={`${inputClass('domain')} font-mono`}
              />
              {errors.domain && <p className={errorClass}>{errors.domain}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-city">Campus City</label>
              <input
                id="onboard-city"
                type="text"
                value={draft.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Lagos"
                className={inputClass('city')}
              />
              {errors.city && <p className={errorClass}>{errors.city}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-admin">Principal Administrator</label>
              <input
                id="onboard-admin"
                type="text"
                value={draft.principalAdmin}
                onChange={(e) => update('principalAdmin', e.target.value)}
                placeholder="Dr. Ifeoma Balogun"
                className={inputClass('principalAdmin')}
              />
              {errors.principalAdmin && <p className={errorClass}>{errors.principalAdmin}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="onboard-email">Administrator Email</label>
              <input
                id="onboard-email"
                type="email"
                value={draft.principalEmail}
                onChange={(e) => update('principalEmail', e.target.value)}
                placeholder="i.balogun@riverside-tech.edu.ng"
                className={inputClass('principalEmail')}
              />
              {errors.principalEmail && <p className={errorClass}>{errors.principalEmail}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="onboard-quota">Storage Quota (GB)</label>
            <input
              id="onboard-quota"
              type="text"
              inputMode="numeric"
              value={draft.storageQuotaGb.toLocaleString()}
              onChange={(e) => update('storageQuotaGb', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
              className={`${inputClass('name')} max-w-xs`}
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Platform default is {DEFAULT_RESOURCE_LIMITS.storageQuotaGb} GB. The system is free to use — this is
              a capacity guard, not a price plan, and it can be raised later.
            </p>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3.5 cursor-pointer hover:bg-zinc-50/60 transition-colors">
            <input
              type="checkbox"
              checked={draft.activateImmediately}
              onChange={(e) => update('activateImmediately', e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0"
            />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-zinc-900">Activate without domain verification</span>
              <span className="block text-[11px] text-zinc-500 mt-0.5">
                The school goes live straight away. Left unticked, it stays pending until the domain is
                verified.
              </span>
            </span>
          </label>
        </div>
      </ModalShell>
    </form>
  );
}
