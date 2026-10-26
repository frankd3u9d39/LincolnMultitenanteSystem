<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 1: Student Module - attendance history.
 */
class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $records = AttendanceRecord::where('student_id', $student->id)->get();

        $total = $records->count();
        $present = $records->where('status', AttendanceRecord::STATUS_PRESENT)->count();
        $absent = $records->where('status', AttendanceRecord::STATUS_ABSENT)->count();
        $late = $records->where('status', AttendanceRecord::STATUS_LATE)->count();

        $byCourse = $records->load('course')->groupBy('course_id')->map(function ($rows) {
            $course = $rows->first()->course;
            $courseTotal = $rows->count();
            $coursePresent = $rows->whereIn('status', [AttendanceRecord::STATUS_PRESENT, AttendanceRecord::STATUS_LATE])->count();

            return [
                'id' => $course->id,
                'course' => $course->name,
                'code' => $course->code,
                'percentage' => $courseTotal > 0 ? round($coursePresent / $courseTotal * 100) : 0,
                'present' => $coursePresent,
                'total' => $courseTotal,
            ];
        })->values();

        $recentLogs = $records->load('course')->sortByDesc('date')->take(10)->map(fn (AttendanceRecord $r) => [
            'id' => $r->id,
            'date' => $r->date->toDateString(),
            'course' => $r->course->name,
            'status' => ucfirst($r->status),
        ])->values();

        return response()->json([
            'data' => [
                'overall' => [
                    'percentage' => $total > 0 ? round(($present + $late) / $total * 100) : 100,
                    'totalClasses' => $total,
                    'present' => $present,
                    'absent' => $absent,
                    'late' => $late,
                ],
                'byCourse' => $byCourse,
                'recentLogs' => $recentLogs,
            ],
        ]);
    }
}
