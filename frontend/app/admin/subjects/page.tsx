'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import {
  createSubject,
  updateSubject,
  listSubjects,
  listTeachers,
  type AdminSubject,
  type RosterTeacher,
} from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

export default function AdminSubjectsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Core' | 'Elective'>('all');
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('General Studies');
  const [credits, setCredits] = useState(4);
  const [type, setType] = useState<'Core' | 'Elective'>('Core');
  const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit / Assign Teacher Modal state
  const [editingSubject, setEditingSubject] = useState<AdminSubject | null>(null);
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCredits, setEditCredits] = useState(4);
  const [editType, setEditType] = useState<'Core' | 'Elective'>('Core');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const { data, loading, error, reload } = useAsync((signal) => listSubjects(signal), []);
  const { data: teachers } = useAsync((signal) => listTeachers('', signal), []);

  const openCreateModal = () => {
    setCode('');
    setName('');
    setDepartment('General Studies');
    setCredits(4);
    setType('Core');
    setTeacherId('');
    setFormError('');
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createSubject({
        code,
        name,
        department,
        credits,
        type,
        teacherId: teacherId ? Number(teacherId) : undefined,
      });
      setCode('');
      setName('');
      setTeacherId('');
      setShowModal(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not add subject.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (subject: AdminSubject) => {
    setEditingSubject(subject);
    setEditTeacherId(subject.teacherId ? String(subject.teacherId) : '');
    setEditDepartment(subject.department || 'General Studies');
    setEditCredits(subject.credits || 4);
    setEditType(subject.type || 'Core');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingSubject(null);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setEditSaving(true);
    setEditError('');
    try {
      await updateSubject(editingSubject.id, {
        department: editDepartment,
        credits: editCredits,
        type: editType,
        teacherId: editTeacherId ? Number(editTeacherId) : null,
      });
      closeEditModal();
      reload();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to update subject.');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return <LoadingBlock rows={6} label="Loading curriculum subjects" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to load subjects.'} onRetry={reload} />;
  }

  const { data: subjects, summary } = data;
  const filtered = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      (s.teacher && s.teacher.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Curriculum Subjects</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage subjects, assigned subject teachers, weekly periods, and core/elective curriculum.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          + Add Subject
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Total Subjects</p>
          <p className="text-3xl font-black tracking-tight text-zinc-900">{summary.totalSubjects}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Active syllabus subjects</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Core Subjects</p>
          <p className="text-3xl font-black tracking-tight text-blue-600">{summary.coreCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Compulsory subjects (e.g. Math, English)</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Electives Offered</p>
          <p className="text-3xl font-black tracking-tight text-amber-600">{summary.electiveCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Optional & stream-specific subjects</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Filter by subject code, title, teacher, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#B81D22]"
        />

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 p-1 rounded-xl">
          {(['all', 'Core', 'Elective'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === t ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Subject Title</th>
              <th className="py-3 px-4">Subject Teacher</th>
              <th className="py-3 px-4">Department / Stream</th>
              <th className="py-3 px-4 text-center">Periods / Week</th>
              <th className="py-3 px-4 text-center">Type</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-400">
                  No subjects match your criteria.
                </td>
              </tr>
            )}
            {filtered.map((sub) => {
              const hasTeacher = Boolean(sub.teacher && sub.teacher !== 'Unassigned');

              return (
                <tr key={sub.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-black text-zinc-900 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">{sub.code}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-zinc-900">{sub.name}</td>
                  <td className="py-3 px-4">
                    {hasTeacher ? (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900">{sub.teacher}</span>
                        <button
                          onClick={() => openEditModal(sub)}
                          title="Change assigned teacher"
                          className="text-zinc-400 hover:text-[#B81D22] text-[11px] p-0.5 rounded transition-colors"
                        >
                          ✎
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openEditModal(sub)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-[#B81D22] border border-dashed border-zinc-300 hover:border-[#B81D22] px-2 py-0.5 rounded-md transition-all"
                      >
                        + Assign Teacher
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-600">{sub.department}</td>
                  <td className="py-3 px-4 text-center font-bold text-zinc-800">{sub.credits} periods</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        sub.type === 'Core'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sub.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openEditModal(sub)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-lg font-black text-zinc-900">Add School Subject</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Add a new curriculum subject for Primary, JSS, or SSS levels.</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Subject Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MTH, ENG, BIO, BTECH, CIV"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Subject Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Mathematics, English Studies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Subject Teacher / Instructor</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                >
                  <option value="">Select Subject Teacher (Optional)</option>
                  {teachers?.map((t: RosterTeacher) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Department / Category *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                >
                  <option value="General Studies">General Studies (Core: Math, English, Civic)</option>
                  <option value="Sciences & Mathematics">Sciences & Mathematics (Biology, Chemistry, Physics)</option>
                  <option value="Humanities & Arts">Humanities & Arts (Literature, CRS/IRS, Government)</option>
                  <option value="Commercial Studies">Commercial Studies (Economics, Commerce, Accounting)</option>
                  <option value="Technical & Vocational">Technical & Vocational (Basic Tech, Agri Sci, Home Econ)</option>
                  <option value="Primary Section">Primary / Early Years (Literacy, Numeracy)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Periods / Week *</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Subject Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'Core' | 'Elective')}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                  >
                    <option value="Core">Core (Compulsory)</option>
                    <option value="Elective">Elective (Optional)</option>
                  </select>
                </div>
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
                  {saving ? 'Adding...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Assign Teacher Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Assign Teacher — {editingSubject.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  Code: <span className="font-semibold text-zinc-700">{editingSubject.code}</span>
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="text-zinc-400 hover:text-zinc-700 text-lg leading-none p-1 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Subject Teacher / Instructor</label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                >
                  <option value="">No Teacher (Unassigned)</option>
                  {teachers?.map((t: RosterTeacher) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Assigned teacher will have access to mark attendance, post assignments, and record grades for this subject.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Department / Stream</label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                >
                  <option value="General Studies">General Studies (Core: Math, English, Civic)</option>
                  <option value="Sciences & Mathematics">Sciences & Mathematics (Biology, Chemistry, Physics)</option>
                  <option value="Humanities & Arts">Humanities & Arts (Literature, CRS/IRS, Government)</option>
                  <option value="Commercial Studies">Commercial Studies (Economics, Commerce, Accounting)</option>
                  <option value="Technical & Vocational">Technical & Vocational (Basic Tech, Agri Sci, Home Econ)</option>
                  <option value="Primary Section">Primary / Early Years (Literacy, Numeracy)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Periods / Week</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={editCredits}
                    onChange={(e) => setEditCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Subject Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as 'Core' | 'Elective')}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                  >
                    <option value="Core">Core (Compulsory)</option>
                    <option value="Elective">Elective (Optional)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
