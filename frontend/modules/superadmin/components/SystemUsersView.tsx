'use client';

import React, { useMemo, useState } from 'react';
import { SystemUser, SystemUserRole, SystemUserStatus } from '../types';
import { useNotice } from '../hooks';
import { downloadCsv } from '../utils';
import { NoticeBanner } from './NoticeBanner';
import { ConfirmDialog, ConfirmRequest } from './ConfirmDialog';
import { ModalPrimaryButton, ModalShell } from './ModalShell';

const USERS: SystemUser[] = [
  { id: 1, fullName: 'Alexander Cross', email: 'admin@lincolnplatform.io', role: 'superadmin', schoolName: 'Platform Operations', schoolCode: 'PLATFORM', status: 'active', mfaEnabled: true, lastSeen: '2 minutes ago', joinedOn: '2022-07-01' },
  { id: 2, fullName: 'Miriam Dauda', email: 'm.dauda@lincolnplatform.io', role: 'superadmin', schoolName: 'Platform Operations', schoolCode: 'PLATFORM', status: 'active', mfaEnabled: true, lastSeen: '1 hour ago', joinedOn: '2023-02-14' },
  { id: 3, fullName: 'Dr. Sarah Jenkins', email: 's.jenkins@lincoln.edu', role: 'admin', schoolName: 'Lincoln College of Science Management & Technology', schoolCode: 'LC-SMTS-001', status: 'active', mfaEnabled: true, lastSeen: '18 minutes ago', joinedOn: '2023-01-14' },
  { id: 4, fullName: 'Prof. Marcus Vance', email: 'm.vance@lincoln.edu', role: 'teacher', schoolName: 'Lincoln College of Science Management & Technology', schoolCode: 'LC-SMTS-001', status: 'active', mfaEnabled: true, lastSeen: '6 minutes ago', joinedOn: '2023-01-20' },
  { id: 5, fullName: 'Liam Chen', email: 'l.chen24@lincoln.edu', role: 'student', schoolName: 'Lincoln College of Science Management & Technology', schoolCode: 'LC-SMTS-001', status: 'active', mfaEnabled: false, lastSeen: '31 minutes ago', joinedOn: '2024-09-02' },
  { id: 6, fullName: 'Aisha Mohammed', email: 'a.mohammed25@lincoln.edu', role: 'student', schoolName: 'Lincoln College of Science Management & Technology', schoolCode: 'LC-SMTS-001', status: 'active', mfaEnabled: false, lastSeen: '4 hours ago', joinedOn: '2025-09-04' },
  { id: 7, fullName: 'Dr. Julian Thorne', email: 'j.thorne@st-augustine.ac.uk', role: 'admin', schoolName: 'St. Augustine Science & Arts Academy', schoolCode: 'SA-SMTS-002', status: 'active', mfaEnabled: true, lastSeen: '2 hours ago', joinedOn: '2023-04-02' },
  { id: 8, fullName: 'Rebecca Olanrewaju', email: 'r.olanrewaju@st-augustine.ac.uk', role: 'teacher', schoolName: 'St. Augustine Science & Arts Academy', schoolCode: 'SA-SMTS-002', status: 'active', mfaEnabled: false, lastSeen: '45 minutes ago', joinedOn: '2023-04-18' },
  { id: 9, fullName: 'Daniel Ekong', email: 'd.ekong26@st-augustine.ac.uk', role: 'student', schoolName: 'St. Augustine Science & Arts Academy', schoolCode: 'SA-SMTS-002', status: 'inactive', mfaEnabled: false, lastSeen: '3 months ago', joinedOn: '2024-09-03' },
  { id: 10, fullName: 'Dr. Fiona Gallagher', email: 'f.gallagher@horizon-stem.org', role: 'admin', schoolName: 'Horizon STEM Institute', schoolCode: 'HZ-SMTS-003', status: 'active', mfaEnabled: true, lastSeen: '1 hour ago', joinedOn: '2023-06-19' },
  { id: 11, fullName: 'Kelechi Anyanwu', email: 'k.anyanwu@horizon-stem.org', role: 'teacher', schoolName: 'Horizon STEM Institute', schoolCode: 'HZ-SMTS-003', status: 'active', mfaEnabled: true, lastSeen: '12 minutes ago', joinedOn: '2023-07-01' },
  { id: 12, fullName: 'Sophia Bassey', email: 's.bassey27@horizon-stem.org', role: 'student', schoolName: 'Horizon STEM Institute', schoolCode: 'HZ-SMTS-003', status: 'active', mfaEnabled: false, lastSeen: '9 minutes ago', joinedOn: '2026-09-07' },
  { id: 13, fullName: 'Robert Stirling', email: 'r.stirling@kingswaypoly.ac.uk', role: 'admin', schoolName: 'Kingsway Polytechnic', schoolCode: 'KP-SMTS-004', status: 'active', mfaEnabled: false, lastSeen: '22 hours ago', joinedOn: '2023-08-07' },
  { id: 14, fullName: 'Hauwa Garba', email: 'h.garba@kingswaypoly.ac.uk', role: 'teacher', schoolName: 'Kingsway Polytechnic', schoolCode: 'KP-SMTS-004', status: 'active', mfaEnabled: false, lastSeen: '3 hours ago', joinedOn: '2023-09-11' },
  { id: 15, fullName: 'Dr. Victoria Alcott', email: 'v.alcott@cambridge-intl.org', role: 'admin', schoolName: 'Cambridge International College', schoolCode: 'CIC-SMTS-005', status: 'active', mfaEnabled: true, lastSeen: '38 minutes ago', joinedOn: '2022-11-23' },
  { id: 16, fullName: 'Nathaniel Abiodun', email: 'n.abiodun@cambridge-intl.org', role: 'teacher', schoolName: 'Cambridge International College', schoolCode: 'CIC-SMTS-005', status: 'active', mfaEnabled: true, lastSeen: '2 hours ago', joinedOn: '2023-01-16' },
  { id: 17, fullName: 'Zainab Yakubu', email: 'z.yakubu28@cambridge-intl.org', role: 'student', schoolName: 'Cambridge International College', schoolCode: 'CIC-SMTS-005', status: 'locked', mfaEnabled: false, lastSeen: '6 days ago', joinedOn: '2025-09-08' },
  { id: 18, fullName: 'Prof. David Mercer', email: 'd.mercer@apexscience.edu', role: 'admin', schoolName: 'Apex Advanced Science Academy', schoolCode: 'AASA-SMTS-006', status: 'active', mfaEnabled: true, lastSeen: '5 hours ago', joinedOn: '2024-01-30' },
  { id: 19, fullName: 'Chioma Nnaji', email: 'c.nnaji@apexscience.edu', role: 'teacher', schoolName: 'Apex Advanced Science Academy', schoolCode: 'AASA-SMTS-006', status: 'active', mfaEnabled: false, lastSeen: '1 day ago', joinedOn: '2024-02-12' },
  { id: 20, fullName: 'Eleanor Vance', email: 'e.vance@oakridge.sch.uk', role: 'admin', schoolName: 'Oakridge Technical High', schoolCode: 'OTH-SMTS-007', status: 'active', mfaEnabled: false, lastSeen: '3 days ago', joinedOn: '2024-03-11' },
  { id: 21, fullName: 'Peter Agbo', email: 'p.agbo@oakridge.sch.uk', role: 'teacher', schoolName: 'Oakridge Technical High', schoolCode: 'OTH-SMTS-007', status: 'inactive', mfaEnabled: false, lastSeen: '5 weeks ago', joinedOn: '2024-04-02' },
  { id: 22, fullName: 'Grace Adeyemi', email: 'g.adeyemi@meridiangrammar.edu', role: 'admin', schoolName: 'Meridian Grammar School', schoolCode: 'MGS-SMTS-008', status: 'active', mfaEnabled: true, lastSeen: '8 hours ago', joinedOn: '2024-05-06' },
  { id: 23, fullName: 'Dr. Ibrahim Danladi', email: 'i.danladi@northgate-tech.ac.ng', role: 'admin', schoolName: 'Northgate Institute of Technology', schoolCode: 'NIT-SMTS-009', status: 'active', mfaEnabled: true, lastSeen: '26 minutes ago', joinedOn: '2023-09-18' },
  { id: 24, fullName: 'Funmilayo Ojo', email: 'f.ojo@northgate-tech.ac.ng', role: 'teacher', schoolName: 'Northgate Institute of Technology', schoolCode: 'NIT-SMTS-009', status: 'active', mfaEnabled: true, lastSeen: '52 minutes ago', joinedOn: '2023-10-02' },
  { id: 25, fullName: 'Ifeanyi Obi', email: 'i.obi29@northgate-tech.ac.ng', role: 'student', schoolName: 'Northgate Institute of Technology', schoolCode: 'NIT-SMTS-009', status: 'active', mfaEnabled: false, lastSeen: '14 minutes ago', joinedOn: '2026-09-07' },
  { id: 26, fullName: 'Mrs. Helen Obi', email: 'h.obi@silverbrook.sch.ng', role: 'admin', schoolName: 'Silverbrook Girls College', schoolCode: 'SGC-SMTS-010', status: 'active', mfaEnabled: false, lastSeen: '2 days ago', joinedOn: '2024-07-22' },
  { id: 27, fullName: 'Dr. Emeka Nwosu', email: 'e.nwosu@royalcrest.edu.ng', role: 'admin', schoolName: 'Royal Crest Academy', schoolCode: 'RCA-SMTS-011', status: 'active', mfaEnabled: true, lastSeen: '1 hour ago', joinedOn: '2023-11-04' },
  { id: 28, fullName: 'Adaeze Chukwu', email: 'a.chukwu@royalcrest.edu.ng', role: 'teacher', schoolName: 'Royal Crest Academy', schoolCode: 'RCA-SMTS-011', status: 'active', mfaEnabled: false, lastSeen: '4 hours ago', joinedOn: '2024-01-08' },
  { id: 29, fullName: 'Samuel Okafor', email: 's.okafor@brookfield.sch.ng', role: 'admin', schoolName: 'Brookfield Science Secondary', schoolCode: 'BSS-SMTS-012', status: 'locked', mfaEnabled: false, lastSeen: '7 days ago', joinedOn: '2024-09-09' },
  { id: 30, fullName: 'Dr. Amaka Eze', email: 'a.eze@whitestone-intl.org', role: 'admin', schoolName: 'Whitestone International School', schoolCode: 'WIS-SMTS-013', status: 'active', mfaEnabled: true, lastSeen: '11 minutes ago', joinedOn: '2022-08-15' },
  { id: 31, fullName: 'Benedict Uche', email: 'b.uche@whitestone-intl.org', role: 'teacher', schoolName: 'Whitestone International School', schoolCode: 'WIS-SMTS-013', status: 'active', mfaEnabled: true, lastSeen: '2 hours ago', joinedOn: '2022-09-05' },
  { id: 32, fullName: 'Maryam Suleiman', email: 'm.suleiman30@whitestone-intl.org', role: 'student', schoolName: 'Whitestone International School', schoolCode: 'WIS-SMTS-013', status: 'active', mfaEnabled: false, lastSeen: '20 minutes ago', joinedOn: '2025-09-01' },
  { id: 33, fullName: 'Blessing Adeyinka', email: 'b.adeyinka@hilltopcc.ac.ng', role: 'admin', schoolName: 'Hilltop Community College', schoolCode: 'HCC-SMTS-014', status: 'active', mfaEnabled: true, lastSeen: '4 hours ago', joinedOn: '2024-02-26' },
  { id: 34, fullName: 'Tunde Bakare', email: 't.bakare@greenvaleprep.sch.ng', role: 'admin', schoolName: 'Greenvale Preparatory', schoolCode: 'GVP-SMTS-015', status: 'active', mfaEnabled: false, lastSeen: '3 days ago', joinedOn: '2025-01-13' },
  { id: 35, fullName: 'Prof. Chidi Okonkwo', email: 'c.okonkwo@pinnaclemed.ac.ng', role: 'admin', schoolName: 'Pinnacle Medical Sciences College', schoolCode: 'PMS-SMTS-016', status: 'active', mfaEnabled: true, lastSeen: '17 minutes ago', joinedOn: '2023-03-08' },
  { id: 36, fullName: 'Oluwaseun Fatai', email: 'o.fatai@pinnaclemed.ac.ng', role: 'teacher', schoolName: 'Pinnacle Medical Sciences College', schoolCode: 'PMS-SMTS-016', status: 'active', mfaEnabled: true, lastSeen: '1 hour ago', joinedOn: '2023-04-10' },
  { id: 37, fullName: 'Dr. Yusuf Bello', email: 'y.bello@eastbourne-tech.ac.ng', role: 'admin', schoolName: 'Eastbourne Technical Institute', schoolCode: 'ETI-SMTS-017', status: 'active', mfaEnabled: true, lastSeen: '1 hour ago', joinedOn: '2023-12-01' },
  { id: 38, fullName: 'Ngozi Udeh', email: 'n.udeh@clearwateragric.ac.ng', role: 'admin', schoolName: 'Clearwater Agricultural College', schoolCode: 'CAC-SMTS-018', status: 'active', mfaEnabled: false, lastSeen: '14 hours ago', joinedOn: '2024-11-17' },
  { id: 39, fullName: 'Capt. Thomas Hayes', email: 't.hayes@crestview.ac.uk', role: 'admin', schoolName: 'Crestview Maritime Academy', schoolCode: 'CMA-SMTS-019', status: 'active', mfaEnabled: false, lastSeen: '26 minutes ago', joinedOn: '2026-09-21' },
  { id: 40, fullName: 'Arthur Pendelton', email: 'a.pendelton@vanguardsciences.edu', role: 'admin', schoolName: 'Vanguard Institute of Sciences', schoolCode: 'VIS-SMTS-020', status: 'inactive', mfaEnabled: false, lastSeen: '21 days ago', joinedOn: '2023-07-05' },
  { id: 41, fullName: 'Victor Emenike', email: 'v.emenike@vanguardsciences.edu', role: 'teacher', schoolName: 'Vanguard Institute of Sciences', schoolCode: 'VIS-SMTS-020', status: 'inactive', mfaEnabled: false, lastSeen: '21 days ago', joinedOn: '2023-08-14' },
  { id: 42, fullName: 'Esther Lawal', email: 'e.lawal31@vanguardsciences.edu', role: 'student', schoolName: 'Vanguard Institute of Sciences', schoolCode: 'VIS-SMTS-020', status: 'inactive', mfaEnabled: false, lastSeen: '21 days ago', joinedOn: '2024-09-02' },
];

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

