import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="student">{children}</DashboardLayout>;
}
