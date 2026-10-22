<?php

namespace Tests\Feature\Admin;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SchoolBrandingTest extends TestCase
{
    use RefreshDatabase;

    private School $school;
    private User $admin;
    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Lincoln Science & Tech Academy',
            'code' => 'LSTA-SMTS-001',
            'slug' => 'lsta-academy',
            'domain' => 'lsta.edu',
            'contact_email' => 'admin@lsta.edu',
            'status' => School::STATUS_ACTIVE,
            'primary_color' => '#B81D22',
            'secondary_color' => '#9E1519',
            'accent_color' => '#B81D22',
            'theme_palette' => 'crimson',
        ]);

        $this->admin = User::create([
            'school_id' => $this->school->id,
            'name' => 'Dr. Admin User',
            'email' => 'admin@lsta.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'admin_role' => 'principal_admin',
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->superAdmin = User::create([
            'name' => 'Root Super Administrator',
            'email' => 'superadmin@lincoln.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_SUPERADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_admin_settings_returns_portal_branding(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/settings');

        $response->assertOk()
            ->assertJsonPath('data.portalBranding.schoolName', 'Lincoln Science & Tech Academy')
            ->assertJsonPath('data.portalBranding.campusCode', 'LSTA-SMTS-001')
            ->assertJsonPath('data.portalBranding.primaryColor', '#B81D22')
            ->assertJsonPath('data.portalBranding.secondaryColor', '#9E1519')
            ->assertJsonPath('data.portalBranding.themePalette', 'crimson');
    }

    public function test_admin_can_upload_and_delete_school_logo(): void
    {
        $file = UploadedFile::fake()->image('crest.png', 400, 400);

        $uploadResponse = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/settings/logo', [
                'logo' => $file,
            ]);

        $uploadResponse->assertOk()
            ->assertJsonPath('status', 'success');

        $logoUrl = $uploadResponse->json('data.logoUrl');
        $this->assertNotNull($logoUrl);
        $this->assertStringStartsWith('/uploads/logos/', $logoUrl);

        $this->assertEquals($logoUrl, $this->school->fresh()->logo_url);

        // Delete logo
        $deleteResponse = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson('/api/v1/admin/settings/logo');

        $deleteResponse->assertOk()
            ->assertJsonPath('data.logoUrl', null);

        $this->assertNull($this->school->fresh()->logo_url);
    }

    public function test_admin_can_update_school_branding_palette(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/v1/admin/settings/branding', [
                'primaryColor' => '#1E3A8A',
                'secondaryColor' => '#172554',
                'accentColor' => '#2563EB',
                'themePalette' => 'navy',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.primaryColor', '#1E3A8A')
            ->assertJsonPath('data.themePalette', 'navy');

        $fresh = $this->school->fresh();
        $this->assertEquals('#1E3A8A', $fresh->primary_color);
        $this->assertEquals('#172554', $fresh->secondary_color);
        $this->assertEquals('navy', $fresh->theme_palette);
    }

    public function test_auth_me_returns_school_logo_and_school_theme(): void
    {
        $this->school->update([
            'logo_url' => '/uploads/logos/crest_test.png',
            'primary_color' => '#047857',
            'secondary_color' => '#064E3B',
            'theme_palette' => 'emerald',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/auth/me');

        $response->assertOk()
            ->assertJsonPath('user.schoolLogo', '/uploads/logos/crest_test.png')
            ->assertJsonPath('user.schoolTheme.primaryColor', '#047857')
            ->assertJsonPath('user.schoolTheme.secondaryColor', '#064E3B')
            ->assertJsonPath('user.schoolTheme.themePalette', 'emerald');
    }

    public function test_superadmin_onboarding_persists_branding_and_logo(): void
    {
        $logo = UploadedFile::fake()->image('oxford_logo.png', 300, 300);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->post('/api/v1/superadmin/schools', [
                'name' => 'Oxford High Tech Academy',
                'code' => 'OHT-SMTS-033',
                'domain' => 'oxford-tech.edu.ng',
                'city' => 'Abuja',
                'principal_admin' => 'Prof. Charles Oxford',
                'principal_email' => 'charles@oxford-tech.edu.ng',
                'storage_quota_gb' => 100,
                'activate_immediately' => '1',
                'primary_color' => '#1E3A8A',
                'secondary_color' => '#172554',
                'accent_color' => '#2563EB',
                'theme_palette' => 'navy',
                'logo' => $logo,
            ], [
                'Accept' => 'application/json',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'OHT-SMTS-033')
            ->assertJsonPath('data.primaryColor', '#1E3A8A')
            ->assertJsonPath('data.themePalette', 'navy');

        $createdSchool = School::where('code', 'OHT-SMTS-033')->firstOrFail();
        $this->assertEquals('#1E3A8A', $createdSchool->primary_color);
        $this->assertEquals('navy', $createdSchool->theme_palette);
        $this->assertNotNull($createdSchool->logo_url);
        $this->assertStringStartsWith('/uploads/logos/', $createdSchool->logo_url);
    }
}
