<?php

namespace App\Providers;

use App\Models\PlatformSetting;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Inactivity timeout from Platform Settings. API keys are exempt, since an
        // integration may legitimately call only once a day.
        Sanctum::authenticateAccessTokensUsing(function ($token, bool $isValid) {
            if (! $isValid || str_starts_with((string) $token->name, 'api:')) {
                return $isValid;
            }

            $minutes = (int) PlatformSetting::valueOf('session_timeout_minutes', 0);
            $lastActive = $token->last_used_at ?? $token->created_at;

            if ($minutes > 0 && $lastActive && $lastActive->lt(now()->subMinutes($minutes))) {
                $token->delete();

                return false;
            }

            return true;
        });

        // The reset page is part of the Next.js frontend, not a Laravel route,
        // so the emailed link has to point there.
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return rtrim((string) config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);
        });
    }
}
