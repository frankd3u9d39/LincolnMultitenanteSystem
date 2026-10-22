'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/services/api';
import { SchoolTenant, TenantStatus } from '../types';
import {
  changeTenantQuota,
  listTenants,
  logSupportAccess,
  provisionTenant,
  reinstateTenant,
  suspendTenant,
  updateTenantCbt,
} from '../services/api';
import { useAsync, useNotice } from '../hooks';
import { TENANT_STATUS_STYLES, downloadCsv, storageUsagePercent } from '../utils';
import { NoticeBanner } from './NoticeBanner';
import { ErrorBlock, LoadingBlock } from './LoadState';
import { ConfirmDialog, ConfirmRequest } from './ConfirmDialog';
import { OnboardDraft, OnboardSchoolModal, ProvisionErrors } from './OnboardSchoolModal';
import { StorageQuotaModal, SupportAccessModal } from './TenantDialogs';

type SortKey = 'name' | 'students' | 'storageUsedGb';

const failureMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

/** Maps the API's field names onto the onboarding form's fields. */
const PROVISION_FIELDS: Record<string, keyof ProvisionErrors> = {
  name: 'name',
  code: 'code',
  domain: 'domain',
  city: 'city',
  principal_admin: 'principalAdmin',
  principal_email: 'principalEmail',
  password: 'password',
  storage_quota_gb: 'form',
};

export function SchoolsRegistryView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('students');
  const [sortDesc, setSortDesc] = useState(true);

  const { data, loading, error, reload, setData } = useAsync((signal) => listTenants(signal), []);
  const tenants = useMemo(() => data ?? [], [data]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [onboardOpenedHere, setOnboardOpenedHere] = useState(false);
  const [quotaTarget, setQuotaTarget] = useState<SchoolTenant | null>(null);
  const [supportTarget, setSupportTarget] = useState<SchoolTenant | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const { notice, notify, dismiss } = useNotice();

  // Deep links from the dashboard (?tenant=CODE) open that tenant's inspector.
  const deepLinkCode = searchParams.get('tenant');
  const selected =
    tenants.find((tenant) => tenant.id === selectedId) ??
    (deepLinkCode ? tenants.find((tenant) => tenant.code === deepLinkCode) ?? null : null);

  const closeInspector = () => {
    setSelectedId(null);
    if (deepLinkCode) router.replace('/superadmin/schools');
  };

  // Derived rather than seeded into state: the page is statically prerendered with no
  // search params, so a lazy useState initializer would never see the deep link.
  const onboardOpen = onboardOpenedHere || searchParams.get('onboard') === '1';

  const clearOnboardParam = () => {
    setOnboardOpenedHere(false);
    if (searchParams.get('onboard')) router.replace('/superadmin/schools');
  };

  const replaceTenant = (updated: SchoolTenant) =>
    setData((previous) => (previous ?? []).map((item) => (item.id === updated.id ? updated : item)));

  const handleToggleCbt = async (tenant: SchoolTenant) => {
    try {
      const nextState = !tenant.cbtEnabled;
      const { tenant: updated, message } = await updateTenantCbt(tenant.id, nextState);
      replaceTenant(updated);
      notify(message);
    } catch (err) {
      notify(failureMessage(err));
    }
  };

  const handleProvision = async (draft: OnboardDraft): Promise<ProvisionErrors | void> => {
    try {
      const { tenant, message } = await provisionTenant({
        name: draft.name,
        code: draft.code,
        domain: draft.domain,
        city: draft.city,
        principalAdmin: draft.principalAdmin,
        principalEmail: draft.principalEmail,
        password: draft.password,
        storageQuotaGb: draft.storageQuotaGb,
        activateImmediately: draft.activateImmediately,
        cbtEnabled: draft.cbtEnabled,
        logoFile: draft.logoFile,
        logoUrl: draft.logoUrl,
        primaryColor: draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        accentColor: draft.accentColor,
        themePalette: draft.themePalette,
      });

      setData((previous) => [tenant, ...(previous ?? [])]);
      setStatusFilter('all');
      setQuery('');
      clearOnboardParam();
      setSelectedId(tenant.id);
      notify(message + (draft.activateImmediately ? ' The school is live now.' : ' It stays pending until the domain is verified.'));
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 422) {
        const mapped: ProvisionErrors = {};
        Object.entries(failure.errors).forEach(([field, messages]) => {
          mapped[PROVISION_FIELDS[field] ?? 'form'] = messages[0];
        });
        return mapped;
      }
      return { form: failureMessage(failure) };
    }
  };

  const handleQuotaChange = async (tenant: SchoolTenant, storageQuotaGb: number): Promise<string | void> => {
    try {
      const result = await changeTenantQuota(tenant.id, storageQuotaGb);
      replaceTenant(result.tenant);
      notify(result.message);
    } catch (failure) {
      return failureMessage(failure);
    }
  };

  const handleToggleSuspension = async (tenant: SchoolTenant) => {
    const reinstating = tenant.status === 'suspended';

    try {
      const result = reinstating ? await reinstateTenant(tenant.id) : await suspendTenant(tenant.id, 'Suspended from the tenant registry');
      replaceTenant(result.tenant);
      notify(result.message, reinstating ? 'success' : 'warning');
    } catch (failure) {
      notify(failureMessage(failure), 'error');
    }
  };

  const handleSupportAccess = async (tenant: SchoolTenant, reason: string): Promise<string | void> => {
    try {
      notify(await logSupportAccess(tenant.id, reason), 'info');
    } catch (failure) {
      return failureMessage(failure);
    }
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

  if (loading) {
    return <LoadingBlock rows={6} label="Loading tenants" />;
  }

  if (error) {
    return <ErrorBlock message={error} onRetry={reload} />;
  }

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
                      <div className="mt-1">
                        {tenant.cbtEnabled ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            CBT Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200">
                            Paper-Only
                          </span>
                        )}
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
                  ['Examination Mode', selected.cbtEnabled ? 'CBT (Computer-Based) & Paper' : 'Paper-Based Only'],
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
                onClick={() => handleToggleCbt(selected)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors shadow-sm ${
                  selected.cbtEnabled
                    ? 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold'
                }`}
              >
                {selected.cbtEnabled ? 'Disable CBT Mode' : 'Enable CBT Mode'}
              </button>
              <button
                type="button"
                onClick={() => setSupportTarget(selected)}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-white/60 transition-colors shadow-sm"
              >
                Log Support Access
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

      {supportTarget && (
        <SupportAccessModal
          tenant={supportTarget}
          onClose={() => setSupportTarget(null)}
          onSubmit={(reason) => handleSupportAccess(supportTarget, reason)}
        />
      )}
      {confirmRequest && (
        <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
      )}
    </div>
  );
}
