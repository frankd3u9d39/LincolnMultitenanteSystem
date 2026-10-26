'use client';

import React from 'react';
import Link from 'next/link';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { getDashboard } from '@/modules/student/services/api';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SchoolInfoBanner } from '@/components/branding/SchoolInfoBanner';

/** Derives a class's live status from "HH:MM - HH:MM" against the current time. */
function classStatus(time: string): 'completed' | 'ongoing' | 'upcoming' {
  const [startStr, endStr] = time.split(' - ').map((s) => s.trim());
  const now = new Date();
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m ?? 0);
  };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(startStr);
  const end = toMinutes(endStr);

  if (nowMinutes < start) return 'upcoming';
  if (nowMinutes > end) return 'completed';
  return 'ongoing';
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync((signal) => getDashboard(signal), []);

  if (loading) {
    return <LoadingBlock rows={6} label="Loading dashboard" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />;
  }

  const { kpi, todaysClasses, recentGrades, upcomingDeadlines } = data;

  return (
    <div className="space-y-6">
      {/* School Info Banner */}
      <SchoolInfoBanner
        schoolName={user?.schoolName}
        schoolMotto={user?.schoolMotto}
        schoolLogo={user?.schoolLogo}
        schoolCode={user?.schoolCode}
        schoolAddress={user?.schoolAddress}
        schoolEmail={user?.schoolEmail}
        schoolPhone={user?.schoolPhone}
        variant="card"
      />

      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Student Portal
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Welcome back{user?.name ? `, ${user.name}` : ''}! Here&apos;s your academic overview for today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/student/timetable"
            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Full Timetable
          </Link>
          <Link
            href="/student/assignments"
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Submit Assignment</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cumulative GPA */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="pointer-events-none absolute -right-2 -bottom-2 text-emerald-500/[0.08] group-hover:text-emerald-500/[0.14] group-hover:scale-110 transition-all duration-300">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Academic Average</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">
                {Math.min(100, Math.round((kpi.gpa / 4.0) * 100))}%
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
              <span className="truncate">Current Term Performance</span>
            </div>
          </div>
        </div>

        {/* Card 2: Attendance */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="pointer-events-none absolute -right-2 -bottom-2 text-blue-500/[0.08] group-hover:text-blue-500/[0.14] group-hover:scale-110 transition-all duration-300">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Overall Attendance</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">{kpi.attendance}%</div>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Assignments */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="pointer-events-none absolute -right-2 -bottom-2 text-amber-500/[0.08] group-hover:text-amber-500/[0.14] group-hover:scale-110 transition-all duration-300">
             <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Tasks Due</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">{kpi.assignmentsDue}</div>
            </div>
          </div>
        </div>

        {/* Card 4: Unread Messages/Alerts */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="pointer-events-none absolute -right-2 -bottom-2 text-[#B81D22]/[0.05] group-hover:text-[#B81D22]/[0.1] group-hover:scale-110 transition-all duration-300">
             <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 truncate">Notifications</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 tracking-tight">{kpi.unreadNotifications}</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 pt-2 border-t border-zinc-100 gap-1">
              <Link href="/student/notifications" className="text-zinc-600 shrink-0 hover:underline">View Inbox &rarr;</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="xl:col-span-8 space-y-6">

          {/* Today's Schedule Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Today&apos;s Schedule</h2>
                <p className="text-xs text-zinc-500">Your upcoming classes and events for today.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-100">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Subject & Room</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Instructor</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Time</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {todaysClasses.length === 0 && (
                    <tr><td colSpan={4} className="py-6 px-3 text-center text-zinc-400">No classes scheduled today.</td></tr>
                  )}
                  {todaysClasses.map((cls) => {
                    const status = classStatus(cls.time);
                    return (
                      <tr key={cls.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-zinc-900 truncate max-w-[220px]">{cls.subject}</div>
                          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                            {cls.room}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium whitespace-nowrap">
                          {cls.instructor}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                          {cls.time}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : status === 'ongoing'
                                ? 'bg-[#B81D22]/10 text-[#B81D22] border border-[#B81D22]/20'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Grades Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Recent Grades</h2>
                <p className="text-xs text-zinc-500">Latest assessments and examination results.</p>
              </div>
              <Link href="/student/results" className="text-xs font-semibold text-[#B81D22] hover:underline">
                View Transcripts &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-100">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Assessment</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Course</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Date</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {recentGrades.length === 0 && (
                    <tr><td colSpan={4} className="py-6 px-3 text-center text-zinc-400">No grades posted yet.</td></tr>
                  )}
                  {recentGrades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-zinc-900 truncate max-w-[250px]">{grade.task}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-zinc-600 whitespace-nowrap">
                        {grade.course}
                      </td>
                      <td className="py-3 px-3 text-center text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                        {grade.date ?? '—'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="text-[10px] text-zinc-400">{grade.score}/{grade.points}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols) */}
        <div className="xl:col-span-4 space-y-6">

          {/* Upcoming Deadlines Feed */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">Upcoming Deadlines</h3>
              <Link href="/student/assignments" className="text-xs font-semibold text-[#B81D22] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {upcomingDeadlines.length === 0 && (
                <p className="text-zinc-400 py-4 text-center">Nothing due. You&apos;re all caught up.</p>
              )}
              {upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className={`p-2.5 rounded-xl border ${
                    task.urgency === 'high'
                      ? 'bg-red-50/50 border-red-100'
                      : task.urgency === 'medium'
                      ? 'bg-amber-50/50 border-amber-100'
                      : 'bg-zinc-50 border-zinc-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1 uppercase tracking-wider">
                    <span className={
                      task.urgency === 'high' ? 'text-red-600' :
                      task.urgency === 'medium' ? 'text-amber-600' : 'text-zinc-500'
                    }>{task.course}</span>
                    <span className="text-zinc-400 font-mono">{new Date(task.due).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <div className={`font-semibold ${task.urgency === 'high' ? 'text-red-900' : 'text-zinc-800'}`}>
                    {task.task}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links / Resources */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">Quick Links</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link href="/student/courses" className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2 text-center text-zinc-700 font-medium">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                My Courses
              </Link>

              <Link href="/student/fees" className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2 text-center text-zinc-700 font-medium">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Fee Portal
              </Link>

              <Link href="/student/attendance" className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2 text-center text-zinc-700 font-medium">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Attendance
              </Link>

              <Link href="/student/profile" className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors flex flex-col items-center justify-center gap-2 text-center text-zinc-700 font-medium">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
