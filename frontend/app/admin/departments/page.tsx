'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createDepartment, listDepartments } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

export default function AdminDepartmentsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [head, setHead] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, loading, error, reload } = useAsync((signal) => listDepartments(signal), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createDepartment({ name, code, head });
      setName('');
      setCode('');
      setHead('');
      setShowModal(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create department.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingBlock rows={6} label="Loading academic departments" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to load departments.'} onRetry={reload} />;
  }

  const { data: departments, summary } = data;
  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.head.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Academic Departments & Units</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Organize school subject departments (Sciences, Humanities, Commercial, Technical) led by Heads of Department (HODs).
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          + Add Department
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Subject Departments</p>
          <p className="text-3xl font-black tracking-tight text-zinc-900">{summary.totalDepartments}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Active academic units</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Subjects Taught</p>
          <p className="text-3xl font-black tracking-tight text-blue-600">{summary.totalCourses}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Curriculum subjects</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Subject Teachers</p>
          <p className="text-3xl font-black tracking-tight text-emerald-600">{summary.totalFaculty}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Assigned department instructors</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by department name, code, or HOD..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#B81D22]"
        />
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept) => (
          <div key={dept.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-red-50 text-[#B81D22] text-xs font-black tracking-wider uppercase">
                  {dept.code}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {dept.status}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 text-base leading-snug">{dept.name}</h3>
              <p className="text-xs text-zinc-500 mt-2">
                <span className="font-semibold text-zinc-700">HOD:</span> {dept.head}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 grid grid-cols-3 text-center text-xs">
              <div>
                <p className="font-black text-zinc-900 text-sm">{dept.coursesCount}</p>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">Subjects</p>
              </div>
              <div className="border-x border-zinc-100">
                <p className="font-black text-zinc-900 text-sm">{dept.facultyCount}</p>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">Faculty</p>
              </div>
              <div>
                <p className="font-black text-zinc-900 text-sm">{dept.studentsCount}</p>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">Students</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-lg font-black text-zinc-900">Add Academic Department</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Register a subject department or academic unit in your school.</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Department, Humanities, Commercial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SCI, HUM, COMM, TECH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Emmanuel Adeyemi (HOD)"
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
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
                  {saving ? 'Saving...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
