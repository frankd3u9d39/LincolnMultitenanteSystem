<?php

namespace App\Services\SuperAdmin;

use App\Models\User;

/**
 * GROUP 4: SuperAdmin Module - the capabilities a school administrator can hold.
 *
 * The catalogue and its per-title defaults live here so the server, not the
 * browser, decides what exists. An administrator's own list of granted
 * capabilities (users.permissions) overrides the defaults for their title.
 */
class AdminCapabilities
{
    public const PRINCIPAL = 'principal_admin';

    public const DEPUTY = 'deputy_admin';

    public const BURSAR = 'bursar';

    public const REGISTRAR = 'registrar';

    /**
     * @var array<int, array{group: string, capabilities: array<int, array{key: string, label: string, description: string, defaults: list<string>, locked?: bool}>}>
     */
    private const CATALOGUE = [
        [
            'group' => 'People',
            'capabilities' => [
                ['key' => 'students.manage', 'label' => 'Manage students', 'description' => 'Enrol, edit, and withdraw student records.', 'defaults' => [self::PRINCIPAL, self::DEPUTY, self::REGISTRAR]],
                ['key' => 'staff.manage', 'label' => 'Manage staff', 'description' => 'Add teachers and assign them to classes.', 'defaults' => [self::PRINCIPAL, self::DEPUTY]],
                ['key' => 'admins.invite', 'label' => 'Invite administrators', 'description' => 'Create further administrator accounts for this school.', 'defaults' => [self::PRINCIPAL], 'locked' => true],
            ],
        ],
        [
            'group' => 'Academics',
            'capabilities' => [
                ['key' => 'results.publish', 'label' => 'Publish results', 'description' => 'Release examination results to students and guardians.', 'defaults' => [self::PRINCIPAL, self::REGISTRAR]],
                ['key' => 'timetable.edit', 'label' => 'Edit timetable', 'description' => 'Change class scheduling and room allocation.', 'defaults' => [self::PRINCIPAL, self::DEPUTY]],
                ['key' => 'courses.manage', 'label' => 'Manage courses', 'description' => 'Create subjects, courses, and departments.', 'defaults' => [self::PRINCIPAL, self::DEPUTY, self::REGISTRAR]],
            ],
        ],
        [
            'group' => 'Finance',
            'capabilities' => [
                ['key' => 'fees.configure', 'label' => 'Configure fees', 'description' => 'Set fee structures and payment deadlines.', 'defaults' => [self::PRINCIPAL, self::BURSAR]],
                ['key' => 'payments.reconcile', 'label' => 'Reconcile payments', 'description' => 'Match incoming payments against student invoices.', 'defaults' => [self::PRINCIPAL, self::BURSAR]],
                ['key' => 'refunds.approve', 'label' => 'Approve refunds', 'description' => 'Authorise outgoing refunds from the school account.', 'defaults' => [self::PRINCIPAL]],
            ],
        ],
        [
            'group' => 'School Administration',
            'capabilities' => [
                ['key' => 'settings.edit', 'label' => 'Edit school settings', 'description' => 'Branding, sessions, grading scales, and policies.', 'defaults' => [self::PRINCIPAL]],
                ['key' => 'reports.export', 'label' => 'Export reports', 'description' => 'Download school-wide academic and financial reports.', 'defaults' => [self::PRINCIPAL, self::DEPUTY, self::BURSAR, self::REGISTRAR]],
                ['key' => 'audit.view', 'label' => 'View audit log', 'description' => 'Read the activity trail for this tenant boundary.', 'defaults' => [self::PRINCIPAL, self::DEPUTY]],
            ],
        ],
    ];

    /** The catalogue, shaped for the permission matrix. */
    public function groups(): array
    {
        return array_map(fn (array $group) => [
            'group' => $group['group'],
            'capabilities' => array_map(fn (array $capability) => [
                'key' => $capability['key'],
                'label' => $capability['label'],
                'description' => $capability['description'],
                'defaultRoles' => $capability['defaults'],
                'locked' => $capability['locked'] ?? false,
            ], $group['capabilities']),
        ], self::CATALOGUE);
    }

    /** @return list<string> */
    public function keys(): array
    {
        return collect(self::CATALOGUE)->pluck('capabilities')->flatten(1)->pluck('key')->all();
    }

    /** Capabilities that can never be taken from a principal administrator. */
    public function lockedFor(?string $title): array
    {
        if (($title ?? self::PRINCIPAL) !== self::PRINCIPAL) {
            return [];
        }

        return collect(self::CATALOGUE)->pluck('capabilities')->flatten(1)
            ->filter(fn (array $capability) => $capability['locked'] ?? false)
            ->pluck('key')
            ->all();
    }

    /** @return list<string> */
    public function defaultsFor(?string $title): array
    {
        $title ??= self::PRINCIPAL;

        return collect(self::CATALOGUE)->pluck('capabilities')->flatten(1)
            ->filter(fn (array $capability) => in_array($title, $capability['defaults'], true))
            ->pluck('key')
            ->all();
    }

    /** What this administrator can do now: their override, or the title's defaults. */
    public function grantedFor(User $user): array
    {
        return $user->permissions ?? $this->defaultsFor($user->admin_role);
    }
}
