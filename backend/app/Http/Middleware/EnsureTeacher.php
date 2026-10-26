<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * GROUP 2: Teacher Module - authorisation gate.
 *
 * Restricts the teacher API to authenticated, active teachers who belong to
 * a school. Added because the route file previously had no auth middleware
 * at all (every endpoint used a hardcoded `teacherId = 1`), mirroring the
 * EnsureStudent/EnsureAdmin gates already in place for the other roles.
 */
class EnsureTeacher
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Authentication required.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($user->role !== User::ROLE_TEACHER) {
            return response()->json([
                'message' => 'This area is restricted to teachers.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->status !== User::STATUS_ACTIVE) {
            return response()->json([
                'message' => 'This teacher account is not active.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (! $user->school_id || $user->school?->isSuspended()) {
            return response()->json([
                'message' => 'Your school is not currently active on the platform.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
