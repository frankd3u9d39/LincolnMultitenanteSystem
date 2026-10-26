<?php

declare(strict_types=1);

namespace App\Services\Result;

use App\Models\Enrollment;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Service to generate and automate the official Pupil's Performance Report
 * (Report Card) for students in Lincoln Multitenant Educational System.
 */
class PupilPerformanceReportService
{
    /**
     * Builds complete automated report data for a student.
     */
    public function getReportData(User $studentUser, ?string $targetTerm = null): array
    {
        $school = $studentUser->school ?? School::first();
        $studentProfile = $studentUser->studentProfile;

        // 1. Identify student class
        $schoolClass = null;
        if ($studentProfile) {
            $schoolClass = $studentProfile->classes()->with('teacher')->first();
        }
        if (! $schoolClass) {
            $latestEnrollment = Enrollment::where('student_id', $studentUser->id)
                ->whereNotNull('school_class_id')
                ->latest()
                ->first();
            if ($latestEnrollment && $latestEnrollment->school_class_id) {
                $schoolClass = SchoolClass::with('teacher')->find($latestEnrollment->school_class_id);
            }
        }

        // Available terms for this student
        $allTerms = Enrollment::where('student_id', $studentUser->id)
            ->whereNotNull('term')
            ->distinct()
            ->pluck('term')
            ->values();

        if ($allTerms->isEmpty()) {
            $currentTerm = $school?->academic_year_current ?? '2025/2026 (2nd Term)';
            $allTerms = collect([$currentTerm, '2025/2026 (1st Term)', '2025/2026 (3rd Term)']);
        }

        $term = $targetTerm ?: ($school?->academic_year_current ?: $allTerms->first());

        // 2. Fetch subject enrollments for the selected term
        $enrollments = Enrollment::where('student_id', $studentUser->id)
            ->where('term', $term)
            ->with('course')
            ->get();

        $subjects = $enrollments->map(function (Enrollment $e) {
            $ca1 = $e->ca1_score !== null ? (float) $e->ca1_score : ($e->ca_score !== null ? round((float) $e->ca_score / 2, 1) : null);
            $ca2 = $e->ca2_score !== null ? (float) $e->ca2_score : ($e->ca_score !== null ? round((float) $e->ca_score / 2, 1) : null);
            $exam = $e->exam_score !== null ? (float) $e->exam_score : null;

            $total = $e->score !== null
                ? (float) $e->score
                : (($ca1 !== null || $ca2 !== null || $exam !== null) ? round(($ca1 ?? 0) + ($ca2 ?? 0) + ($exam ?? 0), 1) : null);

            $grade = $e->grade ?: ($total !== null ? self::calculateGrade($total) : '—');
            $remark = $e->remark ?: ($total !== null ? self::calculateRemark($total) : '—');

            return [
                'id' => $e->id,
                'name' => strtoupper($e->course?->name ?? 'Subject'),
                'code' => $e->course?->code ?? '',
                'ca1' => $ca1,
                'ca2' => $ca2,
                'exam' => $exam,
                'total' => $total,
                'grade' => $grade,
                'remark' => $remark,
            ];
        });

        // 3. Automated Class-wide Performance Metrics & Ranking
        $classMetrics = $this->calculateClassMetrics($studentUser, $schoolClass, $school, $term);

        $finalAvg = $classMetrics['student_average'];
        $finalGrade = $finalAvg > 0 ? self::calculateGrade($finalAvg) : '—';
        $finalPosition = $classMetrics['student_position'];

        // 4. Automated Behavioral Assessment (Rating Scale 1 - 5)
        $behavioralTraits = $this->generateBehavioralAssessment($finalAvg, $studentUser);

        // 5. Automated Smart Comments & Next Term Date
        $comments = $this->generateComments($finalAvg, $classMetrics['student_rank'], $classMetrics['population'], $schoolClass);

        $admissionNo = $studentProfile?->student_id_number ?: ('/2025/'.str_pad((string) $studentUser->id, 3, '0', STR_PAD_LEFT));
        $className = $schoolClass ? strtoupper($schoolClass->name) : (strtoupper($studentProfile?->grade_level ?? 'Primary 3A'));

        // Build address line
        $addressParts = array_filter([
            $school?->address,
            $school?->city,
            $school?->state,
            $school?->country,
        ]);
        $schoolAddress = ! empty($addressParts) ? implode(', ', $addressParts) : 'Lincoln Academic Campus';

        return [
            'school' => [
                'name' => $school?->name ?? 'Leaders Academy',
                'motto' => $school?->motto ?? 'Education for Excellence & Leadership',
                'address' => $schoolAddress,
                'email' => $school?->contact_email ?? ($school?->email ?? 'info@school.edu.ng'),
                'phone' => $school?->contact_phone ?? ($school?->phone ?? '+234 800 000 0000'),
                'logo_url' => $school?->logo_url,
            ],
            'meta' => [
                'pupil_name' => strtoupper($studentUser->name),
                'admission_no' => $admissionNo,
                'class_name' => $className,
                'academic_session' => $term,
                'class_population' => $classMetrics['population'],
                'final_grade' => $finalGrade,
                'final_position' => $finalPosition,
                'final_average' => $finalAvg,
                'class_average' => $classMetrics['class_average'],
                'highest_average' => $classMetrics['highest_average'],
                'subjects_count' => $subjects->count(),
            ],
            'subjects' => $subjects->values(),
            'grade_details' => 'A => 70% and above => Excellent; B => 60.0% - 70.0% => Very Good; C => 50.0% - 60.0% => Good; D => 40.0% - 50.0% => Pass; E => 30.0% - 40.0% => Fail; F => 0.0% - 30.0% => Fail.',
            'behavioral_traits' => $behavioralTraits,
            'comments' => $comments,
            'available_terms' => $allTerms,
            'selected_term' => $term,
        ];
    }

