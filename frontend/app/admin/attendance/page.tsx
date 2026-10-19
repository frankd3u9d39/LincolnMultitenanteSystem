'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { getAttendanceOverview } from '@/modules/admin/services/api';

export default function AdminAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const { data, loading, error, reload } = useAsync((signal) => getAttendanceOverview(signal), []);

  if (loading) {
    return <LoadingBlock rows={6} label="Loading institutional attendance analytics" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to load attendance records.'} onRetry={reload} />;
  }

  const { summary, classRosters, flaggedStudents } = data;

  const filteredRosters = classRosters.filter(
    (c) =>
      c.course.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Campus Attendance Intelligence</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Monitor daily attendance percentages, class roll logs, and academic compliance thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] shadow-sm"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Campus Rate</p>
          <p className="text-3xl font-black tracking-tight text-emerald-600">{summary.overallRate}%</p>
          <p className="text-[10px] text-zinc-400 mt-2">Overall verified attendance</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Present Today</p>
          <p className="text-3xl font-black tracking-tight text-zinc-900">{summary.presentCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Students checked in</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Absences</p>
          <p className="text-3xl font-black tracking-tight text-red-600">{summary.absentCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Unexcused missed sessions</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Below Threshold</p>
          <p className="text-3xl font-black tracking-tight text-amber-600">{summary.flaggedCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">&lt; 75% minimum required</p>
        </div>
      </div>

      {/* Attendance Warnings Banner */}
      {flaggedStudents.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs shrink-0 mt-0.5">
              !
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-950">At-Risk Attendance Warnings ({flaggedStudents.length} Students)</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The following students have fallen below the mandatory 75% institutional attendance policy and are at risk of exam debarment.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {flaggedStudents.map((st) => (
                  <div key={st.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs shadow-sm">
                    <p className="font-bold text-zinc-900">{st.name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{st.idNumber} &bull; {st.course}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-extrabold text-red-600">{st.rate}% Rate</span>
                      <span className="text-[10px] text-zinc-500">{st.consecutiveAbsences} consecutive absences</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Rosters Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Course & Class Attendance Rolls</h2>
            <p className="text-xs text-zinc-500">Live breakdown of student presence by class and academic department.</p>
          </div>
          <input
            type="search"
            placeholder="Search class or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#B81D22]"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Course / Class</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Enrolled</th>
                <th className="py-3 px-4 text-center">Present Today</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-center">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredRosters.map((roster) => (
                <tr key={roster.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-zinc-900">{roster.course}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{roster.code}</p>
                  </td>
                  <td className="py-3 px-4 text-zinc-600">{roster.department}</td>
                  <td className="py-3 px-4 text-center font-bold text-zinc-800">{roster.enrolled}</td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-bold">{roster.presentToday}</td>
                  <td className="py-3 px-4 text-center font-black text-zinc-900">{roster.rate}%</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        roster.status === 'Normal'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : roster.status === 'Caution'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {roster.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
