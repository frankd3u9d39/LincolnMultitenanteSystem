'use client';

import React, { useEffect, useState } from 'react';
import { ApiError } from '@/services/api';
import { AuditLogEntry, AuditSeverity } from '@/modules/superadmin/types';
import { downloadAuditLog, listAuditLogs } from '@/modules/superadmin/services/api';
import { useAsync, useNotice } from '@/modules/superadmin/hooks';
import { ErrorBlock, LoadingBlock, NoticeBanner } from '@/modules/superadmin/components';

const PAGE_SIZE = 15;

export default function SecurityAuditLogsPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | AuditSeverity>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState(1);
  const [activeLogModal, setActiveLogModal] = useState<AuditLogEntry | null>(null);
  const [exporting, setExporting] = useState(false);
  const { notice, notify, dismiss } = useNotice();

  // Search waits for a pause in typing so each keystroke is not a request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, loading, refreshing, error, reload } = useAsync(
    (signal) =>
      listAuditLogs(
        { severity: selectedSeverity, eventGroup: selectedEventType, search: debouncedSearch, page, perPage: PAGE_SIZE },
        signal
      ),
    [selectedSeverity, selectedEventType, debouncedSearch, page]
  );

  const logs = data?.items ?? [];
  const headline = data?.headline;
  const pageCount = Math.max(1, data?.lastPage ?? 1);
  const currentPage = data?.page ?? 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const fileName = await downloadAuditLog({ severity: selectedSeverity, eventGroup: selectedEventType, search: debouncedSearch });
      notify(`Audit log exported to ${fileName}.`);
    } catch (failure) {
      notify(failure instanceof ApiError ? failure.message : 'The audit log could not be exported.', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingBlock rows={6} label="Loading audit log" />;
  }

  if (error && !data) {
    return <ErrorBlock message={error} onRetry={reload} />;
  }

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
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{exporting ? 'Preparing…' : 'Download Audit Log'}</span>
          </button>
        </div>
      </div>

      <NoticeBanner notice={notice} onDismiss={dismiss} />

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-zinc-400 block">Total Recorded Events</span>
            <span className="text-2xl font-black text-zinc-900">{(headline?.totalEvents ?? 0).toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
            All
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-zinc-400 block">Critical Events (24h)</span>
            <span className="text-2xl font-black text-red-600">{headline?.criticalLast24h ?? 0}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold">
            !
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-zinc-400 block">Administrative Changes</span>
            <span className="text-2xl font-black text-blue-600">{(headline?.administrativeChanges ?? 0).toLocaleString()}</span>
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
                onClick={() => {
                  setSelectedSeverity(sev as 'all' | AuditSeverity);
                  setPage(1);
                }}
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
              onChange={(e) => {
                setSelectedEventType(e.target.value);
                setPage(1);
              }}
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
              {logs.map((log) => (
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
                    <div className="text-[11px] text-zinc-500">{log.actorEmail ?? '—'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-zinc-800 truncate max-w-[180px] block">
                      {log.schoolName}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-zinc-500">
                    {log.ipAddress ?? '—'}
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
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 text-xs">
                    No events match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-zinc-500">
            Page <span className="font-bold text-zinc-800">{currentPage}</span> of {pageCount}
            <span className="ml-2">&bull; {(data?.total ?? 0).toLocaleString()} matching events{refreshing ? ' …' : ''}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
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
              {activeLogModal.description ?? 'No description recorded.'}
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
                <span className="text-zinc-800">{activeLogModal.ipAddress ?? '—'}</span>
              </div>
              <div className="pt-2">
                <span className="text-zinc-400 block mb-1">User Agent Header</span>
                <span className="text-[11px] text-zinc-600 break-all bg-zinc-100 p-2 rounded-lg block">
                  {activeLogModal.userAgent ?? 'Not recorded'}
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
