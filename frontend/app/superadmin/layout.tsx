import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="superadmin">{children}</DashboardLayout>;
}
