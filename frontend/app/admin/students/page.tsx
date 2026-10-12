'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createStudent, listStudents, updateStudentStatus } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsync((signal) => listStudents(search, signal), [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createStudent({ name, email, gradeLevel: gradeLevel || undefined });
      setName('');
      setEmail('');
      setGradeLevel('');
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not add this student.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number, status: string) => {
    const next = status === 'active' ? 'inactive' : 'active';
    await updateStudentStatus(id, next);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Students</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Manage your school&apos;s student roster.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          {showForm ? 'Cancel' : '+ Add Student'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3 max-w-xl">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input placeholder="Grade level (optional)" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 sm:col-span-2" />
          </div>
          <button disabled={saving} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold disabled:opacity-60">
            {saving ? 'Saving…' : 'Add Student'}
          </button>
        </form>
      )}

      <input
        type="text"
        placeholder="Search students..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-72 px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white"
      />

      {loading ? (
        <LoadingBlock rows={6} label="Loading students" />
      ) : error || !data ? (
        <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Grade</th>
                <th className="py-2.5 px-4">Joined</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-400">No students found.</td></tr>
              )}
              {data.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50/60">
                  <td className="py-3 px-4 font-bold text-zinc-900">{s.name}</td>
                  <td className="py-3 px-4 text-zinc-600">{s.email}</td>
                  <td className="py-3 px-4 text-zinc-600">{s.gradeLevel ?? '—'}</td>
                  <td className="py-3 px-4 text-zinc-500 text-xs">{s.joinedAt}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${statusStyles[s.status] ?? statusStyles.inactive}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => toggleStatus(s.id, s.status)} className="text-xs font-bold text-[#B81D22] hover:underline">
                      {s.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
