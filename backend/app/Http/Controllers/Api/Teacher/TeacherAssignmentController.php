<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use Illuminate\Http\Request;

class TeacherAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = 1; // mocked
        $assignments = Assignment::where('teacher_id', $teacherId)
                                 ->with('schoolClass')
                                 ->withCount('submissions')
                                 ->latest()
                                 ->get();

        return response()->json([
            'status' => 'success',
            'data' => $assignments
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'school_class_id' => 'required|exists:school_classes,id',
            'due_date' => 'required|date',
            'total_marks' => 'required|integer',
            'instructions' => 'nullable|string',
        ]);

        $teacherId = 1; // mocked
        
        $assignment = Assignment::create(array_merge($validated, ['teacher_id' => $teacherId]));

        return response()->json([
            'status' => 'success',
            'message' => 'Assignment created successfully',
            'data' => $assignment
        ], 201);
    }
}
