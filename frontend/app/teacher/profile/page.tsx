'use client';

import React from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">My Profile</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage your personal information and preferences.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-5 py-2.5 rounded-lg font-semibold transition-all">
          <NavIcon name="cog" className="w-5 h-5" />
          Edit Profile
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#B81D22] to-[#801217]"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-zinc-200 flex items-center justify-center text-zinc-500 shadow-md">
              <NavIcon name="user" className="w-10 h-10" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-zinc-900">Prof. Vance</h2>
          <p className="text-zinc-500 font-medium mt-1">Senior Mathematics Instructor</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500">
                    <NavIcon name="bell" className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-500">Email Address</div>
                    <div className="text-sm font-semibold text-zinc-900">vance.prof@lincoln.edu</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500">
                    <NavIcon name="calendar" className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-500">Phone Number</div>
                    <div className="text-sm font-semibold text-zinc-900">+1 (555) 123-4567</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Academic Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500">
                    <NavIcon name="building" className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-500">Department</div>
                    <div className="text-sm font-semibold text-zinc-900">Mathematics & Sciences</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500">
                    <NavIcon name="clipboard" className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-500">Join Date</div>
                    <div className="text-sm font-semibold text-zinc-900">August 2021</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
