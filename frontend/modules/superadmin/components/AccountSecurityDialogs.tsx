'use client';

import React, { useMemo, useState } from 'react';
import { ApiAccessKey } from '../types';
import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';
import { copyToClipboard, downloadCsv, randomToken } from '../utils';

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5';
const inputBase =
  'w-full px-3 py-2 text-xs rounded-xl border bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all';
const inputOk = 'border-zinc-200 focus:ring-[#B81D22]/20 focus:border-[#B81D22]';
const inputBad = 'border-red-400 focus:ring-red-500/20 focus:border-red-500';
const errorClass = 'mt-1 text-[11px] font-semibold text-red-600';

/* ------------------------------------------------------------------ */
/* Password change                                                     */
/* ------------------------------------------------------------------ */

interface PasswordStrength {
  score: number;
  label: string;
  tone: string;
  bar: string;
}

function scorePassword(value: string): PasswordStrength {
  let score = 0;
  if (value.length >= 10) score += 1;
  if (value.length >= 14) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 2) return { score, label: 'Weak', tone: 'text-red-600', bar: 'bg-red-500' };
  if (score === 3) return { score, label: 'Fair', tone: 'text-amber-600', bar: 'bg-amber-500' };
  if (score === 4) return { score, label: 'Strong', tone: 'text-emerald-600', bar: 'bg-emerald-500' };
  return { score, label: 'Excellent', tone: 'text-emerald-700', bar: 'bg-emerald-600' };
}

interface ChangePasswordModalProps {
  onClose: () => void;
  onChanged: () => void;
}

export function ChangePasswordModal({ onClose, onChanged }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => scorePassword(next), [next]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};

    if (current.length < 8) found.current = 'Enter your current password.';
    if (next.length < 10) found.next = 'Platform policy requires at least 10 characters.';
    else if (strength.score < 3) found.next = 'Add mixed case, a number, or a symbol.';
    else if (next === current) found.next = 'Choose a password you have not used before.';
    if (confirm !== next) found.confirm = 'Passwords do not match.';

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onChanged();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalShell
        eyebrow="Sign-in Security"
        title="Change Password"
        subtitle="Signs out your other devices once the new password is saved."
        onClose={onClose}
        footer={
          <>
            <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
            <ModalPrimaryButton type="submit">Update Password</ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="pw-current">Current Password</label>
            <input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => {
                setCurrent(e.target.value);
                setErrors((prev) => ({ ...prev, current: '' }));
              }}
              className={`${inputBase} ${errors.current ? inputBad : inputOk}`}
            />
            {errors.current && <p className={errorClass}>{errors.current}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="pw-next">New Password</label>
            <input
              id="pw-next"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => {
                setNext(e.target.value);
                setErrors((prev) => ({ ...prev, next: '' }));
              }}
              className={`${inputBase} ${errors.next ? inputBad : inputOk}`}
            />
            {next.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${strength.bar}`}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-[11px] font-bold shrink-0 ${strength.tone}`}>{strength.label}</span>
              </div>
            )}
            {errors.next && <p className={errorClass}>{errors.next}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="pw-confirm">Confirm New Password</label>
            <input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrors((prev) => ({ ...prev, confirm: '' }));
              }}
              className={`${inputBase} ${errors.confirm ? inputBad : inputOk}`}
            />
            {errors.confirm && <p className={errorClass}>{errors.confirm}</p>}
          </div>

          <ul className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-1 text-[11px] text-zinc-600">
            <li>At least 10 characters, as set in Platform Settings.</li>
            <li>Mixed case plus a number or symbol.</li>
            <li>Expires after 90 days.</li>
          </ul>
        </div>
      </ModalShell>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* MFA re-enrolment                                                    */
/* ------------------------------------------------------------------ */

interface MfaEnrolmentModalProps {
  onClose: () => void;
  onEnrolled: () => void;
}

