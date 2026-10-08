'use client';

import React, { useState } from 'react';

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState('Account');
  
  const tabs = ['Account', 'Preferences', 'Notifications', 'Security'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Manage your account preferences, security, and notification settings.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b md:border-b-0 border-zinc-200">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-bold rounded-xl text-left whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full space-y-6">
          
          {activeTab === 'Account' && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
              <div>
                <h2 className="text-lg font-black text-zinc-900 tracking-tight mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Primary Email</label>
                    <input disabled type="email" value="liam.chen@student.lincoln.edu" className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed" />
                    <p className="text-[10px] text-zinc-400 mt-1.5">Your primary email cannot be changed. Contact IT support if you need assistance.</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Recovery Email</label>
                    <input type="email" placeholder="e.g. liam.chen@gmail.com" className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <h2 className="text-lg font-black text-red-600 tracking-tight mb-4">Danger Zone</h2>
                <button className="px-4 py-2 bg-red-50 text-red-700 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-200">
                  Deactivate Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Preferences' && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
              <div>
                <h2 className="text-lg font-black text-zinc-900 tracking-tight mb-4">Display Preferences</h2>
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">System Theme</label>
                    <div className="flex items-center gap-3">
                      {['Light', 'Dark', 'System'].map(theme => (
                        <label key={theme} className="flex-1 cursor-pointer">
                          <input type="radio" name="theme" value={theme} className="peer sr-only" defaultChecked={theme === 'Light'} />
                          <div className="px-4 py-3 text-center text-sm font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl peer-checked:bg-zinc-900 peer-checked:text-white peer-checked:border-zinc-900 hover:border-zinc-300 transition-all">
                            {theme}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Language</label>
                    <select className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all appearance-none cursor-pointer">
                      <option>English (US)</option>
                      <option>Spanish (ES)</option>
                      <option>French (FR)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-zinc-900 tracking-tight mb-2">Notification Settings</h2>
              
              <div className="divide-y divide-zinc-100">
                {[
                  { title: 'Academic Alerts', desc: 'Receive notifications about grades, assignments, and timetable changes.', default: true },
                  { title: 'Finance & Fees', desc: 'Alerts regarding tuition deadlines, payments, and missing fees.', default: true },
                  { title: 'Campus News', desc: 'General announcements and campus-wide alerts.', default: false },
                  { title: 'Weekly Summary', desc: 'A weekly email digest of your upcoming schedule and pending tasks.', default: true },
                ].map((item, idx) => (
                  <div key={idx} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" defaultChecked={item.default} />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B81D22]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
              <div>
                <h2 className="text-lg font-black text-zinc-900 tracking-tight mb-4">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all" />
                  </div>
                  <button className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm w-max mt-2">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-black text-zinc-900 tracking-tight">Two-Factor Authentication</h2>
                    <p className="text-xs text-zinc-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <button className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors shadow-sm whitespace-nowrap">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Global Save Button for forms */}
          {activeTab !== 'Security' && (
            <div className="flex justify-end pt-4">
              <button className="px-6 py-2.5 bg-[#B81D22] text-white text-sm font-bold rounded-xl hover:bg-[#9E1519] transition-colors shadow-md shadow-red-900/10 w-full sm:w-auto">
                Save Changes
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
