<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class TeacherClassController extends Controller
{
    public function index(Request $request)
    {
        $classes = SchoolClass::where('teacher_id', $request->user()->id)
            ->withCount('students')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $classes,
        ]);
    }
}
