<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherDashboardController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;
        $schoolId = $request->user()->school_id;

        // Overseen classes
        $overseenClassIds = SchoolClass::where('teacher_id', $teacherId)->pluck('id');

        // Subject classes
        $subjectClassIds = SchoolClass::whereHas('subjects', function ($q) use ($teacherId) {
            $q->where('courses.teacher_id', $teacherId)
                ->orWhere('class_subject.teacher_id', $teacherId);
        })->pluck('id');

        $classIds = $overseenClassIds->merge($subjectClassIds)->unique();

        if ($classIds->isEmpty()) {
            $teacherSchoolIds = User::where('school_id', $schoolId)->where('role', User::ROLE_TEACHER)->pluck('id');
            $classIds = SchoolClass::where(function ($q) use ($teacherSchoolIds) {
                $q->whereIn('teacher_id', $teacherSchoolIds)->orWhereNull('teacher_id');
            })->pluck('id');
        }

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
