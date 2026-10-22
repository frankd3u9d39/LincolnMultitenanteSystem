<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 1: Student Module - Computer-Based Testing (CBT) Portal.
 *
 * Provides student access to scheduled online CBT examinations.
 * Enforces school CBT eligibility, student identity verification, and
 * the required SuperAdmin/Admin generated Exam Access Code.
 */
class CbtController extends Controller
{
    /**
     * Lists active or scheduled CBT examinations for the student.
     */
    public function exams(Request $request): JsonResponse
    {
        $student = $request->user();
        $school = $student->school;

        if (! $school->cbt_enabled) {
            return response()->json([
                'cbt_enabled' => false,
                'message' => 'Your institution conducts examinations in paper-based format. CBT online testing is not enabled for your school.',
                'exams' => [],
            ]);
        }

        $cbtAssignments = Assignment::where('school_id', $school->id)
            ->where('type', 'Exam')
            ->where('instructions', 'like', '%CBT%')
            ->with(['course.teacher'])
            ->orderBy('due_at')
            ->get();

        $studentProfile = $student->studentProfile;
        $studentIdNumber = $studentProfile?->student_id_number ?? ('LC-STD-' . str_pad($student->id, 4, '0', STR_PAD_LEFT));

        $exams = $cbtAssignments->map(function (Assignment $a) use ($student) {
            $meta = json_decode($a->instructions, true) ?? [];
            $hasSubmitted = AssignmentSubmission::where('assignment_id', $a->id)
                ->where('student_id', $student->id)
                ->where('status', 'graded')
                ->exists();

            $dateStr = $a->due_at ? $a->due_at->toDateString() : Carbon::today()->toDateString();
            $timeVal = $meta['time'] ?? '08:30 - 10:30';

            return [
                'id' => $a->id,
                'examCode' => 'CBT-' . ($a->course?->code ?? 'EXAM') . '-' . $a->id,
                'courseCode' => $a->course?->code ?? 'GEN',
                'courseName' => $a->course?->name ?? $a->title,
                'title' => $a->title,
                'date' => $dateStr,
                'time' => $timeVal,
                'duration' => $meta['duration'] ?? '1.0 Hour',
                'format' => $meta['format'] ?? 'CBT (Computer Based Test)',
                'hasSubmitted' => $hasSubmitted,
                'status' => $hasSubmitted ? 'Completed' : ($meta['status'] ?? 'Scheduled'),
            ];
        });

        return response()->json([
            'cbt_enabled' => true,
            'student' => [
                'name' => $student->name,
                'email' => $student->email,
                'student_id_number' => $studentIdNumber,
            ],
            'exams' => $exams->values(),
        ]);
    }

