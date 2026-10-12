<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class TeacherStudentController extends Controller
{
    public function index(Request $request, SchoolClass $schoolClass)
    {
        // A class belongs to exactly one teacher; only that teacher may read its roster.
        abort_unless($schoolClass->teacher_id === $request->user()->id, 404);

        $students = $schoolClass->students()->with('user')->get();

        return response()->json([
            'status' => 'success',
            'data' => $students,
        ]);
    }
}
