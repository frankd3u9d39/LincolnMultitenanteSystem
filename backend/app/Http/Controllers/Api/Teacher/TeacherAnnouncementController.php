<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class TeacherAnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = 1; // mocked
        $announcements = Announcement::where('teacher_id', $teacherId)->latest()->get();

        return response()->json([
            'status' => 'success',
            'data' => $announcements
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'target_audience' => 'required|string',
            'is_important' => 'boolean',
            'content' => 'required|string',
        ]);

        $teacherId = 1; // mocked
        
        $announcement = Announcement::create(array_merge($validated, ['teacher_id' => $teacherId]));

        return response()->json([
            'status' => 'success',
            'message' => 'Announcement posted successfully',
            'data' => $announcement
        ], 201);
    }
}
