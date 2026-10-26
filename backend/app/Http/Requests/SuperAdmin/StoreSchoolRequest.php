<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * GROUP 4: SuperAdmin Module - tenant provisioning validation.
 *
 * Mirrors the constraints the onboarding form applies in the browser so the
 * API cannot be driven into an invalid state by bypassing the UI.
 */
class StoreSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_SUPERADMIN;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:4', 'max:255'],
            'code' => [
                'required',
                'string',
                'regex:/^[A-Z]{2,6}-SMTS-\d{3}$/',
                Rule::unique('schools', 'code'),
            ],
            'domain' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9.-]+\.[a-z]{2,}$/',
                Rule::unique('schools', 'domain'),
            ],
            'city' => ['required', 'string', 'min:2', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'principal_admin' => ['required', 'string', 'min:3', 'max:255'],
            'principal_email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'principal_phone' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:8', 'max:100'],
            'storage_quota_gb' => ['required', 'integer', 'min:1', 'max:10000'],
            'max_students' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'max_teachers' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'max_file_upload_mb' => ['sometimes', 'integer', 'min:1', 'max:1024'],
            'activate_immediately' => ['sometimes', 'boolean'],
            'cbt_enabled' => ['sometimes', 'boolean'],
            'logo' => ['nullable', 'file', 'image', 'max:5120'],
            'logo_url' => ['nullable', 'string'],
            'primary_color' => ['nullable', 'string', 'max:30'],
            'secondary_color' => ['nullable', 'string', 'max:30'],
            'accent_color' => ['nullable', 'string', 'max:30'],
            'theme_palette' => ['nullable', 'string', 'max:50'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'code.regex' => 'The tenant code must use the format ABC-SMTS-001.',
            'code.unique' => 'This tenant code is already allocated.',
            'domain.regex' => 'Enter a valid domain, for example school.edu.ng.',
            'domain.unique' => 'This domain is bound to another tenant.',
            'principal_email.unique' => 'An account with this email already exists.',
            'password.min' => 'The administrator password must be at least 8 characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(array_filter([
            'code' => $this->code ? strtoupper(trim($this->code)) : null,
            'domain' => $this->domain ? strtolower(trim($this->domain)) : null,
            'principal_email' => $this->principal_email ? strtolower(trim($this->principal_email)) : null,
        ], fn ($value) => $value !== null));
    }
}
