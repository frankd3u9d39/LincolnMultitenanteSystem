<?php

use App\Http\Controllers\Teacher\TeacherAnnouncementController;
use App\Http\Controllers\Teacher\TeacherAssignmentController;
use App\Http\Controllers\Teacher\TeacherAttendanceController;
use App\Http\Controllers\Teacher\TeacherClassController;
use App\Http\Controllers\Teacher\TeacherDashboardController;
use App\Http\Controllers\Teacher\TeacherStudentController;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================================
 * GROUP 2: TEACHER MODULE API ROUTES
 * ============================================================================
 *
 * Owner: GROUP 2 (Teacher Development Team)
 * Base URL Prefix: /api/v1/teacher
 *
 * Scope:
 *   - Teacher profile, classes, student rosters, attendance tracking,
 *     assignment creation, grading, timetable, materials, and announcements.
 *
 * Rules:
 *   - Strictly owned by Group 2.
 *   - Only Group 2 members should modify this file.
 *   - All routes in this group operate under the teacher's school_id tenant boundary.
 */
Route::prefix('teacher')->name('teacher.')->middleware(['auth:sanctum', 'teacher'])->group(function () {
    // Dashboard Stats
    Route::get('/dashboard', [TeacherDashboardController::class, 'index'])->name('dashboard');

    // Classes & Students
    Route::get('/classes', [TeacherClassController::class, 'index'])->name('classes.index');
    Route::get('/classes/{schoolClass}/students', [TeacherStudentController::class, 'index'])->name('students.index');

    // Attendance
    Route::get('/attendance/classes', [TeacherAttendanceController::class, 'getClasses'])->name('attendance.classes');
    Route::get('/classes/{schoolClass}/attendance', [TeacherAttendanceController::class, 'records'])->name('attendance.records');
    Route::post('/attendance', [TeacherAttendanceController::class, 'store'])->name('attendance.store');

    // Assignments
    Route::apiResource('assignments', TeacherAssignmentController::class)->only(['index', 'store', 'show', 'update']);

    // Announcements / Notices
    Route::apiResource('announcements', TeacherAnnouncementController::class)->only(['index', 'store']);
});
