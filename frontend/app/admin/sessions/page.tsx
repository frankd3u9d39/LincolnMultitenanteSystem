'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { activateSession, createSession, listSessions } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

export default function AdminSessionsPage() {
  const [showModal, setShowModal] = useState(false);
  const [year, setYear] = useState('2026/2027');
  const [term, setTerm] = useState('Fall Semester');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-12-20');
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const { data, loading, error, reload } = useAsync((signal) => listSessions(signal), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createSession({ year, term, startDate, endDate });
      setShowModal(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not add academic session.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: number) => {
    setActivating(id);
    try {
      await activateSession(id);
      reload();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to activate session.');
    } finally {
      setActivating(null);
    }
  };

  if (loading) {
    return <LoadingBlock rows={6} label="Loading academic calendar" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to load sessions.'} onRetry={reload} />;
  }

  const { data: sessions, currentSession, academicYear } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Academic Sessions & Terms</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Configure school calendars, terms, examination periods, and active registration windows.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          + Add Academic Session
        </button>
      </div>

      {/* Active Session Hero Card */}
      {currentSession && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#B81D22] to-[#800F13] text-white p-6 sm:p-7 shadow-lg">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white backdrop-blur-md mb-2">
                Active Calendar Context &bull; {academicYear}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{currentSession.year} &bull; {currentSession.term}</h2>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                Semester Timeline: {currentSession.startDate} to {currentSession.endDate} &middot; Exam Period: {currentSession.examPeriod}
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 text-center shrink-0">
              <p className="text-2xl sm:text-3xl font-black">{currentSession.enrolledStudents}</p>
              <p className="text-[10px] uppercase font-bold text-white/80 tracking-wider">Enrolled Students</p>
            </div>
          </div>
        </div>
      )}

      {/* Session History & Future Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
              sess.isCurrent
                ? 'bg-white border-[#B81D22] shadow-md ring-1 ring-[#B81D22]'
                : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500">{sess.year}</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    sess.status === 'Ongoing'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : sess.status === 'Upcoming'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                  }`}
                >
                  {sess.status}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 text-lg leading-snug">{sess.term}</h3>
              <p className="text-xs text-zinc-500 mt-2">
                <span className="font-semibold text-zinc-700">Duration:</span> {sess.startDate} &rarr; {sess.endDate}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                <span className="font-semibold text-zinc-700">Examinations:</span> {sess.examPeriod}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-600">
                {sess.enrolledStudents > 0 ? `${sess.enrolledStudents} students enrolled` : 'Admissions open soon'}
              </span>

              {!sess.isCurrent && sess.status !== 'Completed' && (
                <button
                  onClick={() => handleActivate(sess.id)}
                  disabled={activating === sess.id}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {activating === sess.id ? 'Activating...' : 'Set Active'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-lg font-black text-zinc-900">Add Academic Session</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Register a calendar session and term dates.</p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Academic Year *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027/2028"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Term / Semester *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fall Semester"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
                  />
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
                  {saving ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
