<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\PlatformTelemetry;
use App\Models\School;
use App\Models\SchoolMetric;
use App\Models\SystemAlert;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * GROUP 4: SuperAdmin Module - development dataset.
 *
 * Seeds the multi-tenant platform the SuperAdmin dashboard governs. The
 * platform is free for every school, so there are no plans, prices or
 * invoices here: capacity ceilings live on each tenant instead.
 */
class SuperAdminDashboardSeeder extends Seeder
{
    /** Shared development password for every seeded account. */
    private const DEV_PASSWORD = 'password';

    private ?string $passwordHash = null;

    /** Hashed once: bcrypt is deliberately slow and every account shares the password. */
    private function devPasswordHash(): string
    {
        return $this->passwordHash ??= Hash::make(self::DEV_PASSWORD);
    }

    public function run(): void
    {
        $schools = $this->seedSchools();
        $this->seedPlatformUsers();
        $this->seedTenantUsers($schools);
        $this->seedSchoolMetrics($schools);
        $this->seedPlatformSettings();
        $this->seedSystemAlerts();
        $this->seedTelemetry();
        $this->seedAuditLogs($schools);
    }

    /**
     * Tenant boundaries: 18 active, 1 awaiting verification, 1 suspended.
     *
     * @return Collection<string, School>
     */
    private function seedSchools()
    {
        $rows = [
            ['Lincoln College of Science Management & Technology', 'LC-SMTS-001', 'lincoln.edu', 'Lagos', 'active', 1000, 142350.50],
            ['St. Augustine Science & Arts Academy', 'SA-SMTS-002', 'st-augustine.ac.uk', 'Abuja', 'active', 250, 48200.20],
            ['Horizon STEM Institute', 'HZ-SMTS-003', 'horizon-stem.org', 'Port Harcourt', 'active', 1000, 110400.00],
            ['Kingsway Polytechnic', 'KP-SMTS-004', 'kingswaypoly.ac.uk', 'Ibadan', 'active', 250, 62100.80],
            ['Cambridge International College', 'CIC-SMTS-005', 'cambridge-intl.org', 'Lagos', 'active', 1000, 215400.10],
            ['Apex Advanced Science Academy', 'AASA-SMTS-006', 'apexscience.edu', 'Enugu', 'active', 250, 39400.00],
            ['Oakridge Technical High', 'OTH-SMTS-007', 'oakridge.sch.uk', 'Kano', 'active', 50, 12800.50],
            ['Beacon Hill Preparatory', 'BHP-SMTS-008', 'beaconhill.edu', 'Benin City', 'active', 250, 51300.00],
            ['Westfield College of Technology', 'WCT-SMTS-009', 'westfieldtech.ac.uk', 'Kaduna', 'active', 250, 44200.75],
            ['Royal Crown Maritime Academy', 'RCMA-SMTS-010', 'royalcrown.edu', 'Owerri', 'active', 250, 37600.00],
            ['Greenfield Agricultural Institute', 'GAI-SMTS-011', 'greenfield-agri.ac.uk', 'Makurdi', 'active', 50, 9800.40],
            ['Pacific Crest STEM Academy', 'PCSA-SMTS-012', 'pacificcrest.sch.uk', 'Jos', 'active', 250, 53100.90],
            ['Highland Valley International', 'HVI-SMTS-013', 'highlandvalley.ac.uk', 'Lagos', 'active', 1000, 184500.00],
            ['Solomon Islands Maritime Institute', 'SIMI-SMTS-014', 'solomonmaritime.edu', 'Calabar', 'active', 250, 41200.00],
            ['Summit Heights College', 'SHC-SMTS-015', 'summitheights.org', 'Abeokuta', 'active', 1000, 168900.30],
            ['Metro Science & Arts Academy', 'MSAA-SMTS-016', 'metroscience.edu', 'Ilorin', 'active', 250, 58200.00],
            ['Grandview Polytechnic', 'GP-SMTS-017', 'grandviewpoly.ac.uk', 'Maiduguri', 'active', 250, 46700.00],
            ['Evergreen Institute of Technology', 'EIT-SMTS-018', 'evergreentech.edu', 'Uyo', 'active', 50, 14300.20],
            ['Crestview Maritime Academy', 'CMA-SMTS-019', 'crestview.ac.uk', 'Warri', 'pending_approval', 250, 5200.00],
            ['Vanguard Institute of Sciences', 'VIS-SMTS-020', 'vanguardsciences.edu', 'Aba', 'suspended', 250, 68900.00],
        ];

        $schools = collect();

        foreach ($rows as $index => [$name, $code, $domain, $city, $status, $quotaGb, $usedMb]) {
            $school = School::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'slug' => Str::slug(Str::limit($name, 60, '')),
                    'domain' => $domain,
                    'contact_email' => 'admin@'.$domain,
                    'contact_phone' => '+234 80'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT).' 000 '.(1000 + $index),
                    'city' => $city,
                    'country' => 'Nigeria',
                    'status' => $status,
                    'storage_limit_gb' => $quotaGb,
                    'storage_used_mb' => $usedMb,
                    'max_students' => 10000,
                    'max_teachers' => 800,
                    'max_file_upload_mb' => 50,
                    'timezone' => 'Africa/Lagos',
                    'currency' => 'NGN',
                    'onboarded_at' => now()->subMonths(20 - $index),
                ]
            );

            $schools->put($code, $school);
        }

        return $schools;
    }

    /** Platform operators; these accounts sit outside every tenant boundary. */
    private function seedPlatformUsers(): void
    {
        $operators = [
            ['Alexander Cross', 'admin@lincolnplatform.io', true, 0],
            ['Miriam Dauda', 'm.dauda@lincolnplatform.io', true, 1],
        ];

        foreach ($operators as [$name, $email, $mfa, $hoursAgo]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'school_id' => null,
                    'name' => $name,
                    'password' => $this->devPasswordHash(),
                    'role' => User::ROLE_SUPERADMIN,
                    'phone' => '+234 802 000 11'.($hoursAgo + 1),
                    'status' => User::STATUS_ACTIVE,
                    'mfa_enabled' => $mfa,
                    'mfa_enrolled_at' => $mfa ? now()->subMonths(6) : null,
                    'last_login_at' => now()->subHours($hoursAgo),
                    'last_login_ip' => '197.210.54.12',
                ]
            );
        }
    }

    /**
     * One administrator per tenant, plus teachers and students for the larger
     * campuses, so the directory and access report have real variety.
     *
     * @param  Collection<string, School>  $schools
     */
    private function seedTenantUsers($schools): void
    {
        $administrators = [
            ['LC-SMTS-001', 'Dr. Sarah Jenkins', 's.jenkins@lincoln.edu', true, 'active', 0],
            ['SA-SMTS-002', 'Dr. Julian Thorne', 'j.thorne@st-augustine.ac.uk', true, 'active', 1],
            ['HZ-SMTS-003', 'Dr. Fiona Gallagher', 'f.gallagher@horizon-stem.org', true, 'active', 2],
            ['KP-SMTS-004', 'Robert Stirling', 'r.stirling@kingswaypoly.ac.uk', false, 'active', 23],
            ['CIC-SMTS-005', 'Dr. Victoria Alcott', 'v.alcott@cambridge-intl.org', true, 'active', 1],
            ['AASA-SMTS-006', 'Prof. David Mercer', 'd.mercer@apexscience.edu', true, 'active', 5],
            ['OTH-SMTS-007', 'Eleanor Vance', 'e.vance@oakridge.sch.uk', false, 'active', 72],
            ['BHP-SMTS-008', 'Grace Adeyemi', 'g.adeyemi@beaconhill.edu', true, 'active', 8],
            ['WCT-SMTS-009', 'Dr. Ibrahim Danladi', 'i.danladi@westfieldtech.ac.uk', true, 'active', 1],
            ['RCMA-SMTS-010', 'Mrs. Helen Obi', 'h.obi@royalcrown.edu', false, 'active', 48],
            ['GAI-SMTS-011', 'Dr. Emeka Nwosu', 'e.nwosu@greenfield-agri.ac.uk', true, 'active', 2],
            ['PCSA-SMTS-012', 'Samuel Okafor', 's.okafor@pacificcrest.sch.uk', false, 'suspended', 168],
            ['HVI-SMTS-013', 'Dr. Amaka Eze', 'a.eze@highlandvalley.ac.uk', true, 'active', 1],
            ['SIMI-SMTS-014', 'Blessing Adeyinka', 'b.adeyinka@solomonmaritime.edu', true, 'active', 4],
            ['SHC-SMTS-015', 'Tunde Bakare', 't.bakare@summitheights.org', false, 'active', 96],
            ['MSAA-SMTS-016', 'Prof. Chidi Okonkwo', 'c.okonkwo@metroscience.edu', true, 'active', 1],
            ['GP-SMTS-017', 'Dr. Yusuf Bello', 'y.bello@grandviewpoly.ac.uk', true, 'active', 2],
            ['EIT-SMTS-018', 'Ngozi Udeh', 'n.udeh@evergreentech.edu', false, 'active', 14],
            ['CMA-SMTS-019', 'Capt. Thomas Hayes', 't.hayes@crestview.ac.uk', false, 'pending', null],
            ['VIS-SMTS-020', 'Arthur Pendelton', 'a.pendelton@vanguardsciences.edu', false, 'inactive', 504],
        ];

        foreach ($administrators as [$code, $name, $email, $mfa, $status, $hoursAgo]) {
            $school = $schools->get($code);

            if (! $school) {
                continue;
            }

            User::updateOrCreate(
                ['email' => $email],
                [
                    'school_id' => $school->id,
                    'name' => $name,
                    'password' => $this->devPasswordHash(),
                    'role' => User::ROLE_ADMIN,
                    'admin_role' => 'principal_admin',
                    'phone' => '+234 80'.rand(1, 9).' '.rand(100, 999).' '.rand(1000, 9999),
                    'status' => $status,
                    'mfa_enabled' => $mfa,
                    'mfa_enrolled_at' => $mfa ? now()->subMonths(3) : null,
                    'invited_at' => $status === User::STATUS_PENDING ? now()->subDays(3) : null,
                    'last_login_at' => $hoursAgo === null ? null : now()->subHours($hoursAgo),
                    'last_login_ip' => $hoursAgo === null ? null : '197.210.'.rand(1, 254).'.'.rand(1, 254),
                ]
            );
        }

        // Supporting administrators, so bursars, registrars and deputies exist as data.
        $supporting = [
            ['LC-SMTS-001', 'Michael Adeyemi', 'm.adeyemi@lincoln.edu', 'bursar', true, 'active', 2],
            ['SA-SMTS-002', 'Patience Okoro', 'p.okoro@st-augustine.ac.uk', 'registrar', false, 'active', 30],
            ['CIC-SMTS-005', 'Chinedu Obiora', 'c.obiora@cambridge-intl.org', 'deputy_admin', true, 'active', 6],
            ['HVI-SMTS-013', 'Benedict Uche', 'b.uche@highlandvalley.ac.uk', 'deputy_admin', true, 'active', 3],
        ];

        foreach ($supporting as [$code, $name, $email, $title, $mfa, $status, $hoursAgo]) {
            $school = $schools->get($code);

            if (! $school) {
                continue;
            }

            User::updateOrCreate(
                ['email' => $email],
                [
                    'school_id' => $school->id,
                    'name' => $name,
                    'password' => $this->devPasswordHash(),
                    'role' => User::ROLE_ADMIN,
                    'admin_role' => $title,
                    'phone' => '+234 81'.rand(1, 9).' '.rand(100, 999).' '.rand(1000, 9999),
                    'status' => $status,
                    'mfa_enabled' => $mfa,
                    'mfa_enrolled_at' => $mfa ? now()->subMonths(2) : null,
                    'last_login_at' => now()->subHours($hoursAgo),
                    'last_login_ip' => '197.211.'.rand(1, 254).'.'.rand(1, 254),
                ]
            );
        }

        // Teaching and learning accounts for the five largest campuses.
        $populated = ['LC-SMTS-001', 'CIC-SMTS-005', 'HZ-SMTS-003', 'HVI-SMTS-013', 'SHC-SMTS-015'];

        foreach ($populated as $index => $code) {
            $school = $schools->get($code);

            if (! $school) {
                continue;
            }

            foreach (range(1, 4) as $n) {
                User::updateOrCreate(
                    ['email' => sprintf('teacher%d.%d@%s', $index + 1, $n, $school->domain)],
                    [
                        'school_id' => $school->id,
                        'name' => sprintf('Teacher %d-%d', $index + 1, $n),
                        'password' => $this->devPasswordHash(),
                        'role' => User::ROLE_TEACHER,
                        'status' => User::STATUS_ACTIVE,
                        'mfa_enabled' => $n % 2 === 0,
                        'last_login_at' => now()->subHours($n * 3),
                        'last_login_ip' => '105.112.'.rand(1, 254).'.'.rand(1, 254),
                    ]
                );
            }

            foreach (range(1, 6) as $n) {
                User::updateOrCreate(
                    ['email' => sprintf('student%d.%d@%s', $index + 1, $n, $school->domain)],
                    [
                        'school_id' => $school->id,
                        'name' => sprintf('Student %d-%d', $index + 1, $n),
                        'password' => $this->devPasswordHash(),
                        'role' => User::ROLE_STUDENT,
                        'status' => $n === 6 ? User::STATUS_INACTIVE : User::STATUS_ACTIVE,
                        'mfa_enabled' => false,
                        'last_login_at' => $n === 6 ? now()->subMonths(3) : now()->subMinutes($n * 17),
                        'last_login_ip' => '102.89.'.rand(1, 254).'.'.rand(1, 254),
                    ]
                );
            }
        }
    }

    /**
     * Seven days of per-tenant usage snapshots.
     *
     * @param  Collection<string, School>  $schools
     */
    private function seedSchoolMetrics($schools): void
    {
        $enrolment = [
            'LC-SMTS-001' => 1240, 'SA-SMTS-002' => 980, 'HZ-SMTS-003' => 1450, 'KP-SMTS-004' => 820,
            'CIC-SMTS-005' => 1890, 'AASA-SMTS-006' => 740, 'OTH-SMTS-007' => 310, 'BHP-SMTS-008' => 560,
            'WCT-SMTS-009' => 905, 'RCMA-SMTS-010' => 480, 'GAI-SMTS-011' => 241, 'PCSA-SMTS-012' => 612,
            'HVI-SMTS-013' => 1620, 'SIMI-SMTS-014' => 677, 'SHC-SMTS-015' => 1380, 'MSAA-SMTS-016' => 845,
            'GP-SMTS-017' => 702, 'EIT-SMTS-018' => 352, 'CMA-SMTS-019' => 120, 'VIS-SMTS-020' => 640,
        ];

        foreach ($schools as $code => $school) {
            $students = $enrolment[$code] ?? 400;
            $teachers = max(8, (int) round($students / 15));

            foreach (range(6, 0) as $daysAgo) {
                $date = now()->subDays($daysAgo)->toDateString();

                SchoolMetric::updateOrCreate(
                    ['school_id' => $school->id, 'metric_date' => $date],
                    [
                        'student_count' => $students - $daysAgo,
                        'teacher_count' => $teachers,
                        'admin_count' => 1,
                        'courses_count' => max(5, (int) round($students / 40)),
                        'classes_count' => max(4, (int) round($students / 30)),
                        'attendance_rate_percent' => round(88 + (crc32($code.$daysAgo) % 100) / 10, 2),
                        'storage_used_mb' => $school->storage_used_mb,
                        'last_activity_at' => $school->status === School::STATUS_SUSPENDED
                            ? now()->subDays(21)
                            : now()->subMinutes(($daysAgo * 60) + 12),
                    ]
                );
            }
        }
    }

    /**
     * Platform configuration, one row per field on the settings screen.
     * There is no billing category: the platform is free.
     */
    private function seedPlatformSettings(): void
    {
        // [category, key, label, value, type, isPublic, isEncrypted]
        $settings = [
            ['general', 'platform_name', 'Platform Name', 'Lincoln Multi-Tenant Academic Platform', 'string', true, false],
            ['general', 'tagline', 'Tagline', 'Enterprise Multi-School Governance & Management System', 'string', true, false],
            ['general', 'support_email', 'Support Email', 'platform-support@lincoln.edu', 'string', true, false],
            ['general', 'support_phone', 'Support Phone', '+234 (0) 800-LINCOLN-SYS', 'string', true, false],
            ['general', 'helpdesk_url', 'Helpdesk URL', 'https://support.lincolnplatform.io', 'string', true, false],
            ['general', 'default_timezone', 'Default Timezone', 'Africa/Lagos (GMT+1)', 'string', true, false],
            ['general', 'default_currency', 'Default Currency', 'NGN (₦)', 'string', true, false],
            ['general', 'maintenance_mode', 'Maintenance Mode', '0', 'boolean', true, false],
            ['general', 'maintenance_message', 'Maintenance Message', 'The Lincoln Academic Platform is currently undergoing scheduled infrastructure upgrades. All campus portals will be available shortly.', 'text', true, false],
            ['general', 'allowed_bypass_ips', 'Maintenance Bypass IPs', '192.168.1.100, 10.0.0.1, 197.210.54.12', 'text', false, false],

            ['tenancy', 'onboarding_mode', 'Onboarding Policy', 'approval_required', 'string', false, false],
            ['tenancy', 'allow_subdomain_customization', 'Allow Custom Subdomains', '1', 'boolean', false, false],
            ['tenancy', 'require_domain_verification', 'Require Domain Verification', '1', 'boolean', false, false],
            ['tenancy', 'auto_suspend_inactive_days', 'Auto-Suspension on Inactivity (Days)', '180', 'integer', false, false],

            ['limits', 'max_students', 'Default Maximum Students', '10000', 'integer', false, false],
            ['limits', 'max_teachers', 'Default Maximum Faculty & Staff', '800', 'integer', false, false],
            ['limits', 'storage_quota_gb', 'Default Storage Quota (GB)', '250', 'integer', false, false],
            ['limits', 'max_file_upload_mb', 'Default Maximum Upload Size (MB)', '50', 'integer', false, false],

            ['security', 'enforce_admin_mfa', 'Enforce MFA for Administrators', '1', 'boolean', false, false],
            ['security', 'min_password_length', 'Minimum Password Length', '10', 'integer', false, false],
            ['security', 'require_special_chars', 'Require Special Characters', '1', 'boolean', false, false],
            ['security', 'require_numbers', 'Require Numbers', '1', 'boolean', false, false],
            ['security', 'password_expiry_days', 'Password Expiry (Days)', '90', 'integer', false, false],
            ['security', 'session_timeout_minutes', 'Session Timeout (Minutes)', '30', 'integer', false, false],
            ['security', 'max_failed_logins', 'Maximum Failed Sign-in Attempts', '5', 'integer', false, false],
            ['security', 'lockout_duration_minutes', 'Lockout Duration (Minutes)', '15', 'integer', false, false],
            ['security', 'ip_whitelist_enabled', 'Restrict SuperAdmin Access by IP', '0', 'boolean', false, false],
            ['security', 'allowed_superadmin_ips', 'Allowed SuperAdmin IPs', '192.168.1.100, 10.0.0.45', 'text', false, false],

            ['mail', 'mail_driver', 'Mail Driver', 'smtp', 'string', false, false],
            ['mail', 'smtp_host', 'SMTP Host', 'smtp.mailgun.org', 'string', false, false],
            ['mail', 'smtp_port', 'SMTP Port', '587', 'integer', false, false],
            ['mail', 'smtp_encryption', 'SMTP Encryption', 'tls', 'string', false, false],
            ['mail', 'smtp_username', 'SMTP Username', 'postmaster@mg.lincolnplatform.io', 'string', false, false],
            ['mail', 'smtp_password', 'SMTP Password', null, 'string', false, true],
            ['mail', 'sender_name', 'Sender Name', 'Lincoln Multi-Tenant Platform', 'string', false, false],
            ['mail', 'sender_email', 'Sender Email', 'notifications@lincolnplatform.io', 'string', false, false],

            ['storage', 'storage_driver', 'Storage Driver', 'local', 'string', false, false],
            ['storage', 'bucket_name', 'Bucket Name', 'lincoln-multitenant-production-assets', 'string', false, false],
            ['storage', 'region', 'Region', 'af-south-1', 'string', false, false],
            ['storage', 'cdn_domain', 'CDN Domain', 'https://cdn.lincolnplatform.io', 'string', false, false],
            ['storage', 'auto_backup_schedule', 'Automatic Backup Schedule', 'daily', 'string', false, false],
            ['storage', 'backup_retention_days', 'Backup Retention (Days)', '90', 'integer', false, false],
            ['storage', 'backup_encryption_enabled', 'Encrypt Backups', '1', 'boolean', false, false],
            ['storage', 'last_backup_timestamp', 'Last Backup', 'No backup has been taken yet', 'string', false, false],

            ['telemetry', 'telemetry_collection_enabled', 'Telemetry Collection Enabled', '1', 'boolean', false, false],
        ];

        foreach ($settings as [$category, $key, $label, $value, $type, $isPublic, $isEncrypted]) {
            PlatformSetting::updateOrCreate(
                ['key_name' => $key],
                [
                    'category' => $category,
                    'display_name' => $label,
                    // Encrypted secrets start unset; an operator enters them in the UI.
                    'value' => $isEncrypted ? null : $value,
                    'data_type' => $type,
                    'is_public' => $isPublic,
                    'is_encrypted' => $isEncrypted,
                ]
            );
        }
    }

    private function seedSystemAlerts(): void
    {
        SystemAlert::updateOrCreate(
            ['title' => 'Scheduled infrastructure maintenance'],
            [
                'message' => 'Database maintenance runs Sunday 02:00-04:00 WAT. Campus portals stay online in read-only mode.',
                'alert_type' => 'info',
                'target_audience' => 'all',
                'is_active' => true,
                'expires_at' => now()->addDays(7),
            ]
        );

        SystemAlert::updateOrCreate(
            ['title' => 'MFA enrolment deadline'],
            [
                'message' => 'All school administrators must enrol an authenticator before the end of term.',
                'alert_type' => 'warning',
                'target_audience' => 'school_admins',
                'is_active' => true,
                'expires_at' => now()->addDays(30),
            ]
        );
    }

    /** Seven days of platform-wide infrastructure snapshots. */
    private function seedTelemetry(): void
    {
        foreach (range(6, 0) as $daysAgo) {
            $date = now()->subDays($daysAgo)->toDateString();

            PlatformTelemetry::updateOrCreate(
                ['metric_date' => $date],
                [
                    'active_schools_count' => 18,
                    'pending_schools_count' => 1,
                    'suspended_schools_count' => 1,
                    'total_students_count' => 16210 - ($daysAgo * 12),
                    'total_teachers_count' => 1118,
                    'total_admins_count' => 20,
                    'daily_active_users' => 9400 - ($daysAgo * 150),
                    'total_api_requests' => 1250000 - ($daysAgo * 18000),
                    'avg_response_time_ms' => round(38 + ($daysAgo % 4) * 1.4, 2),
                    'server_cpu_percent' => round(32 + ($daysAgo % 5) * 2.1, 2),
                    'server_ram_percent' => round(56 + ($daysAgo % 3) * 1.8, 2),
                    'storage_used_gb' => 1390.25,
                    'error_count' => 3 + ($daysAgo % 4),
                ]
            );
        }
    }

    /**
     * A representative slice of the audit trail.
     *
     * @param  Collection<string, School>  $schools
     */
    private function seedAuditLogs($schools): void
    {
        $superAdmin = User::where('email', 'admin@lincolnplatform.io')->first();
        $lincoln = $schools->get('LC-SMTS-001');
        $vanguard = $schools->get('VIS-SMTS-020');
        $evergreen = $schools->get('EIT-SMTS-018');

        $entries = [
            [
                'event_type' => 'auth.login.success',
                'action' => 'SuperAdmin Sign-in',
                'description' => 'SuperAdmin Alexander Cross signed in from Lagos.',
                'school_id' => null,
                'severity' => AuditLog::SEVERITY_INFO,
                'minutes_ago' => 15,
                'new_values' => ['location' => 'Lagos, Nigeria'],
            ],
            [
                'event_type' => 'tenant.provisioned',
                'action' => 'Provisioned School Tenant',
                'description' => 'Provisioned Evergreen Institute of Technology (EIT-SMTS-018) with a 50 GB storage quota.',
                'school_id' => $evergreen?->id,
                'severity' => AuditLog::SEVERITY_INFO,
                'minutes_ago' => 2880,
                'new_values' => ['code' => 'EIT-SMTS-018', 'storage_quota_gb' => 50],
            ],
            [
                'event_type' => 'tenant.quota_changed',
                'action' => 'Changed Tenant Storage Quota',
                'description' => 'Storage quota for Lincoln College changed from 500 GB to 1000 GB.',
                'school_id' => $lincoln?->id,
                'severity' => AuditLog::SEVERITY_INFO,
                'minutes_ago' => 120,
                'old_values' => ['storage_limit_gb' => 500],
                'new_values' => ['storage_limit_gb' => 1000],
            ],
            [
                'event_type' => 'auth.login.failed',
                'action' => 'Failed Sign-in Attempt',
                'description' => '3 failed sign-in attempts for an administrator account.',
                'school_id' => null,
                'severity' => AuditLog::SEVERITY_CRITICAL,
                'minutes_ago' => 600,
                'new_values' => ['attempts' => 3, 'ip_flagged' => true],
            ],
            [
                'event_type' => 'tenant.suspended',
                'action' => 'Suspended School Tenant',
                'description' => 'Suspended Vanguard Institute of Sciences after 180 days with no sign-in activity.',
                'school_id' => $vanguard?->id,
                'severity' => AuditLog::SEVERITY_WARNING,
                'minutes_ago' => 30240,
                'new_values' => ['inactive_days' => 180, 'reason' => 'Dormant tenant policy'],
            ],
            [
                'event_type' => 'platform.settings_updated',
                'action' => 'Updated Platform Settings',
                'description' => 'Updated 2 platform setting(s): session_timeout_minutes, enforce_admin_mfa.',
                'school_id' => null,
                'severity' => AuditLog::SEVERITY_INFO,
                'minutes_ago' => 4320,
                'new_values' => ['session_timeout_minutes' => ['from' => 60, 'to' => 30]],
            ],
        ];

        foreach ($entries as $entry) {
            AuditLog::updateOrCreate(
                [
                    'event_type' => $entry['event_type'],
                    'description' => $entry['description'],
                ],
                [
                    'user_id' => $superAdmin?->id,
                    'school_id' => $entry['school_id'],
                    'action' => $entry['action'],
                    'severity' => $entry['severity'],
                    'ip_address' => '197.210.54.12',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0',
                    'old_values' => $entry['old_values'] ?? null,
                    'new_values' => $entry['new_values'] ?? null,
                    'created_at' => now()->subMinutes($entry['minutes_ago']),
                ]
            );
        }
    }
}