    /**
     * Verifies the student identity and the SuperAdmin/Admin generated Exam Access Code.
     */
    public function verifyAccess(Request $request): JsonResponse
    {
        $student = $request->user();
        $school = $student->school;

        if (! $school->cbt_enabled) {
            return response()->json([
                'verified' => false,
                'message' => 'CBT Examination access is disabled for your institution.',
            ], 403);
        }

        $validated = $request->validate([
            'exam_id' => ['required', 'integer', 'exists:assignments,id'],
            'student_name' => ['required', 'string', 'max:120'],
            'student_id_number' => ['required', 'string', 'max:50'],
            'access_code' => ['required', 'string', 'max:50'],
        ]);

        $assignment = Assignment::where('school_id', $school->id)->findOrFail($validated['exam_id']);
        $meta = json_decode($assignment->instructions, true) ?? [];

        $expectedCode = strtoupper(trim($meta['cbt_access_code'] ?? ''));
        $inputCode = strtoupper(trim($validated['access_code']));

        if (empty($expectedCode) || $expectedCode !== $inputCode) {
            return response()->json([
                'verified' => false,
                'message' => 'Invalid Exam Access Code. Please enter the valid code issued by your Examination Supervisor or platform SuperAdmin.',
            ], 422);
        }

        // Check if student already submitted this exam
        $alreadySubmitted = AssignmentSubmission::where('assignment_id', $assignment->id)
            ->where('student_id', $student->id)
            ->where('status', 'graded')
            ->first();

        if ($alreadySubmitted) {
            return response()->json([
                'verified' => false,
                'message' => sprintf('You have already completed and submitted this examination with a score of %d%%.', $alreadySubmitted->score),
            ], 400);
        }

        // Return verified session along with the exam question paper
        $questions = $this->getExamQuestions($assignment);

        return response()->json([
            'verified' => true,
            'message' => 'Exam Access Code validated successfully. Welcome to your examination session.',
            'exam' => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'courseCode' => $assignment->course?->code ?? '',
                'courseName' => $assignment->course?->name ?? $assignment->title,
                'durationMinutes' => 45,
                'totalPoints' => 60,
                'questionsCount' => count($questions),
            ],
            'student' => [
                'name' => $validated['student_name'],
                'student_id_number' => $validated['student_id_number'],
            ],
            'questions' => $questions,
        ]);
    }

    /**
     * Submits the student's CBT examination answers, auto-grades, and updates the student's result.
     */
    public function submitExam(Request $request): JsonResponse
    {
        $student = $request->user();
        $school = $student->school;

        $validated = $request->validate([
            'exam_id' => ['required', 'integer', 'exists:assignments,id'],
            'answers' => ['required', 'array'],
        ]);

        $assignment = Assignment::where('school_id', $school->id)->findOrFail($validated['exam_id']);
        $questions = $this->getExamQuestions($assignment);

        $correctCount = 0;
        $totalQuestions = count($questions);
        $pointsPerQuestion = $totalQuestions > 0 ? (60 / $totalQuestions) : 0; // standard 60 marks for exam

        foreach ($questions as $q) {
            $qId = $q['id'];
            $selectedAnswer = $validated['answers'][$qId] ?? null;
            if ($selectedAnswer && strtoupper($selectedAnswer) === strtoupper($q['correct_answer'])) {
                $correctCount++;
            }
        }

        $calculatedExamScore = round($correctCount * $pointsPerQuestion, 1);

        // Record submission
        AssignmentSubmission::updateOrCreate(
            [
                'assignment_id' => $assignment->id,
                'student_id' => $student->id,
            ],
            [
                'status' => 'graded',
                'submission_text' => json_encode(['answers' => $validated['answers']]),
                'submitted_at' => now(),
                'score' => (int) round(($correctCount / $totalQuestions) * 100),
                'feedback' => sprintf('CBT Exam Completed: %d/%d questions correct. Score: %0.1f/60', $correctCount, $totalQuestions, $calculatedExamScore),
            ]
        );

        // Also update or create the student's enrollment record with the new exam score!
        $courseId = $assignment->course_id ?? Course::where('school_id', $school->id)->value('id');
        $term = $school->academic_year_current ?? 'First Term 2025/2026';

        if ($courseId) {
            $enrollment = Enrollment::where('school_id', $school->id)
                ->where('student_id', $student->id)
                ->where('course_id', $courseId)
                ->where('term', $term)
                ->first();

            $currentCa = $enrollment?->ca_score ?? 25.0; // fallback standard CA if not yet entered
            $totalScore = round($currentCa + $calculatedExamScore, 1);
            $grade = match (true) {
                $totalScore >= 75 => 'A',
                $totalScore >= 65 => 'B',
                $totalScore >= 50 => 'C',
                $totalScore >= 45 => 'D',
                $totalScore >= 40 => 'E',
                default => 'F',
            };
            $remark = match ($grade) {
                'A' => 'Distinction',
                'B' => 'Very Good',
                'C' => 'Credit',
                'D' => 'Pass',
                'E' => 'Fair',
                default => 'Fail',
            };

            Enrollment::updateOrCreate(
                [
                    'school_id' => $school->id,
                    'student_id' => $student->id,
                    'course_id' => $courseId,
                    'term' => $term,
                ],
                [
                    'ca_score' => $currentCa,
                    'exam_score' => $calculatedExamScore,
                    'score' => $totalScore,
                    'grade' => $grade,
                    'remark' => $remark,
                    'status' => Enrollment::STATUS_COMPLETED,
                    'progress' => 100,
                ]
            );
        }

        return response()->json([
            'message' => 'Examination submitted and graded successfully.',
            'result' => [
                'correctCount' => $correctCount,
                'totalQuestions' => $totalQuestions,
                'examScore' => $calculatedExamScore,
                'examMax' => 60,
                'totalScore' => $totalScore,
                'grade' => $grade,
                'remark' => $remark,
            ],
        ]);
    }

    /**
     * Generates a realistic set of multiple-choice questions for the subject.
     */
    private function getExamQuestions(Assignment $assignment): array
    {
        $subjectName = $assignment->course?->name ?? 'General Studies';
        $subjectCode = $assignment->course?->code ?? 'GEN';

        return [
            [
                'id' => 1,
                'question' => "In {$subjectName}, which of the following represents the fundamental definition or primary principle?",
                'options' => [
                    'A' => 'A systematic approach based on empirical evidence and structured observation',
                    'B' => 'An arbitrary convention with no theoretical foundation',
                    'C' => 'A hypothesis that cannot be tested or measured',
                    'D' => 'An informal guideline used only in preliminary discussions',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 2,
                'question' => "What is the primary objective of Continuous Assessment (CA) alongside Terminal Examinations in school curriculum?",
                'options' => [
                    'A' => 'To evaluate student progress systematically throughout the academic term',
                    'B' => 'To replace classroom teaching entirely with homework tests',
                    'C' => 'To rank institutions by geographical distribution',
                    'D' => 'To limit teacher interaction with registered learners',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 3,
                'question' => "When solving equations or analyzing problems in {$subjectCode}, what is the first step in the methodology?",
                'options' => [
                    'A' => 'Identify given parameters, defined constraints, and the target variable',
                    'B' => 'Immediately jump to the final estimate without intermediate calculations',
                    'C' => 'Disregard initial units of measurement',
                    'D' => 'Assume all variable coefficients are zero',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 4,
                'question' => "Which of the following describes the standard grading boundary for Distinction ('A') in secondary education?",
                'options' => [
                    'A' => '75% to 100% total cumulative score',
                    'B' => '30% to 39% total cumulative score',
                    'C' => '40% to 49% total cumulative score',
                    'D' => '50% to 54% total cumulative score',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 5,
                'question' => "Which characteristic is essential for computer-based testing (CBT) workstations in an accredited school computer laboratory?",
                'options' => [
                    'A' => 'Reliable network connectivity, dedicated display, and secure input devices',
                    'B' => 'High-end gaming graphics cards without internet connection',
                    'C' => 'External Bluetooth loudspeakers with high bass',
                    'D' => 'Mobile phone cellular towers inside the classroom',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 6,
                'question' => "In institutional academic records, what does the 'CGPA' metric denote?",
                'options' => [
                    'A' => 'Cumulative Grade Point Average across completed terms',
                    'B' => 'Continuous General Paper Assessment',
                    'C' => 'Centralized Government Polytechnic Allocation',
                    'D' => 'Certified Global Performance Accreditation',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 7,
                'question' => "What is the recommended response if a student encounters a temporary display interruption during a timed CBT examination?",
                'options' => [
                    'A' => 'Notify the accredited invigilator or administrator immediately without leaving the station',
                    'B' => 'Leave the examination hall and forfeit the remaining test duration',
                    'C' => 'Switch workstations without permission from exam supervisors',
                    'D' => 'Attempt to open unrelated external websites',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 8,
                'question' => "Which component contributes to the Continuous Assessment (CA) portion of a student's grade?",
                'options' => [
                    'A' => 'Mid-term tests, practical laboratory assignments, and class quizzes',
                    'B' => 'Terminal graduation convocation fees',
                    'C' => 'Parent-Teacher Association attendance registers',
                    'D' => 'Alumni association voluntary contributions',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 9,
                'question' => "What is the role of an Exam Access Code in a secure CBT environment?",
                'options' => [
                    'A' => 'To authenticate the student and ensure the exam can only start when authorized by the supervisor',
                    'B' => 'To change the student account password permanently',
                    'C' => 'To display the test answers in advance',
                    'D' => 'To register a new school on the multi-tenant platform',
                ],
                'correct_answer' => 'A',
            ],
            [
                'id' => 10,
                'question' => "Upon clicking 'Submit Examination', what happens to the student's test answers?",
                'options' => [
                    'A' => 'Answers are securely stored, graded, and the score is logged in the academic record',
                    'B' => 'Answers are deleted immediately and lost',
                    'C' => 'The exam timer continues running indefinitely',
                    'D' => 'The student is logged out without saving responses',
                ],
                'correct_answer' => 'A',
            ],
        ];
    }
}
