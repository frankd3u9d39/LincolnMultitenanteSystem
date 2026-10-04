// GROUP 4: SuperAdmin Module - tenant formatters, tier presets & billing derivation

import { SchoolTenant, SubscriptionTier, TenantStatus } from '../types';

export interface TierPreset {
  label: string;
  maxStudents: number;
  maxTeachers: number;
  storageQuotaGb: number;
  monthlyFeeNgn: number;
}

/** Quota and price defaults applied when a tenant is provisioned or moved between tiers. */
export const TIER_PRESETS: Record<SubscriptionTier, TierPreset> = {
  starter: {
    label: 'Starter Campus',
    maxStudents: 500,
    maxTeachers: 35,
    storageQuotaGb: 50,
    monthlyFeeNgn: 45000,
  },
  pro: {
    label: 'Pro Academic',
    maxStudents: 2500,
    maxTeachers: 150,
    storageQuotaGb: 250,
    monthlyFeeNgn: 120000,
  },
  enterprise: {
    label: 'Enterprise University',
    maxStudents: 10000,
    maxTeachers: 800,
    storageQuotaGb: 1000,
    monthlyFeeNgn: 350000,
  },
};

export const TENANT_STATUS_STYLES: Record<TenantStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trialing: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const TIER_STYLES: Record<SubscriptionTier, string> = {
  starter: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  pro: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
};

/** Storage consumption as a percentage of the tenant's quota, capped at 100. */
export function storageUsagePercent(tenant: SchoolTenant): number {
  if (tenant.storageQuotaGb === 0) return 0;
  return Math.min(100, (tenant.storageUsedGb / tenant.storageQuotaGb) * 100);
}

export interface InvoiceRow {
  reference: string;
  issuedOn: string;
  periodLabel: string;
  amountNgn: number;
  status: 'paid' | 'due' | 'waived';
  method: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Derives the tenant's recent invoice history from its subscription state.
 * Stands in for the billing API until it is wired up.
 */
export function billingHistoryFor(tenant: SchoolTenant, months = 6, asOf = new Date(2026, 9, 1)): InvoiceRow[] {
  const rows: InvoiceRow[] = [];

  for (let offset = 0; offset < months; offset += 1) {
    const period = new Date(asOf.getFullYear(), asOf.getMonth() - offset, 1);
    const sequence = String(months - offset).padStart(4, '0');
    const isCurrent = offset === 0;

    let status: InvoiceRow['status'] = 'paid';
    if (tenant.status === 'trialing') status = 'waived';
    else if (tenant.status === 'suspended' && offset < 2) status = 'due';
    else if (isCurrent && tenant.status === 'pending') status = 'due';

    rows.push({
      reference: `INV-${tenant.code}-${sequence}`,
      issuedOn: `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}-01`,
      periodLabel: `${MONTH_NAMES[period.getMonth()]} ${period.getFullYear()}`,
      amountNgn: status === 'waived' ? 0 : tenant.monthlyFeeNgn,
      status,
      method: status === 'waived' ? 'Trial credit' : status === 'due' ? 'Awaiting payment' : 'Card on file',
    });
  }

  return rows;
}

export const INVOICE_STATUS_STYLES: Record<InvoiceRow['status'], string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  due: 'bg-red-50 text-red-700 border-red-200',
  waived: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};
