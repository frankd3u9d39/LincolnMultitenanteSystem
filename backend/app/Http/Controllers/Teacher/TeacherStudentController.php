<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherStudentController extends Controller
{
    public function index(Request $request, SchoolClass $schoolClass)
    {
        $teacher = $request->user();
        $schoolId = $teacher->school_id;

        // Authorize: Teacher is Form Master, or teaches a subject to this class
        $isFormMaster = ($schoolClass->teacher_id === $teacher->id);
        $teachesSubject = $schoolClass->subjects()
            ->where(function ($q) use ($teacher) {
                $q->where('courses.teacher_id', $teacher->id)
                  ->orWhere('class_subject.teacher_id', $teacher->id);
            })->exists();

        abort_unless($isFormMaster || $teachesSubject, 404, 'Class not assigned to teacher.');

        $students = $schoolClass->students()->with('user')->get();

        return response()->json([
            'status' => 'success',
            'data' => $students,
        ]);
    }
}
