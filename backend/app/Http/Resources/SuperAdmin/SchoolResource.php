<?php

namespace App\Http\Resources\SuperAdmin;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GROUP 4: SuperAdmin Module - tenant payload.
 *
 * Keys mirror the SchoolTenant interface the frontend registry consumes.
 *
 * @mixin School
 */
class SchoolResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        // A freshly provisioned tenant has no metrics snapshot yet, so every
        // read below has to tolerate a missing relation.
        $metric = $this->relationLoaded('latestMetric') ? $this->latestMetric : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'slug' => $this->slug,
            'domain' => $this->domain,
            'status' => $this->status,
            'city' => $this->city,
            'country' => $this->country,
            'principalAdmin' => $this->whenLoaded('administrators', fn () => $this->administrators->first()?->name),
            'principalEmail' => $this->contact_email,
            'principalPhone' => $this->contact_phone,
            'students' => (int) ($metric?->student_count ?? 0),
            'teachers' => (int) ($metric?->teacher_count ?? 0),
            'storageUsedGb' => $this->storage_used_gb,
            'storageQuotaGb' => $this->storage_limit_gb,
            'storageUsagePercent' => $this->storage_usage_percent,
            'maxStudents' => $this->max_students,
            'maxTeachers' => $this->max_teachers,
            'maxFileUploadMb' => $this->max_file_upload_mb,
            'academicYear' => $this->academic_year_current,
            'timezone' => $this->timezone,
            'onboardedOn' => $this->onboarded_at?->toDateString(),
            'lastActivity' => $metric?->last_activity_at?->diffForHumans() ?? 'Awaiting first sign-in',
        ];
    }
}
