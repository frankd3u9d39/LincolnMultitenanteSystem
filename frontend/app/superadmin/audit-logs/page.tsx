'use client';

import React, { useState } from 'react';
import { downloadCsv } from '@/modules/superadmin/utils';

interface AuditLog {
  id: number;
  timestamp: string;
  eventType: string;
  action: string;
  severity: 'info' | 'warning' | 'critical';
  actorName: string;
  actorEmail: string;
  actorRole: string;
  schoolName: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  details?: Record<string, string | number | boolean>;
}

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    timestamp: '2026-09-24 10:45:00',
    eventType: 'auth.login.success',
    action: 'SuperAdmin Authentication',
    severity: 'info',
    actorName: 'Alexander Cross',
    actorEmail: 'admin@lincolnplatform.io',
    actorRole: 'SuperAdmin',
    schoolName: 'Platform Global',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    description: 'Alexander Cross successfully authenticated via multi-factor auth.',
    details: { auth_method: 'TOTP_2FA', session_duration: 120, privileged: true },
  },
  {
    id: 2,
    timestamp: '2026-09-24 09:30:12',
    eventType: 'tenant.provisioned',
    action: 'Provisioned School Tenant',
    severity: 'info',
    actorName: 'Alexander Cross',
    actorEmail: 'admin@lincolnplatform.io',
    actorRole: 'SuperAdmin',
    schoolName: 'Evergreen Institute of Technology',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    description: 'Provisioned new school tenant #18 with a 250 GB storage quota.',
    details: { tenant_id: 18, code: 'EIT-SMTS-018', storage_quota_gb: 250, admin_assigned: true },
  },
  {
    id: 3,
    timestamp: '2026-09-24 03:15:22',
    eventType: 'auth.failed_attempt',
    action: 'Suspicious Brute-Force Login',
    severity: 'critical',
    actorName: 'Unknown (Attacker)',
    actorEmail: 'admin@lincoln.edu',
    actorRole: 'Unauthenticated',
    schoolName: 'Lincoln College',
    ipAddress: '185.220.101.45',
    userAgent: 'Python-Requests/2.28.1 (Scraper)',
    description: 'Multiple failed password attempts detected from blacklisted TOR exit node.',
    details: { attempts_count: 5, auto_blocked: true, geo: 'Unknown / Proxy' },
  },
  {
    id: 4,
    timestamp: '2026-09-23 16:00:45',
    eventType: 'tenant.quota_raised',
    action: 'Raised Tenant Storage Quota',
    severity: 'info',
    actorName: 'Alexander Cross',
    actorEmail: 'admin@lincolnplatform.io',
    actorRole: 'SuperAdmin',
    schoolName: 'Lincoln College of Science Management & Technology',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    description: 'Raised Lincoln College storage quota from 500 GB to 1 TB.',
    details: { old_quota_gb: 500, new_quota_gb: 1000, reason: 'Archive migration' },
  },
  {
    id: 5,
    timestamp: '2026-09-23 14:15:10',
    eventType: 'tenant.suspended',
    action: 'Suspended School Tenant',
    severity: 'warning',
    actorName: 'Alexander Cross',
    actorEmail: 'admin@lincolnplatform.io',
    actorRole: 'SuperAdmin',
    schoolName: 'Vanguard Institute of Sciences',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    description: 'Suspended Vanguard Institute account after 180 days with no sign-in activity.',
    details: { tenant_id: 20, inactive_days: 180, reason: 'Dormant tenant policy' },
  },
  {
    id: 6,
    timestamp: '2026-09-23 11:20:00',
    eventType: 'platform.setting_updated',
    action: 'Updated Security Policy',
    severity: 'warning',
    actorName: 'Elena Rostova',
    actorEmail: 'e.rostova@lincolnplatform.io',
    actorRole: 'SuperAdmin',
    schoolName: 'Platform Global',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    description: 'Enforced mandatory TOTP MFA for all SuperAdmin and School Administrator roles.',
    details: { key: 'mfa_enforced_superadmin', old_value: false, new_value: true },
  },
  {
    id: 7,
    timestamp: '2026-09-23 09:00:15',
    eventType: 'user.created',
    action: 'Admitted Student Record',
    severity: 'info',
    actorName: 'Dr. Sarah Jenkins',
    actorEmail: 's.jenkins@lincoln.edu',
    actorRole: 'School Admin',
    schoolName: 'Lincoln College of Science Management & Technology',
    ipAddress: '82.165.197.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    description: 'Registered new student Liam Chen (ID: 11) into Computer Science 2025/2026 cohort.',
    details: { student_id: 11, admission_cohort: '2025/2026', department: 'Computer Science' },
  },
];

