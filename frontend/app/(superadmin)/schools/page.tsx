import React from 'react';
import { Metadata } from 'next';
import { SchoolsRegistryView } from '@/modules/superadmin/components';

export const metadata: Metadata = {
  title: 'Schools (Tenants) | Lincoln Multi-Tenant Academic Platform',
  description: 'Tenant registry for every enrolled institution, with subscription tier, population, storage, and billing posture.',
};

export default function SchoolsPage() {
  return <SchoolsRegistryView />;
}
