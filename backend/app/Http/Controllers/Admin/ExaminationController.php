<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - Institutional Examinations & Timetables.
 */
class ExaminationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $examAssignments = Assignment::where('school_id', $school->id)
            ->whereIn('type', ['Exam', 'Quiz', 'Midterm', 'Final'])
            ->with(['course.teacher'])
            ->orderBy('due_at')
            ->get();

        $today = Carbon::today();

        $exams = $examAssignments->map(function (Assignment $a) use ($today) {
            $meta = [];
            if ($a->instructions) {
                $decoded = json_decode($a->instructions, true);
                if (is_array($decoded)) {
                    $meta = $decoded;
                } else {
                    foreach (explode('|', $a->instructions) as $part) {
                        $kv = explode(':', trim($part), 2);
                        if (count($kv) === 2) {
                            $meta[strtolower(trim($kv[0]))] = trim($kv[1]);
                        }
                    }
                }
            }

            $dateStr = $a->due_at ? $a->due_at->toDateString() : $today->toDateString();
            $examDate = Carbon::parse($dateStr);

            // Determine status:
            // 1. If explicit status is saved in metadata, respect it.
            // 2. Otherwise: if exam date is strictly before today (yesterday or older), it is 'Completed'.
            // 3. If exam date is today or in the future, it is 'Scheduled' (not yet completed).
            if (!empty($meta['status']) && in_array($meta['status'], ['Scheduled', 'In Progress', 'Completed', 'Cancelled'])) {
                $status = $meta['status'];
            } else {
                if ($examDate->lt($today)) {
                    $status = 'Completed';
                } else {
                    $status = 'Scheduled';
                }
            }

            $timeVal = $meta['time'] ?? ($a->due_at ? $a->due_at->format('H:i') : '08:30 - 10:30');
            $venueVal = $meta['venue'] ?? 'Assigned Classrooms / Arm Hall';
            $invigilatorVal = $meta['invigilator'] ?? ($a->course?->teacher?->name ?? 'Unassigned');
            $formatVal = $meta['format'] ?? 'Theory & Objective (Paper-Based)';
            $durationVal = $meta['duration'] ?? '2.0 Hours';
            $cbtAccessCode = $meta['cbt_access_code'] ?? null;

            return [
                'id' => $a->id,
                'examCode' => 'EX-' . ($a->course?->code ?? 'GEN') . '-' . $a->id,
                'courseCode' => $a->course?->code ?? 'N/A',
                'courseName' => $a->course?->name ?? $a->title,
                'title' => $a->title,
                'date' => $dateStr,
                'time' => $timeVal,
                'venue' => $venueVal,
                'invigilator' => $invigilatorVal,
                'format' => $formatVal,
                'duration' => $durationVal,
                'cbtAccessCode' => $cbtAccessCode,
                'status' => $status,
            ];
        });

        return response()->json([
            'data' => $exams->values(),
            'school_cbt_enabled' => (bool) $school->cbt_enabled,
            'summary' => [
                'totalExams' => $exams->count(),
                'scheduledCount' => $exams->where('status', 'Scheduled')->count(),
                'completedCount' => $exams->where('status', 'Completed')->count(),
                'activeVenues' => $exams->pluck('venue')->unique()->count(),
                'cbtExamsCount' => $exams->filter(fn ($e) => str_contains($e['format'], 'CBT'))->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $request->user()->school()->first() ?? $request->user()->school;

        $data = $request->validate([
            'courseCode' => ['required', 'string', 'max:20'],
            'courseName' => ['required', 'string', 'max:150'],
            'title' => ['required', 'string', 'max:150'],
            'date' => ['required', 'date'],
            'time' => ['required', 'string', 'max:100'],
            'venue' => ['required', 'string', 'max:150'],
            'invigilator' => ['nullable', 'string', 'max:120'],
            'format' => ['required', 'string', 'max:100'],
            'duration' => ['required', 'string', 'max:60'],
            'cbtAccessCode' => ['nullable', 'string', 'max:30'],
        ]);

        $isCbt = str_contains($data['format'], 'CBT');

        if ($isCbt && ! $school->cbt_enabled) {
            return response()->json([
                'message' => 'CBT examinations are disabled for this institution. The platform SuperAdmin registered this school as Paper-Based Only due to computer facility capacity.',
            ], 422);
        }

        $cbtCode = null;
        if ($isCbt) {
            $cbtCode = !empty($data['cbtAccessCode']) ? strtoupper(trim($data['cbtAccessCode'])) : ('CBT-' . rand(10000, 99999));
        }

        $course = Course::where('school_id', $school->id)->where('code', $data['courseCode'])->first();
        if (! $course) {
            $course = Course::create([
                'school_id' => $school->id,
                'code' => strtoupper($data['courseCode']),
                'name' => $data['courseName'],
                'credits' => 3,
                'term' => $school->academic_year_current ?? 'Current Term',
                'capacity' => 40,
            ]);
        }

        $invigilatorName = $data['invigilator'] ?? ($course->teacher?->name ?? 'Unassigned');

        $instructionsMeta = [
            'venue' => $data['venue'],
            'time' => $data['time'],
            'format' => $data['format'],
            'duration' => $data['duration'],
            'invigilator' => $invigilatorName,
            'cbt_access_code' => $cbtCode,
            'status' => 'Scheduled',
        ];

        // Extract start time if present, e.g. "08:30" from "08:30 - 10:30 (Morning Session 1)"
        preg_match('/(\d{1,2}:\d{2})/', $data['time'], $timeMatches);
        $startTime = $timeMatches[1] ?? '08:30';
        $dueAt = Carbon::parse($data['date'] . ' ' . $startTime);

        $assignment = Assignment::create([
            'school_id' => $school->id,
            'course_id' => $course->id,
            'title' => $data['title'],
            'type' => 'Exam',
            'points' => 100,
            'instructions' => json_encode($instructionsMeta),
            'due_at' => $dueAt,
        ]);

        return response()->json([
            'message' => 'Examination scheduled successfully.',
            'data' => [
                'id' => $assignment->id,
                'examCode' => 'EX-' . $course->code . '-' . $assignment->id,
                'courseCode' => $course->code,
                'courseName' => $course->name,
                'title' => $assignment->title,
                'date' => $data['date'],
                'time' => $data['time'],
                'venue' => $data['venue'],
                'invigilator' => $invigilatorName,
                'format' => $data['format'],
                'duration' => $data['duration'],
                'cbtAccessCode' => $cbtCode,
                'status' => 'Scheduled',
            ],
        ], 201);
    }

    public function updateStatus(Request $request, Assignment $assignment): JsonResponse
    {
        $school = $request->user()->school;
        abort_unless($assignment->school_id === $school->id, 403);

        $data = $request->validate([
            'status' => ['required', 'string', 'in:Scheduled,In Progress,Completed,Cancelled'],
        ]);

        $meta = [];
        if ($assignment->instructions) {
            $decoded = json_decode($assignment->instructions, true);
            if (is_array($decoded)) {
                $meta = $decoded;
            } else {
                foreach (explode('|', $assignment->instructions) as $part) {
                    $kv = explode(':', trim($part), 2);
                    if (count($kv) === 2) {
                        $meta[strtolower(trim($kv[0]))] = trim($kv[1]);
                    }
                }
            }
        }

        $meta['status'] = $data['status'];
        $assignment->instructions = json_encode($meta);
        $assignment->save();

        return response()->json([
            'message' => 'Examination status updated successfully.',
            'data' => [
                'id' => $assignment->id,
                'status' => $data['status'],
            ],
        ]);
    }
}
