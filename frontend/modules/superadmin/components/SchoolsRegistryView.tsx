'use client';

import React, { useMemo, useState } from 'react';
import { SchoolTenant, SubscriptionTier, TenantStatus } from '../types';

const TENANTS: SchoolTenant[] = [
  { id: 1, name: 'Lincoln College of Science Management & Technology', code: 'LC-SMTS-001', domain: 'lincoln.edu', tier: 'enterprise', tierLabel: 'Enterprise University', status: 'active', students: 1240, teachers: 84, storageUsedGb: 139.0, storageQuotaGb: 1000, monthlyFeeNgn: 350000, principalAdmin: 'Dr. Sarah Jenkins', principalEmail: 's.jenkins@lincoln.edu', city: 'Lagos', onboardedOn: '2023-01-14', renewsOn: '2027-01-14', lastActivity: '4 minutes ago' },
  { id: 2, name: 'St. Augustine Science & Arts Academy', code: 'SA-SMTS-002', domain: 'st-augustine.ac.uk', tier: 'pro', tierLabel: 'Pro Academic', status: 'active', students: 980, teachers: 65, storageUsedGb: 47.1, storageQuotaGb: 250, monthlyFeeNgn: 120000, principalAdmin: 'Dr. Julian Thorne', principalEmail: 'j.thorne@st-augustine.ac.uk', city: 'Abuja', onboardedOn: '2023-04-02', renewsOn: '2026-11-02', lastActivity: '22 minutes ago' },
  { id: 3, name: 'Horizon STEM Institute', code: 'HZ-SMTS-003', domain: 'horizon-stem.org', tier: 'enterprise', tierLabel: 'Enterprise University', status: 'active', students: 1450, teachers: 96, storageUsedGb: 107.8, storageQuotaGb: 1000, monthlyFeeNgn: 350000, principalAdmin: 'Dr. Fiona Gallagher', principalEmail: 'f.gallagher@horizon-stem.org', city: 'Port Harcourt', onboardedOn: '2023-06-19', renewsOn: '2026-12-19', lastActivity: '1 hour ago' },
  { id: 4, name: 'Kingsway Polytechnic', code: 'KP-SMTS-004', domain: 'kingswaypoly.ac.uk', tier: 'pro', tierLabel: 'Pro Academic', status: 'active', students: 820, teachers: 54, storageUsedGb: 60.6, storageQuotaGb: 250, monthlyFeeNgn: 120000, principalAdmin: 'Robert Stirling', principalEmail: 'r.stirling@kingswaypoly.ac.uk', city: 'Ibadan', onboardedOn: '2023-08-07', renewsOn: '2027-02-07', lastActivity: '3 hours ago' },
  { id: 5, name: 'Cambridge International College', code: 'CIC-SMTS-005', domain: 'cambridge-intl.org', tier: 'enterprise', tierLabel: 'Enterprise University', status: 'active', students: 1890, teachers: 120, storageUsedGb: 210.4, storageQuotaGb: 1000, monthlyFeeNgn: 350000, principalAdmin: 'Dr. Victoria Alcott', principalEmail: 'v.alcott@cambridge-intl.org', city: 'Lagos', onboardedOn: '2022-11-23', renewsOn: '2026-11-23', lastActivity: '12 minutes ago' },
  { id: 6, name: 'Apex Advanced Science Academy', code: 'AASA-SMTS-006', domain: 'apexscience.edu', tier: 'pro', tierLabel: 'Pro Academic', status: 'active', students: 740, teachers: 48, storageUsedGb: 38.5, storageQuotaGb: 250, monthlyFeeNgn: 120000, principalAdmin: 'Prof. David Mercer', principalEmail: 'd.mercer@apexscience.edu', city: 'Enugu', onboardedOn: '2024-01-30', renewsOn: '2027-01-30', lastActivity: '5 hours ago' },
  { id: 7, name: 'Oakridge Technical High', code: 'OTH-SMTS-007', domain: 'oakridge.sch.uk', tier: 'starter', tierLabel: 'Starter Campus', status: 'active', students: 310, teachers: 22, storageUsedGb: 12.5, storageQuotaGb: 50, monthlyFeeNgn: 45000, principalAdmin: 'Eleanor Vance', principalEmail: 'e.vance@oakridge.sch.uk', city: 'Kano', onboardedOn: '2024-03-11', renewsOn: '2026-10-11', lastActivity: '1 day ago' },
  { id: 8, name: 'Meridian Grammar School', code: 'MGS-SMTS-008', domain: 'meridiangrammar.edu', tier: 'starter', tierLabel: 'Starter Campus', status: 'active', students: 404, teachers: 29, storageUsedGb: 18.2, storageQuotaGb: 50, monthlyFeeNgn: 45000, principalAdmin: 'Grace Adeyemi', principalEmail: 'g.adeyemi@meridiangrammar.edu', city: 'Benin City', onboardedOn: '2024-05-06', renewsOn: '2026-11-06', lastActivity: '8 hours ago' },
  { id: 9, name: 'Northgate Institute of Technology', code: 'NIT-SMTS-009', domain: 'northgate-tech.ac.ng', tier: 'pro', tierLabel: 'Pro Academic', status: 'active', students: 1105, teachers: 72, storageUsedGb: 94.3, storageQuotaGb: 250, monthlyFeeNgn: 120000, principalAdmin: 'Dr. Ibrahim Danladi', principalEmail: 'i.danladi@northgate-tech.ac.ng', city: 'Kaduna', onboardedOn: '2023-09-18', renewsOn: '2026-12-18', lastActivity: '35 minutes ago' },
  { id: 10, name: 'Silverbrook Girls College', code: 'SGC-SMTS-010', domain: 'silverbrook.sch.ng', tier: 'starter', tierLabel: 'Starter Campus', status: 'active', students: 288, teachers: 24, storageUsedGb: 9.7, storageQuotaGb: 50, monthlyFeeNgn: 45000, principalAdmin: 'Mrs. Helen Obi', principalEmail: 'h.obi@silverbrook.sch.ng', city: 'Owerri', onboardedOn: '2024-07-22', renewsOn: '2027-01-22', lastActivity: '2 days ago' },
  { id: 11, name: 'Royal Crest Academy', code: 'RCA-SMTS-011', domain: 'royalcrest.edu.ng', tier: 'pro', tierLabel: 'Pro Academic', status: 'active', students: 912, teachers: 61, storageUsedGb: 71.9, storageQuotaGb: 250, monthlyFeeNgn: 120000, principalAdmin: 'Dr. Emeka Nwosu', principalEmail: 'e.nwosu@royalcrest.edu.ng', city: 'Abuja', onboardedOn: '2023-11-04', renewsOn: '2026-11-04', lastActivity: '48 minutes ago' },
  { id: 12, name: 'Brookfield Science Secondary', code: 'BSS-SMTS-012', domain: 'brookfield.sch.ng', tier: 'starter', tierLabel: 'Starter Campus', status: 'active', students: 352, teachers: 27, storageUsedGb: 21.4, storageQuotaGb: 50, monthlyFeeNgn: 45000, principalAdmin: 'Samuel Okafor', principalEmail: 's.okafor@brookfield.sch.ng', city: 'Jos', onboardedOn: '2024-09-09', renewsOn: '2027-03-09', lastActivity: '6 hours ago' },
  { id: 13, name: 'Whitestone International School', code: 'WIS-SMTS-013', domain: 'whitestone-intl.org', tier: 'enterprise', tierLabel: 'Enterprise University', status: 'active', students: 1620, teachers: 104, storageUsedGb: 168.3, storageQuotaGb: 1000, monthlyFeeNgn: 350000, principalAdmin: 'Dr. Amaka Eze', principalEmail: 'a.eze@whitestone-intl.org', city: 'Lagos', onboardedOn: '2022-08-15', renewsOn: '2026-10-15', lastActivity: '9 minutes ago' },
  { id: 14, name: 'Hilltop Community College', code: 'HCC-SMTS-014', domain: 'hilltopcc.ac.ng', tier: 'pro', tierLabel: 'Pro Academic', status: 'active', students: 677, teachers: 44, storageUsedGb: 42.8, storageQuotaGb: 250, monthlyFeeNgn: 120000, principalAdmin: 'Blessing Adeyinka', principalEmail: 'b.adeyinka@hilltopcc.ac.ng', city: 'Ilorin', onboardedOn: '2024-02-26', renewsOn: '2027-02-26', lastActivity: '4 hours ago' },
  { id: 15, name: 'Greenvale Preparatory', code: 'GVP-SMTS-015', domain: 'greenvaleprep.sch.ng', tier: 'starter', tierLabel: 'Starter Campus', status: 'active', students: 196, teachers: 18, storageUsedGb: 6.9, storageQuotaGb: 50, monthlyFeeNgn: 45000, principalAdmin: 'Tunde Bakare', principalEmail: 't.bakare@greenvaleprep.sch.ng', city: 'Abeokuta', onboardedOn: '2025-01-13', renewsOn: '2027-01-13', lastActivity: '3 days ago' },
  { id: 16, name: 'Pinnacle Medical Sciences College', code: 'PMS-SMTS-016', domain: 'pinnaclemed.ac.ng', tier: 'enterprise', tierLabel: 'Enterprise University', status: 'active', students: 1380, teachers: 118, storageUsedGb: 196.7, storageQuotaGb: 1000, monthlyFeeNgn: 350000, principalAdmin: 'Prof. Chidi Okonkwo', principalEmail: 'c.okonkwo@pinnaclemed.ac.ng', city: 'Enugu', onboardedOn: '2023-03-08', renewsOn: '2027-03-08', lastActivity: '17 minutes ago' },
  { id: 17, name: 'Eastbourne Technical Institute', code: 'ETI-SMTS-017', domain: 'eastbourne-tech.ac.ng', tier: 'pro', tierLabel: 'Pro Academic', status: 'active', students: 845, teachers: 57, storageUsedGb: 66.2, storageQuotaGb: 250, monthlyFeeNgn: 120000, principalAdmin: 'Dr. Yusuf Bello', principalEmail: 'y.bello@eastbourne-tech.ac.ng', city: 'Maiduguri', onboardedOn: '2023-12-01', renewsOn: '2026-12-01', lastActivity: '1 hour ago' },
  { id: 18, name: 'Clearwater Agricultural College', code: 'CAC-SMTS-018', domain: 'clearwateragric.ac.ng', tier: 'starter', tierLabel: 'Starter Campus', status: 'active', students: 241, teachers: 21, storageUsedGb: 11.1, storageQuotaGb: 50, monthlyFeeNgn: 45000, principalAdmin: 'Ngozi Udeh', principalEmail: 'n.udeh@clearwateragric.ac.ng', city: 'Makurdi', onboardedOn: '2024-11-17', renewsOn: '2026-11-17', lastActivity: '14 hours ago' },
  { id: 19, name: 'Crestview Maritime Academy', code: 'CMA-SMTS-019', domain: 'crestview.ac.uk', tier: 'pro', tierLabel: 'Pro Academic', status: 'trialing', students: 120, teachers: 12, storageUsedGb: 5.1, storageQuotaGb: 250, monthlyFeeNgn: 0, principalAdmin: 'Capt. Thomas Hayes', principalEmail: 't.hayes@crestview.ac.uk', city: 'Calabar', onboardedOn: '2026-09-21', renewsOn: '2026-10-21', lastActivity: '26 minutes ago' },
  { id: 20, name: 'Vanguard Institute of Sciences', code: 'VIS-SMTS-020', domain: 'vanguardsciences.edu', tier: 'pro', tierLabel: 'Pro Academic', status: 'suspended', students: 640, teachers: 42, storageUsedGb: 67.3, storageQuotaGb: 250, monthlyFeeNgn: 120000, principalAdmin: 'Arthur Pendelton', principalEmail: 'a.pendelton@vanguardsciences.edu', city: 'Warri', onboardedOn: '2023-07-05', renewsOn: '2026-07-05', lastActivity: '21 days ago' },
  { id: 21, name: 'Lakeside Business School', code: 'LBS-SMTS-021', domain: 'lakesidebiz.ac.ng', tier: 'starter', tierLabel: 'Starter Campus', status: 'pending', students: 0, teachers: 0, storageUsedGb: 0, storageQuotaGb: 50, monthlyFeeNgn: 45000, principalAdmin: 'Olusegun Adeniyi', principalEmail: 'o.adeniyi@lakesidebiz.ac.ng', city: 'Uyo', onboardedOn: '2026-10-01', renewsOn: '2027-10-01', lastActivity: 'Awaiting verification' },
];

