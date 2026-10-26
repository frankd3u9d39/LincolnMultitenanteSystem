<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * GROUP 3: Admin Module - course catalogue management.
 *
 * `Course` is the properly tenant-scoped model Group 1 (Student) built; the
 * admin view here is the write side students only read from.
 */
class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $courses = Course::where('school_id', $school->id)
            ->withCount(['enrollments' => fn ($q) => $q->where('status', '!=', Enrollment::STATUS_WITHDRAWN)])
            ->with('teacher:id,name')
            ->orderBy('code')
            ->get()
            ->map(fn (Course $c) => [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'department' => $c->department,
                'credits' => $c->credits,
                'term' => $c->term,
                'capacity' => $c->capacity,
                'teacher' => $c->teacher?->name ?? 'Unassigned',
                'teacherId' => $c->teacher_id,
                'enrolled' => $c->enrollments_count,
            ]);

        return response()->json(['data' => $courses]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'code' => ['required', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:150'],
            'department' => ['nullable', 'string', 'max:100'],
            'credits' => ['required', 'integer', 'min:1', 'max:10'],
            'term' => ['nullable', 'string', 'max:60'],
            'capacity' => ['required', 'integer', 'min:1', 'max:500'],
            'teacherId' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('school_id', $school->id)->where('role', User::ROLE_TEACHER),
            ],
        ]);

        $course = Course::create([
            'school_id' => $school->id,
            'code' => $data['code'],
            'name' => $data['name'],
            'department' => $data['department'] ?? null,
            'credits' => $data['credits'],
            'term' => $data['term'] ?? 'Current Term',
            'capacity' => $data['capacity'],
            'teacher_id' => $data['teacherId'] ?? null,
        ]);

        return response()->json(['data' => ['id' => $course->id]], 201);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $this->authorizeOwn($request, $course);

        $school = $request->user()->school;

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'department' => ['sometimes', 'nullable', 'string', 'max:100'],
            'credits' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:500'],
            'teacherId' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('school_id', $school->id)->where('role', User::ROLE_TEACHER),
            ],
        ]);

        if (array_key_exists('teacherId', $data)) {
            $data['teacher_id'] = $data['teacherId'];
            unset($data['teacherId']);
        }

        $course->update($data);

        return response()->json(['data' => ['status' => 'saved']]);
    }

    private function authorizeOwn(Request $request, Course $course): void
    {
        abort_unless($course->school_id === $request->user()->school_id, 404);
    }
}
