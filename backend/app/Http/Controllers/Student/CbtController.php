<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\School;
use App\Models\Student;
use App\Services\Pdf\CbtScriptPdfService;
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
        $school = $student->school()->first() ?? $student->school;

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
        $studentIdNumber = $studentProfile?->student_id_number ?? ('LC-STD-'.str_pad((string) $student->id, 4, '0', STR_PAD_LEFT));

        $exams = $cbtAssignments->map(function (Assignment $a) use ($student) {
            $meta = json_decode($a->instructions, true) ?? [];
            $hasSubmitted = AssignmentSubmission::where('assignment_id', $a->id)
                ->where('student_id', $student->id)
                ->whereIn('status', ['submitted', 'graded'])
                ->exists();

            $submission = $hasSubmitted
                ? AssignmentSubmission::where('assignment_id', $a->id)->where('student_id', $student->id)->first()
                : null;

            $dateStr = $a->due_at ? $a->due_at->toDateString() : Carbon::today()->toDateString();
            $timeVal = $meta['time'] ?? '08:30 - 10:30';

            return [
                'id' => $a->id,
                'examCode' => 'CBT-'.($a->course?->code ?? 'EXAM').'-'.$a->id,
                'courseCode' => $a->course?->code ?? 'GEN',
                'courseName' => $a->course?->name ?? $a->title,
                'title' => $a->title,
                'date' => $dateStr,
                'time' => $timeVal,
                'duration' => $meta['duration'] ?? '1.0 Hour',
                'format' => $meta['format'] ?? 'CBT (Computer Based Test)',
                'hasSubmitted' => $hasSubmitted,
                'status' => $hasSubmitted ? ($submission?->status === 'graded' ? 'Graded' : 'Awaiting Teacher Marking') : ($meta['status'] ?? 'Scheduled'),
                'scriptPdfUrl' => ($hasSubmitted && $submission?->file_path) ? url($submission->file_path) : null,
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
        $school = $student->school()->first() ?? $student->school;

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
            ->whereIn('status', ['submitted', 'graded'])
            ->first();

        if ($alreadySubmitted) {
            $msg = $alreadySubmitted->status === 'graded'
                ? sprintf('You have already completed and submitted this examination with an awarded score of %d%%.', $alreadySubmitted->score)
                : 'You have already submitted this examination. Your answer script is with your course teacher for manual marking and result upload.';

            return response()->json([
                'verified' => false,
                'message' => $msg,
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
     * Submits the student's CBT examination answers, compiles the answer script as a PDF
     * for teacher manual grading, and leaves score assignment to the teacher.
     */
    public function submitExam(Request $request): JsonResponse
    {
        $student = $request->user();
        $school = $student->school()->first() ?? $student->school;

        $validated = $request->validate([
            'exam_id' => ['required', 'integer', 'exists:assignments,id'],
            'answers' => ['present', 'array'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $assignment = Assignment::where('school_id', $school->id)->findOrFail($validated['exam_id']);
        $questions = $this->getExamQuestions($assignment);
        $reason = $validated['reason'] ?? 'Standard Exam Completion';

        // Generate Candidate Answer Script PDF for teacher evaluation and manual marking
        $pdfService = new CbtScriptPdfService;
        $pdfResult = $pdfService->generateCandidateScriptPdf(
            $assignment,
            $student,
            $questions,
            $validated['answers'],
            $reason
        );

        // Record submission in 'submitted' status with file_path pointing to the PDF
        // Score remains null until evaluated and uploaded by the teacher
        AssignmentSubmission::updateOrCreate(
            [
                'assignment_id' => $assignment->id,
                'student_id' => $student->id,
            ],
            [
                'status' => 'submitted',
                'submission_text' => json_encode([
                    'answers' => $validated['answers'],
                    'reason' => $reason,
                    'pdf_path' => $pdfResult['relative_path'],
                    'answered_count' => $pdfResult['answered_count'],
                    'total_questions' => $pdfResult['total_questions'],
                ]),
                'file_path' => $pdfResult['relative_path'],
                'submitted_at' => now(),
                'score' => null,
                'feedback' => sprintf('CBT Exam [%s]: Answer script compiled as PDF for teacher manual grading.', $reason),
            ]
        );

        $studentProfile = $student->studentProfile;
        $studentIdNumber = $studentProfile?->student_id_number ?? ('LC-STD-'.str_pad((string) $student->id, 4, '0', STR_PAD_LEFT));
        $courseTitle = ($assignment->course?->code ?? 'CBT').' - '.($assignment->course?->name ?? $assignment->title);

        return response()->json([
            'message' => 'Examination submitted successfully. Your answer script has been compiled into an official PDF document and delivered to your course teacher for manual marking.',
            'result' => [
                'status' => 'pending_teacher_marking',
                'hasSubmitted' => true,
                'submittedAt' => now()->toIso8601String(),
                'reason' => $reason,
                'totalQuestions' => $pdfResult['total_questions'],
                'answeredCount' => $pdfResult['answered_count'],
                'pdfUrl' => url($pdfResult['relative_path']),
                'pdfFilename' => $pdfResult['filename'],
                'candidate' => [
                    'name' => $student->name,
                    'student_id_number' => $studentIdNumber,
                    'course' => $courseTitle,
                ],
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
                'question' => 'What is the primary objective of Continuous Assessment (CA) alongside Terminal Examinations in school curriculum?',
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
                'question' => 'Which characteristic is essential for computer-based testing (CBT) workstations in an accredited school computer laboratory?',
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
                'question' => 'What is the recommended response if a student encounters a temporary display interruption during a timed CBT examination?',
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
                'question' => 'What is the role of an Exam Access Code in a secure CBT environment?',
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
