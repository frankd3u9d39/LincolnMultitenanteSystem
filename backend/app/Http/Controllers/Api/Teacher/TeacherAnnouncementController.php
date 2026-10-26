<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class TeacherAnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $announcements = Announcement::where('teacher_id', $request->user()->id)->latest()->get();

        return response()->json([
            'status' => 'success',
            'data' => $announcements,
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

        $announcement = Announcement::create(array_merge($validated, ['teacher_id' => $request->user()->id]));

        return response()->json([
            'status' => 'success',
            'message' => 'Announcement posted successfully',
            'data' => $announcement,
        ], 201);
    }
}
