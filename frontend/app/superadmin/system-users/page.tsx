import React from 'react';
import { Metadata } from 'next';
import { SystemUsersView } from '@/modules/superadmin/components';

export const metadata: Metadata = {
  title: 'All System Users | Lincoln Multi-Tenant Academic Platform',
  description: 'Cross-tenant identity directory of every SuperAdmin, administrator, teacher, and student account.',
};

export default function SystemUsersPage() {
  return <SystemUsersView />;
}
