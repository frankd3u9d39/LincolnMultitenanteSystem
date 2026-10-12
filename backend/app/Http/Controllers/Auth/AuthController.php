<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\SuperAdmin\AuditLogger;
use App\Services\SuperAdmin\Totp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Shared authentication for every module.
 *
 * Sign-in is bearer-token based. Failures are counted per account and lock it
 * temporarily, using the thresholds configured in Platform Settings, and every
 * outcome is written to the audit trail.
 */
class AuthController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly Totp $totp,
    ) {}

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'device_name' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $user = User::where('email', strtolower($credentials['email']))->first();

        // Same response for "no such account" and "wrong password", so the form
        // cannot be used to discover which addresses are registered.
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return $this->failedAttempt($user, $credentials['email']);
        }

        if ($user->locked_until && $user->locked_until->isFuture()) {
            return $this->lockedResponse($user);
        }

        if ($user->status !== User::STATUS_ACTIVE) {
            $this->audit->record(
                eventType: 'auth.login.blocked',
                action: 'Blocked Sign-in',
                description: sprintf('%s attempted to sign in while the account is %s.', $user->email, $user->status),
                school: $user->school,
                severity: AuditLog::SEVERITY_WARNING,
                actor: $user,
            );

            return response()->json([
                'message' => $user->status === User::STATUS_PENDING
                    ? 'This account has not been activated yet. Use the link in your invitation email.'
                    : 'This account is not active. Contact your platform administrator.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->school?->isSuspended()) {
            return response()->json([
                'message' => 'Your school has been suspended. Contact the platform administrator.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->mfa_enabled && $user->mfa_secret) {
            $code = (string) ($credentials['code'] ?? '');

            if ($code === '') {
                return response()->json([
                    'message' => 'Enter the 6-digit code from your authenticator app.',
                    'mfa_required' => true,
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if (! $this->acceptsSecondFactor($user, $code)) {
                return $this->failedAttempt($user, $user->email, 'The verification code is incorrect.');
            }
        }

        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        $token = $user->createToken($credentials['device_name'] ?? 'web', ['*']);
        $this->stampDevice($token->accessToken, $request);

        $this->audit->record(
            eventType: 'auth.login.success',
            action: 'Signed In',
            description: sprintf('%s signed in.', $user->name),
            school: $user->school,
            newValues: ['role' => $user->role],
            actor: $user,
        );

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user()->load('school'))]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->currentAccessToken()?->delete();

        $this->audit->record(
            eventType: 'auth.logout',
            action: 'Signed Out',
            description: sprintf('%s signed out.', $user->name),
            school: $user->school,
        );

        return response()->json(['message' => 'Signed out.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink(['email' => strtolower($validated['email'])]);

        // Identical answer whether or not the address exists.
        return response()->json([
            'message' => 'If that address is registered, a reset link is on its way.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:'.$this->minPasswordLength(), 'confirmed'],
        ]);

        $status = Password::reset(
            [...$validated, 'password_confirmation' => $request->input('password_confirmation')],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'password_changed_at' => now(),
                    'failed_login_attempts' => 0,
                    'locked_until' => null,
                    'remember_token' => Str::random(60),
                ])->save();

                // A reset invalidates every device that was signed in.
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'This reset link is invalid or has expired.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json(['message' => 'Password updated. You can sign in now.']);
    }

    /** @return array<string, mixed> */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'schoolId' => $user->school_id,
            'schoolName' => $user->school?->name,
            'schoolCode' => $user->school?->code,
            'mfaEnabled' => (bool) $user->mfa_enabled,
        ];
    }

    private function failedAttempt(?User $user, string $email, string $message = 'These credentials do not match our records.'): JsonResponse
    {
        if ($user) {
            $max = (int) PlatformSetting::valueOf('max_failed_logins', 5);
            $minutes = (int) PlatformSetting::valueOf('lockout_duration_minutes', 15);
            $attempts = $user->failed_login_attempts + 1;
            $locking = $attempts >= $max;

            $user->forceFill([
                'failed_login_attempts' => $locking ? 0 : $attempts,
                'locked_until' => $locking ? now()->addMinutes($minutes) : $user->locked_until,
            ])->save();

            $this->audit->record(
                eventType: $locking ? 'auth.login.locked' : 'auth.login.failed',
                action: $locking ? 'Account Locked After Failed Sign-ins' : 'Failed Sign-in Attempt',
                description: $locking
                    ? sprintf('%s locked for %d minutes after %d failed attempts.', $user->email, $minutes, $max)
                    : sprintf('Failed sign-in attempt %d of %d for %s.', $attempts, $max, $user->email),
                school: $user->school,
                newValues: ['attempts' => $attempts],
                severity: $locking ? AuditLog::SEVERITY_CRITICAL : AuditLog::SEVERITY_WARNING,
                actor: $user,
            );

            if ($locking) {
                return $this->lockedResponse($user);
            }
        } else {
            $this->audit->record(
                eventType: 'auth.login.failed',
                action: 'Failed Sign-in Attempt',
                description: sprintf('Failed sign-in attempt for unknown address %s.', $email),
                severity: AuditLog::SEVERITY_WARNING,
            );
        }

        return response()->json(['message' => $message], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function lockedResponse(User $user): JsonResponse
    {
        $minutes = max(1, (int) ceil(now()->diffInSeconds($user->locked_until, false) / 60));

        return response()->json([
            'message' => sprintf('Too many failed attempts. Try again in %d minute%s.', $minutes, $minutes === 1 ? '' : 's'),
            'locked' => true,
        ], Response::HTTP_TOO_MANY_REQUESTS);
    }

    /** A current authenticator code, or an unused recovery code (consumed on use). */
    private function acceptsSecondFactor(User $user, string $code): bool
    {
        if ($this->totp->verify($user->mfa_secret, $code)) {
            return true;
        }

        $hashes = $user->mfa_recovery_codes ?? [];
        $normalised = strtoupper(trim($code));

        foreach ($hashes as $index => $hash) {
            if (Hash::check($normalised, $hash)) {
                unset($hashes[$index]);
                $user->forceFill(['mfa_recovery_codes' => array_values($hashes)])->save();

                return true;
            }
        }

        return false;
    }

    private function stampDevice(PersonalAccessToken $token, Request $request): void
    {
        $token->forceFill([
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ])->save();
    }

    private function minPasswordLength(): int
    {
        return (int) PlatformSetting::valueOf('min_password_length', 10);
    }
}
