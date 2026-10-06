<?php

namespace App\Http\Requests\SuperAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** GROUP 4: SuperAdmin Module - administrator invitation validation. */
class InviteAdministratorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_SUPERADMIN;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'min:3', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['required', 'string', 'min:7', 'max:50'],
            'school_code' => ['required', 'string', Rule::exists('schools', 'code')],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_TEACHER])],
            'require_mfa' => ['sometimes', 'boolean'],
            'message' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.unique' => 'An account with this email already exists.',
            'school_code.exists' => 'That tenant boundary does not exist.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->email) {
            $this->merge(['email' => strtolower(trim($this->email))]);
        }
    }
}
