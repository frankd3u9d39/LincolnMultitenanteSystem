<?php

namespace App\Services\SuperAdmin;

use App\Models\AuditLog;
use App\Models\PlatformTelemetry;
use App\Models\School;
use App\Models\SchoolMetric;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * GROUP 4: SuperAdmin Module - platform-wide aggregation.
 *
 * Counts are read from the live tables rather than a cached roll-up, so the
 * dashboard never disagrees with the registry it links to.
 */
class PlatformMetricsService
{
    /** Number of days of inactivity after which an administrator counts as dormant. */
    public const DORMANT_AFTER_DAYS = 14;

    /**
     * Headline counters for the SuperAdmin dashboard.
     *
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        $schoolsByStatus = School::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $usersByRole = User::query()
            ->select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');

        $storage = School::query()
            ->selectRaw('coalesce(sum(storage_used_mb), 0) as used_mb, coalesce(sum(storage_limit_gb), 0) as quota_gb')
            ->first();

        $usedGb = round(((float) $storage->used_mb) / 1024, 2);
        $quotaGb = (int) $storage->quota_gb;

        return [
            'tenants' => [
                'total' => (int) $schoolsByStatus->sum(),
                'active' => (int) ($schoolsByStatus[School::STATUS_ACTIVE] ?? 0),
                'pending' => (int) ($schoolsByStatus[School::STATUS_PENDING] ?? 0),
                'suspended' => (int) ($schoolsByStatus[School::STATUS_SUSPENDED] ?? 0),
                'inactive' => (int) ($schoolsByStatus[School::STATUS_INACTIVE] ?? 0),
                'needs_attention' => (int) $schoolsByStatus->sum()
                    - (int) ($schoolsByStatus[School::STATUS_ACTIVE] ?? 0),
            ],
            'population' => [
                'students' => (int) ($usersByRole[User::ROLE_STUDENT] ?? 0),
                'teachers' => (int) ($usersByRole[User::ROLE_TEACHER] ?? 0),
                'administrators' => (int) ($usersByRole[User::ROLE_ADMIN] ?? 0),
                'superadmins' => (int) ($usersByRole[User::ROLE_SUPERADMIN] ?? 0),
                'total' => (int) $usersByRole->sum(),
            ],
            'storage' => [
                'used_gb' => $usedGb,
                'quota_gb' => $quotaGb,
                'usage_percent' => $quotaGb > 0 ? round($usedGb / $quotaGb * 100, 1) : 0.0,
            ],
            'infrastructure' => $this->latestTelemetry(),
        ];
    }

    /**
     * Administrator access posture, mirroring the access report.
     *
     * @return array<string, mixed>
     */
    public function administratorPosture(): array
    {
        $administrators = User::query()
            ->with('school:id,name,code')
            ->where('role', User::ROLE_ADMIN)
            ->get();

        $dormantThreshold = now()->subDays(self::DORMANT_AFTER_DAYS);

        $flagged = $administrators->map(function (User $admin) use ($dormantThreshold) {
            $flags = [];

            if (! $admin->mfa_enabled) {
                $flags[] = 'no_mfa';
            }

            if ($admin->status === User::STATUS_SUSPENDED) {
                $flags[] = 'suspended';
            }

            if ($admin->status === User::STATUS_INACTIVE) {
                $flags[] = 'disabled';
            }

            if (! $admin->last_login_at) {
                $flags[] = 'never_signed_in';
            } elseif ($admin->last_login_at->lt($dormantThreshold)) {
                $flags[] = 'dormant';
            }

            return ['administrator' => $admin, 'flags' => $flags];
        })->filter(fn (array $row) => $row['flags'] !== [])->values();

        $mfaEnabled = $administrators->where('mfa_enabled', true)->count();
        $total = $administrators->count();

        return [
            'total' => $total,
            'mfa_enabled' => $mfaEnabled,
            'mfa_coverage_percent' => $total > 0 ? round($mfaEnabled / $total * 100, 1) : 0.0,
            'flagged_count' => $flagged->count(),
            'flagged' => $flagged,
            'by_tenant' => $this->coverageByTenant($administrators),
        ];
    }

