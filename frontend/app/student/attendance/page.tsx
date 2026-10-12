'use client';

import React from 'react';

// Mock Data
const OVERALL_ATTENDANCE = {
  percentage: 92,
  totalClasses: 120,
  present: 110,
  absent: 6,
  late: 4,
};

const COURSE_ATTENDANCE = [
  { id: 1, course: 'Advanced Physics', code: 'PHY-401', percentage: 95, present: 19, total: 20 },
  { id: 2, course: 'Calculus III', code: 'MAT-302', percentage: 88, present: 22, total: 25 },
  { id: 3, course: 'Computer Science', code: 'CSC-201', percentage: 100, present: 15, total: 15 },
  { id: 4, course: 'English Literature', code: 'LIT-105', percentage: 75, present: 9, total: 12 },
];

const RECENT_LOGS = [
  { id: 1, date: 'Oct 06, 2026', course: 'Calculus III', status: 'Present' },
  { id: 2, date: 'Oct 05, 2026', course: 'Advanced Physics', status: 'Present' },
  { id: 3, date: 'Oct 04, 2026', course: 'English Literature', status: 'Absent' },
  { id: 4, date: 'Oct 02, 2026', course: 'Computer Science', status: 'Present' },
  { id: 5, date: 'Oct 01, 2026', course: 'Calculus III', status: 'Late' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Absent': return 'bg-red-50 text-red-700 border-red-200';
    case 'Late': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
  }
};

export default function StudentAttendancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Attendance Record
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Track your class attendance, absences, and overall participation.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Attendance', value: `${OVERALL_ATTENDANCE.percentage}%`, color: 'text-emerald-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Classes', value: OVERALL_ATTENDANCE.totalClasses, color: 'text-blue-500', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Total Absences', value: OVERALL_ATTENDANCE.absent, color: 'text-[#B81D22]', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Late Arrivals', value: OVERALL_ATTENDANCE.late, color: 'text-amber-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
            <div className={`p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 ${stat.color}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">{stat.label}</p>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 px-1">Course Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COURSE_ATTENDANCE.map(course => (
              <div key={course.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{course.course}</h3>
                    <p className="text-xs text-zinc-500">{course.code}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-lg ${course.percentage >= 85 ? 'text-emerald-700 bg-emerald-50' : course.percentage >= 75 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'}`}>
                    {course.percentage}%
                  </span>
                </div>
                
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${course.percentage >= 85 ? 'bg-emerald-500' : course.percentage >= 75 ? 'bg-amber-500' : 'bg-[#B81D22]'}`}
                    style={{ width: `${course.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">
                  {course.present} / {course.total} Classes Attended
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 px-1">Recent Logs</h2>
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {RECENT_LOGS.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{log.course}</p>
                    <p className="text-xs text-zinc-500">{log.date}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-md border ${getStatusBadge(log.status)}`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-xs font-bold text-zinc-600 hover:text-[#B81D22] bg-zinc-50 border-t border-zinc-200 transition-colors">
              View Full History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