export default function SecurityAuditLogsPage() {
  const [logs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLogModal, setActiveLogModal] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    const matchesType = selectedEventType === 'all' || log.eventType.startsWith(selectedEventType);
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);
    return matchesSeverity && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Security Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Cryptographically sealed operational audit trail of platform events, security triggers, and admin actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-600 shadow-sm">
            <span>Log Retention:</span>
            <span className="font-bold text-zinc-900">365 Days</span>
          </div>
          <button
            type="button"
            onClick={() => {
              downloadCsv(
                'security_audit_log',
                [
                  'Timestamp',
                  'Event Type',
                  'Severity',
                  'Actor',
                  'Actor Email',
                  'Actor Role',
                  'School',
                  'IP Address',
                  'Description',
                  'User Agent',
                ],
                filteredLogs.map((log) => [
                  log.timestamp,
                  log.eventType,
                  log.severity,
                  log.actorName,
                  log.actorEmail,
                  log.actorRole,
                  log.schoolName,
                  log.ipAddress,
                  log.description,
                  log.userAgent,
                ])
              );
            }}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Audit Log</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-zinc-400 block">Total Recorded Events</span>
            <span className="text-2xl font-black text-zinc-900">1,420</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
            All
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-zinc-400 block">Flagged Security Anomalies (24h)</span>
            <span className="text-2xl font-black text-red-600">1</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold">
            !
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-zinc-400 block">Administrative Changes</span>
            <span className="text-2xl font-black text-blue-600">6</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            Gov
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Severity filter pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
            {['all', 'info', 'warning', 'critical'].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Event type filter dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Category:</span>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20"
            >
              <option value="all">All Event Categories</option>
              <option value="auth">Authentication (auth.*)</option>
              <option value="tenant">Tenancy (tenant.*)</option>
              <option value="platform">Platform Policy (platform.*)</option>
              <option value="user">User Lifecycle (user.*)</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, actor name, email, IP address, or school name..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
          />
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Action &amp; Event</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Institution Tenant</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        log.severity === 'info'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : log.severity === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-zinc-900">{log.action}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{log.eventType}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-zinc-900">{log.actorName}</div>
                    <div className="text-[11px] text-zinc-500">{log.actorEmail}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-zinc-800 truncate max-w-[180px] block">
                      {log.schoolName}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-zinc-500">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveLogModal(log)}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:text-[#B81D22] hover:border-[#B81D22] text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {activeLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-zinc-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    activeLogModal.severity === 'info'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : activeLogModal.severity === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {activeLogModal.severity}
                </span>
                <h3 className="text-base font-bold text-zinc-900">{activeLogModal.action}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLogModal(null)}
                className="text-zinc-400 hover:text-zinc-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              {activeLogModal.description}
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-400">Timestamp</span>
                <span className="text-zinc-800">{activeLogModal.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-400">Event ID</span>
                <span className="text-zinc-800">EVT-LOG-00{activeLogModal.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-400">Actor</span>
                <span className="text-zinc-800">{activeLogModal.actorName} ({activeLogModal.actorRole})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-400">Tenant Target</span>
                <span className="text-zinc-800">{activeLogModal.schoolName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-400">IP Address</span>
                <span className="text-zinc-800">{activeLogModal.ipAddress}</span>
              </div>
              <div className="pt-2">
                <span className="text-zinc-400 block mb-1">User Agent Header</span>
                <span className="text-[11px] text-zinc-600 break-all bg-zinc-100 p-2 rounded-lg block">
                  {activeLogModal.userAgent}
                </span>
              </div>
              {activeLogModal.details && (
                <div className="pt-2">
                  <span className="text-zinc-400 block mb-1">Event Metadata Payload</span>
                  <pre className="text-[11px] text-zinc-700 bg-zinc-100 p-2.5 rounded-lg overflow-x-auto">
                    {JSON.stringify(activeLogModal.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLogModal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
