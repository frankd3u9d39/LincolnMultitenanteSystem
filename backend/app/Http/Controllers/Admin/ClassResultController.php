<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use App\Services\Pdf\ResultPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
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
                        'student_id_number' => $u->studentProfile?->student_id_number ?? ('LC-STD-'.str_pad((string) $u->id, 4, '0', STR_PAD_LEFT)),
                        'grade_level' => $u->studentProfile?->grade_level ?? 'Secondary',
                    ];
                });
            $students = $fallbackStudents;
        }

        $isAllSubjects = ($courseId === 'all' || $courseId === null || $courseId === '');

        $studentIds = $students->pluck('student_id')->filter()->values();

        // Automatically ensure students in this class are enrolled in all class subjects
        if ($subjects->isNotEmpty() && $studentIds->isNotEmpty()) {
            foreach ($studentIds as $sId) {
                foreach ($subjects as $sub) {
                    Enrollment::firstOrCreate(
                        [
                            'school_id' => $school->id,
                            'student_id' => $sId,
                            'course_id' => $sub->id,
                            'school_class_id' => $schoolClass->id,
                            'term' => $term,
                        ],
                        [
                            'status' => Enrollment::STATUS_IN_PROGRESS,
                            'progress' => 0,
                        ]
                    );
                }
            }
        }

        // Fetch existing enrollment results
        $enrollments = collect();
        if ($isAllSubjects) {
            $allEnrollments = Enrollment::where('school_id', $school->id)
                ->where('term', $term)
                ->whereIn('student_id', $studentIds)
                ->get()
                ->groupBy('student_id');

            $results = $students->map(function ($s) use ($allEnrollments, $subjects) {
                $userEnrollments = $allEnrollments->get($s['student_id'], collect());
                $graded = $userEnrollments->filter(fn ($e) => $e->score !== null);
                
                $avgCa1 = $graded->whereNotNull('ca1_score')->avg('ca1_score');
                $avgCa2 = $graded->whereNotNull('ca2_score')->avg('ca2_score');
                $avgCa = $graded->whereNotNull('ca_score')->avg('ca_score');
                $avgExam = $graded->whereNotNull('exam_score')->avg('exam_score');
                $avgTotal = $graded->avg('score');

                $roundedTotal = $avgTotal !== null ? round((float) $avgTotal, 1) : null;
                $grade = $roundedTotal !== null ? $this->calculateGrade($roundedTotal) : null;
                $remark = $grade !== null ? $this->defaultRemark($grade) : null;

                return [
                    'student_id' => $s['student_id'],
                    'student_profile_id' => $s['student_profile_id'],
                    'name' => $s['name'],
                    'email' => $s['email'],
                    'student_id_number' => $s['student_id_number'],
                    'grade_level' => $s['grade_level'],
                    'ca1_score' => $avgCa1 !== null ? round((float) $avgCa1, 1) : null,
                    'ca2_score' => $avgCa2 !== null ? round((float) $avgCa2, 1) : null,
                    'ca_score' => $avgCa !== null ? round((float) $avgCa, 1) : null,
                    'exam_score' => $avgExam !== null ? round((float) $avgExam, 1) : null,
                    'total_score' => $roundedTotal,
                    'grade' => $grade,
                    'remark' => $remark,
                    'subjects_count' => $userEnrollments->count(),
                    'graded_subjects_count' => $graded->count(),
                    'updated_at' => $userEnrollments->max('updated_at')?->toIso8601String(),
                ];
            });

            $subjectTeacherName = 'All Assigned Subject Teachers';
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
                'selected_course_id' => 'all',
                'term' => $term,
                'meta' => [
                    'form_master' => $schoolClass->teacher?->name ?? 'Unassigned',
                    'subject_teacher' => $subjectTeacherName,
                    'total_students' => $totalStudents,
                    'graded_count' => $gradedCount,
                    'pending_count' => $totalStudents - $gradedCount,
                    'completion_status' => $completionStatus,
                    'is_all_subjects' => true,
                    'last_updated_at' => (string) (Enrollment::where('school_id', $school->id)->where('term', $term)->whereIn('student_id', $studentIds)->max('updated_at') ?? ''),
                ],
                'students' => $results->values(),
            ]);
        }

        // Single specific subject
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
                'ca1_score' => $enrollment?->ca1_score !== null ? (float) $enrollment->ca1_score : null,
                'ca2_score' => $enrollment?->ca2_score !== null ? (float) $enrollment->ca2_score : null,
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
            'selected_course_id' => (int) $courseId,
            'term' => $term,
            'meta' => [
                'form_master' => $schoolClass->teacher?->name ?? 'Unassigned',
                'subject_teacher' => $subjectTeacherName ?? 'Unassigned',
                'total_students' => $totalStudents,
                'graded_count' => $gradedCount,
                'pending_count' => $totalStudents - $gradedCount,
                'completion_status' => $completionStatus,
                'is_all_subjects' => false,
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
                $remark = ! empty($item['remark']) ? $item['remark'] : $this->defaultRemark($grade);

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
                $errors[] = "Row {$rowNum}: Student not found (".($idNumber ?? $email ?? 'unspecified').')';

                continue;
            }

            $caVal = $caIdx !== false && isset($row[$caIdx]) && is_numeric(trim($row[$caIdx])) ? (float) trim($row[$caIdx]) : 0.0;
            $examVal = $examIdx !== false && isset($row[$examIdx]) && is_numeric(trim($row[$examIdx])) ? (float) trim($row[$examIdx]) : 0.0;
            $remarkVal = $remarkIdx !== false && isset($row[$remarkIdx]) ? trim($row[$remarkIdx]) : null;

            $total = round($caVal + $examVal, 2);
            $grade = $this->calculateGrade($total);
            $finalRemark = ! empty($remarkVal) ? $remarkVal : $this->defaultRemark($grade);

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
    public function csvTemplate(Request $request, SchoolClass $schoolClass): StreamedResponse
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
                        'student_id_number' => $u->studentProfile?->student_id_number ?? ('LC-STD-'.str_pad((string) $u->id, 4, '0', STR_PAD_LEFT)),
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
    public function export(Request $request, SchoolClass $schoolClass): Response
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
                    $obj = new \stdClass;
                    $obj->user_id = $u->id;
                    $obj->student_id_number = $u->studentProfile?->student_id_number ?? ('LC-STD-'.str_pad((string) $u->id, 4, '0', STR_PAD_LEFT));
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
            $pdfService = new ResultPdfService;
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

    /**
     * Downloads official Pupil's Performance Report PDF for a student.
     * Accessible exclusively by school Administrators.
     */
    public function downloadPupilPerformanceReportPdf(Request $request, int|string $student): Response
    {
        $school = $request->user()->school;

        $studentUser = User::where('school_id', $school->id)
            ->where(function ($q) use ($student) {
                $q->where('id', $student)
                    ->orWhereHas('studentProfile', function ($sq) use ($student) {
                        $sq->where('id', $student)->orWhere('student_id_number', $student);
                    });
            })
            ->firstOrFail();

        $term = $request->query('term', $school->academic_year_current ?? '2025/2026 (2nd Term)');

        $reportService = new \App\Services\Result\PupilPerformanceReportService;
        $reportData = $reportService->getReportData($studentUser, $term);

        $pdfService = new ResultPdfService;
        $pdfData = $pdfService->generatePupilPerformanceReportPdf($reportData);

        $pdfFileName = sprintf(
            '%s_%s_Performance_Report.pdf',
            preg_replace('/[^a-zA-Z0-9_-]/', '_', $studentUser->name),
            preg_replace('/[^a-zA-Z0-9_-]/', '_', $term)
        );

        return response($pdfData, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$pdfFileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
        ]);
    }

    /**
     * Downloads all student Pupil's Performance Reports for an entire class as a ZIP folder.
     * Accessible exclusively by school Administrators.
     */
    public function downloadClassPerformanceReportsZip(Request $request, SchoolClass $schoolClass): Response
    {
        $school = $request->user()->school;

        if ($schoolClass->school_id !== $school->id) {
            abort(403, 'Unauthorized class access.');
        }

        $term = $request->query('term', $school->academic_year_current ?? 'First Term 2025/2026');

        $students = $schoolClass->students()
            ->with('user')
            ->get();

        if ($students->isEmpty()) {
            abort(404, 'No students enrolled in this class to generate report cards for.');
        }

        $reportService = new \App\Services\Result\PupilPerformanceReportService;
        $pdfService = new ResultPdfService;

        $tempZipPath = tempnam(sys_get_temp_dir(), 'class_reports_');
        $zip = new \ZipArchive;

        if ($zip->open($tempZipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to create ZIP archive.');
        }

        foreach ($students as $studentProfile) {
            $studentUser = $studentProfile->user;
            if (! $studentUser) {
                continue;
            }

            try {
                $reportData = $reportService->getReportData($studentUser, $term);
                $pdfData = $pdfService->generatePupilPerformanceReportPdf($reportData);

                $admission = $studentProfile->student_id_number ?: $studentUser->id;
                $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $studentUser->name);
                $safeAdm = preg_replace('/[^a-zA-Z0-9_-]/', '_', (string) $admission);
                $filename = "{$safeAdm}_{$safeName}_Report_Card.pdf";

                $zip->addFromString($filename, $pdfData);
            } catch (\Throwable $e) {
                // Continue with other students if one fails
                continue;
            }
        }

        $zip->close();

        $zipContent = file_get_contents($tempZipPath);
        @unlink($tempZipPath);

        $safeClassName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $schoolClass->name);
        $safeTerm = preg_replace('/[^a-zA-Z0-9_-]/', '_', $term);
        $zipFileName = "{$safeClassName}_{$safeTerm}_Pupils_Reports.zip";

        return response($zipContent, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => "attachment; filename=\"{$zipFileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
        ]);
    }
}
