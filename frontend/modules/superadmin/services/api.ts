// GROUP 4: SuperAdmin Module - API integration.
//
// Every call the SuperAdmin screens make goes through here. This is also where
// the backend's response shapes are mapped onto the frontend's types, so no
// component needs to know how the API names things.

import { api, apiDownload, fetchAllPages, Query } from '@/services/api';
import {
  AccountOverview,
  ActiveSession,
  AdminAccountStatus,
  ApiAccessKey,
  AuditHeadline,
  AuditLogEntry,
  AuditSeverity,
  DashboardOverview,
  FullPlatformSettings,
  PagedResult,
  ReportRange,
  SchoolAdministrator,
  SchoolTenant,
  SuperAdminNotificationPrefs,
  SuperAdminProfile,
  SystemReport,
  SystemUser,
  SystemUserRole,
  SystemUserStatus,
  TelemetryReport,
  TenantReportRow,
  TenantStatus,
} from '../types';

type Json = Record<string, unknown>;

/* ------------------------------------------------------------------ */
/* Tenants                                                             */
/* ------------------------------------------------------------------ */

interface TenantDto {
  id: number;
  name: string;
  code: string;
  domain: string | null;
  status: string;
  city: string | null;
  principalAdmin: string | null;
  principalEmail: string | null;
  students: number;
  teachers: number;
  storageUsedGb: number;
  storageQuotaGb: number;
  onboardedOn: string | null;
  lastActivity: string;
}

function mapTenant(dto: TenantDto): SchoolTenant {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    domain: dto.domain ?? '—',
    status: (dto.status === 'pending_approval' ? 'pending' : dto.status) as TenantStatus,
    students: dto.students,
    teachers: dto.teachers,
    storageUsedGb: dto.storageUsedGb,
    storageQuotaGb: dto.storageQuotaGb,
    principalAdmin: dto.principalAdmin ?? '—',
    principalEmail: dto.principalEmail ?? '—',
    city: dto.city ?? '—',
    onboardedOn: dto.onboardedOn ?? '—',
    lastActivity: dto.lastActivity,
  };
}

export async function listTenants(signal?: AbortSignal): Promise<SchoolTenant[]> {
  return (await fetchAllPages<TenantDto>('/superadmin/schools', {}, signal)).map(mapTenant);
}

export interface ProvisionInput {
  name: string;
  code: string;
  domain: string;
  city: string;
  principalAdmin: string;
  principalEmail: string;
  password?: string;
  storageQuotaGb: number;
  activateImmediately: boolean;
}

export async function provisionTenant(input: ProvisionInput): Promise<{ tenant: SchoolTenant; message: string }> {
  const result = await api<{ message: string; data: TenantDto }>('/superadmin/schools', {
    method: 'POST',
    body: {
      name: input.name,
      code: input.code,
      domain: input.domain,
      city: input.city,
      principal_admin: input.principalAdmin,
      principal_email: input.principalEmail,
      password: input.password || undefined,
      storage_quota_gb: input.storageQuotaGb,
      activate_immediately: input.activateImmediately,
    },
  });

  return { tenant: mapTenant(result.data), message: result.message };
}

async function tenantAction(path: string, method: 'POST' | 'PATCH', body?: Json) {
  const result = await api<{ message: string; data: TenantDto }>(path, { method, body });
  return { tenant: mapTenant(result.data), message: result.message };
}

export const changeTenantQuota = (id: number, storageQuotaGb: number) =>
  tenantAction(`/superadmin/schools/${id}/quota`, 'PATCH', { storage_quota_gb: storageQuotaGb });

export const suspendTenant = (id: number, reason?: string) =>
  tenantAction(`/superadmin/schools/${id}/suspend`, 'POST', reason ? { reason } : undefined);

export const reinstateTenant = (id: number) => tenantAction(`/superadmin/schools/${id}/reinstate`, 'POST');

/* ------------------------------------------------------------------ */
/* Administrators                                                      */
/* ------------------------------------------------------------------ */

