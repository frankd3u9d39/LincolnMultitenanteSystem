'use client';

import React, { useEffect, useState } from 'react';
import { ApiError } from '@/services/api';
import { SystemUser, SystemUserRole, SystemUserStatus } from '../types';
import { listAllUsers, listUsers, revokeAllSessions as revokeAllSessionsRequest, revokeUserSessions } from '../services/api';
import { useAsync, useNotice } from '../hooks';
import { downloadCsv } from '../utils';
import { ErrorBlock, LoadingBlock } from './LoadState';
import { NoticeBanner } from './NoticeBanner';
import { ConfirmDialog, ConfirmRequest } from './ConfirmDialog';
import { ModalPrimaryButton, ModalShell } from './ModalShell';

const ROLE_LABELS: Record<SystemUserRole, string> = {
  superadmin: 'SuperAdmin',
  admin: 'School Admin',
  teacher: 'Teacher',
  student: 'Student',
};

const ROLE_STYLES: Record<SystemUserRole, string> = {
  superadmin: 'bg-[#B81D22]/10 text-[#B81D22] border-[#B81D22]/25',
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  teacher: 'bg-blue-50 text-blue-700 border-blue-200',
  student: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const STATUS_STYLES: Record<SystemUserStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  locked: 'bg-red-50 text-red-700 border-red-200',
};

const PAGE_SIZE = 12;

const failureMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

