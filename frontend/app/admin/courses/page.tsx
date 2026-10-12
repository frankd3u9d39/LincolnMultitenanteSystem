'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createCourse, listCourses, listTeachers, type RosterTeacher } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

export default function AdminCoursesPage() {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [credits, setCredits] = useState('3');
  const [capacity, setCapacity] = useState('30');
  const [teacherId, setTeacherId] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<RosterTeacher[]>([]);

  const { data, loading, error, reload } = useAsync((signal) => listCourses(signal), []);

  const openForm = () => {
    setShowForm(true);
    listTeachers('').then(setTeachers).catch(() => setTeachers([]));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createCourse({
        code,
        name,
        department: department || undefined,
        credits: Number(credits),
        capacity: Number(capacity),
        teacherId: teacherId ? Number(teacherId) : undefined,
      });
      setCode('');
      setName('');
      setDepartment('');
      setTeacherId('');
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Courses</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Manage the course catalogue students enroll into.</p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          {showForm ? 'Cancel' : '+ New Course'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3 max-w-2xl">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Course code (e.g. CSC-301)" value={code} onChange={(e) => setCode(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input required placeholder="Course name" value={name} onChange={(e) => setName(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input placeholder="Department (optional)" value={department} onChange={(e) => setDepartment(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200">
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <input required type="number" min={1} max={10} placeholder="Credits" value={credits} onChange={(e) => setCredits(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <input required type="number" min={1} max={500} placeholder="Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
          </div>
          <button disabled={saving} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold disabled:opacity-60">
            {saving ? 'Saving…' : 'Create Course'}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingBlock rows={6} label="Loading courses" />
      ) : error || !data ? (
        <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Teacher</th>
                <th className="py-2.5 px-4">Credits</th>
                <th className="py-2.5 px-4">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-400">No courses yet.</td></tr>
              )}
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-zinc-900">{c.code}</td>
                  <td className="py-3 px-4 text-zinc-700">{c.name}</td>
                  <td className="py-3 px-4 text-zinc-600">{c.teacher}</td>
                  <td className="py-3 px-4 text-zinc-600">{c.credits}</td>
                  <td className="py-3 px-4 text-zinc-600">{c.enrolled} / {c.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
