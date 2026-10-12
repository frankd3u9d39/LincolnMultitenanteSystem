'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Mock Data for Available Courses
const CATALOG_COURSES = [
  { id: 101, name: 'Introduction to AI', code: 'CSC-301', instructor: 'Dr. Alan Turing', credits: 4, schedule: 'Tue, Thu 09:00 AM', category: 'Computer Science', spots: 5, totalSpots: 30, imageColor: 'bg-indigo-600', isNew: true },
  { id: 102, name: 'Creative Writing', code: 'LIT-201', instructor: 'Prof. J.R.R. Tolkien', credits: 3, schedule: 'Mon, Wed 02:00 PM', category: 'Arts', spots: 12, totalSpots: 25, imageColor: 'bg-amber-600', isNew: false },
  { id: 103, name: 'Quantum Mechanics', code: 'PHY-405', instructor: 'Dr. Marie Curie', credits: 4, schedule: 'Fri 10:00 AM', category: 'Physics', spots: 2, totalSpots: 20, imageColor: 'bg-emerald-600', isNew: false },
  { id: 104, name: 'Microeconomics', code: 'ECO-101', instructor: 'Prof. Adam Smith', credits: 3, schedule: 'Mon, Wed, Fri 01:00 PM', category: 'Economics', spots: 0, totalSpots: 40, imageColor: 'bg-blue-600', isNew: false },
  { id: 105, name: 'Modern Art History', code: 'ART-305', instructor: 'Dr. Frida Kahlo', credits: 3, schedule: 'Tue, Thu 11:00 AM', category: 'Arts', spots: 8, totalSpots: 25, imageColor: 'bg-rose-600', isNew: true },
  { id: 106, name: 'Data Structures', code: 'CSC-205', instructor: 'Grace Hopper', credits: 4, schedule: 'Mon, Wed 10:00 AM', category: 'Computer Science', spots: 15, totalSpots: 50, imageColor: 'bg-teal-600', isNew: false },
];

export default function CourseCatalogPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const categories = ['All', 'Computer Science', 'Arts', 'Physics', 'Economics'];

  const filteredCourses = CATALOG_COURSES.filter(c => {
    const matchFilter = filter === 'All' || c.category === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-2 hover:text-zinc-900 transition-colors w-max">
            <Link href="/student/courses" className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to My Courses
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Course Catalog
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Discover and enroll in new classes for the upcoming semester.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 rounded-xl self-start sm:self-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filter === category
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-72 shrink-0">
          <input
            type="text"
            placeholder="Search by name or code..."
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
                  {course.isNew && (
                    <span className="bg-[#B81D22] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase shadow-sm">
                      New
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

              {/* Availability */}
              <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Availability</span>
                  <span className={`text-xs font-bold ${course.spots === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {course.spots === 0 ? 'Full' : `${course.spots} spots left`}
                  </span>
                </div>
                
                <button 
                  disabled={course.spots === 0}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    course.spots === 0 
                      ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      : 'bg-zinc-900 text-white hover:bg-[#B81D22] shadow-md shadow-zinc-900/10'
                  }`}
                >
                  {course.spots === 0 ? 'Waitlist' : 'Enroll'}
                </button>
              </div>
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
