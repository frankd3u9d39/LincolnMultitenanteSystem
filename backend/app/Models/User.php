<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    public const ROLE_SUPERADMIN = 'superadmin';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_TEACHER = 'teacher';

    public const ROLE_STUDENT = 'student';

    public const ROLES = [
        self::ROLE_SUPERADMIN,
        self::ROLE_ADMIN,
        self::ROLE_TEACHER,
        self::ROLE_STUDENT,
    ];

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_PENDING = 'pending';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_SUSPENDED,
        self::STATUS_PENDING,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'school_id',
        'name',
        'email',
        'password',
        'role',
        'admin_role',
        'permissions',
        'phone',
        'avatar_url',
        'preferences',
        'status',
        'last_login_at',
        'last_login_ip',
        'mfa_enabled',
        'mfa_required',
        'mfa_enrolled_at',
        'invited_at',
        'failed_login_attempts',
        'locked_until',
        'mfa_secret',
        'mfa_recovery_codes',
        'password_changed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'mfa_secret',
        'mfa_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'mfa_enabled' => 'boolean',
            'mfa_required' => 'boolean',
            'mfa_enrolled_at' => 'datetime',
            'invited_at' => 'datetime',
            'failed_login_attempts' => 'integer',
            'locked_until' => 'datetime',
            'password_changed_at' => 'datetime',
            'preferences' => 'array',
            'permissions' => 'array',
            'mfa_secret' => 'encrypted',
            'mfa_recovery_codes' => 'array',
            'password' => 'hashed',
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Relationships */
    /* ------------------------------------------------------------------ */

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /** GROUP 3: Admin Module - the Group 2-owned detail record for a student user, when one exists. */
    public function studentProfile(): HasOne
    {
        return $this->hasOne(Student::class, 'user_id');
    }

    /* ------------------------------------------------------------------ */
    /* Scopes */
    /* ------------------------------------------------------------------ */

    public function scopeRole(Builder $query, ?string $role): Builder
    {
        return $role && $role !== 'all' ? $query->where('role', $role) : $query;
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        return $status && $status !== 'all' ? $query->where('status', $status) : $query;
    }

    /** Limits results to one tenant boundary, by school code. */
    public function scopeTenant(Builder $query, ?string $schoolCode): Builder
    {
        if (! $schoolCode || $schoolCode === 'all') {
            return $query;
        }

        return $query->whereHas('school', fn (Builder $school) => $school->where('code', $schoolCode));
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($term) {
            $inner->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhereHas('school', function (Builder $school) use ($term) {
                    $school->where('name', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%");
                });
        });
    }

    /* ------------------------------------------------------------------ */
    /* Helpers */
    /* ------------------------------------------------------------------ */

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPERADMIN;
    }

    /**
     * Multi-factor enrolment is not modelled as its own table yet; Sanctum
     * token abilities stand in so the access report has a real signal.
     */
    public function hasMfaEnabled(): bool
    {
        return (bool) $this->email_verified_at;
    }
}