export async function listAdministrators(signal?: AbortSignal): Promise<SchoolAdministrator[]> {
  return fetchAllPages<SchoolAdministrator>('/superadmin/administrators', {}, signal);
}

export interface InviteInput {
  fullName: string;
  email: string;
  phone: string;
  schoolCode: string;
  role: SchoolAdministrator['role'];
  requireMfa: boolean;
  message: string;
}

export async function inviteAdministrator(input: InviteInput): Promise<{ administrator: SchoolAdministrator; message: string }> {
  const result = await api<{ message: string; data: SchoolAdministrator }>('/superadmin/administrators', {
    method: 'POST',
    body: {
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      school_code: input.schoolCode,
      role: input.role,
      require_mfa: input.requireMfa,
      message: input.message || null,
    },
  });

  return { administrator: result.data, message: result.message };
}

/** Maps the directory's status vocabulary onto the account states the API accepts. */
const ADMIN_STATUS_TO_API: Record<AdminAccountStatus, 'active' | 'suspended' | 'inactive'> = {
  active: 'active',
  invited: 'active',
  locked: 'suspended',
  disabled: 'inactive',
};

export async function setAdministratorStatus(
  id: number,
  status: AdminAccountStatus
): Promise<{ administrator: SchoolAdministrator; message: string }> {
  const result = await api<{ message: string; data: SchoolAdministrator }>(`/superadmin/administrators/${id}/status`, {
    method: 'PATCH',
    body: { status: ADMIN_STATUS_TO_API[status] },
  });

  return { administrator: result.data, message: result.message };
}

export async function enforceMfa(ids: number[]): Promise<string> {
  return (await api<{ message: string }>('/superadmin/administrators/enforce-mfa', { method: 'POST', body: { administrator_ids: ids } })).message;
}

export async function sendPasswordResets(ids: number[]): Promise<string> {
  return (await api<{ message: string }>('/superadmin/administrators/password-resets', { method: 'POST', body: { administrator_ids: ids } })).message;
}

/* ------------------------------------------------------------------ */
/* System users                                                        */
/* ------------------------------------------------------------------ */

export interface UserQuery {
  role: 'all' | SystemUserRole;
  status: 'all' | SystemUserStatus;
  schoolCode: string;
  search: string;
  page: number;
  perPage: number;
}

export interface UserDirectoryPage extends PagedResult<SystemUser> {
  roleCounts: Record<SystemUserRole, number>;
  tenants: Array<{ code: string; name: string }>;
}

/** The directory's "locked" is the API's "suspended". */
const USER_STATUS_TO_API: Record<SystemUserStatus, string> = {
  active: 'active',
  inactive: 'inactive',
  locked: 'suspended',
};

export async function listUsers(query: UserQuery, signal?: AbortSignal): Promise<UserDirectoryPage> {
  const result = await api<{
    data: SystemUser[];
    meta: {
      current_page: number;
      last_page: number;
      total: number;
      roleCounts: Record<SystemUserRole, number>;
      tenants: Array<{ code: string; name: string }>;
    };
  }>('/superadmin/system-users', {
    signal,
    query: {
      role: query.role === 'all' ? undefined : query.role,
      status: query.status === 'all' ? undefined : USER_STATUS_TO_API[query.status],
      school_code: query.schoolCode === 'all' ? undefined : query.schoolCode,
      search: query.search.trim() || undefined,
      page: query.page,
      per_page: query.perPage,
    },
  });

  return {
    items: result.data,
    total: result.meta.total,
    page: result.meta.current_page,
    lastPage: result.meta.last_page,
    roleCounts: result.meta.roleCounts,
    tenants: result.meta.tenants,
  };
}

export async function revokeUserSessions(id: number): Promise<string> {
  return (await api<{ message: string }>(`/superadmin/system-users/${id}/revoke-sessions`, { method: 'POST' })).message;
}

