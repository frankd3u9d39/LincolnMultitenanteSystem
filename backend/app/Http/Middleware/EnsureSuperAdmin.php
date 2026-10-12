<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * GROUP 4: SuperAdmin Module - platform-level authorisation gate.
 *
 * Every SuperAdmin endpoint operates across all tenant boundaries, so access
 * is restricted to authenticated users holding the superadmin role.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Authentication required.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($user->role !== User::ROLE_SUPERADMIN) {
            return response()->json([
                'message' => 'This area is restricted to platform SuperAdministrators.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->status !== User::STATUS_ACTIVE) {
            return response()->json([
                'message' => 'This SuperAdmin account is not active.',
            ], Response::HTTP_FORBIDDEN);
        }

        // API keys carry an ability set; a read-only key may only read.
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken && ! $token->can('*')) {
            $isRead = in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true);
            $allowed = $isRead ? $token->can('read') : $token->can('write');

            if (! $allowed) {
                return response()->json([
                    'message' => 'This API key does not have permission for that action.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        return $next($request);
    }
}
