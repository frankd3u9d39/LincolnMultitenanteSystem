'use client';

import React from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';

export default function MaterialsPage() {
  const materials = [
    { id: 1, title: 'Calculus Chapter 4 Notes', type: 'PDF', size: '2.4 MB', class: 'MTH301', uploadDate: 'Oct 10, 2026' },
    { id: 2, title: 'Physics Experiment Guidelines', type: 'DOCX', size: '1.1 MB', class: 'PHY201', uploadDate: 'Oct 08, 2026' },
    { id: 3, title: 'Algebra Practice Set', type: 'PDF', size: '3.5 MB', class: 'MTH101', uploadDate: 'Oct 05, 2026' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Course Materials</h1>
          <p className="text-zinc-500 font-medium mt-1">Upload and manage study materials for your classes.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-[#B81D22] hover:bg-[#9E1519] text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md">
          <NavIcon name="book" className="w-5 h-5" />
          Upload Material
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <NavIcon name="book" className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 line-clamp-1">{item.title}</h3>
                <p className="text-sm font-medium text-zinc-500 mt-1">{item.class}</p>
                <div className="flex items-center gap-2 mt-3 text-xs font-bold text-zinc-400">
                  <span className="bg-zinc-100 px-2 py-1 rounded-md">{item.type}</span>
                  <span>•</span>
                  <span>{item.size}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Uploaded {item.uploadDate}</span>
              <div className="flex gap-2">
                <button className="p-2 text-zinc-400 hover:text-[#B81D22] hover:bg-red-50 rounded-lg transition-colors">
                  <NavIcon name="clipboard" className="w-4 h-4" />
                </button>
                <button className="p-2 text-zinc-400 hover:text-[#B81D22] hover:bg-red-50 rounded-lg transition-colors">
                  <NavIcon name="dashboard" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
