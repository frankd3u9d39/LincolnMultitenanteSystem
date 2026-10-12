<?php

use App\Http\Middleware\EnforceMaintenanceMode;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureStudent;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureTeacher;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Group 4: platform maintenance mode applies to every API request.
        $middleware->api(append: [EnforceMaintenanceMode::class]);

        // Group 4: gates every /api/v1/superadmin route behind the superadmin role.
        $middleware->alias([
            'superadmin' => EnsureSuperAdmin::class,
            'student' => EnsureStudent::class,
            'admin' => EnsureAdmin::class,
            'teacher' => EnsureTeacher::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
