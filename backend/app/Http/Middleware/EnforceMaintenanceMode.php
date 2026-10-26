<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\PlatformSetting;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Platform maintenance mode.
 *
 * While the switch in Platform Settings is on, everyone except SuperAdmins and
 * the listed bypass addresses receives a 503 carrying the maintenance message.
 * Sign-in is left reachable so a SuperAdmin can still get in to turn it off;
 * the sign-in action applies the same rule to everyone else.
 */
class EnforceMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! PlatformSetting::valueOf('maintenance_mode', false)) {
            return $next($request);
        }

        // Sign-in and sign-out stay open; sign-in enforces the rule itself.
        if ($request->is('api/v1/auth/login', 'api/v1/auth/logout', 'api/health')) {
            return $next($request);
        }

        /** @var User|null $user */
        $user = $request->user('sanctum');

        if ($user?->isSuperAdmin() || self::isBypassed($request->ip())) {
            return $next($request);
        }

        return self::blocked();
    }

    /** Whether an address is on the maintenance bypass list. */
    public static function isBypassed(?string $ip): bool
    {
        return $ip !== null && in_array($ip, PlatformSetting::addressList('allowed_bypass_ips'), true);
    }

    public static function blocked(): Response
    {
        return response()->json([
            'message' => (string) PlatformSetting::valueOf(
                'maintenance_message',
                'The platform is undergoing scheduled maintenance. Please try again shortly.'
            ),
            'maintenance' => true,
        ], Response::HTTP_SERVICE_UNAVAILABLE);
    }
}
