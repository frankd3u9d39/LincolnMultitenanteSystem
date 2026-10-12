<?php

use App\Http\Controllers\SuperAdmin\AccountController;
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
        Route::post('/schools/{school}/support-access', [SchoolController::class, 'supportAccess'])->name('schools.support-access');

        // Tenant governance: administrators
        Route::get('/administrators', [AdministratorController::class, 'index'])->name('administrators.index');
        Route::post('/administrators', [AdministratorController::class, 'store'])->name('administrators.store');
        Route::get('/administrators/access-report', [AdministratorController::class, 'accessReport'])->name('administrators.access-report');
        Route::post('/administrators/enforce-mfa', [AdministratorController::class, 'enforceMfa'])->name('administrators.enforce-mfa');
        Route::post('/administrators/password-resets', [AdministratorController::class, 'sendPasswordResets'])->name('administrators.password-resets');
        Route::get('/administrators/{administrator}', [AdministratorController::class, 'show'])->name('administrators.show');
        Route::patch('/administrators/{administrator}/status', [AdministratorController::class, 'updateStatus'])->name('administrators.status');
        Route::get('/administrators/{administrator}/permissions', [AdministratorController::class, 'permissions'])->name('administrators.permissions');
        Route::put('/administrators/{administrator}/permissions', [AdministratorController::class, 'updatePermissions'])->name('administrators.permissions.update');

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
        Route::post('/platform-settings/test-email', [PlatformSettingController::class, 'testEmail'])->name('settings.test-email');
        Route::post('/platform-settings/backup', [PlatformSettingController::class, 'backup'])->name('settings.backup');

        // The signed-in operator's own account
        Route::prefix('account')->name('account.')->group(function () {
            Route::get('/', [AccountController::class, 'show'])->name('show');
            Route::put('/', [AccountController::class, 'update'])->name('update');
            Route::put('/password', [AccountController::class, 'changePassword'])->name('password');
            Route::get('/sessions', [AccountController::class, 'sessions'])->name('sessions');
            Route::delete('/sessions/others', [AccountController::class, 'revokeOtherSessions'])->name('sessions.revoke-others');
            Route::get('/api-keys', [AccountController::class, 'apiKeys'])->name('api-keys.index');
            Route::post('/api-keys', [AccountController::class, 'createApiKey'])->name('api-keys.store');
            Route::delete('/api-keys/{keyId}', [AccountController::class, 'revokeApiKey'])->whereNumber('keyId')->name('api-keys.revoke');
            Route::post('/mfa/setup', [AccountController::class, 'startMfaEnrolment'])->name('mfa.setup');
            Route::post('/mfa/confirm', [AccountController::class, 'confirmMfaEnrolment'])->name('mfa.confirm');
            Route::post('/recovery-codes', [AccountController::class, 'regenerateRecoveryCodes'])->name('recovery-codes');
        });
    });
