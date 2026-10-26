<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - Institutional Results & Academic Performance.
 */
class ResultOverviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $enrollments = Enrollment::where('school_id', $school->id)->with('student', 'course')->get();
        $students = User::where('school_id', $school->id)->where('role', User::ROLE_STUDENT)->get();

        $rankings = $students->map(function (User $s) use ($enrollments) {
            $studentEnrollments = $enrollments->where('student_id', $s->id);
            $scores = $studentEnrollments->pluck('score')->filter()->values();
            $avgScore = $scores->count() > 0 ? round($scores->avg(), 1) : 0.0;
            $gpa = $scores->count() > 0 ? round(($avgScore / 100) * 4.0, 2) : 0.0;

            $coursesPassed = $studentEnrollments->where('score', '>=', 50)->count();
            $creditsEarned = $studentEnrollments->where('score', '>=', 50)->sum(fn ($e) => $e->course?->credits ?? 0);

            $standing = 'No Grades Yet';
            if ($scores->count() > 0) {
                $standing = $gpa >= 3.6 ? "Dean's Honours List" : ($gpa >= 3.0 ? 'Good Standing' : ($gpa >= 2.0 ? 'Satisfactory' : 'Academic Notice'));
            }

            return [
                'id' => $s->id,
                'name' => $s->name,
                'email' => $s->email,
                'idNumber' => $s->studentProfile?->student_id_number ?? ('LC-STD-'.str_pad((string) $s->id, 4, '0', STR_PAD_LEFT)),
                'gpa' => $gpa,
                'averageScore' => $avgScore,
                'coursesPassed' => $coursesPassed,
                'creditsEarned' => $creditsEarned,
                'standing' => $standing,
            ];
        });

        $totalRankings = $rankings->count();
        $assessed = $rankings->filter(fn ($r) => $r['averageScore'] > 0);
        $campusAvgGpa = $assessed->count() > 0 ? round($assessed->avg('gpa'), 2) : 0.0;

        $totalEnrollmentsCount = $enrollments->whereNotNull('score')->count();
        $passedCount = $enrollments->where('score', '>=', 50)->count();
        $passRate = $totalEnrollmentsCount > 0 ? round(($passedCount / $totalEnrollmentsCount) * 100, 1).'%' : '0.0%';

        $gpaDistribution = [
            [
                'bracket' => '3.50 - 4.00 (Distinction)',
                'count' => $rankings->where('gpa', '>=', 3.5)->count(),
                'percentage' => $totalRankings > 0 ? round(($rankings->where('gpa', '>=', 3.5)->count() / $totalRankings) * 100) : 0,
            ],
            [
                'bracket' => '3.00 - 3.49 (Merit)',
                'count' => $rankings->whereBetween('gpa', [3.0, 3.49])->count(),
                'percentage' => $totalRankings > 0 ? round(($rankings->whereBetween('gpa', [3.0, 3.49])->count() / $totalRankings) * 100) : 0,
            ],
            [
                'bracket' => '2.00 - 2.99 (Pass)',
                'count' => $rankings->whereBetween('gpa', [2.0, 2.99])->count(),
                'percentage' => $totalRankings > 0 ? round(($rankings->whereBetween('gpa', [2.0, 2.99])->count() / $totalRankings) * 100) : 0,
            ],
            [
                'bracket' => '< 2.00 (Academic Notice)',
                'count' => $rankings->filter(fn ($r) => $r['gpa'] > 0 && $r['gpa'] < 2.0)->count(),
                'percentage' => $totalRankings > 0 ? round(($rankings->filter(fn ($r) => $r['gpa'] > 0 && $r['gpa'] < 2.0)->count() / $totalRankings) * 100) : 0,
            ],
        ];

        return response()->json([
            'summary' => [
                'campusAverageGpa' => $campusAvgGpa,
                'totalStudentsAssessed' => $assessed->count(),
                'passRate' => $passRate,
                'honorsCount' => $rankings->where('gpa', '>=', 3.5)->count(),
            ],
            'gpaDistribution' => $gpaDistribution,
            'rankings' => $rankings->values(),
        ]);
    }
}
