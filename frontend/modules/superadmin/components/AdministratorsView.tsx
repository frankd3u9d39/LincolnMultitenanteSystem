'use client';

import React, { useMemo, useState } from 'react';
import { AdminAccountStatus, SchoolAdministrator } from '../types';

const ADMINISTRATORS: SchoolAdministrator[] = [
  { id: 1, fullName: 'Dr. Sarah Jenkins', email: 's.jenkins@lincoln.edu', phone: '+234 802 114 5520', schoolName: 'Lincoln College of Science Management & Technology', schoolCode: 'LC-SMTS-001', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 08:42', lastLoginIp: '197.210.54.12', createdOn: '2023-01-14' },
  { id: 2, fullName: 'Michael Adeyemi', email: 'm.adeyemi@lincoln.edu', phone: '+234 805 772 3318', schoolName: 'Lincoln College of Science Management & Technology', schoolCode: 'LC-SMTS-001', role: 'bursar', status: 'active', mfaEnabled: true, lastLogin: '2026-10-03 16:05', lastLoginIp: '197.210.54.44', createdOn: '2023-02-20' },
  { id: 3, fullName: 'Dr. Julian Thorne', email: 'j.thorne@st-augustine.ac.uk', phone: '+234 809 441 0092', schoolName: 'St. Augustine Science & Arts Academy', schoolCode: 'SA-SMTS-002', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 07:18', lastLoginIp: '102.89.33.17', createdOn: '2023-04-02' },
  { id: 4, fullName: 'Patience Okoro', email: 'p.okoro@st-augustine.ac.uk', phone: '+234 703 228 7741', schoolName: 'St. Augustine Science & Arts Academy', schoolCode: 'SA-SMTS-002', role: 'registrar', status: 'active', mfaEnabled: false, lastLogin: '2026-10-02 11:33', lastLoginIp: '102.89.33.52', createdOn: '2023-05-11' },
  { id: 5, fullName: 'Dr. Fiona Gallagher', email: 'f.gallagher@horizon-stem.org', phone: '+234 816 509 2284', schoolName: 'Horizon STEM Institute', schoolCode: 'HZ-SMTS-003', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 06:55', lastLoginIp: '105.112.18.90', createdOn: '2023-06-19' },
  { id: 6, fullName: 'Robert Stirling', email: 'r.stirling@kingswaypoly.ac.uk', phone: '+234 807 663 1150', schoolName: 'Kingsway Polytechnic', schoolCode: 'KP-SMTS-004', role: 'principal_admin', status: 'active', mfaEnabled: false, lastLogin: '2026-10-03 09:27', lastLoginIp: '197.253.44.8', createdOn: '2023-08-07' },
  { id: 7, fullName: 'Dr. Victoria Alcott', email: 'v.alcott@cambridge-intl.org', phone: '+234 802 990 4471', schoolName: 'Cambridge International College', schoolCode: 'CIC-SMTS-005', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 08:11', lastLoginIp: '160.152.77.21', createdOn: '2022-11-23' },
  { id: 8, fullName: 'Chinedu Obiora', email: 'c.obiora@cambridge-intl.org', phone: '+234 811 345 6612', schoolName: 'Cambridge International College', schoolCode: 'CIC-SMTS-005', role: 'deputy_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-03 19:40', lastLoginIp: '160.152.77.33', createdOn: '2023-01-09' },
  { id: 9, fullName: 'Prof. David Mercer', email: 'd.mercer@apexscience.edu', phone: '+234 806 220 7733', schoolName: 'Apex Advanced Science Academy', schoolCode: 'AASA-SMTS-006', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 05:02', lastLoginIp: '41.58.112.6', createdOn: '2024-01-30' },
  { id: 10, fullName: 'Eleanor Vance', email: 'e.vance@oakridge.sch.uk', phone: '+234 703 881 2290', schoolName: 'Oakridge Technical High', schoolCode: 'OTH-SMTS-007', role: 'principal_admin', status: 'active', mfaEnabled: false, lastLogin: '2026-10-01 14:12', lastLoginIp: '197.211.60.18', createdOn: '2024-03-11' },
  { id: 11, fullName: 'Grace Adeyemi', email: 'g.adeyemi@meridiangrammar.edu', phone: '+234 815 400 5519', schoolName: 'Meridian Grammar School', schoolCode: 'MGS-SMTS-008', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 00:46', lastLoginIp: '102.67.9.74', createdOn: '2024-05-06' },
  { id: 12, fullName: 'Dr. Ibrahim Danladi', email: 'i.danladi@northgate-tech.ac.ng', phone: '+234 808 117 3362', schoolName: 'Northgate Institute of Technology', schoolCode: 'NIT-SMTS-009', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 08:20', lastLoginIp: '197.210.22.41', createdOn: '2023-09-18' },
  { id: 13, fullName: 'Mrs. Helen Obi', email: 'h.obi@silverbrook.sch.ng', phone: '+234 810 554 8827', schoolName: 'Silverbrook Girls College', schoolCode: 'SGC-SMTS-010', role: 'principal_admin', status: 'active', mfaEnabled: false, lastLogin: '2026-10-02 10:04', lastLoginIp: '105.113.7.19', createdOn: '2024-07-22' },
  { id: 14, fullName: 'Dr. Emeka Nwosu', email: 'e.nwosu@royalcrest.edu.ng', phone: '+234 803 229 7714', schoolName: 'Royal Crest Academy', schoolCode: 'RCA-SMTS-011', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 07:48', lastLoginIp: '197.253.19.88', createdOn: '2023-11-04' },
  { id: 15, fullName: 'Samuel Okafor', email: 's.okafor@brookfield.sch.ng', phone: '+234 806 773 0051', schoolName: 'Brookfield Science Secondary', schoolCode: 'BSS-SMTS-012', role: 'principal_admin', status: 'locked', mfaEnabled: false, lastLogin: '2026-09-27 21:15', lastLoginIp: '185.220.101.45', createdOn: '2024-09-09' },
  { id: 16, fullName: 'Dr. Amaka Eze', email: 'a.eze@whitestone-intl.org', phone: '+234 802 661 3340', schoolName: 'Whitestone International School', schoolCode: 'WIS-SMTS-013', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 08:51', lastLoginIp: '160.152.44.12', createdOn: '2022-08-15' },
  { id: 17, fullName: 'Blessing Adeyinka', email: 'b.adeyinka@hilltopcc.ac.ng', phone: '+234 809 330 7726', schoolName: 'Hilltop Community College', schoolCode: 'HCC-SMTS-014', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 04:36', lastLoginIp: '197.210.88.5', createdOn: '2024-02-26' },
  { id: 18, fullName: 'Tunde Bakare', email: 't.bakare@greenvaleprep.sch.ng', phone: '+234 705 118 4492', schoolName: 'Greenvale Preparatory', schoolCode: 'GVP-SMTS-015', role: 'principal_admin', status: 'active', mfaEnabled: false, lastLogin: '2026-10-01 08:09', lastLoginIp: '102.89.10.60', createdOn: '2025-01-13' },
  { id: 19, fullName: 'Prof. Chidi Okonkwo', email: 'c.okonkwo@pinnaclemed.ac.ng', phone: '+234 814 220 9983', schoolName: 'Pinnacle Medical Sciences College', schoolCode: 'PMS-SMTS-016', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 08:33', lastLoginIp: '41.58.90.27', createdOn: '2023-03-08' },
  { id: 20, fullName: 'Dr. Yusuf Bello', email: 'y.bello@eastbourne-tech.ac.ng', phone: '+234 807 442 6610', schoolName: 'Eastbourne Technical Institute', schoolCode: 'ETI-SMTS-017', role: 'principal_admin', status: 'active', mfaEnabled: true, lastLogin: '2026-10-04 07:02', lastLoginIp: '197.211.33.14', createdOn: '2023-12-01' },
  { id: 21, fullName: 'Ngozi Udeh', email: 'n.udeh@clearwateragric.ac.ng', phone: '+234 812 006 5547', schoolName: 'Clearwater Agricultural College', schoolCode: 'CAC-SMTS-018', role: 'principal_admin', status: 'active', mfaEnabled: false, lastLogin: '2026-10-03 18:22', lastLoginIp: '105.112.60.91', createdOn: '2024-11-17' },
  { id: 22, fullName: 'Capt. Thomas Hayes', email: 't.hayes@crestview.ac.uk', phone: '+234 803 991 2217', schoolName: 'Crestview Maritime Academy', schoolCode: 'CMA-SMTS-019', role: 'principal_admin', status: 'active', mfaEnabled: false, lastLogin: '2026-10-04 08:26', lastLoginIp: '102.67.44.30', createdOn: '2026-09-21' },
  { id: 23, fullName: 'Arthur Pendelton', email: 'a.pendelton@vanguardsciences.edu', phone: '+234 808 553 7719', schoolName: 'Vanguard Institute of Sciences', schoolCode: 'VIS-SMTS-020', role: 'principal_admin', status: 'disabled', mfaEnabled: false, lastLogin: '2026-09-13 12:47', lastLoginIp: '197.253.77.4', createdOn: '2023-07-05' },
  { id: 24, fullName: 'Olusegun Adeniyi', email: 'o.adeniyi@lakesidebiz.ac.ng', phone: '+234 816 773 1128', schoolName: 'Lakeside Business School', schoolCode: 'LBS-SMTS-021', role: 'principal_admin', status: 'invited', mfaEnabled: false, lastLogin: 'Never', lastLoginIp: '—', createdOn: '2026-10-01' },
];

const ROLE_LABELS: Record<SchoolAdministrator['role'], string> = {
  principal_admin: 'Principal Admin',
  deputy_admin: 'Deputy Admin',
  bursar: 'Bursar',
  registrar: 'Registrar',
};

const ROLE_STYLES: Record<SchoolAdministrator['role'], string> = {
  principal_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  deputy_admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  bursar: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  registrar: 'bg-blue-50 text-blue-700 border-blue-200',
};

const STATUS_STYLES: Record<AdminAccountStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  invited: 'bg-blue-50 text-blue-700 border-blue-200',
  locked: 'bg-red-50 text-red-700 border-red-200',
  disabled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

function initialsOf(name: string) {
  return name
    .replace(/^(Dr\.|Prof\.|Mrs\.|Mr\.|Capt\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function AdministratorsView() {
  const [statusFilter, setStatusFilter] = useState<'all' | AdminAccountStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | SchoolAdministrator['role']>('all');
  const [mfaOnly, setMfaOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const stats = useMemo(
    () => ({
      total: ADMINISTRATORS.length,
      active: ADMINISTRATORS.filter((a) => a.status === 'active').length,
      mfaGap: ADMINISTRATORS.filter((a) => !a.mfaEnabled).length,
      attention: ADMINISTRATORS.filter((a) => a.status === 'locked' || a.status === 'disabled').length,
      pendingInvites: ADMINISTRATORS.filter((a) => a.status === 'invited').length,
    }),
    []
  );

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ADMINISTRATORS.filter((admin) => {
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
  }, [query, statusFilter, roleFilter, mfaOnly]);

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
            onClick={() => alert('Access posture report will be enabled in the next release.')}
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Access Report
          </button>
          <button
            type="button"
            onClick={() => alert('Administrator invitation modal will be enabled in next release.')}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Invite Administrator</span>
          </button>
        </div>
      </div>

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
              {(Object.keys(ROLE_LABELS) as SchoolAdministrator['role'][]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
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
            Showing <span className="font-bold text-zinc-800">{rows.length}</span> of {ADMINISTRATORS.length} accounts
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
                onClick={() => alert(`MFA enrolment enforced for ${selectedIds.length} account(s).`)}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Enforce MFA
              </button>
              <button
                type="button"
                onClick={() => alert(`Password reset links queued for ${selectedIds.length} account(s).`)}
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
                        {initialsOf(admin.fullName)}
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
                    <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${ROLE_STYLES[admin.role]}`}>
                      {ROLE_LABELS[admin.role]}
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
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLES[admin.status]}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => alert(`Opening permission matrix for ${admin.fullName}.`)}
                      className="text-[11px] font-semibold text-[#B81D22] hover:underline"
                    >
                      Permissions
                    </button>
                    <span className="text-zinc-300 mx-1.5">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          admin.status === 'locked'
                            ? `Unlock request queued for ${admin.fullName}.`
                            : `Suspension request queued for ${admin.fullName}.`
                        )
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
    </div>
  );
}
