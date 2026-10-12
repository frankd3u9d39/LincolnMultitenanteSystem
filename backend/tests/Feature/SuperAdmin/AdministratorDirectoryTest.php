<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** GROUP 4: SuperAdmin Module - administrator directory, invitations and posture. */
class AdministratorDirectoryTest extends TestCase
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

    public function test_inviting_an_administrator_creates_a_pending_account(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/superadmin/administrators', [
                'full_name' => 'Dr. Chiamaka Nwachukwu',
                'email' => 'c.nwachukwu@lincoln.edu',
                'phone' => '+234 803 555 0142',
                'school_code' => 'LC-SMTS-001',
                'role' => 'deputy_admin',
                'require_mfa' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'invited')
            ->assertJsonPath('data.role', 'deputy_admin')
            ->assertJsonPath('data.mfaEnabled', false)
            ->assertJsonPath('data.schoolCode', 'LC-SMTS-001');

        $this->assertDatabaseHas('users', [
            'email' => 'c.nwachukwu@lincoln.edu',
            'role' => User::ROLE_ADMIN,
            'admin_role' => 'deputy_admin',
            'school_id' => $this->school->id,
        ]);

        $this->assertDatabaseHas('audit_logs', ['event_type' => 'user.invited']);
    }

    public function test_inviting_rejects_a_duplicate_email(): void
    {
        $this->makeAdministrator('s.jenkins@lincoln.edu');

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/superadmin/administrators', [
                'full_name' => 'Someone Else',
                'email' => 's.jenkins@lincoln.edu',
                'phone' => '+234 803 555 0142',
                'school_code' => 'LC-SMTS-001',
                'role' => 'deputy_admin',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_inviting_rejects_an_unknown_tenant(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/superadmin/administrators', [
                'full_name' => 'Dr. Chiamaka Nwachukwu',
                'email' => 'c.nwachukwu@example.edu',
                'phone' => '+234 803 555 0142',
                'school_code' => 'NOPE-SMTS-999',
                'role' => 'deputy_admin',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['school_code']);
    }

    public function test_directory_can_isolate_the_mfa_gap(): void
    {
        $this->makeAdministrator('with.mfa@lincoln.edu', ['mfa_enabled' => true]);
        $this->makeAdministrator('without.mfa@lincoln.edu', ['mfa_enabled' => false]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/administrators?mfa_gap_only=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'without.mfa@lincoln.edu');
    }

    public function test_enforcing_mfa_updates_the_selected_accounts(): void
    {
        $first = $this->makeAdministrator('one@lincoln.edu', ['mfa_enabled' => false]);
        $second = $this->makeAdministrator('two@lincoln.edu', ['mfa_enabled' => false]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/superadmin/administrators/enforce-mfa', [
                'administrator_ids' => [$first->id, $second->id],
            ])
            ->assertOk()
            ->assertJsonPath('affected', 2);

        // Enforcement makes enrolment mandatory; it does not count as enrolled.
        $this->assertTrue($first->fresh()->mfa_required);
        $this->assertTrue($second->fresh()->mfa_required);
        $this->assertFalse($first->fresh()->mfa_enabled);
        $this->assertDatabaseHas('audit_logs', ['event_type' => 'user.mfa_enforced']);
    }

    public function test_suspending_an_administrator_is_audited(): void
    {
        $administrator = $this->makeAdministrator('s.jenkins@lincoln.edu');

        $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/v1/superadmin/administrators/{$administrator->id}/status", [
                'status' => User::STATUS_INACTIVE,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'disabled');

        $this->assertDatabaseHas('audit_logs', ['event_type' => 'user.suspended']);
    }

    public function test_access_report_computes_mfa_coverage_and_flags(): void
    {
        $this->makeAdministrator('covered@lincoln.edu', [
            'mfa_enabled' => true,
            'last_login_at' => now()->subHour(),
        ]);
        $this->makeAdministrator('no.mfa@lincoln.edu', [
            'mfa_enabled' => false,
            'last_login_at' => now()->subHour(),
        ]);
        $this->makeAdministrator('dormant@lincoln.edu', [
            'mfa_enabled' => true,
            'last_login_at' => now()->subDays(40),
        ]);
        $this->makeAdministrator('never@lincoln.edu', [
            'mfa_enabled' => true,
            'last_login_at' => null,
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/administrators/access-report')
            ->assertOk();

        // Three of four administrators have MFA enrolled.
        $response->assertJsonPath('data.total', 4)
            ->assertJsonPath('data.mfaEnabled', 3)
            ->assertJsonPath('data.mfaCoveragePercent', 75)
            ->assertJsonPath('data.flaggedCount', 3);

        $flags = collect($response->json('data.flagged'))
            ->mapWithKeys(fn (array $row) => [$row['administrator']['email'] => $row['flags']]);

        $this->assertSame(['no_mfa'], $flags['no.mfa@lincoln.edu']);
        $this->assertSame(['dormant'], $flags['dormant@lincoln.edu']);
        $this->assertSame(['never_signed_in'], $flags['never@lincoln.edu']);
    }

    /** @param  array<string, mixed>  $attributes */
    private function makeAdministrator(string $email, array $attributes = []): User
    {
        return User::create(array_merge([
            'school_id' => $this->school->id,
            'name' => 'Administrator '.$email,
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
            'mfa_enabled' => false,
        ], $attributes));
    }
}
