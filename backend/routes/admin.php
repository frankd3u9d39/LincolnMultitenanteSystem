<?php

use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\AttendanceOverviewController;
use App\Http\Controllers\Admin\ClassController;
use App\Http\Controllers\Admin\ClassResultController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\ExaminationController;
use App\Http\Controllers\Admin\FeeController;
use App\Http\Controllers\Admin\GeneralSettingController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ResultOverviewController;
use App\Http\Controllers\Admin\SchoolSettingController;
use App\Http\Controllers\Admin\SessionController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\TeacherController;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================================
 * GROUP 3: ADMIN MODULE API ROUTES
 * ============================================================================
 *
 * Owner: GROUP 3 (Admin Development Team)
 * Base URL Prefix: /api/v1/admin
 *
 * Scope:
 *   - School-level administration: students, teachers, classes, courses,
 *     fee schedules, announcements, departments, subjects, sessions,
 *     attendance, examinations, results, reports, staff, and school profile.
 *
 * Rules:
 *   - Strictly owned by Group 3.
 *   - Only Group 3 members should modify this file.
 *   - All routes operate strictly within the authenticated admin's school_id.
 */
Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');

    Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
    Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
    Route::put('/teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
    Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');

    Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
    Route::post('/classes', [ClassController::class, 'store'])->name('classes.store');
    Route::put('/classes/{schoolClass}', [ClassController::class, 'update'])->name('classes.update');
    Route::put('/classes/{schoolClass}/subjects', [ClassController::class, 'syncSubjects'])->name('classes.subjects.update');

    Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::put('/courses/{course}', [CourseController::class, 'update'])->name('courses.update');

    Route::get('/fees', [FeeController::class, 'index'])->name('fees.index');
    Route::post('/fees', [FeeController::class, 'store'])->name('fees.store');

    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');

    Route::get('/school-settings', [SchoolSettingController::class, 'show'])->name('settings.show');
    Route::put('/school-settings', [SchoolSettingController::class, 'update'])->name('settings.update');

    // Academic Operations & Administration
    Route::get('/departments', [DepartmentController::class, 'index'])->name('departments.index');
    Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');

    Route::get('/subjects', [SubjectController::class, 'index'])->name('subjects.index');
    Route::post('/subjects', [SubjectController::class, 'store'])->name('subjects.store');
    Route::put('/subjects/{course}', [SubjectController::class, 'update'])->name('subjects.update');

    Route::get('/sessions', [SessionController::class, 'index'])->name('sessions.index');
    Route::post('/sessions', [SessionController::class, 'store'])->name('sessions.store');
    Route::post('/sessions/{session}/activate', [SessionController::class, 'activate'])->name('sessions.activate');

    Route::get('/attendance', [AttendanceOverviewController::class, 'index'])->name('attendance.index');

    Route::get('/examinations', [ExaminationController::class, 'index'])->name('examinations.index');
    Route::post('/examinations', [ExaminationController::class, 'store'])->name('examinations.store');
    Route::put('/examinations/{assignment}/status', [ExaminationController::class, 'updateStatus'])->name('examinations.status');

    Route::get('/results', [ResultOverviewController::class, 'index'])->name('results.index');
    Route::get('/classes/{schoolClass}/results', [ClassResultController::class, 'index'])->name('classes.results.index');
    Route::post('/classes/{schoolClass}/results', [ClassResultController::class, 'store'])->name('classes.results.store');
    Route::post('/classes/{schoolClass}/results/upload-csv', [ClassResultController::class, 'uploadCsv'])->name('classes.results.upload-csv');
    Route::post('/classes/{schoolClass}/results/csv-upload', [ClassResultController::class, 'uploadCsv'])->name('classes.results.csv-upload');
    Route::get('/classes/{schoolClass}/results/csv-template', [ClassResultController::class, 'csvTemplate'])->name('classes.results.csv-template');
    Route::get('/classes/{schoolClass}/results/export', [ClassResultController::class, 'export'])->name('classes.results.export');
    Route::get('/classes/{schoolClass}/performance-reports/zip', [ClassResultController::class, 'downloadClassPerformanceReportsZip'])->name('classes.performance-reports.zip');
    Route::get('/students/{student}/performance-report/pdf', [ClassResultController::class, 'downloadPupilPerformanceReportPdf'])->name('students.performance-report.pdf');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');

    Route::get('/settings', [GeneralSettingController::class, 'show'])->name('general-settings.show');
    Route::put('/settings', [GeneralSettingController::class, 'update'])->name('general-settings.update');
    Route::post('/settings/logo', [GeneralSettingController::class, 'uploadLogo'])->name('general-settings.logo');
    Route::delete('/settings/logo', [GeneralSettingController::class, 'deleteLogo'])->name('general-settings.logo.delete');
    Route::put('/settings/branding', [GeneralSettingController::class, 'updateBranding'])->name('general-settings.branding');
});
