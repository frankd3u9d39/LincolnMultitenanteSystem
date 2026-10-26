<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** GROUP 4: SuperAdmin Module - platform configuration validation. */
class UpdatePlatformSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_SUPERADMIN;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'settings' => ['required', 'array', 'min:1'],
            'settings.*.key_name' => ['required', 'string', Rule::exists('platform_settings', 'key_name')],
            'settings.*.value' => ['present'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'settings.*.key_name.exists' => 'Unknown platform setting key.',
        ];
    }
}
