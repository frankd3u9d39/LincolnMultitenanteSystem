<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\User;
use App\Services\SuperAdmin\BackupService;
use App\Services\SuperAdmin\Totp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** GROUP 4: SuperAdmin Module - the operator's own account, keys and settings actions. */
class AccountTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Alexander Cross',
            'email' => 'admin@lincolnplatform.io',
            'password' => Hash::make('Old-password-1!'),
            'role' => User::ROLE_SUPERADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->token = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@lincolnplatform.io',
            'password' => 'Old-password-1!',
        ])->json('token');
    }

    /**
     * A request authenticated with the given bearer token. The auth guard caches
     * the user it resolves, which would otherwise leak one request's token
     * (and a stale copy of the user) into the next request within the same test.
     */
    private function api(string $token): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }

    /* ------------------------------ profile ------------------------------ */

    public function test_profile_and_preferences_round_trip(): void
    {
        $payload = [
            'fullName' => 'Alexander J. Cross',
            'jobTitle' => 'Chief Platform Administrator',
            'email' => 'admin@lincolnplatform.io',
            'phone' => '+234 802 000 1199',
            'timezone' => 'Africa/Lagos (GMT+1)',
            'language' => 'English (Nigeria)',
            'dateFormat' => 'YYYY-MM-DD',
            'notifications' => [
                'tenantOnboarded' => true, 'tenantSuspended' => false, 'quotaBreaches' => true,
                'securityAlerts' => true, 'backupResults' => true, 'weeklyDigest' => false,
                'channel' => 'email_sms',
            ],
        ];

        $this->api($this->token)->putJson('/api/v1/superadmin/account', $payload)->assertOk();

        $this->api($this->token)->getJson('/api/v1/superadmin/account')
            ->assertOk()
            ->assertJsonPath('data.profile.fullName', 'Alexander J. Cross')
            ->assertJsonPath('data.profile.dateFormat', 'YYYY-MM-DD')
            ->assertJsonPath('data.notifications.tenantSuspended', false)
            ->assertJsonPath('data.notifications.channel', 'email_sms');
    }

    public function test_the_profile_cannot_take_another_users_email(): void
    {
        User::create(['name' => 'Miriam', 'email' => 'm.dauda@lincolnplatform.io', 'password' => 'x', 'role' => User::ROLE_SUPERADMIN, 'status' => 'active']);

        $this->api($this->token)->putJson('/api/v1/superadmin/account', [
            'fullName' => 'Alexander Cross', 'jobTitle' => '', 'email' => 'm.dauda@lincolnplatform.io', 'phone' => '',
            'timezone' => 'Africa/Lagos (GMT+1)', 'language' => 'English (Nigeria)', 'dateFormat' => 'DD/MM/YYYY',
            'notifications' => [
                'tenantOnboarded' => true, 'tenantSuspended' => true, 'quotaBreaches' => true,
                'securityAlerts' => true, 'backupResults' => true, 'weeklyDigest' => true, 'channel' => 'email',
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    /* ------------------------------ password ----------------------------- */

    public function test_changing_the_password_enforces_the_platform_policy(): void
    {
        $change = fn (string $new, string $current = 'Old-password-1!') => $this->api($this->token)
            ->putJson('/api/v1/superadmin/account/password', [
                'current_password' => $current, 'password' => $new, 'password_confirmation' => $new,
            ]);

        $change('New-password-2!', 'wrong')->assertUnprocessable()->assertJsonValidationErrors(['current_password']);
        $change('short1!')->assertUnprocessable();
        $change('NoNumbersHere!!')->assertUnprocessable()->assertJsonValidationErrors(['password']);
        $change('NoSymbols12345')->assertUnprocessable()->assertJsonValidationErrors(['password']);
        $change('Old-password-1!')->assertUnprocessable();

        $change('New-password-2!')->assertOk();
        $this->assertTrue(Hash::check('New-password-2!', $this->superAdmin->fresh()->password));
    }

    public function test_changing_the_password_signs_out_other_devices_but_not_this_one(): void
    {
        $this->superAdmin->createToken('other-phone');
        $this->assertSame(2, $this->superAdmin->tokens()->count());

        $this->api($this->token)->putJson('/api/v1/superadmin/account/password', [
            'current_password' => 'Old-password-1!', 'password' => 'New-password-2!', 'password_confirmation' => 'New-password-2!',
        ])->assertOk();

        $this->assertSame(1, $this->superAdmin->tokens()->count());
        $this->api($this->token)->getJson('/api/v1/auth/me')->assertOk();
    }

    /* ------------------------------ sessions ----------------------------- */

    public function test_sessions_are_listed_and_the_other_devices_can_be_signed_out(): void
    {
        $this->superAdmin->createToken('phone');
        $this->superAdmin->createToken('tablet');

        $sessions = $this->api($this->token)->getJson('/api/v1/superadmin/account/sessions')
            ->assertOk()->json('data');

        $this->assertCount(3, $sessions);
        $this->assertCount(1, array_filter($sessions, fn ($s) => $s['current']));

        $this->api($this->token)->deleteJson('/api/v1/superadmin/account/sessions/others')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    /* ------------------------------ API keys ----------------------------- */

    public function test_a_created_key_shows_its_secret_once_and_stores_only_a_hash(): void
    {
        $response = $this->api($this->token)->postJson('/api/v1/superadmin/account/api-keys', [
            'label' => 'Attendance Sync Worker', 'scope' => 'read_only',
        ])->assertCreated();

        $secret = $response->json('secret');

        $this->assertStringStartsWith('lmp_live_', $secret);
        $this->assertDatabaseMissing('personal_access_tokens', ['token' => $secret]);

        $listed = $this->api($this->token)->getJson('/api/v1/superadmin/account/api-keys')->json('data');
        $this->assertSame('Attendance Sync Worker', $listed[0]['label']);
        $this->assertSame('active', $listed[0]['status']);
        $this->assertArrayNotHasKey('secret', $listed[0]);
    }

    public function test_key_labels_must_be_unique(): void
    {
        $body = ['label' => 'Attendance Sync Worker', 'scope' => 'read_only'];

        $this->api($this->token)->postJson('/api/v1/superadmin/account/api-keys', $body)->assertCreated();
        $this->api($this->token)->postJson('/api/v1/superadmin/account/api-keys', $body)
            ->assertUnprocessable()->assertJsonValidationErrors(['label']);
    }

    public function test_a_read_only_key_can_read_but_not_write(): void
    {
        $secret = $this->api($this->token)->postJson('/api/v1/superadmin/account/api-keys', [
            'label' => 'Reporting Worker', 'scope' => 'read_only',
        ])->json('secret');

        $school = School::create([
            'name' => 'Lincoln College', 'code' => 'LC-SMTS-001', 'slug' => 'lincoln', 'domain' => 'lincoln.edu',
            'contact_email' => 'a@lincoln.edu', 'city' => 'Lagos', 'status' => 'active', 'storage_limit_gb' => 100,
        ]);

        $this->api($secret)->getJson('/api/v1/superadmin/schools')->assertOk();

        $this->api($secret)->postJson("/api/v1/superadmin/schools/{$school->id}/suspend")
            ->assertForbidden()
            ->assertJsonPath('message', 'This API key does not have permission for that action.');

        $this->assertSame('active', $school->fresh()->status);
    }

    public function test_a_read_write_key_can_write_and_a_revoked_key_stops_working(): void
    {
        $created = $this->api($this->token)->postJson('/api/v1/superadmin/account/api-keys', [
            'label' => 'Provisioning Pipeline', 'scope' => 'read_write',
        ]);

        $secret = $created->json('secret');
        $keyId = $created->json('data.0.id');

        $this->api($secret)->getJson('/api/v1/superadmin/dashboard')->assertOk();

        $this->api($this->token)->deleteJson("/api/v1/superadmin/account/api-keys/{$keyId}")
            ->assertOk()
            ->assertJsonPath('data.0.status', 'revoked');

        // Revocation is immediate, and the key stays listed as revoked.
        $this->api($secret)->getJson('/api/v1/superadmin/dashboard')->assertUnauthorized();
    }

    /* -------------------------------- MFA -------------------------------- */

    public function test_enrolment_only_completes_with_a_genuine_authenticator_code(): void
    {
        $setup = $this->api($this->token)->postJson('/api/v1/superadmin/account/mfa/setup')
            ->assertOk()->json();

        $this->assertMatchesRegularExpression('/^[A-Z2-7]{32}$/', $setup['secret']);
        $this->assertStringStartsWith('otpauth://totp/', $setup['uri']);

        // Nothing is enabled until a code is confirmed.
        $this->assertFalse($this->superAdmin->fresh()->mfa_enabled);

        $this->api($this->token)->postJson('/api/v1/superadmin/account/mfa/confirm', ['code' => '123456'])
            ->assertUnprocessable()->assertJsonValidationErrors(['code']);
        $this->assertFalse($this->superAdmin->fresh()->mfa_enabled);

        $code = app(Totp::class)->code($setup['secret']);
        $confirmed = $this->api($this->token)->postJson('/api/v1/superadmin/account/mfa/confirm', ['code' => $code])
            ->assertOk();

        $this->assertCount(8, $confirmed->json('recoveryCodes'));
        $this->assertTrue($this->superAdmin->fresh()->mfa_enabled);
        $this->assertSame(8, $confirmed->json('data.security.recoveryCodesRemaining'));
    }

    public function test_confirming_without_starting_enrolment_is_rejected(): void
    {
        $this->api($this->token)->postJson('/api/v1/superadmin/account/mfa/confirm', ['code' => '123456'])
            ->assertUnprocessable();
    }

    public function test_re_enrolling_keeps_the_old_factor_until_the_new_one_is_confirmed(): void
    {
        $old = app(Totp::class)->generateSecret();
        $this->superAdmin->forceFill(['mfa_enabled' => true, 'mfa_secret' => $old])->save();

        $this->api($this->token)->postJson('/api/v1/superadmin/account/mfa/setup')->assertOk();

        // Abandoning the new setup must leave the existing factor untouched.
        $this->assertSame($old, $this->superAdmin->fresh()->mfa_secret);
    }

    public function test_recovery_codes_can_be_regenerated_only_once_mfa_is_enrolled(): void
    {
        $this->api($this->token)->postJson('/api/v1/superadmin/account/recovery-codes')->assertStatus(409);

        $this->superAdmin->forceFill(['mfa_enabled' => true, 'mfa_secret' => app(Totp::class)->generateSecret()])->save();

        $this->api($this->token)->postJson('/api/v1/superadmin/account/recovery-codes')
            ->assertOk()->assertJsonCount(8, 'recoveryCodes');
    }

    /* ----------------------------- settings ----------------------------- */

    public function test_secret_settings_are_encrypted_at_rest_and_never_returned(): void
    {
        PlatformSetting::create([
            'category' => 'mail', 'key_name' => 'smtp_password', 'display_name' => 'SMTP Password',
            'data_type' => 'string', 'is_encrypted' => true,
        ]);

        $this->api($this->token)->putJson('/api/v1/superadmin/platform-settings', [
            'settings' => [['key_name' => 'smtp_password', 'value' => 'hunter2-secret']],
        ])->assertOk();

        $stored = PlatformSetting::where('key_name', 'smtp_password')->value('value');
        $this->assertNotSame('hunter2-secret', $stored);
        $this->assertSame('hunter2-secret', PlatformSetting::valueOf('smtp_password'));

        $row = $this->api($this->token)->getJson('/api/v1/superadmin/platform-settings')->json('data.mail.0');
        $this->assertNull($row['value']);
        $this->assertTrue($row['isSet']);

        // Saving the form again with the field left blank keeps the secret.
        $this->api($this->token)->putJson('/api/v1/superadmin/platform-settings', [
            'settings' => [['key_name' => 'smtp_password', 'value' => '']],
        ])->assertOk();
        $this->assertSame('hunter2-secret', PlatformSetting::valueOf('smtp_password'));
    }

    public function test_out_of_range_setting_values_are_rejected(): void
    {
        PlatformSetting::create(['category' => 'security', 'key_name' => 'max_failed_logins', 'display_name' => 'x', 'value' => '5', 'data_type' => 'integer']);
        PlatformSetting::create(['category' => 'general', 'key_name' => 'support_email', 'display_name' => 'Support Email', 'value' => 'a@b.co', 'data_type' => 'string']);

        $this->api($this->token)->putJson('/api/v1/superadmin/platform-settings', [
            'settings' => [['key_name' => 'max_failed_logins', 'value' => 0]],
        ])->assertUnprocessable();

        $this->api($this->token)->putJson('/api/v1/superadmin/platform-settings', [
            'settings' => [['key_name' => 'support_email', 'value' => 'not-an-email']],
        ])->assertUnprocessable();

        $this->assertSame(5, PlatformSetting::valueOf('max_failed_logins'));
    }

    public function test_the_mail_test_reports_a_connection_failure_honestly(): void
    {
        foreach ([['mail_driver', 'smtp'], ['smtp_host', '127.0.0.1'], ['smtp_port', '1', 'integer']] as $row) {
            PlatformSetting::create(['category' => 'mail', 'key_name' => $row[0], 'display_name' => $row[0], 'value' => $row[1], 'data_type' => $row[2] ?? 'string']);
        }

        $this->api($this->token)->postJson('/api/v1/superadmin/platform-settings/test-email')
            ->assertUnprocessable()
            ->assertJsonPath('message', fn (string $message) => str_starts_with($message, 'Could not deliver through 127.0.0.1:1.'));

        $this->assertDatabaseHas('audit_logs', ['event_type' => 'platform.mail_test_failed']);
    }

    public function test_the_mail_test_refuses_drivers_without_an_installed_package(): void
    {
        PlatformSetting::create(['category' => 'mail', 'key_name' => 'mail_driver', 'display_name' => 'x', 'value' => 'mailgun', 'data_type' => 'string']);

        $this->api($this->token)->postJson('/api/v1/superadmin/platform-settings/test-email')->assertUnprocessable();
    }

    public function test_backup_copies_a_real_database_file(): void
    {
        $source = tempnam(sys_get_temp_dir(), 'lincoln').'.sqlite';
        file_put_contents($source, str_repeat('x', 4096));

        config(['database.connections.backup_probe' => ['driver' => 'sqlite', 'database' => $source, 'prefix' => '']]);

        $result = app(BackupService::class)->snapshot('backup_probe');

        $this->assertTrue($result['ok']);
        $this->assertSame(4096, $result['size_bytes']);
        $this->assertFileExists(storage_path('app/backups/'.$result['file']));

        @unlink(storage_path('app/backups/'.$result['file']));
        @unlink($source);
    }

    public function test_backup_declines_when_there_is_no_file_to_copy(): void
    {
        // The test database is in memory, so there is nothing real to snapshot.
        $this->api($this->token)->postJson('/api/v1/superadmin/platform-settings/backup')
            ->assertUnprocessable();

        $this->assertDatabaseHas('audit_logs', ['event_type' => 'platform.backup_failed']);
    }
}
