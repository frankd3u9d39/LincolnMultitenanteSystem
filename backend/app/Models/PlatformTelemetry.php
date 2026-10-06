<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
            'metric_date' => 'date',
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
}
