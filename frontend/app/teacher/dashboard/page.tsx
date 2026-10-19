'use client';

import React from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import Link from 'next/link';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { getDashboard, listAssignments, listClasses, listAnnouncements } from '@/modules/teacher/services/api';
import { useAuth } from '@/lib/auth';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data: dashboard, loading: loadingDashboard, error: dashboardError, reload: reloadDashboard } = useAsync((signal) => getDashboard(signal), []);
  const { data: classes, loading: loadingClasses } = useAsync((signal) => listClasses(signal), []);
  const { data: assignments, loading: loadingAssignments } = useAsync((signal) => listAssignments(signal), []);
  const { data: notices, loading: loadingNotices } = useAsync((signal) => listAnnouncements(signal), []);

  if (loadingDashboard) {
    return <LoadingBlock rows={6} label="Loading dashboard" />;
  }

  if (dashboardError || !dashboard) {
    return <ErrorBlock message={dashboardError ?? 'No data available.'} onRetry={reloadDashboard} />;
  }

  const stats = [
    { label: 'Total Students', value: String(dashboard.total_students), trend: 'Across all classes', icon: 'students', color: 'bg-blue-50 text-blue-600', href: '/teacher/students' },
    { label: 'Active Classes', value: String(dashboard.total_classes), trend: 'Currently assigned', icon: 'classes', color: 'bg-emerald-50 text-emerald-600', href: '/teacher/classes' },
    { label: 'Upcoming Assignments', value: String(dashboard.upcoming_assignments), trend: 'Due soon', icon: 'clipboard', color: 'bg-amber-50 text-amber-600', href: '/teacher/assignments' },
    { label: 'Avg. Attendance', value: `${dashboard.overall_attendance}%`, trend: 'Across all classes', icon: 'chart', color: 'bg-purple-50 text-purple-600', href: '/teacher/attendance' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#B81D22] to-[#801217] text-white p-8 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10 pointer-events-none">
          <NavIcon name="school" className="w-64 h-64" />
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 opacity-10 pointer-events-none">
          <NavIcon name="book" className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p className="text-white/80 font-medium flex items-center gap-2">
              <NavIcon name="calendar" className="w-4 h-4" />
              {currentDate}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <Link href="/teacher/announcements" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm">
              <NavIcon name="bell" className="w-5 h-5" />
              Announcements
            </Link>
            <Link href="/teacher/attendance" className="flex items-center gap-2 bg-white text-[#B81D22] hover:bg-zinc-50 px-4 py-2.5 rounded-lg font-bold transition-all shadow-md">
              <NavIcon name="checkCircle" className="w-5 h-5" />
              Take Attendance
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <Link
            href={stat.href}
            key={idx}
            className="block bg-white rounded-xl p-5 border border-zinc-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <NavIcon name={stat.icon} className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-zinc-900">{stat.value}</h3>
              <p className="text-sm font-medium text-zinc-500 mt-1">{stat.label}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center text-xs text-zinc-500 font-medium">
              <span className="truncate">{stat.trend}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content Area (Schedule & Submissions) */}
        <div className="xl:col-span-2 space-y-6">
          {/* My Classes */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <NavIcon name="classes" className="w-5 h-5 text-[#B81D22]" />
                My Classes
              </h2>
              <Link href="/teacher/classes" className="text-sm font-semibold text-[#B81D22] hover:text-[#9E1519] transition-colors">
                View All &rarr;
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {loadingClasses && <div className="p-6 text-sm text-zinc-400">Loading classes…</div>}
              {!loadingClasses && (classes?.length ?? 0) === 0 && <div className="p-6 text-sm text-zinc-400">No classes assigned yet.</div>}
              {classes?.map((item) => (
                <div key={item.id} className="p-6 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="sm:w-48 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm font-semibold">
                      <NavIcon name="building" className="w-3.5 h-3.5" />
                      {item.code}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900">{item.name}</h4>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <p className="text-sm text-zinc-500 flex items-center gap-1">
                        <NavIcon name="building" className="w-4 h-4" />
                        {item.room ?? 'No room set'}
                      </p>
                      <span className="text-zinc-300 hidden sm:inline">•</span>
                      <p className="text-sm text-zinc-500 flex items-center gap-1">
                        <NavIcon name="students" className="w-4 h-4" />
                        {item.students_count ?? 0} students
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 mt-3 sm:mt-0">
                    <Link href="/teacher/classes" className="inline-block px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors w-full sm:w-auto text-center">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <NavIcon name="clipboard" className="w-5 h-5 text-[#B81D22]" />
                Assignments
              </h2>
              <Link href="/teacher/assignments" className="text-sm font-semibold text-[#B81D22] hover:text-[#9E1519] transition-colors">
                View All &rarr;
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Submissions</th>
                    <th className="px-6 py-4 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loadingAssignments && (
                    <tr><td colSpan={4} className="px-6 py-6 text-sm text-zinc-400">Loading assignments…</td></tr>
                  )}
                  {!loadingAssignments && (assignments?.length ?? 0) === 0 && (
                    <tr><td colSpan={4} className="px-6 py-6 text-sm text-zinc-400">No assignments created yet.</td></tr>
                  )}
                  {assignments?.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-zinc-900 font-semibold min-w-[200px]">
                        {a.title}
                      </td>
                      <td className="px-6 py-4 min-w-[150px]">
                        <div className="text-sm text-zinc-700">{a.school_class?.name ?? '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap bg-blue-100 text-blue-800">
                          {a.teacher_submissions_count ?? 0} submitted
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 text-right whitespace-nowrap">
                        {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Area (Quick Actions & Notifications) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { name: 'New Assignment', icon: 'clipboard', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', href: '/teacher/assignments' },
                { name: 'Message Class', icon: 'bell', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', href: '/teacher/announcements' },
                { name: 'Upload Materials', icon: 'layers', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', href: '/teacher/materials' },
                { name: 'Grade Book', icon: 'award', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', href: '/teacher/grading' },
              ].map((action, idx) => (
                <Link
                  key={idx}
                  href={action.href}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors gap-3 ${action.color}`}
                >
                  <NavIcon name={action.icon} className="w-6 h-6" />
                  <span className="text-xs font-bold text-center leading-tight">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mini Calendar / Notice Board */}
          <div className="bg-[#B81D22] text-white rounded-2xl shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 pointer-events-none">
              <NavIcon name="school" className="w-32 h-32" />
            </div>
            <div className="px-6 py-5 border-b border-white/15 relative z-10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <NavIcon name="award" className="w-5 h-5" />
                Staff Notice Board
              </h2>
            </div>
            <div className="p-6 relative z-10 space-y-4">
              {loadingNotices && <div className="text-xs text-white/70">Loading notices...</div>}
              {!loadingNotices && (!notices || notices.length === 0) && (
                <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                  <p className="text-xs text-white/80">No announcements posted on the notice board yet.</p>
                </div>
              )}
              {notices?.slice(0, 3).map((notice) => (
                <div key={notice.id} className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                  <h4 className="font-bold text-sm mb-1">{notice.title}</h4>
                  <p className="text-xs text-white/80 mb-2">{notice.content}</p>
                  {notice.is_important && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded">Important</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
