import React from 'react';
import { PlatformSettingsView } from '@/modules/superadmin/components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Settings & Governance | Lincoln Multi-Tenant Academic Platform',
  description: 'Global multi-tenant configuration, security policies, tenant resource limits, and mail infrastructure.',
};

export default function PlatformSettingsPage() {
  return <PlatformSettingsView />;
}
