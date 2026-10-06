<?php

namespace App\Services\SuperAdmin;

use App\Models\AuditLog;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * GROUP 4: SuperAdmin Module - writes the platform activity trail.
 *
 * Every state change a SuperAdmin makes goes through here so the audit log is
 * recorded consistently, with the acting user and request origin attached.
 */
class AuditLogger
{
    public function __construct(private readonly Request $request) {}

    /**
     * Records one audit entry.
     *
     * @param  array<string, mixed>|null  $oldValues
     * @param  array<string, mixed>|null  $newValues
     */
    public function record(
        string $eventType,
        string $action,
        string $description,
        ?School $school = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        string $severity = AuditLog::SEVERITY_INFO,
    ): AuditLog {
        /** @var User|null $actor */
        $actor = $this->request->user();

        return AuditLog::create([
            'user_id' => $actor?->id,
            'school_id' => $school?->id,
            'event_type' => $eventType,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'ip_address' => $this->request->ip(),
            'user_agent' => substr((string) $this->request->userAgent(), 0, 500),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'severity' => $severity,
        ]);
    }

    /** Convenience wrapper for entries that describe a tenant change. */
    public function recordTenantChange(
        string $eventType,
        string $action,
        string $description,
        School $school,
        ?array $oldValues = null,
        ?array $newValues = null,
        string $severity = AuditLog::SEVERITY_INFO,
    ): AuditLog {
        return $this->record(
            eventType: $eventType,
            action: $action,
            description: $description,
            school: $school,
            entityType: School::class,
            entityId: $school->id,
            oldValues: $oldValues,
            newValues: $newValues,
            severity: $severity,
        );
    }

    /** Convenience wrapper for entries that describe a user account change. */
    public function recordUserChange(
        string $eventType,
        string $action,
        string $description,
        User $subject,
        ?array $oldValues = null,
        ?array $newValues = null,
        string $severity = AuditLog::SEVERITY_INFO,
    ): AuditLog {
        return $this->record(
            eventType: $eventType,
            action: $action,
            description: $description,
            school: $subject->school,
            entityType: User::class,
            entityId: $subject->id,
            oldValues: $oldValues,
            newValues: $newValues,
            severity: $severity,
        );
    }
}
