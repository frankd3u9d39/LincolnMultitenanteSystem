<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * GROUP 3: Admin Module - authorisation gate.
 *
 * Restricts the school-admin API to authenticated, active admins who belong
 * to a school. Every controller behind this middleware scopes its queries to
 * the caller's own `school_id`, never trusting a route parameter alone.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Authentication required.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json([
                'message' => 'This area is restricted to school administrators.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->status !== User::STATUS_ACTIVE) {
            return response()->json([
                'message' => 'This administrator account is not active.',
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
