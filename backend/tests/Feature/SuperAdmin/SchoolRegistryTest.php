<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\AuditLog;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** GROUP 4: SuperAdmin Module - tenant registry and lifecycle. */
class SchoolRegistryTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

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
    }

    public function test_provisioning_creates_the_tenant_and_its_principal_administrator(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/superadmin/schools', [
                'name' => 'Riverside Institute of Technology',
                'code' => 'RIT-SMTS-022',
                'domain' => 'riverside-tech.edu.ng',
                'city' => 'Ibadan',
                'principal_admin' => 'Dr. Ifeoma Balogun',
                'principal_email' => 'i.balogun@riverside-tech.edu.ng',
                'storage_quota_gb' => 250,
                'activate_immediately' => false,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'RIT-SMTS-022')
            ->assertJsonPath('data.status', School::STATUS_PENDING)
            ->assertJsonPath('data.storageQuotaGb', 250);

        $school = School::where('code', 'RIT-SMTS-022')->first();
        $this->assertNotNull($school);

        // The tenant must come with a way in.
        $this->assertDatabaseHas('users', [
            'email' => 'i.balogun@riverside-tech.edu.ng',
            'school_id' => $school->id,
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_PENDING,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'tenant.provisioned',
            'school_id' => $school->id,
        ]);
    }

    public function test_provisioning_rejects_a_duplicate_tenant_code_and_domain(): void
    {
        $this->makeSchool();

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/superadmin/schools', [
                'name' => 'Another College Entirely',
                'code' => 'LC-SMTS-001',
                'domain' => 'lincoln.edu',
                'city' => 'Lagos',
                'principal_admin' => 'Jane Doe',
                'principal_email' => 'jane@example.edu',
                'storage_quota_gb' => 100,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code', 'domain']);
    }

    public function test_provisioning_rejects_a_malformed_tenant_code(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson('/api/v1/superadmin/schools', [
                'name' => 'Riverside Institute of Technology',
                'code' => 'not-a-code',
                'domain' => 'riverside-tech.edu.ng',
                'city' => 'Ibadan',
                'principal_admin' => 'Dr. Ifeoma Balogun',
                'principal_email' => 'i.balogun@riverside-tech.edu.ng',
                'storage_quota_gb' => 250,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }

    public function test_quota_cannot_be_set_below_current_usage(): void
    {
        $school = $this->makeSchool(['storage_used_mb' => 210 * 1024]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/v1/superadmin/schools/{$school->id}/quota", ['storage_quota_gb' => 100])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['storage_quota_gb']);

        $this->assertSame(1000, $school->fresh()->storage_limit_gb);
    }

    public function test_quota_change_is_applied_and_audited(): void
    {
        $school = $this->makeSchool(['storage_used_mb' => 210 * 1024]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/v1/superadmin/schools/{$school->id}/quota", ['storage_quota_gb' => 2000])
            ->assertOk()
            ->assertJsonPath('data.storageQuotaGb', 2000);

        $this->assertSame(2000, $school->fresh()->storage_limit_gb);
        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'tenant.quota_changed',
            'school_id' => $school->id,
        ]);
    }

    public function test_suspending_and_reinstating_a_tenant(): void
    {
        $school = $this->makeSchool();

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/superadmin/schools/{$school->id}/suspend", ['reason' => 'Dormant tenant policy'])
            ->assertOk()
            ->assertJsonPath('data.status', School::STATUS_SUSPENDED);

        // Suspending twice is a conflict, not a silent no-op.
        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/superadmin/schools/{$school->id}/suspend")
            ->assertStatus(409);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/superadmin/schools/{$school->id}/reinstate")
            ->assertOk()
            ->assertJsonPath('data.status', School::STATUS_ACTIVE);

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'tenant.suspended',
            'severity' => AuditLog::SEVERITY_WARNING,
        ]);
    }

    public function test_support_access_needs_a_reason_and_is_audited_as_a_warning(): void
    {
        $school = $this->makeSchool();

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/superadmin/schools/{$school->id}/support-access", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reason']);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->postJson("/api/v1/superadmin/schools/{$school->id}/support-access", ['reason' => 'Investigating a result import'])
            ->assertOk()
            ->assertJsonStructure(['message', 'expiresAt']);

        $this->assertDatabaseHas('audit_logs', [
            'event_type' => 'tenant.support_access',
            'school_id' => $school->id,
            'severity' => AuditLog::SEVERITY_WARNING,
        ]);
    }

    public function test_registry_filters_by_status_and_search(): void
    {
        $this->makeSchool();
        $this->makeSchool([
            'name' => 'Vanguard Institute of Sciences',
            'code' => 'VIS-SMTS-020',
            'slug' => 'vanguard',
            'domain' => 'vanguardsciences.edu',
            'contact_email' => 'admin@vanguardsciences.edu',
            'status' => School::STATUS_SUSPENDED,
        ]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/schools?status=suspended')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'VIS-SMTS-020');

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/schools?search=lincoln')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'LC-SMTS-001');
    }

    /** @param  array<string, mixed>  $attributes */
    private function makeSchool(array $attributes = []): School
    {
        return School::create(array_merge([
            'name' => 'Lincoln College of Science Management & Technology',
            'code' => 'LC-SMTS-001',
            'slug' => 'lincoln-college',
            'domain' => 'lincoln.edu',
            'contact_email' => 'admin@lincoln.edu',
            'city' => 'Lagos',
            'status' => School::STATUS_ACTIVE,
            'storage_limit_gb' => 1000,
            'storage_used_mb' => 0,
        ], $attributes));
    }
}
