<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TeacherAttendanceController extends Controller
{
    public function getClasses(Request $request)
    {
        $classes = SchoolClass::where('teacher_id', $request->user()->id)
            ->withCount('students')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $classes,
        ]);
    }

    public function store(Request $request)
    {
        $teacherId = $request->user()->id;

        $validated = $request->validate([
            'school_class_id' => [
                'required',
                Rule::exists('school_classes', 'id')->where('teacher_id', $teacherId),
            ],
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:Present,Absent,Late,Excused',
        ]);

        $schoolClass = SchoolClass::findOrFail($validated['school_class_id']);
        $rosterIds = $schoolClass->students()->pluck('students.id');

        foreach ($validated['records'] as $record) {
            if (! $rosterIds->contains($record['student_id'])) {
                throw ValidationException::withMessages(['records' => 'One of these students is not enrolled in this class.']);
            }
        }

        foreach ($validated['records'] as $record) {
            Attendance::updateOrCreate(
                [
                    'school_class_id' => $validated['school_class_id'],
                    'student_id' => $record['student_id'],
                    'date' => $validated['date'],
                ],
                [
                    'status' => $record['status'],
                ]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance saved successfully',
        ]);
    }
}
