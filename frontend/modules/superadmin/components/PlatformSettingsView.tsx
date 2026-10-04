'use client';

import React, { useState } from 'react';
import { FullPlatformSettings, TenantResourceLimits } from '../types';

type SettingsTab = 'general' | 'tenants' | 'security' | 'mail' | 'storage';

interface SettingsTabDef {
  key: SettingsTab;
  label: string;
  icon: string;
}

const INITIAL_SETTINGS: FullPlatformSettings = {
  general: {
    platformName: 'Lincoln Multi-Tenant Academic Platform',
    tagline: 'Enterprise Multi-School Governance & Management System',
    supportEmail: 'platform-support@lincoln.edu',
    supportPhone: '+234 (0) 800-LINCOLN-SYS',
    helpdeskUrl: 'https://support.lincolnplatform.io',
    defaultTimezone: 'Africa/Lagos (GMT+1)',
    defaultCurrency: 'NGN (₦)',
    maintenanceMode: false,
    maintenanceMessage:
      'The Lincoln Academic Platform is currently undergoing scheduled infrastructure upgrades. All campus portals will be available shortly.',
    allowedBypassIps: '192.168.1.100, 10.0.0.1, 197.210.54.12',
  },
  tenants: {
    onboardingMode: 'approval_required',
    allowSubdomainCustomization: true,
    requireDomainVerification: true,
    autoSuspendInactiveDays: 180,
  },
  resourceLimits: {
    maxStudents: 10000,
    maxTeachers: 800,
    storageQuotaGb: 250,
    maxFileUploadMb: 50,
  },  security: {
    enforceAdminMfa: true,
    minPasswordLength: 10,
    requireSpecialChars: true,
    requireNumbers: true,
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
    maxFailedLogins: 5,
    lockoutDurationMinutes: 15,
    ipWhitelistEnabled: false,
    allowedSuperAdminIps: '192.168.1.100, 10.0.0.45',
  },
  mail: {
    mailDriver: 'smtp',
    smtpHost: 'smtp.mailgun.org',
    smtpPort: 587,
    smtpEncryption: 'tls',
    smtpUsername: 'postmaster@mg.lincolnplatform.io',
    senderName: 'Lincoln Multi-Tenant Platform',
    senderEmail: 'notifications@lincolnplatform.io',
  },
  storage: {
    storageDriver: 's3',
    bucketName: 'lincoln-multitenant-production-assets',
    region: 'af-south-1',
    cdnDomain: 'https://cdn.lincolnplatform.io',
    autoBackupSchedule: 'daily',
    backupRetentionDays: 90,
    backupEncryptionEnabled: true,
    lastBackupTimestamp: '2026-09-29 02:00:15 UTC (Success - 4.2 GB)',
  },
};

