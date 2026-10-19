<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - Institutional Attendance Analytics.
 */
class AttendanceOverviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $totalRecords = AttendanceRecord::where('school_id', $school->id)->count();
        $presentRecords = AttendanceRecord::where('school_id', $school->id)->where('status', 'present')->count();
        $absentRecords = AttendanceRecord::where('school_id', $school->id)->where('status', 'absent')->count();
        $lateRecords = AttendanceRecord::where('school_id', $school->id)->where('status', 'late')->count();

        $overallRate = $totalRecords > 0 ? round(($presentRecords / $totalRecords) * 100, 1) : 0.0;

        $courses = Course::where('school_id', $school->id)->get();

        $classRosters = $courses->map(function (Course $c) use ($school) {
            $courseRecords = AttendanceRecord::where('school_id', $school->id)->where('course_id', $c->id)->count();
            $coursePresent = AttendanceRecord::where('school_id', $school->id)->where('course_id', $c->id)->where('status', 'present')->count();
            $rate = $courseRecords > 0 ? round(($coursePresent / $courseRecords) * 100, 1) : 0.0;
            $enrolled = Enrollment::where('course_id', $c->id)->where('status', '!=', Enrollment::STATUS_WITHDRAWN)->count();
            $presentToday = AttendanceRecord::where('school_id', $school->id)
                ->where('course_id', $c->id)
                ->where('date', now()->toDateString())
                ->where('status', 'present')
                ->count();

            return [
                'id' => $c->id,
                'course' => $c->name,
                'code' => $c->code,
                'department' => $c->department ?? 'General',
                'enrolled' => $enrolled,
                'presentToday' => $presentToday,
                'rate' => $rate,
                'status' => $rate >= 85 ? 'Normal' : ($rate >= 75 ? 'Caution' : 'Critical Warning'),
            ];
        });

        // Real students below 75% attendance threshold in database
        $flaggedStudents = [];
        $studentIds = AttendanceRecord::where('school_id', $school->id)->distinct()->pluck('student_id');
        foreach ($studentIds as $sid) {
            $total = AttendanceRecord::where('school_id', $school->id)->where('student_id', $sid)->count();
            if ($total === 0) {
                continue;
            }
            $pres = AttendanceRecord::where('school_id', $school->id)
                ->where('student_id', $sid)
                ->whereIn('status', ['present', 'late'])
                ->count();
            $sRate = round(($pres / $total) * 100, 1);
            if ($sRate < 75.0) {
                $stUser = User::find($sid);
                if ($stUser) {
                    $flaggedStudents[] = [
                        'id' => $stUser->id,
                        'name' => $stUser->name,
                        'idNumber' => $stUser->studentProfile?->student_id_number ?? ('STD-' . $stUser->id),
                        'course' => 'Enrolled Courses',
                        'rate' => $sRate,
                        'consecutiveAbsences' => AttendanceRecord::where('school_id', $school->id)
                            ->where('student_id', $sid)
                            ->where('status', 'absent')
                            ->count(),
                    ];
                }
            }
        }

        return response()->json([
            'summary' => [
                'overallRate' => $overallRate,
                'totalRecorded' => $totalRecords,
                'presentCount' => $presentRecords,
                'absentCount' => $absentRecords,
                'lateCount' => $lateRecords,
                'flaggedCount' => count($flaggedStudents),
            ],
            'classRosters' => $classRosters->values(),
            'flaggedStudents' => $flaggedStudents,
        ]);
    }
}
