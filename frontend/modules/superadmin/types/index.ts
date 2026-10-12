/**
 * GROUP 4: SuperAdmin Module - Domain Types & Interfaces
 * Multi-school platform governance, tenant management, and platform configuration models.
 */

/** Resource ceilings applied to every school. The platform is free, so there are no tiers. */
export interface TenantResourceLimits {
  maxStudents: number;
  maxTeachers: number;
  storageQuotaGb: number;
  maxFileUploadMb: number;
}

export interface PlatformGeneralSettings {
  platformName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  helpdeskUrl: string;
  defaultTimezone: string;
  defaultCurrency: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowedBypassIps: string;
}

export interface PlatformTenantSettings {
  onboardingMode: 'invitation_only' | 'approval_required' | 'open_registration';
  allowSubdomainCustomization: boolean;
  requireDomainVerification: boolean;
  autoSuspendInactiveDays: number;
}

export interface PlatformSecuritySettings {
  enforceAdminMfa: boolean;
  minPasswordLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  maxFailedLogins: number;
  lockoutDurationMinutes: number;
  ipWhitelistEnabled: boolean;
  allowedSuperAdminIps: string;
}

export interface PlatformMailSettings {
  mailDriver: 'smtp' | 'ses' | 'sendgrid' | 'mailgun';
  smtpHost: string;
  smtpPort: number;
  smtpEncryption: 'tls' | 'ssl' | 'none';
  smtpUsername: string;
  smtpPassword?: string;
  senderName: string;
  senderEmail: string;
}

export interface PlatformStorageSettings {
  storageDriver: 'local' | 's3' | 'r2' | 'gcs';
  bucketName: string;
  region: string;
  cdnDomain: string;
  autoBackupSchedule: 'hourly' | 'daily' | 'weekly';
  backupRetentionDays: number;
  backupEncryptionEnabled: boolean;
  lastBackupTimestamp?: string;
}

export interface FullPlatformSettings {
  general: PlatformGeneralSettings;
  tenants: PlatformTenantSettings;
  resourceLimits: TenantResourceLimits;
  security: PlatformSecuritySettings;
  mail: PlatformMailSettings;
  storage: PlatformStorageSettings;
}

/* ------------------------------------------------------------------ */
/* Tenant (School) Registry                                            */
/* ------------------------------------------------------------------ */

export type TenantStatus = 'active' | 'suspended' | 'pending' | 'inactive';

export interface SchoolTenant {
  id: number;
  name: string;
  code: string;
  domain: string;
  status: TenantStatus;
  students: number;
  teachers: number;
  storageUsedGb: number;
  storageQuotaGb: number;
  principalAdmin: string;
  principalEmail: string;
  city: string;
  onboardedOn: string;
  lastActivity: string;
}

/* ------------------------------------------------------------------ */
/* School Administrators                                               */
/* ------------------------------------------------------------------ */

export type AdminAccountStatus = 'active' | 'invited' | 'locked' | 'disabled';

export interface SchoolAdministrator {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  schoolName: string;
  schoolCode: string;
  role: 'principal_admin' | 'deputy_admin' | 'bursar' | 'registrar';
  status: AdminAccountStatus;
  mfaEnabled: boolean;
  /** MFA has been made mandatory but the account has not enrolled yet. */
  mfaRequired: boolean;
  lastLogin: string;
  lastLoginIp: string;
  createdOn: string;
}

/* ------------------------------------------------------------------ */
/* Platform-wide User Directory                                        */
/* ------------------------------------------------------------------ */

export type SystemUserRole = 'superadmin' | 'admin' | 'teacher' | 'student';
export type SystemUserStatus = 'active' | 'inactive' | 'locked';

export interface SystemUser {
  id: number;
  fullName: string;
  email: string;
  role: SystemUserRole;
  schoolName: string;
  schoolCode: string;
  status: SystemUserStatus;
  mfaEnabled: boolean;
  lastSeen: string;
  joinedOn: string;
}

/* ------------------------------------------------------------------ */
/* SuperAdmin Account / Global Preferences                             */
/* ------------------------------------------------------------------ */

