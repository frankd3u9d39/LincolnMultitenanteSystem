<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 1: Student Module - portal overview.
 */
class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $enrollments = Enrollment::query()
            ->where('student_id', $student->id)
            ->where('status', Enrollment::STATUS_IN_PROGRESS)
            ->with('course.schedules')
            ->get();

        $courseIds = $enrollments->pluck('course_id');

        $gpa = $this->gpaFor($student->id);

        $attendanceTotal = AttendanceRecord::where('student_id', $student->id)->count();
        $attendancePresent = AttendanceRecord::where('student_id', $student->id)
            ->whereIn('status', ['present', 'late'])->count();
        $attendancePercent = $attendanceTotal > 0 ? round($attendancePresent / $attendanceTotal * 100, 1) : 100.0;

        $assignmentsDue = AssignmentSubmission::where('student_id', $student->id)
            ->where('status', AssignmentSubmission::STATUS_PENDING)
            ->whereHas('assignment', fn ($q) => $q->where('due_at', '>=', now()))
            ->count();

        $unread = StudentNotification::where('student_id', $student->id)->where('is_read', false)->count();

        $today = (int) now()->dayOfWeekIso; // 1 Mon .. 7 Sun
        $todaysClasses = $today >= 1 && $today <= 5
            ? $enrollments->flatMap(fn ($e) => $e->course->schedules->where('day_of_week', $today)
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'subject' => $e->course->name,
                    'time' => $s->starts_at.' - '.$s->ends_at,
                    'room' => $s->location,
                    'instructor' => $e->course->teacher?->name ?? 'TBA',
                ]))->values()
            : collect();

        $recentGrades = AssignmentSubmission::where('student_id', $student->id)
            ->where('status', AssignmentSubmission::STATUS_GRADED)
            ->with('assignment.course')
            ->latest('graded_at')->limit(5)->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'course' => $s->assignment->course->name,
                'task' => $s->assignment->title,
                'score' => $s->score,
                'points' => $s->assignment->points,
                'date' => $s->graded_at?->toDateString(),
            ]);

        $upcoming = Assignment::whereIn('course_id', $courseIds)
            ->where('due_at', '>=', now())
            ->whereDoesntHave('submissions', fn ($q) => $q->where('student_id', $student->id)->whereIn('status', ['submitted', 'graded']))
            ->orderBy('due_at')
            ->limit(5)
            ->with('course')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'course' => $a->course->name,
                'task' => $a->title,
                'due' => $a->due_at->toIso8601String(),
                'urgency' => now()->diffInHours($a->due_at) <= 48 ? 'high' : (now()->diffInHours($a->due_at) <= 168 ? 'medium' : 'low'),
            ]);

        return response()->json([
            'data' => [
                'kpi' => [
                    'gpa' => $gpa,
                    'attendance' => $attendancePercent,
                    'assignmentsDue' => $assignmentsDue,
                    'unreadNotifications' => $unread,
                ],
                'todaysClasses' => $todaysClasses,
                'recentGrades' => $recentGrades,
                'upcomingDeadlines' => $upcoming,
            ],
        ]);
    }

    private function gpaFor(int $studentId): float
    {
        $scores = Enrollment::where('student_id', $studentId)
            ->where('status', Enrollment::STATUS_COMPLETED)
            ->whereNotNull('score')
            ->get(['score']);

        if ($scores->isEmpty()) {
            return 0.0;
        }

        $gradePoints = $scores->avg(fn ($e) => $this->scoreToGradePoint($e->score));

        return round($gradePoints, 2);
    }

    private function scoreToGradePoint(int $score): float
    {
        return match (true) {
            $score >= 93 => 4.0,
            $score >= 90 => 3.7,
            $score >= 87 => 3.3,
            $score >= 83 => 3.0,
            $score >= 80 => 2.7,
            $score >= 77 => 2.3,
            $score >= 73 => 2.0,
            $score >= 70 => 1.7,
            $score >= 60 => 1.0,
            default => 0.0,
        };
    }
}
