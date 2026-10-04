'use client';

import React, { useState } from 'react';
import { ApiAccessKey, GlobalSettingsState } from '../types';
import { useNotice } from '../hooks';
import { NoticeBanner } from './NoticeBanner';
import { ConfirmDialog, ConfirmRequest } from './ConfirmDialog';
import {
  ChangePasswordModal,
  CreateApiKeyModal,
  MfaEnrolmentModal,
  RecoveryCodesModal,
} from './AccountSecurityDialogs';

const INITIAL_STATE: GlobalSettingsState = {
  profile: {
    fullName: 'Alexander Cross',
    jobTitle: 'Chief Platform Administrator',
    email: 'admin@lincolnplatform.io',
    phone: '+234 802 000 1199',
    timezone: 'Africa/Lagos (GMT+1)',
    language: 'English (Nigeria)',
    dateFormat: 'DD/MM/YYYY',
  },
  notifications: {
    tenantOnboarded: true,
    tenantSuspended: true,
    quotaBreaches: true,
    securityAlerts: true,
    backupResults: false,
    weeklyDigest: true,
    channel: 'email_sms',
  },
  apiKeys: [
    { id: 1, label: 'Attendance Sync Worker', prefix: 'lmp_live_8f2a', scope: 'read_only', createdOn: '2025-02-11', lastUsed: '2026-10-04 06:00', status: 'active' },
    { id: 2, label: 'Tenant Provisioning Pipeline', prefix: 'lmp_live_c41d', scope: 'read_write', createdOn: '2025-06-03', lastUsed: '2026-10-03 22:14', status: 'active' },
    { id: 3, label: 'Analytics Warehouse Sync', prefix: 'lmp_live_19be', scope: 'read_only', createdOn: '2024-10-28', lastUsed: '2026-10-04 02:30', status: 'active' },
    { id: 4, label: 'Legacy Migration Script', prefix: 'lmp_live_7700', scope: 'admin', createdOn: '2023-05-14', lastUsed: '2024-01-09 11:42', status: 'revoked' },
  ],
};

const TIMEZONES = [
  'Africa/Lagos (GMT+1)',
  'Africa/Accra (GMT+0)',
  'Europe/London (GMT+0/+1)',
  'Africa/Nairobi (GMT+3)',
  'UTC (GMT+0)',
];

const LANGUAGES = ['English (Nigeria)', 'English (United Kingdom)', 'French (Benin)', 'Hausa', 'Yoruba'];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'D MMM YYYY'];

const NOTIFICATION_ROWS: Array<{
  key: keyof Omit<GlobalSettingsState['notifications'], 'channel'>;
  title: string;
  description: string;
}> = [
  { key: 'tenantOnboarded', title: 'Tenant Onboarded', description: 'A new school completes provisioning and verification.' },
  { key: 'tenantSuspended', title: 'Tenant Suspended', description: 'A school is suspended automatically or manually.' },
  { key: 'quotaBreaches', title: 'Quota Breaches', description: 'A school reaches its storage or enrolment ceiling.' },
  { key: 'securityAlerts', title: 'Security Alerts', description: 'Brute-force attempts, flagged IPs, or privilege escalations.' },
  { key: 'backupResults', title: 'Backup Results', description: 'Outcome of every scheduled platform snapshot.' },
  { key: 'weeklyDigest', title: 'Weekly Platform Digest', description: 'Monday summary of growth, capacity, and incidents.' },
];

const SCOPE_STYLES: Record<ApiAccessKey['scope'], string> = {
  read_only: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  read_write: 'bg-blue-50 text-blue-700 border-blue-200',
  admin: 'bg-red-50 text-red-700 border-red-200',
};

const SCOPE_LABELS: Record<ApiAccessKey['scope'], string> = {
  read_only: 'Read only',
  read_write: 'Read / write',
  admin: 'Full admin',
};

interface ActiveSession {
  device: string;
  location: string;
  ip: string;
  seen: string;
  current: boolean;
}

const INITIAL_SESSIONS: ActiveSession[] = [
  { device: 'Chrome 141 on Windows 11', location: 'Lagos, Nigeria', ip: '197.210.54.12', seen: 'Current session', current: true },
  { device: 'Safari on iPhone 16 Pro', location: 'Lagos, Nigeria', ip: '105.112.18.44', seen: '3 hours ago', current: false },
  { device: 'Edge 140 on Windows 11', location: 'Abuja, Nigeria', ip: '102.89.33.17', seen: '2 days ago', current: false },
];

type Tab = 'profile' | 'notifications' | 'security' | 'api';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'profile', label: 'Account Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Sign-in Security' },
  { id: 'api', label: 'API Access Keys' },
];

