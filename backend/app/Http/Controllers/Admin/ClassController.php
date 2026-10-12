<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * GROUP 3: Admin Module - class roster management.
 *
 * `SchoolClass` is owned by Group 2 (Teacher) and has no `school_id` column
 * of its own, so every query here is scoped through the assigned teacher's
 * `school_id` instead, the same tenant boundary every other module uses.
 */
class ClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;
        $teacherIds = User::where('school_id', $school->id)->where('role', User::ROLE_TEACHER)->pluck('id', 'id');

        $classes = SchoolClass::whereIn('teacher_id', $teacherIds)
            ->withCount('students')
            ->with('teacher:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (SchoolClass $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'room' => $c->room,
                'schedule' => $c->schedule,
                'teacher' => $c->teacher?->name ?? 'Unassigned',
                'teacherId' => $c->teacher_id,
                'studentCount' => $c->students_count,
            ]);

        return response()->json(['data' => $classes]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:40'],
            'room' => ['nullable', 'string', 'max:60'],
            'schedule' => ['nullable', 'string', 'max:120'],
            'teacherId' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('school_id', $school->id)->where('role', User::ROLE_TEACHER),
            ],
        ]);

        $class = SchoolClass::create([
            'name' => $data['name'],
            'code' => $data['code'],
            'room' => $data['room'] ?? null,
            'schedule' => $data['schedule'] ?? null,
            'teacher_id' => $data['teacherId'] ?? null,
        ]);

        return response()->json(['data' => ['id' => $class->id]], 201);
    }

    public function update(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $this->authorizeOwn($request, $schoolClass);

        $school = $request->user()->school;

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'room' => ['sometimes', 'nullable', 'string', 'max:60'],
            'schedule' => ['sometimes', 'nullable', 'string', 'max:120'],
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

        $schoolClass->update($data);

        return response()->json(['data' => ['status' => 'saved']]);
    }

    /** A class with no assigned teacher has no owning school to check against, so it is treated as inaccessible. */
    private function authorizeOwn(Request $request, SchoolClass $schoolClass): void
    {
        abort_unless(
            $schoolClass->teacher && $schoolClass->teacher->school_id === $request->user()->school_id,
            404
        );
    }
}
