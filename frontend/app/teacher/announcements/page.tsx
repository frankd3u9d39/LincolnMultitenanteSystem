'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';

export default function AnnouncementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const announcements = [
    {
      id: 1,
      title: 'Mid-term Examinations Schedule',
      date: 'October 15, 2026',
      content: 'The mid-term examinations will commence on October 25th. Please ensure all grading for current assignments is completed by October 20th.',
      author: 'Admin Office',
      isImportant: true,
    },
    {
      id: 2,
      title: 'Staff Meeting on Friday',
      date: 'October 12, 2026',
      content: 'There will be a general staff meeting this Friday at 3:00 PM in the main auditorium. Attendance is mandatory.',
      author: 'Principal',
      isImportant: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Announcements</h1>
          <p className="text-zinc-500 font-medium mt-1">Stay updated with the latest school news and notices.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#B81D22] hover:bg-[#9E1519] text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md"
        >
          <NavIcon name="bell" className="w-5 h-5" />
          Create Notice
        </button>
      </div>

      {/* Announcements List */}
      <div className="grid gap-4">
        {announcements.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow relative overflow-hidden">
            {item.isImportant && (
              <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  {item.title}
                  {item.isImportant && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Important</span>
                  )}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 font-medium">
                  <span className="flex items-center gap-1.5"><NavIcon name="calendar" className="w-4 h-4" /> {item.date}</span>
                  <span className="flex items-center gap-1.5"><NavIcon name="user" className="w-4 h-4" /> {item.author}</span>
                </div>
                <p className="mt-4 text-zinc-700 leading-relaxed">
                  {item.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Create New Notice"
        maxWidth="lg"
      >
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Notice Title</label>
            <input 
              type="text" 
              placeholder="e.g. Schedule Change for Next Week" 
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Target Audience</label>
            <select defaultValue="all" className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors appearance-none bg-white">
              <option value="all">All My Students</option>
              <option value="mth301">Advanced Mathematics (MTH301) Only</option>
              <option value="phy201">Physics Lab (PHY201) Only</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors">
            <input type="checkbox" className="w-4 h-4 text-[#B81D22] rounded border-zinc-300 focus:ring-[#B81D22]" />
            <span className="text-sm font-bold text-zinc-900">Mark as Important</span>
          </label>

          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Message Content</label>
            <textarea 
              rows={5}
              placeholder="Type your announcement here..."
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors resize-none"
            />
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
              type="submit" 
              className="px-5 py-2.5 rounded-lg font-bold bg-[#B81D22] hover:bg-[#9E1519] text-white shadow-md transition-colors"
            >
              Post Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
