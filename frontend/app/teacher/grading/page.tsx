'use client';

import React from 'react';
import { TeacherResultsView } from '@/modules/teacher/components/TeacherResultsView';

export default function GradingPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Academic Grading &amp; Score Upload
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Record Continuous Assessment (CA / 40) and Examination (70) marks for your assigned classes. Submitted scores are automatically compiled for Admin retrieval and official reports.
          </p>
        </div>
      </div>

      {/* Main Results & Assessment Portal */}
      <TeacherResultsView />
    </div>
  );
}
