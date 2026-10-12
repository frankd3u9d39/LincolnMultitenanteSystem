'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TelemetryDay {
  date: string;
  dau: number;
  apiRequests: number;
  latencyMs: number;
  cpu: number;
}

const TELEMETRY_7_DAYS: TelemetryDay[] = [
  { date: '18 Sep', dau: 14200, apiRequests: 2450000, latencyMs: 42.5, cpu: 28.4 },
  { date: '19 Sep', dau: 14350, apiRequests: 2520000, latencyMs: 41.2, cpu: 29.1 },
  { date: '20 Sep', dau: 14500, apiRequests: 2610000, latencyMs: 43.1, cpu: 31.0 },
  { date: '21 Sep', dau: 15100, apiRequests: 2890000, latencyMs: 39.8, cpu: 34.5 },
  { date: '22 Sep', dau: 15450, apiRequests: 3100000, latencyMs: 38.6, cpu: 35.2 },
  { date: '23 Sep', dau: 15900, apiRequests: 3340000, latencyMs: 40.1, cpu: 37.8 },
  { date: '24 Sep', dau: 16250, apiRequests: 3480000, latencyMs: 39.2, cpu: 36.4 },
];

interface TenantReport {
  name: string;
  code: string;
  students: number;
  attendancePct: number;
  storageMb: number;
  complianceScore: number;
}

const TOP_TENANTS: TenantReport[] = [
  { name: 'Lincoln College of Science Management & Technology', code: 'LC-SMTS-001', students: 1240, attendancePct: 94.6, storageMb: 142350, complianceScore: 99 },
  { name: 'Cambridge International College', code: 'CIC-SMTS-005', students: 1890, attendancePct: 95.8, storageMb: 215400, complianceScore: 98 },
  { name: 'Horizon STEM Institute', code: 'HZ-SMTS-003', students: 1450, attendancePct: 96.2, storageMb: 110400, complianceScore: 100 },
  { name: 'St. Augustine Science & Arts Academy', code: 'SA-SMTS-002', students: 980, attendancePct: 92.1, storageMb: 48200, complianceScore: 96 },
  { name: 'Kingsway Polytechnic', code: 'KP-SMTS-004', students: 820, attendancePct: 89.8, storageMb: 62100, complianceScore: 94 },
  { name: 'Apex Advanced Science Academy', code: 'AASA-SMTS-006', students: 740, attendancePct: 93.4, storageMb: 39400, complianceScore: 97 },
];

export default function SystemReportsPage() {
  const [selectedRange, setSelectedRange] = useState<string>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'dau' | 'api' | 'latency'>('dau');

  const maxDau = Math.max(...TELEMETRY_7_DAYS.map((d) => d.dau));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            System Reports
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Platform performance analytics, multi-tenant utilization benchmarks, and audit summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
            {['7d', '30d', 'quarter', 'ytd'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-xs font-bold rounded-lg uppercase transition-colors ${
                  selectedRange === range
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">Daily Active Users</span>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">16,250</div>
          <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
            <span>&uarr; 14.4%</span>
            <span className="text-zinc-400 font-normal">vs previous period</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">API Throughput</span>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">3.48M</div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">99.99%</span>
            <span className="text-zinc-400">successful response rate</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">Average Response Latency</span>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">39.2 ms</div>
          <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
            <span>&darr; 3.3 ms faster</span>
            <span className="text-zinc-400 font-normal">than baseline</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">System Error Incident Rate</span>
          <div className="text-3xl font-black text-zinc-900 tracking-tight">0.014%</div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">5 isolated errors</span>
            <span className="text-zinc-400">across 24h</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 7-Day Trend Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Platform Activity Trends</h2>
              <p className="text-xs text-zinc-500">Cross-tenant operational volume over the selected timeframe.</p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSelectedMetric('dau')}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                  selectedMetric === 'dau' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                }`}
              >
                Daily Users
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('api')}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                  selectedMetric === 'api' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                }`}
              >
                API Requests
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('latency')}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                  selectedMetric === 'latency' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                }`}
              >
                Latency (ms)
              </button>
            </div>
          </div>

          {/* Visual Bar Chart for DAU */}
          <div className="h-64 pt-6 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {TELEMETRY_7_DAYS.map((day) => {
              const heightPct = Math.round((day.dau / maxDau) * 85);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[11px] font-bold text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {selectedMetric === 'dau'
                      ? day.dau.toLocaleString()
                      : selectedMetric === 'api'
                      ? (day.apiRequests / 1000000).toFixed(2) + 'M'
                      : day.latencyMs + 'ms'}
                  </div>
                  <div className="w-full max-w-[48px] bg-zinc-100 rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-[#B81D22] to-rose-500 rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-500">{day.date}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Baseline Minimum: 14,200 DAU</span>
            <span className="font-bold text-zinc-700">Peak: 16,250 DAU (24 Sep)</span>
          </div>
        </div>

        {/* Right: Capacity Breakdown & Compliance */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">Campus Size Distribution</h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-zinc-700">Large (1,000+ students)</span>
                  <span className="font-bold text-zinc-900">6 schools</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full bg-[#B81D22] rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-zinc-700">Medium (500 - 999 students)</span>
                  <span className="font-bold text-zinc-900">7 schools</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-zinc-700">Small (under 500 students)</span>
                  <span className="font-bold text-zinc-900">7 schools</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
              All <strong className="text-zinc-900">20 schools</strong> run the full feature set at no cost.
            </div>
          </div>
          {/* Quick Compliance Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900">Tenant Data Isolation Audit</h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Automated multi-tenant database scoping check passed with 100% tenant key isolation on all queries.
            </p>
            <div className="text-[11px] font-mono text-zinc-400">Last verification: Today at 03:00 UTC</div>
          </div>
        </div>
      </div>

      {/* Tenant Performance Ranking Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Tenant Performance &amp; Utilization Benchmarks</h2>
            <p className="text-xs text-zinc-500">Comparative activity ratings across onboarded institutions.</p>
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
              {TOP_TENANTS.map((tenant) => (
                <tr key={tenant.code} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-zinc-900 truncate max-w-[240px]">{tenant.name}</div>
                    <div className="text-[11px] font-mono text-zinc-400">{tenant.code}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-zinc-900">
                    {tenant.students.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-bold text-emerald-600">{tenant.attendancePct}%</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[11px] text-zinc-500">
                    {(tenant.storageMb / 1024).toFixed(1)} GB
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                      {tenant.complianceScore}% PASS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
