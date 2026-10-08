'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Mock Data
const COURSES = [
  { id: 1, name: 'Advanced Physics', code: 'PHY-401', instructor: 'Dr. Sarah Jenkins', credits: 4, schedule: 'Mon, Wed 09:00 AM', progress: 68, imageColor: 'bg-emerald-600', status: 'In Progress' },
  { id: 2, name: 'Calculus III', code: 'MAT-302', instructor: 'Prof. David Mercer', credits: 4, schedule: 'Tue, Thu 11:00 AM', progress: 45, imageColor: 'bg-blue-600', status: 'In Progress' },
  { id: 3, name: 'Computer Science', code: 'CSC-201', instructor: 'Alan Turing', credits: 3, schedule: 'Mon, Wed 02:00 PM', progress: 82, imageColor: 'bg-indigo-600', status: 'In Progress' },
  { id: 4, name: 'English Literature', code: 'LIT-105', instructor: 'Eleanor Vance', credits: 3, schedule: 'Fri 10:00 AM', progress: 30, imageColor: 'bg-amber-600', status: 'In Progress' },
  { id: 5, name: 'World History', code: 'HIS-204', instructor: 'Dr. Julian Thorne', credits: 3, schedule: 'Tue, Thu 01:00 PM', progress: 100, imageColor: 'bg-rose-600', status: 'Completed' },
  { id: 6, name: 'Organic Chemistry', code: 'CHE-301', instructor: 'Dr. Fiona Gallagher', credits: 4, schedule: 'Mon, Wed, Fri 08:00 AM', progress: 12, imageColor: 'bg-teal-600', status: 'In Progress' },
];

export default function StudentCoursesPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredCourses = COURSES.filter(c => {
    const matchFilter = filter === 'All' || c.status === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            My Courses
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Access course materials, assignments, and syllabus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/student/courses/catalog"
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl inline-flex self-start sm:self-auto">
          {['All', 'In Progress', 'Completed'].map((status) => (
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
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
          />
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <div key={course.id} className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
            
            {/* Top Color Banner */}
            <div className={`h-24 w-full ${course.imageColor} relative p-4 flex flex-col justify-between overflow-hidden`}>
               {/* Decorative Pattern */}
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:16px_16px]"></div>
               <div className="relative z-10 flex justify-between items-start">
                  <span className="bg-white/20 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-white/20 shadow-sm">
                    {course.code}
                  </span>
                  {course.status === 'Completed' && (
                    <span className="bg-white text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase shadow-sm">
                      Completed
                    </span>
                  )}
               </div>
            </div>
            
            {/* Body */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-1 group-hover:text-[#B81D22] transition-colors line-clamp-1">{course.name}</h3>
              <p className="text-xs font-medium text-zinc-500 mb-5 line-clamp-1">{course.instructor}</p>

              {/* Meta Details */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-[11px] text-zinc-600">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="truncate">{course.schedule}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span className="truncate">{course.credits} Credits</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-auto space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <span>Course Progress</span>
                  <span className="text-zinc-700">{course.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${course.progress === 100 ? 'bg-emerald-500' : 'bg-[#B81D22]'}`} 
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50">
              <Link href={`/student/courses/${course.id}`} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-zinc-700 hover:text-[#B81D22] transition-colors py-1">
                <span>View Course Material</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
          <svg className="w-12 h-12 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h3 className="text-sm font-bold text-zinc-900">No courses found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">We couldn't find any courses matching your current filters or search query.</p>
        </div>
      )}
    </div>
  );
}
