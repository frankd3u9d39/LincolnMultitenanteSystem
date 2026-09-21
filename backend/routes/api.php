<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================================
 * LINCOLN MULTI-TENANT SYSTEM - MASTER API ROUTER
 * ============================================================================
 * 
 * This master router loads modular route definitions for:
 *   - Shared Authentication (routes/auth.php)
 *   - Group 1: Student Module (routes/student.php)
 *   - Group 2: Teacher Module (routes/teacher.php)
 *   - Group 3: Admin Module (routes/admin.php)
 *   - Group 4: SuperAdmin Module (routes/superadmin.php)
 * 
 * Notice:
 *   - Each group must work within its dedicated route file.
 *   - Shared middleware and global prefixes are defined here.
 */

// Health & System Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'system' => 'LincolnMultitenanteSystem API',
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// API Version 1 Root Group
Route::prefix('v1')->group(function () {
    // Shared Authentication Routes
    require __DIR__ . '/auth.php';

    // Group 1: Student Routes
    require __DIR__ . '/student.php';

    // Group 2: Teacher Routes
    require __DIR__ . '/teacher.php';

    // Group 3: Admin Routes
    require __DIR__ . '/admin.php';

    // Group 4: SuperAdmin Routes
    require __DIR__ . '/superadmin.php';
});
