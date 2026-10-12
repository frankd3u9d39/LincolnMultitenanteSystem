<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class TeacherAttendanceController extends Controller
{
    public function getClasses(Request $request)
    {
        $teacherId = 1; // mocked
        $classes = SchoolClass::where('teacher_id', $teacherId)->withCount('students')->get();

        return response()->json([
            'status' => 'success',
            'data' => $classes
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:Present,Absent,Late,Excused',
        ]);

        foreach ($validated['records'] as $record) {
            Attendance::updateOrCreate(
                [
                    'school_class_id' => $validated['school_class_id'],
                    'student_id' => $record['student_id'],
                    'date' => $validated['date'],
                ],
                [
                    'status' => $record['status']
                ]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance saved successfully'
        ]);
    }
}
