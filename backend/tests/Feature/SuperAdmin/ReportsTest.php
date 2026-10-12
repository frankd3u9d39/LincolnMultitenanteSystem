<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\AuditLog;
use App\Models\PlatformTelemetry;
use App\Models\School;
use App\Models\SchoolMetric;
use App\Models\User;
use App\Services\SuperAdmin\PlatformMetricsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** GROUP 4: SuperAdmin Module - telemetry ranges, compliance scoring, audit headline. */
class ReportsTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Alexander Cross', 'email' => 'admin@lincolnplatform.io', 'password' => Hash::make('password'),
            'role' => User::ROLE_SUPERADMIN, 'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_the_seven_day_range_compares_against_the_seven_days_before(): void
    {
        // Days 13..7 ago average 1,000 users; the latest seven days average 1,500.
        foreach (range(13, 7) as $daysAgo) {
            $this->day($daysAgo, dau: 1000);
        }
        foreach (range(6, 0) as $daysAgo) {
            $this->day($daysAgo, dau: 1500);
        }

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-reports?range=7d')
            ->assertOk();

        $response->assertJsonCount(7, 'data.telemetry.series')
            ->assertJsonPath('data.telemetry.summary.avgDau', 1500)
            ->assertJsonPath('data.telemetry.previous.avgDau', 1000)
            ->assertJsonPath('data.telemetry.changes.dauPercent', 50);
    }

    public function test_longer_ranges_are_bucketed_to_keep_charts_legible(): void
    {
        foreach (range(299, 0) as $daysAgo) {
            $this->day($daysAgo, dau: 1000);
        }

        $count = fn (string $range) => count(
            $this->actingAs($this->superAdmin, 'sanctum')
                ->getJson("/api/v1/superadmin/system-reports?range={$range}")
                ->assertOk()
                ->json('data.telemetry.series')
        );

        $this->assertSame(30, $count('30d'));
        // Weekly buckets across a quarter, rather than 90 slivers.
        $this->assertLessThanOrEqual(14, $count('quarter'));
        $this->assertGreaterThanOrEqual(12, $count('quarter'));
        // Monthly buckets for the year to date.
        $this->assertLessThanOrEqual(12, $count('ytd'));
    }

    public function test_the_error_rate_is_errors_over_requests(): void
    {
        $this->day(1, dau: 100, requests: 1_000_000, errors: 100);
        $this->day(0, dau: 100, requests: 1_000_000, errors: 100);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-reports?range=7d')
            ->assertJsonPath('data.telemetry.summary.totalErrors', 200)
            ->assertJsonPath('data.telemetry.summary.errorRatePercent', 0.01);
    }

    public function test_an_unknown_range_is_rejected_and_an_empty_platform_does_not_error(): void
    {
        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-reports?range=decade')
            ->assertUnprocessable();

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-reports?range=7d')
            ->assertOk()
            ->assertJsonPath('data.telemetry.series', []);
    }

    public function test_compliance_score_deducts_for_each_concrete_risk(): void
    {
        $healthy = $this->school('LC-SMTS-001', 'healthy.edu');
        $this->admin($healthy, mfa: true);
        $this->metric($healthy, activeDaysAgo: 1);

        $risky = $this->school('RK-SMTS-002', 'risky.edu', status: School::STATUS_SUSPENDED, usedMb: 95 * 1024, quotaGb: 100);
        $this->admin($risky, mfa: false);
        $this->metric($risky, activeDaysAgo: 30);

        $service = app(PlatformMetricsService::class);

        $this->assertSame(100, $service->complianceScore($healthy->load(['latestMetric', 'administrators'])));
        // suspended (-20), no MFA (-15), storage over 85% (-10), dormant (-10)
        $this->assertSame(45, $service->complianceScore($risky->load(['latestMetric', 'administrators'])));
    }

    public function test_the_dashboard_population_matches_what_the_registry_shows(): void
    {
        $one = $this->school('LC-SMTS-001', 'one.edu');
        $two = $this->school('RK-SMTS-002', 'two.edu');

        // An older snapshot must not be counted alongside the newer one.
        SchoolMetric::create(['school_id' => $one->id, 'metric_date' => today()->subDays(3)->toDateString(), 'student_count' => 900, 'teacher_count' => 50]);
        SchoolMetric::create(['school_id' => $one->id, 'metric_date' => today()->toDateString(), 'student_count' => 1000, 'teacher_count' => 60]);
        SchoolMetric::create(['school_id' => $two->id, 'metric_date' => today()->toDateString(), 'student_count' => 500, 'teacher_count' => 30]);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/dashboard')
            ->assertJsonPath('data.population.students', 1500)
            ->assertJsonPath('data.population.teachers', 90);

        $registry = collect($this->actingAs($this->superAdmin, 'sanctum')->getJson('/api/v1/superadmin/schools')->json('data'));
        $this->assertSame(1500, $registry->sum('students'));
    }

    public function test_the_isolation_check_passes_on_clean_data_and_names_each_violation(): void
    {
        $school = $this->school('LC-SMTS-001', 'lincoln.edu');
        $this->admin($school, mfa: true);

        $report = fn () => $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-reports')
            ->json('data.isolation');

        $this->assertTrue($report()['passed']);
        $this->assertCount(5, $report()['checks']);

        // An administrator with no tenant, and an account left pointing at a deleted school.
        User::create(['name' => 'Orphan', 'email' => 'orphan@x.edu', 'password' => 'x', 'role' => User::ROLE_ADMIN, 'status' => 'active']);
        $gone = $this->school('GN-SMTS-009', 'gone.edu');
        User::create(['school_id' => $gone->id, 'name' => 'Stranded', 'email' => 'stranded@gone.edu', 'password' => 'x', 'role' => User::ROLE_TEACHER, 'status' => 'active']);
        $gone->delete();

        $result = $report();
        $this->assertFalse($result['passed']);

        $violations = collect($result['checks'])->pluck('violations', 'label');
        $this->assertSame(1, $violations['Every school account belongs to a tenant']);
        $this->assertSame(1, $violations['No account points at a missing or deleted school']);
        $this->assertSame(0, $violations['SuperAdmin accounts sit outside every tenant']);
    }

    public function test_the_tenant_report_carries_each_tenants_compliance_score(): void
    {
        $school = $this->school('LC-SMTS-001', 'healthy.edu');
        $this->admin($school, mfa: true);
        $this->metric($school, activeDaysAgo: 1);

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/system-reports')
            ->assertJsonPath('data.tenants.0.compliance_score', 100);
    }

    public function test_the_audit_headline_counts_real_events(): void
    {
        $log = fn (string $type, string $severity, int $hoursAgo = 1) => AuditLog::forceCreate([
            'event_type' => $type, 'action' => $type, 'severity' => $severity, 'created_at' => now()->subHours($hoursAgo),
        ]);

        $log('auth.login.success', 'info');
        $log('auth.login.locked', 'critical', 2);
        $log('auth.login.locked', 'critical', 72);
        $log('tenant.suspended', 'warning');
        $log('platform.settings_updated', 'info');
        $log('user.invited', 'info');

        $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/v1/superadmin/audit-logs')
            ->assertJsonPath('meta.headline.totalEvents', 6)
            ->assertJsonPath('meta.headline.criticalLast24h', 1)
            ->assertJsonPath('meta.headline.administrativeChanges', 3);
    }

    public function test_the_capture_command_records_todays_counts(): void
    {
        $school = $this->school('LC-SMTS-001', 'lincoln.edu');
        $this->admin($school, mfa: true);

        $this->artisan('telemetry:capture')->assertSuccessful();

        $row = PlatformTelemetry::whereDate('metric_date', today())->first();

        $this->assertSame(1, $row->active_schools_count);
        $this->assertSame(1, $row->total_admins_count);
    }

    public function test_capturing_the_same_day_twice_updates_the_row_instead_of_duplicating_it(): void
    {
        $school = $this->school('LC-SMTS-001', 'lincoln.edu');
        $this->admin($school, mfa: true);

        $this->artisan('telemetry:capture')->assertSuccessful();
        $this->artisan('telemetry:capture')->assertSuccessful();

        $this->assertSame(1, PlatformTelemetry::count());
        $this->assertSame(today()->toDateString(), PlatformTelemetry::first()->getRawOriginal('metric_date'));
    }

    private function day(int $daysAgo, int $dau, int $requests = 100_000, int $errors = 0): void
    {
        PlatformTelemetry::create([
            'metric_date' => now()->subDays($daysAgo)->toDateString(),
            'daily_active_users' => $dau,
            'total_api_requests' => $requests,
            'error_count' => $errors,
            'avg_response_time_ms' => 40,
        ]);
    }

    private function school(string $code, string $domain, string $status = School::STATUS_ACTIVE, float $usedMb = 0, int $quotaGb = 100): School
    {
        return School::create([
            'name' => 'School '.$code, 'code' => $code, 'slug' => strtolower($code), 'domain' => $domain,
            'contact_email' => 'a@'.$domain, 'city' => 'Lagos', 'status' => $status,
            'storage_limit_gb' => $quotaGb, 'storage_used_mb' => $usedMb,
        ]);
    }

    private function admin(School $school, bool $mfa): void
    {
        User::create([
            'school_id' => $school->id, 'name' => 'Admin '.$school->code, 'email' => 'admin@'.$school->domain,
            'password' => 'x', 'role' => User::ROLE_ADMIN, 'status' => User::STATUS_ACTIVE, 'mfa_enabled' => $mfa,
        ]);
    }

    private function metric(School $school, int $activeDaysAgo): void
    {
        SchoolMetric::create([
            'school_id' => $school->id, 'metric_date' => today()->toDateString(), 'student_count' => 100,
            'last_activity_at' => now()->subDays($activeDaysAgo),
        ]);
    }
}
