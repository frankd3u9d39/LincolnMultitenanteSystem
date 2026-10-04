/**
 * GROUP 4: SuperAdmin Module - Domain Types & Interfaces
 * Multi-school platform governance, tenant management, and platform configuration models.
 */

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export interface TierLimitConfig {
  name: string;
  code: SubscriptionTier;
  maxStudents: number;
  maxTeachers: number;
  storageQuotaGb: number;
  monthlyPriceNgn: number;
  features: string[];
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
  defaultTrialDays: number;
  defaultTier: SubscriptionTier;
  allowSubdomainCustomization: boolean;
  requireDomainVerification: boolean;
  autoSuspendOverdueDays: number;
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
  tierLimits: Record<SubscriptionTier, TierLimitConfig>;
  security: PlatformSecuritySettings;
  mail: PlatformMailSettings;
  storage: PlatformStorageSettings;
}

/* ------------------------------------------------------------------ */
/* Tenant (School) Registry                                            */
/* ------------------------------------------------------------------ */

export type TenantStatus = 'active' | 'trialing' | 'suspended' | 'pending';

export interface SchoolTenant {
  id: number;
  name: string;
  code: string;
  domain: string;
  tier: SubscriptionTier;
  tierLabel: string;
  status: TenantStatus;
  students: number;
  teachers: number;
  storageUsedGb: number;
  storageQuotaGb: number;
  monthlyFeeNgn: number;
  principalAdmin: string;
  principalEmail: string;
  city: string;
  onboardedOn: string;
  renewsOn: string;
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
  billingFailures: boolean;
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
