<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 1: Student Module - coursework and submissions.
 */
class AssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $courseIds = Enrollment::where('student_id', $student->id)->pluck('course_id');

        $submissions = AssignmentSubmission::where('student_id', $student->id)
            ->whereHas('assignment', fn ($q) => $q->whereIn('course_id', $courseIds))
            ->with('assignment.course')
            ->get()
            ->map(fn (AssignmentSubmission $s) => [
                'id' => $s->assignment_id,
                'submissionId' => $s->id,
                'title' => $s->assignment->title,
                'course' => $s->assignment->course->name.' ('.$s->assignment->course->code.')',
                'dueDate' => $s->assignment->due_at->toIso8601String(),
                'status' => ucfirst($s->effectiveStatus()),
                'type' => $s->assignment->type,
                'points' => $s->assignment->points,
                'score' => $s->score,
            ]);

        return response()->json(['data' => $submissions]);
    }

    public function submit(Request $request, AssignmentSubmission $submission): JsonResponse
    {
        $student = $request->user();

        if ($submission->student_id !== $student->id) {
            return response()->json(['message' => 'Submission not found.'], 404);
        }

        if ($submission->effectiveStatus() === AssignmentSubmission::STATUS_GRADED) {
            return response()->json(['message' => 'This assignment has already been graded.'], 422);
        }

        $data = $request->validate([
            'submissionText' => ['nullable', 'string', 'max:20000'],
        ]);

        $submission->update([
            'status' => AssignmentSubmission::STATUS_SUBMITTED,
            'submission_text' => $data['submissionText'] ?? $submission->submission_text,
            'submitted_at' => now(),
        ]);

        return response()->json(['data' => ['status' => 'Submitted']]);
    }
}
