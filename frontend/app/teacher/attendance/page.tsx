'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import {
  listClassStudents,
  listClasses,
  takeAttendance,
  type AttendanceStatus,
  type ClassStudent,
  type TeacherClass,
} from '@/modules/teacher/services/api';
import { ApiError } from '@/services/api';

export default function AttendancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [roster, setRoster] = useState<ClassStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: classes, loading, error, reload } = useAsync((signal) => listClasses(signal), []);

  const handleTakeAttendance = async (cls: TeacherClass) => {
    setSelectedClass(cls);
    setIsModalOpen(true);
    setSaveError('');
    setLoadingRoster(true);
    try {
      const students = await listClassStudents(cls.id);
      setRoster(students);
      setStatuses(Object.fromEntries(students.map((s) => [s.id, 'Present' as AttendanceStatus])));
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not load this class roster.');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    setSaveError('');
    try {
      await takeAttendance({
        school_class_id: selectedClass.id,
        date: new Date().toISOString().slice(0, 10),
        records: roster.map((s) => ({ student_id: s.id, status: statuses[s.id] ?? 'Present' })),
      });
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingBlock rows={5} label="Loading classes" />;
  }

  if (error || !classes) {
    return <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Attendance</h1>
          <p className="text-zinc-500 font-medium mt-1">Record and manage daily attendance for your classes.</p>
        </div>
      </div>

      {classes.length === 0 && <p className="text-sm text-zinc-400">No classes assigned yet.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                  <NavIcon name="checkCircle" className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">{cls.name} ({cls.code})</h3>
              <div className="space-y-2 mt-4 text-sm font-medium text-zinc-600">
                <div className="flex items-center gap-2">
                  <NavIcon name="building" className="w-4 h-4 text-zinc-400" />
                  {cls.room ?? 'No room set'}
                </div>
                <div className="flex items-center gap-2">
                  <NavIcon name="students" className="w-4 h-4 text-zinc-400" />
                  {cls.students_count ?? 0} Enrolled Students
                </div>
              </div>
            </div>
            <button
              onClick={() => handleTakeAttendance(cls)}
              className="mt-6 w-full py-2.5 rounded-lg font-bold transition-colors bg-[#B81D22] text-white hover:bg-[#9E1519] shadow-sm"
            >
              Take Attendance
            </button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Attendance: ${selectedClass?.name ?? ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {saveError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">{saveError}</div>
          )}

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
            <NavIcon name="checkCircle" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-amber-800">
              Quickly mark attendance. By default, all students are marked as Present. Only change those who are absent or late.
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto pr-2 space-y-2 border border-zinc-200 rounded-lg p-2">
            {loadingRoster && <p className="p-3 text-sm text-zinc-400">Loading roster…</p>}
            {!loadingRoster && roster.length === 0 && <p className="p-3 text-sm text-zinc-400">No students enrolled in this class.</p>}
            {roster.map((s) => (
              <label key={s.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-bold text-zinc-600">
                    {s.user.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 text-sm">{s.user.name}</span>
                    <p className="text-xs text-zinc-500">{s.student_id_number ?? s.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={statuses[s.id] ?? 'Present'}
                    onChange={(e) => setStatuses((prev) => ({ ...prev, [s.id]: e.target.value as AttendanceStatus }))}
                    className="text-xs bg-transparent border-none focus:ring-0 text-zinc-500 font-semibold cursor-pointer"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Excused">Excused</option>
                  </select>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-lg font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingRoster || roster.length === 0}
              className="px-5 py-2.5 rounded-lg font-bold bg-[#B81D22] hover:bg-[#9E1519] text-white shadow-md transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
