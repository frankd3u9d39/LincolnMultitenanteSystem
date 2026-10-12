<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Settings that are only worth having if they change behaviour: maintenance
 * mode, the SuperAdmin IP allow-list, the session timeout and MFA policy.
 */
class PlatformEnforcementTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    private User $schoolAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Alexander Cross', 'email' => 'admin@lincolnplatform.io', 'password' => Hash::make('password'),
            'role' => User::ROLE_SUPERADMIN, 'status' => User::STATUS_ACTIVE,
        ]);

        $school = School::create([
            'name' => 'Lincoln College', 'code' => 'LC-SMTS-001', 'slug' => 'lincoln', 'domain' => 'lincoln.edu',
            'contact_email' => 'a@lincoln.edu', 'city' => 'Lagos', 'status' => 'active', 'storage_limit_gb' => 100,
        ]);

        $this->schoolAdmin = User::create([
            'school_id' => $school->id, 'name' => 'Dr. Sarah Jenkins', 'email' => 's.jenkins@lincoln.edu',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN, 'status' => User::STATUS_ACTIVE,
        ]);
    }

    private function setting(string $key, string $value, string $type = 'string'): void
    {
        PlatformSetting::updateOrCreate(['key_name' => $key], [
            'category' => 'general', 'display_name' => $key, 'value' => $value, 'data_type' => $type,
        ]);
    }

    private function login(string $email, array $server = []): TestResponse
    {
        $this->app['auth']->forgetGuards();

        return $this->withServerVariables($server)->postJson('/api/v1/auth/login', ['email' => $email, 'password' => 'password']);
    }

    private function api(string $token, array $server = []): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withServerVariables($server)->withToken($token);
    }

    /* --------------------------- maintenance mode --------------------------- */

    public function test_maintenance_mode_blocks_school_users_but_not_superadmins(): void
    {
        $schoolToken = $this->login('s.jenkins@lincoln.edu')->json('token');
        $superToken = $this->login('admin@lincolnplatform.io')->json('token');

        $this->setting('maintenance_mode', '1', 'boolean');
        $this->setting('maintenance_message', 'Back at 06:00 after the database upgrade.');

        $this->api($schoolToken)->getJson('/api/v1/auth/me')
            ->assertStatus(503)
            ->assertJsonPath('message', 'Back at 06:00 after the database upgrade.')
            ->assertJsonPath('maintenance', true);

        $this->api($superToken)->getJson('/api/v1/superadmin/dashboard')->assertOk();
    }

    public function test_maintenance_mode_refuses_school_sign_ins_but_lets_superadmins_in_to_end_it(): void
    {
        $this->setting('maintenance_mode', '1', 'boolean');

        $this->login('s.jenkins@lincoln.edu')->assertStatus(503)->assertJsonPath('maintenance', true);
        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->login('admin@lincolnplatform.io')->assertOk()->assertJsonStructure(['token']);
    }

    public function test_a_bypass_address_gets_through_maintenance_mode(): void
    {
        $this->setting('maintenance_mode', '1', 'boolean');
        $this->setting('allowed_bypass_ips', '10.0.0.5, 197.210.54.12', 'text');

        $this->login('s.jenkins@lincoln.edu', ['REMOTE_ADDR' => '197.210.54.12'])->assertOk();
        $this->login('s.jenkins@lincoln.edu', ['REMOTE_ADDR' => '102.89.1.1'])->assertStatus(503);
    }

    public function test_switching_maintenance_mode_off_restores_access(): void
    {
        $token = $this->login('s.jenkins@lincoln.edu')->json('token');
        $this->setting('maintenance_mode', '1', 'boolean');
        $this->api($token)->getJson('/api/v1/auth/me')->assertStatus(503);

        $this->setting('maintenance_mode', '0', 'boolean');
        $this->api($token)->getJson('/api/v1/auth/me')->assertOk();
    }

    /* ----------------------------- IP allow-list ---------------------------- */

    public function test_the_ip_allow_list_limits_superadmin_access(): void
    {
        $token = $this->login('admin@lincolnplatform.io')->json('token');

        $this->setting('ip_whitelist_enabled', '1', 'boolean');
        $this->setting('allowed_superadmin_ips', '192.168.1.100, 10.0.0.45', 'text');

        $this->api($token, ['REMOTE_ADDR' => '203.0.113.9'])->getJson('/api/v1/superadmin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('message', 'SuperAdmin access is restricted to approved IP addresses, and yours is not on the list.');

        $this->api($token, ['REMOTE_ADDR' => '10.0.0.45'])->getJson('/api/v1/superadmin/dashboard')->assertOk();
    }

    public function test_enabling_the_allow_list_without_your_own_address_is_refused(): void
    {
        $token = $this->login('admin@lincolnplatform.io')->json('token');

        PlatformSetting::create(['category' => 'security', 'key_name' => 'ip_whitelist_enabled', 'display_name' => 'x', 'value' => '0', 'data_type' => 'boolean']);
        PlatformSetting::create(['category' => 'security', 'key_name' => 'allowed_superadmin_ips', 'display_name' => 'x', 'value' => '', 'data_type' => 'text']);

        $this->api($token)->putJson('/api/v1/superadmin/platform-settings', [
            'settings' => [
                ['key_name' => 'allowed_superadmin_ips', 'value' => '10.9.9.9'],
                ['key_name' => 'ip_whitelist_enabled', 'value' => true],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors(['settings']);

        // The whole batch rolled back, so the operator is not locked out.
        $this->assertFalse(PlatformSetting::valueOf('ip_whitelist_enabled', false));
        $this->api($token)->getJson('/api/v1/superadmin/dashboard')->assertOk();
    }

    public function test_the_allow_list_can_be_enabled_once_your_address_is_on_it(): void
    {
        $token = $this->login('admin@lincolnplatform.io')->json('token');

        PlatformSetting::create(['category' => 'security', 'key_name' => 'ip_whitelist_enabled', 'display_name' => 'x', 'value' => '0', 'data_type' => 'boolean']);
        PlatformSetting::create(['category' => 'security', 'key_name' => 'allowed_superadmin_ips', 'display_name' => 'x', 'value' => '', 'data_type' => 'text']);

        $this->api($token)->putJson('/api/v1/superadmin/platform-settings', [
            'settings' => [
                ['key_name' => 'allowed_superadmin_ips', 'value' => '127.0.0.1, 10.9.9.9'],
                ['key_name' => 'ip_whitelist_enabled', 'value' => true],
            ],
        ])->assertOk();

        $this->assertTrue(PlatformSetting::valueOf('ip_whitelist_enabled', false));
    }

    /* ---------------------------- session timeout --------------------------- */

    public function test_an_inactive_session_expires_after_the_configured_timeout(): void
    {
        $this->setting('session_timeout_minutes', '30', 'integer');
        $token = $this->login('admin@lincolnplatform.io')->json('token');

        $this->api($token)->getJson('/api/v1/auth/me')->assertOk();

        DB::table('personal_access_tokens')->update(['last_used_at' => now()->subMinutes(31)]);

        $this->api($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_activity_within_the_timeout_keeps_a_session_alive(): void
    {
        $this->setting('session_timeout_minutes', '30', 'integer');
        $token = $this->login('admin@lincolnplatform.io')->json('token');

        DB::table('personal_access_tokens')->update(['last_used_at' => now()->subMinutes(29)]);

        $this->api($token)->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_api_keys_are_exempt_from_the_session_timeout(): void
    {
        $this->setting('session_timeout_minutes', '30', 'integer');
        $token = $this->login('admin@lincolnplatform.io')->json('token');

        $secret = $this->api($token)->postJson('/api/v1/superadmin/account/api-keys', ['label' => 'Nightly Sync', 'scope' => 'read_only'])
            ->json('secret');

        DB::table('personal_access_tokens')->where('name', 'like', 'api:%')->update(['last_used_at' => now()->subDays(2)]);

        $this->api($secret)->getJson('/api/v1/superadmin/dashboard')->assertOk();
    }

    /* ------------------------------- MFA policy ----------------------------- */

    public function test_the_mfa_policy_flags_school_administrators_who_must_enrol(): void
    {
        $this->setting('enforce_admin_mfa', '1', 'boolean');

        $this->login('s.jenkins@lincoln.edu')->assertOk()->assertJsonPath('mfaSetupRequired', true);

        $this->schoolAdmin->forceFill(['mfa_enabled' => true])->save();
        $this->login('s.jenkins@lincoln.edu')->assertOk()->assertJsonPath('mfaSetupRequired', false);
    }

    public function test_enforcing_mfa_on_one_account_flags_it_even_without_the_platform_policy(): void
    {
        $this->setting('enforce_admin_mfa', '0', 'boolean');
        $this->login('s.jenkins@lincoln.edu')->assertJsonPath('mfaSetupRequired', false);

        $this->schoolAdmin->forceFill(['mfa_required' => true])->save();
        $this->login('s.jenkins@lincoln.edu')->assertJsonPath('mfaSetupRequired', true);
    }
}
