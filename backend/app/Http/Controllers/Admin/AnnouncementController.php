<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\StudentNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - school-wide announcements.
 *
 * `Announcement` is owned by Group 2 and keyed to a single `teacher_id`
 * (poster), with no `school_id` column; an admin posts under their own user
 * id like any other poster, and the listing is scoped to posters who belong
 * to this school.
 */
class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;
        $posterIds = User::where('school_id', $school->id)->pluck('id');

        $announcements = Announcement::whereIn('teacher_id', $posterIds)
            ->with('teacher:id,name,role')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Announcement $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'content' => $a->content,
                'audience' => $a->target_audience,
                'important' => (bool) $a->is_important,
                'postedBy' => $a->teacher?->name,
                'date' => $a->created_at->toIso8601String(),
            ]);

        return response()->json(['data' => $announcements]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $schoolId = $user->school_id ?? $user->school?->id;

        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'content' => ['required', 'string', 'max:5000'],
            'audience' => ['required', 'string', 'max:60'],
            'important' => ['sometimes', 'boolean'],
        ]);

        $announcement = Announcement::create([
            'title' => $data['title'],
            'content' => $data['content'],
            'target_audience' => $data['audience'],
            'is_important' => $data['important'] ?? false,
            'teacher_id' => $user->id,
        ]);

        // If announcement is for students or both, broadcast in-app notification to all students of this school
        if ($schoolId && in_array($data['audience'], ['all', 'both', 'students'])) {
            $students = User::where('school_id', $schoolId)
                ->where('role', User::ROLE_STUDENT)
                ->get(['id', 'school_id']);

            $prefix = ($data['important'] ?? false) ? '📢 [Important] ' : '📢 ';
            foreach ($students as $student) {
                StudentNotification::create([
                    'school_id' => $student->school_id ?: $schoolId,
                    'student_id' => $student->id,
                    'title' => $prefix . $data['title'],
                    'message' => $data['content'],
                    'type' => 'Campus',
                    'is_read' => false,
                ]);
            }
        }

        return response()->json(['data' => ['id' => $announcement->id]], 201);
    }
}
