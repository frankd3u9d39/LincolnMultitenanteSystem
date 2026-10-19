'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import {
  createClass,
  listClasses,
  listTeachers,
  listSubjects,
  syncClassSubjects,
  type RosterTeacher,
  type SchoolClassDto,
  type AdminSubject,
} from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

export default function AdminClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [room, setRoom] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal state for managing subjects of an existing class
  const [editingClass, setEditingClass] = useState<SchoolClassDto | null>(null);
  const [modalSubjectIds, setModalSubjectIds] = useState<number[]>([]);
  const [modalSubjectTeachers, setModalSubjectTeachers] = useState<Record<number, number | null>>({});
  const [modalSearch, setModalSearch] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const { data, loading, error, reload } = useAsync((signal) => listClasses(signal), []);
  const { data: subjectResp } = useAsync((signal) => listSubjects(signal), []);
  const { data: teachersData } = useAsync((signal) => listTeachers('', signal), []);

  const availableSubjects: AdminSubject[] = subjectResp?.data ?? [];
  const teachers: RosterTeacher[] = teachersData ?? [];

  const openForm = () => {
    setShowForm(true);
    setSelectedSubjectIds([]);
    setSubjectSearch('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createClass({
        name,
        code,
        room: room || undefined,
        teacherId: teacherId ? Number(teacherId) : undefined,
        subjectIds: selectedSubjectIds,
      });
      setName('');
      setCode('');
      setRoom('');
      setTeacherId('');
      setSelectedSubjectIds([]);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this class.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCreateSubject = (id: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCreateSubjects = (filtered: AdminSubject[]) => {
    const allFilteredIds = filtered.map((s) => s.id);
    setSelectedSubjectIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const clearCreateSubjects = () => {
    setSelectedSubjectIds([]);
  };

  // Manage Subjects Modal handlers
  const openSubjectModal = (schoolClass: SchoolClassDto) => {
    setEditingClass(schoolClass);
    const subjectIds = schoolClass.subjects ? schoolClass.subjects.map((s) => s.id) : [];
    setModalSubjectIds(subjectIds);

    const teacherMap: Record<number, number | null> = {};
    schoolClass.subjects?.forEach((s) => {
      teacherMap[s.id] = s.teacherId ?? null;
    });
    setModalSubjectTeachers(teacherMap);

    setModalSearch('');
    setModalError('');
  };

  const closeSubjectModal = () => {
    setEditingClass(null);
    setModalSubjectIds([]);
    setModalSubjectTeachers({});
    setModalError('');
  };

  const toggleModalSubject = (id: number) => {
    setModalSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllModalSubjects = (filtered: AdminSubject[]) => {
    const allFilteredIds = filtered.map((s) => s.id);
    setModalSubjectIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const clearModalSubjects = () => {
    setModalSubjectIds([]);
  };

  const handleSaveModalSubjects = async () => {
    if (!editingClass) return;
    setModalSaving(true);
    setModalError('');
    try {
      const assignments = modalSubjectIds.map((subjectId) => ({
        subjectId,
        teacherId: modalSubjectTeachers[subjectId] !== undefined ? modalSubjectTeachers[subjectId] : null,
      }));
      await syncClassSubjects(editingClass.id, { assignments });
      closeSubjectModal();
      reload();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Failed to update assigned subjects.');
    } finally {
      setModalSaving(false);
    }
  };

  const filteredCreateSubjects = availableSubjects.filter(
    (s) =>
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const filteredModalSubjects = availableSubjects.filter(
    (s) =>
      s.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(modalSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Classes & Arms</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage school classes, arms (e.g. Primary 1-6, JSS 1-3, SSS 1-3), Form Masters, and assigned Subjects with their Teachers.
          </p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openForm())}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          {showForm ? 'Cancel' : '+ New Class Arm'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5 max-w-2xl">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-base font-bold text-zinc-900">Create New Class Arm</h2>
            <p className="text-xs text-zinc-500">Configure class arm information and assign curriculum subjects.</p>
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">Class / Arm Name</label>
              <input
                required
                placeholder="e.g. JSS 1A, SSS 2 Science, Primary 4 Gold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">Class Code</label>
              <input
                required
                placeholder="e.g. JSS-1A, SSS-2SC"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">Classroom / Block (Optional)</label>
              <input
                placeholder="e.g. Room 102, Block B"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">Form Master / Class Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
              >
                <option value="">Select Form Master (Optional)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subjects Assignment Section in Form */}
          <div className="pt-2 border-t border-zinc-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <span>Assign Subjects to this Class</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                    {selectedSubjectIds.length} selected
                  </span>
                </label>
                <p className="text-[11px] text-zinc-500">Pick the curriculum subjects taken by students in this arm.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectAllCreateSubjects(filteredCreateSubjects)}
                  className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearCreateSubjects}
                  className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {availableSubjects && availableSubjects.length > 6 && (
              <input
                type="text"
                placeholder="Search subjects (e.g. Maths, English, Science)..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B81D22]"
              />
            )}

            {availableSubjects && availableSubjects.length > 0 ? (
              <div className="max-h-52 overflow-y-auto border border-zinc-200 rounded-xl p-2.5 bg-zinc-50/30 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredCreateSubjects.map((sub) => {
                  const isChecked = selectedSubjectIds.includes(sub.id);
                  return (
                    <label
                      key={sub.id}
                      onClick={() => toggleCreateSubject(sub.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer border text-xs transition-all select-none ${
                        isChecked
                          ? 'border-[#B81D22] bg-red-50/60 text-zinc-900 font-medium'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-zinc-300 text-[#B81D22] focus:ring-[#B81D22] accent-[#B81D22] h-3.5 w-3.5 mt-0.5"
                      />
                      <div className="flex-1 truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-zinc-900 truncate">{sub.name}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">({sub.code})</span>
                        </div>
                        <p className="text-[10.5px] text-zinc-500 mt-0.5 truncate">
                          Teacher:{' '}
                          <span className={sub.teacher && sub.teacher !== 'Unassigned' ? 'text-zinc-800 font-semibold' : 'text-zinc-400 italic'}>
                            {sub.teacher ?? 'Unassigned'}
                          </span>
                        </p>
                      </div>
                    </label>
                  );
                })}
                {filteredCreateSubjects.length === 0 && (
                  <p className="col-span-2 text-center text-xs text-zinc-400 py-3">No matching subjects found.</p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No subjects registered yet in this school. You can create subjects under the <strong>Courses/Subjects</strong> page.
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold disabled:opacity-60 transition-colors shadow-sm"
            >
              {saving ? 'Saving Class...' : 'Create Class'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingBlock rows={6} label="Loading classes" />
      ) : error || !data ? (
        <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.length === 0 && <p className="text-zinc-400 text-sm">No classes created yet.</p>}
          {data.map((c) => {
            const assignedSubjects = c.subjects ?? [];
            const hasSubjects = assignedSubjects.length > 0;

            return (
              <div
                key={c.id}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-zinc-900">{c.name}</h3>
                    <span className="text-[10px] font-black uppercase bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                      {c.code}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 mb-3">
                    <span className="font-semibold text-zinc-700">Form Master:</span> {c.teacher ?? 'Unassigned'}
                  </p>

                  {/* Assigned Subjects with their Teachers */}
                  <div className="my-3 pt-3 border-t border-zinc-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Subjects ({assignedSubjects.length})
                      </span>
                      <button
                        onClick={() => openSubjectModal(c)}
                        className="text-[11px] font-bold text-[#B81D22] hover:text-[#9E1519] transition-colors"
                      >
                        {hasSubjects ? 'Manage' : '+ Add Subjects'}
                      </button>
                    </div>

                    {hasSubjects ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedSubjects.slice(0, 6).map((subj) => {
                          const hasTeacher = Boolean(subj.teacher && subj.teacher !== 'Unassigned');

                          return (
                            <div
                              key={subj.id}
                              title={`${subj.name} (${subj.code}) • Teacher: ${subj.teacher ?? 'Unassigned'}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-red-50/70 border border-red-200/80 text-zinc-900 shadow-2xs"
                            >
                              <span className="font-bold text-red-950">{subj.name}</span>
                              <span className="text-[10px] text-zinc-300 font-normal">•</span>
                              <span className="inline-flex items-center gap-1 text-[11px]">
                                <span className="text-zinc-400 text-[10px]">Teacher:</span>
                                <span
                                  className={
                                    hasTeacher
                                      ? 'text-zinc-800 font-semibold'
                                      : 'text-amber-700 font-normal italic'
                                  }
                                >
                                  {subj.teacher ?? 'Unassigned'}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                        {assignedSubjects.length > 6 && (
                          <span
                            onClick={() => openSubjectModal(c)}
                            className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 text-zinc-700 cursor-pointer hover:bg-zinc-200 transition-colors"
                          >
                            +{assignedSubjects.length - 6} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => openSubjectModal(c)}
                        className="border border-dashed border-zinc-200 rounded-lg p-2 text-center text-xs text-zinc-400 cursor-pointer hover:border-red-300 hover:text-red-700 transition-all"
                      >
                        No subjects assigned yet. Click to add.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <span>{c.room ?? 'No room assigned'}</span>
                  <span className="font-semibold text-zinc-800">{c.studentCount} students</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manage Subjects Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Assign Subjects — {editingClass.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Class Code: <span className="font-semibold text-zinc-700">{editingClass.code}</span> •{' '}
                  <span className="text-[#B81D22] font-semibold">{modalSubjectIds.length} subjects assigned</span>
                </p>
              </div>
              <button
                onClick={closeSubjectModal}
                className="text-zinc-400 hover:text-zinc-700 text-lg leading-none p-1 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {modalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Filter subjects by name or code..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#B81D22]"
                />
                <button
                  type="button"
                  onClick={() => selectAllModalSubjects(filteredModalSubjects)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearModalSubjects}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  Clear
                </button>
              </div>

              {availableSubjects && availableSubjects.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredModalSubjects.map((sub) => {
                    const isChecked = modalSubjectIds.includes(sub.id);
                    const currentTeacherId = modalSubjectTeachers[sub.id] ?? sub.teacherId ?? null;

                    return (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isChecked
                            ? 'border-[#B81D22] bg-red-50/40 text-zinc-900 shadow-2xs'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                        }`}
                      >
                        <div
                          onClick={() => toggleModalSubject(sub.id)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-zinc-300 text-[#B81D22] focus:ring-[#B81D22] accent-[#B81D22] h-4 w-4"
                            />
                            <div>
                              <p className="font-semibold text-zinc-900">{sub.name}</p>
                              <p className="text-[10.5px] text-zinc-400">
                                Code: <span className="uppercase">{sub.code}</span>
                                {sub.department ? ` • ${sub.department}` : ''}
                              </p>
                            </div>
                          </div>
                          {isChecked && (
                            <span className="text-[10px] font-bold text-[#B81D22] bg-red-100 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Subject Teacher selection row when active */}
                        {isChecked && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-200/60 flex items-center gap-2">
                            <span className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                              Subject Teacher:
                            </span>
                            <select
                              value={currentTeacherId ? String(currentTeacherId) : ''}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                setModalSubjectTeachers((prev) => ({ ...prev, [sub.id]: val }));
                              }}
                              className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#B81D22]"
                            >
                              <option value="">
                                {sub.teacher && sub.teacher !== 'Unassigned'
                                  ? `Default (${sub.teacher})`
                                  : 'Select Teacher (Optional)'}
                              </option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredModalSubjects.length === 0 && (
                    <p className="text-center text-xs text-zinc-400 py-6">No matching subjects found.</p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-50 text-center text-xs text-zinc-500">
                  No subjects created in this school yet.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {modalSubjectIds.length} subjects will be assigned
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeSubjectModal}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={modalSaving}
                  onClick={handleSaveModalSubjects}
                  className="px-4 py-2 rounded-xl bg-[#B81D22] hover:bg-[#9E1519] text-white text-xs font-bold disabled:opacity-60 transition-colors shadow-sm"
                >
                  {modalSaving ? 'Saving...' : 'Save Subjects'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
