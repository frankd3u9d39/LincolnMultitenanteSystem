<?php

namespace App\Http\Resources\SuperAdmin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GROUP 4: SuperAdmin Module - school administrator payload.
 *
 * Status uses the directory's vocabulary: invited, active, locked, disabled.
 * An account is "locked" when it is suspended or temporarily locked out after
 * too many failed sign-ins.
 *
 * @mixin User
 */
class AdministratorResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fullName' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone ?? '',
            'schoolName' => $this->school?->name,
            'schoolCode' => $this->school?->code,
            'role' => $this->admin_role ?? 'principal_admin',
            'status' => self::displayStatus($this->resource),
            'mfaEnabled' => (bool) $this->mfa_enabled,
            'mfaRequired' => (bool) $this->mfa_required,
            'lastLogin' => $this->last_login_at?->format('Y-m-d H:i') ?? 'Never',
            'lastLoginIp' => $this->last_login_ip ?? '—',
            'invitedOn' => $this->invited_at?->toDateString(),
            'createdOn' => $this->created_at?->toDateString(),
        ];
    }

    public static function displayStatus(User $user): string
    {
        if ($user->locked_until && $user->locked_until->isFuture()) {
            return 'locked';
        }

        return match ($user->status) {
            User::STATUS_PENDING => 'invited',
            User::STATUS_SUSPENDED => 'locked',
            User::STATUS_INACTIVE => 'disabled',
            default => 'active',
        };
    }
}
