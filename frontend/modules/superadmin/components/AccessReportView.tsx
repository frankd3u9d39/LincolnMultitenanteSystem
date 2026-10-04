'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ADMINISTRATORS, DIRECTORY_SNAPSHOT_DATE } from '../services';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_STATUS_STYLES,
  RISK_FLAG_LABELS,
  RISK_FLAG_STYLES,
  RiskFlag,
  accessPostureSummary,
  adminInitials,
  daysSinceLogin,
  riskFlagsFor,
  tenantPosture,
} from '../utils';

const FLAG_ORDER: RiskFlag[] = ['locked', 'disabled', 'no_mfa', 'never_signed_in', 'dormant'];

export function AccessReportView() {
  const [flagFilter, setFlagFilter] = useState<'all' | RiskFlag>('all');

  const summary = useMemo(() => accessPostureSummary(ADMINISTRATORS, DIRECTORY_SNAPSHOT_DATE), []);
  const tenants = useMemo(() => tenantPosture(ADMINISTRATORS, DIRECTORY_SNAPSHOT_DATE), []);

  const flagged = useMemo(
    () =>
      ADMINISTRATORS.map((admin) => ({ admin, flags: riskFlagsFor(admin, DIRECTORY_SNAPSHOT_DATE) }))
        .filter((entry) => entry.flags.length > 0)
        .sort((a, b) => b.flags.length - a.flags.length || a.admin.fullName.localeCompare(b.admin.fullName)),
    []
  );

  const visible = flagFilter === 'all' ? flagged : flagged.filter((entry) => entry.flags.includes(flagFilter));

  const flagCounts = useMemo(() => {
    const counts = {} as Record<RiskFlag, number>;
    FLAG_ORDER.forEach((flag) => {
      counts[flag] = flagged.filter((entry) => entry.flags.includes(flag)).length;
    });
    return counts;
  }, [flagged]);

  const coverageTone =
    summary.mfaCoverage >= 90 ? 'bg-emerald-500' : summary.mfaCoverage >= 70 ? 'bg-amber-500' : 'bg-[#B81D22]';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3 pb-2 border-b border-zinc-200">
        <Link
          href="/administrators"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-[#B81D22] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>Back to School Administrators</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Administrator Access Report
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Multi-factor coverage, dormant credentials, and lockouts across every tenant boundary &bull; snapshot{' '}
              <span className="font-mono">{DIRECTORY_SNAPSHOT_DATE}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5 shrink-0 self-start"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5z" />
            </svg>
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Headline posture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500">
            Multi-Factor Coverage
          </span>
          <div className="mt-1.5 text-3xl font-black text-zinc-900 tracking-tight">
            {summary.mfaCoverage.toFixed(1)}%
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className={`h-full rounded-full ${coverageTone}`} style={{ width: `${summary.mfaCoverage}%` }} />
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
            {summary.mfaEnabled} of {summary.total} administrator accounts enrolled
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Flagged Accounts', value: summary.flagged, accent: 'text-[#B81D22]' },
            { label: 'Locked Out', value: summary.locked, accent: 'text-red-700' },
            { label: 'Dormant', value: summary.dormant, accent: 'text-orange-700' },
            { label: 'Never Signed In', value: summary.neverSignedIn, accent: 'text-blue-700' },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500">{card.label}</span>
              <div className={`mt-1.5 text-2xl font-black tracking-tight ${card.accent}`}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-tenant posture */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Coverage by Tenant Boundary</h2>
          <p className="text-xs text-zinc-500">Weakest multi-factor coverage first — these tenants need attention.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">School</th>
                <th className="py-2.5 px-3 text-right">Admins</th>
                <th className="py-2.5 px-3 text-right">MFA On</th>
                <th className="py-2.5 px-3">Coverage</th>
                <th className="py-2.5 px-3 text-right">Flagged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {tenants.map((row) => (
                <tr key={row.schoolCode} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-zinc-900 truncate max-w-[260px]">{row.schoolName}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{row.schoolCode}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-zinc-900">{row.total}</td>
                  <td className="py-3 px-3 text-right text-zinc-600">{row.mfaEnabled}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.coverage >= 90 ? 'bg-emerald-500' : row.coverage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${row.coverage}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 shrink-0 w-10 text-right">
                        {row.coverage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {row.flagged === 0 ? (
                      <span className="text-[11px] text-emerald-600 font-semibold">Clear</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">
                        {row.flagged}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accounts requiring action */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Accounts Requiring Action</h2>
            <p className="text-xs text-zinc-500">Every administrator carrying at least one access posture flag.</p>
          </div>
          <span className="text-[11px] text-zinc-500 shrink-0">
            Showing <span className="font-bold text-zinc-800">{visible.length}</span> of {flagged.length} flagged
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setFlagFilter('all')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors ${
              flagFilter === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            All ({flagged.length})
          </button>
          {FLAG_ORDER.map((flag) => (
            <button
              key={flag}
              type="button"
              onClick={() => setFlagFilter(flag)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors ${
                flagFilter === flag ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {RISK_FLAG_LABELS[flag]} ({flagCounts[flag]})
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {visible.map(({ admin, flags }) => {
            const days = daysSinceLogin(admin.lastLogin, DIRECTORY_SNAPSHOT_DATE);
            return (
              <div
                key={admin.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3.5 hover:bg-zinc-50/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#B81D22]/10 text-[#B81D22] font-bold text-[11px] shrink-0">
                    {adminInitials(admin.fullName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 truncate">{admin.fullName}</div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {ADMIN_ROLE_LABELS[admin.role]} &bull; {admin.schoolName}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {days === null ? 'Never signed in' : `Last sign-in ${days} day${days === 1 ? '' : 's'} ago`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${ADMIN_STATUS_STYLES[admin.status]}`}
                  >
                    {admin.status}
                  </span>
                  {flags.map((flag) => (
                    <span
                      key={flag}
                      className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${RISK_FLAG_STYLES[flag]}`}
                    >
                      {RISK_FLAG_LABELS[flag]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {visible.length === 0 && (
            <div className="py-10 text-center text-zinc-400 text-xs">
              No accounts carry this flag.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
