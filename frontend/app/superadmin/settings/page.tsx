import React from 'react';
import { Metadata } from 'next';
import { GlobalSettingsView } from '@/modules/superadmin/components';

export const metadata: Metadata = {
  title: 'Global Settings | Lincoln Multi-Tenant Academic Platform',
  description: 'SuperAdmin account profile, alert routing, sign-in security, and programmatic API access keys.',
};

export default function GlobalSettingsPage() {
  return <GlobalSettingsView />;
}