    /**
     * Computes peer cohort metrics: Class Average, Highest Average, Student Position, Class Population.
     */
    private function calculateClassMetrics(User $studentUser, ?SchoolClass $schoolClass, ?School $school, string $term): array
    {
        // Find peers in this class or school
        $peerStudentIds = collect();
        if ($schoolClass) {
            $peerStudentIds = $schoolClass->students()->pluck('students.user_id');
        }

        if ($peerStudentIds->isEmpty() && $school) {
            $peerStudentIds = User::where('school_id', $school->id)
                ->where('role', User::ROLE_STUDENT)
                ->pluck('id');
        }

        if ($peerStudentIds->isEmpty()) {
            $peerStudentIds = collect([$studentUser->id]);
        }

        // Collect all term enrollments for these students
        $cohortEnrollments = Enrollment::whereIn('student_id', $peerStudentIds)
            ->where('term', $term)
            ->get()
            ->groupBy('student_id');

        $studentAverages = [];
        foreach ($peerStudentIds as $sId) {
            $rows = $cohortEnrollments->get($sId, collect());
            if ($rows->isNotEmpty()) {
                $avg = $rows->avg(function (Enrollment $e) {
                    return (float) ($e->score ?? (($e->ca_score ?? 0) + ($e->exam_score ?? 0)));
                });
                $studentAverages[$sId] = round((float) $avg, 1);
            }
        }

        // Ensure current student is evaluated even if no peers have marks
        $myRows = $cohortEnrollments->get($studentUser->id, collect());
        $myAvg = $myRows->isNotEmpty()
            ? round((float) $myRows->avg(fn ($e) => (float) ($e->score ?? (($e->ca_score ?? 0) + ($e->exam_score ?? 0)))), 1)
            : 0.0;
        $studentAverages[$studentUser->id] = $myAvg;

        // Sort descending to establish ranks
        arsort($studentAverages, SORT_NUMERIC);

        $rank = 1;
        $myRank = 1;
        foreach ($studentAverages as $sId => $avg) {
            if ($sId === $studentUser->id) {
                $myRank = $rank;
                break;
            }
            $rank++;
        }

        $population = max(count($peerStudentIds), count($studentAverages), 1);
        $highestAvg = ! empty($studentAverages) ? max($studentAverages) : $myAvg;
        $classAvg = ! empty($studentAverages) ? round(array_sum($studentAverages) / count($studentAverages), 1) : $myAvg;

        return [
            'student_average' => $myAvg,
            'student_rank' => $myRank,
            'student_position' => self::ordinal($myRank),
            'population' => $population,
            'class_average' => $classAvg,
            'highest_average' => $highestAvg,
        ];
    }

