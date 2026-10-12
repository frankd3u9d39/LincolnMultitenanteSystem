'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getSystemReport } from '@/modules/superadmin/services/api';
import { useAsync } from '@/modules/superadmin/hooks';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components';
import { ReportRange, TelemetryBucket } from '@/modules/superadmin/types';
import { compactNumber, formatStorage } from '@/modules/superadmin/utils';

const RANGES: ReportRange[] = ['7d', '30d', 'quarter', 'ytd'];

type Metric = 'dau' | 'api' | 'latency';

const METRIC_LABELS: Record<Metric, string> = {
  dau: 'Daily Users',
  api: 'API Requests',
  latency: 'Latency (ms)',
};

function metricValue(bucket: TelemetryBucket, metric: Metric): number {
  return metric === 'dau' ? bucket.dau : metric === 'api' ? bucket.apiRequests : bucket.latencyMs;
}

function metricLabel(bucket: TelemetryBucket, metric: Metric): string {
  return metric === 'dau'
    ? bucket.dau.toLocaleString()
    : metric === 'api'
    ? compactNumber(bucket.apiRequests)
    : `${bucket.latencyMs} ms`;
}

/** A coloured "↑ 14.4%" figure; for latency, lower is the good direction. */
function Change({ value, unit, lowerIsBetter = false }: { value: number | null; unit: string; lowerIsBetter?: boolean }) {
  if (value === null || value === 0) {
    return <span className="text-zinc-400">no change</span>;
  }

  const improved = lowerIsBetter ? value < 0 : value > 0;

  return (
    <span className={`font-bold ${improved ? 'text-emerald-600' : 'text-red-600'}`}>
      {value > 0 ? '↑' : '↓'} {Math.abs(value)}
      {unit}
    </span>
  );
}

