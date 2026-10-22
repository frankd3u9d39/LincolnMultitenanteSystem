<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * GROUP 4: SuperAdmin Module - tenant boundary.
 *
 * Each school is an isolated tenant. The platform is free, so a school carries
 * capacity ceilings (students, staff, storage) rather than a subscription plan.
 */
class School extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_PENDING = 'pending_approval';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_SUSPENDED,
        self::STATUS_PENDING,
        self::STATUS_INACTIVE,
    ];

    protected $fillable = [
        'name',
        'code',
        'slug',
        'domain',
        'contact_email',
        'contact_phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'logo_url',
        'primary_color',
        'secondary_color',
        'accent_color',
        'theme_palette',
        'status',
        'storage_limit_gb',
        'max_students',
        'max_teachers',
        'max_file_upload_mb',
        'storage_used_mb',
        'academic_year_current',
        'timezone',
        'currency',
        'cbt_enabled',
        'onboarded_at',
    ];

    protected function casts(): array
    {
        return [
            'cbt_enabled' => 'boolean',
            'storage_limit_gb' => 'integer',
            'max_students' => 'integer',
            'max_teachers' => 'integer',
            'max_file_upload_mb' => 'integer',
            'storage_used_mb' => 'float',
            'onboarded_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Relationships */
    /* ------------------------------------------------------------------ */

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function administrators(): HasMany
    {
        return $this->hasMany(User::class)->where('role', User::ROLE_ADMIN);
    }

    public function metrics(): HasMany
    {
        return $this->hasMany(SchoolMetric::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    /** The most recent daily metrics snapshot for this tenant. */
    public function latestMetric()
    {
        return $this->hasOne(SchoolMetric::class)->latestOfMany('metric_date');
    }

    /* ------------------------------------------------------------------ */
    /* Scopes */
    /* ------------------------------------------------------------------ */

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        return $status && $status !== 'all' ? $query->where('status', $status) : $query;
    }

    /** Free-text search across the fields the registry exposes. */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($term) {
            foreach (['name', 'code', 'domain', 'city', 'contact_email'] as $column) {
                $inner->orWhere($column, 'like', "%{$term}%");
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /* Derived attributes */
    /* ------------------------------------------------------------------ */

    public function getStorageUsedGbAttribute(): float
    {
        return round($this->storage_used_mb / 1024, 2);
    }

    public function getStorageUsagePercentAttribute(): float
    {
        if ($this->storage_limit_gb <= 0) {
            return 0.0;
        }

        return round(min(100, ($this->storage_used_mb / 1024) / $this->storage_limit_gb * 100), 1);
    }

    public function isSuspended(): bool
    {
        return $this->status === self::STATUS_SUSPENDED;
    }
}
