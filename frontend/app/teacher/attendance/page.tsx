'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';

export default function AttendancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const classes = [
    { id: 1, name: 'Advanced Mathematics (MTH301)', time: '09:00 AM - 10:30 AM', students: 30, attendanceTaken: false },
    { id: 2, name: 'Physics Lab (PHY201)', time: '11:00 AM - 12:30 PM', students: 28, attendanceTaken: true },
    { id: 3, name: 'Introduction to Calculus (MTH101)', time: '02:00 PM - 03:30 PM', students: 40, attendanceTaken: false },
  ];

  const handleTakeAttendance = (className: string) => {
    setSelectedClass(className);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Attendance</h1>
          <p className="text-zinc-500 font-medium mt-1">Record and manage daily attendance for your classes.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${cls.attendanceTaken ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <NavIcon name="checkCircle" className="w-6 h-6" />
                </div>
                {cls.attendanceTaken ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Completed</span>
                ) : (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Pending</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">{cls.name}</h3>
              <div className="space-y-2 mt-4 text-sm font-medium text-zinc-600">
                <div className="flex items-center gap-2">
                  <NavIcon name="calendar" className="w-4 h-4 text-zinc-400" />
                  {cls.time}
                </div>
                <div className="flex items-center gap-2">
                  <NavIcon name="students" className="w-4 h-4 text-zinc-400" />
                  {cls.students} Enrolled Students
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleTakeAttendance(cls.name)}
              className={`mt-6 w-full py-2.5 rounded-lg font-bold transition-colors ${
              cls.attendanceTaken 
                ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' 
                : 'bg-[#B81D22] text-white hover:bg-[#9E1519] shadow-sm'
            }`}>
              {cls.attendanceTaken ? 'Edit Attendance' : 'Take Attendance'}
            </button>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Attendance: ${selectedClass}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
            <NavIcon name="checkCircle" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-amber-800">
              Quickly mark attendance. By default, all students are marked as Present. Only uncheck those who are absent or late.
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto pr-2 space-y-2 border border-zinc-200 rounded-lg p-2">
            {[...Array(8)].map((_, i) => (
              <label key={i} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-bold text-zinc-600">
                    S{i+1}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 text-sm">Student Name {i+1}</span>
                    <p className="text-xs text-zinc-500">STD-00{i+1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select defaultValue="Present" className="text-xs bg-transparent border-none focus:ring-0 text-zinc-500 font-semibold cursor-pointer">
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option>Absent</option>
                    <option>Excused</option>
                  </select>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-lg font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-lg font-bold bg-[#B81D22] hover:bg-[#9E1519] text-white shadow-md transition-colors"
            >
              Save Attendance
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
