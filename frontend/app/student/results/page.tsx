'use client';

import React, { useState } from 'react';

// Mock Data
const ACADEMIC_SUMMARY = {
  cgpa: 3.84,
  totalCredits: 42,
  standing: "First Class Honors",
  rank: "12th / 450",
};

const RESULTS_HISTORY = [
  {
    term: 'Spring Semester 2026',
    tgpa: 3.9,
    courses: [
      { id: 1, name: 'Calculus II', code: 'MAT-201', credits: 4, grade: 'A', score: 94 },
      { id: 2, name: 'Physics Mechanics', code: 'PHY-101', credits: 4, grade: 'A-', score: 91 },
      { id: 3, name: 'Introduction to Programming', code: 'CSC-101', credits: 3, grade: 'A', score: 98 },
      { id: 4, name: 'Logic and Critical Thinking', code: 'PHI-102', credits: 2, grade: 'B+', score: 87 },
    ]
  },
  {
    term: 'Fall Semester 2025',
    tgpa: 3.78,
    courses: [
      { id: 5, name: 'Calculus I', code: 'MAT-101', credits: 4, grade: 'B+', score: 88 },
      { id: 6, name: 'English Composition', code: 'ENG-101', credits: 3, grade: 'A', score: 95 },
      { id: 7, name: 'World History', code: 'HIS-101', credits: 3, grade: 'A-', score: 90 },
      { id: 8, name: 'Biology Fundamentals', code: 'BIO-101', credits: 4, grade: 'A', score: 96 },
    ]
  }
];

const getGradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (grade.startsWith('B')) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (grade.startsWith('C')) return 'text-amber-700 bg-amber-50 border-amber-200';
  if (grade.startsWith('D') || grade.startsWith('F')) return 'text-red-700 bg-red-50 border-red-200';
  return 'text-zinc-700 bg-zinc-50 border-zinc-200';
};

export default function StudentResultsPage() {
  const [selectedTerm, setSelectedTerm] = useState('All');

  const terms = ['All', ...RESULTS_HISTORY.map(r => r.term)];

  const displayedResults = selectedTerm === 'All' 
    ? RESULTS_HISTORY 
    : RESULTS_HISTORY.filter(r => r.term === selectedTerm);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Exam Results
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            View your academic performance, grades, and transcripts.
          </p>
        </div>
        <button className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-[#B81D22] transition-colors shadow-sm flex items-center gap-2 w-max">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download Transcript
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cumulative GPA', value: ACADEMIC_SUMMARY.cgpa.toFixed(2), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'text-[#B81D22]' },
          { label: 'Total Credits', value: ACADEMIC_SUMMARY.totalCredits, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-amber-500' },
          { label: 'Class Rank', value: ACADEMIC_SUMMARY.rank, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'text-blue-500' },
          { label: 'Academic Standing', value: ACADEMIC_SUMMARY.standing, icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', color: 'text-emerald-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start gap-4">
            <div className={`p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 ${stat.color}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">{stat.label}</p>
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl inline-flex overflow-x-auto w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {terms.map((term) => (
          <button
            key={term}
            onClick={() => setSelectedTerm(term)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              selectedTerm === term
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {term}
          </button>
        ))}
      </div>

      {/* Results Tables */}
      <div className="space-y-8">
        {displayedResults.map((termRecord, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-zinc-900">{termRecord.term}</h3>
              <div className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm w-max">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Term GPA:</span>
                <span className="text-[#B81D22] text-sm">{termRecord.tgpa.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 min-w-[500px]">
                <thead className="text-[10px] uppercase tracking-wider text-zinc-500 bg-white border-b border-zinc-100">
                  <tr>
                    <th className="px-5 py-3 font-bold whitespace-nowrap">Course Code</th>
                    <th className="px-5 py-3 font-bold whitespace-nowrap">Course Name</th>
                    <th className="px-5 py-3 font-bold text-center whitespace-nowrap">Credits</th>
                    <th className="px-5 py-3 font-bold text-center whitespace-nowrap">Score</th>
                    <th className="px-5 py-3 font-bold text-right whitespace-nowrap">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {termRecord.courses.map((course) => (
                    <tr key={course.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-zinc-900 whitespace-nowrap">{course.code}</td>
                      <td className="px-5 py-4 font-medium text-zinc-700 whitespace-nowrap">{course.name}</td>
                      <td className="px-5 py-4 text-center text-zinc-500 whitespace-nowrap">{course.credits}</td>
                      <td className="px-5 py-4 text-center font-bold text-zinc-700 whitespace-nowrap">{course.score}%</td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-black rounded-md border ${getGradeColor(course.grade)}`}>
                          {course.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
