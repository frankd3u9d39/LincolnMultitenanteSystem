<?php

use App\Http\Controllers\Student\AssignmentController;
use App\Http\Controllers\Student\AttendanceController;
use App\Http\Controllers\Student\CbtController;
use App\Http\Controllers\Student\CourseController;
use App\Http\Controllers\Student\DashboardController;
use App\Http\Controllers\Student\FeeController;
use App\Http\Controllers\Student\NotificationController;
use App\Http\Controllers\Student\ProfileController;
use App\Http\Controllers\Student\ResultController;
use App\Http\Controllers\Student\TimetableController;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================================
 * GROUP 1: STUDENT MODULE API ROUTES
 * ============================================================================
 *
 * Owner: GROUP 1 (Student Development Team)
 * Base URL Prefix: /api/v1/student
 *
 * Scope:
 *   - Student profile, course enrollment, assignments, grades, timetable,
 *     attendance review, fee balances, notifications, and settings.
 *
 * Rules:
 *   - Strictly owned by Group 1.
 *   - Only Group 1 members should modify this file.
 *   - All routes in this group operate under the student's school_id tenant boundary.
 */
Route::prefix('student')->name('student.')->middleware(['auth:sanctum', 'student'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('/courses/catalog', [CourseController::class, 'catalog'])->name('courses.catalog');
    Route::post('/courses/{course}/enroll', [CourseController::class, 'enroll'])->name('courses.enroll');

    Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments.index');
    Route::post('/assignments/{submission}/submit', [AssignmentController::class, 'submit'])->name('assignments.submit');

    Route::get('/results', [ResultController::class, 'index'])->name('results.index');
    Route::get('/timetable', [TimetableController::class, 'index'])->name('timetable.index');
    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');

    Route::get('/fees', [FeeController::class, 'index'])->name('fees.index');
    Route::get('/fees/outstanding', [FeeController::class, 'outstanding'])->name('fees.outstanding');
    Route::post('/fees/pay', [FeeController::class, 'pay'])->name('fees.pay');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Computer-Based Testing (CBT) Portal
    Route::get('/cbt/exams', [CbtController::class, 'exams'])->name('cbt.exams');
    Route::post('/cbt/verify-access', [CbtController::class, 'verifyAccess'])->name('cbt.verify-access');
    Route::post('/cbt/submit', [CbtController::class, 'submitExam'])->name('cbt.submit');
});