const STATUS_STYLES: Record<TenantStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trialing: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
};

const TIER_STYLES: Record<SubscriptionTier, string> = {
  starter: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  pro: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
};

type SortKey = 'name' | 'students' | 'storageUsedGb' | 'monthlyFeeNgn';

export function SchoolsRegistryView() {
  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [tierFilter, setTierFilter] = useState<'all' | SubscriptionTier>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('students');
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<SchoolTenant | null>(null);

  const totals = useMemo(
    () => ({
      count: TENANTS.length,
      active: TENANTS.filter((t) => t.status === 'active').length,
      students: TENANTS.reduce((sum, t) => sum + t.students, 0),
      teachers: TENANTS.reduce((sum, t) => sum + t.teachers, 0),
      storage: TENANTS.reduce((sum, t) => sum + t.storageUsedGb, 0),
      mrr: TENANTS.filter((t) => t.status === 'active').reduce((sum, t) => sum + t.monthlyFeeNgn, 0),
    }),
    []
  );

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = TENANTS.filter((tenant) => {
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      const matchesTier = tierFilter === 'all' || tenant.tier === tierFilter;
      const matchesQuery =
        term === '' ||
        tenant.name.toLowerCase().includes(term) ||
        tenant.code.toLowerCase().includes(term) ||
        tenant.domain.toLowerCase().includes(term) ||
        tenant.principalAdmin.toLowerCase().includes(term) ||
        tenant.city.toLowerCase().includes(term);
      return matchesStatus && matchesTier && matchesQuery;
    });

    return filtered.sort((a, b) => {
      const direction = sortDesc ? -1 : 1;
      if (sortKey === 'name') return a.name.localeCompare(b.name) * direction;
      return (a[sortKey] - b[sortKey]) * direction;
    });
  }, [query, statusFilter, tierFilter, sortKey, sortDesc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDesc((prev) => !prev);
      return;
    }
    setSortKey(key);
    setSortDesc(key !== 'name');
  };

  const sortCaret = (key: SortKey) => (sortKey === key ? (sortDesc ? ' ▾' : ' ▴') : '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Schools (Tenants)</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Provision, inspect, and govern every institution boundary enrolled on the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => alert('Tenant registry CSV export will be enabled in the next release.')}
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Export Registry
          </button>
          <button
            type="button"
            onClick={() => alert('School Provisioning Modal will be enabled in next release.')}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Onboard School</span>
          </button>
        </div>
      </div>

      {/* Aggregate strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Tenants', value: totals.count.toString(), hint: `${totals.active} currently active`, accent: 'text-[#B81D22]' },
          { label: 'Campus Population', value: totals.students.toLocaleString(), hint: `${totals.teachers.toLocaleString()} faculty members`, accent: 'text-blue-700' },
          { label: 'Storage Consumed', value: `${(totals.storage / 1024).toFixed(2)} TB`, hint: 'Across all tenant buckets', accent: 'text-amber-700' },
          { label: 'Recurring Revenue', value: `₦${totals.mrr.toLocaleString()}`, hint: 'Billed monthly, active only', accent: 'text-emerald-700' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500">{card.label}</span>
            <div className={`mt-1.5 text-2xl font-black tracking-tight ${card.accent}`}>{card.value}</div>
            <div className="mt-2 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">{card.hint}</div>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl max-w-full overflow-x-auto">
              {(['all', 'active', 'trialing', 'suspended', 'pending'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                    statusFilter === status ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl max-w-full overflow-x-auto">
              {(['all', 'starter', 'pro', 'enterprise'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                    tierFilter === tier ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-zinc-500 shrink-0">
            Showing <span className="font-bold text-zinc-800">{rows.length}</span> of {TENANTS.length} tenants
          </span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by school name, code (e.g. LC-SMTS-001), domain, principal admin, or city..."
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
        />

        {/* Registry table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">
                  <button type="button" onClick={() => toggleSort('name')} className="hover:text-zinc-800 uppercase">
                    School &amp; Domain{sortCaret('name')}
                  </button>
                </th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3 text-right">
                  <button type="button" onClick={() => toggleSort('students')} className="hover:text-zinc-800 uppercase">
                    Population{sortCaret('students')}
                  </button>
                </th>
                <th className="py-2.5 px-3">
                  <button type="button" onClick={() => toggleSort('storageUsedGb')} className="hover:text-zinc-800 uppercase">
                    Storage{sortCaret('storageUsedGb')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-right">
                  <button type="button" onClick={() => toggleSort('monthlyFeeNgn')} className="hover:text-zinc-800 uppercase">
                    Monthly{sortCaret('monthlyFeeNgn')}
                  </button>
                </th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {rows.map((tenant) => {
                const usage = Math.min(100, (tenant.storageUsedGb / tenant.storageQuotaGb) * 100);
                return (
                  <tr key={tenant.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-900 truncate max-w-[230px]">{tenant.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                        <span>{tenant.code}</span>
                        <span>&bull;</span>
                        <span className="text-zinc-500">{tenant.domain}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${TIER_STYLES[tenant.tier]}`}>
                        {tenant.tierLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-bold text-zinc-900">{tenant.students.toLocaleString()}</div>
                      <div className="text-[11px] text-zinc-400">{tenant.teachers} faculty</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${usage > 85 ? 'bg-red-500' : usage > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${usage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500 shrink-0">{usage.toFixed(0)}%</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {tenant.storageUsedGb.toFixed(1)} / {tenant.storageQuotaGb} GB
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-zinc-600">
                      {tenant.monthlyFeeNgn === 0 ? '—' : `₦${tenant.monthlyFeeNgn.toLocaleString()}`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLES[tenant.status]}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(tenant)}
                        className="text-[11px] font-semibold text-[#B81D22] hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 text-xs">
                    No tenants match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant inspector drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />

          <aside className="relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-start justify-between gap-3 p-5 border-b border-zinc-200 bg-zinc-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tenant Inspector</span>
                <h2 className="text-base font-bold text-zinc-900 mt-0.5">{selected.name}</h2>
                <p className="text-[11px] font-mono text-zinc-500">
                  {selected.code} &bull; {selected.domain}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 transition-colors"
                aria-label="Close inspector"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLES[selected.status]}`}>
                  {selected.status}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${TIER_STYLES[selected.tier]}`}>
                  {selected.tierLabel}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
                {[
                  ['Principal Administrator', selected.principalAdmin],
                  ['Administrator Email', selected.principalEmail],
                  ['Campus City', selected.city],
                  ['Enrolled Students', selected.students.toLocaleString()],
                  ['Faculty & Staff', selected.teachers.toLocaleString()],
                  ['Storage Usage', `${selected.storageUsedGb.toFixed(1)} GB of ${selected.storageQuotaGb} GB`],
                  ['Monthly Subscription', selected.monthlyFeeNgn === 0 ? 'Trial — no charge' : `₦${selected.monthlyFeeNgn.toLocaleString()}`],
                  ['Onboarded On', selected.onboardedOn],
                  ['Renews On', selected.renewsOn],
                  ['Last Activity', selected.lastActivity],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <span className="text-zinc-500">{label}</span>
                    <span className="font-semibold text-zinc-900 text-right break-all">{value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">Tenant isolation notice</p>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  All records shown are scoped to this tenant boundary. Cross-tenant queries are blocked at the data layer
                  and every action taken here is written to the platform audit trail.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-zinc-200 bg-zinc-50 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => alert(`Opening ${selected.name} subscription editor.`)}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-white/60 transition-colors shadow-sm"
              >
                Change Tier
              </button>
              <button
                type="button"
                onClick={() => alert(`Impersonation session request logged for ${selected.name}.`)}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-white/60 transition-colors shadow-sm"
              >
                Request Access
              </button>
              <button
                type="button"
                onClick={() => alert(`Billing history for ${selected.name}.`)}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-white/60 transition-colors shadow-sm"
              >
                Billing History
              </button>
              <button
                type="button"
                onClick={() =>
                  alert(
                    selected.status === 'suspended'
                      ? `Reinstatement request queued for ${selected.name}.`
                      : `Suspension request queued for ${selected.name}.`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10"
              >
                {selected.status === 'suspended' ? 'Reinstate Tenant' : 'Suspend Tenant'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
