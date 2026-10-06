<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** GROUP 4: SuperAdmin Module - daily per-tenant usage snapshot. */
class SchoolMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'metric_date',
        'student_count',
        'teacher_count',
        'admin_count',
        'courses_count',
        'classes_count',
        'attendance_rate_percent',
        'storage_used_mb',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'metric_date' => 'date',
            'student_count' => 'integer',
            'teacher_count' => 'integer',
            'admin_count' => 'integer',
            'courses_count' => 'integer',
            'classes_count' => 'integer',
            'attendance_rate_percent' => 'float',
            'storage_used_mb' => 'float',
            'last_activity_at' => 'datetime',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
