'use client';

import React, { useState } from 'react';

// Mock Data for the week
const SCHEDULE: Record<string, any[]> = {
  Monday: [
    { id: 1, time: '09:00 AM - 10:30 AM', course: 'Advanced Physics (PHY-401)', type: 'Lecture', location: 'Room 304, Science Block', instructor: 'Dr. Sarah Jenkins', color: 'bg-emerald-500' },
    { id: 2, time: '11:00 AM - 12:30 PM', course: 'Calculus III (MAT-302)', type: 'Lecture', location: 'Hall B, Main Building', instructor: 'Prof. David Mercer', color: 'bg-blue-500' },
    { id: 3, time: '02:00 PM - 04:00 PM', course: 'Computer Science (CSC-201)', type: 'Lab', location: 'Lab 4, Tech Center', instructor: 'Alan Turing', color: 'bg-indigo-500' },
  ],
  Tuesday: [
    { id: 4, time: '10:00 AM - 11:30 AM', course: 'English Literature (LIT-105)', type: 'Seminar', location: 'Room 102, Arts Wing', instructor: 'Eleanor Vance', color: 'bg-amber-500' },
    { id: 5, time: '01:00 PM - 02:30 PM', course: 'World History (HIS-204)', type: 'Lecture', location: 'Hall C, Main Building', instructor: 'Dr. Julian Thorne', color: 'bg-rose-500' },
  ],
  Wednesday: [
    { id: 6, time: '09:00 AM - 10:30 AM', course: 'Advanced Physics (PHY-401)', type: 'Lecture', location: 'Room 304, Science Block', instructor: 'Dr. Sarah Jenkins', color: 'bg-emerald-500' },
    { id: 7, time: '11:00 AM - 12:30 PM', course: 'Calculus III (MAT-302)', type: 'Tutorial', location: 'Room 205, Math Dept', instructor: 'Prof. David Mercer', color: 'bg-blue-500' },
    { id: 11, time: '02:00 PM - 04:00 PM', course: 'Computer Science (CSC-201)', type: 'Lecture', location: 'Hall D, Tech Center', instructor: 'Alan Turing', color: 'bg-indigo-500' },
  ],
  Thursday: [
    { id: 8, time: '10:00 AM - 11:30 AM', course: 'English Literature (LIT-105)', type: 'Lecture', location: 'Room 102, Arts Wing', instructor: 'Eleanor Vance', color: 'bg-amber-500' },
    { id: 9, time: '01:00 PM - 04:00 PM', course: 'Organic Chemistry (CHE-301)', type: 'Lab', location: 'Chemistry Lab 2', instructor: 'Dr. Fiona Gallagher', color: 'bg-teal-500' },
  ],
  Friday: [
    { id: 10, time: '08:00 AM - 10:00 AM', course: 'Organic Chemistry (CHE-301)', type: 'Lecture', location: 'Hall A, Science Block', instructor: 'Dr. Fiona Gallagher', color: 'bg-teal-500' },
  ]
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function StudentTimetablePage() {
  // Try to default to current day if it's a weekday, otherwise Monday
  const currentDayIndex = new Date().getDay();
  const defaultDay = (currentDayIndex >= 1 && currentDayIndex <= 5) ? DAYS[currentDayIndex - 1] : 'Monday';
  
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const todaysClasses = SCHEDULE[selectedDay] || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Class Timetable
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            View your weekly academic schedule and classroom locations.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Sync Calendar
          </button>
        </div>
      </div>

      {/* Days Selector */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100/80 rounded-2xl overflow-x-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-bold rounded-xl transition-all ${
              selectedDay === day
                ? 'bg-white text-[#B81D22] shadow-sm ring-1 ring-zinc-200/50'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Timeline */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-black text-zinc-900 mb-8 border-l-4 border-[#B81D22] pl-3">
          {selectedDay}'s Schedule
        </h2>

        {todaysClasses.length > 0 ? (
          <div className="relative border-l-2 border-zinc-100 ml-4 space-y-10 pb-4">
            {todaysClasses.map((cls, idx) => (
              <div key={cls.id} className="relative pl-8 sm:pl-10 group">
                {/* Timeline Dot */}
                <span className={`absolute -left-[11px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${cls.color}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                </span>

                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 transition-transform group-hover:translate-x-1 duration-300">
                  
                  {/* Time Block */}
                  <div className="flex flex-col shrink-0 sm:w-32 pt-0.5">
                    <span className="text-sm font-black text-zinc-900">{cls.time.split(' - ')[0]}</span>
                    <span className="text-xs font-bold text-zinc-400">to {cls.time.split(' - ')[1]}</span>
                  </div>

                  {/* Card Detail */}
                  <div className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl p-5 hover:bg-zinc-100/80 hover:border-zinc-200 transition-colors shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-zinc-900 group-hover:text-[#B81D22] transition-colors">
                        {cls.course}
                      </h3>
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md text-white ${cls.color}`}>
                        {cls.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-medium text-zinc-600 mt-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>{cls.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>{cls.instructor}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
            <svg className="w-12 h-12 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-bold text-zinc-900">No classes scheduled</h3>
            <p className="text-xs text-zinc-500 mt-1">You have a free day today! Enjoy your time off.</p>
          </div>
        )}
      </div>
    </div>
  );
}
