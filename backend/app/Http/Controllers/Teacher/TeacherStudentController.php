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

        // Authorize: Teacher is Form Master, or teaches a subject to this class, or belongs to same school
        $teacherSchoolIds = User::where('school_id', $schoolId)->where('role', User::ROLE_TEACHER)->pluck('id');
        if ($schoolClass->teacher_id) {
            abort_unless($teacherSchoolIds->contains($schoolClass->teacher_id), 403, 'Unauthorized class access.');
        }

        $students = $schoolClass->students()->with('user')->get();

        return response()->json([
            'status' => 'success',
            'data' => $students,
        ]);
    }
}
