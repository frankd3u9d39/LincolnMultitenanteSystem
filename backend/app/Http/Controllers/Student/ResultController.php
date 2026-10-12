<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 1: Student Module - exam results and academic standing.
 */
class ResultController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $enrollments = Enrollment::where('student_id', $student->id)
            ->whereNotNull('score')
            ->with('course')
            ->get()
            ->groupBy('term');

        $history = $enrollments->map(function ($rows, $term) {
            $courses = $rows->map(fn (Enrollment $e) => [
                'id' => $e->id,
                'name' => $e->course->name,
                'code' => $e->course->code,
                'credits' => $e->course->credits,
                'grade' => $e->grade,
                'score' => $e->score,
            ]);

            $creditWeighted = $rows->sum(fn ($e) => $this->gradePoint($e->score) * $e->course->credits);
            $totalCredits = $rows->sum(fn ($e) => $e->course->credits);

            return [
                'term' => $term,
                'tgpa' => $totalCredits > 0 ? round($creditWeighted / $totalCredits, 2) : 0,
                'courses' => $courses->values(),
            ];
        })->values();

        $allRows = $enrollments->flatten(1);
        $totalCredits = $allRows->sum(fn ($e) => $e->course->credits);
        $creditWeighted = $allRows->sum(fn ($e) => $this->gradePoint($e->score) * $e->course->credits);

        return response()->json([
            'data' => [
                'summary' => [
                    'cgpa' => $totalCredits > 0 ? round($creditWeighted / $totalCredits, 2) : 0,
                    'totalCredits' => $totalCredits,
                    'standing' => $this->standingFor($totalCredits > 0 ? $creditWeighted / $totalCredits : 0),
                ],
                'history' => $history,
            ],
        ]);
    }

    private function gradePoint(int $score): float
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

    private function standingFor(float $gpa): string
    {
        return match (true) {
            $gpa >= 3.7 => 'First Class Honors',
            $gpa >= 3.3 => 'Second Class Honors, Upper Division',
            $gpa >= 3.0 => 'Second Class Honors, Lower Division',
            $gpa >= 2.0 => 'Pass',
            default => 'Academic Probation',
        };
    }
}
