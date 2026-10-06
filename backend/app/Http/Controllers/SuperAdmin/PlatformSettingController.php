<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdatePlatformSettingsRequest;
use App\Models\PlatformSetting;
use App\Services\SuperAdmin\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * GROUP 4: SuperAdmin Module - global platform configuration.
 *
 * Settings are grouped by category so the settings screen can render one tab
 * per group without knowing the key list in advance.
 */
class PlatformSettingController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

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
                'value' => $setting->is_encrypted ? null : $setting->typed_value,
                'dataType' => $setting->data_type,
                'description' => $setting->description,
                'isEncrypted' => $setting->is_encrypted,
            ])->values());

        return response()->json(['data' => $grouped]);
    }

    /** Applies a batch of setting changes in one transaction. */
    public function update(UpdatePlatformSettingsRequest $request): JsonResponse
    {
        $changes = $request->validated()['settings'];

        $applied = DB::transaction(function () use ($changes) {
            $diff = [];

            foreach ($changes as $change) {
                $setting = PlatformSetting::where('key_name', $change['key_name'])->firstOrFail();
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
                : 'Preferences saved. Changes have been written to the platform audit trail.',
            'changed' => array_keys($applied),
        ]);
    }
}
