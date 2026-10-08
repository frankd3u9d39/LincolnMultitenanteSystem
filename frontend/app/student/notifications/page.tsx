'use client';

import React, { useState } from 'react';

// Mock Data
const NOTIFICATIONS = [
  { id: 1, title: 'Tuition Payment Due', message: 'Your Fall 2026 tuition payment of $2,450.00 is due on Nov 1, 2026. Please ensure payment is made to avoid late fees.', date: '2 hours ago', type: 'Finance', isRead: false, icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 2, title: 'Assignment Graded: Calculus III', message: 'Prof. David Mercer has posted grades for "Limits and Continuity Quiz". You scored 18/20.', date: '5 hours ago', type: 'Academic', isRead: false, icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { id: 3, title: 'Library Closure Notice', message: 'The Main Library will be closed this weekend (Oct 10-11) for system maintenance. Online journals will remain accessible.', date: '1 day ago', type: 'Campus', isRead: true, icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 4, title: 'Registration for Spring 2027', message: 'Early registration for the Spring 2027 semester opens next week. Please consult your academic advisor to lift any holds.', date: '2 days ago', type: 'Academic', isRead: true, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 5, title: 'Absence Warning', message: 'You have missed 3 classes in English Literature (LIT-105). Missing 4 classes will result in an automatic academic penalty.', date: '4 days ago', type: 'Warning', isRead: true, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Finance': return 'text-emerald-600 bg-emerald-100';
    case 'Academic': return 'text-blue-600 bg-blue-100';
    case 'Campus': return 'text-purple-600 bg-purple-100';
    case 'Warning': return 'text-red-600 bg-red-100';
    default: return 'text-zinc-600 bg-zinc-100';
  }
};

export default function StudentNotificationsPage() {
  const [filter, setFilter] = useState('All');
  
  const filters = ['All', 'Unread', 'Academic', 'Finance', 'Campus', 'Warning'];

  const filteredNotifs = NOTIFICATIONS.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = NOTIFICATIONS.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-[#B81D22] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Stay updated on campus news, academic alerts, and finance messages.
          </p>
        </div>
        <button className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors shadow-sm w-max">
          Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl inline-flex overflow-x-auto w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              filter === f
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredNotifs.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {filteredNotifs.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-5 flex gap-4 transition-colors hover:bg-zinc-50/50 ${!notif.isRead ? 'bg-red-50/30' : ''}`}
              >
                {/* Icon */}
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notif.type)}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={notif.icon} />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                    <h3 className={`text-sm sm:text-base pr-4 ${!notif.isRead ? 'font-black text-zinc-900' : 'font-bold text-zinc-800'}`}>
                      {notif.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-zinc-400 whitespace-nowrap">{notif.date}</span>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#B81D22]"></span>}
                    </div>
                  </div>
                  
                  <p className={`text-sm ${!notif.isRead ? 'text-zinc-700 font-medium' : 'text-zinc-500'}`}>
                    {notif.message}
                  </p>
                  
                  <div className="mt-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                      {notif.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-12 h-12 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="text-sm font-bold text-zinc-900">All caught up!</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">You don't have any notifications matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
