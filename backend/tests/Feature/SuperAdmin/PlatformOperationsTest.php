<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** GROUP 4: SuperAdmin Module - user directory, audit trail and settings. */
class PlatformOperationsTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    private School $school;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'school_id' => null,
            'name' => 'Alexander Cross',
            'email' => 'admin@lincolnplatform.io',
            'password' => Hash::make('password'),
            'role' => User::ROLE_SUPERADMIN,
            'status' => User::STATUS_ACTIVE,
            'mfa_enabled' => true,
        ]);

        $this->school = School::create([
            'name' => 'Lincoln College of Science Management & Technology',
            'code' => 'LC-SMTS-001',
            'slug' => 'lincoln-college',
            'domain' => 'lincoln.edu',
            'contact_email' => 'admin@lincoln.edu',
            'city' => 'Lagos',
            'status' => School::STATUS_ACTIVE,
            'storage_limit_gb' => 1000,
            'storage_used_mb' => 0,
        ]);
    }

    public function test_user_directory_filters_by_role_and_tenant(): void
    {
        $this->makeUser('teacher@lincoln.edu', User::ROLE_TEACHER);
        $this->makeUser('student@lincoln.edu', User::ROLE_STUDENT);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-users?role=teacher')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'teacher@lincoln.edu');

        // Role counts accompany the page so the dashboard cards stay in step.
        $response->assertJsonPath('meta.roleCounts.teacher', 1)
            ->assertJsonPath('meta.roleCounts.student', 1)
            ->assertJsonPath('meta.roleCounts.superadmin', 1);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-users?school_code=LC-SMTS-001')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_superadmins_appear_without_a_tenant_boundary(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-users?role=superadmin')
            ->assertOk()
            ->assertJsonPath('data.0.schoolCode', 'PLATFORM')
            ->assertJsonPath('data.0.schoolName', 'Platform Operations');
    }

    public function test_revoking_one_accounts_sessions_is_audited(): void
    {
        $user = $this->makeUser('teacher@lincoln.edu', User::ROLE_TEACHER);
        $user->createToken('device')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/superadmin/system-users/{$user->id}/revoke-sessions")
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseHas('audit_logs', ['event_type' => 'auth.sessions_revoked']);
    }

    public function test_revoking_all_sessions_keeps_the_callers_own_token(): void
    {
        $other = $this->makeUser('teacher@lincoln.edu', User::ROLE_TEACHER);
        $other->createToken('their-device');

        $callerToken = $this->superAdmin->createToken('my-device')->accessToken;

        $this->withHeader('Authorization', 'Bearer '.$callerToken->token)
            ->postJson('/api/v1/superadmin/system-users/revoke-all-sessions');

        // The caller must not lock themselves out performing the action.
        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/superadmin/system-users/revoke-all-sessions')
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'auth.all_sessions_revoked',
            'severity' => AuditLog::SEVERITY_CRITICAL,
        ]);
    }

    public function test_audit_log_filters_by_severity_and_event_group(): void
    {
        AuditLog::create([
            'user_id' => $this->superAdmin->id,
            'event_type' => 'auth.login.success',
            'action' => 'Sign-in',
            'description' => 'SuperAdmin signed in.',
            'severity' => AuditLog::SEVERITY_INFO,
        ]);

        AuditLog::create([
            'user_id' => $this->superAdmin->id,
            'school_id' => $this->school->id,
            'event_type' => 'tenant.suspended',
            'action' => 'Suspended School Tenant',
            'description' => 'Suspended Lincoln College.',
            'severity' => AuditLog::SEVERITY_WARNING,
        ]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/audit-logs?severity=warning')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.eventType', 'tenant.suspended');

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/audit-logs?event_group=auth')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.eventType', 'auth.login.success');

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/audit-logs')
            ->assertOk()
            ->assertJsonPath('meta.severityCounts.warning', 1)
            ->assertJsonPath('meta.severityCounts.info', 1);
    }

    public function test_audit_log_exports_as_csv(): void
    {
        AuditLog::create([
            'user_id' => $this->superAdmin->id,
            'event_type' => 'auth.login.success',
            'action' => 'Sign-in',
            'description' => 'SuperAdmin signed in.',
            'severity' => AuditLog::SEVERITY_INFO,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->get('/api/v1/superadmin/audit-logs/export');

        $response->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();

        $this->assertStringContainsString('Timestamp,"Event Type",Severity', $csv);
        $this->assertStringContainsString('auth.login.success', $csv);
    }

    public function test_platform_settings_are_grouped_and_typed(): void
    {
        PlatformSetting::create([
            'category' => 'limits',
            'key_name' => 'default_storage_quota_gb',
            'display_name' => 'Default Storage Quota (GB)',
            'value' => '250',
            'data_type' => 'integer',
        ]);

        PlatformSetting::create([
            'category' => 'security',
            'key_name' => 'enforce_admin_mfa',
            'display_name' => 'Enforce MFA for Administrators',
            'value' => '1',
            'data_type' => 'boolean',
        ]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/platform-settings')
            ->assertOk()
            // Typed, not stringly: the frontend binds these straight to inputs.
            ->assertJsonPath('data.limits.0.value', 250)
            ->assertJsonPath('data.security.0.value', true);
    }

    public function test_updating_platform_settings_records_the_diff(): void
    {
        PlatformSetting::create([
            'category' => 'limits',
            'key_name' => 'default_storage_quota_gb',
            'display_name' => 'Default Storage Quota (GB)',
            'value' => '250',
            'data_type' => 'integer',
        ]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson('/api/v1/superadmin/platform-settings', [
                'settings' => [
                    ['key_name' => 'default_storage_quota_gb', 'value' => 500],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('changed.0', 'default_storage_quota_gb');

        $this->assertSame('500', PlatformSetting::where('key_name', 'default_storage_quota_gb')->value('value'));
        $this->assertDatabaseHas('audit_logs', ['event_type' => 'platform.settings_updated']);
    }

    public function test_updating_an_unknown_setting_is_rejected(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum')
            ->putJson('/api/v1/superadmin/platform-settings', [
                'settings' => [
                    ['key_name' => 'not_a_real_setting', 'value' => 'x'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['settings.0.key_name']);
    }

    private function makeUser(string $email, string $role): User
    {
        return User::create([
            'school_id' => $this->school->id,
            'name' => 'User '.$email,
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => $role,
            'status' => User::STATUS_ACTIVE,
        ]);
    }
}