export function SystemUsersView() {
  const [roleFilter, setRoleFilter] = useState<'all' | SystemUserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SystemUserStatus>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<SystemUser | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const { notice, notify, dismiss } = useNotice();

  // Search waits for a pause in typing so each keystroke is not a request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, loading, refreshing, error, reload } = useAsync(
    (signal) =>
      listUsers(
        { role: roleFilter, status: statusFilter, schoolCode: tenantFilter, search: debouncedQuery, page, perPage: PAGE_SIZE },
        signal
      ),
    [roleFilter, statusFilter, tenantFilter, debouncedQuery, page]
  );

  const visible = data?.items ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? 1;
  const pageCount = Math.max(1, data?.lastPage ?? 1);
  const tenants = data?.tenants ?? [];
  const roleCounts: Record<SystemUserRole, number> = data?.roleCounts ?? { superadmin: 0, admin: 0, teacher: 0, student: 0 };
  const accountTotal = Object.values(roleCounts).reduce((sum, value) => sum + value, 0);

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const revokeSessions = async (user: SystemUser) => {
    try {
      notify(await revokeUserSessions(user.id), 'warning');
      reload();
    } catch (failure) {
      notify(failureMessage(failure), 'error');
    }
  };

  const revokeAllSessions = async () => {
    try {
      notify(await revokeAllSessionsRequest(), 'warning');
      reload();
    } catch (failure) {
      notify(failureMessage(failure), 'error');
    }
  };

  /** Exports every account matching the filters, not just the page on screen. */
  const exportDirectory = async () => {
    try {
      const everyone = await listAllUsers({ role: roleFilter, status: statusFilter, schoolCode: tenantFilter, search: debouncedQuery });
      const fileName = downloadCsv(
        'system_users',
        ['Full Name', 'Email', 'Role', 'School', 'Tenant Code', 'Status', 'MFA', 'Last Seen', 'Joined'],
        everyone.map((user) => [
          user.fullName,
          user.email,
          ROLE_LABELS[user.role],
          user.schoolName,
          user.schoolCode,
          user.status,
          user.mfaEnabled ? 'Enabled' : 'Disabled',
          user.lastSeen,
          user.joinedOn,
        ])
      );
      notify(`Exported ${everyone.length} account${everyone.length === 1 ? '' : 's'} to ${fileName}.`);
    } catch (failure) {
      notify(failureMessage(failure), 'error');
    }
  };

  if (loading) {
    return <LoadingBlock rows={6} label="Loading users" />;
  }

  if (error && !data) {
    return <ErrorBlock message={error} onRetry={reload} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">All System Users</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Cross-tenant identity directory covering every account provisioned on the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportDirectory}
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Export Directory
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirmRequest({
                eyebrow: 'Platform Security',
                title: 'Revoke every active session?',
                confirmLabel: 'Revoke All Sessions',
                tone: 'danger',
                typeToConfirm: 'REVOKE',
                body: (
                  <>
                    All {accountTotal} accounts across every tenant will be signed out immediately, including
                    your own other devices. Anyone mid-task loses unsaved work and must sign in again.
                  </>
                ),
                onConfirm: revokeAllSessions,
              })
            }
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10"
          >
            Revoke All Sessions
          </button>
        </div>
      </div>

      <NoticeBanner notice={notice} onDismiss={dismiss} />

      {/* Role breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(ROLE_LABELS) as SystemUserRole[]).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => resetPage(setRoleFilter)(roleFilter === role ? 'all' : role)}
            className={`text-left rounded-2xl border bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md ${
              roleFilter === role ? 'border-[#B81D22] ring-2 ring-red-600/10' : 'border-zinc-200'
            }`}
          >
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500">
              {ROLE_LABELS[role]} Accounts
            </span>
            <div className="mt-1.5 text-2xl font-black tracking-tight text-zinc-900">{roleCounts[role]}</div>
            <div className="mt-2 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
              {roleFilter === role ? 'Filter applied — click to clear' : 'Click to filter directory'}
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar + table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl max-w-full overflow-x-auto">
              {(['all', 'active', 'inactive', 'locked'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => resetPage(setStatusFilter)(status)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                    statusFilter === status ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <select
              value={tenantFilter}
              onChange={(e) => resetPage(setTenantFilter)(e.target.value)}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-700 max-w-[260px] focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
            >
              <option value="all">All tenant boundaries</option>
              {tenants.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] text-zinc-500 shrink-0">
            Showing <span className="font-bold text-zinc-800">{visible.length}</span> of {total.toLocaleString()} matched accounts{refreshing ? ' …' : ''}
          </span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search any account by name, email, school, or tenant code..."
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
        />

        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Tenant Boundary</th>
                <th className="py-2.5 px-3 text-center">MFA</th>
                <th className="py-2.5 px-3">Last Seen</th>
                <th className="py-2.5 px-3">Joined</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {visible.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-zinc-900 truncate max-w-[170px]">{user.fullName}</div>
                    <div className="text-[11px] text-zinc-500 truncate max-w-[170px]">{user.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${ROLE_STYLES[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="truncate max-w-[190px] text-zinc-800">{user.schoolName}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{user.schoolCode}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase ${
                        user.mfaEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                      }`}
                    >
                      {user.mfaEnabled ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-600">{user.lastSeen}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-zinc-500">{user.joinedOn}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLES[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setDetail(user)}
                      className="text-[11px] font-semibold text-[#B81D22] hover:underline"
                    >
                      View
                    </button>
                    <span className="text-zinc-300 mx-1.5">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmRequest({
                          eyebrow: 'Account Security',
                          title: 'Revoke this account\u2019s sessions?',
                          confirmLabel: 'Revoke Sessions',
                          tone: 'danger',
                          body: (
                            <>
                              <strong>{user.fullName}</strong> is signed out of every device immediately and must
                              authenticate again. The account itself stays active.
                            </>
                          ),
                          onConfirm: () => revokeSessions(user),
                        })
                      }
                      className="text-[11px] font-semibold text-zinc-600 hover:underline"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-zinc-400 text-xs">
                    No accounts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-zinc-500">
            Page <span className="font-bold text-zinc-800">{currentPage}</span> of {pageCount}
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
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {detail && (
        <ModalShell
          eyebrow="Identity Record"
          title={detail.fullName}
          subtitle={detail.email}
          onClose={() => setDetail(null)}
          footer={<ModalPrimaryButton onClick={() => setDetail(null)}>Close</ModalPrimaryButton>}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${
                  ROLE_STYLES[detail.role]
                }`}
              >
                {ROLE_LABELS[detail.role]}
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${
                  STATUS_STYLES[detail.status]
                }`}
              >
                {detail.status}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100 text-xs">
              {[
                ['Tenant Boundary', detail.schoolName],
                ['Tenant Code', detail.schoolCode],
                ['Multi-Factor Auth', detail.mfaEnabled ? 'Enrolled' : 'Not enrolled'],
                ['Last Seen', detail.lastSeen],
                ['Joined On', detail.joinedOn],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <span className="text-zinc-500">{label}</span>
                  <span className="font-semibold text-zinc-900 text-right break-all">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
              <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">Scoped record</p>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                Academic records for this account stay inside its tenant boundary. Opening them requires a
                support session on that school.
              </p>
            </div>
          </div>
        </ModalShell>
      )}

      {confirmRequest && (
        <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
      )}
    </div>
  );
}
