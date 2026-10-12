'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';

export default function AssignmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const assignments = [
    { id: 1, title: 'Calculus Midterm Project', class: 'Advanced Mathematics (MTH301)', dueDate: 'Oct 20, 2026', submitted: 24, total: 30, status: 'Active' },
    { id: 2, title: 'Physics Lab Report #4', class: 'Physics Lab (PHY201)', dueDate: 'Oct 18, 2026', submitted: 28, total: 28, status: 'Grading' },
    { id: 3, title: 'Math Worksheet 7', class: 'Introduction to Calculus (MTH101)', dueDate: 'Oct 15, 2026', submitted: 35, total: 40, status: 'Closed' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Assignments</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage and grade student assignments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#B81D22] hover:bg-[#9E1519] text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md"
        >
          <NavIcon name="clipboard" className="w-5 h-5" />
          Create Assignment
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Title & Class</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Submissions</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {assignments.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900">{item.title}</div>
                    <div className="text-sm text-zinc-500 mt-1">{item.class}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                    {item.dueDate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden min-w-[80px]">
                        <div 
                          className="h-full bg-[#B81D22]" 
                          style={{ width: `${(item.submitted / item.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-zinc-700 w-12">{item.submitted}/{item.total}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'Grading' ? 'bg-amber-100 text-amber-800' :
                      'bg-zinc-100 text-zinc-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-semibold text-[#B81D22] hover:text-[#9E1519]">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Create New Assignment"
        maxWidth="lg"
      >
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Assignment Title</label>
            <input 
              type="text" 
              placeholder="e.g. Chapter 4 Quiz" 
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Select Class</label>
            <select defaultValue="" className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors appearance-none bg-white">
              <option value="" disabled>Choose a class...</option>
              <option value="mth301">Advanced Mathematics (MTH301)</option>
              <option value="phy201">Physics Lab (PHY201)</option>
              <option value="mth101">Introduction to Calculus (MTH101)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-1.5">Due Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-1.5">Total Marks</label>
              <input 
                type="number"
                placeholder="100" 
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Instructions</label>
            <textarea 
              rows={4}
              placeholder="Provide guidelines for the students..."
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
              Create Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
