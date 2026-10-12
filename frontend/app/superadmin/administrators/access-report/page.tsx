import React from 'react';
import { Metadata } from 'next';
import { AccessReportView } from '@/modules/superadmin/components';

export const metadata: Metadata = {
  title: 'Administrator Access Report | Lincoln Multi-Tenant Academic Platform',
  description: 'Multi-factor coverage, dormant credentials, and lockouts across every tenant administrator account.',
};

export default function AccessReportPage() {
  return <AccessReportView />;
}
