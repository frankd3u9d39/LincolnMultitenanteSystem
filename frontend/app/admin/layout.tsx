import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { RequireAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="admin">
      <DashboardLayout role="admin">{children}</DashboardLayout>
    </RequireAuth>
  );
}
