<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * GROUP 3: Admin Module - Class Results Upload & CA/Exam Assessment.
 *
 * Allows school administrators to enter or batch-upload Continuous Assessment (CA / Test)
 * and Examination results for all registered students in a class.
 * Automatically computes total score, letter grade (A-F), and remarks, which immediately
 * reflect in the student's dashboard.
 */
class ClassResultController extends Controller
{
    /**
     * Lists registered students in a class alongside their CA, Exam, Total, Grade, and Remark.
     */
    public function index(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $school = $request->user()->school;

        $subjects = $schoolClass->subjects()->get(['courses.id', 'courses.code', 'courses.name']);
        
        // If the class has no specific assigned subjects, fallback to all school courses
        if ($subjects->isEmpty()) {
            $subjects = Course::where('school_id', $school->id)->get(['id', 'code', 'name']);
        }

        $courseId = $request->query('course_id');
        if (! $courseId && $subjects->isNotEmpty()) {
            $courseId = $subjects->first()->id;
        }

        $term = $request->query('term', $school->academic_year_current ?? 'First Term 2025/2026');

        // Fetch registered students in this class
        $students = $schoolClass->students()
            ->with('user')
            ->get()
            ->map(function (Student $sp) {
                return [
                    'student_id' => $sp->user_id,
                    'student_profile_id' => $sp->id,
                    'name' => $sp->user?->name ?? 'Unknown Student',
                    'email' => $sp->user?->email ?? '',
                    'student_id_number' => $sp->student_id_number,
                    'grade_level' => $sp->grade_level,
                ];
            });

        // If no students in class pivot yet, also check any users in the school who have role student
        // or whose studentProfile matches class grade level
        if ($students->isEmpty()) {
            $fallbackStudents = User::where('school_id', $school->id)
                ->where('role', User::ROLE_STUDENT)
                ->with('studentProfile')
                ->take(30)
                ->get()
                ->map(function (User $u) {
                    return [
                        'student_id' => $u->id,
                        'student_profile_id' => $u->studentProfile?->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'student_id_number' => $u->studentProfile?->student_id_number ?? ('LC-STD-' . str_pad($u->id, 4, '0', STR_PAD_LEFT)),
                        'grade_level' => $u->studentProfile?->grade_level ?? 'Secondary',
                    ];
                });
            $students = $fallbackStudents;
        }

        $studentIds = $students->pluck('student_id')->filter()->values();

        // Fetch existing enrollment results for this course and term
        $enrollments = collect();
        if ($courseId && $studentIds->isNotEmpty()) {
            $enrollments = Enrollment::where('school_id', $school->id)
                ->where('course_id', $courseId)
                ->where('term', $term)
                ->whereIn('student_id', $studentIds)
                ->get()
                ->keyBy('student_id');
        }

        $results = $students->map(function ($s) use ($enrollments) {
            $enrollment = $enrollments->get($s['student_id']);

            return [
                'student_id' => $s['student_id'],
                'student_profile_id' => $s['student_profile_id'],
                'name' => $s['name'],
                'email' => $s['email'],
                'student_id_number' => $s['student_id_number'],
                'grade_level' => $s['grade_level'],
                'ca_score' => $enrollment?->ca_score !== null ? (float) $enrollment->ca_score : null,
                'exam_score' => $enrollment?->exam_score !== null ? (float) $enrollment->exam_score : null,
                'total_score' => $enrollment?->score !== null ? (float) $enrollment->score : null,
                'grade' => $enrollment?->grade,
                'remark' => $enrollment?->remark,
                'updated_at' => $enrollment?->updated_at?->toIso8601String(),
            ];
        });

        $selectedCourse = $courseId ? Course::with('teacher:id,name')->find($courseId) : null;
        $subjectTeacherName = null;
        if ($courseId) {
            $pivotSubject = $schoolClass->subjects()->where('courses.id', $courseId)->first();
            $pivotTeacherId = $pivotSubject?->pivot?->teacher_id;
            if ($pivotTeacherId) {
                $subjectTeacherName = User::where('id', $pivotTeacherId)->value('name');
            } elseif ($selectedCourse?->teacher) {
                $subjectTeacherName = $selectedCourse->teacher->name;
            }
        }

        $gradedCount = $results->filter(fn ($r) => $r['total_score'] !== null)->count();
        $totalStudents = $results->count();
        $completionStatus = $totalStudents === 0 ? 'empty' : ($gradedCount === $totalStudents ? 'completed' : ($gradedCount > 0 ? 'in_progress' : 'pending'));

        return response()->json([
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'code' => $schoolClass->code,
                'room' => $schoolClass->room,
                'form_master' => $schoolClass->teacher?->name ?? 'Unassigned',
            ],
            'subjects' => $subjects,
            'selected_course_id' => $courseId ? (int) $courseId : null,
            'term' => $term,
            'meta' => [
                'form_master' => $schoolClass->teacher?->name ?? 'Unassigned',
                'subject_teacher' => $subjectTeacherName ?? 'Unassigned',
                'total_students' => $totalStudents,
                'graded_count' => $gradedCount,
                'pending_count' => $totalStudents - $gradedCount,
                'completion_status' => $completionStatus,
                'last_updated_at' => $enrollments->max('updated_at')?->toIso8601String(),
            ],
            'students' => $results->values(),
        ]);
    }

    /**
     * Batch stores/updates results for a class.
     */
    public function store(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $school = $request->user()->school;

        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'term' => ['required', 'string', 'max:50'],
            'results' => ['required', 'array'],
            'results.*.student_id' => ['required', 'integer', 'exists:users,id'],
            'results.*.ca_score' => ['nullable', 'numeric', 'min:0', 'max:40'],
            'results.*.exam_score' => ['nullable', 'numeric', 'min:0', 'max:70'],
            'results.*.remark' => ['nullable', 'string', 'max:60'],
        ]);

        $course = Course::where('school_id', $school->id)->findOrFail($validated['course_id']);
        $savedCount = 0;

        DB::transaction(function () use ($school, $schoolClass, $course, $validated, &$savedCount) {
            foreach ($validated['results'] as $item) {
                $hasCa = isset($item['ca_score']) && $item['ca_score'] !== '' && $item['ca_score'] !== null;
                $hasExam = isset($item['exam_score']) && $item['exam_score'] !== '' && $item['exam_score'] !== null;

                if (! $hasCa && ! $hasExam) {
                    continue;
                }

                $ca = $hasCa ? round((float) $item['ca_score'], 2) : 0.0;
                $exam = $hasExam ? round((float) $item['exam_score'], 2) : 0.0;
                $total = round($ca + $exam, 2);

                $grade = $this->calculateGrade($total);
                $remark = !empty($item['remark']) ? $item['remark'] : $this->defaultRemark($grade);

                Enrollment::updateOrCreate(
                    [
                        'school_id' => $school->id,
                        'student_id' => $item['student_id'],
                        'course_id' => $course->id,
                        'term' => $validated['term'],
                    ],
                    [
                        'school_class_id' => $schoolClass->id,
                        'ca_score' => $ca,
                        'exam_score' => $exam,
                        'score' => $total,
                        'grade' => $grade,
                        'remark' => $remark,
                        'status' => Enrollment::STATUS_COMPLETED,
                        'progress' => 100,
                    ]
                );

                $savedCount++;
            }
        });

        return response()->json([
            'message' => sprintf('Successfully recorded and published results for %d students in %s.', $savedCount, $course->name),
            'saved_count' => $savedCount,
        ]);
    }

    /**
     * Bulk uploads results via CSV for a class.
     */
    public function uploadCsv(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $school = $request->user()->school;

        $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'term' => ['required', 'string', 'max:50'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $course = Course::where('school_id', $school->id)->findOrFail($request->integer('course_id'));
        $term = $request->string('term')->toString();

        $path = $request->file('file')->getRealPath();
        $fileHandle = fopen($path, 'r');
        if (! $fileHandle) {
            return response()->json(['message' => 'Unable to read the uploaded CSV file.'], 422);
        }

        $header = fgetcsv($fileHandle);
        if (! $header) {
            fclose($fileHandle);
            return response()->json(['message' => 'CSV file is empty.'], 422);
        }

        $normalizedHeader = array_map(fn ($h) => strtolower(trim($h)), $header);
        $idIdx = array_search('student_id_number', $normalizedHeader);
        if ($idIdx === false) {
            $idIdx = array_search('id_number', $normalizedHeader);
        }
        if ($idIdx === false) {
            $idIdx = array_search('student_id', $normalizedHeader);
        }
        $emailIdx = array_search('email', $normalizedHeader);
        $caIdx = array_search('ca_score', $normalizedHeader);
        if ($caIdx === false) {
            $caIdx = array_search('ca', $normalizedHeader);
        }
        $examIdx = array_search('exam_score', $normalizedHeader);
        if ($examIdx === false) {
            $examIdx = array_search('exam', $normalizedHeader);
        }
        $remarkIdx = array_search('remark', $normalizedHeader);

        $savedCount = 0;
        $errors = [];
        $rowNum = 1;

        while (($row = fgetcsv($fileHandle)) !== false) {
            $rowNum++;
            if (empty(array_filter($row))) {
                continue;
            }

            $idNumber = $idIdx !== false && isset($row[$idIdx]) ? trim($row[$idIdx]) : null;
            $email = $emailIdx !== false && isset($row[$emailIdx]) ? trim($row[$emailIdx]) : null;

            $user = null;
            if ($idNumber) {
                $studentProfile = Student::where('student_id_number', $idNumber)->first();
                if ($studentProfile) {
                    $user = User::where('id', $studentProfile->user_id)->where('school_id', $school->id)->first();
                }
                if (! $user && is_numeric($idNumber)) {
                    $user = User::where('id', (int) $idNumber)->where('school_id', $school->id)->first();
                }
            }
            if (! $user && $email) {
                $user = User::where('email', strtolower($email))->where('school_id', $school->id)->first();
            }

            if (! $user) {
                $errors[] = "Row {$rowNum}: Student not found (" . ($idNumber ?? $email ?? 'unspecified') . ")";
                continue;
            }

            $caVal = $caIdx !== false && isset($row[$caIdx]) && is_numeric(trim($row[$caIdx])) ? (float) trim($row[$caIdx]) : 0.0;
            $examVal = $examIdx !== false && isset($row[$examIdx]) && is_numeric(trim($row[$examIdx])) ? (float) trim($row[$examIdx]) : 0.0;
            $remarkVal = $remarkIdx !== false && isset($row[$remarkIdx]) ? trim($row[$remarkIdx]) : null;

            $total = round($caVal + $examVal, 2);
            $grade = $this->calculateGrade($total);
            $finalRemark = !empty($remarkVal) ? $remarkVal : $this->defaultRemark($grade);

            Enrollment::updateOrCreate(
                [
                    'school_id' => $school->id,
                    'student_id' => $user->id,
                    'course_id' => $course->id,
                    'term' => $term,
                ],
                [
                    'school_class_id' => $schoolClass->id,
                    'ca_score' => $caVal,
                    'exam_score' => $examVal,
                    'score' => $total,
                    'grade' => $grade,
                    'remark' => $finalRemark,
                    'status' => Enrollment::STATUS_COMPLETED,
                    'progress' => 100,
                ]
            );

            $savedCount++;
        }

        fclose($fileHandle);

        return response()->json([
            'message' => sprintf('CSV upload processed: %d results saved for %s.', $savedCount, $course->name),
            'saved_count' => $savedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Generates a pre-filled CSV template for entering student marks in this class.
     */
    public function csvTemplate(Request $request, SchoolClass $schoolClass): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $school = $request->user()->school;

        $students = $schoolClass->students()
            ->with('user')
            ->get()
            ->map(function (Student $sp) {
                return [
                    'student_id' => $sp->user_id,
                    'name' => $sp->user?->name ?? 'Unknown Student',
                    'email' => $sp->user?->email ?? '',
                    'student_id_number' => $sp->student_id_number,
                ];
            });

        if ($students->isEmpty()) {
            $students = User::where('school_id', $school->id)
                ->where('role', User::ROLE_STUDENT)
                ->with('studentProfile')
                ->take(30)
                ->get()
                ->map(function (User $u) {
                    return [
                        'student_id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'student_id_number' => $u->studentProfile?->student_id_number ?? ('LC-STD-' . str_pad($u->id, 4, '0', STR_PAD_LEFT)),
                    ];
                });
        }

        $courseId = $request->query('course_id');
        $course = $courseId ? Course::where('school_id', $school->id)->find($courseId) : null;
        $term = $request->query('term', $school->academic_year_current ?? 'First Term 2025/2026');

        $fileName = sprintf(
            '%s_%s_%s_Results_Template.csv',
            preg_replace('/[^a-zA-Z0-9_-]/', '_', $schoolClass->name),
            $course ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $course->code) : 'Subject',
            preg_replace('/[^a-zA-Z0-9_-]/', '_', $term)
        );

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($students) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['student_id_number', 'student_name', 'email', 'ca_score', 'exam_score', 'remark']);

            foreach ($students as $student) {
                fputcsv($handle, [
                    $student['student_id_number'],
                    $student['name'],
                    $student['email'],
                    '',
                    '',
                    '',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Downloads/exports the complete results broadsheet for a class and subject as PDF or CSV.
     */
    public function export(Request $request, SchoolClass $schoolClass): \Symfony\Component\HttpFoundation\Response
    {
        $school = $request->user()->school;
        $courseId = $request->query('course_id');
        $course = $courseId ? Course::where('school_id', $school->id)->findOrFail($courseId) : null;
        $term = $request->query('term', $school->academic_year_current ?? 'First Term 2025/2026');
        $format = strtolower($request->query('format', 'csv')); // Admin default csv, supports pdf

        $students = $schoolClass->students()->with('user')->get();
        if ($students->isEmpty()) {
            $students = User::where('school_id', $school->id)
                ->where('role', User::ROLE_STUDENT)
                ->with('studentProfile')
                ->take(30)
                ->get()
                ->map(function (User $u) {
                    $obj = new \stdClass();
                    $obj->user_id = $u->id;
                    $obj->student_id_number = $u->studentProfile?->student_id_number ?? ('LC-STD-' . str_pad($u->id, 4, '0', STR_PAD_LEFT));
                    $obj->user = $u;
                    return $obj;
                });
        }

        $studentIds = collect($students)->pluck('user_id')->filter()->values();

        $enrollments = collect();
        if ($course && $studentIds->isNotEmpty()) {
            $enrollments = Enrollment::where('school_id', $school->id)
                ->where('course_id', $course->id)
                ->where('term', $term)
                ->whereIn('student_id', $studentIds)
                ->get()
                ->keyBy('student_id');
        }

        if ($format === 'pdf') {
            $pdfService = new \App\Services\Pdf\ResultPdfService();
            $pdfData = $pdfService->generateBroadsheetPdf(
                $schoolClass,
                $course,
                $term,
                $students,
                $enrollments,
                $schoolClass->teacher?->name
            );

            $pdfFileName = sprintf(
                '%s_%s_%s_Results_Broadsheet.pdf',
                preg_replace('/[^a-zA-Z0-9_-]/', '_', $schoolClass->name),
                $course ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $course->code) : 'Subject',
                preg_replace('/[^a-zA-Z0-9_-]/', '_', $term)
            );

            return response($pdfData, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"{$pdfFileName}\"",
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            ]);
        }

        $fileName = sprintf(
            '%s_%s_%s_Results_Broadsheet.csv',
            preg_replace('/[^a-zA-Z0-9_-]/', '_', $schoolClass->name),
            $course ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $course->code) : 'Subject',
            preg_replace('/[^a-zA-Z0-9_-]/', '_', $term)
        );

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($students, $enrollments) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Student ID Number', 'Student Name', 'Email', 'CA Score (40)', 'Exam Score (70)', 'Total Score (100)', 'Grade', 'Remark']);

            foreach ($students as $sp) {
                $enrollment = $enrollments->get($sp->user_id);
                fputcsv($handle, [
                    $sp->student_id_number,
                    $sp->user?->name ?? 'Student',
                    $sp->user?->email ?? '',
                    $enrollment?->ca_score !== null ? $enrollment->ca_score : '—',
                    $enrollment?->exam_score !== null ? $enrollment->exam_score : '—',
                    $enrollment?->score !== null ? $enrollment->score : '—',
                    $enrollment?->grade ?? '—',
                    $enrollment?->remark ?? '—',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    private function calculateGrade(float $score): string
    {
        return match (true) {
            $score >= 75 => 'A',
            $score >= 65 => 'B',
            $score >= 50 => 'C',
            $score >= 45 => 'D',
            $score >= 40 => 'E',
            default => 'F',
        };
    }

    private function defaultRemark(string $grade): string
    {
        return match ($grade) {
            'A' => 'Distinction',
            'B' => 'Very Good',
            'C' => 'Credit',
            'D' => 'Pass',
            'E' => 'Fair',
            default => 'Fail',
        };
    }
}
