<?php

namespace App\Http\Resources\SuperAdmin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GROUP 4: SuperAdmin Module - cross-tenant identity payload.
 *
 * @mixin User
 */
class SystemUserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fullName' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'schoolName' => $this->school?->name ?? 'Platform Operations',
            'schoolCode' => $this->school?->code ?? 'PLATFORM',
            'status' => self::displayStatus($this->resource),
            'mfaEnabled' => (bool) $this->mfa_enabled,
            'lastSeen' => $this->last_login_at?->diffForHumans() ?? 'Never signed in',
            'joinedOn' => $this->created_at?->toDateString(),
        ];
    }

    /** Directory vocabulary: active, inactive or locked. */
    public static function displayStatus(User $user): string
    {
        if ($user->locked_until && $user->locked_until->isFuture()) {
            return 'locked';
        }

        return match ($user->status) {
            User::STATUS_SUSPENDED => 'locked',
            User::STATUS_INACTIVE, User::STATUS_PENDING => 'inactive',
            default => 'active',
        };
    }
}
