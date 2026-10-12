'use client';

import React, { useMemo, useState } from 'react';
import { ApiError } from '@/services/api';
import { ApiAccessKey } from '../types';
import {
  changePassword,
  confirmMfaEnrolment,
  createApiKey,
  startMfaEnrolment,
} from '../services/api';
import { useAsync } from '../hooks';
import { copyToClipboard, downloadCsv } from '../utils';
import { ErrorBlock, LoadingBlock } from './LoadState';
import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5';
const inputBase =
  'w-full px-3 py-2 text-xs rounded-xl border bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all';
const inputOk = 'border-zinc-200 focus:ring-[#B81D22]/20 focus:border-[#B81D22]';
const inputBad = 'border-red-400 focus:ring-red-500/20 focus:border-red-500';
const errorClass = 'mt-1 text-[11px] font-semibold text-red-600';

/** First server message for a field, falling back to the general message. */
function serverMessage(error: unknown, field?: string): string {
  if (error instanceof ApiError) {
    return (field ? error.fieldError(field) : undefined) ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

/* ------------------------------------------------------------------ */
/* Password change                                                     */
/* ------------------------------------------------------------------ */

interface PasswordStrength {
  score: number;
  label: string;
  tone: string;
  bar: string;
}

/** Live feedback only; the server enforces the platform's actual policy. */
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
  onChanged: (message: string) => void;
}

export function ChangePasswordModal({ onClose, onChanged }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const strength = useMemo(() => scorePassword(next), [next]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};

    if (!current) found.current = 'Enter your current password.';
    if (!next) found.next = 'Enter a new password.';
    if (confirm !== next) found.confirm = 'Passwords do not match.';

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);

    try {
      onChanged(await changePassword({ current, next, confirmation: confirm }));
      onClose();
    } catch (failure) {
      // The server names which field is wrong; show it there.
      const failed = failure instanceof ApiError ? failure.errors : {};
      if (failed.current_password) {
        setErrors({ current: failed.current_password[0] });
      } else if (failed.password) {
        setErrors({ next: failed.password[0] });
      } else {
        setErrors({ form: serverMessage(failure) });
      }
      setSaving(false);
    }
  };

  const clear = (key: string) => setErrors((prev) => ({ ...prev, [key]: '', form: '' }));

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
            <ModalPrimaryButton type="submit" disabled={saving}>
              {saving ? 'Updating…' : 'Update Password'}
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {errors.form && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {errors.form}
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="pw-current">Current Password</label>
            <input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => {
                setCurrent(e.target.value);
                clear('current');
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
                clear('next');
              }}
              className={`${inputBase} ${errors.next ? inputBad : inputOk}`}
            />
            {next.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strength.bar}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
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
                clear('confirm');
              }}
              className={`${inputBase} ${errors.confirm ? inputBad : inputOk}`}
            />
            {errors.confirm && <p className={errorClass}>{errors.confirm}</p>}
          </div>

          <p className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 text-[11px] text-zinc-600">
            The minimum length, numbers and symbols required are set in Platform Settings and checked when you save.
          </p>
        </div>
      </ModalShell>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Recovery codes                                                      */
/* ------------------------------------------------------------------ */

interface RecoveryCodesModalProps {
  codes: string[];
  onClose: () => void;
  onNotify: (message: string) => void;
}

