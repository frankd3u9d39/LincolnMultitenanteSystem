<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceRecord;
use App\Models\Course;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TeacherAttendanceController extends Controller
{
    public function getClasses(Request $request)
    {
        $teacher = $request->user();
        $teacherId = $teacher->id;
        $schoolId = $teacher->school_id;
        $todayDate = now()->toDateString();

        // 1. Classes the teacher oversees as Form Master
        $overseenClassIds = SchoolClass::where('teacher_id', $teacherId)->pluck('id');

        // 2. Classes where the teacher teaches a Subject
        $subjectClassIds = SchoolClass::whereHas('subjects', function ($q) use ($teacherId) {
            $q->where('courses.teacher_id', $teacherId)
                ->orWhere('class_subject.teacher_id', $teacherId);
        })->pluck('id');

        $classIds = $overseenClassIds->merge($subjectClassIds)->unique();

        // 3. Fallback: all classes in the teacher's school if not specifically assigned yet
        if ($classIds->isEmpty()) {
            $teacherSchoolIds = User::where('school_id', $schoolId)->where('role', User::ROLE_TEACHER)->pluck('id');
            $classIds = SchoolClass::where(function ($q) use ($teacherSchoolIds) {
                $q->whereIn('teacher_id', $teacherSchoolIds)->orWhereNull('teacher_id');
            })->pluck('id');
        }

        // Today's attendance summaries
        $todayAttendances = Attendance::whereIn('school_class_id', $classIds)
            ->where('date', $todayDate)
            ->get();

        $classes = SchoolClass::whereIn('id', $classIds)
            ->withCount('students')
            ->with(['teacher:id,name', 'subjects' => function ($q) {
                $q->select('courses.id', 'courses.code', 'courses.name', 'courses.department', 'courses.teacher_id')
                    ->with('teacher:id,name');
            }])
            ->get()
            ->map(function ($c) use ($teacherId, $todayAttendances) {
                $classToday = $todayAttendances->where('school_class_id', $c->id);
                $todayTaken = $classToday->isNotEmpty();
                $todayTotal = $classToday->count();
                $todayPresent = $classToday->where('status', 'Present')->count();
                $todayAbsent = $classToday->where('status', 'Absent')->count();
                $todayLate = $classToday->where('status', 'Late')->count();

                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'code' => $c->code,
                    'room' => $c->room,
                    'schedule' => $c->schedule,
                    'teacher' => $c->teacher?->name ?? 'Unassigned',
                    'teacher_id' => $c->teacher_id,
                    'is_form_master' => ($c->teacher_id === $teacherId),
                    'students_count' => $c->students_count,
                    'today_attendance' => [
                        'taken' => $todayTaken,
                        'total' => $todayTotal,
                        'present' => $todayPresent,
                        'absent' => $todayAbsent,
                        'late' => $todayLate,
                    ],
                    'subjects' => $c->subjects->map(function ($s) use ($teacherId, $classToday) {
                        $pivotTeacherId = $s->pivot?->teacher_id;
                        $isMySubject = ($s->teacher_id === $teacherId) || ($pivotTeacherId === $teacherId);
                        $subjectToday = $classToday->where('course_id', $s->id);

                        return [
                            'id' => $s->id,
                            'code' => $s->code,
                            'name' => $s->name,
                            'department' => $s->department,
                            'teacher' => $s->teacher?->name ?? 'Unassigned',
                            'is_my_subject' => $isMySubject,
                            'today_taken' => $subjectToday->isNotEmpty(),
                        ];
                    }),
                ];
            });

        // Subjects taught by this teacher across the school
        $teacherSubjects = Course::where('school_id', $schoolId)
            ->where(function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId)
                    ->orWhereHas('classes', fn ($cq) => $cq->where('class_subject.teacher_id', $teacherId));
            })
            ->get(['id', 'code', 'name', 'department']);

        // All subjects in the school
        $schoolSubjects = Course::where('school_id', $schoolId)->get(['id', 'code', 'name', 'department']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'classes' => $classes,
                'teacher_subjects' => $teacherSubjects,
                'school_subjects' => $schoolSubjects,
            ],
        ]);
    }

    public function records(Request $request, SchoolClass $schoolClass)
    {
        $teacher = $request->user();
        $schoolId = $teacher->school_id;

        // Multi-tenant check
        $teacherSchoolIds = User::where('school_id', $schoolId)->where('role', User::ROLE_TEACHER)->pluck('id');
        if ($schoolClass->teacher_id) {
            abort_unless($teacherSchoolIds->contains($schoolClass->teacher_id), 403, 'Unauthorized class.');
        }

        $date = $request->query('date', now()->toDateString());
        $courseId = $request->query('course_id');

        $query = Attendance::where('school_class_id', $schoolClass->id)
            ->where('date', $date);

        if ($courseId !== null && $courseId !== '') {
            $query->where('course_id', $courseId);
        }

        $records = $query->get(['student_id', 'status', 'type', 'updated_at']);

        return response()->json([
            'status' => 'success',
            'data' => $records,
        ]);
    }

    public function store(Request $request)
    {
        $teacher = $request->user();
        $teacherId = $teacher->id;
        $schoolId = $teacher->school_id;

        $validated = $request->validate([
            'school_class_id' => 'required|integer|exists:school_classes,id',
            'course_id' => 'nullable|integer|exists:courses,id',
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:Present,Absent,Late,Excused',
        ]);

        $schoolClass = SchoolClass::findOrFail($validated['school_class_id']);

        // Multi-tenant check: ensure class belongs to this school
        $teacherSchoolIds = User::where('school_id', $schoolId)->where('role', User::ROLE_TEACHER)->pluck('id');
        if ($schoolClass->teacher_id) {
            abort_unless($teacherSchoolIds->contains($schoolClass->teacher_id), 403, 'Unauthorized class.');
        }

        $rosterIds = $schoolClass->students()->pluck('students.id');

        foreach ($validated['records'] as $record) {
            if (! $rosterIds->contains($record['student_id'])) {
                throw ValidationException::withMessages(['records' => 'One of these students is not enrolled in this class.']);
            }
        }

        $courseId = $validated['course_id'] ?? null;
        $courseName = null;
        if ($courseId) {
            $course = Course::find($courseId);
            $courseName = $course?->name;
        }

        foreach ($validated['records'] as $record) {
            Attendance::updateOrCreate(
                [
                    'school_class_id' => $validated['school_class_id'],
                    'course_id' => $courseId,
                    'student_id' => $record['student_id'],
                    'date' => $validated['date'],
                ],
                [
                    'teacher_id' => $teacherId,
                    'status' => $record['status'],
                    'type' => $courseName ? "Subject: {$courseName}" : 'Class Attendance',
                ]
            );
        }

        // Sync with AttendanceRecord table so Student and Admin portals reflect real-time counts
        $studentUserMap = Student::whereIn('id', collect($validated['records'])->pluck('student_id'))
            ->pluck('user_id', 'id');

        $syncCourseId = $courseId ?: $schoolClass->subjects()->first()?->id;

        if ($syncCourseId) {
            foreach ($validated['records'] as $record) {
                $userId = $studentUserMap[$record['student_id']] ?? null;
                if ($userId) {
                    AttendanceRecord::updateOrCreate(
                        [
                            'school_id' => $schoolId,
                            'course_id' => $syncCourseId,
                            'student_id' => $userId,
                            'date' => $validated['date'],
                        ],
                        [
                            'status' => strtolower($record['status']),
                        ]
                    );
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => $courseName ? "Attendance for {$courseName} saved successfully" : 'Attendance saved successfully',
        ]);
    }
}
