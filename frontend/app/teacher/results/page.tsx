'use client';

import React from 'react';
import { TeacherResultsView } from '@/modules/teacher/components/TeacherResultsView';

export default function TeacherResultsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Class Assessment &amp; Result File Upload Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Upload Continuous Assessment / Test (CA / 40) and Terminal Examination (70) result files for your assigned classes. Scores are automatically published to student dashboards and broadsheets are available for Administrator download.
          </p>
        </div>
      </div>

      {/* Main Results & Assessment Portal */}
      <TeacherResultsView />
    </div>
  );
}