/** Shows codes the server has just generated. They cannot be retrieved again. */
export function RecoveryCodesModal({ codes, onClose, onNotify }: RecoveryCodesModalProps) {
  return (
    <ModalShell
      eyebrow="Sign-in Security"
      title="Recovery Codes"
      subtitle="Each code works once. Any earlier set no longer works."
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
            These codes are stored hashed, so they are not recoverable after you close this dialog. Copy or download them now.
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
/* MFA enrolment                                                       */
/* ------------------------------------------------------------------ */

interface MfaEnrolmentModalProps {
  onClose: () => void;
  /** Called once a real authenticator code has been verified. */
  onEnrolled: (message: string) => void;
  onNotify: (message: string) => void;
}

export function MfaEnrolmentModal({ onClose, onEnrolled, onNotify }: MfaEnrolmentModalProps) {
  const setup = useAsync(() => startMfaEnrolment(), []);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  // Once verified the new recovery codes replace the setup step.
  if (recoveryCodes) {
    return <RecoveryCodesModal codes={recoveryCodes} onClose={onClose} onNotify={onNotify} />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code shown in your authenticator app.');
      return;
    }

    setVerifying(true);

    try {
      const result = await confirmMfaEnrolment(code.trim());
      onEnrolled(result.message);
      setRecoveryCodes(result.recoveryCodes);
    } catch (failure) {
      setError(serverMessage(failure, 'code'));
      setVerifying(false);
    }
  };

  const secret = setup.data?.secret ?? '';
  const spaced = secret.match(/.{1,4}/g)?.join(' ') ?? '';

  return (
    <form onSubmit={handleSubmit}>
      <ModalShell
        eyebrow="Sign-in Security"
        title="Re-enrol Authenticator"
        subtitle="Your current authenticator keeps working until a new code is confirmed."
        onClose={onClose}
        footer={
          <>
            <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
            <ModalPrimaryButton type="submit" disabled={!setup.data || verifying}>
              {verifying ? 'Verifying…' : 'Confirm & Replace'}
            </ModalPrimaryButton>
          </>
        }
      >
        {setup.loading ? (
          <LoadingBlock rows={3} label="Preparing setup key" />
        ) : setup.error || !setup.data ? (
          <ErrorBlock message={setup.error ?? 'The setup key could not be created.'} onRetry={setup.reload} />
        ) : (
          <div className="space-y-4">
            <ol className="space-y-2 text-[11px] text-zinc-600 list-decimal list-inside">
              <li>Add a new entry to your authenticator app using the setup key below.</li>
              <li>Enter the 6-digit code it generates to confirm.</li>
              <li>Remove the old entry once the new one works.</li>
            </ol>

            <div>
              <span className={labelClass}>Setup Key</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono tracking-wider text-zinc-800 break-all">
                  {spaced}
                </code>
                <ModalSecondaryButton onClick={() => copyToClipboard(secret)}>Copy</ModalSecondaryButton>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-400 break-all">
                Or open this link on your phone:{' '}
                <a href={setup.data.uri} className="text-[#B81D22] hover:underline">
                  otpauth link
                </a>
              </p>
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
        )}
      </ModalShell>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* API key creation                                                    */
/* ------------------------------------------------------------------ */

interface CreateApiKeyModalProps {
  onClose: () => void;
  /** Called with the refreshed key list as soon as the key exists. */
  onCreated: (keys: ApiAccessKey[], message: string) => void;
}

export function CreateApiKeyModal({ onClose, onCreated }: CreateApiKeyModalProps) {
  const [label, setLabel] = useState('');
  const [scope, setScope] = useState<ApiAccessKey['scope']>('read_only');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (label.trim().length < 4) {
      setError('Give the key a recognisable label, e.g. "Attendance Sync".');
      return;
    }

    setSaving(true);

    try {
      const result = await createApiKey({ label: label.trim(), scope });
      onCreated(result.keys, result.message);
      setSecret(result.secret);
    } catch (failure) {
      setError(serverMessage(failure, 'label'));
      setSaving(false);
    }
  };

  if (secret) {
    return (
      <ModalShell
        eyebrow="API Access"
        title="Key Created"
        subtitle={`${label.trim()} • shown once, never again`}
        onClose={onClose}
        footer={
          <>
            <ModalSecondaryButton onClick={() => copyToClipboard(secret)}>Copy Secret</ModalSecondaryButton>
            <ModalPrimaryButton onClick={onClose}>Done</ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5">
            <p className="font-bold text-red-900 text-[11px] uppercase tracking-wider">Copy it now</p>
            <p className="text-[11px] text-red-800 mt-1 leading-relaxed">
              This is the only time the full secret is displayed. Only a hash is stored, so it cannot be shown again.
            </p>
          </div>

          <code className="block px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-800 break-all">
            {secret}
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
            <ModalPrimaryButton type="submit" disabled={saving}>
              {saving ? 'Generating…' : 'Generate Key'}
            </ModalPrimaryButton>
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
                  { value: 'read_only', title: 'Read only', hint: 'Fetch tenants, users, and reports. Any change is refused.' },
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
