<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** GROUP 4: SuperAdmin Module - platform-wide broadcast notice. */
class SystemAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'message',
        'alert_type',
        'target_audience',
        'is_active',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    /** Active alerts that have not yet expired. */
    public function scopeLive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function (Builder $inner) {
                $inner->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }
}
