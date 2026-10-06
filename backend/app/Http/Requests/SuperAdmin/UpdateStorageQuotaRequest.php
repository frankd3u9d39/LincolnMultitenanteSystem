<?php

namespace App\Http\Requests\SuperAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/** GROUP 4: SuperAdmin Module - tenant storage ceiling validation. */
class UpdateStorageQuotaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_SUPERADMIN;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'storage_quota_gb' => ['required', 'integer', 'min:1', 'max:10000'],
        ];
    }
}
