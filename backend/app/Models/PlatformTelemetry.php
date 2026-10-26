<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/** GROUP 4: SuperAdmin Module - daily platform-wide infrastructure snapshot. */
class PlatformTelemetry extends Model
{
    use HasFactory;

    protected $table = 'platform_telemetry';

    protected $fillable = [
        'metric_date',
        'active_schools_count',
        'pending_schools_count',
        'suspended_schools_count',
        'total_students_count',
        'total_teachers_count',
        'total_admins_count',
        'daily_active_users',
        'total_api_requests',
        'avg_response_time_ms',
        'server_cpu_percent',
        'server_ram_percent',
        'storage_used_gb',
        'error_count',
    ];

    protected function casts(): array
    {
        return [
            'active_schools_count' => 'integer',
            'pending_schools_count' => 'integer',
            'suspended_schools_count' => 'integer',
            'total_students_count' => 'integer',
            'total_teachers_count' => 'integer',
            'total_admins_count' => 'integer',
            'daily_active_users' => 'integer',
            'total_api_requests' => 'integer',
            'avg_response_time_ms' => 'float',
            'server_cpu_percent' => 'float',
            'server_ram_percent' => 'float',
            'storage_used_gb' => 'float',
            'error_count' => 'integer',
        ];
    }

    /**
     * A calendar day, stored as a plain Y-m-d string.
     *
     * Eloquent's own "date" cast writes a full "Y-m-d 00:00:00" timestamp, which
     * breaks both range queries (the last day compares greater than a bare date)
     * and updateOrCreate (an existing row no longer matches, so a duplicate is
     * inserted). Keeping the raw value a date string avoids both.
     */
    protected function metricDate(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? Carbon::parse($value)->startOfDay() : null,
            set: fn ($value) => $value ? Carbon::parse($value)->toDateString() : null,
        );
    }
}
