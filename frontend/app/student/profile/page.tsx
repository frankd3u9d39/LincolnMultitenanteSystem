'use client';

import React from 'react';

// Mock Student Profile Data
const STUDENT = {
  name: 'Liam Chen',
  id: 'STU-2024-8901',
  email: 'liam.chen@student.lincoln.edu',
  phone: '+1 (555) 123-4567',
  dob: 'August 14, 2005',
  address: '123 Campus Drive, Apt 4B, University City, ST 12345',
  
  program: 'B.S. Computer Science',
  department: 'College of Engineering',
  enrollmentDate: 'September 1, 2024',
  expectedGraduation: 'May 2028',
  advisor: 'Dr. Sarah Jenkins',
  status: 'Active',
  
  emergencyContact: {
    name: 'Michael Chen',
    relation: 'Father',
    phone: '+1 (555) 987-6543',
  }
};

export default function StudentProfilePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        {/* Decorative Background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B81D22] rounded-full mix-blend-multiply filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-100 border-4 border-white shadow-md flex items-center justify-center text-zinc-300 overflow-hidden shrink-0">
            <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-white border border-zinc-200 rounded-full shadow-sm text-zinc-500 hover:text-[#B81D22] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
        
        <div className="flex-1 text-center sm:text-left z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{STUDENT.name}</h1>
              <p className="text-sm font-bold text-zinc-500">{STUDENT.id}</p>
            </div>
            <span className="inline-flex items-center justify-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded border border-emerald-200 w-max mx-auto sm:mx-0">
              {STUDENT.status}
            </span>
          </div>
          <p className="text-zinc-700 font-medium">{STUDENT.program}</p>
          <p className="text-sm text-zinc-500">{STUDENT.department}</p>
        </div>
      </div>

      {/* Grid Layout for Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal Information */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">Personal Information</h2>
            <button className="text-xs font-bold text-[#B81D22] hover:text-[#9E1519] transition-colors">Edit</button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Address</p>
              <p className="text-sm font-medium text-zinc-900">{STUDENT.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone Number</p>
              <p className="text-sm font-medium text-zinc-900">{STUDENT.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Date of Birth</p>
              <p className="text-sm font-medium text-zinc-900">{STUDENT.dob}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Permanent Address</p>
              <p className="text-sm font-medium text-zinc-900">{STUDENT.address}</p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-zinc-900 tracking-tight mb-6">Academic Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Program of Study</p>
              <p className="text-sm font-medium text-zinc-900">{STUDENT.program}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Enrollment Date</p>
              <p className="text-sm font-medium text-zinc-900">{STUDENT.enrollmentDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Expected Graduation</p>
              <p className="text-sm font-medium text-zinc-900">{STUDENT.expectedGraduation}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Academic Advisor</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                  SJ
                </div>
                <p className="text-sm font-medium text-zinc-900">{STUDENT.advisor}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">Emergency Contact</h2>
            <button className="text-xs font-bold text-[#B81D22] hover:text-[#9E1519] transition-colors">Edit</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contact Name</p>
              <p className="text-sm font-bold text-zinc-900">{STUDENT.emergencyContact.name}</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Relationship</p>
              <p className="text-sm font-bold text-zinc-900">{STUDENT.emergencyContact.relation}</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone Number</p>
              <p className="text-sm font-bold text-zinc-900">{STUDENT.emergencyContact.phone}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
