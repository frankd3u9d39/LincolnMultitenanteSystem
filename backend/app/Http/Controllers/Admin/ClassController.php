<?php

declare(strict_types=1);

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
        $teachersMap = User::where('school_id', $school->id)
            ->where('role', User::ROLE_TEACHER)
            ->get(['id', 'name'])
            ->keyBy('id');
        $teacherIds = $teachersMap->keys();

        $classes = SchoolClass::where(function ($q) use ($teacherIds) {
            $q->whereIn('teacher_id', $teacherIds)->orWhereNull('teacher_id');
        })
            ->withCount('students')
            ->with([
            'teacher:id,name',
            'subjects' => function ($q) {
                $q->select('courses.id', 'courses.code', 'courses.name', 'courses.department', 'courses.teacher_id')
                    ->with('teacher:id,name');
            },
        ])
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
            'subjects' => $c->subjects->map(function ($s) use ($teachersMap) {
                $pivotTeacherId = $s->pivot?->teacher_id;
                $teacherName = null;
                $teacherId = null;

                if ($pivotTeacherId && isset($teachersMap[$pivotTeacherId])) {
                    $teacherName = $teachersMap[$pivotTeacherId]->name;
                    $teacherId = $pivotTeacherId;
                } elseif ($s->teacher) {
                    $teacherName = $s->teacher->name;
                    $teacherId = $s->teacher_id;
                }

                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'code' => $s->code,
                    'department' => $s->department,
                    'teacher' => $teacherName ?? 'Unassigned',
                    'teacherId' => $teacherId,
                ];
            }),
            'subjectsCount' => $c->subjects->count(),
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
            'subjectIds' => ['nullable', 'array'],
            'subjectIds.*' => [
                'integer',
                Rule::exists('courses', 'id')->where('school_id', $school->id),
            ],
        ]);

        $class = SchoolClass::create([
            'name' => $data['name'],
            'code' => $data['code'],
            'room' => $data['room'] ?? null,
            'schedule' => $data['schedule'] ?? null,
            'teacher_id' => $data['teacherId'] ?? null,
        ]);

        if (! empty($data['subjectIds'])) {
            $class->subjects()->sync($data['subjectIds']);
        }

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
            'subjectIds' => ['sometimes', 'nullable', 'array'],
            'subjectIds.*' => [
                'integer',
                Rule::exists('courses', 'id')->where('school_id', $school->id),
            ],
        ]);

        if (array_key_exists('teacherId', $data)) {
            $data['teacher_id'] = $data['teacherId'];
            unset($data['teacherId']);
        }

        if (array_key_exists('subjectIds', $data)) {
            $schoolClass->subjects()->sync($data['subjectIds'] ?? []);
            unset($data['subjectIds']);
        }

        $schoolClass->update($data);

        return response()->json(['data' => ['status' => 'saved']]);
    }

    public function syncSubjects(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $this->authorizeOwn($request, $schoolClass);

        $school = $request->user()->school;

        $data = $request->validate([
            'subjectIds' => ['sometimes', 'array'],
            'subjectIds.*' => [
                'integer',
                Rule::exists('courses', 'id')->where('school_id', $school->id),
            ],
            'assignments' => ['sometimes', 'array'],
            'assignments.*.subjectId' => [
                'required',
                'integer',
                Rule::exists('courses', 'id')->where('school_id', $school->id),
            ],
            'assignments.*.teacherId' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('school_id', $school->id)->where('role', User::ROLE_TEACHER),
            ],
        ]);

        if (isset($data['assignments'])) {
            $syncPayload = [];
            foreach ($data['assignments'] as $item) {
                $syncPayload[$item['subjectId']] = [
                    'teacher_id' => $item['teacherId'] ?? null,
                ];
            }
            $schoolClass->subjects()->sync($syncPayload);
        } elseif (isset($data['subjectIds'])) {
            $schoolClass->subjects()->sync($data['subjectIds']);
        }

        $teachersMap = User::where('school_id', $school->id)
            ->where('role', User::ROLE_TEACHER)
            ->get(['id', 'name'])
            ->keyBy('id');

        $subjects = $schoolClass->subjects()
            ->with('teacher:id,name')
            ->get(['courses.id', 'courses.code', 'courses.name', 'courses.department', 'courses.teacher_id'])
            ->map(function ($s) use ($teachersMap) {
                $pivotTeacherId = $s->pivot?->teacher_id;
                $teacherName = null;
                $teacherId = null;

                if ($pivotTeacherId && isset($teachersMap[$pivotTeacherId])) {
                    $teacherName = $teachersMap[$pivotTeacherId]->name;
                    $teacherId = $pivotTeacherId;
                } elseif ($s->teacher) {
                    $teacherName = $s->teacher->name;
                    $teacherId = $s->teacher_id;
                }

                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'code' => $s->code,
                    'department' => $s->department,
                    'teacher' => $teacherName ?? 'Unassigned',
                    'teacherId' => $teacherId,
                ];
            });

        return response()->json([
            'message' => 'Class subjects updated successfully.',
            'data' => [
                'subjects' => $subjects,
            ],
        ]);
    }

    private function authorizeOwn(Request $request, SchoolClass $schoolClass): void
    {
        $schoolId = $request->user()->school_id;
        if ($schoolClass->teacher) {
            abort_unless($schoolClass->teacher->school_id === $schoolId, 403);
        }
    }
}
