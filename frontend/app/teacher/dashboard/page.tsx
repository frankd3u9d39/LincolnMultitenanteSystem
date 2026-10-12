'use client';

import React from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import Link from 'next/link';

export default function TeacherDashboard() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stats = [
    {
      label: 'Total Students',
      value: '142',
      trend: '+4 this week',
      icon: 'students',
      color: 'bg-blue-50 text-blue-600',
      href: '/teacher/students',
    },
    {
      label: 'Active Classes',
      value: '6',
      trend: 'Current semester',
      icon: 'classes',
      color: 'bg-emerald-50 text-emerald-600',
      href: '/teacher/classes',
    },
    {
      label: 'Pending Assignments',
      value: '28',
      trend: '12 due today',
      icon: 'clipboard',
      color: 'bg-amber-50 text-amber-600',
      href: '/teacher/assignments',
    },
    {
      label: 'Avg. Attendance',
      value: '94%',
      trend: '+2% from last month',
      icon: 'chart',
      color: 'bg-purple-50 text-purple-600',
      href: '/teacher/attendance',
    },
  ];

  const schedule = [
    { time: '09:00 AM - 10:30 AM', class: 'Advanced Mathematics (MTH301)', room: 'Room 402', type: 'Lecture' },
    { time: '11:00 AM - 12:30 PM', class: 'Physics Lab (PHY201)', room: 'Science Lab B', type: 'Practical' },
    { time: '02:00 PM - 03:30 PM', class: 'Introduction to Calculus (MTH101)', room: 'Room 105', type: 'Lecture' },
  ];

  const recentSubmissions = [
    { student: 'Alice Johnson', assignment: 'Calculus Midterm Project', class: 'MTH101', status: 'Pending Review', time: '10 mins ago' },
    { student: 'Michael Smith', assignment: 'Physics Lab Report #4', class: 'PHY201', status: 'Graded', time: '1 hour ago' },
    { student: 'Emma Davis', assignment: 'Calculus Midterm Project', class: 'MTH101', status: 'Pending Review', time: '2 hours ago' },
    { student: 'James Wilson', assignment: 'Math Worksheet 7', class: 'MTH301', status: 'Late', time: 'Yesterday' },
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
              Welcome back, Prof. Vance!
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
                <NavIcon name={stat.icon as any} className="w-6 h-6" />
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
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <NavIcon name="calendar" className="w-5 h-5 text-[#B81D22]" />
                Today's Schedule
              </h2>
              <Link href="/teacher/timetable" className="text-sm font-semibold text-[#B81D22] hover:text-[#9E1519] transition-colors">
                View Full Timetable &rarr;
              </Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {schedule.map((item, idx) => (
                <div key={idx} className="p-6 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="sm:w-48 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm font-semibold">
                      <NavIcon name="calendar" className="w-3.5 h-3.5" />
                      {item.time}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900">{item.class}</h4>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <p className="text-sm text-zinc-500 flex items-center gap-1">
                        <NavIcon name="building" className="w-4 h-4" />
                        {item.room}
                      </p>
                      <span className="text-zinc-300 hidden sm:inline">•</span>
                      <p className="text-sm text-zinc-500 flex items-center gap-1">
                        <NavIcon name="layers" className="w-4 h-4" />
                        {item.type}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 mt-3 sm:mt-0">
                    <Link href="/teacher/timetable" className="inline-block px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors w-full sm:w-auto text-center">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <NavIcon name="clipboard" className="w-5 h-5 text-[#B81D22]" />
                Recent Submissions
              </h2>
              <Link href="/teacher/assignments" className="text-sm font-semibold text-[#B81D22] hover:text-[#9E1519] transition-colors">
                View All &rarr;
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Assignment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentSubmissions.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 min-w-[150px]">
                        <div className="font-semibold text-zinc-900">{sub.student}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{sub.class}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-700 font-medium min-w-[200px]">
                        {sub.assignment}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                            sub.status === 'Pending Review'
                              ? 'bg-amber-100 text-amber-800'
                              : sub.status === 'Graded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 text-right whitespace-nowrap">
                        {sub.time}
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
                  <NavIcon name={action.icon as any} className="w-6 h-6" />
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
              <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                <h4 className="font-bold text-sm mb-1">Faculty Meeting</h4>
                <p className="text-xs text-white/80 mb-2">Tomorrow at 4:00 PM in the Main Hall.</p>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded">Mandatory</span>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                <h4 className="font-bold text-sm mb-1">Midterm Grades Due</h4>
                <p className="text-xs text-white/80">Please submit all grades by Friday.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
