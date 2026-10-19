'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import {
  createExamination,
  updateExamStatus,
  listExaminations,
  listSubjects,
  listClasses,
  listTeachers,
  type AdminSubject,
  type SchoolClassDto,
  type RosterTeacher,
} from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

const DEFAULT_TITLES = [
  'First Term Examination',
  'Second Term Examination',
  'Third Term / Promotion Examination',
  'Mid-Term Assessment Test',
  'Mock Examination (BECE / WAEC Prep)',
];

const DEFAULT_TIME_SLOTS = [
  '08:30 - 10:30 (Morning Session 1)',
  '11:00 - 13:00 (Morning Session 2)',
  '13:30 - 15:30 (Afternoon Session)',
  '09:00 - 11:30',
  '09:00 - 12:00',
];

const DEFAULT_VENUES = [
  'Assigned Classrooms / Arm Hall',
  'School Assembly / Multi-Purpose Hall',
  'Science Laboratory',
  'CBT / Computer Centre',
  'Library Study Hall',
];

const DEFAULT_FORMATS = [
  'Theory & Objective (Paper-Based)',
  'CBT (Computer Based Test)',
  'Practical Examination',
  'Oral & Reading Assessment',
];

const DEFAULT_DURATIONS = [
  '2.0 Hours',
  '1.5 Hours',
  '2.5 Hours',
  '1.0 Hour',
  '3.0 Hours',
];

