<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdatePlatformSettingsRequest;
use App\Models\AuditLog;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\SuperAdmin\AuditLogger;
use App\Services\SuperAdmin\BackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * GROUP 4: SuperAdmin Module - global platform configuration.
 *
 * Settings are grouped by category so the settings screen can render one tab
 * per group without knowing the key list in advance.
 */
class PlatformSettingController extends Controller
{
    /**
     * Value rules for the settings that need more than their data type, so a
     * nonsensical value cannot be saved through the API.
     *
     * @var array<string, list<string>>
     */
    private const VALUE_RULES = [
        'support_email' => ['email'],
        'sender_email' => ['email'],
        'min_password_length' => ['integer', 'min:6', 'max:64'],
        'password_expiry_days' => ['integer', 'min:0', 'max:730'],
        'session_timeout_minutes' => ['integer', 'min:5', 'max:1440'],
        'max_failed_logins' => ['integer', 'min:1', 'max:20'],
        'lockout_duration_minutes' => ['integer', 'min:1', 'max:1440'],
        'auto_suspend_inactive_days' => ['integer', 'min:0', 'max:3650'],
        'max_students' => ['integer', 'min:1', 'max:1000000'],
        'max_teachers' => ['integer', 'min:1', 'max:100000'],
        'storage_quota_gb' => ['integer', 'min:1', 'max:100000'],
        'max_file_upload_mb' => ['integer', 'min:1', 'max:2048'],
        'smtp_port' => ['integer', 'min:1', 'max:65535'],
        'backup_retention_days' => ['integer', 'min:1', 'max:3650'],
        'onboarding_mode' => ['in:invitation_only,approval_required,open_registration'],
        'mail_driver' => ['in:smtp,ses,sendgrid,mailgun'],
        'smtp_encryption' => ['in:tls,ssl,none'],
        'storage_driver' => ['in:local,s3,r2,gcs'],
        'auto_backup_schedule' => ['in:hourly,daily,weekly'],
    ];

    public function __construct(
        private readonly AuditLogger $audit,
        private readonly BackupService $backups,
    ) {}

    /** Every setting, grouped by category, with values already coerced. */
    public function index(): JsonResponse
    {
        $grouped = PlatformSetting::query()
            ->orderBy('category')
            ->orderBy('key_name')
            ->get()
            ->groupBy('category')
            ->map(fn ($settings) => $settings->map(fn (PlatformSetting $setting) => [
                'key' => $setting->key_name,
                'displayName' => $setting->display_name,
                // Encrypted values never leave the server; the flag says whether one is set.
                'value' => $setting->is_encrypted ? null : $setting->typed_value,
                'dataType' => $setting->data_type,
                'description' => $setting->description,
                'isEncrypted' => $setting->is_encrypted,
                'isSet' => $setting->is_encrypted ? $setting->has_value : null,
            ])->values());

        return response()->json(['data' => $grouped]);
    }

    /** Applies a batch of setting changes in one transaction. */
    public function update(UpdatePlatformSettingsRequest $request): JsonResponse
    {
        $changes = $request->validated()['settings'];

        $applied = DB::transaction(function () use ($changes) {
            $diff = [];

            foreach ($changes as $index => $change) {
                $setting = PlatformSetting::where('key_name', $change['key_name'])->firstOrFail();

                // A blank secret means "leave it as it is", so saving the form
                // without retyping the SMTP password does not erase it.
                if ($setting->is_encrypted && ($change['value'] === null || $change['value'] === '')) {
                    continue;
                }

                $this->validateValue($setting, $change['value'], $index);

                $previous = $setting->typed_value;

                $setting->setTypedValue($change['value']);
                $setting->save();

                if ($previous !== $setting->typed_value) {
                    $diff[$setting->key_name] = [
                        'from' => $setting->is_encrypted ? '[redacted]' : $previous,
                        'to' => $setting->is_encrypted ? '[redacted]' : $setting->typed_value,
                    ];
                }
            }

            // Turning on the IP allow-list without your own address on it would
            // end your access mid-save, so that combination is refused.
            if (PlatformSetting::valueOf('ip_whitelist_enabled', false)
                && ! in_array(request()->ip(), PlatformSetting::addressList('allowed_superadmin_ips'), true)) {
                throw ValidationException::withMessages([
                    'settings' => [sprintf('Your current address (%s) must be on the SuperAdmin allow-list before you can enable it.', request()->ip())],
                ]);
            }

            return $diff;
        });

        if ($applied !== []) {
            $this->audit->record(
                eventType: 'platform.settings_updated',
                action: 'Updated Platform Settings',
                description: sprintf('Updated %d platform setting(s): %s.', count($applied), implode(', ', array_keys($applied))),
                newValues: $applied,
            );
        }

        return response()->json([
            'message' => $applied === []
                ? 'No changes to apply.'
                : 'Configuration saved. Changes have been written to the platform audit trail.',
            'changed' => array_keys($applied),
        ]);
    }

