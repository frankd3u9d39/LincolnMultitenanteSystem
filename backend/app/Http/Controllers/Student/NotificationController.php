<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 1: Student Module - campus/academic/finance notifications.
 */
class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $notifications = StudentNotification::where('student_id', $student->id)
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (StudentNotification $n) => [
                'id' => $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'date' => $n->created_at->diffForHumans(),
                'type' => $n->type,
                'isRead' => $n->is_read,
            ]);

        return response()->json(['data' => $notifications]);
    }

    public function markRead(Request $request, StudentNotification $notification): JsonResponse
    {
        $this->authorizeOwn($request, $notification);

        $notification->update(['is_read' => true]);

        return response()->json(['data' => ['status' => 'ok']]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        StudentNotification::where('student_id', $request->user()->id)->update(['is_read' => true]);

        return response()->json(['data' => ['status' => 'ok']]);
    }

    private function authorizeOwn(Request $request, StudentNotification $notification): void
    {
        abort_unless($notification->student_id === $request->user()->id, 404);
    }
}
