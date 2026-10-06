<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * GROUP 4: SuperAdmin Module - authorisation gate.
 *
 * Every endpoint operates across all tenant boundaries, so the role check
 * matters more here than anywhere else in the system.
 */
class SuperAdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_rejected(): void
    {
        $this->getJson('/api/v1/superadmin/dashboard')->assertUnauthorized();
    }

    public function test_school_administrators_are_forbidden(): void
    {
        $school = $this->makeSchool();

        $admin = User::create([
            'school_id' => $school->id,
            'name' => 'Dr. Sarah Jenkins',
            'email' => 's.jenkins@lincoln.edu',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/superadmin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('message', 'This area is restricted to platform SuperAdministrators.');
    }

    public function test_suspended_superadmins_are_forbidden(): void
    {
        $superAdmin = $this->makeSuperAdmin(['status' => User::STATUS_SUSPENDED]);

        $this->actingAs($superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/dashboard')
            ->assertForbidden();
    }

    public function test_active_superadmins_reach_the_dashboard(): void
    {
        $superAdmin = $this->makeSuperAdmin();
        $this->makeSchool();

        $this->actingAs($superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'tenants' => ['total', 'active', 'pending', 'suspended', 'needs_attention'],
                    'population' => ['students', 'teachers', 'administrators', 'total'],
                    'storage' => ['used_gb', 'quota_gb', 'usage_percent'],
                    'infrastructure',
                    'recentActivity',
                ],
            ]);
    }

    /** @param  array<string, mixed>  $attributes */
    private function makeSuperAdmin(array $attributes = []): User
    {
        return User::create(array_merge([
            'school_id' => null,
            'name' => 'Alexander Cross',
            'email' => 'admin@lincolnplatform.io',
            'password' => Hash::make('password'),
            'role' => User::ROLE_SUPERADMIN,
            'status' => User::STATUS_ACTIVE,
            'mfa_enabled' => true,
        ], $attributes));
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
            'storage_used_mb' => 142350.50,
        ], $attributes));
    }
}
