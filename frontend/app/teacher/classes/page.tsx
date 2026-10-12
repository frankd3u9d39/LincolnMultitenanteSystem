'use client';

import React from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';

export default function ClassesPage() {
  const classes = [
    { id: 1, name: 'Advanced Mathematics', code: 'MTH301', room: 'Room 402', students: 30, schedule: 'Mon, Wed, Fri (09:00 AM - 10:30 AM)' },
    { id: 2, name: 'Physics Lab', code: 'PHY201', room: 'Science Lab B', students: 28, schedule: 'Tue, Thu (11:00 AM - 12:30 PM)' },
    { id: 3, name: 'Introduction to Calculus', code: 'MTH101', room: 'Room 105', students: 40, schedule: 'Mon, Wed, Fri (02:00 PM - 03:30 PM)' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">My Classes</h1>
          <p className="text-zinc-500 font-medium mt-1">Overview of all classes currently assigned to you.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <NavIcon name="classes" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{cls.name}</h3>
                <p className="text-sm font-bold text-zinc-500">{cls.code}</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <div className="flex items-center text-sm font-medium text-zinc-600 gap-3">
                <NavIcon name="building" className="w-4 h-4 text-zinc-400" />
                {cls.room}
              </div>
              <div className="flex items-center text-sm font-medium text-zinc-600 gap-3">
                <NavIcon name="students" className="w-4 h-4 text-zinc-400" />
                {cls.students} Enrolled Students
              </div>
              <div className="flex items-start text-sm font-medium text-zinc-600 gap-3">
                <NavIcon name="calendar" className="w-4 h-4 text-zinc-400 mt-0.5" />
                {cls.schedule}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-2 rounded-lg text-sm font-bold transition-colors">
                View Roster
              </button>
              <button className="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 py-2 rounded-lg text-sm font-bold transition-colors">
                Class Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
