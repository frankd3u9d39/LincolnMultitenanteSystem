'use client';

import React from 'react';
import Link from 'next/link';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { getDashboard } from '@/modules/admin/services/api';

export default function AdminDashboardPage() {
  const { data, loading, error, reload } = useAsync((signal) => getDashboard(signal), []);

  if (loading) {
    return <LoadingBlock rows={6} label="Loading dashboard" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />;
  }

  const { school, counts, outstandingFees, recentAnnouncements } = data;

  const cards = [
    { label: 'Students', value: counts.students, href: '/admin/students', color: 'text-blue-600 bg-blue-50' },
    { label: 'Teachers', value: counts.teachers, href: '/admin/teachers', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Classes', value: counts.classes, href: '/admin/classes', color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Subjects', value: (counts as any).subjects ?? counts.courses, href: '/admin/subjects', color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{school.name}</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {school.code} &middot; Academic year {school.academicYear ?? '—'}
          </p>
        </div>
        <Link
          href="/admin/announcements"
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          Post Announcement
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-black tracking-tight ${c.color.split(' ')[0]}`}>{c.value}</p>
            <p className="text-[10px] text-zinc-400 mt-2">
              {c.label === 'Students' ? `of ${school.maxStudents} capacity` : c.label === 'Teachers' ? `of ${school.maxTeachers} capacity` : 'Manage →'}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900">Outstanding Fees</h2>
            <Link href="/admin/fees" className="text-xs font-semibold text-[#B81D22] hover:underline">
              Manage Fees &rarr;
            </Link>
          </div>
          <p className="text-4xl font-black text-zinc-900 tracking-tight">
            ₦{outstandingFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-zinc-500 mt-2">Total unpaid across all students this term.</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-zinc-900">Recent Announcements</h2>
            <Link href="/admin/announcements" className="text-xs font-semibold text-[#B81D22] hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentAnnouncements.length === 0 && <p className="text-xs text-zinc-400">No announcements yet.</p>}
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  <span>{a.audience}</span>
                  <span>{a.date}</span>
                </div>
                <p className="text-sm font-semibold text-zinc-800">{a.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
