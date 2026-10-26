<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * GROUP 4: SuperAdmin Module - immutable platform activity trail.
 *
 * Rows are append-only: the table has no updated_at, and nothing in the
 * SuperAdmin module updates or deletes an entry once it is written.
 */
class AuditLog extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    public const SEVERITY_INFO = 'info';

    public const SEVERITY_WARNING = 'warning';

    public const SEVERITY_CRITICAL = 'critical';

    public const SEVERITIES = [
        self::SEVERITY_INFO,
        self::SEVERITY_WARNING,
        self::SEVERITY_CRITICAL,
    ];

    protected $fillable = [
        'user_id',
        'school_id',
        'event_type',
        'action',
        'entity_type',
        'entity_id',
        'description',
        'ip_address',
        'user_agent',
        'old_values',
        'new_values',
        'severity',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function scopeSeverity(Builder $query, ?string $severity): Builder
    {
        return $severity && $severity !== 'all' ? $query->where('severity', $severity) : $query;
    }

    /** Filters on an event namespace, so "auth" matches auth.login.success. */
    public function scopeEventGroup(Builder $query, ?string $group): Builder
    {
        return $group && $group !== 'all' ? $query->where('event_type', 'like', "{$group}.%") : $query;
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($term) {
            $inner->where('event_type', 'like', "%{$term}%")
                ->orWhere('action', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%")
                ->orWhere('ip_address', 'like', "%{$term}%")
                ->orWhereHas('user', function (Builder $user) use ($term) {
                    $user->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%");
                });
        });
    }

    /** Restricts to entries recorded on or after the given date. */
    public function scopeSince(Builder $query, ?string $date): Builder
    {
        return $date ? $query->where('created_at', '>=', $date) : $query;
    }
}
