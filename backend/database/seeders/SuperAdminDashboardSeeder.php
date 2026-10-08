<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SuperAdminDashboardSeeder extends Seeder
{
    /**
     * Run the database seeds for SuperAdmin Dashboard and platform multi-tenancy.
     */
    public function run(): void
    {
        // 1. Subscription Plans
        DB::table('subscription_plans')->updateOrInsert(['slug' => 'starter-campus'], [
            'name' => 'Starter Campus',
            'slug' => 'starter-campus',
            'description' => 'Designed for small academies and specialized institutes',
            'price_monthly' => 199.00,
            'price_yearly' => 1990.00,
            'currency' => 'NGN',
            'max_students' => 300,
            'max_teachers' => 25,
            'max_storage_gb' => 25,
            'features' => json_encode(['attendance' => true, 'basic_reports' => true, 'custom_domain' => false, 'api_access' => false]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('subscription_plans')->updateOrInsert(['slug' => 'pro-academic'], [
            'name' => 'Pro Academic',
            'slug' => 'pro-academic',
            'description' => 'Ideal for mid-sized colleges and secondary institutions',
            'price_monthly' => 499.00,
            'price_yearly' => 4990.00,
            'currency' => 'NGN',
            'max_students' => 1500,
            'max_teachers' => 100,
            'max_storage_gb' => 100,
            'features' => json_encode(['attendance' => true, 'advanced_reports' => true, 'custom_domain' => true, 'api_access' => false]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('subscription_plans')->updateOrInsert(['slug' => 'enterprise-university'], [
            'name' => 'Enterprise University',
            'slug' => 'enterprise-university',
            'description' => 'Full campus multi-department suite with high storage & custom workflows',
            'price_monthly' => 999.00,
            'price_yearly' => 9990.00,
            'currency' => 'NGN',
            'max_students' => 5000,
            'max_teachers' => 350,
            'max_storage_gb' => 500,
            'features' => json_encode(['attendance' => true, 'custom_domain' => true, 'api_access' => true, 'audit_trail' => true, 'sso' => true]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('subscription_plans')->updateOrInsert(['slug' => 'institutional-scale'], [
            'name' => 'Institutional Scale',
            'slug' => 'institutional-scale',
            'description' => 'Unbounded platform tier for university networks and large districts',
            'price_monthly' => 1899.00,
            'price_yearly' => 18990.00,
            'currency' => 'NGN',
            'max_students' => 20000,
            'max_teachers' => 1500,
            'max_storage_gb' => 2000,
            'features' => json_encode(['attendance' => true, 'custom_domain' => true, 'api_access' => true, 'dedicated_support' => true, 'sso' => true]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $plans = DB::table('subscription_plans')->pluck('id', 'slug');

        // 2. Schools / Tenants (18 Active Schools matching frontend badge + 1 trial + 1 suspended)
        $schoolsData = [
            ['name' => 'Lincoln College of Science Management & Technology', 'code' => 'LC-SMTS-001', 'slug' => 'lincoln', 'domain' => 'lincoln.edu', 'contact_email' => 'admissions@lincoln.edu', 'status' => 'active', 'plan_slug' => 'enterprise-university', 'limit' => 500, 'used' => 142350.50],
            ['name' => 'St. Augustine Science & Arts Academy', 'code' => 'SA-SMTS-002', 'slug' => 'st-augustine', 'domain' => 'st-augustine.ac.uk', 'contact_email' => 'admin@st-augustine.ac.uk', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 48200.20],
            ['name' => 'Horizon STEM Institute', 'code' => 'HZ-SMTS-003', 'slug' => 'horizon-stem', 'domain' => 'horizon-stem.org', 'contact_email' => 'contact@horizon-stem.org', 'status' => 'active', 'plan_slug' => 'enterprise-university', 'limit' => 500, 'used' => 110400.00],
            ['name' => 'Kingsway Polytechnic', 'code' => 'KP-SMTS-004', 'slug' => 'kingsway', 'domain' => 'kingswaypoly.ac.uk', 'contact_email' => 'registrar@kingswaypoly.ac.uk', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 62100.80],
            ['name' => 'Cambridge International College', 'code' => 'CIC-SMTS-005', 'slug' => 'cambridge-intl', 'domain' => 'cambridge-intl.org', 'contact_email' => 'info@cambridge-intl.org', 'status' => 'active', 'plan_slug' => 'enterprise-university', 'limit' => 500, 'used' => 215400.10],
            ['name' => 'Apex Advanced Science Academy', 'code' => 'AASA-SMTS-006', 'slug' => 'apex-science', 'domain' => 'apexscience.edu', 'contact_email' => 'office@apexscience.edu', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 39400.00],
            ['name' => 'Oakridge Technical High', 'code' => 'OTH-SMTS-007', 'slug' => 'oakridge', 'domain' => 'oakridge.sch.uk', 'contact_email' => 'head@oakridge.sch.uk', 'status' => 'active', 'plan_slug' => 'starter-campus', 'limit' => 25, 'used' => 12800.50],
            ['name' => 'Beacon Hill Preparatory', 'code' => 'BHP-SMTS-008', 'slug' => 'beacon-hill', 'domain' => 'beaconhill.edu', 'contact_email' => 'admissions@beaconhill.edu', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 51300.00],
            ['name' => 'Westfield College of Technology', 'code' => 'WCT-SMTS-009', 'slug' => 'westfield', 'domain' => 'westfieldtech.ac.uk', 'contact_email' => 'enquiries@westfieldtech.ac.uk', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 44200.75],
            ['name' => 'Royal Crown Maritime Academy', 'code' => 'RCMA-SMTS-010', 'slug' => 'royal-crown', 'domain' => 'royalcrown.edu', 'contact_email' => 'info@royalcrown.edu', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 37600.00],
            ['name' => 'Greenfield Agricultural Institute', 'code' => 'GAI-SMTS-011', 'slug' => 'greenfield', 'domain' => 'greenfield-agri.ac.uk', 'contact_email' => 'contact@greenfield-agri.ac.uk', 'status' => 'active', 'plan_slug' => 'starter-campus', 'limit' => 25, 'used' => 9800.40],
            ['name' => 'Pacific Crest STEM Academy', 'code' => 'PCSA-SMTS-012', 'slug' => 'pacific-crest', 'domain' => 'pacificcrest.sch.uk', 'contact_email' => 'frontdesk@pacificcrest.sch.uk', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 53100.90],
            ['name' => 'Highland Valley International', 'code' => 'HVI-SMTS-013', 'slug' => 'highland-valley', 'domain' => 'highlandvalley.ac.uk', 'contact_email' => 'support@highlandvalley.ac.uk', 'status' => 'active', 'plan_slug' => 'enterprise-university', 'limit' => 500, 'used' => 184500.00],
            ['name' => 'Solomon Islands Maritime Institute', 'code' => 'SIMI-SMTS-014', 'slug' => 'solomon-maritime', 'domain' => 'solomonmaritime.edu', 'contact_email' => 'office@solomonmaritime.edu', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 41200.00],
            ['name' => 'Summit Heights College', 'code' => 'SHC-SMTS-015', 'slug' => 'summit-heights', 'domain' => 'summitheights.org', 'contact_email' => 'principal@summitheights.org', 'status' => 'active', 'plan_slug' => 'enterprise-university', 'limit' => 500, 'used' => 168900.30],
            ['name' => 'Metro Science & Arts Academy', 'code' => 'MSAA-SMTS-016', 'slug' => 'metro-science', 'domain' => 'metroscience.edu', 'contact_email' => 'info@metroscience.edu', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 58200.00],
            ['name' => 'Grandview Polytechnic', 'code' => 'GP-SMTS-017', 'slug' => 'grandview', 'domain' => 'grandviewpoly.ac.uk', 'contact_email' => 'admissions@grandviewpoly.ac.uk', 'status' => 'active', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 46700.00],
            ['name' => 'Evergreen Institute of Technology', 'code' => 'EIT-SMTS-018', 'slug' => 'evergreen-tech', 'domain' => 'evergreentech.edu', 'contact_email' => 'hello@evergreentech.edu', 'status' => 'active', 'plan_slug' => 'starter-campus', 'limit' => 25, 'used' => 14300.20],
            ['name' => 'Crestview Maritime Academy', 'code' => 'CMA-SMTS-019', 'slug' => 'crestview', 'domain' => 'crestview.ac.uk', 'contact_email' => 'contact@crestview.ac.uk', 'status' => 'trialing', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 5200.00],
            ['name' => 'Vanguard Institute of Sciences', 'code' => 'VIS-SMTS-020', 'slug' => 'vanguard', 'domain' => 'vanguardsciences.edu', 'contact_email' => 'billing@vanguardsciences.edu', 'status' => 'suspended', 'plan_slug' => 'pro-academic', 'limit' => 100, 'used' => 68900.00],
        ];

        foreach ($schoolsData as $data) {
            DB::table('schools')->updateOrInsert(['code' => $data['code']], [
                'name' => $data['name'],
                'code' => $data['code'],
                'slug' => $data['slug'],
                'domain' => $data['domain'],
                'contact_email' => $data['contact_email'],
                'status' => $data['status'],
                'plan_id' => $plans[$data['plan_slug']] ?? null,
                'storage_limit_gb' => $data['limit'],
                'storage_used_mb' => $data['used'],
                'country' => 'United Kingdom',
                'timezone' => 'Europe/London',
                'currency' => 'NGN',
                'onboarded_at' => now()->subMonths(rand(1, 10)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $schools = DB::table('schools')->pluck('id', 'code');
        $lincolnId = $schools['LC-SMTS-001'] ?? 1;

        // 3. School Subscriptions
        foreach ($schools as $code => $schoolId) {
            $isLincoln = ($code === 'LC-SMTS-001');
            DB::table('school_subscriptions')->updateOrInsert(
                ['school_id' => $schoolId],
                [
                    'plan_id' => $isLincoln ? $plans['enterprise-university'] : $plans['pro-academic'],
                    'billing_cycle' => 'yearly',
                    'amount' => $isLincoln ? 9990.00 : 4990.00,
                    'currency' => 'NGN',
                    'status' => ($code === 'VIS-SMTS-020') ? 'past_due' : (($code === 'CMA-SMTS-019') ? 'trialing' : 'active'),
                    'starts_at' => now()->subMonths(6),
                    'ends_at' => now()->addMonths(6),
                    'auto_renew' => true,
                    'invoice_reference' => 'INV-' . strtoupper(substr(md5($code), 0, 8)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 4. Initial Users (SuperAdmin Alexander Cross, Admin Dr. Sarah Jenkins, etc.)
        $password = Hash::make('password');

        // SuperAdmin (school_id is NULL)
        DB::table('users')->updateOrInsert(['email' => 'admin@lincolnplatform.io'], [
            'school_id' => null,
            'name' => 'Alexander Cross',
            'email' => 'admin@lincolnplatform.io',
            'password' => $password,
            'role' => 'superadmin',
            'phone' => '+44 20 7000 0001',
            'status' => 'active',
            'last_login_at' => now(),
            'last_login_ip' => '192.168.1.100',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // School Admin (Lincoln College)
        DB::table('users')->updateOrInsert(['email' => 's.jenkins@lincoln.edu'], [
            'school_id' => $lincolnId,
            'name' => 'Dr. Sarah Jenkins',
            'email' => 's.jenkins@lincoln.edu',
            'password' => $password,
            'role' => 'admin',
            'phone' => '+44 20 7946 0193',
            'status' => 'active',
            'last_login_at' => now()->subHours(2),
            'last_login_ip' => '82.165.197.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Teacher (Lincoln College)
        DB::table('users')->updateOrInsert(['email' => 'm.vance@lincoln.edu'], [
            'school_id' => $lincolnId,
            'name' => 'Prof. Marcus Vance',
            'email' => 'm.vance@lincoln.edu',
            'password' => $password,
            'role' => 'teacher',
            'phone' => '+44 20 7946 0194',
            'status' => 'active',
            'last_login_at' => now()->subHours(3),
            'last_login_ip' => '82.165.197.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Student (Lincoln College)
        DB::table('users')->updateOrInsert(['email' => 'l.chen24@lincoln.edu'], [
            'school_id' => $lincolnId,
            'name' => 'Liam Chen',
            'email' => 'l.chen24@lincoln.edu',
            'password' => $password,
            'role' => 'student',
            'phone' => '+44 7700 900123',
            'status' => 'active',
            'last_login_at' => now()->subHours(1),
            'last_login_ip' => '82.165.197.1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. Platform Settings
        $settings = [
            ['category' => 'general', 'key_name' => 'platform_name', 'display_name' => 'Platform Name', 'value' => 'Lincoln Multi-Tenant School Management System', 'data_type' => 'string', 'is_public' => true],
            ['category' => 'general', 'key_name' => 'platform_logo_url', 'display_name' => 'Platform Logo URL', 'value' => '/lincoln-logo.png', 'data_type' => 'string', 'is_public' => true],
            ['category' => 'general', 'key_name' => 'support_email', 'display_name' => 'Support Email', 'value' => 'support@lincolnplatform.io', 'data_type' => 'string', 'is_public' => true],
            ['category' => 'security', 'key_name' => 'mfa_enforced_superadmin', 'display_name' => 'Enforce MFA for SuperAdmin', 'value' => 'true', 'data_type' => 'boolean', 'is_public' => false],
            ['category' => 'security', 'key_name' => 'session_lifetime_minutes', 'display_name' => 'Session Lifetime (Minutes)', 'value' => '120', 'data_type' => 'integer', 'is_public' => false],
            ['category' => 'billing', 'key_name' => 'default_currency', 'display_name' => 'Default Currency', 'value' => 'NGN', 'data_type' => 'string', 'is_public' => true],
            ['category' => 'telemetry', 'key_name' => 'telemetry_collection_enabled', 'display_name' => 'Telemetry Analytics Enabled', 'value' => 'true', 'data_type' => 'boolean', 'is_public' => false],
        ];

        foreach ($settings as $setting) {
            DB::table('platform_settings')->updateOrInsert(['key_name' => $setting['key_name']], array_merge($setting, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 6. System Alerts
        DB::table('system_alerts')->updateOrInsert(['title' => 'Database Optimization Scheduled'], [
            'message' => 'Routine multi-tenant index maintenance and automated backups will run on Sunday at 02:00 UTC.',
            'alert_type' => 'info',
            'target_audience' => 'all',
            'is_active' => true,
            'expires_at' => now()->addDays(7),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('system_alerts')->updateOrInsert(['title' => 'Suspended Tenant Review Needed'], [
            'message' => 'Tenant #20 (Vanguard Institute of Sciences) is past due 60+ days and requires contract escalation.',
            'alert_type' => 'warning',
            'target_audience' => 'superadmins',
            'is_active' => true,
            'expires_at' => now()->addDays(14),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 7. Platform Telemetry (Last 7 Days)
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            DB::table('platform_telemetry')->updateOrInsert(['metric_date' => $date], [
                'active_schools_count' => 18,
                'trial_schools_count' => 1,
                'suspended_schools_count' => 1,
                'total_students_count' => 18500 + ($i * 120),
                'total_teachers_count' => 1180 + ($i * 10),
                'total_admins_count' => 52,
                'daily_active_users' => 14000 + ($i * 350),
                'total_api_requests' => 2500000 + ($i * 80000),
                'avg_response_time_ms' => 39.50,
                'server_cpu_percent' => 32.50,
                'server_ram_percent' => 55.40,
                'storage_used_gb' => 1050.00 + ($i * 10),
                'error_count' => rand(3, 12),
                'mrr_amount' => 90547.00,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 8. Audit Logs
        $superAdminUser = DB::table('users')->where('email', 'admin@lincolnplatform.io')->first();
        if ($superAdminUser) {
            DB::table('audit_logs')->insert([
                [
                    'user_id' => $superAdminUser->id,
                    'school_id' => null,
                    'event_type' => 'auth.login.success',
                    'action' => 'SuperAdmin Authentication',
                    'entity_type' => 'User',
                    'entity_id' => $superAdminUser->id,
                    'description' => 'Alexander Cross logged into SuperAdmin console from authorized subnet.',
                    'ip_address' => '192.168.1.100',
                    'severity' => 'info',
                    'created_at' => now()->subMinutes(15),
                ],
                [
                    'user_id' => $superAdminUser->id,
                    'school_id' => $lincolnId,
                    'event_type' => 'tenant.plan_updated',
                    'action' => 'Upgraded Tenant Subscription',
                    'entity_type' => 'School',
                    'entity_id' => $lincolnId,
                    'description' => 'Upgraded Lincoln College to Enterprise University tier.',
                    'ip_address' => '192.168.1.100',
                    'severity' => 'info',
                    'created_at' => now()->subHours(2),
                ],
            ]);
        }
    }
}