export function GlobalSettingsView() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [state, setState] = useState<GlobalSettingsState>(INITIAL_STATE);
  const [savedAlert, setSavedAlert] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [newKeyOpen, setNewKeyOpen] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [mfaEnrolledOn, setMfaEnrolledOn] = useState('Authenticator app');
  const { notice, notify, dismiss } = useNotice();

  const signOutOtherSessions = () => {
    const removed = sessions.filter((session) => !session.current).length;
    setSessions((prev) => prev.filter((session) => session.current));
    notify(`Signed out ${removed} other device${removed === 1 ? '' : 's'}. Only this session remains active.`, 'warning');
  };

  const handleProfileChange = <K extends keyof GlobalSettingsState['profile']>(
    key: K,
    value: GlobalSettingsState['profile'][K]
  ) => setState((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }));

  const handleNotificationChange = <K extends keyof GlobalSettingsState['notifications']>(
    key: K,
    value: GlobalSettingsState['notifications'][K]
  ) => setState((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));

  const handleRevokeKey = (id: number) =>
    setState((prev) => ({
      ...prev,
      apiKeys: prev.apiKeys.map((key) => (key.id === id ? { ...key, status: 'revoked' } : key)),
    }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 4000);
  };

  const inputClass =
    'w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all';
  const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5';

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Global Settings</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Your SuperAdmin account profile, alert routing, sign-in security, and programmatic access keys.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setState(INITIAL_STATE)}
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Discard Changes
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10"
          >
            Save Preferences
          </button>
        </div>
      </div>

      <NoticeBanner notice={notice} onDismiss={dismiss} />

      {savedAlert && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-xs font-semibold text-emerald-900">
            Preferences saved. Changes have been written to the platform audit trail.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Account Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Administrator Identity</h2>
              <p className="text-xs text-zinc-500">Shown on audit entries and outbound platform correspondence.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={state.profile.fullName}
                  onChange={(e) => handleProfileChange('fullName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="jobTitle">Job Title</label>
                <input
                  id="jobTitle"
                  type="text"
                  value={state.profile.jobTitle}
                  onChange={(e) => handleProfileChange('jobTitle', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="email">Work Email</label>
                <input
                  id="email"
                  type="email"
                  value={state.profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={state.profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 mb-3">Localization</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass} htmlFor="timezone">Timezone</label>
                  <select
                    id="timezone"
                    value={state.profile.timezone}
                    onChange={(e) => handleProfileChange('timezone', e.target.value)}
                    className={inputClass}
                  >
                    {TIMEZONES.map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="language">Interface Language</label>
                  <select
                    id="language"
                    value={state.profile.language}
                    onChange={(e) => handleProfileChange('language', e.target.value)}
                    className={inputClass}
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="dateFormat">Date Format</label>
                  <select
                    id="dateFormat"
                    value={state.profile.dateFormat}
                    onChange={(e) => handleProfileChange('dateFormat', e.target.value)}
                    className={inputClass}
                  >
                    {DATE_FORMATS.map((format) => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Identity card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900">Account Summary</h2>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#B81D22] text-white font-black text-sm shrink-0">
                {state.profile.fullName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-zinc-900 truncate">{state.profile.fullName}</div>
                <div className="text-[11px] text-zinc-500 truncate">{state.profile.jobTitle}</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100 text-xs">
              {[
                ['Platform Role', 'SuperAdmin (unrestricted)'],
                ['Tenant Scope', 'All 21 boundaries'],
                ['Account Created', '2022-07-01'],
                ['Last Sign-in', '2026-10-04 08:42'],
                ['Sign-in IP', '197.210.54.12'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <span className="text-zinc-500">{label}</span>
                  <span className="font-semibold text-zinc-900 text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
              <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">Unrestricted account</p>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                This account can read and modify every tenant boundary. Keep multi-factor authentication enrolled and
                review the audit trail regularly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Platform Event Alerts</h2>
              <p className="text-xs text-zinc-500">Choose which governance events reach you directly.</p>
            </div>

            <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
              {NOTIFICATION_ROWS.map((row) => (
                <label key={row.key} className="flex items-start justify-between gap-4 px-3.5 py-3 cursor-pointer hover:bg-zinc-50/60 transition-colors">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900">{row.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{row.description}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.notifications[row.key]}
                    onChange={(e) => handleNotificationChange(row.key, e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Delivery Channel</h2>
              <p className="text-xs text-zinc-500">Where enabled alerts are routed.</p>
            </div>

            <div className="space-y-2.5">
              {([
                { value: 'email', title: 'Email only', hint: state.profile.email },
                { value: 'email_sms', title: 'Email + SMS', hint: `${state.profile.email} & ${state.profile.phone}` },
                { value: 'in_app', title: 'In-app only', hint: 'Shown in the platform notification tray' },
              ] as const).map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                    state.notifications.channel === option.value
                      ? 'border-[#B81D22] bg-red-50/40 ring-2 ring-red-600/10'
                      : 'border-zinc-200 hover:bg-zinc-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="notification-channel"
                    value={option.value}
                    checked={state.notifications.channel === option.value}
                    onChange={() => handleNotificationChange('channel', option.value)}
                    className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900">{option.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 break-all">{option.hint}</div>
                  </div>
                </label>
              ))}
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed pt-2 border-t border-zinc-100">
              Security alerts are always delivered by email regardless of this setting, as required by the platform
              security policy.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Sign-in Security */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Credentials</h2>
              <p className="text-xs text-zinc-500">
                Password changes and MFA re-enrolment are completed on a dedicated confirmation screen.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100 text-xs">
              <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div>
                  <div className="font-bold text-zinc-900">Password</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Last changed 42 days ago &bull; expires in 48 days</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shrink-0"
                >
                  Change
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div>
                  <div className="font-bold text-zinc-900 flex items-center gap-2">
                    Multi-Factor Authentication
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase">
                      Enrolled
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{mfaEnrolledOn} &bull; 8 recovery codes remaining</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMfaOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shrink-0"
                >
                  Re-enrol
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div>
                  <div className="font-bold text-zinc-900">Recovery Codes</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Regenerating invalidates all existing codes</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmRequest({
                      eyebrow: 'Sign-in Security',
                      title: 'Regenerate recovery codes?',
                      confirmLabel: 'Regenerate',
                      tone: 'danger',
                      body: (
                        <>
                          Your 8 existing recovery codes stop working immediately. A fresh set is shown once, and
                          you will need to store it somewhere safe.
                        </>
                      ),
                      onConfirm: () => setRecoveryOpen(true),
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shrink-0"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Active Sessions</h2>
                <p className="text-xs text-zinc-500">Devices currently holding a valid SuperAdmin session.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmRequest({
                    eyebrow: 'Sign-in Security',
                    title: 'Sign out other devices?',
                    confirmLabel: 'Sign Out Others',
                    tone: 'danger',
                    body: (
                      <>
                        {sessions.filter((session) => !session.current).length} other device
                        {sessions.filter((session) => !session.current).length === 1 ? '' : 's'} will be signed
                        out at once. This device stays signed in.
                      </>
                    ),
                    onConfirm: signOutOtherSessions,
                  })
                }
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shrink-0"
              >
                Sign out others
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {sessions.map((session) => (
                <div
                  key={session.ip}
                  className={`rounded-xl border p-3.5 ${session.current ? 'border-emerald-200 bg-emerald-50/50' : 'border-zinc-200 bg-zinc-50/50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-900 truncate">{session.device}</span>
                    {session.current && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase shrink-0">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                    {session.location} &bull; {session.ip}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{session.seen}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: API Access Keys */}
      {activeTab === 'api' && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Programmatic Access Keys</h2>
              <p className="text-xs text-zinc-500">
                Keys authenticate platform-level integrations. Only the prefix is ever shown again after creation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewKeyOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 shrink-0"
            >
              Create New Key
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Label</th>
                  <th className="py-2.5 px-3">Key Prefix</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3">Last Used</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {state.apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-zinc-900">{key.label}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-500">{key.prefix}&bull;&bull;&bull;&bull;</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${SCOPE_STYLES[key.scope]}`}>
                        {SCOPE_LABELS[key.scope]}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-500">{key.createdOn}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-500">{key.lastUsed}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${
                          key.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}
                      >
                        {key.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {key.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmRequest({
                              eyebrow: 'API Access',
                              title: 'Revoke this key?',
                              confirmLabel: 'Revoke Key',
                              tone: 'danger',
                              body: (
                                <>
                                  <strong>{key.label}</strong> stops authenticating on its next request and cannot
                                  be restored. Integrations using it will start returning 401 responses.
                                </>
                              ),
                              onConfirm: () => {
                                handleRevokeKey(key.id);
                                notify(`${key.label} revoked. Issue a replacement key before the integration next runs.`, 'warning');
                              },
                            })
                          }
                          className="text-[11px] font-semibold text-[#B81D22] hover:underline"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-400">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5">
            <p className="font-bold text-red-900 text-[11px] uppercase tracking-wider">Revocation is immediate</p>
            <p className="text-[11px] text-red-800 mt-1 leading-relaxed">
              A revoked key stops authenticating on the next request and cannot be restored. Integrations using it will
              begin returning 401 responses until a replacement key is issued.
            </p>
          </div>
        </div>
      )}
      {passwordOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordOpen(false)}
          onChanged={() => notify('Password updated. Your other devices have been signed out.')}
        />
      )}

      {mfaOpen && (
        <MfaEnrolmentModal
          onClose={() => setMfaOpen(false)}
          onEnrolled={() => {
            setMfaEnrolledOn('Authenticator app (re-enrolled today)');
            notify('Authenticator replaced. Your previous factor no longer works.');
          }}
        />
      )}

      {recoveryOpen && (
        <RecoveryCodesModal onClose={() => setRecoveryOpen(false)} onNotify={(message) => notify(message)} />
      )}

      {newKeyOpen && (
        <CreateApiKeyModal
          onClose={() => setNewKeyOpen(false)}
          existingLabels={state.apiKeys.map((key) => key.label)}
          onCreate={(key) => {
            setState((prev) => ({ ...prev, apiKeys: [key, ...prev.apiKeys] }));
            notify(`${key.label} created. Copy the secret now — it is not shown again.`);
          }}
        />
      )}

      {confirmRequest && (
        <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
      )}
    </form>
  );
}
