import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="teacher">{children}</DashboardLayout>;
}
