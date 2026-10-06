<?php

namespace App\Http\Resources\SuperAdmin;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GROUP 4: SuperAdmin Module - audit trail entry payload.
 *
 * @mixin AuditLog
 */
class AuditLogResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'timestamp' => $this->created_at?->format('Y-m-d H:i:s'),
            'eventType' => $this->event_type,
            'action' => $this->action,
            'severity' => $this->severity,
            'actorName' => $this->user?->name ?? 'System',
            'actorEmail' => $this->user?->email,
            'actorRole' => $this->user?->role ?? 'system',
            'schoolName' => $this->school?->name ?? 'Platform-wide',
            'schoolCode' => $this->school?->code,
            'ipAddress' => $this->ip_address,
            'userAgent' => $this->user_agent,
            'description' => $this->description,
            'details' => $this->new_values,
            'previousValues' => $this->old_values,
        ];
    }
}