export function SystemUsersView() {
  const [roleFilter, setRoleFilter] = useState<'all' | SystemUserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SystemUserStatus>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<SystemUser[]>(USERS);
  const [detail, setDetail] = useState<SystemUser | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const { notice, notify, dismiss } = useNotice();

  const revokeSessions = (user: SystemUser) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id ? { ...item, lastSeen: 'Session revoked just now' } : item
      )
    );
    notify(`Active sessions revoked for ${user.fullName}. They must sign in again.`, 'warning');
  };

  const revokeAllSessions = () => {
    setUsers((prev) => prev.map((item) => ({ ...item, lastSeen: 'Session revoked just now' })));
    notify(
      `Every session across all ${users.length} accounts has been revoked. Users must sign in again.`,
      'warning'
    );
  };

  const tenants = useMemo(() => {
    const seen = new Map<string, string>();
    users.forEach((user) => seen.set(user.schoolCode, user.schoolName));
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [users]);

  const roleCounts = useMemo(() => {
    const counts: Record<SystemUserRole, number> = { superadmin: 0, admin: 0, teacher: 0, student: 0 };
    users.forEach((user) => {
      counts[user.role] += 1;
    });
    return counts;
  }, [users]);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesTenant = tenantFilter === 'all' || user.schoolCode === tenantFilter;
      const matchesQuery =
        term === '' ||
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.schoolName.toLowerCase().includes(term) ||
        user.schoolCode.toLowerCase().includes(term);
      return matchesRole && matchesStatus && matchesTenant && matchesQuery;
    });
  }, [users, query, roleFilter, statusFilter, tenantFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

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
            onClick={() => {
              const fileName = downloadCsv(
                'system_users',
                ['Full Name', 'Email', 'Role', 'School', 'Tenant Code', 'Status', 'MFA', 'Last Seen', 'Joined'],
                rows.map((user) => [
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
              notify(`Exported ${rows.length} account${rows.length === 1 ? '' : 's'} to ${fileName}.`);
            }}
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
                    All {users.length} accounts across every tenant will be signed out immediately, including
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
              {tenants.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] text-zinc-500 shrink-0">
            Showing <span className="font-bold text-zinc-800">{visible.length}</span> of {rows.length} matched accounts
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
