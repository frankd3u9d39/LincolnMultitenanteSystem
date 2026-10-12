import React from 'react';
import { Metadata } from 'next';
import { AdministratorsView } from '@/modules/superadmin/components';

export const metadata: Metadata = {
  title: 'School Administrators | Lincoln Multi-Tenant Academic Platform',
  description: 'Privileged tenant administrator accounts, role assignments, and multi-factor authentication posture.',
};

export default function AdministratorsPage() {
  return <AdministratorsView />;
}
