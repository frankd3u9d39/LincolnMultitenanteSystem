import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { RequireAuth } from '@/lib/auth';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="student">
      <DashboardLayout role="student">{children}</DashboardLayout>
    </RequireAuth>
  );
}
