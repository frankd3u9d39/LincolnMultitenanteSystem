'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import {
  listClassStudents,
  listClasses,
  listAttendanceClasses,
  getClassAttendance,
  takeAttendance,
  type AttendanceStatus,
  type ClassStudent,
  type TeacherClass,
  type TeacherClassSubject,
  type TeacherAttendanceClassesData,
} from '@/modules/teacher/services/api';
import { ApiError } from '@/services/api';

export default function AttendancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<ClassStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({});
  const [existingCount, setExistingCount] = useState<number>(0);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const { data, loading, error, reload } = useAsync<TeacherAttendanceClassesData>(async (signal): Promise<TeacherAttendanceClassesData> => {
    try {
      const res = await listAttendanceClasses(signal);
      if (res && Array.isArray(res.classes)) {
        return res;
      }
      return { classes: [], teacher_subjects: [], school_subjects: [] };
    } catch {
      const fallbackClasses = await listClasses(signal);
      return { classes: fallbackClasses || [], teacher_subjects: [], school_subjects: [] };
    }
  }, []);

  const classes: TeacherClass[] = data?.classes ?? [];

  // Helper to load or refresh roster + existing attendance for chosen class, date, and subject
  const loadRosterAndAttendance = async (
    clsId: number,
    date: string,
    subjectId: string,
    existingRoster?: ClassStudent[]
  ) => {
    setLoadingRoster(true);
    try {
      const [students, savedRecords] = await Promise.all([
        existingRoster && existingRoster.length > 0 ? Promise.resolve(existingRoster) : listClassStudents(clsId),
        getClassAttendance(clsId, { date, course_id: subjectId ? Number(subjectId) : null }).catch(() => []),
      ]);

      setRoster(students);

      const savedMap = new Map((savedRecords || []).map((r) => [r.student_id, r.status]));
      setExistingCount(savedRecords?.length ?? 0);

      // Pre-fill statuses from database if saved, else default to 'Present'
      const initialStatuses: Record<number, AttendanceStatus> = {};
      for (const s of students) {
        initialStatuses[s.id] = (savedMap.get(s.id) as AttendanceStatus) ?? 'Present';
      }
      setStatuses(initialStatuses);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not load class records.');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleOpenAttendanceModal = async (cls: TeacherClass, defaultSubject?: TeacherClassSubject) => {
    setSelectedClass(cls);
    setIsModalOpen(true);
    setSaveError('');
    setSaveSuccess('');
    const today = new Date().toISOString().slice(0, 10);
    setAttendanceDate(today);

    let chosenSubjectId = '';
    if (defaultSubject) {
      chosenSubjectId = String(defaultSubject.id);
    } else {
      const mySubject = cls.subjects?.find((s) => s.is_my_subject);
      if (mySubject) {
        chosenSubjectId = String(mySubject.id);
      } else if (!cls.is_form_master && cls.subjects && cls.subjects.length > 0) {
        chosenSubjectId = String(cls.subjects[0].id);
      }
    }
    setSelectedSubjectId(chosenSubjectId);

    await loadRosterAndAttendance(cls.id, today, chosenSubjectId);
  };

  const handleDateChange = (newDate: string) => {
    setAttendanceDate(newDate);
    if (selectedClass) {
      loadRosterAndAttendance(selectedClass.id, newDate, selectedSubjectId, roster);
    }
  };

  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId);
    if (selectedClass) {
      loadRosterAndAttendance(selectedClass.id, attendanceDate, newSubjectId, roster);
    }
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setStatuses(Object.fromEntries(roster.map((s) => [s.id, status])));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await takeAttendance({
        school_class_id: selectedClass.id,
        course_id: selectedSubjectId ? Number(selectedSubjectId) : null,
        date: attendanceDate,
        records: roster.map((s) => ({ student_id: s.id, status: statuses[s.id] ?? 'Present' })),
      });
      setSaveSuccess(res?.status === 'success' ? 'Attendance saved successfully!' : 'Attendance saved!');
      setExistingCount(roster.length);
      setTimeout(() => {
        setIsModalOpen(false);
        reload();
      }, 1000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Status counts for selected class
  const presentCount = roster.filter((s) => (statuses[s.id] ?? 'Present') === 'Present').length;
  const absentCount = roster.filter((s) => statuses[s.id] === 'Absent').length;
  const lateCount = roster.filter((s) => statuses[s.id] === 'Late').length;
  const excusedCount = roster.filter((s) => statuses[s.id] === 'Excused').length;

  if (loading) {
    return <LoadingBlock rows={5} label="Loading classes" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Attendance</h1>
          <p className="text-zinc-500 font-medium mt-1">
            Record attendance for your assigned subjects or overseen form classes.
          </p>
        </div>
      </div>

      {classes.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200">
          <NavIcon name="calendar" className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800">No Classes Available</h3>
          <p className="text-sm text-zinc-500 mt-1">
            You are not currently assigned as a Form Master or Subject Teacher to any classes.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => {
          const mySubjects = cls.subjects?.filter((s) => s.is_my_subject) ?? [];
          const otherSubjects = cls.subjects?.filter((s) => !s.is_my_subject) ?? [];
          const today = cls.today_attendance;

          return (
            <div
              key={cls.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-3 rounded-xl bg-red-50 text-[#B81D22]">
                    <NavIcon name="checkCircle" className="w-6 h-6" />
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {cls.is_form_master && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-[#B81D22]">
                        Form Master
                      </span>
                    )}
                    {mySubjects.length > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Subject Teacher ({mySubjects.length})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl font-bold text-zinc-900">{cls.name}</h3>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    {cls.code}
                  </span>
                </div>

                {/* Today Status Pill */}
                <div className="mt-2 mb-3">
                  {today?.taken ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Today Recorded ({today.present}/{today.total} Present)
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600">
                      <span className="w-2 h-2 rounded-full bg-zinc-400" />
                      Today Pending
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-sm font-medium text-zinc-600 mb-4">
                  <div className="flex items-center gap-2">
                    <NavIcon name="building" className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Room: {cls.room ?? 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <NavIcon name="students" className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{cls.students_count ?? 0} Enrolled Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-700">Form Teacher:</span>
                    <span>{cls.teacher ?? 'Unassigned'}</span>
                  </div>
                </div>

                {/* Assigned Subjects in this Class */}
                <div className="pt-3 border-t border-zinc-100">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Class Subjects
                  </p>
                  {cls.subjects && cls.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {mySubjects.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleOpenAttendanceModal(cls, sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Click to mark attendance for this subject"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.today_taken ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-400'}`} />
                          {sub.name} (Your Subject)
                          {sub.today_taken && <span className="text-[10px] text-emerald-800 font-black">✓</span>}
                        </button>
                      ))}
                      {otherSubjects.map((sub) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No subjects configured yet</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => handleOpenAttendanceModal(cls)}
                  className="w-full py-2.5 rounded-xl font-bold transition-colors bg-[#B81D22] text-white hover:bg-[#9E1519] shadow-sm flex items-center justify-center gap-2"
                >
                  <NavIcon name="checkCircle" className="w-4 h-4" />
                  {today?.taken ? 'Update Attendance' : 'Take Attendance'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Take Attendance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Take Attendance: ${selectedClass?.name ?? ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {saveError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {saveSuccess}
            </div>
          )}

          {/* Existing records notification banner */}
          {existingCount > 0 && !saveSuccess && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Previously saved records loaded for this date. Modifying and saving will update the record.
            </div>
          )}

          {/* Form Options: Date & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1">
                Subject / Period
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full text-sm font-semibold rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
              >
                <option value="">General Class Roll Call (Daily)</option>
                {selectedClass?.subjects && selectedClass.subjects.length > 0 && (
                  <optgroup label="Class Subjects">
                    {selectedClass.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} {sub.is_my_subject ? '★ (Your Subject)' : `(${sub.teacher || 'Unassigned'})`}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1">
                Date
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full text-sm font-semibold rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
              />
            </div>
          </div>

          {/* Quick Summary & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Present: {presentCount}
              </span>
              <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                Late: {lateCount}
              </span>
              <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                Absent: {absentCount}
              </span>
              <span className="text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
                Excused: {excusedCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Student Roster List */}
          <div className="max-h-72 overflow-y-auto space-y-2 border border-zinc-200 rounded-xl p-2 bg-white">
            {loadingRoster && (
              <div className="p-6 text-center text-sm text-zinc-400">Loading student roster and saved attendance…</div>
            )}
            {!loadingRoster && roster.length === 0 && (
              <div className="p-6 text-center text-sm text-zinc-400">No students enrolled in this class.</div>
            )}
            {roster.map((s) => {
              const currentStatus = statuses[s.id] ?? 'Present';
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors border border-zinc-100 hover:border-zinc-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-zinc-100 border border-zinc-200 rounded-full flex items-center justify-center text-xs font-bold text-zinc-700 shrink-0">
                      {s.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-sm truncate">{s.user.name}</p>
                      <p className="text-xs text-zinc-400 truncate">
                        {s.student_id_number ?? s.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={currentStatus}
                      onChange={(e) =>
                        setStatuses((prev) => ({
                          ...prev,
                          [s.id]: e.target.value as AttendanceStatus,
                        }))
                      }
                      className={`text-xs font-bold rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 cursor-pointer ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : currentStatus === 'Late'
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : currentStatus === 'Absent'
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                      }`}
                    >
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingRoster || roster.length === 0}
              className="px-6 py-2.5 rounded-xl font-bold bg-[#B81D22] hover:bg-[#9E1519] text-white shadow-md transition-colors disabled:opacity-60 text-sm flex items-center gap-2"
            >
              <NavIcon name="checkCircle" className="w-4 h-4" />
              {saving ? 'Saving…' : existingCount > 0 ? 'Update Attendance' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
