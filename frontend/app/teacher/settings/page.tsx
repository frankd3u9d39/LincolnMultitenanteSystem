'use client';

import React from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Settings</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 divide-y divide-zinc-100">
        <div className="p-6 md:p-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <NavIcon name="bell" className="w-5 h-5 text-zinc-400" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-800">Email Notifications</p>
                <p className="text-sm text-zinc-500">Receive daily digest of activities.</p>
              </div>
              <div className="w-11 h-6 bg-[#B81D22] rounded-full flex items-center p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full translate-x-5 transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-800">Push Notifications</p>
                <p className="text-sm text-zinc-500">Receive alerts on your device.</p>
              </div>
              <div className="w-11 h-6 bg-zinc-200 rounded-full flex items-center p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <NavIcon name="shield" className="w-5 h-5 text-zinc-400" />
            Security
          </h2>
          <div className="space-y-4">
            <button className="text-sm font-semibold text-[#B81D22] hover:text-[#9E1519] border border-zinc-200 rounded-lg px-4 py-2 hover:bg-zinc-50 transition-colors">
              Change Password
            </button>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="font-bold text-zinc-800">Two-Factor Authentication</p>
                <p className="text-sm text-zinc-500">Enhance your account security.</p>
              </div>
              <button className="text-sm font-semibold text-zinc-700 bg-zinc-100 rounded-lg px-4 py-2 hover:bg-zinc-200 transition-colors">
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