export interface SuperAdminProfile {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
  dateFormat: string;
}

export interface SuperAdminNotificationPrefs {
  tenantOnboarded: boolean;
  tenantSuspended: boolean;
  quotaBreaches: boolean;
  securityAlerts: boolean;
  backupResults: boolean;
  weeklyDigest: boolean;
  channel: 'email' | 'email_sms' | 'in_app';
}

export interface ApiAccessKey {
  id: number;
  label: string;
  prefix: string;
  scope: 'read_only' | 'read_write' | 'admin';
  createdOn: string;
  lastUsed: string;
  status: 'active' | 'revoked';
}

export interface GlobalSettingsState {
  profile: SuperAdminProfile;
  notifications: SuperAdminNotificationPrefs;
  apiKeys: ApiAccessKey[];
}

/* ------------------------------------------------------------------ */
/* API shapes                                                          */
/* ------------------------------------------------------------------ */

/** One page of a server-paginated list. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  lastPage: number;
}

export interface DashboardOverview {
  tenants: { total: number; active: number; pending: number; suspended: number; inactive: number; needsAttention: number };
  population: { students: number; teachers: number; administrators: number; superadmins: number; total: number };
  storage: { usedGb: number; quotaGb: number; usagePercent: number };
  infrastructure: {
    metricDate: string | null;
    dailyActiveUsers: number;
    avgResponseTimeMs: number;
    serverCpuPercent: number;
    serverRamPercent: number;
    errorCount: number;
  };
  recentActivity: AuditLogEntry[];
}

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  eventType: string;
  action: string;
  severity: AuditSeverity;
  actorName: string;
  actorEmail: string | null;
  actorRole: string;
  schoolName: string;
  schoolCode: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  description: string | null;
  details: Record<string, unknown> | null;
  previousValues: Record<string, unknown> | null;
}

export interface AuditHeadline {
  totalEvents: number;
  criticalLast24h: number;
  administrativeChanges: number;
}

export type ReportRange = '7d' | '30d' | 'quarter' | 'ytd';

export interface TelemetryBucket {
  date: string;
  label: string;
  dau: number;
  apiRequests: number;
  latencyMs: number;
  cpu: number;
  errors: number;
}

export interface TelemetrySummary {
  avgDau: number;
  avgApiRequests: number;
  avgLatencyMs: number;
  avgCpuPercent: number;
  totalRequests: number;
  totalErrors: number;
  errorRatePercent: number;
}

export interface TelemetryReport {
  range: ReportRange;
  days: number;
  series: TelemetryBucket[];
  summary: TelemetrySummary | null;
  previous: TelemetrySummary | null;
  changes: { dauPercent: number | null; requestsPercent: number | null; latencyMs: number } | null;
  peak: { date: string; dau: number } | null;
  baseline: { date: string; dau: number } | null;
}

export interface TenantReportRow {
  schoolName: string;
  schoolCode: string;
  status: string;
  students: number;
  teachers: number;
  attendanceRatePercent: number;
  storageUsedGb: number;
  storageQuotaGb: number;
  storageUsagePercent: number;
  complianceScore: number;
}

export interface SystemReport {
  overview: DashboardOverview;
  campusSizeDistribution: { large: number; medium: number; small: number };
  tenants: TenantReportRow[];
  telemetry: TelemetryReport;
  isolation: IsolationReport;
}

export interface IsolationReport {
  passed: boolean;
  checkedAt: string;
  checks: Array<{ label: string; violations: number }>;
}

export interface ActiveSession {
  id: number;
  device: string;
  location: string;
  ip: string;
  seen: string;
  current: boolean;
}

export interface AccountOverview {
  profile: SuperAdminProfile;
  notifications: SuperAdminNotificationPrefs;
  summary: {
    role: string;
    tenantCount: number;
    createdOn: string | null;
    lastSignIn: string | null;
    lastSignInIp: string | null;
  };
  security: {
    mfaEnabled: boolean;
    mfaEnrolledOn: string | null;
    recoveryCodesRemaining: number;
    passwordChangedDaysAgo: number | null;
    passwordExpiresInDays: number | null;
  };
}
