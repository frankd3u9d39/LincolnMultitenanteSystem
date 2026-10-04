'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminAccountStatus, SchoolAdministrator } from '../types';
import { ADMINISTRATORS, DIRECTORY_SNAPSHOT_DATE } from '../services';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_STYLES,
  ADMIN_STATUS_STYLES,
  adminInitials,
} from '../utils';
import { InviteAdministratorModal, InviteDraft } from './InviteAdministratorModal';
import { ConfirmDialog, ConfirmRequest } from './ConfirmDialog';
import { PermissionsModal } from './PermissionsModal';
import { NoticeBanner } from './NoticeBanner';
import { useNotice } from '../hooks';
import { downloadCsv } from '../utils';

export function AdministratorsView() {
  const [statusFilter, setStatusFilter] = useState<'all' | AdminAccountStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | SchoolAdministrator['role']>('all');
  const [mfaOnly, setMfaOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [admins, setAdmins] = useState<SchoolAdministrator[]>(ADMINISTRATORS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<SchoolAdministrator | null>(null);
  const { notice, notify, dismiss } = useNotice();

  const enforceMfa = () => {
    setAdmins((prev) =>
      prev.map((admin) => (selectedIds.includes(admin.id) ? { ...admin, mfaEnabled: true } : admin))
    );
    const count = selectedIds.length;
    setSelectedIds([]);
    notify(`MFA enrolment enforced on ${count} account${count === 1 ? '' : 's'}. They must register an authenticator at next sign-in.`);
  };

  const sendResetLinks = () => {
    const count = selectedIds.length;
    setSelectedIds([]);
    notify(`Password reset links sent to ${count} administrator${count === 1 ? '' : 's'}. Each link expires in 60 minutes.`, 'info');
  };

  const toggleAccountStatus = (admin: SchoolAdministrator) => {
    const unlocking = admin.status === 'locked';
    setAdmins((prev) =>
      prev.map((item) =>
        item.id === admin.id ? { ...item, status: unlocking ? 'active' : 'disabled' } : item
      )
    );
    notify(
      unlocking
        ? `${admin.fullName} unlocked and able to sign in again.`
        : `${admin.fullName} suspended. Their administrator access is revoked.`,
      unlocking ? 'success' : 'warning'
    );
  };

  const handleInvite = (draft: InviteDraft) => {
    const tenant = admins.find((admin) => admin.schoolCode === draft.schoolCode);

    setAdmins((prev) => [
      {
        id: Math.max(0, ...prev.map((admin) => admin.id)) + 1,
        fullName: draft.fullName,
        email: draft.email,
        phone: draft.phone,
        schoolName: tenant?.schoolName ?? draft.schoolCode,
        schoolCode: draft.schoolCode,
        role: draft.role,
        status: 'invited',
        mfaEnabled: false,
        lastLogin: 'Never',
        lastLoginIp: '—',
        createdOn: DIRECTORY_SNAPSHOT_DATE,
      },
      ...prev,
    ]);

    setInviteOpen(false);
    setStatusFilter('all');
    setRoleFilter(draft.role);
    notify(
      `Invitation sent to ${draft.email}. The account stays in an invited state until first sign-in${
        draft.requireMfa ? ', and MFA enrolment is required at that point' : ''
      }.`
    );
  };

  const stats = useMemo(
    () => ({
      total: admins.length,
      active: admins.filter((a) => a.status === 'active').length,
      mfaGap: admins.filter((a) => !a.mfaEnabled).length,
      attention: admins.filter((a) => a.status === 'locked' || a.status === 'disabled').length,
      pendingInvites: admins.filter((a) => a.status === 'invited').length,
    }),
    [admins]
  );

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return admins.filter((admin) => {
      const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
      const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
      const matchesMfa = !mfaOnly || !admin.mfaEnabled;
      const matchesQuery =
        term === '' ||
        admin.fullName.toLowerCase().includes(term) ||
        admin.email.toLowerCase().includes(term) ||
        admin.schoolName.toLowerCase().includes(term) ||
        admin.schoolCode.toLowerCase().includes(term);
      return matchesStatus && matchesRole && matchesMfa && matchesQuery;
    });
  }, [admins, query, statusFilter, roleFilter, mfaOnly]);

  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  const toggleRow = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));

  const toggleAllVisible = () =>
    setSelectedIds((prev) => {
      const visibleIds = rows.map((row) => row.id);
      return allVisibleSelected ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]));
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">School Administrators</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Privileged tenant accounts, their access posture, and multi-factor enrolment across every campus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const fileName = downloadCsv(
                'school_administrators',
                ['Full Name', 'Email', 'Phone', 'School', 'Tenant Code', 'Role', 'Status', 'MFA', 'Last Login', 'Last IP', 'Created'],
                rows.map((admin) => [
                  admin.fullName,
                  admin.email,
                  admin.phone,
                  admin.schoolName,
                  admin.schoolCode,
                  ADMIN_ROLE_LABELS[admin.role],
                  admin.status,
                  admin.mfaEnabled ? 'Enabled' : 'Disabled',
                  admin.lastLogin,
                  admin.lastLoginIp,
                  admin.createdOn,
                ])
              );
              notify(`Exported ${rows.length} administrator${rows.length === 1 ? '' : 's'} to ${fileName}.`);
            }}
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Export CSV
          </button>
          <Link
            href="/administrators/access-report"
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Access Report
          </Link>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Invite Administrator</span>
          </button>
        </div>
      </div>

      <NoticeBanner notice={notice} onDismiss={dismiss} />

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Administrator Accounts', value: stats.total.toString(), hint: `${stats.active} active sessions permitted`, accent: 'text-[#B81D22]' },
          { label: 'Pending Invitations', value: stats.pendingInvites.toString(), hint: 'Awaiting first sign-in', accent: 'text-blue-700' },
          { label: 'Without MFA', value: stats.mfaGap.toString(), hint: 'Policy requires enrolment', accent: 'text-amber-700' },
          { label: 'Needs Attention', value: stats.attention.toString(), hint: 'Locked or disabled accounts', accent: 'text-red-700' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500">{card.label}</span>
            <div className={`mt-1.5 text-2xl font-black tracking-tight ${card.accent}`}>{card.value}</div>
            <div className="mt-2 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">{card.hint}</div>
          </div>
        ))}
      </div>

      {/* Toolbar + table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl max-w-full overflow-x-auto">
              {(['all', 'active', 'invited', 'locked', 'disabled'] as const).map((status) => (
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

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
            >
              <option value="all">All roles</option>
              {(Object.keys(ADMIN_ROLE_LABELS) as SchoolAdministrator['role'][]).map((role) => (
                <option key={role} value={role}>
                  {ADMIN_ROLE_LABELS[role]}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-[11px] font-semibold text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={mfaOnly}
                onChange={(e) => setMfaOnly(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#B81D22]"
              />
              <span>MFA gap only</span>
            </label>
          </div>

          <span className="text-[11px] text-zinc-500 shrink-0">
            Showing <span className="font-bold text-zinc-800">{rows.length}</span> of {admins.length} accounts
          </span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search administrator name, email, school name, or tenant code..."
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
        />

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-[#B81D22]/30 bg-red-50/60 px-3.5 py-2.5">
            <span className="text-[11px] font-bold text-[#B81D22]">
              {selectedIds.length} account{selectedIds.length === 1 ? '' : 's'} selected
            </span>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() =>
                  setConfirmRequest({
                    eyebrow: 'Bulk Action',
                    title: 'Enforce MFA enrolment?',
                    confirmLabel: 'Enforce MFA',
                    body: (
                      <>
                        {selectedIds.length} selected account
                        {selectedIds.length === 1 ? '' : 's'} will be required to register an authenticator
                        before reaching the dashboard again.
                      </>
                    ),
                    onConfirm: enforceMfa,
                  })
                }
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Enforce MFA
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirmRequest({
                    eyebrow: 'Bulk Action',
                    title: 'Send password reset links?',
                    confirmLabel: 'Send Links',
                    body: (
                      <>
                        A single-use reset link is emailed to {selectedIds.length} administrator
                        {selectedIds.length === 1 ? '' : 's'}. Existing passwords keep working until a link is
                        used.
                      </>
                    ),
                    onConfirm: sendResetLinks,
                  })
                }
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-9">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all visible administrators"
                    className="w-3.5 h-3.5 accent-[#B81D22]"
                  />
                </th>
                <th className="py-2.5 px-3">Administrator</th>
                <th className="py-2.5 px-3">Tenant Boundary</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 text-center">MFA</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {rows.map((admin) => (
                <tr key={admin.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(admin.id)}
                      onChange={() => toggleRow(admin.id)}
                      aria-label={`Select ${admin.fullName}`}
                      className="w-3.5 h-3.5 accent-[#B81D22]"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#B81D22]/10 text-[#B81D22] font-bold text-[11px] shrink-0">
                        {adminInitials(admin.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 truncate max-w-[170px]">{admin.fullName}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[170px]">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="truncate max-w-[190px] text-zinc-800">{admin.schoolName}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{admin.schoolCode}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${ADMIN_ROLE_STYLES[admin.role]}`}>
                      {ADMIN_ROLE_LABELS[admin.role]}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {admin.mfaEnabled ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase">
                        On
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase">
                        Off
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono text-[11px] text-zinc-700">{admin.lastLogin}</div>
                    <div className="font-mono text-[11px] text-zinc-400">{admin.lastLoginIp}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${ADMIN_STATUS_STYLES[admin.status]}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setPermissionsTarget(admin)}
                      className="text-[11px] font-semibold text-[#B81D22] hover:underline"
                    >
                      Permissions
                    </button>
                    <span className="text-zinc-300 mx-1.5">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmRequest({
                          eyebrow: 'Account Status',
                          title: admin.status === 'locked' ? 'Unlock this account?' : 'Suspend this account?',
                          confirmLabel: admin.status === 'locked' ? 'Unlock Account' : 'Suspend Account',
                          tone: admin.status === 'locked' ? 'default' : 'danger',
                          body:
                            admin.status === 'locked' ? (
                              <>
                                <strong>{admin.fullName}</strong> can sign in again immediately. The failed-attempt
                                counter is reset.
                              </>
                            ) : (
                              <>
                                <strong>{admin.fullName}</strong> loses administrator access to{' '}
                                {admin.schoolName} at once. The account is retained and can be restored later.
                              </>
                            ),
                          onConfirm: () => toggleAccountStatus(admin),
                        })
                      }
                      className="text-[11px] font-semibold text-zinc-600 hover:underline"
                    >
                      {admin.status === 'locked' ? 'Unlock' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-zinc-400 text-xs">
                    No administrator accounts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen && (
        <InviteAdministratorModal
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
          existingEmails={admins.map((admin) => admin.email.toLowerCase())}
        />
      )}

      {permissionsTarget && (
        <PermissionsModal
          admin={permissionsTarget}
          onClose={() => setPermissionsTarget(null)}
          onSave={(summary) => notify(summary)}
        />
      )}

      {confirmRequest && (
        <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
      )}
    </div>
  );
}
