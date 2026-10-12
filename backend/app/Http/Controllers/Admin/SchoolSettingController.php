<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SuperAdmin\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - the school's own profile.
 *
 * Only operational fields are editable here; capacity ceilings, status and
 * provisioning stay SuperAdmin-only (`SuperAdmin\SchoolController`).
 */
class SchoolSettingController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function show(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        return response()->json(['data' => $this->payload($school)]);
    }

    public function update(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'contactEmail' => ['sometimes', 'email', 'max:255'],
            'contactPhone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'academicYearCurrent' => ['sometimes', 'nullable', 'string', 'max:20'],
            'timezone' => ['sometimes', 'string', 'max:60'],
        ]);

        $map = [
            'contactEmail' => 'contact_email',
            'contactPhone' => 'contact_phone',
            'address' => 'address',
            'city' => 'city',
            'state' => 'state',
            'country' => 'country',
            'academicYearCurrent' => 'academic_year_current',
            'timezone' => 'timezone',
        ];

        $before = $school->only(array_values($map));
        $changes = [];

        foreach ($map as $input => $column) {
            if (array_key_exists($input, $data)) {
                $changes[$column] = $data[$input];
            }
        }

        $school->update($changes);

        $this->audit->record(
            eventType: 'school.settings_updated',
            action: 'update',
            description: "Updated school profile for {$school->name}",
            school: $school,
            oldValues: $before,
            newValues: $school->only(array_values($map)),
            actor: $request->user(),
        );

        return response()->json(['data' => $this->payload($school->fresh())]);
    }

    private function payload($school): array
    {
        return [
            'name' => $school->name,
            'code' => $school->code,
            'contactEmail' => $school->contact_email,
            'contactPhone' => $school->contact_phone,
            'address' => $school->address,
            'city' => $school->city,
            'state' => $school->state,
            'country' => $school->country,
            'academicYearCurrent' => $school->academic_year_current,
            'timezone' => $school->timezone,
            'status' => $school->status,
            'maxStudents' => $school->max_students,
            'maxTeachers' => $school->max_teachers,
        ];
    }
}