export function PlatformSettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<FullPlatformSettings>(INITIAL_SETTINGS);
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [backupTriggering, setBackupTriggering] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);


  const handleGeneralChange = <K extends keyof FullPlatformSettings['general']>(
    key: K,
    value: FullPlatformSettings['general'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }));
  };

  const handleTenantsChange = <K extends keyof FullPlatformSettings['tenants']>(
    key: K,
    value: FullPlatformSettings['tenants'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      tenants: { ...prev.tenants, [key]: value },
    }));
  };

  const handleSecurityChange = <K extends keyof FullPlatformSettings['security']>(
    key: K,
    value: FullPlatformSettings['security'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [key]: value },
    }));
  };

  const handleMailChange = <K extends keyof FullPlatformSettings['mail']>(
    key: K,
    value: FullPlatformSettings['mail'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      mail: { ...prev.mail, [key]: value },
    }));
  };

  const handleStorageChange = <K extends keyof FullPlatformSettings['storage']>(
    key: K,
    value: FullPlatformSettings['storage'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      storage: { ...prev.storage, [key]: value },
    }));
  };

  const handleResourceLimitsChange = <K extends keyof TenantResourceLimits>(
    key: K,
    value: TenantResourceLimits[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      resourceLimits: { ...prev.resourceLimits, [key]: value },
    }));
  };
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 4000);
  };

  const handleSendTestEmail = () => {
    setTestEmailSending(true);
    setTestEmailResult(null);
    setTimeout(() => {
      setTestEmailSending(false);
      setTestEmailResult(
        `Test dispatch dispatched successfully to SuperAdmin mailbox via ${settings.mail.smtpHost}:${settings.mail.smtpPort}!`
      );
      setTimeout(() => setTestEmailResult(null), 5000);
    }, 1500);
  };

  const handleTriggerBackup = () => {
    setBackupTriggering(true);
    setBackupSuccessMsg(null);
    setTimeout(() => {
      setBackupTriggering(false);
      setBackupSuccessMsg(
        'Immediate cross-tenant snapshot initiated! Snapshot ID: #SNAP-20260929-01 (Estimated completion: 3 mins)'
      );
      setTimeout(() => setBackupSuccessMsg(null), 6000);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Platform Settings
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-[#B81D22] border border-red-200">
              SuperAdmin Global
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Global multi-tenant governance, security enforcement, mail infrastructure, and tenant resource limits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSettings(INITIAL_SETTINGS)}
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Floating Save Alert */}
      {isSavedAlert && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">
              Global Platform settings successfully saved and propagated across all school instances!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSavedAlert(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Maintenance Mode Banner Alert if enabled */}
      {settings.general.maintenanceMode && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <div className="font-bold text-amber-900">PLATFORM MAINTENANCE MODE IS ACTIVE</div>
            <p className="text-amber-800 mt-0.5">
              Normal student, teacher, and school admin access is currently suspended. Only bypass IPs ({settings.general.allowedBypassIps}) and SuperAdmins can access portals.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-2 text-xs sm:text-sm font-semibold">
        {([
          { key: 'general', label: 'General & Branding', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          { key: 'tenants', label: 'Tenant Onboarding & Limits', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { key: 'security', label: 'Security & Access Policies', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
          { key: 'mail', label: 'Mail Infrastructure (SMTP)', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
          { key: 'storage', label: 'Storage & Automated Backups', icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125' },
        ] as SettingsTabDef[]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'border-[#B81D22] text-[#B81D22] bg-red-50/40 rounded-t-lg'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: General & Branding */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-zinc-900">Platform Identity & Localization</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Platform Master Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.platformName}
                    onChange={(e) => handleGeneralChange('platformName', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B81D22] focus:border-transparent text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Public System Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.general.tagline}
                    onChange={(e) => handleGeneralChange('tagline', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B81D22] focus:border-transparent text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Default Timezone
                  </label>
                  <select
                    value={settings.general.defaultTimezone}
                    onChange={(e) => handleGeneralChange('defaultTimezone', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B81D22] text-zinc-900 bg-white"
                  >
                    <option value="Africa/Lagos (GMT+1)">Africa/Lagos (GMT+1) [Default]</option>
                    <option value="Africa/Accra (GMT)">Africa/Accra (GMT)</option>
                    <option value="Africa/Nairobi (GMT+3)">Africa/Nairobi (GMT+3)</option>
                    <option value="Europe/London (GMT/BST)">Europe/London (GMT/BST)</option>
                    <option value="UTC">UTC Universal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Default System Currency
                  </label>
                  <select
                    value={settings.general.defaultCurrency}
                    onChange={(e) => handleGeneralChange('defaultCurrency', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B81D22] text-zinc-900 bg-white"
                  >
                    <option value="NGN (₦)">NGN - Nigerian Naira (₦)</option>
                    <option value="USD ($)">USD - US Dollar ($)</option>
                    <option value="GBP (£)">GBP - British Pound (£)</option>
                    <option value="GHS (₵)">GHS - Ghanaian Cedi (₵)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-zinc-900">Support & Helpdesk Channels</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => handleGeneralChange('supportEmail', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B81D22] text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={settings.general.supportPhone}
                    onChange={(e) => handleGeneralChange('supportPhone', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B81D22] text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Knowledgebase URL
                  </label>
                  <input
                    type="url"
                    value={settings.general.helpdeskUrl}
                    onChange={(e) => handleGeneralChange('helpdeskUrl', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#B81D22] text-zinc-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Maintenance Mode Switch */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Global Maintenance Mode</h3>
                  <p className="text-[11px] text-zinc-500">Lock portals across all tenants</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => handleGeneralChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B81D22]"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Public Maintenance Announcement
                </label>
                <textarea
                  rows={3}
                  value={settings.general.maintenanceMessage}
                  onChange={(e) => handleGeneralChange('maintenanceMessage', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#B81D22] text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Allowed Bypass IP Addresses (comma-separated)
                </label>
                <input
                  type="text"
                  value={settings.general.allowedBypassIps}
                  onChange={(e) => handleGeneralChange('allowedBypassIps', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-mono text-zinc-800"
                  placeholder="192.168.1.1, 10.0.0.1"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">SuperAdmins accessing from these IPs can view system live.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tenant Onboarding & Resource Limits */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900">Tenant Registration & Onboarding Governance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1" htmlFor="onboarding-policy">
                  Onboarding Policy
                </label>
                <select
                  id="onboarding-policy"
                  value={settings.tenants.onboardingMode}
                  onChange={(e) => handleTenantsChange('onboardingMode', e.target.value as FullPlatformSettings['tenants']['onboardingMode'])}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 bg-white"
                >
                  <option value="approval_required">Self-Service with SuperAdmin Approval</option>
                  <option value="invitation_only">Strictly SuperAdmin Invitation Only</option>
                  <option value="open_registration">Open Instant Registration (Automated Provisioning)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1" htmlFor="auto-suspend-days">
                  Auto-Suspension on Inactivity (Days)
                </label>
                <input
                  id="auto-suspend-days"
                  type="number"
                  value={settings.tenants.autoSuspendInactiveDays}
                  onChange={(e) => handleTenantsChange('autoSuspendInactiveDays', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
                <p className="mt-1 text-[11px] text-zinc-400">
                  Dormant schools are suspended after this long with no sign-in activity.
                </p>
              </div>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-6 border-t border-zinc-100 text-xs text-zinc-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tenants.allowSubdomainCustomization}
                  onChange={(e) => handleTenantsChange('allowSubdomainCustomization', e.target.checked)}
                  className="rounded text-[#B81D22] focus:ring-[#B81D22]"
                />
                <span className="font-medium">Allow schools to select custom subdomains (e.g. *.lincolnplatform.io)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tenants.requireDomainVerification}
                  onChange={(e) => handleTenantsChange('requireDomainVerification', e.target.checked)}
                  className="rounded text-[#B81D22] focus:ring-[#B81D22]"
                />
                <span className="font-medium">Enforce DNS TXT record verification for custom apex domains</span>
              </label>
            </div>
          </div>

          {/* Default Tenant Resource Limits */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Default Tenant Resource Limits</h2>
                <p className="text-xs text-zinc-500">
                  Applied when a school is provisioned. Individual tenants can be raised from the registry.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Free for every school
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1" htmlFor="limit-maxStudents">
                  Maximum Students
                </label>
                <input
                  id="limit-maxStudents"
                  type="text"
                  inputMode="numeric"
                  value={settings.resourceLimits.maxStudents.toLocaleString()}
                  onChange={(e) =>
                    handleResourceLimitsChange('maxStudents', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
                <p className="mt-1 text-[11px] text-zinc-400">Enrolment ceiling for a single school.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1" htmlFor="limit-maxTeachers">
                  Maximum Faculty & Staff
                </label>
                <input
                  id="limit-maxTeachers"
                  type="text"
                  inputMode="numeric"
                  value={settings.resourceLimits.maxTeachers.toLocaleString()}
                  onChange={(e) =>
                    handleResourceLimitsChange('maxTeachers', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
                <p className="mt-1 text-[11px] text-zinc-400">Combined teaching and administrative accounts.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1" htmlFor="limit-storageQuotaGb">
                  Storage Quota (GB)
                </label>
                <input
                  id="limit-storageQuotaGb"
                  type="text"
                  inputMode="numeric"
                  value={settings.resourceLimits.storageQuotaGb.toLocaleString()}
                  onChange={(e) =>
                    handleResourceLimitsChange('storageQuotaGb', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
                <p className="mt-1 text-[11px] text-zinc-400">Default allocation per school, adjustable per tenant.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1" htmlFor="limit-maxFileUploadMb">
                  Maximum Upload Size (MB)
                </label>
                <input
                  id="limit-maxFileUploadMb"
                  type="text"
                  inputMode="numeric"
                  value={settings.resourceLimits.maxFileUploadMb.toLocaleString()}
                  onChange={(e) =>
                    handleResourceLimitsChange('maxFileUploadMb', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
                <p className="mt-1 text-[11px] text-zinc-400">Largest single file a school may upload.</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 text-[11px] text-zinc-600 leading-relaxed">
              These are capacity guards that protect shared infrastructure, not a paid plan. Every school has
              access to the full feature set at no cost; a school that outgrows a ceiling can simply be raised.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Access Policies */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900">Authentication & Session Hardening</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <div className="text-xs font-bold text-zinc-900">Mandatory Multi-Factor Auth (2FA)</div>
                  <div className="text-[11px] text-zinc-500">Require all institution head administrators to configure TOTP 2FA.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.enforceAdminMfa}
                    onChange={(e) => handleSecurityChange('enforceAdminMfa', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B81D22]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Session Inactivity Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) => handleSecurityChange('sessionTimeoutMinutes', parseInt(e.target.value) || 15)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Password Expiration (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.security.passwordExpiryDays}
                    onChange={(e) => handleSecurityChange('passwordExpiryDays', parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Max Failed Logins Before Lockout
                  </label>
                  <input
                    type="number"
                    value={settings.security.maxFailedLogins}
                    onChange={(e) => handleSecurityChange('maxFailedLogins', parseInt(e.target.value) || 3)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Lockout Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.lockoutDurationMinutes}
                    onChange={(e) => handleSecurityChange('lockoutDurationMinutes', parseInt(e.target.value) || 15)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900">Password Policy & IP Firewalls</h2>

            <div className="space-y-3 text-xs text-zinc-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.requireSpecialChars}
                  onChange={(e) => handleSecurityChange('requireSpecialChars', e.target.checked)}
                  className="rounded text-[#B81D22] focus:ring-[#B81D22]"
                />
                <span className="font-medium">Require at least one special character (!@#$%^&*)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.requireNumbers}
                  onChange={(e) => handleSecurityChange('requireNumbers', e.target.checked)}
                  className="rounded text-[#B81D22] focus:ring-[#B81D22]"
                />
                <span className="font-medium">Require numeric digits (0-9)</span>
              </label>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={settings.security.minPasswordLength}
                  onChange={(e) => handleSecurityChange('minPasswordLength', parseInt(e.target.value) || 8)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-zinc-900">Restrict SuperAdmin Access by IP</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.ipWhitelistEnabled}
                      onChange={(e) => handleSecurityChange('ipWhitelistEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B81D22]"></div>
                  </label>
                </div>
                <textarea
                  rows={2}
                  disabled={!settings.security.ipWhitelistEnabled}
                  value={settings.security.allowedSuperAdminIps}
                  onChange={(e) => handleSecurityChange('allowedSuperAdminIps', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                    settings.security.ipWhitelistEnabled
                      ? 'border-zinc-300 text-zinc-900'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed'
                  }`}
                  placeholder="203.0.113.195, 198.51.100.0/24"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Mail Infrastructure (SMTP) */}
      {activeTab === 'mail' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900">SMTP & Mail Relay Settings</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mail Delivery Driver
                </label>
                <select
                  value={settings.mail.mailDriver}
                  onChange={(e) => handleMailChange('mailDriver', e.target.value as FullPlatformSettings['mail']['mailDriver'])}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 bg-white"
                >
                  <option value="smtp">Standard SMTP Relay</option>
                  <option value="ses">Amazon SES</option>
                  <option value="sendgrid">SendGrid API</option>
                  <option value="mailgun">Mailgun API</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  value={settings.mail.smtpHost}
                  onChange={(e) => handleMailChange('smtpHost', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={settings.mail.smtpPort}
                  onChange={(e) => handleMailChange('smtpPort', parseInt(e.target.value) || 587)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Encryption Protocol
                </label>
                <select
                  value={settings.mail.smtpEncryption}
                  onChange={(e) => handleMailChange('smtpEncryption', e.target.value as FullPlatformSettings['mail']['smtpEncryption'])}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 bg-white"
                >
                  <option value="tls">TLS (Port 587 Recommended)</option>
                  <option value="ssl">SSL (Port 465)</option>
                  <option value="none">None (Insecure / Local)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={settings.mail.smtpUsername}
                  onChange={(e) => handleMailChange('smtpUsername', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Sender From Address
                </label>
                <input
                  type="email"
                  value={settings.mail.senderEmail}
                  onChange={(e) => handleMailChange('senderEmail', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Test Dispatch Panel */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">Test Connection & Relay</h3>
            <p className="text-xs text-zinc-500">
              Sends an instantaneous test message using the configured credentials to verify outbound mail delivery.
            </p>

            {testEmailResult && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {testEmailResult}
              </div>
            )}

            <button
              type="button"
              disabled={testEmailSending}
              onClick={handleSendTestEmail}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                testEmailSending
                  ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                  : 'bg-zinc-900 text-white hover:bg-black border-zinc-900 shadow-sm'
              }`}
            >
              {testEmailSending ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Connecting to Relay...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Storage & Backups */}
      {activeTab === 'storage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900">Cloud Media Storage & Assets</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Storage Provider Driver
                </label>
                <select
                  value={settings.storage.storageDriver}
                  onChange={(e) => handleStorageChange('storageDriver', e.target.value as FullPlatformSettings['storage']['storageDriver'])}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 bg-white"
                >
                  <option value="s3">AWS Amazon S3</option>
                  <option value="r2">Cloudflare R2</option>
                  <option value="gcs">Google Cloud Storage (GCS)</option>
                  <option value="local">Local Private Server Volume</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Bucket Name
                </label>
                <input
                  type="text"
                  value={settings.storage.bucketName}
                  onChange={(e) => handleStorageChange('bucketName', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={settings.storage.region}
                  onChange={(e) => handleStorageChange('region', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Public CDN Domain
                </label>
                <input
                  type="url"
                  value={settings.storage.cdnDomain}
                  onChange={(e) => handleStorageChange('cdnDomain', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Automated Snapshot Schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Backup Frequency
                  </label>
                  <select
                    value={settings.storage.autoBackupSchedule}
                    onChange={(e) => handleStorageChange('autoBackupSchedule', e.target.value as FullPlatformSettings['storage']['autoBackupSchedule'])}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900 bg-white"
                  >
                    <option value="hourly">Hourly Differential Snapshot</option>
                    <option value="daily">Daily Full Backup (02:00 UTC)</option>
                    <option value="weekly">Weekly Full Archive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Retention Cycle (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.storage.backupRetentionDays}
                    onChange={(e) => handleStorageChange('backupRetentionDays', parseInt(e.target.value) || 30)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs sm:text-sm text-zinc-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Backup Snapshot Actions */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">Database Snapshot Operations</h3>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
              <div className="font-semibold text-zinc-800">Latest Verified Backup:</div>
              <div className="font-mono text-[11px] text-zinc-500">{settings.storage.lastBackupTimestamp}</div>
            </div>

            {backupSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                {backupSuccessMsg}
              </div>
            )}

            <button
              type="button"
              disabled={backupTriggering}
              onClick={handleTriggerBackup}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                backupTriggering
                  ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                  : 'bg-[#B81D22] text-white hover:bg-[#9E1519] border-[#B81D22] shadow-sm'
              }`}
            >
              {backupTriggering ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Snapshot in progress...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span>Trigger Immediate Backup</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
