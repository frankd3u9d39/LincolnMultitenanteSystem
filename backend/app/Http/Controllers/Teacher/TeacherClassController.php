<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherClassController extends Controller
{
    public function index(Request $request)
    {
        $teacher = $request->user();
        $teacherId = $teacher->id;
        $schoolId = $teacher->school_id;

        // 1. Classes the teacher oversees
        $overseenClassIds = SchoolClass::where('teacher_id', $teacherId)->pluck('id');

        // 2. Classes where the teacher teaches a subject
        $subjectClassIds = SchoolClass::whereHas('subjects', function ($q) use ($teacherId) {
            $q->where('courses.teacher_id', $teacherId)
                ->orWhere('class_subject.teacher_id', $teacherId);
        })->pluck('id');

        $classIds = $overseenClassIds->merge($subjectClassIds)->unique();

        // 3. Fallback: all school classes
        if ($classIds->isEmpty()) {
            $teacherSchoolIds = User::where('school_id', $schoolId)->where('role', User::ROLE_TEACHER)->pluck('id');
            $classIds = SchoolClass::where(function ($q) use ($teacherSchoolIds) {
                $q->whereIn('teacher_id', $teacherSchoolIds)->orWhereNull('teacher_id');
            })->pluck('id');
        }

        $classes = SchoolClass::whereIn('id', $classIds)
            ->withCount('students')
            ->with(['teacher:id,name', 'subjects' => function ($q) {
                $q->select('courses.id', 'courses.code', 'courses.name', 'courses.department', 'courses.teacher_id')
                    ->with('teacher:id,name');
            }])
            ->get()
            ->map(function ($c) use ($teacherId) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'code' => $c->code,
                    'room' => $c->room,
                    'schedule' => $c->schedule,
                    'teacher' => $c->teacher?->name ?? 'Unassigned',
                    'teacher_id' => $c->teacher_id,
                    'is_form_master' => ($c->teacher_id === $teacherId),
                    'students_count' => $c->students_count,
                    'subjects' => $c->subjects->map(function ($s) use ($teacherId) {
                        $pivotTeacherId = $s->pivot?->teacher_id;
                        $isMySubject = ($s->teacher_id === $teacherId) || ($pivotTeacherId === $teacherId);

                        return [
                            'id' => $s->id,
                            'code' => $s->code,
                            'name' => $s->name,
                            'department' => $s->department,
                            'teacher' => $s->teacher?->name ?? 'Unassigned',
                            'is_my_subject' => $isMySubject,
                        ];
                    }),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $classes,
        ]);
    }
}
