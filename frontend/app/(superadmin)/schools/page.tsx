import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SchoolsRegistryView } from '@/modules/superadmin/components';

export const metadata: Metadata = {
  title: 'Schools (Tenants) | Lincoln Multi-Tenant Academic Platform',
  description: 'Tenant registry for every enrolled institution, with population, storage usage, and governance status.',
};

export default function SchoolsPage() {
  // The registry reads ?tenant= and ?onboard= deep links from the dashboard,
  // so it needs a Suspense boundary to stay statically prerenderable.
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl border border-zinc-200 bg-white animate-pulse" />}>
      <SchoolsRegistryView />
    </Suspense>
  );
}
