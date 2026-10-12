<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Assignment;
use Illuminate\Http\Request;

class TeacherDashboardController extends Controller
{
    public function index(Request $request)
    {
        // Mocking teacher ID as 1 for now since auth is not fully hooked up
        $teacherId = 1;

        $stats = [
            'total_classes' => SchoolClass::where('teacher_id', $teacherId)->count(),
            'total_students' => 120, // Example mock
            'upcoming_assignments' => Assignment::where('teacher_id', $teacherId)->where('due_date', '>=', now())->count(),
            'overall_attendance' => 92
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats
        ]);
    }
}
