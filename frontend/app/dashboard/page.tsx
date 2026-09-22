import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout role="admin">
      <div className="min-h-[calc(100vh-8rem)] rounded-xl border border-zinc-200 bg-white p-6 shadow-sm flex items-center justify-center text-zinc-400 text-sm">
        {/* Content area kept empty as requested */}
      </div>
    </DashboardLayout>
  );
}
