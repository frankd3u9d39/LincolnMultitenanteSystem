<?php

use Illuminate\Support\Facades\Route;

/**
 * ============================================================================
 * SHARED AUTHENTICATION ROUTES
 * ============================================================================
 * 
 * Scope: Shared across all modules (Student, Teacher, Admin, SuperAdmin).
 * Rules:
 *   - Authentication is a single shared system across LincolnMultitenanteSystem.
 *   - Do NOT create separate authentication systems for individual groups.
 *   - Any modifications to authentication flows require cross-team agreement.
 */

Route::prefix('auth')->name('auth.')->group(function () {
    // Route placeholders to be implemented in feature phase:
    // Route::post('/login', [AuthController::class, 'login'])->name('login');
    // Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('forgot-password');
    // Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('reset-password');
    // Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum')->name('logout');
});
