// GROUP 4: SuperAdmin Module - tenant formatters & resource limit defaults

import { SchoolTenant, TenantResourceLimits, TenantStatus } from '../types';

/**
 * Ceilings applied to a newly provisioned school. The platform is free to use,
 * so these are capacity guards rather than a paid plan.
 */
export const DEFAULT_RESOURCE_LIMITS: TenantResourceLimits = {
  maxStudents: 10000,
  maxTeachers: 800,
  storageQuotaGb: 250,
  maxFileUploadMb: 50,
};

export const TENANT_STATUS_STYLES: Record<TenantStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
};

/** Storage consumption as a percentage of the tenant's quota, capped at 100. */
export function storageUsagePercent(tenant: SchoolTenant): number {
  if (tenant.storageQuotaGb === 0) return 0;
  return Math.min(100, (tenant.storageUsedGb / tenant.storageQuotaGb) * 100);
}
