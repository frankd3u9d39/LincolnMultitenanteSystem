'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboard, listDashboardTenants } from '@/modules/superadmin/services/api';
import { useAsync } from '@/modules/superadmin/hooks';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components';
import { AuditSeverity } from '@/modules/superadmin/types';
import { TENANT_STATUS_STYLES, formatStorage, timeAgo } from '@/modules/superadmin/utils';

const STATUS_FILTERS = ['all', 'active', 'pending', 'suspended'] as const;

const FEED_STYLES: Record<AuditSeverity, { label: string; card: string; title: string; body: string }> = {
  info: { label: 'text-emerald-600', card: 'bg-zinc-50 border-zinc-100', title: 'text-zinc-800', body: 'text-zinc-500' },
  warning: { label: 'text-amber-600', card: 'bg-amber-50/50 border-amber-100', title: 'text-amber-900', body: 'text-amber-700' },
  critical: { label: 'text-red-600', card: 'bg-red-50/50 border-red-100', title: 'text-red-900', body: 'text-red-700' },
};

/** Bar colour for a utilisation percentage: calm, then amber, then red. */
function barTone(percent: number): string {
  if (percent >= 85) return 'bg-red-500';
  if (percent >= 65) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function SuperAdminDashboardPage() {
  const [filterStatus, setFilterStatus] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const overview = useAsync((signal) => getDashboard(signal), []);
  const tenants = useAsync(
    (signal) => listDashboardTenants({ status: filterStatus, search: debouncedSearch }, signal),
    [filterStatus, debouncedSearch]
  );

  if (overview.loading) {
    return <LoadingBlock rows={6} label="Loading platform overview" />;
  }

  if (overview.error || !overview.data) {
    return <ErrorBlock message={overview.error ?? 'The overview could not be loaded.'} onRetry={overview.reload} />;
  }

  const { tenants: counts, population, storage, infrastructure, recentActivity } = overview.data;
  const rows = tenants.data ?? [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Platform Overview</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            SuperAdmin central telemetry and governance for all enrolled institution tenants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/superadmin/system-reports"
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Telemetry Reports
          </Link>
          <Link
            href="/superadmin/audit-logs"
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Audit Trail
          </Link>
          <Link
            href="/superadmin/schools?onboard=1"
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Onboard School</span>
          </Link>
        </div>
      </div>

      {/* 4 Master KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Enrolled Schools</span>
            <span className="font-bold text-[#B81D22] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">
              {counts.active} Active
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">{counts.total}</div>
          <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
            <span className="truncate">
              {counts.pending} Pending &bull; {counts.suspended} Suspended
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Campus Population</span>
            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">
              Platform
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">
            {(population.students + population.teachers).toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
            <span className="truncate">{population.students.toLocaleString()} Students</span>
            <span className="font-medium text-zinc-700 shrink-0">{population.teachers.toLocaleString()} Teachers</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Needs Attention</span>
            <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">
              Governance
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">{counts.needsAttention}</div>
          <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
            <span className="truncate">{counts.pending} Pending verification</span>
            <span className={`font-bold shrink-0 ${counts.suspended > 0 ? 'text-red-600' : 'text-zinc-500'}`}>
              {counts.suspended} Suspended
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Storage Allocated</span>
            <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">
              {storage.usagePercent}% Used
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">{formatStorage(storage.usedGb)}</div>
          <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
            <span className="truncate">{formatStorage(storage.quotaGb)} Quota</span>
            <span className="text-zinc-600 shrink-0">Across {counts.total} Tenants</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Multi-Tenant Schools Table + Live Audit Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Schools Registry (8 cols) */}
        <div className="xl:col-span-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Institution Tenants</h2>
              <p className="text-xs text-zinc-500">Largest campuses first. Open the registry for the full list.</p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                    filterStatus === status ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search school name, code (e.g. LC-SMTS-001), or domain..."
            aria-label="Search tenants"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
          />

          {tenants.error && !tenants.data ? (
            <ErrorBlock message={tenants.error} onRetry={tenants.reload} />
          ) : (
            <div className={`overflow-x-auto rounded-xl border border-zinc-100 transition-opacity ${tenants.refreshing ? 'opacity-60' : ''}`}>
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">School Name &amp; Code</th>
                    <th className="py-2.5 px-3 text-right">Students</th>
                    <th className="py-2.5 px-3 text-right">Storage</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {tenants.loading && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        Loading tenants…
                      </td>
                    </tr>
                  )}
                  {rows.map((school) => (
                    <tr key={school.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-zinc-900 truncate max-w-[220px]">{school.name}</div>
                        <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                          <span>{school.code}</span>
                          <span>&bull;</span>
                          <span className="text-zinc-500">{school.domain}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-zinc-900">{school.students.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-zinc-500 font-mono text-[11px]">
                        {formatStorage(school.storageUsedGb)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${TENANT_STATUS_STYLES[school.status]}`}
                        >
                          {school.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/superadmin/schools?tenant=${school.code}`}
                          className="text-[11px] font-semibold text-[#B81D22] hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!tenants.loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        No tenants match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Live Audit Activity & System Telemetry (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">Live Security Feed</h3>
              <Link href="/superadmin/audit-logs" className="text-xs font-semibold text-[#B81D22] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {recentActivity.length === 0 && <p className="text-zinc-400 text-center py-4">No activity recorded yet.</p>}
              {recentActivity.map((event) => {
                const style = FEED_STYLES[event.severity];
                return (
                  <div key={event.id} className={`p-2.5 rounded-xl border ${style.card}`}>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 gap-2">
                      <span className={`font-bold uppercase truncate ${style.label}`}>{event.eventType}</span>
                      <span className="shrink-0">{timeAgo(event.timestamp)}</span>
                    </div>
                    <div className={`font-semibold ${style.title}`}>{event.description ?? event.action}</div>
                    <div className={`text-[11px] font-mono mt-0.5 ${style.body}`}>
                      {event.ipAddress ? `IP: ${event.ipAddress} • ` : ''}
                      {event.schoolName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Performance Gauges */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">Infrastructure Vitals</h3>
              {infrastructure.metricDate && <span className="text-[10px] text-zinc-400 font-mono">as of {infrastructure.metricDate}</span>}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1 text-zinc-700">
                  <span>Server CPU Load</span>
                  <span className="font-bold">{infrastructure.serverCpuPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className={`h-full rounded-full ${barTone(infrastructure.serverCpuPercent)}`} style={{ width: `${Math.min(100, infrastructure.serverCpuPercent)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1 text-zinc-700">
                  <span>Memory Usage</span>
                  <span className="font-bold">{infrastructure.serverRamPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className={`h-full rounded-full ${barTone(infrastructure.serverRamPercent)}`} style={{ width: `${Math.min(100, infrastructure.serverRamPercent)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1 text-zinc-700">
                  <span>Avg API Response Time</span>
                  <span className="font-bold text-emerald-600">{infrastructure.avgResponseTimeMs} ms</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  {/* 200 ms is treated as a full bar; anything slower is already off the chart. */}
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (infrastructure.avgResponseTimeMs / 200) * 100)}%` }} />
                </div>
              </div>

              <div className="flex justify-between pt-1 text-zinc-500">
                <span>Daily active users</span>
                <span className="font-bold text-zinc-800">{infrastructure.dailyActiveUsers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