function complianceStyle(score: number): string {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 70) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export default function SystemReportsPage() {
  const [selectedRange, setSelectedRange] = useState<ReportRange>('7d');
  const [selectedMetric, setSelectedMetric] = useState<Metric>('dau');

  const { data, loading, refreshing, error, reload } = useAsync((signal) => getSystemReport(selectedRange, signal), [selectedRange]);

  if (loading) {
    return <LoadingBlock rows={6} label="Loading system reports" />;
  }

  if (error && !data) {
    return <ErrorBlock message={error} onRetry={reload} />;
  }

  if (!data) {
    return null;
  }

  const { telemetry, campusSizeDistribution, tenants, isolation, overview } = data;
  const { summary, changes, series, peak, baseline } = telemetry;
  const totalSchools = overview.tenants.total;
  const maxValue = Math.max(1, ...series.map((bucket) => metricValue(bucket, selectedMetric)));
  const sizeBars = [
    { label: 'Large (1,000+ students)', count: campusSizeDistribution.large, tone: 'bg-[#B81D22]' },
    { label: 'Medium (500 - 999 students)', count: campusSizeDistribution.medium, tone: 'bg-blue-500' },
    { label: 'Small (under 500 students)', count: campusSizeDistribution.small, tone: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">System Reports</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Platform performance analytics, multi-tenant utilization benchmarks, and audit summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-xs font-bold rounded-lg uppercase transition-colors ${
                  selectedRange === range ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {summary === null ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          No telemetry has been recorded yet. The daily capture job fills this in from tomorrow.
        </div>
      ) : (
        <>
          {/* 4 Telemetry Highlight Cards */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">Avg Daily Active Users</span>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">{summary.avgDau.toLocaleString()}</div>
              <div className="mt-2 text-xs flex items-center gap-1">
                <Change value={changes?.dauPercent ?? null} unit="%" />
                <span className="text-zinc-400">vs previous period</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">Avg Daily API Requests</span>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">{compactNumber(summary.avgApiRequests)}</div>
              <div className="mt-2 text-xs flex items-center gap-1">
                <Change value={changes?.requestsPercent ?? null} unit="%" />
                <span className="text-zinc-400">vs previous period</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">Average Response Latency</span>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">{summary.avgLatencyMs} ms</div>
              <div className="mt-2 text-xs flex items-center gap-1">
                <Change value={changes?.latencyMs ?? null} unit=" ms" lowerIsBetter />
                <span className="text-zinc-400">vs previous period</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">Error Incident Rate</span>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">{summary.errorRatePercent}%</div>
              <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                <span className={`font-bold ${summary.totalErrors === 0 ? 'text-emerald-600' : 'text-zinc-700'}`}>
                  {summary.totalErrors.toLocaleString()} errors
                </span>
                <span className="text-zinc-400">across {compactNumber(summary.totalRequests)} requests</span>
              </div>
            </div>
          </div>

          {/* Main Charts & Visual Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Platform Activity Trends</h2>
                  <p className="text-xs text-zinc-500">
                    Cross-tenant operational volume
                    {selectedRange === 'quarter' ? ', weekly averages' : selectedRange === 'ytd' ? ', monthly averages' : ', daily'}.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl text-xs">
                  {(Object.keys(METRIC_LABELS) as Metric[]).map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => setSelectedMetric(metric)}
                      className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                        selectedMetric === metric ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                      }`}
                    >
                      {METRIC_LABELS[metric]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 pt-6 flex items-end justify-between gap-1 sm:gap-2 px-2">
                {series.map((bucket) => {
                  const heightPct = Math.max(2, Math.round((metricValue(bucket, selectedMetric) / maxValue) * 85));
                  return (
                    <div key={bucket.date} className="flex-1 min-w-0 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="text-[11px] font-bold text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {metricLabel(bucket, selectedMetric)}
                      </div>
                      <div className="w-full max-w-[48px] bg-zinc-100 rounded-t-xl overflow-hidden h-full flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-[#B81D22] to-rose-500 rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-500 truncate max-w-full">
                        {series.length > 16 && series.indexOf(bucket) % 2 === 1 ? '' : bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span>Baseline Minimum: {baseline ? `${baseline.dau.toLocaleString()} DAU (${baseline.date})` : '—'}</span>
                <span className="font-bold text-zinc-700">Peak: {peak ? `${peak.dau.toLocaleString()} DAU (${peak.date})` : '—'}</span>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-900">Campus Size Distribution</h3>

                <div className="space-y-3">
                  {sizeBars.map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-700">{bar.label}</span>
                        <span className="font-bold text-zinc-900">
                          {bar.count} school{bar.count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bar.tone}`}
                          style={{ width: `${totalSchools > 0 ? (bar.count / totalSchools) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
                  All <strong className="text-zinc-900">{totalSchools} schools</strong> run the full feature set at no cost.
                </div>
              </div>

              {/* Tenant isolation: a real integrity check, run when the page loads. */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isolation.passed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <h3 className="text-sm font-bold text-zinc-900">Tenant Boundary Integrity</h3>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {isolation.passed
                    ? `All ${isolation.checks.length} data checks passed: no account, snapshot or audit entry has escaped its tenant.`
                    : 'Some records break the tenant boundary and need attention.'}
                </p>
                <ul className="space-y-1.5 text-[11px]">
                  {isolation.checks.map((check) => (
                    <li key={check.label} className="flex items-start justify-between gap-3">
                      <span className="text-zinc-600">{check.label}</span>
                      <span className={`font-bold shrink-0 ${check.violations === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {check.violations === 0 ? 'Pass' : `${check.violations} found`}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] font-mono text-zinc-400">
                  Checked {new Date(isolation.checkedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tenant Performance Ranking Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Tenant Performance &amp; Utilization Benchmarks</h2>
            <p className="text-xs text-zinc-500">
              Compliance starts at 100 and loses points for suspension, missing MFA, storage over 85%, and 14 days of inactivity.
            </p>
          </div>
          <Link href="/superadmin/schools" className="text-xs font-semibold text-[#B81D22] hover:underline">
            All Schools &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Institution</th>
                <th className="py-2.5 px-3 text-right">Students</th>
                <th className="py-2.5 px-3 text-right">Attendance Rate</th>
                <th className="py-2.5 px-3 text-right">Storage Used</th>
                <th className="py-2.5 px-3 text-center">Compliance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {tenants.map((tenant) => (
                <tr key={tenant.schoolCode} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-zinc-900 truncate max-w-[240px]">{tenant.schoolName}</div>
                    <div className="text-[11px] font-mono text-zinc-400">{tenant.schoolCode}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-zinc-900">{tenant.students.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-bold text-emerald-600">{tenant.attendanceRatePercent}%</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[11px] text-zinc-500">
                    {formatStorage(tenant.storageUsedGb)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${complianceStyle(tenant.complianceScore)}`}>
                      {tenant.complianceScore}%
                    </span>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    No tenants to report on yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
