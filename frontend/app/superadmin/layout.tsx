import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { RequireAuth } from '@/lib/auth';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="superadmin">
      <DashboardLayout role="superadmin">{children}</DashboardLayout>
    </RequireAuth>
  );
}
