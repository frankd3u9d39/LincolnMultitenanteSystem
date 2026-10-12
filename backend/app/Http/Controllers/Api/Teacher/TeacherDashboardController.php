<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Attendance;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class TeacherDashboardController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;

        $classIds = SchoolClass::where('teacher_id', $teacherId)->pluck('id');
        $totalStudents = SchoolClass::whereIn('id', $classIds)->withCount('students')->get()->sum('students_count');

        $attendanceQuery = Attendance::whereIn('school_class_id', $classIds);
        $totalAttendance = $attendanceQuery->count();
        $presentOrLate = (clone $attendanceQuery)->whereIn('status', ['Present', 'Late'])->count();

        $stats = [
            'total_classes' => $classIds->count(),
            'total_students' => $totalStudents,
            'upcoming_assignments' => Assignment::where('teacher_id', $teacherId)->where('due_date', '>=', now()->toDateString())->count(),
            'overall_attendance' => $totalAttendance > 0 ? round($presentOrLate / $totalAttendance * 100) : 100,
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats,
        ]);
    }
}
