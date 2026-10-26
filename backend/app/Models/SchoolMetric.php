<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

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
