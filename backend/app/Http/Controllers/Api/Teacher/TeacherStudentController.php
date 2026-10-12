<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class TeacherStudentController extends Controller
{
    public function index(Request $request, SchoolClass $schoolClass)
    {
        // Retrieve students belonging to a class
        $students = $schoolClass->students()->with('user')->get();

        return response()->json([
            'status' => 'success',
            'data' => $students
        ]);
    }
}
