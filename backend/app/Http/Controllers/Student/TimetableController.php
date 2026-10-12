<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CourseSchedule;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 1: Student Module - weekly class schedule.
 */
class TimetableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $courseIds = Enrollment::where('student_id', $student->id)
            ->where('status', Enrollment::STATUS_IN_PROGRESS)
            ->pluck('course_id');

        $schedules = CourseSchedule::whereIn('course_id', $courseIds)
            ->with('course.teacher')
            ->orderBy('starts_at')
            ->get();

        $byDay = [];
        foreach (CourseSchedule::DAYS as $num => $name) {
            $byDay[$name] = $schedules->where('day_of_week', $num)->map(fn (CourseSchedule $s) => [
                'id' => $s->id,
                'time' => $s->starts_at.' - '.$s->ends_at,
                'course' => $s->course->name.' ('.$s->course->code.')',
                'type' => $s->type,
                'location' => $s->location,
                'instructor' => $s->course->teacher?->name ?? 'TBA',
                'color' => $s->course->color,
            ])->values();
        }

        return response()->json(['data' => $byDay]);
    }
}