    /** Sends a real message through the configured SMTP relay to the caller. */
    public function testEmail(): JsonResponse
    {
        /** @var User $user */
        $user = request()->user();

        $driver = (string) PlatformSetting::valueOf('mail_driver', 'smtp');

        if ($driver !== 'smtp') {
            return response()->json([
                'message' => sprintf('The "%s" driver needs its provider package installed. Switch to SMTP to send a test message.', $driver),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $host = (string) PlatformSetting::valueOf('smtp_host', '');
        $port = (int) PlatformSetting::valueOf('smtp_port', 587);

        if ($host === '') {
            return response()->json(['message' => 'Set an SMTP host before sending a test message.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        config(['mail.mailers.platform_test' => [
            'transport' => 'smtp',
            'scheme' => PlatformSetting::valueOf('smtp_encryption', 'tls') === 'ssl' ? 'smtps' : 'smtp',
            'host' => $host,
            'port' => $port,
            'username' => PlatformSetting::valueOf('smtp_username') ?: null,
            'password' => PlatformSetting::valueOf('smtp_password') ?: null,
            'timeout' => 8,
        ]]);

        $fromAddress = (string) PlatformSetting::valueOf('sender_email', config('mail.from.address'));
        $fromName = (string) PlatformSetting::valueOf('sender_name', config('mail.from.name'));

        try {
            Mail::mailer('platform_test')->raw(
                'This is a test message from the Lincoln platform. If you can read it, outbound mail is working.',
                function ($message) use ($user, $fromAddress, $fromName) {
                    $message->to($user->email)->from($fromAddress, $fromName)->subject('Lincoln platform test message');
                }
            );
        } catch (\Throwable $exception) {
            $this->audit->record(
                eventType: 'platform.mail_test_failed',
                action: 'Mail Test Failed',
                description: sprintf('Test message through %s:%d failed.', $host, $port),
                severity: AuditLog::SEVERITY_WARNING,
            );

            return response()->json([
                'message' => sprintf('Could not deliver through %s:%d. %s', $host, $port, $this->summarise($exception)),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->audit->record(
            eventType: 'platform.mail_test_sent',
            action: 'Mail Test Sent',
            description: sprintf('Test message sent to %s through %s:%d.', $user->email, $host, $port),
        );

        return response()->json([
            'message' => sprintf('Test message delivered to %s through %s:%d.', $user->email, $host, $port),
        ]);
    }

    /** Takes a snapshot now and records its outcome as the last backup. */
    public function backup(): JsonResponse
    {
        $result = $this->backups->snapshot();

        if (! $result['ok']) {
            $this->audit->record(
                eventType: 'platform.backup_failed',
                action: 'Backup Failed',
                description: $result['message'],
                severity: AuditLog::SEVERITY_WARNING,
            );

            return response()->json(['message' => $result['message']], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $summary = sprintf(
            '%s UTC (Success - %s)',
            now()->utc()->format('Y-m-d H:i:s'),
            $this->humanSize($result['size_bytes'])
        );

        PlatformSetting::updateOrCreate(
            ['key_name' => 'last_backup_timestamp'],
            ['category' => 'storage', 'display_name' => 'Last Backup', 'value' => $summary, 'data_type' => 'string']
        );

        $this->audit->record(
            eventType: 'platform.backup_completed',
            action: 'Backup Completed',
            description: sprintf('Snapshot %s written (%s).', $result['file'], $this->humanSize($result['size_bytes'])),
            newValues: ['file' => $result['file'], 'size_bytes' => $result['size_bytes']],
        );

        return response()->json([
            'message' => sprintf('Snapshot %s written (%s).', $result['file'], $this->humanSize($result['size_bytes'])),
            'lastBackup' => $summary,
        ]);
    }

    /**
     * @throws ValidationException
     */
    private function validateValue(PlatformSetting $setting, mixed $value, int $index): void
    {
        $typeRules = match ($setting->data_type) {
            'boolean' => ['boolean'],
            'integer' => ['integer'],
            default => ['nullable', 'string', 'max:5000'],
        };

        $rules = [...$typeRules, ...(self::VALUE_RULES[$setting->key_name] ?? [])];

        Validator::make(['value' => $value], ['value' => $rules], [], ['value' => $setting->display_name])
            ->after(function ($validator) use ($index) {
                // Report against the same path the request used.
                foreach ($validator->errors()->get('value') as $message) {
                    $validator->errors()->add("settings.{$index}.value", $message);
                }
            })
            ->validate();
    }

    private function summarise(\Throwable $exception): string
    {
        $message = trim(preg_replace('/\s+/', ' ', $exception->getMessage()) ?? '');

        return $message === '' ? 'Check the host, port and credentials.' : Str::limit($message, 180);
    }

    private function humanSize(int $bytes): string
    {
        return match (true) {
            $bytes >= 1024 ** 3 => number_format($bytes / 1024 ** 3, 1).' GB',
            $bytes >= 1024 ** 2 => number_format($bytes / 1024 ** 2, 1).' MB',
            default => number_format($bytes / 1024, 1).' KB',
        };
    }
}
