<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class TeacherClassController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = 1; // mocked
        $classes = SchoolClass::where('teacher_id', $teacherId)->get();

        return response()->json([
            'status' => 'success',
            'data' => $classes
        ]);
    }
}
