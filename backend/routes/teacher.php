<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Teacher\TeacherDashboardController;
use App\Http\Controllers\Api\Teacher\TeacherClassController;
use App\Http\Controllers\Api\Teacher\TeacherStudentController;
use App\Http\Controllers\Api\Teacher\TeacherAttendanceController;
use App\Http\Controllers\Api\Teacher\TeacherAssignmentController;
use App\Http\Controllers\Api\Teacher\TeacherAnnouncementController;

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

// We assume these would eventually be protected by auth:sanctum
Route::prefix('teacher')->name('teacher.')->group(function () {
    // Dashboard Stats
    Route::get('/dashboard', [TeacherDashboardController::class, 'index'])->name('dashboard');

    // Classes & Students
    Route::get('/classes', [TeacherClassController::class, 'index'])->name('classes.index');
    Route::get('/classes/{schoolClass}/students', [TeacherStudentController::class, 'index'])->name('students.index');

    // Attendance
    Route::get('/attendance/classes', [TeacherAttendanceController::class, 'getClasses'])->name('attendance.classes');
    Route::post('/attendance', [TeacherAttendanceController::class, 'store'])->name('attendance.store');

    // Assignments
    Route::apiResource('assignments', TeacherAssignmentController::class);

    // Announcements / Notices
    Route::apiResource('announcements', TeacherAnnouncementController::class);
});
