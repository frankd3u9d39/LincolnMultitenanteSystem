<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * GROUP 3: Admin Module - Curriculum Subjects.
 */
class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $courses = Course::where('school_id', $school->id)
            ->with('teacher:id,name,email')
            ->orderBy('code')
            ->get();

        $subjects = $courses->map(function (Course $c, $i) {
            return [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'department' => $c->department ?? 'General Studies',
                'teacher' => $c->teacher?->name ?? 'Unassigned',
                'teacherId' => $c->teacher_id,
                'credits' => $c->credits,
                'type' => ($i % 3 === 0) ? 'Elective' : 'Core',
                'term' => $c->term,
                'hoursPerWeek' => $c->credits * 3,
                'status' => 'Active',
            ];
        });

        return response()->json([
            'data' => $subjects->values(),
            'summary' => [
                'totalSubjects' => $subjects->count(),
                'coreCount' => $subjects->where('type', 'Core')->count(),
                'electiveCount' => $subjects->where('type', 'Elective')->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'code' => ['required', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:150'],
            'department' => ['required', 'string', 'max:100'],
            'credits' => ['required', 'integer', 'min:1', 'max:10'],
            'type' => ['required', 'in:Core,Elective'],
            'teacherId' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('school_id', $school->id)->where('role', User::ROLE_TEACHER),
            ],
        ]);

        $course = Course::create([
            'school_id' => $school->id,
            'teacher_id' => $data['teacherId'] ?? null,
            'code' => strtoupper($data['code']),
            'name' => $data['name'],
            'department' => $data['department'],
            'credits' => $data['credits'],
            'term' => $school->academic_year_current ?? 'Current Term',
            'capacity' => 40,
        ]);

        $course->load('teacher:id,name');

        return response()->json([
            'message' => 'Subject added to curriculum successfully.',
            'data' => [
                'id' => $course->id,
                'code' => $course->code,
                'name' => $course->name,
                'department' => $course->department,
                'teacher' => $course->teacher?->name ?? 'Unassigned',
                'teacherId' => $course->teacher_id,
                'credits' => $course->credits,
                'type' => $data['type'],
                'term' => $course->term,
                'hoursPerWeek' => $course->credits * 3,
                'status' => 'Active',
            ],
        ], 201);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $school = $request->user()->school;
        abort_unless($course->school_id === $school->id, 403);

        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:20'],
            'name' => ['sometimes', 'string', 'max:150'],
            'department' => ['sometimes', 'string', 'max:100'],
            'credits' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'type' => ['sometimes', 'in:Core,Elective'],
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

        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }

        $course->update($data);
        $course->load('teacher:id,name');

        return response()->json([
            'message' => 'Subject updated successfully.',
            'data' => [
                'id' => $course->id,
                'teacher' => $course->teacher?->name ?? 'Unassigned',
                'teacherId' => $course->teacher_id,
            ],
        ]);
    }
}
