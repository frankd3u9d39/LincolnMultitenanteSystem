'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SchoolTenant, TenantStatus } from '../types';
import { SCHOOL_TENANTS } from '../services';
import { useNotice } from '../hooks';
import { TENANT_STATUS_STYLES, downloadCsv, storageUsagePercent } from '../utils';
import { NoticeBanner } from './NoticeBanner';
import { ConfirmDialog, ConfirmRequest } from './ConfirmDialog';
import { OnboardDraft, OnboardSchoolModal } from './OnboardSchoolModal';
import { StorageQuotaModal } from './TenantDialogs';

type SortKey = 'name' | 'students' | 'storageUsedGb';

export function SchoolsRegistryView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('students');
  const [sortDesc, setSortDesc] = useState(true);

  const [tenants, setTenants] = useState<SchoolTenant[]>(SCHOOL_TENANTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [onboardOpenedHere, setOnboardOpenedHere] = useState(false);
  const [quotaTarget, setQuotaTarget] = useState<SchoolTenant | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const { notice, notify, dismiss } = useNotice();

  // Deep links from the dashboard (?tenant=CODE) open that tenant's inspector.
  const deepLinkCode = searchParams.get('tenant');
  const selected =
    tenants.find((tenant) => tenant.id === selectedId) ??
    (deepLinkCode ? tenants.find((tenant) => tenant.code === deepLinkCode) ?? null : null);

  const closeInspector = () => {
    setSelectedId(null);
    if (deepLinkCode) router.replace('/schools');
  };

  // Derived rather than seeded into state: the page is statically prerendered with no
  // search params, so a lazy useState initializer would never see the deep link.
  const onboardOpen = onboardOpenedHere || searchParams.get('onboard') === '1';

  const clearOnboardParam = () => {
    setOnboardOpenedHere(false);
    if (searchParams.get('onboard')) router.replace('/schools');
  };

  const handleProvision = (draft: OnboardDraft) => {
    const tenant: SchoolTenant = {
      id: Math.max(0, ...tenants.map((item) => item.id)) + 1,
      name: draft.name,
      code: draft.code,
      domain: draft.domain,
      status: draft.activateImmediately ? 'active' : 'pending',
      students: 0,
      teachers: 0,
      storageUsedGb: 0,
      storageQuotaGb: draft.storageQuotaGb,
      principalAdmin: draft.principalAdmin,
      principalEmail: draft.principalEmail,
      city: draft.city,
      onboardedOn: '2026-10-04',
      lastActivity: 'Awaiting first sign-in',
    };

    setTenants((prev) => [tenant, ...prev]);
    setStatusFilter('all');
    setQuery('');
    clearOnboardParam();
    setSelectedId(tenant.id);
    notify(
      `${tenant.name} provisioned as ${tenant.code} with a ${draft.storageQuotaGb.toLocaleString()} GB quota.${
        draft.activateImmediately ? ' The school is live now.' : ' It stays pending until the domain is verified.'
      }`
    );
  };

  const handleQuotaChange = (tenant: SchoolTenant, storageQuotaGb: number) => {
    setTenants((prev) => prev.map((item) => (item.id === tenant.id ? { ...item, storageQuotaGb } : item)));
    notify(`${tenant.name} storage quota set to ${storageQuotaGb.toLocaleString()} GB.`);
  };

  const handleToggleSuspension = (tenant: SchoolTenant) => {
    const reinstating = tenant.status === 'suspended';
    setTenants((prev) =>
      prev.map((item) =>
        item.id === tenant.id ? { ...item, status: reinstating ? 'active' : 'suspended' } : item
      )
    );
    notify(
      reinstating
        ? `${tenant.name} reinstated. Campus portals are reachable again.`
        : `${tenant.name} suspended. All campus sign-ins are now blocked.`,
      reinstating ? 'success' : 'warning'
    );
  };

  const handleGrantAccess = (tenant: SchoolTenant) => {
    setTenants((prev) =>
      prev.map((item) => (item.id === tenant.id ? { ...item, lastActivity: 'SuperAdmin session active' } : item))
    );
    notify(
      `Support session opened on ${tenant.name}. It expires in 30 minutes and every action is written to the audit trail.`,
      'info'
    );
  };

  const totals = useMemo(
    () => ({
      count: tenants.length,
      active: tenants.filter((t) => t.status === 'active').length,
      students: tenants.reduce((sum, t) => sum + t.students, 0),
      teachers: tenants.reduce((sum, t) => sum + t.teachers, 0),
      storage: tenants.reduce((sum, t) => sum + t.storageUsedGb, 0),
      needsAttention: tenants.filter((t) => t.status !== 'active').length,
    }),
    [tenants]
  );

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = tenants.filter((tenant) => {
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      const matchesQuery =
        term === '' ||
        tenant.name.toLowerCase().includes(term) ||
        tenant.code.toLowerCase().includes(term) ||
        tenant.domain.toLowerCase().includes(term) ||
        tenant.principalAdmin.toLowerCase().includes(term) ||
        tenant.city.toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });

    return filtered.sort((a, b) => {
      const direction = sortDesc ? -1 : 1;
      if (sortKey === 'name') return a.name.localeCompare(b.name) * direction;
      return (a[sortKey] - b[sortKey]) * direction;
    });
  }, [tenants, query, statusFilter, sortKey, sortDesc]);

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
            onClick={() => {
              const fileName = downloadCsv(
                'tenant_registry',
                [
                  'School Name', 'Tenant Code', 'Domain', 'Status', 'Students', 'Faculty',
                  'Storage Used (GB)', 'Storage Quota (GB)',
                  'Principal Admin', 'Admin Email', 'City', 'Onboarded', 'Last Activity',
                ],
                rows.map((tenant) => [
                  tenant.name, tenant.code, tenant.domain, tenant.status,
                  tenant.students, tenant.teachers, tenant.storageUsedGb.toFixed(1), tenant.storageQuotaGb,
                  tenant.principalAdmin, tenant.principalEmail, tenant.city,
                  tenant.onboardedOn, tenant.lastActivity,
                ])
              );
              notify(`Exported ${rows.length} tenant${rows.length === 1 ? '' : 's'} to ${fileName}.`);
            }}
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Export Registry
          </button>
          <button
            type="button"
            onClick={() => setOnboardOpenedHere(true)}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Onboard School</span>
          </button>
        </div>
      </div>

      <NoticeBanner notice={notice} onDismiss={dismiss} />

      {/* Aggregate strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Tenants', value: totals.count.toString(), hint: `${totals.active} currently active`, accent: 'text-[#B81D22]' },
          { label: 'Campus Population', value: totals.students.toLocaleString(), hint: `${totals.teachers.toLocaleString()} faculty members`, accent: 'text-blue-700' },
          { label: 'Storage Consumed', value: `${(totals.storage / 1024).toFixed(2)} TB`, hint: 'Across all tenant buckets', accent: 'text-amber-700' },
          { label: 'Needs Attention', value: totals.needsAttention.toString(), hint: 'Suspended or awaiting verification', accent: 'text-amber-700' },
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
              {(['all', 'active', 'pending', 'suspended'] as const).map((status) => (
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

          </div>

          <span className="text-[11px] text-zinc-500 shrink-0">
            Showing <span className="font-bold text-zinc-800">{rows.length}</span> of {tenants.length} tenants
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
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {rows.map((tenant) => {
                const usage = storageUsagePercent(tenant);
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
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${TENANT_STATUS_STYLES[tenant.status]}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedId(tenant.id)}
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
            onClick={() => closeInspector()}
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
                onClick={() => closeInspector()}
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
                <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${TENANT_STATUS_STYLES[selected.status]}`}>
                  {selected.status}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
                {[
                  ['Principal Administrator', selected.principalAdmin],
                  ['Administrator Email', selected.principalEmail],
                  ['Campus City', selected.city],
                  ['Enrolled Students', selected.students.toLocaleString()],
                  ['Faculty & Staff', selected.teachers.toLocaleString()],
                  ['Storage Usage', `${selected.storageUsedGb.toFixed(1)} GB of ${selected.storageQuotaGb.toLocaleString()} GB`],
                  ['Onboarded On', selected.onboardedOn],
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
                onClick={() => setQuotaTarget(selected)}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-white/60 transition-colors shadow-sm"
              >
                Adjust Quota
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirmRequest({
                    eyebrow: 'Tenant Access',
                    title: 'Open a support session?',
                    confirmLabel: 'Open Session',
                    body: (
                      <>
                        You will be signed in to <strong>{selected.name}</strong> as a SuperAdmin observer for 30
                        minutes. The tenant&apos;s administrators are notified, and every action you take is
                        recorded in the platform audit trail.
                      </>
                    ),
                    onConfirm: () => handleGrantAccess(selected),
                  })
                }
                className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-white/60 transition-colors shadow-sm"
              >
                Request Access
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirmRequest({
                    eyebrow: 'Tenant Status',
                    title: selected.status === 'suspended' ? 'Reinstate this tenant?' : 'Suspend this tenant?',
                    confirmLabel: selected.status === 'suspended' ? 'Reinstate Tenant' : 'Suspend Tenant',
                    tone: selected.status === 'suspended' ? 'default' : 'danger',
                    typeToConfirm: selected.status === 'suspended' ? undefined : 'SUSPEND',
                    body:
                      selected.status === 'suspended' ? (
                        <>
                          <strong>{selected.name}</strong> regains access immediately and its campus portals come
                          back online.
                        </>
                      ) : (
                        <>
                          Every sign-in for <strong>{selected.name}</strong> stops at once, affecting{' '}
                          {selected.students.toLocaleString()} students and {selected.teachers} staff. Data is
                          retained and the tenant can be reinstated later.
                        </>
                      ),
                    onConfirm: () => handleToggleSuspension(selected),
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10"
              >
                {selected.status === 'suspended' ? 'Reinstate Tenant' : 'Suspend Tenant'}
              </button>
            </div>
          </aside>
        </div>
      )}
      {onboardOpen && (
        <OnboardSchoolModal
          onClose={clearOnboardParam}
          onProvision={handleProvision}
          existingCodes={tenants.map((tenant) => tenant.code)}
          existingDomains={tenants.map((tenant) => tenant.domain)}
          nextSequence={tenants.length + 1}
        />
      )}

      {quotaTarget && (
        <StorageQuotaModal
          tenant={quotaTarget}
          onClose={() => setQuotaTarget(null)}
          onApply={(quota) => handleQuotaChange(quotaTarget, quota)}
        />
      )}
      {confirmRequest && (
        <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
      )}
    </div>
  );
}
