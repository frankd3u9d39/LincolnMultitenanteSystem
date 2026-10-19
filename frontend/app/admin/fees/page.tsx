'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createFee, listFees, listStudents, type RosterStudent } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

const statusStyles: Record<string, string> = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Partial: 'bg-amber-50 text-amber-700 border-amber-200',
  Unpaid: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminFeesPage() {
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState('Fall 2026');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<RosterStudent[]>([]);

  const { data, loading, error, reload } = useAsync((signal) => listFees(signal), []);

  const openForm = () => {
    setShowForm(true);
    listStudents('').then(setStudents).catch(() => setStudents([]));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createFee({ studentId: Number(studentId), term, description, amount: Number(amount), dueDate });
      setDescription('');
      setAmount('');
      setDueDate('');
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this fee item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Fee Management</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Assign and track student fee schedules.</p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          {showForm ? 'Cancel' : '+ New Fee Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3 max-w-2xl">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200">
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input required placeholder="Term (e.g. Fall 2026)" value={term} onChange={(e) => setTerm(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input required placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 sm:col-span-2" />
            <input required type="number" min={0.01} step={0.01} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
          </div>
          <button disabled={saving} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold disabled:opacity-60">
            {saving ? 'Saving…' : 'Create Fee Item'}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingBlock rows={6} label="Loading fees" />
      ) : error || !data ? (
        <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-2.5 px-4">Student</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Outstanding</th>
                <th className="py-2.5 px-4">Due</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-zinc-400">No fee items yet.</td></tr>
              )}
              {data.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-50/60">
                  <td className="py-3 px-4 font-bold text-zinc-900">{f.student ?? '—'}</td>
                  <td className="py-3 px-4 text-zinc-600">{f.description}</td>
                  <td className="py-3 px-4 text-zinc-600">₦{f.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-zinc-600">₦{f.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-zinc-500 text-xs">{f.dueDate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${statusStyles[f.status]}`}>{f.status}</span>
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
