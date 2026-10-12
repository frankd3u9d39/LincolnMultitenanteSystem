<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 1: Student Module - profile and account settings.
 *
 * Academic fields (program, advisor, enrolment date) are owned by the school
 * and are read-only here; only contact details and preferences are editable
 * by the student.
 */
class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $student = $request->user();
        $preferences = $student->preferences ?? [];

        $primaryEnrollment = Enrollment::where('student_id', $student->id)
            ->where('status', Enrollment::STATUS_IN_PROGRESS)
            ->with('course.teacher')
            ->first();

        return response()->json([
            'data' => [
                'name' => $student->name,
                'id' => 'STU-'.str_pad((string) $student->id, 6, '0', STR_PAD_LEFT),
                'email' => $student->email,
                'phone' => $student->phone,
                'address' => $preferences['address'] ?? null,
                'dob' => $preferences['dob'] ?? null,
                'program' => $preferences['program'] ?? null,
                'department' => $primaryEnrollment?->course->department,
                'enrollmentDate' => $student->created_at->toDateString(),
                'advisor' => $primaryEnrollment?->course->teacher?->name,
                'status' => ucfirst($student->status),
                'avatarUrl' => $student->avatar_url,
                'emergencyContact' => $preferences['emergencyContact'] ?? null,
                'recoveryEmail' => $preferences['recoveryEmail'] ?? null,
                'notifications' => $preferences['notifications'] ?? ['email' => true, 'sms' => false],
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $student = $request->user();

        $data = $request->validate([
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'dob' => ['nullable', 'date'],
            'recoveryEmail' => ['nullable', 'email', 'max:255'],
            'emergencyContact' => ['nullable', 'array'],
            'emergencyContact.name' => ['nullable', 'string', 'max:120'],
            'emergencyContact.relation' => ['nullable', 'string', 'max:60'],
            'emergencyContact.phone' => ['nullable', 'string', 'max:30'],
            'notifications' => ['nullable', 'array'],
            'notifications.email' => ['nullable', 'boolean'],
            'notifications.sms' => ['nullable', 'boolean'],
        ]);

        $preferences = $student->preferences ?? [];

        foreach (['address', 'dob', 'recoveryEmail', 'emergencyContact', 'notifications'] as $key) {
            if (array_key_exists($key, $data)) {
                $preferences[$key] = $data[$key];
            }
        }

        $student->update([
            'phone' => $data['phone'] ?? $student->phone,
            'preferences' => $preferences,
        ]);

        return response()->json(['data' => ['status' => 'saved']]);
    }
}
