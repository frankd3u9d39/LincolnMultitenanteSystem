'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Mock Data for Assignments
const ASSIGNMENTS = [
  { id: 1, title: 'Chapter 4: Thermodynamics Problem Set', course: 'Advanced Physics (PHY-401)', dueDate: '2026-10-10T23:59:00', status: 'Pending', type: 'Homework', points: 100 },
  { id: 2, title: 'Midterm Essay on Hamlet', course: 'English Literature (LIT-105)', dueDate: '2026-10-12T17:00:00', status: 'Pending', type: 'Essay', points: 200 },
  { id: 3, title: 'Binary Trees Implementation', course: 'Data Structures (CSC-205)', dueDate: '2026-10-05T23:59:00', status: 'Overdue', type: 'Project', points: 150 },
  { id: 4, title: 'Lab Report: Titration', course: 'Organic Chemistry (CHE-301)', dueDate: '2026-10-01T23:59:00', status: 'Submitted', type: 'Lab', points: 50 },
  { id: 5, title: 'Limits and Continuity Quiz', course: 'Calculus III (MAT-302)', dueDate: '2026-09-28T12:00:00', status: 'Graded', type: 'Quiz', points: 20, score: 18 },
  { id: 6, title: 'Algorithm Complexity Analysis', course: 'Computer Science (CSC-201)', dueDate: '2026-10-08T23:59:00', status: 'Pending', type: 'Assignment', points: 100 },
];

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Overdue':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Submitted':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Graded':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-zinc-50 text-zinc-700 border-zinc-200';
  }
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export default function StudentAssignmentsPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const statuses = ['All', 'Pending', 'Submitted', 'Graded', 'Overdue'];

  const filteredAssignments = ASSIGNMENTS.filter(a => {
    const matchFilter = filter === 'All' || a.status === filter;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.course.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Assignments
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage your coursework, track due dates, and submit assignments.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 rounded-xl self-start sm:self-auto">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filter === status
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-72 shrink-0">
          <input
            type="text"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <div 
            key={assignment.id} 
            className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-all"
          >
            {/* Left: Icon & Details */}
            <div className="flex items-start gap-4 flex-1">
              {/* Type Icon Container */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-[#B81D22]/10 group-hover:text-[#B81D22] transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <div className="flex flex-col">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-[#B81D22] transition-colors line-clamp-1">
                  {assignment.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{assignment.course}</p>
                
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] font-medium text-zinc-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Due: {formatDate(assignment.dueDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    {assignment.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {assignment.points} Points
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-zinc-100 sm:w-48 shrink-0">
              <div className="flex flex-col sm:items-end gap-1.5 w-full">
                <span className={`px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-md border ${getStatusStyles(assignment.status)}`}>
                  {assignment.status}
                </span>
                {assignment.status === 'Graded' && assignment.score !== undefined && (
                  <span className="text-xs font-bold text-zinc-900">Score: {assignment.score} / {assignment.points}</span>
                )}
              </div>

              <div className="w-full sm:w-auto">
                {assignment.status === 'Pending' || assignment.status === 'Overdue' ? (
                  <button className="w-full sm:w-auto px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-[#B81D22] transition-colors shadow-sm">
                    Submit Work
                  </button>
                ) : (
                  <button className="w-full sm:w-auto px-4 py-2 bg-white text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg hover:bg-zinc-50 transition-colors shadow-sm">
                    {assignment.status === 'Graded' ? 'View Feedback' : 'View Submission'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
          <svg className="w-12 h-12 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-bold text-zinc-900">No assignments found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">You have no assignments matching the selected filters.</p>
        </div>
      )}
    </div>
  );
}
