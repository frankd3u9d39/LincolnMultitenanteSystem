<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\User;
use App\Services\SuperAdmin\AuditLogger;
use App\Services\SuperAdmin\Totp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * GROUP 4: SuperAdmin Module - the signed-in operator's own account.
 *
 * Profile and alert preferences, password, active sessions, API access keys
 * and multi-factor enrolment. Every action acts on the caller only.
 */
class AccountController extends Controller
{
    private const API_KEY_PREFIX = 'api:';

    private const NOTIFICATION_KEYS = [
        'tenantOnboarded', 'tenantSuspended', 'quotaBreaches',
        'securityAlerts', 'backupResults', 'weeklyDigest',
    ];

    private const DEFAULT_NOTIFICATIONS = [
        'tenantOnboarded' => true,
        'tenantSuspended' => true,
        'quotaBreaches' => true,
        'securityAlerts' => true,
        'backupResults' => false,
        'weeklyDigest' => true,
        'channel' => 'email',
    ];

    public function __construct(
        private readonly AuditLogger $audit,
        private readonly Totp $totp,
    ) {}

    /* ------------------------------------------------------------------ */
    /* Profile & preferences */
    /* ------------------------------------------------------------------ */

    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->accountPayload($request->user())]);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'fullName' => ['required', 'string', 'min:3', 'max:255'],
            'jobTitle' => ['nullable', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'timezone' => ['required', 'string', 'max:60'],
            'language' => ['required', 'string', 'max:60'],
            'dateFormat' => ['required', 'string', 'max:20'],
            'notifications' => ['required', 'array'],
            'notifications.channel' => ['required', Rule::in(['email', 'email_sms', 'in_app'])],
            ...collect(self::NOTIFICATION_KEYS)->mapWithKeys(
                fn (string $key) => ["notifications.{$key}" => ['required', 'boolean']]
            )->all(),
        ]);

        $previousEmail = $user->email;

        $user->forceFill([
            'name' => $validated['fullName'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'preferences' => [
                ...($user->preferences ?? []),
                'job_title' => $validated['jobTitle'] ?? null,
                'timezone' => $validated['timezone'],
                'language' => $validated['language'],
                'date_format' => $validated['dateFormat'],
                'notifications' => $validated['notifications'],
            ],
        ])->save();

        $this->audit->recordUserChange(
            eventType: 'user.profile_updated',
            action: 'Updated Account Preferences',
            description: sprintf('%s updated their account preferences.', $user->name),
            subject: $user,
            newValues: $previousEmail !== $user->email ? ['email' => $user->email] : null,
        );

        return response()->json([
            'message' => 'Preferences saved. Changes have been written to the platform audit trail.',
            'data' => $this->accountPayload($user->fresh()),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /* Password */
    /* ------------------------------------------------------------------ */

    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $minLength = (int) PlatformSetting::valueOf('min_password_length', 10);

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:'.$minLength, 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return $this->validationError('current_password', 'Your current password is incorrect.');
        }

        if (Hash::check($validated['password'], $user->password)) {
            return $this->validationError('password', 'Choose a password you have not used before.');
        }

        if (PlatformSetting::valueOf('require_numbers', true) && ! preg_match('/\d/', $validated['password'])) {
            return $this->validationError('password', 'Include at least one number.');
        }

        if (PlatformSetting::valueOf('require_special_chars', true) && ! preg_match('/[^A-Za-z0-9]/', $validated['password'])) {
            return $this->validationError('password', 'Include at least one symbol.');
        }

        $user->forceFill([
            'password' => $validated['password'],
            'password_changed_at' => now(),
        ])->save();

        // Every other device must authenticate again with the new password.
        $currentId = $user->currentAccessToken()?->id;
        $user->tokens()->when($currentId, fn ($query) => $query->where('id', '!=', $currentId))->delete();

        $this->audit->recordUserChange(
            eventType: 'user.password_changed',
            action: 'Changed Password',
            description: sprintf('%s changed their password and signed out other devices.', $user->name),
            subject: $user,
            severity: AuditLog::SEVERITY_WARNING,
        );

        return response()->json(['message' => 'Password updated. Your other devices have been signed out.']);
    }

    /* ------------------------------------------------------------------ */
    /* Sessions */
    /* ------------------------------------------------------------------ */

    public function sessions(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->sessionPayloads($request->user())]);
    }

    public function revokeOtherSessions(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $currentId = $user->currentAccessToken()?->id;

        $removed = $this->sessionTokens($user)
            ->when($currentId, fn ($query) => $query->where('id', '!=', $currentId))
            ->delete();

        $this->audit->recordUserChange(
            eventType: 'auth.sessions_revoked',
            action: 'Signed Out Other Devices',
            description: sprintf('%s signed out %d other device(s).', $user->name, $removed),
            subject: $user,
            severity: AuditLog::SEVERITY_WARNING,
        );

        return response()->json([
            'message' => sprintf('Signed out %d other device%s. Only this session remains active.', $removed, $removed === 1 ? '' : 's'),
            'data' => $this->sessionPayloads($user),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /* API access keys */
    /* ------------------------------------------------------------------ */

    public function apiKeys(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->apiKeyPayloads($request->user())]);
    }

    public function createApiKey(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'label' => ['required', 'string', 'min:4', 'max:100'],
            'scope' => ['required', Rule::in(['read_only', 'read_write', 'admin'])],
        ]);

        $exists = $this->apiKeyTokens($user)->get()->contains(
            fn (PersonalAccessToken $token) => strcasecmp($this->parseKeyName($token->name)['label'], $validated['label']) === 0
        );

        if ($exists) {
            return $this->validationError('label', 'A key with this label already exists.');
        }

        $prefix = 'lmp_live_'.Str::lower(Str::random(4));
        $secret = $prefix.Str::random(32);

        // The secret is stored hashed, exactly as Sanctum stores its own
        // tokens; only the prefix survives for display afterwards.
        $user->tokens()->create([
            'name' => self::API_KEY_PREFIX.$prefix.':'.$validated['label'],
            'token' => hash('sha256', $secret),
            'abilities' => match ($validated['scope']) {
                'read_only' => ['read'],
                'read_write' => ['read', 'write'],
                default => ['*'],
            },
            'ip_address' => $request->ip(),
        ]);

        $this->audit->recordUserChange(
            eventType: 'platform.api_key_created',
            action: 'Created API Access Key',
            description: sprintf('Created API key "%s" with %s scope.', $validated['label'], $validated['scope']),
            subject: $user,
            newValues: ['label' => $validated['label'], 'scope' => $validated['scope']],
            severity: $validated['scope'] === 'admin' ? AuditLog::SEVERITY_WARNING : AuditLog::SEVERITY_INFO,
        );

        return response()->json([
            'message' => sprintf('%s created. Copy the secret now — it is not shown again.', $validated['label']),
            'secret' => $secret,
            'data' => $this->apiKeyPayloads($user),
        ], Response::HTTP_CREATED);
    }

    public function revokeApiKey(Request $request, int $keyId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $token = $this->apiKeyTokens($user)->whereKey($keyId)->first();

        if (! $token) {
            return response()->json(['message' => 'API key not found.'], Response::HTTP_NOT_FOUND);
        }

        // An expired token stops authenticating at once but stays on record,
        // so the key list can still show what was revoked and when.
        $token->forceFill(['expires_at' => now()->subSecond()])->save();
        $label = $this->parseKeyName($token->name)['label'];

        $this->audit->recordUserChange(
            eventType: 'platform.api_key_revoked',
            action: 'Revoked API Access Key',
            description: sprintf('Revoked API key "%s".', $label),
            subject: $user,
            severity: AuditLog::SEVERITY_WARNING,
        );

        return response()->json([
            'message' => sprintf('%s revoked. Issue a replacement key before the integration next runs.', $label),
            'data' => $this->apiKeyPayloads($user),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /* Multi-factor authentication */
    /* ------------------------------------------------------------------ */

    /** Begins (re-)enrolment. The live factor keeps working until confirmed. */
    public function startMfaEnrolment(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $secret = $this->totp->generateSecret();

        $user->forceFill([
            'preferences' => [...($user->preferences ?? []), 'pending_mfa_secret' => Crypt::encryptString($secret)],
        ])->save();

        return response()->json([
            'secret' => $secret,
            'uri' => $this->totp->provisioningUri($secret, $user->email, config('app.name', 'Lincoln Platform')),
        ]);
    }

    public function confirmMfaEnrolment(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate(['code' => ['required', 'string', 'max:20']]);

        $pending = $user->preferences['pending_mfa_secret'] ?? null;

        if (! $pending) {
            return $this->validationError('code', 'Start enrolment first to receive a setup key.');
        }

        $secret = Crypt::decryptString($pending);

        if (! $this->totp->verify($secret, $validated['code'])) {
            return $this->validationError('code', 'That code is not valid. Check your authenticator and try again.');
        }

        $preferences = $user->preferences ?? [];
        unset($preferences['pending_mfa_secret']);

        $codes = $this->generateRecoveryCodes();

        $user->forceFill([
            'mfa_secret' => $secret,
            'mfa_enabled' => true,
            'mfa_enrolled_at' => now(),
            'mfa_recovery_codes' => array_map(fn (string $code) => Hash::make($code), $codes),
            'preferences' => $preferences,
        ])->save();

        $this->audit->recordUserChange(
            eventType: 'user.mfa_enrolled',
            action: 'Enrolled Authenticator',
            description: sprintf('%s enrolled a new authenticator.', $user->name),
            subject: $user,
        );

        return response()->json([
            'message' => 'Authenticator replaced. Your previous factor no longer works.',
            'recoveryCodes' => $codes,
            'data' => $this->accountPayload($user->fresh()),
        ]);
    }

    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->mfa_enabled) {
            return response()->json(['message' => 'Enrol an authenticator before generating recovery codes.'], Response::HTTP_CONFLICT);
        }

        $codes = $this->generateRecoveryCodes();

        $user->forceFill([
            'mfa_recovery_codes' => array_map(fn (string $code) => Hash::make($code), $codes),
        ])->save();

        $this->audit->recordUserChange(
            eventType: 'user.recovery_codes_regenerated',
            action: 'Regenerated Recovery Codes',
            description: sprintf('%s regenerated their MFA recovery codes.', $user->name),
            subject: $user,
            severity: AuditLog::SEVERITY_WARNING,
        );

        return response()->json([
            'recoveryCodes' => $codes,
            'data' => $this->accountPayload($user->fresh()),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /* Payload builders */
    /* ------------------------------------------------------------------ */

    /** @return array<string, mixed> */
    private function accountPayload(User $user): array
    {
        $preferences = $user->preferences ?? [];
        $expiryDays = (int) PlatformSetting::valueOf('password_expiry_days', 90);
        $changedAt = $user->password_changed_at ?? $user->created_at;

        return [
            'profile' => [
                'fullName' => $user->name,
                'jobTitle' => $preferences['job_title'] ?? '',
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'timezone' => $preferences['timezone'] ?? 'Africa/Lagos (GMT+1)',
                'language' => $preferences['language'] ?? 'English (Nigeria)',
                'dateFormat' => $preferences['date_format'] ?? 'DD/MM/YYYY',
            ],
            'notifications' => array_merge(self::DEFAULT_NOTIFICATIONS, $preferences['notifications'] ?? []),
            'summary' => [
                'role' => 'SuperAdmin (unrestricted)',
                'tenantCount' => School::count(),
                'createdOn' => $user->created_at?->toDateString(),
                'lastSignIn' => $user->last_login_at?->format('Y-m-d H:i'),
                'lastSignInIp' => $user->last_login_ip,
            ],
            'security' => [
                'mfaEnabled' => (bool) $user->mfa_enabled,
                'mfaEnrolledOn' => $user->mfa_enrolled_at?->toDateString(),
                'recoveryCodesRemaining' => count($user->mfa_recovery_codes ?? []),
                'passwordChangedDaysAgo' => $changedAt ? (int) $changedAt->diffInDays(now()) : null,
                'passwordExpiresInDays' => $expiryDays > 0 && $changedAt
                    ? max(0, $expiryDays - (int) $changedAt->diffInDays(now()))
                    : null,
            ],
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function sessionPayloads(User $user): array
    {
        $currentId = $user->currentAccessToken()?->id;

        return $this->sessionTokens($user)
            ->orderByDesc('last_used_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PersonalAccessToken $token) => [
                'id' => $token->id,
                'device' => $this->describeDevice($token->user_agent),
                'location' => $token->ip_address ? 'IP '.$token->ip_address : 'Unknown location',
                'ip' => $token->ip_address ?? '—',
                'seen' => $token->id === $currentId
                    ? 'Current session'
                    : ($token->last_used_at ?? $token->created_at)->diffForHumans(),
                'current' => $token->id === $currentId,
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function apiKeyPayloads(User $user): array
    {
        return $this->apiKeyTokens($user)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (PersonalAccessToken $token) {
                $parsed = $this->parseKeyName($token->name);
                $abilities = $token->abilities ?? [];

                return [
                    'id' => $token->id,
                    'label' => $parsed['label'],
                    'prefix' => $parsed['prefix'],
                    'scope' => in_array('*', $abilities, true) ? 'admin' : (in_array('write', $abilities, true) ? 'read_write' : 'read_only'),
                    'createdOn' => $token->created_at?->toDateString(),
                    'lastUsed' => $token->last_used_at?->format('Y-m-d H:i') ?? 'Never',
                    'status' => $token->expires_at && $token->expires_at->isPast() ? 'revoked' : 'active',
                ];
            })
            ->values()
            ->all();
    }

    /** Tokens that represent signed-in devices rather than API keys. */
    private function sessionTokens(User $user)
    {
        return $user->tokens()->where('name', 'not like', self::API_KEY_PREFIX.'%');
    }

    private function apiKeyTokens(User $user)
    {
        return $user->tokens()->where('name', 'like', self::API_KEY_PREFIX.'%');
    }

    /** @return array{prefix: string, label: string} */
    private function parseKeyName(string $name): array
    {
        $parts = explode(':', Str::after($name, self::API_KEY_PREFIX), 2);

        return ['prefix' => $parts[0] ?? '', 'label' => $parts[1] ?? ($parts[0] ?? '')];
    }

    private function describeDevice(?string $userAgent): string
    {
        if (! $userAgent) {
            return 'Unknown device';
        }

        $browser = match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            str_contains($userAgent, 'Safari/') => 'Safari',
            str_contains($userAgent, 'curl') => 'curl',
            default => 'Browser',
        };

        $system = match (true) {
            str_contains($userAgent, 'Windows') => 'Windows',
            str_contains($userAgent, 'iPhone') => 'iPhone',
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'Mac OS') => 'macOS',
            str_contains($userAgent, 'Linux') => 'Linux',
            default => null,
        };

        return $system ? "{$browser} on {$system}" : $browser;
    }

    /** @return list<string> */
    private function generateRecoveryCodes(): array
    {
        return array_map(
            fn () => strtoupper(Str::random(5).'-'.Str::random(5)),
            range(1, 8)
        );
    }

    private function validationError(string $field, string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'errors' => [$field => [$message]],
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
