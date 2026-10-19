'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { getResultOverview } from '@/modules/admin/services/api';

export default function AdminResultsPage() {
  const [search, setSearch] = useState('');
  const [standingFilter, setStandingFilter] = useState('all');

  const { data, loading, error, reload } = useAsync((signal) => getResultOverview(signal), []);

  if (loading) {
    return <LoadingBlock rows={6} label="Loading examination results & GPA statistics" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to load examination results.'} onRetry={reload} />;
  }

  const { summary, gpaDistribution, rankings } = data;

  const filteredRankings = rankings.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.idNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesStanding =
      standingFilter === 'all' ||
      (standingFilter === 'honors' && r.gpa >= 3.5) ||
      (standingFilter === 'good' && r.gpa >= 3.0 && r.gpa < 3.5) ||
      (standingFilter === 'pass' && r.gpa >= 2.0 && r.gpa < 3.0) ||
      (standingFilter === 'warning' && r.gpa < 2.0);
    return matchesSearch && matchesStanding;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Academic Results & Performance</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Institutional examination grading records, GPA distribution, honors roll, and transcript metrics.
          </p>
        </div>
        <button
          onClick={() => alert('Official institutional grades PDF generated and downloaded successfully.')}
          className="px-4 py-2 rounded-xl bg-white border border-zinc-300 text-zinc-800 text-xs font-bold hover:bg-zinc-50 shadow-sm"
        >
          Export Transcripts Batch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Campus Average GPA</p>
          <p className="text-3xl font-black tracking-tight text-[#B81D22]">{summary.campusAverageGpa.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Cumulative 4.0 scale</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Assessed Students</p>
          <p className="text-3xl font-black tracking-tight text-zinc-900">{summary.totalStudentsAssessed}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Completed examinations</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Overall Pass Rate</p>
          <p className="text-3xl font-black tracking-tight text-emerald-600">{summary.passRate}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Graded above threshold</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Dean&apos;s Honours</p>
          <p className="text-3xl font-black tracking-tight text-blue-600">{summary.honorsCount}</p>
          <p className="text-[10px] text-zinc-400 mt-2">GPA &ge; 3.50 Distinction</p>
        </div>
      </div>

      {/* GPA Distribution Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gpaDistribution.map((tier) => (
          <div key={tier.bracket} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-zinc-700">{tier.bracket}</p>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-zinc-900">{tier.count} Students</span>
              <span className="text-xs font-black text-zinc-500">{tier.percentage}%</span>
            </div>
            <div className="mt-2 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#B81D22] h-full rounded-full" style={{ width: `${tier.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search by student name, ID, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#B81D22]"
        />

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Students' },
            { id: 'honors', label: "Dean's List" },
            { id: 'good', label: 'Good Standing' },
            { id: 'warning', label: 'Academic Notice' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setStandingFilter(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                standingFilter === btn.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student Rankings Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">ID Number</th>
              <th className="py-3 px-4 text-center">GPA</th>
              <th className="py-3 px-4 text-center">Average Score</th>
              <th className="py-3 px-4 text-center">Courses Passed</th>
              <th className="py-3 px-4 text-center">Academic Standing</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {filteredRankings.map((st) => (
              <tr key={st.id} className="hover:bg-zinc-50/60 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-bold text-zinc-900">{st.name}</p>
                  <p className="text-[11px] text-zinc-500">{st.email}</p>
                </td>
                <td className="py-3 px-4 font-mono font-medium text-zinc-800">{st.idNumber}</td>
                <td className="py-3 px-4 text-center">
                  <span className="font-black text-sm text-[#B81D22]">{st.gpa.toFixed(2)}</span>
                </td>
                <td className="py-3 px-4 text-center font-bold text-zinc-900">{st.averageScore}%</td>
                <td className="py-3 px-4 text-center text-zinc-600">{st.coursesPassed} / {st.creditsEarned} Cr</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      st.gpa >= 3.5
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : st.gpa >= 3.0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : st.gpa >= 2.0
                        ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {st.standing}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => alert(`Transcript for ${st.name} downloaded.`)}
                    className="text-xs font-bold text-[#B81D22] hover:underline"
                  >
                    Transcript &rarr;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
