<?php

namespace App\Services\SuperAdmin;

use App\Models\AuditLog;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * GROUP 4: SuperAdmin Module - tenant lifecycle.
 *
 * Creating a school and inviting its first administrator happen together in one
 * transaction: a tenant with no way in is not a usable tenant.
 */
class TenantProvisioningService
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * Provisions a new tenant boundary and its principal administrator.
     *
     * @param  array<string, mixed>  $data
     * @return array{school: School, administrator: User, temporary_password: string}
     */
    public function provision(array $data): array
    {
        $activateImmediately = (bool) ($data['activate_immediately'] ?? false);

        return DB::transaction(function () use ($data, $activateImmediately) {
            $logoUrl = $data['logo_url'] ?? null;
            if (isset($data['logo']) && $data['logo'] instanceof \Illuminate\Http\UploadedFile) {
                $filename = 'logo_' . \Illuminate\Support\Str::slug($data['code']) . '_' . time() . '.' . $data['logo']->getClientOriginalExtension();
                $targetDir = public_path('uploads/logos');
                if (! file_exists($targetDir)) {
                    mkdir($targetDir, 0777, true);
                }
                $data['logo']->move($targetDir, $filename);
                $logoUrl = '/uploads/logos/' . $filename;
            }

            $school = School::create([
                'name' => $data['name'],
                'code' => strtoupper($data['code']),
                'slug' => $this->uniqueSlug($data['name']),
                'domain' => $data['domain'],
                'contact_email' => $data['principal_email'],
                'contact_phone' => $data['principal_phone'] ?? null,
                'city' => $data['city'],
                'country' => $data['country'] ?? 'Nigeria',
                'logo_url' => $logoUrl,
                'primary_color' => $data['primary_color'] ?? '#B81D22',
                'secondary_color' => $data['secondary_color'] ?? '#9E1519',
                'accent_color' => $data['accent_color'] ?? '#B81D22',
                'theme_palette' => $data['theme_palette'] ?? 'crimson',
                'status' => $activateImmediately ? School::STATUS_ACTIVE : School::STATUS_PENDING,
                'storage_limit_gb' => $data['storage_quota_gb'],
                'max_students' => $data['max_students'] ?? 10000,
                'max_teachers' => $data['max_teachers'] ?? 800,
                'max_file_upload_mb' => $data['max_file_upload_mb'] ?? 50,
                'cbt_enabled' => (bool) ($data['cbt_enabled'] ?? false),
                'storage_used_mb' => 0,
                'onboarded_at' => now(),
            ]);

            $password = !empty($data['password']) ? $data['password'] : Str::password(16);

            $administrator = User::create([
                'school_id' => $school->id,
                'name' => $data['principal_admin'],
                'email' => strtolower($data['principal_email']),
                'password' => Hash::make($password),
                'role' => User::ROLE_ADMIN,
                'admin_role' => 'principal_admin',
                'phone' => $data['principal_phone'] ?? null,
                'status' => $activateImmediately ? User::STATUS_ACTIVE : User::STATUS_PENDING,
                'mfa_enabled' => false,
                'invited_at' => now(),
                'password_changed_at' => now(),
            ]);

            $this->audit->recordTenantChange(
                eventType: 'tenant.provisioned',
                action: 'Provisioned School Tenant',
                description: sprintf(
                    'Provisioned %s (%s) with a %d GB storage quota.',
                    $school->name,
                    $school->code,
                    $school->storage_limit_gb
                ),
                school: $school,
                newValues: [
                    'code' => $school->code,
                    'domain' => $school->domain,
                    'status' => $school->status,
                    'storage_limit_gb' => $school->storage_limit_gb,
                ],
            );

            return [
                'school' => $school,
                'administrator' => $administrator,
                'temporary_password' => $password,
            ];
        });
    }

    /** Suspends a tenant, blocking every sign-in inside that boundary. */
    public function suspend(School $school, ?string $reason = null): School
    {
        $previous = $school->status;
        $school->update(['status' => School::STATUS_SUSPENDED]);

        $this->audit->recordTenantChange(
            eventType: 'tenant.suspended',
            action: 'Suspended School Tenant',
            description: sprintf(
                'Suspended %s (%s).%s',
                $school->name,
                $school->code,
                $reason ? ' Reason: '.$reason : ''
            ),
            school: $school,
            oldValues: ['status' => $previous],
            newValues: ['status' => $school->status, 'reason' => $reason],
            severity: AuditLog::SEVERITY_WARNING,
        );

        return $school->fresh();
    }

    /** Returns a suspended tenant to active service. */
    public function reinstate(School $school): School
    {
        $previous = $school->status;
        $school->update(['status' => School::STATUS_ACTIVE]);

        $this->audit->recordTenantChange(
            eventType: 'tenant.reinstated',
            action: 'Reinstated School Tenant',
            description: sprintf('Reinstated %s (%s). Campus portals are reachable again.', $school->name, $school->code),
            school: $school,
            oldValues: ['status' => $previous],
            newValues: ['status' => $school->status],
        );

        return $school->fresh();
    }

    /** Changes a tenant's storage ceiling, refusing to drop below current usage. */
    public function changeStorageQuota(School $school, int $storageQuotaGb): School
    {
        $usedGb = $school->storage_used_mb / 1024;

        if ($storageQuotaGb < $usedGb) {
            throw new \InvalidArgumentException(sprintf(
                'Quota of %d GB is below the %.1f GB already stored by this school.',
                $storageQuotaGb,
                $usedGb
            ));
        }

        $previous = $school->storage_limit_gb;
        $school->update(['storage_limit_gb' => $storageQuotaGb]);

        $this->audit->recordTenantChange(
            eventType: 'tenant.quota_changed',
            action: 'Changed Tenant Storage Quota',
            description: sprintf(
                'Storage quota for %s changed from %d GB to %d GB.',
                $school->name,
                $previous,
                $storageQuotaGb
            ),
            school: $school,
            oldValues: ['storage_limit_gb' => $previous],
            newValues: ['storage_limit_gb' => $storageQuotaGb],
        );

        return $school->fresh();
    }

    /** Builds a slug that is unique across tenants, even for similar names. */
    private function uniqueSlug(string $name): string
    {
        $base = Str::slug(Str::limit($name, 60, ''));
        $slug = $base;
        $suffix = 1;

        while (School::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}
