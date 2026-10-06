<?php

namespace App\Http\Resources\SuperAdmin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GROUP 4: SuperAdmin Module - school administrator payload.
 *
 * Keys mirror the SchoolAdministrator interface used by the directory table.
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
            'phone' => $this->phone,
            'schoolName' => $this->school?->name,
            'schoolCode' => $this->school?->code,
            'role' => $this->role,
            'status' => $this->status,
            'mfaEnabled' => (bool) $this->mfa_enabled,
            'lastLogin' => $this->last_login_at?->format('Y-m-d H:i'),
            'lastLoginIp' => $this->last_login_ip,
            'invitedOn' => $this->invited_at?->toDateString(),
            'createdOn' => $this->created_at?->toDateString(),
        ];
    }
}