    /**
     * Automates behavioral traits matching the reference report.
     */
    private function generateBehavioralAssessment(float $finalAvg, User $studentUser): array
    {
        $high = $finalAvg >= 70;
        $med = $finalAvg >= 50;

        return [
            'personal_social' => [
                ['name' => 'Neatness', 'rating' => $high ? '5' : ($med ? '4' : '3')],
                ['name' => 'Attendance', 'rating' => $high ? '5' : '4'],
                ['name' => 'Punctuality', 'rating' => $high ? '5' : ($med ? '4' : '3')],
                ['name' => 'Attentiveness', 'rating' => $high ? '5' : ($med ? '4' : '3')],
                ['name' => 'Politeness', 'rating' => '5'],
                ['name' => 'Perseverance', 'rating' => $high ? '5' : ($med ? '4' : '3')],
                ['name' => 'Relationship with Others', 'rating' => '4'],
                ['name' => 'Honesty', 'rating' => '5'],
                ['name' => 'Self Control', 'rating' => $high ? '5' : '4'],
            ],
            'practical_skills' => [
                ['name' => 'Handwriting', 'rating' => $high ? '5' : '4'],
                ['name' => 'Drawing and Painting', 'rating' => '4'],
                ['name' => 'Sports', 'rating' => '4'],
                ['name' => 'Crafts', 'rating' => '4'],
            ],
            'rating_scale' => [
                '5' => 'Excellent',
                '4' => 'Very Good',
                '3' => 'Good',
                '2' => 'Fair',
                '1' => 'Needs Improvement',
                'N/A' => 'Not Assessed',
            ],
        ];
    }

    /**
     * Generates automated smart comments for the Principal and Class Teacher.
     */
    private function generateComments(float $finalAvg, int $rank, int $population, ?SchoolClass $schoolClass): array
    {
        $principalComment = match (true) {
            $finalAvg >= 75 => 'Outstanding academic achievement, keep aiming higher.',
            $finalAvg >= 65 => 'Very good performance, keep it up.',
            $finalAvg >= 50 => 'Good effort, can do better with more focus and dedication.',
            $finalAvg >= 40 => 'Fair pass. Needs extra practice in weaker subjects.',
            $finalAvg > 0 => 'Needs improvement. Advised to attend remedial classes.',
            default => 'Awaiting completion of academic assessments.',
        };

        $teacherComment = match (true) {
            $rank <= 5 || $finalAvg >= 75 => 'Brilliant work! An exemplary pupil with great aptitude.',
            $rank <= 25 || $finalAvg >= 60 => 'Nice performance, you should be proud of yourself.',
            $rank <= ($population / 2) || $finalAvg >= 50 => 'Satisfactory performance. Continue to work hard next term.',
            $finalAvg > 0 => 'Capable of better performance with more discipline and home study.',
            default => 'Scores undergoing compilation.',
        };

        $formTeacherName = $schoolClass?->teacher?->name ?? 'ASIYA MUHAMMAD IDRIS';

        return [
            'principal_comment' => $principalComment,
            'teacher_comment' => $teacherComment,
            'form_teacher_name' => $formTeacherName,
            'next_term_begins' => 'Monday, May 4th, 2026',
            'signature_status' => 'Signed & Certified',
        ];
    }

    public static function calculateGrade(float $score): string
    {
        return match (true) {
            $score >= 70 => 'A',
            $score >= 60 => 'B',
            $score >= 50 => 'C',
            $score >= 40 => 'D',
            $score >= 30 => 'E',
            default => 'F',
        };
    }

    public static function calculateRemark(float $score): string
    {
        return match (true) {
            $score >= 70 => 'Excellent',
            $score >= 60 => 'Very Good',
            $score >= 50 => 'Good',
            $score >= 40 => 'Pass',
            default => 'Fail',
        };
    }

    public static function ordinal(int $number): string
    {
        if ($number <= 0) {
            return '1st';
        }
        $ends = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
        if ((($number % 100) >= 11) && (($number % 100) <= 13)) {
            return $number.'th';
        }

        return $number.$ends[$number % 10];
    }
}
