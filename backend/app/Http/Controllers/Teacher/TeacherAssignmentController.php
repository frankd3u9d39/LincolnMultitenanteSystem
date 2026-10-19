<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeacherAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $assignments = Assignment::where('teacher_id', $request->user()->id)
            ->with('schoolClass')
            ->withCount('teacherSubmissions')
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $assignments,
        ]);
    }

    public function store(Request $request)
    {
        $teacherId = $request->user()->id;
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'school_class_id' => [
                'required',
                Rule::exists('school_classes', 'id')->where('school_id', $schoolId),
            ],
            'due_date' => 'required|date',
            'total_marks' => 'required|integer|min:1',
            'instructions' => 'nullable|string',
        ]);

        $assignment = Assignment::create(array_merge($validated, [
            'teacher_id' => $teacherId,
            'school_id' => $schoolId,
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Assignment created successfully',
            'data' => $assignment,
        ], 201);
    }

    public function show(Request $request, Assignment $assignment)
    {
        abort_unless($assignment->teacher_id === $request->user()->id, 404);

        return response()->json([
            'status' => 'success',
            'data' => $assignment->load('schoolClass', 'teacherSubmissions.student.user'),
        ]);
    }

    public function update(Request $request, Assignment $assignment)
    {
        abort_unless($assignment->teacher_id === $request->user()->id, 404);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'due_date' => 'sometimes|date',
            'total_marks' => 'sometimes|integer|min:1',
            'instructions' => 'nullable|string',
        ]);

        $assignment->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $assignment,
        ]);
    }
}
