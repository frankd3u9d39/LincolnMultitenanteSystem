<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Course;
use App\Models\FeeItem;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - school-level overview.
 */
class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $studentCount = User::where('school_id', $school->id)->where('role', User::ROLE_STUDENT)->count();
        $teacherCount = User::where('school_id', $school->id)->where('role', User::ROLE_TEACHER)->count();
        $teacherIds = User::where('school_id', $school->id)->where('role', User::ROLE_TEACHER)->pluck('id');

        $classCount = SchoolClass::whereIn('teacher_id', $teacherIds)->count();
        $courseCount = Course::where('school_id', $school->id)->count();

        $outstandingFees = FeeItem::where('school_id', $school->id)
            ->get()
            ->sum(fn (FeeItem $item) => $item->outstanding());

        // Announcements can be posted by any staff member (admin or teacher), not just teachers.
        $posterIds = User::where('school_id', $school->id)->pluck('id');

        $recentAnnouncements = Announcement::whereIn('teacher_id', $posterIds)
            ->latest()
            ->limit(5)
            ->get(['id', 'title', 'target_audience', 'is_important', 'created_at'])
            ->map(fn (Announcement $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'audience' => $a->target_audience,
                'important' => (bool) $a->is_important,
                'date' => $a->created_at->diffForHumans(),
            ]);

        return response()->json([
            'data' => [
                'school' => [
                    'name' => $school->name,
                    'code' => $school->code,
                    'academicYear' => $school->academic_year_current,
                    'maxStudents' => $school->max_students,
                    'maxTeachers' => $school->max_teachers,
                ],
                'counts' => [
                    'students' => $studentCount,
                    'teachers' => $teacherCount,
                    'classes' => $classCount,
                    'subjects' => $courseCount,
                    'courses' => $courseCount,
                ],
                'outstandingFees' => round($outstandingFees, 2),
                'recentAnnouncements' => $recentAnnouncements,
            ],
        ]);
    }
}
