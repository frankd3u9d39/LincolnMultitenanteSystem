<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * GROUP 1: Student Module - enrolled courses and the open catalog.
 */
class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $enrollments = Enrollment::where('student_id', $student->id)
            ->with(['course.teacher', 'course.schedules'])
            ->get();

        $courses = $enrollments->map(function (Enrollment $e) {
            $course = $e->course;

            return [
                'id' => $course->id,
                'enrollmentId' => $e->id,
                'name' => $course->name,
                'code' => $course->code,
                'instructor' => $course->teacher?->name ?? 'TBA',
                'credits' => $course->credits,
                'schedule' => $course->schedules->map(fn ($s) => $s->dayName().' '.$s->starts_at)->implode(', '),
                'progress' => $e->progress,
                'color' => $course->color,
                'status' => $e->status === Enrollment::STATUS_COMPLETED ? 'Completed' : 'In Progress',
            ];
        });

        return response()->json(['data' => $courses]);
    }

    public function catalog(Request $request): JsonResponse
    {
        $student = $request->user();

        $enrolledCourseIds = Enrollment::where('student_id', $student->id)
            ->where('status', '!=', Enrollment::STATUS_WITHDRAWN)
            ->pluck('course_id');

        $courses = Course::where('school_id', $student->school_id)
            ->whereNotIn('id', $enrolledCourseIds)
            ->with(['teacher', 'schedules'])
            ->withCount(['enrollments' => fn ($q) => $q->where('status', '!=', Enrollment::STATUS_WITHDRAWN)])
            ->get()
            ->map(fn (Course $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'instructor' => $c->teacher?->name ?? 'TBA',
                'credits' => $c->credits,
                'category' => $c->department,
                'schedule' => $c->schedules->map(fn ($s) => $s->dayName().' '.$s->starts_at)->implode(', '),
                'spots' => max(0, $c->capacity - $c->enrollments_count),
                'totalSpots' => $c->capacity,
                'color' => $c->color,
            ]);

        return response()->json(['data' => $courses]);
    }

    public function enroll(Request $request, Course $course): JsonResponse
    {
        $student = $request->user();

        if ($course->school_id !== $student->school_id) {
            return response()->json(['message' => 'Course not found.'], 404);
        }

        if ($course->spotsRemaining() <= 0) {
            return response()->json(['message' => 'This course is full.'], 422);
        }

        $exists = Enrollment::where('student_id', $student->id)
            ->where('course_id', $course->id)
            ->where('term', $course->term)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'You are already enrolled in this course.'], 422);
        }

        $enrollment = DB::transaction(fn () => Enrollment::create([
            'school_id' => $student->school_id,
            'student_id' => $student->id,
            'course_id' => $course->id,
            'term' => $course->term,
            'status' => Enrollment::STATUS_IN_PROGRESS,
            'progress' => 0,
        ]));

        return response()->json(['data' => ['enrollmentId' => $enrollment->id]], 201);
    }
}
