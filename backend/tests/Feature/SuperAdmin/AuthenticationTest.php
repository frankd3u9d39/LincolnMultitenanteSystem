<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\User;
use App\Services\SuperAdmin\Totp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** Shared sign-in: credentials, lockout, second factor and session lifecycle. */
class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Alexander Cross',
            'email' => 'admin@lincolnplatform.io',
            'password' => Hash::make('password'),
            'role' => User::ROLE_SUPERADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_valid_credentials_return_a_token_that_reaches_the_api(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'Admin@LincolnPlatform.io',
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'superadmin')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);

        $this->withToken($response->json('token'))
            ->getJson('/api/v1/superadmin/dashboard')
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', ['event_type' => 'auth.login.success']);
        $this->assertNotNull($this->superAdmin->fresh()->last_login_at);
    }

    public function test_the_session_records_the_device_it_signed_in_from(): void
    {
        $this->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0) Chrome/141.0')
            ->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'password'])
            ->assertOk();

        $token = $this->superAdmin->tokens()->first();

        $this->assertStringContainsString('Chrome', $token->user_agent);
        $this->assertNotNull($token->ip_address);
    }

    public function test_wrong_password_and_unknown_address_look_identical(): void
    {
        $wrong = $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'nope']);
        $unknown = $this->postJson('/api/v1/auth/login', ['email' => 'nobody@example.com', 'password' => 'nope']);

        $wrong->assertStatus(422);
        $unknown->assertStatus(422);
        $this->assertSame($wrong->json('message'), $unknown->json('message'));
    }

    public function test_repeated_failures_lock_the_account_using_the_configured_threshold(): void
    {
        PlatformSetting::create(['category' => 'security', 'key_name' => 'max_failed_logins', 'display_name' => 'x', 'value' => '3', 'data_type' => 'integer']);

        foreach (range(1, 2) as $_) {
            $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'bad'])->assertStatus(422);
        }

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'bad'])
            ->assertStatus(429)
            ->assertJsonPath('locked', true);

        // Even the right password is refused while the lockout lasts.
        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'password'])
            ->assertStatus(429);

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'auth.login.locked',
            'severity' => AuditLog::SEVERITY_CRITICAL,
        ]);
    }

    public function test_a_successful_sign_in_resets_the_failure_counter(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'bad']);
        $this->assertSame(1, $this->superAdmin->fresh()->failed_login_attempts);

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'password'])->assertOk();
        $this->assertSame(0, $this->superAdmin->fresh()->failed_login_attempts);
    }

    public function test_accounts_that_are_not_active_cannot_sign_in(): void
    {
        $this->superAdmin->update(['status' => User::STATUS_PENDING]);

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'password'])
            ->assertForbidden();
    }

    public function test_users_of_a_suspended_school_cannot_sign_in(): void
    {
        $school = School::create([
            'name' => 'Vanguard Institute of Sciences', 'code' => 'VIS-SMTS-020', 'slug' => 'vanguard',
            'domain' => 'vanguardsciences.edu', 'contact_email' => 'a@vanguardsciences.edu', 'city' => 'Aba',
            'status' => School::STATUS_SUSPENDED, 'storage_limit_gb' => 50,
        ]);

        User::create([
            'school_id' => $school->id, 'name' => 'Arthur Pendelton', 'email' => 'a.pendelton@vanguardsciences.edu',
            'password' => Hash::make('password'), 'role' => User::ROLE_ADMIN, 'status' => User::STATUS_ACTIVE,
        ]);

        $this->postJson('/api/v1/auth/login', ['email' => 'a.pendelton@vanguardsciences.edu', 'password' => 'password'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Your school has been suspended. Contact the platform administrator.');
    }

    public function test_an_enrolled_account_must_present_a_valid_authenticator_code(): void
    {
        $totp = app(Totp::class);
        $secret = $totp->generateSecret();
        $this->superAdmin->forceFill(['mfa_enabled' => true, 'mfa_secret' => $secret])->save();

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'password'])
            ->assertStatus(422)
            ->assertJsonPath('mfa_required', true);

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'password', 'code' => '000000'])
            ->assertStatus(422);

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'password', 'code' => $totp->code($secret)])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_a_recovery_code_works_once(): void
    {
        $secret = app(Totp::class)->generateSecret();
        $this->superAdmin->forceFill([
            'mfa_enabled' => true,
            'mfa_secret' => $secret,
            'mfa_recovery_codes' => [Hash::make('ABCDE-12345')],
        ])->save();

        $attempt = fn () => $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@lincolnplatform.io', 'password' => 'password', 'code' => 'abcde-12345',
        ]);

        $attempt()->assertOk();
        $attempt()->assertStatus(422);
    }

    public function test_me_and_logout(): void
    {
        $token = $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'password'])->json('token');

        $this->withToken($token)->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@lincolnplatform.io');

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseHas('audit_logs', ['event_type' => 'auth.logout']);
    }

    public function test_password_reset_signs_every_device_out(): void
    {
        $this->superAdmin->createToken('device');

        $broker = app('auth.password.broker');
        $resetToken = $broker->createToken($this->superAdmin);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $resetToken,
            'email' => 'admin@lincolnplatform.io',
            'password' => 'A-brand-new-pass-9',
            'password_confirmation' => 'A-brand-new-pass-9',
        ])->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@lincolnplatform.io', 'password' => 'A-brand-new-pass-9'])->assertOk();
    }

    public function test_forgot_password_never_reveals_whether_an_address_exists(): void
    {
        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'admin@lincolnplatform.io']);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com']);

        $known->assertOk();
        $unknown->assertOk();
        $this->assertSame($known->json('message'), $unknown->json('message'));
    }
}