export async function revokeAllSessions(): Promise<string> {
  return (await api<{ message: string }>('/superadmin/system-users/revoke-all-sessions', { method: 'POST' })).message;
}

/** Every account matching a filter, for CSV export. */
export async function listAllUsers(query: Omit<UserQuery, 'page' | 'perPage'>): Promise<SystemUser[]> {
  return fetchAllPages<SystemUser>('/superadmin/system-users', {
    role: query.role === 'all' ? undefined : query.role,
    status: query.status === 'all' ? undefined : USER_STATUS_TO_API[query.status],
    school_code: query.schoolCode === 'all' ? undefined : query.schoolCode,
    search: query.search.trim() || undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Audit trail                                                         */
/* ------------------------------------------------------------------ */

export interface AuditQuery {
  severity: 'all' | AuditSeverity;
  eventGroup: string;
  search: string;
  page: number;
  perPage: number;
}

export interface AuditPage extends PagedResult<AuditLogEntry> {
  headline: AuditHeadline;
}

function auditParams(query: Pick<AuditQuery, 'severity' | 'eventGroup' | 'search'>): Query {
  return {
    severity: query.severity === 'all' ? undefined : query.severity,
    event_group: query.eventGroup === 'all' ? undefined : query.eventGroup,
    search: query.search.trim() || undefined,
  };
}

export async function listAuditLogs(query: AuditQuery, signal?: AbortSignal): Promise<AuditPage> {
  const result = await api<{
    data: AuditLogEntry[];
    meta: { current_page: number; last_page: number; total: number; headline: AuditHeadline };
  }>('/superadmin/audit-logs', {
    signal,
    query: { ...auditParams(query), page: query.page, per_page: query.perPage },
  });

  return {
    items: result.data,
    total: result.meta.total,
    page: result.meta.current_page,
    lastPage: result.meta.last_page,
    headline: result.meta.headline,
  };
}

/** Streams the filtered trail from the server as a CSV download. */
export function downloadAuditLog(query: Pick<AuditQuery, 'severity' | 'eventGroup' | 'search'>): Promise<string> {
  return apiDownload('/superadmin/audit-logs/export', auditParams(query), 'security_audit_log.csv');
}

/* ------------------------------------------------------------------ */
/* Dashboard & reports                                                 */
/* ------------------------------------------------------------------ */

interface OverviewDto {
  tenants: { total: number; active: number; pending: number; suspended: number; inactive: number; needs_attention: number };
  population: DashboardOverview['population'];
  storage: { used_gb: number; quota_gb: number; usage_percent: number };
  infrastructure: {
    metric_date: string | null;
    daily_active_users: number;
    avg_response_time_ms: number;
    server_cpu_percent: number;
    server_ram_percent: number;
    error_count: number;
  };
}

function mapOverview(dto: OverviewDto, recentActivity: AuditLogEntry[] = []): DashboardOverview {
  return {
    tenants: {
      total: dto.tenants.total,
      active: dto.tenants.active,
      pending: dto.tenants.pending,
      suspended: dto.tenants.suspended,
      inactive: dto.tenants.inactive,
      needsAttention: dto.tenants.needs_attention,
    },
    population: dto.population,
    storage: { usedGb: dto.storage.used_gb, quotaGb: dto.storage.quota_gb, usagePercent: dto.storage.usage_percent },
    infrastructure: {
      metricDate: dto.infrastructure.metric_date,
      dailyActiveUsers: dto.infrastructure.daily_active_users,
      avgResponseTimeMs: dto.infrastructure.avg_response_time_ms,
      serverCpuPercent: dto.infrastructure.server_cpu_percent,
      serverRamPercent: dto.infrastructure.server_ram_percent,
      errorCount: dto.infrastructure.error_count,
    },
    recentActivity,
  };
}

export async function getDashboard(signal?: AbortSignal): Promise<DashboardOverview> {
  const result = await api<{ data: OverviewDto & { recentActivity: AuditLogEntry[] } }>('/superadmin/dashboard', { signal });
  return mapOverview(result.data, result.data.recentActivity);
}

/** The tenants shown in the dashboard table, filtered and ordered by the server. */
export async function listDashboardTenants(
  query: { status: string; search: string },
  signal?: AbortSignal
): Promise<SchoolTenant[]> {
  const result = await api<{ data: TenantDto[] }>('/superadmin/schools', {
    signal,
    query: {
      status: query.status === 'all' ? undefined : query.status === 'pending' ? 'pending_approval' : query.status,
      search: query.search.trim() || undefined,
      sort: 'students',
      direction: 'desc',
      per_page: 10,
    },
  });

  return result.data.map(mapTenant);
}

interface TenantReportDto {
  school_name: string;
  school_code: string;
  status: string;
  students: number;
  teachers: number;
  attendance_rate_percent: number;
  storage_used_gb: number;
  storage_quota_gb: number;
  storage_usage_percent: number;
  compliance_score: number;
}

export async function getSystemReport(range: ReportRange, signal?: AbortSignal): Promise<SystemReport> {
  const result = await api<{
    data: {
      overview: OverviewDto;
      campusSizeDistribution: SystemReport['campusSizeDistribution'];
      tenants: TenantReportDto[];
      telemetry: TelemetryReport;
      isolation: SystemReport['isolation'];
    };
  }>('/superadmin/system-reports', { signal, query: { range, limit: 50 } });

  const tenants: TenantReportRow[] = result.data.tenants.map((row) => ({
    schoolName: row.school_name,
    schoolCode: row.school_code,
    status: row.status,
    students: row.students,
    teachers: row.teachers,
    attendanceRatePercent: row.attendance_rate_percent,
    storageUsedGb: row.storage_used_gb,
    storageQuotaGb: row.storage_quota_gb,
    storageUsagePercent: row.storage_usage_percent,
    complianceScore: row.compliance_score,
  }));

  return {
    overview: mapOverview(result.data.overview),
    campusSizeDistribution: result.data.campusSizeDistribution,
    tenants,
    telemetry: result.data.telemetry,
    isolation: result.data.isolation,
  };
}

/* ------------------------------------------------------------------ */
/* Platform settings                                                   */
/* ------------------------------------------------------------------ */

type SectionKey = keyof FullPlatformSettings;

/**
 * Which backend category and key each field on the settings screen lives under.
 * The screen's camelCase field names are the keys of each section.
 */
const SETTING_MAP: Record<SectionKey, { category: string; fields: Record<string, string> }> = {
  general: {
    category: 'general',
    fields: {
      platformName: 'platform_name',
      tagline: 'tagline',
      supportEmail: 'support_email',
      supportPhone: 'support_phone',
      helpdeskUrl: 'helpdesk_url',
      defaultTimezone: 'default_timezone',
      defaultCurrency: 'default_currency',
      maintenanceMode: 'maintenance_mode',
      maintenanceMessage: 'maintenance_message',
      allowedBypassIps: 'allowed_bypass_ips',
    },
  },
  tenants: {
    category: 'tenancy',
    fields: {
      onboardingMode: 'onboarding_mode',
      allowSubdomainCustomization: 'allow_subdomain_customization',
      requireDomainVerification: 'require_domain_verification',
      autoSuspendInactiveDays: 'auto_suspend_inactive_days',
    },
  },
  resourceLimits: {
    category: 'limits',
    fields: {
      maxStudents: 'max_students',
      maxTeachers: 'max_teachers',
      storageQuotaGb: 'storage_quota_gb',
      maxFileUploadMb: 'max_file_upload_mb',
    },
  },
  security: {
    category: 'security',
    fields: {
      enforceAdminMfa: 'enforce_admin_mfa',
      minPasswordLength: 'min_password_length',
      requireSpecialChars: 'require_special_chars',
      requireNumbers: 'require_numbers',
      passwordExpiryDays: 'password_expiry_days',
      sessionTimeoutMinutes: 'session_timeout_minutes',
      maxFailedLogins: 'max_failed_logins',
      lockoutDurationMinutes: 'lockout_duration_minutes',
      ipWhitelistEnabled: 'ip_whitelist_enabled',
      allowedSuperAdminIps: 'allowed_superadmin_ips',
    },
  },
  mail: {
    category: 'mail',
    fields: {
      mailDriver: 'mail_driver',
      smtpHost: 'smtp_host',
      smtpPort: 'smtp_port',
      smtpEncryption: 'smtp_encryption',
      smtpUsername: 'smtp_username',
      smtpPassword: 'smtp_password',
      senderName: 'sender_name',
      senderEmail: 'sender_email',
    },
  },
  storage: {
    category: 'storage',
    fields: {
      storageDriver: 'storage_driver',
      bucketName: 'bucket_name',
      region: 'region',
      cdnDomain: 'cdn_domain',
      autoBackupSchedule: 'auto_backup_schedule',
      backupRetentionDays: 'backup_retention_days',
      backupEncryptionEnabled: 'backup_encryption_enabled',
      lastBackupTimestamp: 'last_backup_timestamp',
    },
  },
};

interface SettingDto {
  key: string;
  value: unknown;
  isEncrypted: boolean;
  isSet: boolean | null;
}

export interface LoadedPlatformSettings {
  settings: FullPlatformSettings;
  /** Whether an SMTP password is already stored (its value is never sent to the browser). */
  smtpPasswordSet: boolean;
}

export async function getPlatformSettings(signal?: AbortSignal): Promise<LoadedPlatformSettings> {
  const result = await api<{ data: Record<string, SettingDto[]> }>('/superadmin/platform-settings', { signal });
  const settings = {} as Record<string, Record<string, unknown>>;
  let smtpPasswordSet = false;

  (Object.keys(SETTING_MAP) as SectionKey[]).forEach((section) => {
    const { category, fields } = SETTING_MAP[section];
    const rows = new Map((result.data[category] ?? []).map((row) => [row.key, row]));
    settings[section] = {};

    Object.entries(fields).forEach(([field, key]) => {
      const row = rows.get(key);
      if (row?.isEncrypted) {
        smtpPasswordSet = smtpPasswordSet || Boolean(row.isSet);
        settings[section][field] = '';
      } else {
        settings[section][field] = row?.value ?? '';
      }
    });
  });

  return { settings: settings as unknown as FullPlatformSettings, smtpPasswordSet };
}

/** Only the fields that differ from what was loaded, so the audit trail records real changes. */
export async function savePlatformSettings(current: FullPlatformSettings, original: FullPlatformSettings): Promise<string> {
  const changes: Array<{ key_name: string; value: unknown }> = [];

  (Object.keys(SETTING_MAP) as SectionKey[]).forEach((section) => {
    const now = current[section] as unknown as Record<string, unknown>;
    const before = original[section] as unknown as Record<string, unknown>;

    Object.entries(SETTING_MAP[section].fields).forEach(([field, key]) => {
      if (field === 'lastBackupTimestamp') {
        return;
      }
      if (now[field] !== before[field]) {
        changes.push({ key_name: key, value: now[field] });
      }
    });
  });

  if (changes.length === 0) {
    return 'No changes to save.';
  }

  return (await api<{ message: string }>('/superadmin/platform-settings', { method: 'PUT', body: { settings: changes } })).message;
}

export async function sendTestEmail(): Promise<string> {
  return (await api<{ message: string }>('/superadmin/platform-settings/test-email', { method: 'POST' })).message;
}

export async function runBackup(): Promise<{ message: string; lastBackup: string }> {
  return api<{ message: string; lastBackup: string }>('/superadmin/platform-settings/backup', { method: 'POST' });
}

/* ------------------------------------------------------------------ */
/* Operator account                                                    */
/* ------------------------------------------------------------------ */

export async function getAccount(signal?: AbortSignal): Promise<AccountOverview> {
  return (await api<{ data: AccountOverview }>('/superadmin/account', { signal })).data;
}

export async function updateAccount(input: { profile: SuperAdminProfile; notifications: SuperAdminNotificationPrefs }): Promise<string> {
  return (
    await api<{ message: string }>('/superadmin/account', {
      method: 'PUT',
      body: { ...input.profile, notifications: input.notifications },
    })
  ).message;
}

export async function changePassword(input: { current: string; next: string; confirmation: string }): Promise<string> {
  return (
    await api<{ message: string }>('/superadmin/account/password', {
      method: 'PUT',
      body: { current_password: input.current, password: input.next, password_confirmation: input.confirmation },
    })
  ).message;
}

export async function listSessions(signal?: AbortSignal): Promise<ActiveSession[]> {
  return (await api<{ data: ActiveSession[] }>('/superadmin/account/sessions', { signal })).data;
}

export async function signOutOtherSessions(): Promise<{ message: string; sessions: ActiveSession[] }> {
  const result = await api<{ message: string; data: ActiveSession[] }>('/superadmin/account/sessions/others', { method: 'DELETE' });
  return { message: result.message, sessions: result.data };
}

export async function listApiKeys(signal?: AbortSignal): Promise<ApiAccessKey[]> {
  return (await api<{ data: ApiAccessKey[] }>('/superadmin/account/api-keys', { signal })).data;
}

export async function createApiKey(input: { label: string; scope: ApiAccessKey['scope'] }): Promise<{ secret: string; keys: ApiAccessKey[]; message: string }> {
  const result = await api<{ secret: string; data: ApiAccessKey[]; message: string }>('/superadmin/account/api-keys', {
    method: 'POST',
    body: input,
  });
  return { secret: result.secret, keys: result.data, message: result.message };
}

export async function revokeApiKey(id: number): Promise<{ keys: ApiAccessKey[]; message: string }> {
  const result = await api<{ data: ApiAccessKey[]; message: string }>(`/superadmin/account/api-keys/${id}`, { method: 'DELETE' });
  return { keys: result.data, message: result.message };
}

export async function startMfaEnrolment(): Promise<{ secret: string; uri: string }> {
  return api<{ secret: string; uri: string }>('/superadmin/account/mfa/setup', { method: 'POST' });
}

export async function confirmMfaEnrolment(code: string): Promise<{ recoveryCodes: string[]; message: string }> {
  return api<{ recoveryCodes: string[]; message: string }>('/superadmin/account/mfa/confirm', { method: 'POST', body: { code } });
}

export async function regenerateRecoveryCodes(): Promise<string[]> {
  return (await api<{ recoveryCodes: string[] }>('/superadmin/account/recovery-codes', { method: 'POST' })).recoveryCodes;
}

/** Records a time-boxed support access entry for a tenant in the audit trail. */
export async function logSupportAccess(id: number, reason: string): Promise<string> {
  return (await api<{ message: string }>(`/superadmin/schools/${id}/support-access`, { method: 'POST', body: { reason } })).message;
}

/* ------------------------------------------------------------------ */
/* Administrator permissions                                           */
/* ------------------------------------------------------------------ */

export interface CapabilityGroup {
  group: string;
  capabilities: Array<{
    key: string;
    label: string;
    description: string;
    defaultRoles: string[];
    locked: boolean;
  }>;
}

export interface AdministratorPermissions {
  groups: CapabilityGroup[];
  granted: string[];
  defaults: string[];
  customised: boolean;
}

export async function getAdministratorPermissions(id: number, signal?: AbortSignal): Promise<AdministratorPermissions> {
  return (await api<{ data: AdministratorPermissions }>(`/superadmin/administrators/${id}/permissions`, { signal })).data;
}

export async function saveAdministratorPermissions(id: number, granted: string[]): Promise<string> {
  return (await api<{ message: string }>(`/superadmin/administrators/${id}/permissions`, { method: 'PUT', body: { granted } })).message;
}