    /**
     * Per-tenant MFA coverage, weakest first.
     *
     * @param  Collection<int, User>  $administrators
     * @return array<int, array<string, mixed>>
     */
    private function coverageByTenant($administrators): array
    {
        return $administrators
            ->filter(fn (User $admin) => $admin->school !== null)
            ->groupBy(fn (User $admin) => $admin->school->code)
            ->map(function ($group, string $code) {
                $total = $group->count();
                $enabled = $group->where('mfa_enabled', true)->count();

                return [
                    'school_code' => $code,
                    'school_name' => $group->first()->school->name,
                    'total' => $total,
                    'mfa_enabled' => $enabled,
                    'coverage_percent' => $total > 0 ? round($enabled / $total * 100, 1) : 0.0,
                ];
            })
            ->sortBy('coverage_percent')
            ->values()
            ->all();
    }

    /**
     * Tenant-level report rows: enrolment, attendance and storage.
     *
     * @return array<int, array<string, mixed>>
     */
    public function tenantReport(int $limit = 50): array
    {
        return School::query()
            ->with('latestMetric')
            ->orderByDesc('storage_used_mb')
            ->limit($limit)
            ->get()
            ->map(function (School $school) {
                $metric = $school->latestMetric;

                return [
                    'school_name' => $school->name,
                    'school_code' => $school->code,
                    'status' => $school->status,
                    'students' => (int) ($metric->student_count ?? 0),
                    'teachers' => (int) ($metric->teacher_count ?? 0),
                    'attendance_rate_percent' => (float) ($metric->attendance_rate_percent ?? 0),
                    'storage_used_gb' => $school->storage_used_gb,
                    'storage_quota_gb' => $school->storage_limit_gb,
                    'storage_usage_percent' => $school->storage_usage_percent,
                ];
            })
            ->all();
    }

    /**
     * Campus size distribution, replacing the old revenue breakdown.
     *
     * @return array<string, int>
     */
    public function campusSizeDistribution(): array
    {
        $counts = SchoolMetric::query()
            ->select('school_id', DB::raw('max(metric_date) as latest'), DB::raw('max(student_count) as students'))
            ->groupBy('school_id')
            ->pluck('students');

        return [
            'large' => $counts->filter(fn ($value) => $value >= 1000)->count(),
            'medium' => $counts->filter(fn ($value) => $value >= 500 && $value < 1000)->count(),
            'small' => $counts->filter(fn ($value) => $value < 500)->count(),
        ];
    }

    /**
     * Recent security-relevant audit entries for the dashboard feed.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, AuditLog>
     */
    public function recentActivity(int $limit = 5)
    {
        return AuditLog::query()
            ->with(['user:id,name,email,role', 'school:id,name,code'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * The latest infrastructure snapshot, or zeroed defaults when none exists.
     *
     * @return array<string, mixed>
     */
    private function latestTelemetry(): array
    {
        $telemetry = PlatformTelemetry::query()->orderByDesc('metric_date')->first();

        return [
            'metric_date' => $telemetry?->metric_date?->toDateString(),
            'daily_active_users' => (int) ($telemetry->daily_active_users ?? 0),
            'avg_response_time_ms' => (float) ($telemetry->avg_response_time_ms ?? 0),
            'server_cpu_percent' => (float) ($telemetry->server_cpu_percent ?? 0),
            'server_ram_percent' => (float) ($telemetry->server_ram_percent ?? 0),
            'error_count' => (int) ($telemetry->error_count ?? 0),
        ];
    }

    /**
     * Recalculates today's platform telemetry row from live data.
     * Intended to be driven by a scheduled command.
     */
    public function captureDailyTelemetry(?Carbon $date = null): PlatformTelemetry
    {
        $date ??= now();

        $schoolsByStatus = School::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $usersByRole = User::query()
            ->select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');

        $storageUsedMb = (float) School::query()->sum('storage_used_mb');

        return PlatformTelemetry::updateOrCreate(
            ['metric_date' => $date->toDateString()],
            [
                'active_schools_count' => (int) ($schoolsByStatus[School::STATUS_ACTIVE] ?? 0),
                'pending_schools_count' => (int) ($schoolsByStatus[School::STATUS_PENDING] ?? 0),
                'suspended_schools_count' => (int) ($schoolsByStatus[School::STATUS_SUSPENDED] ?? 0),
                'total_students_count' => (int) ($usersByRole[User::ROLE_STUDENT] ?? 0),
                'total_teachers_count' => (int) ($usersByRole[User::ROLE_TEACHER] ?? 0),
                'total_admins_count' => (int) ($usersByRole[User::ROLE_ADMIN] ?? 0),
                'daily_active_users' => User::query()->where('last_login_at', '>=', $date->copy()->startOfDay())->count(),
                'storage_used_gb' => round($storageUsedMb / 1024, 2),
            ]
        );
    }
}
