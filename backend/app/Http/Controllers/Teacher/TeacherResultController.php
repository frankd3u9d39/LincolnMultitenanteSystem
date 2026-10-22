<?php

namespace App\Http\Controllers\Teacher;

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
 * GROUP 2: Teacher Module - Class Assessment & Results Portal.
 *
 * Enables assigned teachers to view student rosters, record Continuous Assessment (CA / Test)
 * and Examination marks, upload CSV score sheets, and export class result broadsheets.
 */
class TeacherResultController extends Controller
{
    /**
     * Lists classes and subjects assigned to the authenticated teacher.
     */
    public function classes(Request $request): JsonResponse
    {
        $teacher = $request->user();
        $teacherId = $teacher->id;
        $schoolId = $teacher->school_id;

        // 1. Classes where teacher is Form Master
        $overseenClasses = SchoolClass::where('school_id', $schoolId)
            ->where('teacher_id', $teacherId)
            ->with(['subjects' => function ($q) {
                $q->select('courses.id', 'courses.code', 'courses.name', 'courses.department', 'courses.teacher_id')
                  ->with('teacher:id,name');
            }])
            ->withCount('students')
            ->get();

        // 2. Classes where teacher teaches a Subject
        $subjectClasses = SchoolClass::where('school_id', $schoolId)
            ->whereHas('subjects', function ($q) use ($teacherId) {
                $q->where('courses.teacher_id', $teacherId)
                  ->orWhere('class_subject.teacher_id', $teacherId);
            })
            ->with(['subjects' => function ($q) {
                $q->select('courses.id', 'courses.code', 'courses.name', 'courses.department', 'courses.teacher_id')
                  ->with('teacher:id,name');
            }])
            ->withCount('students')
            ->get();

        $mergedClasses = $overseenClasses->merge($subjectClasses)->unique('id');

        // Fallback: if no specific assignments yet, fetch classes in the school
        if ($mergedClasses->isEmpty()) {
            $mergedClasses = SchoolClass::where('school_id', $schoolId)
                ->with(['subjects' => function ($q) {
                    $q->select('courses.id', 'courses.code', 'courses.name', 'courses.department', 'courses.teacher_id')
                      ->with('teacher:id,name');
                }])
                ->withCount('students')
                ->get();
        }

        $formatted = $mergedClasses->map(function (SchoolClass $c) use ($teacherId) {
            $isFormMaster = ($c->teacher_id === $teacherId);

            // Filter subjects: if form master, they can oversee all subjects; otherwise only their subjects
            $assignedSubjects = $c->subjects->map(function ($s) use ($teacherId, $isFormMaster) {
                $pivotTeacherId = $s->pivot?->teacher_id;
                $isMySubject = ($s->teacher_id === $teacherId) || ($pivotTeacherId === $teacherId);

                return [
                    'id' => $s->id,
                    'code' => $s->code,
                    'name' => $s->name,
                    'department' => $s->department,
                    'teacher_name' => $s->teacher?->name ?? 'Unassigned',
                    'is_my_subject' => $isMySubject,
                    'can_grade' => $isFormMaster || $isMySubject,
                ];
            });

            return [
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'room' => $c->room,
                'is_form_master' => $isFormMaster,
                'students_count' => $c->students_count,
                'subjects' => $assignedSubjects->values(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted->values(),
        ]);
    }

    /**
     * Lists registered students in a class alongside CA, Exam, Total, Grade, and Remark.
     */
    public function index(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $teacher = $request->user();
        $this->authorizeTeacherForClass($teacher, $schoolClass);

        $school = $teacher->school;
        $subjects = $schoolClass->subjects()->get(['courses.id', 'courses.code', 'courses.name', 'courses.teacher_id']);

        if ($subjects->isEmpty()) {
            $subjects = Course::where('school_id', $school->id)->get(['id', 'code', 'name', 'teacher_id']);
        }

        $courseId = $request->query('course_id');
        if (! $courseId && $subjects->isNotEmpty()) {
            // Prefer a subject taught by this teacher
            $mySubject = $subjects->first(fn ($s) => $s->teacher_id === $teacher->id || ($s->pivot?->teacher_id ?? null) === $teacher->id);
            $courseId = $mySubject ? $mySubject->id : $subjects->first()->id;
        }

        $term = $request->query('term', $school->academic_year_current ?? 'First Term 2025/2026');

        // Fetch students in this class
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

        // Fallback for school students if class pivot is empty
        if ($students->isEmpty()) {
            $students = User::where('school_id', $school->id)
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
        }

        $studentIds = $students->pluck('student_id')->filter()->values();

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

        $isFormMaster = ($schoolClass->teacher_id === $teacher->id);

        return response()->json([
            'status' => 'success',
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'code' => $schoolClass->code,
                'room' => $schoolClass->room,
                'is_form_master' => $isFormMaster,
            ],
            'subjects' => $subjects,
            'selected_course_id' => $courseId ? (int) $courseId : null,
            'term' => $term,
            'students' => $results->values(),
        ]);
    }

    /**
     * Stores/updates Test (CA) and Examination scores submitted by the teacher.
     */
    public function store(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $teacher = $request->user();
        $this->authorizeTeacherForClass($teacher, $schoolClass);

        $school = $teacher->school;

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
            'status' => 'success',
            'message' => sprintf('Successfully recorded and published scores for %d students in %s.', $savedCount, $course->name),
            'saved_count' => $savedCount,
        ]);
    }

    /**
     * Uploads class results via CSV or Excel (.xlsx) file by the teacher.
     * Supports Continuous Assessment (Test/CA), Terminal Examination, or Combined score sheets.
     */
    public function uploadCsv(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $teacher = $request->user();
        $this->authorizeTeacherForClass($teacher, $schoolClass);

        $school = $teacher->school;

        $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'term' => ['required', 'string', 'max:50'],
            'file' => ['required', 'file', 'max:5120'],
            'upload_type' => ['nullable', 'string', 'in:combined,ca,exam,auto'],
        ]);

        $course = Course::where('school_id', $school->id)->findOrFail($request->integer('course_id'));
        $term = $request->string('term')->toString();
        $uploadFile = $request->file('file');

        $ext = strtolower($uploadFile->getClientOriginalExtension());
        if (! in_array($ext, ['csv', 'txt', 'tsv', 'xlsx'])) {
            return response()->json(['message' => 'Supported file formats are CSV (.csv), TSV (.tsv), text (.txt), and Excel (.xlsx).'], 422);
        }

        $rows = $this->parseFileRows($uploadFile->getRealPath(), $ext);
        if (empty($rows)) {
            return response()->json(['message' => 'The uploaded file is empty or could not be parsed.'], 422);
        }

        $header = array_shift($rows);
        if (! $header || empty(array_filter($header))) {
            return response()->json(['message' => 'File header row is missing or empty.'], 422);
        }

        $normalizedHeader = array_map(function ($h) {
            $cleaned = strtolower(trim((string) $h));
            return preg_replace('/[^a-z0-9_]/', '', str_replace([' ', '-', '.'], '_', $cleaned));
        }, $header);

        $idAliases = ['student_id_number', 'id_number', 'student_id', 'reg_no', 'matric_no', 'admission_no', 'student_number', 'id', 'user_id'];
        $emailAliases = ['email', 'student_email', 'mail'];
        $caAliases = ['ca_score', 'ca', 'test', 'test_score', 'continuous_assessment', 'ca_mark', 'test_mark', 'midterm', 'mid_term', 'assessment', 'test_1', 'ca_1', 'test_score_ca_40'];
        $examAliases = ['exam_score', 'exam', 'exams', 'examination', 'final_exam', 'finals', 'exam_mark', 'terminal_exam', 'exam_score_70'];
        $remarkAliases = ['remark', 'remarks', 'comment', 'comments', 'teacher_remark', 'teacher_comment'];

        $idIdx = $this->findHeaderIndex($normalizedHeader, $idAliases);
        $emailIdx = $this->findHeaderIndex($normalizedHeader, $emailAliases);
        $caIdx = $this->findHeaderIndex($normalizedHeader, $caAliases);
        $examIdx = $this->findHeaderIndex($normalizedHeader, $examAliases);
        $remarkIdx = $this->findHeaderIndex($normalizedHeader, $remarkAliases);

        if ($idIdx === false && $emailIdx === false) {
            return response()->json([
                'message' => 'Could not detect a student identifier column. File header must contain "student_id_number" or "email".',
            ], 422);
        }

        if ($caIdx === false && $examIdx === false) {
            return response()->json([
                'message' => 'Could not detect score columns. File must contain at least "ca_score" (or "test") or "exam_score" (or "exam").',
            ], 422);
        }

        $savedCount = 0;
        $errors = [];
        $rowNum = 1;

        foreach ($rows as $row) {
            $rowNum++;
            if (empty(array_filter($row, fn ($v) => trim((string) $v) !== ''))) {
                continue;
            }

            $idNumber = ($idIdx !== false && isset($row[$idIdx])) ? trim((string) $row[$idIdx]) : null;
            $email = ($emailIdx !== false && isset($row[$emailIdx])) ? trim((string) $row[$emailIdx]) : null;
            $caRaw = ($caIdx !== false && isset($row[$caIdx])) ? trim((string) $row[$caIdx]) : null;
            $examRaw = ($examIdx !== false && isset($row[$examIdx])) ? trim((string) $row[$examIdx]) : null;
            $remark = ($remarkIdx !== false && isset($row[$remarkIdx])) ? trim((string) $row[$remarkIdx]) : null;

            if (! $idNumber && ! $email) {
                $errors[] = "Row {$rowNum}: Missing student ID number or email.";
                continue;
            }

            $user = null;
            if ($idNumber) {
                $studentProfile = Student::where('student_id_number', $idNumber)->first();
                if ($studentProfile) {
                    $user = User::where('id', $studentProfile->user_id)->where('school_id', $school->id)->first();
                }
            }
            if (! $user && $email) {
                $user = User::where('email', $email)->where('school_id', $school->id)->first();
            }

            if (! $user) {
                $errors[] = "Row {$rowNum}: No student found for ID '{$idNumber}' or Email '{$email}'.";
                continue;
            }

            $hasCa = ($caRaw !== null && $caRaw !== '' && is_numeric($caRaw));
            $hasExam = ($examRaw !== null && $examRaw !== '' && is_numeric($examRaw));

            if (! $hasCa && ! $hasExam) {
                continue;
            }

            // Retrieve existing enrollment to preserve untouched component (e.g. keeping CA when uploading Exam)
            $existing = Enrollment::where('school_id', $school->id)
                ->where('student_id', $user->id)
                ->where('course_id', $course->id)
                ->where('term', $term)
                ->first();

            $caVal = $hasCa ? round((float) $caRaw, 2) : ($existing?->ca_score !== null ? (float) $existing->ca_score : null);
            $examVal = $hasExam ? round((float) $examRaw, 2) : ($existing?->exam_score !== null ? (float) $existing->exam_score : null);

            if ($caVal !== null && ($caVal < 0 || $caVal > 40)) {
                $errors[] = "Row {$rowNum} ({$user->name}): CA Score must be between 0 and 40 (got {$caVal}).";
                continue;
            }
            if ($examVal !== null && ($examVal < 0 || $examVal > 70)) {
                $errors[] = "Row {$rowNum} ({$user->name}): Exam Score must be between 0 and 70 (got {$examVal}).";
                continue;
            }

            $bothPresent = ($caVal !== null && $examVal !== null);
            $total = $bothPresent
                ? round($caVal + $examVal, 2)
                : ($caVal !== null ? round($caVal, 2) : round($examVal ?? 0, 2));

            $grade = $bothPresent ? $this->calculateGrade($total) : ($examVal !== null ? $this->calculateGrade($total) : 'IP');
            $status = ($bothPresent || $examVal !== null) ? Enrollment::STATUS_COMPLETED : Enrollment::STATUS_IN_PROGRESS;
            $progress = $status === Enrollment::STATUS_COMPLETED ? 100 : 50;

            $computedRemark = ! empty($remark)
                ? $remark
                : ($bothPresent ? $this->defaultRemark($grade) : ($hasCa ? 'Continuous Assessment Recorded' : 'Exam Recorded'));

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
                    'remark' => $computedRemark,
                    'status' => $status,
                    'progress' => $progress,
                ]
            );

            $savedCount++;
        }

        $typeLabel = ($caIdx !== false && $examIdx !== false) ? 'Continuous Assessment (Test) & Examination' : ($caIdx !== false ? 'Continuous Assessment (Test)' : 'Examination');

        return response()->json([
            'status' => 'success',
            'message' => sprintf('Uploaded %s results file successfully processed: %d student records published for %s.', $typeLabel, $savedCount, $course->name),
            'saved_count' => $savedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Downloads pre-filled roster template for offline marking.
     * Supports PDF format (default) and CSV format, for 'combined', 'ca', or 'exam'.
     */
    public function csvTemplate(Request $request, SchoolClass $schoolClass): \Symfony\Component\HttpFoundation\Response
    {
        $teacher = $request->user();
        $this->authorizeTeacherForClass($teacher, $schoolClass);

        $school = $teacher->school;
        $courseId = $request->query('course_id');
        $course = $courseId ? Course::where('school_id', $school->id)->find($courseId) : null;
        $term = $request->query('term', $school->academic_year_current ?? 'First Term 2025/2026');
        $type = $request->query('type', 'combined'); // 'combined', 'ca', 'exam'
        $format = strtolower($request->query('format', 'pdf')); // 'pdf' or 'csv'

        $students = $schoolClass->students()->with('user')->get()->map(function (Student $sp) {
            return [
                'student_id' => $sp->user_id,
                'student_id_number' => $sp->student_id_number,
                'name' => $sp->user?->name ?? 'Student',
                'email' => $sp->user?->email ?? '',
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
                        'student_id_number' => $u->studentProfile?->student_id_number ?? ('LC-STD-' . str_pad($u->id, 4, '0', STR_PAD_LEFT)),
                        'name' => $u->name,
                        'email' => $u->email,
                    ];
                });
        }

        $typePrefix = match ($type) {
            'ca' => 'CA_Test',
            'exam' => 'Exam',
            default => 'Results',
        };

        // PDF Generation
        if ($format === 'pdf') {
            $pdfService = new \App\Services\Pdf\ResultPdfService();
            $pdfData = $pdfService->generateTemplatePdf(
                $schoolClass,
                $course,
                $term,
                $type,
                $students,
                $teacher->name
            );

            $pdfFileName = sprintf(
                '%s_%s_%s_%s_Template.pdf',
                preg_replace('/[^a-zA-Z0-9_-]/', '_', $schoolClass->name),
                $course ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $course->code) : 'Subject',
                $typePrefix,
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
            '%s_%s_%s_%s_Template.csv',
            preg_replace('/[^a-zA-Z0-9_-]/', '_', $schoolClass->name),
            $course ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $course->code) : 'Subject',
            $typePrefix,
            preg_replace('/[^a-zA-Z0-9_-]/', '_', $term)
        );

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($students, $type) {
            $handle = fopen('php://output', 'w');

            if ($type === 'ca') {
                fputcsv($handle, ['student_id_number', 'student_name', 'email', 'ca_score', 'remark']);
                foreach ($students as $student) {
                    fputcsv($handle, [$student['student_id_number'], $student['name'], $student['email'], '', '']);
                }
            } elseif ($type === 'exam') {
                fputcsv($handle, ['student_id_number', 'student_name', 'email', 'exam_score', 'remark']);
                foreach ($students as $student) {
                    fputcsv($handle, [$student['student_id_number'], $student['name'], $student['email'], '', '']);
                }
            } else {
                fputcsv($handle, ['student_id_number', 'student_name', 'email', 'ca_score', 'exam_score', 'remark']);
                foreach ($students as $student) {
                    fputcsv($handle, [$student['student_id_number'], $student['name'], $student['email'], '', '', '']);
                }
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Helper to find matching header index across multiple aliases.
     */
    private function findHeaderIndex(array $headers, array $aliases): int|false
    {
        foreach ($aliases as $alias) {
            $idx = array_search($alias, $headers);
            if ($idx !== false) {
                return $idx;
            }
        }

        // Try fuzzy contains match
        foreach ($headers as $idx => $header) {
            foreach ($aliases as $alias) {
                if (str_contains($header, $alias)) {
                    return $idx;
                }
            }
        }

        return false;
    }

    /**
     * Parses rows from CSV, TSV, TXT, or Excel (.xlsx) file.
     */
    private function parseFileRows(string $path, string $extension): array
    {
        if ($extension === 'xlsx') {
            return $this->parseXlsxRows($path);
        }

        // CSV, TSV, or TXT
        $fileHandle = fopen($path, 'r');
        if (! $fileHandle) {
            return [];
        }

        // Auto-detect delimiter from first line
        $firstLine = fgets($fileHandle);
        rewind($fileHandle);

        $delimiter = ',';
        if ($firstLine) {
            if (substr_count($firstLine, "\t") > substr_count($firstLine, ',')) {
                $delimiter = "\t";
            } elseif (substr_count($firstLine, ';') > substr_count($firstLine, ',')) {
                $delimiter = ';';
            }
        }

        $rows = [];
        while (($row = fgetcsv($fileHandle, 0, $delimiter)) !== false) {
            $rows[] = $row;
        }
        fclose($fileHandle);

        return $rows;
    }

    /**
     * Lightweight native Excel (.xlsx) parser using ZipArchive and SimpleXML.
     */
    private function parseXlsxRows(string $path): array
    {
        if (! class_exists('ZipArchive')) {
            return [];
        }

        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return [];
        }

        // 1. Load shared strings
        $sharedStrings = [];
        $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedStringsXml) {
            $xml = simplexml_load_string($sharedStringsXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $parts = [];
                        foreach ($si->r as $r) {
                            $parts[] = (string) ($r->t ?? '');
                        }
                        $sharedStrings[] = implode('', $parts);
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // 2. Locate first worksheet XML
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if (! $sheetXml) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if (str_starts_with($name, 'xl/worksheets/sheet') && str_ends_with($name, '.xml')) {
                    $sheetXml = $zip->getFromName($name);
                    break;
                }
            }
        }

        $zip->close();

        if (! $sheetXml) {
            return [];
        }

        $xml = simplexml_load_string($sheetXml);
        if (! $xml || ! isset($xml->sheetData->row)) {
            return [];
        }

        $rows = [];
        foreach ($xml->sheetData->row as $r) {
            $rowCells = [];
            foreach ($r->c as $c) {
                $attr = $c->attributes();
                $cellRef = (string) ($attr['r'] ?? 'A1');
                preg_match('/([A-Z]+)(\d+)/', $cellRef, $matches);
                $colLetters = $matches[1] ?? 'A';

                $colIdx = 0;
                for ($ci = 0; $ci < strlen($colLetters); $ci++) {
                    $colIdx = $colIdx * 26 + (ord($colLetters[$ci]) - ord('A') + 1);
                }
                $colIdx -= 1; // 0-based

                $val = '';
                $type = (string) ($attr['t'] ?? '');
                if ($type === 's') {
                    $sIndex = (int) $c->v;
                    $val = $sharedStrings[$sIndex] ?? '';
                } elseif ($type === 'inlineStr' && isset($c->is->t)) {
                    $val = (string) $c->is->t;
                } elseif (isset($c->v)) {
                    $val = (string) $c->v;
                }

                $rowCells[$colIdx] = $val;
            }

            if (! empty($rowCells)) {
                $maxIdx = max(array_keys($rowCells));
                $denseRow = [];
                for ($k = 0; $k <= $maxIdx; $k++) {
                    $denseRow[$k] = $rowCells[$k] ?? '';
                }
                $rows[] = $denseRow;
            }
        }

        return $rows;
    }

    /**
     * Downloads/exports the current results as a PDF broadsheet or CSV broadsheet.
     */
    public function export(Request $request, SchoolClass $schoolClass): \Symfony\Component\HttpFoundation\Response
    {
        $teacher = $request->user();
        $this->authorizeTeacherForClass($teacher, $schoolClass);

        $school = $teacher->school;
        $courseId = $request->query('course_id');
        $course = $courseId ? Course::where('school_id', $school->id)->findOrFail($courseId) : null;
        $term = $request->query('term', $school->academic_year_current ?? 'First Term 2025/2026');
        $format = strtolower($request->query('format', 'pdf')); // 'pdf' or 'csv'

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
                $teacher->name
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
            '%s_%s_%s_Broadsheet.csv',
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

    private function authorizeTeacherForClass(User $teacher, SchoolClass $schoolClass): void
    {
        // 1. Teacher is Form Master of the class
        if ($schoolClass->teacher_id === $teacher->id) {
            return;
        }

        // 2. Teacher teaches a subject in this class
        $teachesSubject = $schoolClass->subjects()
            ->where(function ($q) use ($teacher) {
                $q->where('courses.teacher_id', $teacher->id)
                  ->orWhere('class_subject.teacher_id', $teacher->id);
            })->exists();

        if ($teachesSubject) {
            return;
        }

        // 3. Fallback: teacher in the same school if classes are not specifically assigned yet
        if ($schoolClass->school_id === $teacher->school_id) {
            return;
        }

        abort(403, 'You are not assigned to grade this class.');
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
