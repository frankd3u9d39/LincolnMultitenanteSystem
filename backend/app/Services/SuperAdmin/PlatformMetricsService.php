<?php

declare(strict_types=1);

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
            'population' => $this->population($usersByRole),
            'storage' => [
                'used_gb' => $usedGb,
                'quota_gb' => $quotaGb,
                'usage_percent' => $quotaGb > 0 ? round($usedGb / $quotaGb * 100, 1) : 0.0,
            ],
            'infrastructure' => $this->latestTelemetry(),
        ];
    }

    /**
     * Verifies the tenant boundary holds in the data, by counting records that
     * break it. Each check is a query that should return nothing; a non-zero
     * count is a violation. This is a data-integrity audit, not a penetration
     * test: it cannot prove a query is scoped, only that no row has escaped.
     *
     * @return array{passed: bool, checkedAt: string, checks: array<int, array{label: string, violations: int}>}
     */
    public function tenantIsolationCheck(): array
    {
        $liveSchools = School::query()->select('id');

        $checks = [
            [
                'label' => 'Every school account belongs to a tenant',
                'violations' => User::query()->where('role', '!=', User::ROLE_SUPERADMIN)->whereNull('school_id')->count(),
            ],
            [
                'label' => 'SuperAdmin accounts sit outside every tenant',
                'violations' => User::query()->where('role', User::ROLE_SUPERADMIN)->whereNotNull('school_id')->count(),
            ],
            [
                'label' => 'No account points at a missing or deleted school',
                'violations' => User::query()->whereNotNull('school_id')->whereNotIn('school_id', $liveSchools)->count(),
            ],
            [
                'label' => 'No usage snapshot points at a missing or deleted school',
                'violations' => SchoolMetric::query()->whereNotIn('school_id', $liveSchools)->count(),
            ],
            [
                'label' => 'No audit entry points at a missing or deleted school',
                'violations' => AuditLog::query()->whereNotNull('school_id')->whereNotIn('school_id', $liveSchools)->count(),
            ],
        ];

        return [
            'passed' => collect($checks)->every(fn (array $check) => $check['violations'] === 0),
            'checkedAt' => now()->toIso8601String(),
            'checks' => $checks,
        ];
    }

    /**
     * Campus population, taken from each school's latest metrics snapshot so the
     * dashboard agrees with the tenant registry, which reads the same snapshots.
     * Where no snapshot exists yet it falls back to counting accounts.
     *
     * @param  Collection<string, int>  $usersByRole
     * @return array<string, int>
     */
    private function population(Collection $usersByRole): array
    {
        $latest = SchoolMetric::query()
            ->joinSub(
                SchoolMetric::query()->select('school_id', DB::raw('max(metric_date) as latest_date'))->groupBy('school_id'),
                'latest',
                fn ($join) => $join->on('school_metrics.school_id', '=', 'latest.school_id')
                    ->on('school_metrics.metric_date', '=', 'latest.latest_date')
            )
            ->selectRaw('coalesce(sum(student_count), 0) as students, coalesce(sum(teacher_count), 0) as teachers')
            ->first();

        $hasSnapshots = SchoolMetric::query()->exists();
        $students = $hasSnapshots ? (int) $latest->students : (int) ($usersByRole[User::ROLE_STUDENT] ?? 0);
        $teachers = $hasSnapshots ? (int) $latest->teachers : (int) ($usersByRole[User::ROLE_TEACHER] ?? 0);
        $administrators = (int) ($usersByRole[User::ROLE_ADMIN] ?? 0);
        $superadmins = (int) ($usersByRole[User::ROLE_SUPERADMIN] ?? 0);

        return [
            'students' => $students,
            'teachers' => $teachers,
            'administrators' => $administrators,
            'superadmins' => $superadmins,
            'total' => $students + $teachers + $administrators + $superadmins,
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

            if ($admin->status === User::STATUS_SUSPENDED || ($admin->locked_until && $admin->locked_until->isFuture())) {
                $flags[] = 'locked';
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
            ->with(['latestMetric', 'administrators:id,school_id,mfa_enabled'])
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
                    'compliance_score' => $this->complianceScore($school),
                ];
            })
            ->all();
    }

    /**
     * A transparent 0-100 health score for one tenant. It starts at 100 and
     * loses points for each concrete risk, so a low score always has a reason.
     *
     *   -20  suspended
     *   -15  not every administrator has multi-factor authentication enrolled
     *   -10  storage above 85% of quota
     *   -10  no recorded activity in the last 14 days
     */
    public function complianceScore(School $school): int
    {
        $score = 100;

        if ($school->isSuspended()) {
            $score -= 20;
        }

        $administrators = $school->relationLoaded('administrators') ? $school->administrators : $school->administrators()->get();

        if ($administrators->isNotEmpty() && $administrators->contains(fn (User $admin) => ! $admin->mfa_enabled)) {
            $score -= 15;
        }

        if ($school->storage_usage_percent > 85) {
            $score -= 10;
        }

        $lastActivity = $school->relationLoaded('latestMetric') ? $school->latestMetric?->last_activity_at : null;

        if ($lastActivity === null || $lastActivity->lt(now()->subDays(self::DORMANT_AFTER_DAYS))) {
            $score -= 10;
        }

        return max(0, $score);
    }

    /**
     * Platform telemetry for a reporting range, with the immediately preceding
     * period of equal length for comparison.
     *
     * Ranges are bucketed so a chart stays legible: daily up to 30 days,
     * weekly for a quarter, monthly for the year to date.
     *
     * @return array<string, mixed>
     */
    public function telemetry(string $range): array
    {
        $latest = PlatformTelemetry::query()->max('metric_date');

        if ($latest === null) {
            return ['range' => $range, 'series' => [], 'summary' => null, 'previous' => null, 'peak' => null, 'baseline' => null];
        }

        $end = Carbon::parse($latest)->startOfDay();
        $days = match ($range) {
            '30d' => 30,
            'quarter' => 90,
            'ytd' => max(1, (int) $end->dayOfYear),
            default => 7,
        };

        $start = $end->copy()->subDays($days - 1);

        $current = PlatformTelemetry::query()
            ->whereBetween('metric_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('metric_date')
            ->get();

        $previous = PlatformTelemetry::query()
            ->whereBetween('metric_date', [$start->copy()->subDays($days)->toDateString(), $start->copy()->subDay()->toDateString()])
            ->get();

        $summary = $this->summariseTelemetry($current);
        $before = $previous->isEmpty() ? null : $this->summariseTelemetry($previous);

        $peak = $current->sortByDesc('daily_active_users')->first();
        $low = $current->sortBy('daily_active_users')->first();

        return [
            'range' => $range,
            'days' => $days,
            'series' => $this->bucketTelemetry($current, $range),
            'summary' => $summary,
            'previous' => $before,
            'changes' => $before === null ? null : [
                'dauPercent' => $before['avgDau'] > 0 ? round(($summary['avgDau'] - $before['avgDau']) / $before['avgDau'] * 100, 1) : null,
                'requestsPercent' => $before['avgApiRequests'] > 0 ? round(($summary['avgApiRequests'] - $before['avgApiRequests']) / $before['avgApiRequests'] * 100, 1) : null,
                'latencyMs' => round($summary['avgLatencyMs'] - $before['avgLatencyMs'], 1),
            ],
            'peak' => $peak ? ['date' => $peak->metric_date->toDateString(), 'dau' => $peak->daily_active_users] : null,
            'baseline' => $low ? ['date' => $low->metric_date->toDateString(), 'dau' => $low->daily_active_users] : null,
        ];
    }

    /**
     * @param  Collection<int, PlatformTelemetry>  $rows
     * @return array<string, int|float>
     */
    private function summariseTelemetry(Collection $rows): array
    {
        $requests = (int) $rows->sum('total_api_requests');
        $errors = (int) $rows->sum('error_count');

        return [
            'avgDau' => (int) round($rows->avg('daily_active_users') ?? 0),
            'avgApiRequests' => (int) round($rows->avg('total_api_requests') ?? 0),
            'avgLatencyMs' => round((float) ($rows->avg('avg_response_time_ms') ?? 0), 1),
            'avgCpuPercent' => round((float) ($rows->avg('server_cpu_percent') ?? 0), 1),
            'totalRequests' => $requests,
            'totalErrors' => $errors,
            'errorRatePercent' => $requests > 0 ? round($errors / $requests * 100, 4) : 0.0,
        ];
    }

    /**
     * @param  Collection<int, PlatformTelemetry>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function bucketTelemetry(Collection $rows, string $range): array
    {
        $groupBy = match ($range) {
            'quarter' => fn (PlatformTelemetry $row) => $row->metric_date->copy()->startOfWeek()->toDateString(),
            'ytd' => fn (PlatformTelemetry $row) => $row->metric_date->format('Y-m'),
            default => fn (PlatformTelemetry $row) => $row->metric_date->toDateString(),
        };

        return $rows->groupBy($groupBy)->map(function (Collection $bucket, string $key) use ($range) {
            $first = $bucket->first()->metric_date;

            return [
                'date' => $key,
                'label' => $range === 'ytd' ? $first->format('M') : ($range === 'quarter' ? $first->copy()->startOfWeek()->format('j M') : $first->format('j M')),
                'dau' => (int) round($bucket->avg('daily_active_users')),
                'apiRequests' => (int) round($bucket->avg('total_api_requests')),
                'latencyMs' => round((float) $bucket->avg('avg_response_time_ms'), 1),
                'cpu' => round((float) $bucket->avg('server_cpu_percent'), 1),
                'errors' => (int) $bucket->sum('error_count'),
            ];
        })->values()->all();
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
