'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createStaff, listStaff } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

export default function AdminStaffPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('Admissions & Registry');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, loading, error, reload } = useAsync((signal) => listStaff(signal), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createStaff({ name, email, roleTitle, department, phone, password: password || undefined });
      setName('');
      setEmail('');
      setRoleTitle('');
      setPhone('');
      setPassword('');
      setShowModal(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not add staff member.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingBlock rows={6} label="Loading institutional staff roster" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to load staff roster.'} onRetry={reload} />;
  }

  const { data: staffList, summary } = data;
  const filtered = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Staff & Administrative Roster</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage non-teaching professionals, administrative officers, admissions counselors, and campus services.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          + Add Staff Member
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Administrative Personnel</p>
          <p className="text-3xl font-black tracking-tight text-zinc-900">{summary.totalStaff}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Active non-teaching staff</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Administrative Units</p>
          <p className="text-3xl font-black tracking-tight text-blue-600">{summary.departments}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Operational divisions</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Active Duty</p>
          <p className="text-3xl font-black tracking-tight text-emerald-600">{summary.activeCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Verified badge credentials</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by staff name, role, department, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#B81D22]"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => (
          <div key={member.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="w-10 h-10 rounded-xl bg-red-50 text-[#B81D22] font-black text-xs flex items-center justify-center border border-red-100">
                  {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {member.status}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 text-base leading-snug">{member.name}</h3>
              <p className="text-xs font-semibold text-[#B81D22] mt-0.5">{member.roleTitle}</p>
              <p className="text-xs text-zinc-500 mt-1">{member.department}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 space-y-1 text-[11px] text-zinc-500">
              <p><span className="font-semibold text-zinc-700">Email:</span> {member.email}</p>
              <p><span className="font-semibold text-zinc-700">Phone:</span> {member.phone}</p>
              <p><span className="font-semibold text-zinc-700">Joined:</span> {member.joinedDate}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-lg font-black text-zinc-900">Add Staff Member</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Enroll a non-teaching professional or administrator.</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenneth Briggs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. k.briggs@lincoln.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Position / Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Admissions Officer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Department *</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Password (default: Lincoln@123)</label>
                <input
                  type="password"
                  placeholder="Set custom password or leave blank for default"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
