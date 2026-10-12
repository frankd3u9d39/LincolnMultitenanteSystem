'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createClass, listClasses, listTeachers, type RosterTeacher } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

export default function AdminClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [room, setRoom] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<RosterTeacher[]>([]);

  const { data, loading, error, reload } = useAsync((signal) => listClasses(signal), []);

  const openForm = () => {
    setShowForm(true);
    listTeachers('').then(setTeachers).catch(() => setTeachers([]));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createClass({ name, code, room: room || undefined, teacherId: teacherId ? Number(teacherId) : undefined });
      setName('');
      setCode('');
      setRoom('');
      setTeacherId('');
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this class.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Classes</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Manage class rosters and teacher assignments.</p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          {showForm ? 'Cancel' : '+ New Class'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3 max-w-xl">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Class name" value={name} onChange={(e) => setName(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input required placeholder="Class code" value={code} onChange={(e) => setCode(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input placeholder="Room (optional)" value={room} onChange={(e) => setRoom(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200">
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button disabled={saving} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold disabled:opacity-60">
            {saving ? 'Saving…' : 'Create Class'}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingBlock rows={5} label="Loading classes" />
      ) : error || !data ? (
        <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.length === 0 && <p className="text-zinc-400 text-sm">No classes yet.</p>}
          {data.map((c) => (
            <div key={c.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-zinc-900">{c.name}</h3>
                <span className="text-[10px] font-black uppercase bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">{c.code}</span>
              </div>
              <p className="text-xs text-zinc-500">{c.teacher}</p>
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span>{c.room ?? 'No room set'}</span>
                <span>{c.studentCount} students</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
