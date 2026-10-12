'use client';

import React from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';

export default function TimetablePage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['09:00 AM', '11:00 AM', '02:00 PM'];
  
  const schedule: Record<string, any> = {
    'Monday-09:00 AM': { class: 'Advanced Mathematics (MTH301)', room: 'Room 402', color: 'bg-blue-50 border-blue-200' },
    'Monday-02:00 PM': { class: 'Introduction to Calculus (MTH101)', room: 'Room 105', color: 'bg-emerald-50 border-emerald-200' },
    'Tuesday-11:00 AM': { class: 'Physics Lab (PHY201)', room: 'Science Lab B', color: 'bg-amber-50 border-amber-200' },
    'Wednesday-09:00 AM': { class: 'Advanced Mathematics (MTH301)', room: 'Room 402', color: 'bg-blue-50 border-blue-200' },
    'Wednesday-02:00 PM': { class: 'Introduction to Calculus (MTH101)', room: 'Room 105', color: 'bg-emerald-50 border-emerald-200' },
    'Thursday-11:00 AM': { class: 'Physics Lab (PHY201)', room: 'Science Lab B', color: 'bg-amber-50 border-amber-200' },
    'Friday-09:00 AM': { class: 'Advanced Mathematics (MTH301)', room: 'Room 402', color: 'bg-blue-50 border-blue-200' },
    'Friday-02:00 PM': { class: 'Introduction to Calculus (MTH101)', room: 'Room 105', color: 'bg-emerald-50 border-emerald-200' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Class Timetable</h1>
          <p className="text-zinc-500 font-medium mt-1">Your weekly teaching schedule.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm">
          <NavIcon name="calendar" className="w-5 h-5" />
          Print Schedule
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-6 py-4 border-b border-r border-zinc-100 text-zinc-500 text-xs uppercase tracking-wider font-semibold w-24">Time</th>
                {days.map(day => (
                  <th key={day} className="px-6 py-4 border-b border-zinc-100 text-zinc-800 font-bold text-center w-1/5">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map(time => (
                <tr key={time} className="divide-x divide-zinc-100 border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-6 bg-zinc-50/50 text-xs font-bold text-zinc-500 text-center whitespace-nowrap">{time}</td>
                  {days.map(day => {
                    const session = schedule[`${day}-${time}`];
                    return (
                      <td key={`${day}-${time}`} className="p-3 align-top h-32">
                        {session ? (
                          <div className={`p-3 rounded-lg border h-full ${session.color}`}>
                            <div className="font-bold text-zinc-900 text-sm mb-1">{session.class}</div>
                            <div className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
                              <NavIcon name="building" className="w-3 h-3" />
                              {session.room}
                            </div>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