export default function AdminExaminationsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [titlePreset, setTitlePreset] = useState('First Term Examination');
  const [customTitle, setCustomTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:30 - 10:30 (Morning Session 1)');
  const [venue, setVenue] = useState('Assigned Classrooms / Arm Hall');
  const [invigilator, setInvigilator] = useState('');
  const [format, setFormat] = useState('Theory & Objective (Paper-Based)');
  const [duration, setDuration] = useState('2.0 Hours');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, loading, error, reload } = useAsync((signal) => listExaminations(signal), []);
  const { data: subjectResp } = useAsync((signal) => listSubjects(signal), []);
  const { data: classList } = useAsync((signal) => listClasses(signal), []);
  const { data: teacherList } = useAsync((signal) => listTeachers('', signal), []);

  const subjects: AdminSubject[] = subjectResp?.data ?? [];
  const classes: SchoolClassDto[] = classList ?? [];
  const teachers: RosterTeacher[] = teacherList ?? [];

  const openModal = () => {
    setSelectedSubjectId('');
    setSelectedClassId('');
    setCourseCode('');
    setCourseName('');
    setTitlePreset('First Term Examination');
    setCustomTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('08:30 - 10:30 (Morning Session 1)');
    setVenue('Assigned Classrooms / Arm Hall');
    setInvigilator('');
    setFormat('Theory & Objective (Paper-Based)');
    setDuration('2.0 Hours');
    setIsCustomSubject(false);
    setFormError('');
    setShowModal(true);
  };

  const handleSubjectChange = (subjectIdVal: string) => {
    setSelectedSubjectId(subjectIdVal);
    if (!subjectIdVal) {
      setCourseCode('');
      setCourseName('');
      setIsCustomSubject(false);
      return;
    }

    if (subjectIdVal === 'custom') {
      setIsCustomSubject(true);
      setCourseCode('');
      setCourseName('');
      return;
    }

    setIsCustomSubject(false);
    const sub = subjects.find((s) => String(s.id) === subjectIdVal);
    if (sub) {
      setCourseCode(sub.code);
      setCourseName(sub.name);
      if (sub.teacher && sub.teacher !== 'Unassigned') {
        setInvigilator(sub.teacher);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!courseCode || !courseName) {
      setFormError('Please select a subject or provide subject code & title.');
      return;
    }

    // Build title incorporating class if selected
    const selectedClass = classes.find((c) => String(c.id) === selectedClassId);
    const baseTitle = customTitle.trim() || titlePreset;
    const finalTitle = selectedClass ? `${baseTitle} — ${selectedClass.name}` : baseTitle;

    setSaving(true);
    try {
      await createExamination({
        courseCode,
        courseName,
        title: finalTitle,
        date,
        time,
        venue,
        invigilator: invigilator || undefined,
        format,
        duration,
      });
      setShowModal(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not schedule examination.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (examId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Scheduled' : 'Completed';
    try {
      await updateExamStatus(examId, nextStatus as 'Scheduled' | 'Completed');
      reload();
    } catch {
      // reload to reflect current state
      reload();
    }
  };

  if (loading) {
    return <LoadingBlock rows={6} label="Loading institutional examinations" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to load examinations.'} onRetry={reload} />;
  }

  const { data: exams, summary } = data;
  const filtered = exams.filter(
    (ex) =>
      ex.courseName.toLowerCase().includes(search.toLowerCase()) ||
      ex.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      ex.title.toLowerCase().includes(search.toLowerCase()) ||
      ex.venue.toLowerCase().includes(search.toLowerCase()) ||
      ex.invigilator.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Examinations & Timetable</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Schedule term examinations, paper slots, hall allocations, and teacher invigilators for Primary, JSS, and SSS.
          </p>
        </div>
        <button
          onClick={openModal}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          + Schedule Exam
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Total Exams</p>
          <p className="text-3xl font-black tracking-tight text-zinc-900">{summary.totalExams}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Term assessments scheduled</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Upcoming Sessions</p>
          <p className="text-3xl font-black tracking-tight text-blue-600">{summary.scheduledCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Pending exam papers</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Completed</p>
          <p className="text-3xl font-black tracking-tight text-emerald-600">{summary.completedCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Scripts marked & processed</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Exam Venues</p>
          <p className="text-3xl font-black tracking-tight text-amber-600">{summary.activeVenues}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Classrooms & halls in use</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by subject, code, title, venue, or invigilator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#B81D22]"
        />
      </div>

      {/* Examinations Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Exam Code</th>
              <th className="py-3 px-4">Subject & Paper Title</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Venue / Hall</th>
              <th className="py-3 px-4">Invigilator</th>
              <th className="py-3 px-4">Format</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-400">
                  No examinations scheduled yet.
                </td>
              </tr>
            )}
            {filtered.map((exam) => (
              <tr key={exam.id} className="hover:bg-zinc-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-black text-zinc-900 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">{exam.examCode}</span>
                </td>
                <td className="py-3 px-4">
                  <p className="font-bold text-zinc-900">{exam.courseName}</p>
                  <p className="text-[11px] text-zinc-500">{exam.title}</p>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <p className="font-semibold text-zinc-900">{exam.date}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">{exam.time} ({exam.duration})</p>
                </td>
                <td className="py-3 px-4 font-medium text-zinc-800">{exam.venue}</td>
                <td className="py-3 px-4 text-zinc-600">
                  <span className="font-medium text-zinc-800">{exam.invigilator}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-semibold text-zinc-700">
                    {exam.format}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(exam.id, exam.status)}
                    title={`Current: ${exam.status} • Click to toggle status`}
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase cursor-pointer hover:opacity-80 transition-opacity ${
                      exam.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : exam.status === 'In Progress'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {exam.status}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-zinc-900">Schedule Examination Session</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Set subject, target class, exam slot, hall allocation, and invigilator.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg leading-none p-1 rounded-lg hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Curriculum Subject *
                </label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                >
                  <option value="">Select Curriculum Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) {s.teacher && s.teacher !== 'Unassigned' ? `• Teacher: ${s.teacher}` : ''}
                    </option>
                  ))}
                  <option value="custom">-- Other / Enter Custom Subject --</option>
                </select>
              </div>

              {/* Custom Subject inputs if selected */}
              {isCustomSubject && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Subject Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MTH, ENG, BIO"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Subject Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. General Mathematics"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Target Class / Arm Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Target Class / Arm (Optional)</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                  >
                    <option value="">All Classes / General</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Examination Category *</label>
                  <select
                    value={titlePreset}
                    onChange={(e) => setTitlePreset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                  >
                    {DEFAULT_TITLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="custom">Custom Title...</option>
                  </select>
                </div>
              </div>

              {titlePreset === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Custom Examination Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSS 3 Mock Examination (Paper II)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                  />
                </div>
              )}

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Time Slot *</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                  >
                    {DEFAULT_TIME_SLOTS.map((ts) => (
                      <option key={ts} value={ts}>
                        {ts}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Venue & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Venue / Hall Allocation *</label>
                  <select
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                  >
                    {DEFAULT_VENUES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Exam Format *</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                  >
                    {DEFAULT_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Invigilator & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Chief Invigilator / Teacher</label>
                  <select
                    value={invigilator}
                    onChange={(e) => setInvigilator(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                  >
                    <option value="">Select Teacher / Invigilator</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Duration *</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
                  >
                    {DEFAULT_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
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
                  className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
