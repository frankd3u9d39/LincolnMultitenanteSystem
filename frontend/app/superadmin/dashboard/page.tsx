'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SchoolTenant {
  id: number;
  name: string;
  code: string;
  domain: string;
  students: number;
  teachers: number;
  storageMb: number;
  status: 'active' | 'pending' | 'suspended';
  admin: string;
}

const INITIAL_SCHOOLS: SchoolTenant[] = [
  { id: 1, name: 'Lincoln College of Science Management & Technology', code: 'LC-SMTS-001', domain: 'lincoln.edu', students: 1240, teachers: 84, storageMb: 142350, status: 'active', admin: 'Dr. Sarah Jenkins' },
  { id: 2, name: 'St. Augustine Science & Arts Academy', code: 'SA-SMTS-002', domain: 'st-augustine.ac.uk', students: 980, teachers: 65, storageMb: 48200, status: 'active', admin: 'Dr. Julian Thorne' },
  { id: 3, name: 'Horizon STEM Institute', code: 'HZ-SMTS-003', domain: 'horizon-stem.org', students: 1450, teachers: 96, storageMb: 110400, status: 'active', admin: 'Dr. Fiona Gallagher' },
  { id: 4, name: 'Kingsway Polytechnic', code: 'KP-SMTS-004', domain: 'kingswaypoly.ac.uk', students: 820, teachers: 54, storageMb: 62100, status: 'active', admin: 'Robert Stirling' },
  { id: 5, name: 'Cambridge International College', code: 'CIC-SMTS-005', domain: 'cambridge-intl.org', students: 1890, teachers: 120, storageMb: 215400, status: 'active', admin: 'Dr. Victoria Alcott' },
  { id: 6, name: 'Apex Advanced Science Academy', code: 'AASA-SMTS-006', domain: 'apexscience.edu', students: 740, teachers: 48, storageMb: 39400, status: 'active', admin: 'Prof. David Mercer' },
  { id: 7, name: 'Oakridge Technical High', code: 'OTH-SMTS-007', domain: 'oakridge.sch.uk', students: 310, teachers: 22, storageMb: 12800, status: 'active', admin: 'Eleanor Vance' },
  { id: 19, name: 'Crestview Maritime Academy', code: 'CMA-SMTS-019', domain: 'crestview.ac.uk', students: 120, teachers: 12, storageMb: 5200, status: 'pending', admin: 'Capt. Thomas Hayes' },
  { id: 20, name: 'Vanguard Institute of Sciences', code: 'VIS-SMTS-020', domain: 'vanguardsciences.edu', students: 640, teachers: 42, storageMb: 68900, status: 'suspended', admin: 'Arthur Pendelton' },
];

export default function SuperAdminDashboardPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSchools = INITIAL_SCHOOLS.filter((school) => {
    const matchesStatus = filterStatus === 'all' || school.status === filterStatus;
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Platform Overview
          </h1>
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
        {/* Card 1: Active Tenants */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          {/* Background Watermark Icon */}
          <div className="pointer-events-none absolute -right-2 -bottom-2 text-red-500/[0.08] group-hover:text-red-500/[0.14] group-hover:scale-110 transition-all duration-300">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25L2.25 7.5v2.25h19.5V7.5L12 2.25zM4.5 11.25v7.5m5-7.5v7.5m5-7.5v7.5m5-7.5v7.5M2.25 20.25h19.5v1.5H2.25v-1.5z" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Enrolled Schools</span>
                <span className="font-bold text-[#B81D22] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">
                  18 Active
                </span>
              </div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">20</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
              <span className="truncate">1 Pending &bull; 1 Suspended</span>
              <span className="text-emerald-600 font-bold shrink-0">+2 this month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Student & Staff Count */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          {/* Background Watermark Icon */}
          <div className="pointer-events-none absolute -right-2 -bottom-2 text-blue-500/[0.08] group-hover:text-blue-500/[0.14] group-hover:scale-110 transition-all duration-300">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Campus Population</span>
                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">
                  Platform
                </span>
              </div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">20,585</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
              <span className="truncate">19,350 Students</span>
              <span className="font-medium text-zinc-700 shrink-0">1,235 Teachers</span>
            </div>
          </div>
        </div>

        {/* Card 3: Governance Attention */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          {/* Background Watermark Icon */}
          <div className="pointer-events-none absolute -right-2 -bottom-2 text-amber-500/[0.08] group-hover:text-amber-500/[0.14] group-hover:scale-110 transition-all duration-300">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Needs Attention</span>
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">
                  Governance
                </span>
              </div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">2</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
              <span className="truncate">1 Pending verification</span>
              <span className="text-red-600 font-bold shrink-0">1 Suspended</span>
            </div>
          </div>
        </div>
        {/* Card 4: Global Storage Usage */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          {/* Background Watermark Icon */}
          <div className="pointer-events-none absolute -right-2 -bottom-2 text-amber-500/[0.08] group-hover:text-amber-500/[0.14] group-hover:scale-110 transition-all duration-300">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <ellipse cx="12" cy="5" rx="8" ry="2.5" strokeWidth={1.2} />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5v5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 10v5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v4c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-4" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Storage Allocated</span>
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">
                  27.6% Used
                </span>
              </div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">1.38 TB</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
              <span className="truncate">5.0 TB Quota</span>
              <span className="text-zinc-600 shrink-0">Across 20 Tenants</span>
            </div>
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
              <p className="text-xs text-zinc-500">Live operational status across all school boundaries.</p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
              {['all', 'active', 'pending', 'suspended'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                    filterStatus === status
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search school name, code (e.g. LC-SMTS-001), or domain..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-100">
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
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-900 truncate max-w-[220px]">{school.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                        <span>{school.code}</span>
                        <span>&bull;</span>
                        <span className="text-zinc-500">{school.domain}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-zinc-900">
                      {school.students.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-500 font-mono text-[11px]">
                      {(school.storageMb / 1024).toFixed(1)} GB
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          school.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : school.status === 'pending'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Audit Activity & System Telemetry (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Quick Real-Time Audit Feed */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">Live Security Feed</h3>
              <Link href="/superadmin/audit-logs" className="text-xs font-semibold text-[#B81D22] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="font-bold text-emerald-600 uppercase">auth.login.success</span>
                  <span>15m ago</span>
                </div>
                <div className="font-semibold text-zinc-800">SuperAdmin Alexander Cross logged in.</div>
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">IP: 192.168.1.100 &bull; London</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="font-bold text-blue-600 uppercase">tenant.quota_raised</span>
                  <span>2h ago</span>
                </div>
                <div className="font-semibold text-zinc-800">Lincoln College storage quota raised.</div>
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">500 GB &rarr; 1 TB &bull; Approved by A. Cross</div>              </div>

              <div className="p-2.5 rounded-xl bg-red-50/50 border border-red-100">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="font-bold text-red-600 uppercase">auth.failed_attempt</span>
                  <span>10h ago</span>
                </div>
                <div className="font-semibold text-red-900">3 failed attempts for administrator account.</div>
                <div className="text-[11px] text-red-700 font-mono mt-0.5">IP: 185.220.101.45 (Flagged)</div>
              </div>
            </div>
          </div>

          {/* System Performance Gauges */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">Infrastructure Vitals</h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1 text-zinc-700">
                  <span>Server CPU Load</span>
                  <span className="font-bold">36.4%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '36.4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1 text-zinc-700">
                  <span>Database RAM Usage</span>
                  <span className="font-bold">58.7%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '58.7%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1 text-zinc-700">
                  <span>Avg API Response Time</span>
                  <span className="font-bold text-emerald-600">39.2 ms</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '22%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
