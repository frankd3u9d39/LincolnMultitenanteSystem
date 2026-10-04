// GROUP 4: SuperAdmin Module - administrator formatters & access posture calculations

import { AdminAccountStatus, SchoolAdministrator } from '../types';

export const ADMIN_ROLE_LABELS: Record<SchoolAdministrator['role'], string> = {
  principal_admin: 'Principal Admin',
  deputy_admin: 'Deputy Admin',
  bursar: 'Bursar',
  registrar: 'Registrar',
};

export const ADMIN_ROLE_STYLES: Record<SchoolAdministrator['role'], string> = {
  principal_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  deputy_admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  bursar: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  registrar: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const ADMIN_STATUS_STYLES: Record<AdminAccountStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  invited: 'bg-blue-50 text-blue-700 border-blue-200',
  locked: 'bg-red-50 text-red-700 border-red-200',
  disabled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

/** Initials for an avatar tile, with academic titles stripped first. */
export function adminInitials(name: string): string {
  return name
    .replace(/^(Dr\.|Prof\.|Mrs\.|Mr\.|Capt\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Whole days between a `YYYY-MM-DD HH:mm` login stamp and the snapshot date, or null if never signed in. */
export function daysSinceLogin(lastLogin: string, snapshotDate: string): number | null {
  const match = lastLogin.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  const loginTime = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const snapshotTime = Date.parse(`${snapshotDate}T00:00:00Z`);
  return Math.max(0, Math.round((snapshotTime - loginTime) / 86_400_000));
}

/** Number of days after which an account is treated as dormant. */
export const STALE_LOGIN_THRESHOLD_DAYS = 14;

export type RiskFlag = 'no_mfa' | 'locked' | 'disabled' | 'never_signed_in' | 'dormant';

export const RISK_FLAG_LABELS: Record<RiskFlag, string> = {
  no_mfa: 'No MFA',
  locked: 'Locked out',
  disabled: 'Disabled',
  never_signed_in: 'Never signed in',
  dormant: `Dormant ${STALE_LOGIN_THRESHOLD_DAYS}d+`,
};

export const RISK_FLAG_STYLES: Record<RiskFlag, string> = {
  no_mfa: 'bg-amber-50 text-amber-700 border-amber-200',
  locked: 'bg-red-50 text-red-700 border-red-200',
  disabled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  never_signed_in: 'bg-blue-50 text-blue-700 border-blue-200',
  dormant: 'bg-orange-50 text-orange-700 border-orange-200',
};

/** Every posture problem attached to a single administrator account. */
export function riskFlagsFor(admin: SchoolAdministrator, snapshotDate: string): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const days = daysSinceLogin(admin.lastLogin, snapshotDate);

  if (!admin.mfaEnabled) flags.push('no_mfa');
  if (admin.status === 'locked') flags.push('locked');
  if (admin.status === 'disabled') flags.push('disabled');
  if (days === null) flags.push('never_signed_in');
  else if (days >= STALE_LOGIN_THRESHOLD_DAYS) flags.push('dormant');

  return flags;
}

export interface TenantPostureRow {
  schoolCode: string;
  schoolName: string;
  total: number;
  mfaEnabled: number;
  flagged: number;
  coverage: number;
}

/** Per-tenant MFA coverage and flagged-account counts, worst coverage first. */
export function tenantPosture(
  administrators: SchoolAdministrator[],
  snapshotDate: string
): TenantPostureRow[] {
  const byTenant = new Map<string, TenantPostureRow>();

  administrators.forEach((admin) => {
    const row =
      byTenant.get(admin.schoolCode) ??
      {
        schoolCode: admin.schoolCode,
        schoolName: admin.schoolName,
        total: 0,
        mfaEnabled: 0,
        flagged: 0,
        coverage: 0,
      };

    row.total += 1;
    if (admin.mfaEnabled) row.mfaEnabled += 1;
    if (riskFlagsFor(admin, snapshotDate).length > 0) row.flagged += 1;
    byTenant.set(admin.schoolCode, row);
  });

  return Array.from(byTenant.values())
    .map((row) => ({ ...row, coverage: row.total === 0 ? 0 : (row.mfaEnabled / row.total) * 100 }))
    .sort((a, b) => a.coverage - b.coverage || a.schoolName.localeCompare(b.schoolName));
}

export interface AccessPostureSummary {
  total: number;
  mfaEnabled: number;
  mfaCoverage: number;
  flagged: number;
  locked: number;
  disabled: number;
  neverSignedIn: number;
  dormant: number;
}

/** Platform-wide rollup of administrator access posture. */
export function accessPostureSummary(
  administrators: SchoolAdministrator[],
  snapshotDate: string
): AccessPostureSummary {
  const flagsPerAdmin = administrators.map((admin) => riskFlagsFor(admin, snapshotDate));
  const countFlag = (flag: RiskFlag) => flagsPerAdmin.filter((flags) => flags.includes(flag)).length;
  const mfaEnabled = administrators.filter((admin) => admin.mfaEnabled).length;

  return {
    total: administrators.length,
    mfaEnabled,
    mfaCoverage: administrators.length === 0 ? 0 : (mfaEnabled / administrators.length) * 100,
    flagged: flagsPerAdmin.filter((flags) => flags.length > 0).length,
    locked: countFlag('locked'),
    disabled: countFlag('disabled'),
    neverSignedIn: countFlag('never_signed_in'),
    dormant: countFlag('dormant'),
  };
}
