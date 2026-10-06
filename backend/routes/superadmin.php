<?php

use App\Http\Controllers\SuperAdmin\AdministratorController;
use App\Http\Controllers\SuperAdmin\AuditLogController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\PlatformSettingController;
use App\Http\Controllers\SuperAdmin\ReportController;
use App\Http\Controllers\SuperAdmin\SchoolController;
use App\Http\Controllers\SuperAdmin\SystemUserController;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================================
 * GROUP 4: SUPERADMIN MODULE API ROUTES
 * ============================================================================
 *
 * Owner: GROUP 4 (SuperAdmin Development Team)
 * Base URL Prefix: /api/v1/superadmin
 *
 * Scope:
 *   - Multi-school platform administration: onboarding schools (tenants),
 *     provisioning administrator accounts, managing system users,
 *     platform-wide configurations, audit logs, and global system reports.
 *
 * Rules:
 *   - Strictly owned by Group 4.
 *   - Only Group 4 members should modify this file.
 *   - Operates globally across all schools / tenants without school_id restriction.
 *   - Every route requires an authenticated user holding the superadmin role.
 */
Route::prefix('superadmin')
    ->name('superadmin.')
    ->middleware(['auth:sanctum', 'superadmin'])
    ->group(function () {
        // Platform overview
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/system-reports', [ReportController::class, 'index'])->name('reports.index');

        // Tenant governance: schools
        Route::get('/schools', [SchoolController::class, 'index'])->name('schools.index');
        Route::post('/schools', [SchoolController::class, 'store'])->name('schools.store');
        Route::get('/schools/{school}', [SchoolController::class, 'show'])->name('schools.show');
        Route::patch('/schools/{school}/quota', [SchoolController::class, 'updateQuota'])->name('schools.quota');
        Route::post('/schools/{school}/suspend', [SchoolController::class, 'suspend'])->name('schools.suspend');
        Route::post('/schools/{school}/reinstate', [SchoolController::class, 'reinstate'])->name('schools.reinstate');

        // Tenant governance: administrators
        Route::get('/administrators', [AdministratorController::class, 'index'])->name('administrators.index');
        Route::post('/administrators', [AdministratorController::class, 'store'])->name('administrators.store');
        Route::get('/administrators/access-report', [AdministratorController::class, 'accessReport'])->name('administrators.access-report');
        Route::post('/administrators/enforce-mfa', [AdministratorController::class, 'enforceMfa'])->name('administrators.enforce-mfa');
        Route::post('/administrators/password-resets', [AdministratorController::class, 'sendPasswordResets'])->name('administrators.password-resets');
        Route::get('/administrators/{administrator}', [AdministratorController::class, 'show'])->name('administrators.show');
        Route::patch('/administrators/{administrator}/status', [AdministratorController::class, 'updateStatus'])->name('administrators.status');

        // Cross-tenant identity directory
        Route::get('/system-users', [SystemUserController::class, 'index'])->name('users.index');
        Route::post('/system-users/revoke-all-sessions', [SystemUserController::class, 'revokeAllSessions'])->name('users.revoke-all');
        Route::get('/system-users/{user}', [SystemUserController::class, 'show'])->name('users.show');
        Route::post('/system-users/{user}/revoke-sessions', [SystemUserController::class, 'revokeSessions'])->name('users.revoke');

        // Security audit trail
        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
        Route::get('/audit-logs/export', [AuditLogController::class, 'export'])->name('audit-logs.export');

        // Platform configuration
        Route::get('/platform-settings', [PlatformSettingController::class, 'index'])->name('settings.index');
        Route::put('/platform-settings', [PlatformSettingController::class, 'update'])->name('settings.update');
    });
