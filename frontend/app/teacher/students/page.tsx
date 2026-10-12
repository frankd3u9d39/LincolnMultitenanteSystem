'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { listAllStudents } from '@/modules/teacher/services/api';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useAsync((signal) => listAllStudents(signal), []);

  if (loading) {
    return <LoadingBlock rows={6} label="Loading students" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />;
  }

  const students = data.filter(
    (s) => s.user.name.toLowerCase().includes(search.toLowerCase()) || s.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Student Roster</h1>
          <p className="text-zinc-500 font-medium mt-1">View and manage students enrolled in your classes.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
            />
            <div className="absolute left-3 top-2.5 text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">ID / Email</th>
                <th className="px-6 py-4">Grade Level</th>
                <th className="px-6 py-4">Classes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {students.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400">No students found.</td></tr>
              )}
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-bold">
                        {student.user.name.charAt(0)}
                      </div>
                      <div className="font-bold text-zinc-900">{student.user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-zinc-800">{student.student_id_number ?? '—'}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{student.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      {student.grade_level ?? 'Not set'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    {student.classNames.join(', ')}
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