export function MfaEnrolmentModal({ onClose, onEnrolled }: MfaEnrolmentModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const secret = useMemo(() => randomToken(16).toUpperCase().match(/.{1,4}/g)?.join(' ') ?? '', []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code shown in your authenticator app.');
      return;
    }
    onEnrolled();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalShell
        eyebrow="Sign-in Security"
        title="Re-enrol Authenticator"
        subtitle="Replaces your existing factor once a valid code is confirmed."
        onClose={onClose}
        footer={
          <>
            <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
            <ModalPrimaryButton type="submit">Confirm &amp; Replace</ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <ol className="space-y-2 text-[11px] text-zinc-600 list-decimal list-inside">
            <li>Remove the old &quot;Lincoln Platform&quot; entry from your authenticator app.</li>
            <li>Add a new entry using the setup key below.</li>
            <li>Enter the 6-digit code it generates to confirm.</li>
          </ol>

          <div>
            <span className={labelClass}>Setup Key</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono tracking-wider text-zinc-800 break-all">
                {secret}
              </code>
              <ModalSecondaryButton onClick={() => copyToClipboard(secret.replace(/\s/g, ''))}>
                Copy
              </ModalSecondaryButton>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="mfa-code">Verification Code</label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="000000"
              className={`${inputBase} ${error ? inputBad : inputOk} font-mono tracking-[0.3em] text-center`}
            />
            {error && <p className={errorClass}>{error}</p>}
          </div>
        </div>
      </ModalShell>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Recovery codes                                                      */
/* ------------------------------------------------------------------ */

interface RecoveryCodesModalProps {
  onClose: () => void;
  onNotify: (message: string) => void;
}

export function RecoveryCodesModal({ onClose, onNotify }: RecoveryCodesModalProps) {
  const codes = useMemo(
    () => Array.from({ length: 8 }, () => `${randomToken(5)}-${randomToken(5)}`.toUpperCase()),
    []
  );

  return (
    <ModalShell
      eyebrow="Sign-in Security"
      title="New Recovery Codes"
      subtitle="Your previous codes are now invalid. Each code below works once."
      onClose={onClose}
      footer={
        <>
          <ModalSecondaryButton
            onClick={async () => {
              const ok = await copyToClipboard(codes.join('\n'));
              onNotify(ok ? 'Recovery codes copied to the clipboard.' : 'Clipboard unavailable — download them instead.');
            }}
          >
            Copy All
          </ModalSecondaryButton>
          <ModalSecondaryButton
            onClick={() => {
              const fileName = downloadCsv('recovery_codes', ['Recovery Code'], codes.map((code) => [code]));
              onNotify(`Recovery codes saved to ${fileName}. Store them somewhere safe.`);
            }}
          >
            Download
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={onClose}>Done</ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
          <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">Shown once</p>
          <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
            These codes are not recoverable after you close this dialog. Copy or download them now.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {codes.map((code) => (
            <code
              key={code}
              className="px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono text-center tracking-wider text-zinc-800"
            >
              {code}
            </code>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* API key creation                                                    */
/* ------------------------------------------------------------------ */

interface CreateApiKeyModalProps {
  onClose: () => void;
  onCreate: (key: ApiAccessKey, secret: string) => void;
  existingLabels: string[];
}

export function CreateApiKeyModal({ onClose, onCreate, existingLabels }: CreateApiKeyModalProps) {
  const [label, setLabel] = useState('');
  const [scope, setScope] = useState<ApiAccessKey['scope']>('read_only');
  const [error, setError] = useState('');
  const [issued, setIssued] = useState<{ key: ApiAccessKey; secret: string } | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = label.trim();

    if (trimmed.length < 4) {
      setError('Give the key a recognisable label, e.g. "Attendance Sync".');
      return;
    }
    if (existingLabels.map((item) => item.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError('A key with this label already exists.');
      return;
    }

    const prefix = `lmp_live_${randomToken(4)}`;
    const secret = `${prefix}${randomToken(28)}`;
    const key: ApiAccessKey = {
      id: Date.now(),
      label: trimmed,
      prefix,
      scope,
      createdOn: '2026-10-04',
      lastUsed: 'Never',
      status: 'active',
    };

    setIssued({ key, secret });
    onCreate(key, secret);
  };

  if (issued) {
    return (
      <ModalShell
        eyebrow="API Access"
        title="Key Created"
        subtitle={`${issued.key.label} • shown once, never again`}
        onClose={onClose}
        footer={
          <>
            <ModalSecondaryButton onClick={() => copyToClipboard(issued.secret)}>Copy Secret</ModalSecondaryButton>
            <ModalPrimaryButton onClick={onClose}>Done</ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5">
            <p className="font-bold text-red-900 text-[11px] uppercase tracking-wider">Copy it now</p>
            <p className="text-[11px] text-red-800 mt-1 leading-relaxed">
              This is the only time the full secret is displayed. Only the prefix is stored and shown afterwards.
            </p>
          </div>

          <code className="block px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-800 break-all">
            {issued.secret}
          </code>
        </div>
      </ModalShell>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <ModalShell
        eyebrow="API Access"
        title="Create Access Key"
        subtitle="Authenticates a platform-level integration against the SuperAdmin API."
        onClose={onClose}
        footer={
          <>
            <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
            <ModalPrimaryButton type="submit">Generate Key</ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="key-label">Key Label</label>
            <input
              id="key-label"
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError('');
              }}
              placeholder="Attendance Sync Worker"
              className={`${inputBase} ${error ? inputBad : inputOk}`}
            />
            {error && <p className={errorClass}>{error}</p>}
          </div>

          <div>
            <span className={labelClass}>Scope</span>
            <div className="space-y-2.5">
              {(
                [
                  { value: 'read_only', title: 'Read only', hint: 'Fetch tenants, users, and reports. No writes.' },
                  { value: 'read_write', title: 'Read / write', hint: 'Create and update records across tenants.' },
                  { value: 'admin', title: 'Full admin', hint: 'Everything, including provisioning and suspension.' },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                    scope === option.value
                      ? 'border-[#B81D22] bg-red-50/40 ring-2 ring-red-600/10'
                      : 'border-zinc-200 hover:bg-zinc-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="key-scope"
                    value={option.value}
                    checked={scope === option.value}
                    onChange={() => setScope(option.value)}
                    className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-zinc-900">{option.title}</span>
                    <span className="block text-[11px] text-zinc-500 mt-0.5">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </ModalShell>
    </form>
  );
}
