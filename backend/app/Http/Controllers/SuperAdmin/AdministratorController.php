<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\InviteAdministratorRequest;
use App\Http\Resources\SuperAdmin\AdministratorResource;
use App\Models\AuditLog;
use App\Models\School;
use App\Models\User;
use App\Services\SuperAdmin\AuditLogger;
use App\Services\SuperAdmin\PlatformMetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * GROUP 4: SuperAdmin Module - privileged tenant accounts.
 *
 * Covers the administrator directory, invitations, access posture reporting
 * and the bulk security actions the directory exposes.
 */
class AdministratorController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly PlatformMetricsService $metrics,
    ) {}

    /** Administrator directory, filterable by status, role and MFA gap. */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string'],
            'role' => ['sometimes', 'string'],
            'school_code' => ['sometimes', 'string'],
            'mfa_gap_only' => ['sometimes', 'boolean'],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $administrators = User::query()
            ->with('school:id,name,code')
            ->where('role', User::ROLE_ADMIN)
            ->status($validated['status'] ?? null)
            ->tenant($validated['school_code'] ?? null)
            ->search($validated['search'] ?? null)
            ->when(
                filter_var($validated['mfa_gap_only'] ?? false, FILTER_VALIDATE_BOOLEAN),
                fn ($query) => $query->where('mfa_enabled', false)
            )
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 25)
            ->withQueryString();

        return AdministratorResource::collection($administrators)->response();
    }

    /** Invites a new administrator into one tenant boundary. */
    public function store(InviteAdministratorRequest $request): JsonResponse
    {
        $data = $request->validated();
        $school = School::where('code', $data['school_code'])->firstOrFail();

        $administrator = User::create([
            'school_id' => $school->id,
            'name' => $data['full_name'],
            'email' => $data['email'],
            'password' => Hash::make(Str::password(16)),
            'role' => $data['role'],
            'phone' => $data['phone'],
            'status' => User::STATUS_PENDING,
            'mfa_enabled' => false,
            'invited_at' => now(),
        ]);

        $requireMfa = (bool) ($data['require_mfa'] ?? true);

        $this->audit->recordUserChange(
            eventType: 'user.invited',
            action: 'Invited School Administrator',
            description: sprintf(
                'Invited %s (%s) as an administrator of %s.%s',
                $administrator->name,
                $administrator->email,
                $school->name,
                $requireMfa ? ' MFA enrolment is required at first sign-in.' : ''
            ),
            subject: $administrator,
            newValues: [
                'role' => $administrator->role,
                'school_code' => $school->code,
                'require_mfa' => $requireMfa,
            ],
        );

        return response()->json([
            'message' => sprintf(
                'Invitation sent to %s. The account stays in an invited state until first sign-in%s.',
                $administrator->email,
                $requireMfa ? ', and MFA enrolment is required at that point' : ''
            ),
            'data' => new AdministratorResource($administrator->load('school')),
        ], Response::HTTP_CREATED);
    }

    /** One administrator account. */
    public function show(User $administrator): JsonResponse
    {
        abort_unless($administrator->role === User::ROLE_ADMIN, Response::HTTP_NOT_FOUND);

        return (new AdministratorResource($administrator->load('school')))->response();
    }

    /** Suspends or restores one administrator account. */
    public function updateStatus(Request $request, User $administrator): JsonResponse
    {
        abort_unless($administrator->role === User::ROLE_ADMIN, Response::HTTP_NOT_FOUND);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,suspended,inactive'],
        ]);

        $previous = $administrator->status;
        $administrator->update([
            'status' => $validated['status'],
            'failed_login_attempts' => $validated['status'] === User::STATUS_ACTIVE ? 0 : $administrator->failed_login_attempts,
        ]);

        $restoring = $validated['status'] === User::STATUS_ACTIVE;

        $this->audit->recordUserChange(
            eventType: $restoring ? 'user.unlocked' : 'user.suspended',
            action: $restoring ? 'Unlocked Administrator Account' : 'Suspended Administrator Account',
            description: sprintf(
                '%s %s.',
                $administrator->name,
                $restoring ? 'unlocked and able to sign in again' : 'suspended; administrator access revoked'
            ),
            subject: $administrator,
            oldValues: ['status' => $previous],
            newValues: ['status' => $administrator->status],
            severity: $restoring ? AuditLog::SEVERITY_INFO : AuditLog::SEVERITY_WARNING,
        );

        return response()->json([
            'message' => $restoring
                ? sprintf('%s unlocked and able to sign in again.', $administrator->name)
                : sprintf('%s suspended. Their administrator access is revoked.', $administrator->name),
            'data' => new AdministratorResource($administrator->load('school')),
        ]);
    }

    /** Requires MFA enrolment on a set of administrator accounts. */
    public function enforceMfa(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'administrator_ids' => ['required', 'array', 'min:1'],
            'administrator_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $administrators = User::query()
            ->whereIn('id', $validated['administrator_ids'])
            ->where('role', User::ROLE_ADMIN)
            ->get();

        foreach ($administrators as $administrator) {
            $administrator->update(['mfa_enabled' => true, 'mfa_enrolled_at' => null]);

            $this->audit->recordUserChange(
                eventType: 'user.mfa_enforced',
                action: 'Enforced MFA Enrolment',
                description: sprintf('MFA enrolment enforced on %s.', $administrator->email),
                subject: $administrator,
                newValues: ['mfa_enabled' => true],
            );
        }

        $count = $administrators->count();

        return response()->json([
            'message' => sprintf(
                'MFA enrolment enforced on %d account%s. They must register an authenticator at next sign-in.',
                $count,
                $count === 1 ? '' : 's'
            ),
            'affected' => $count,
        ]);
    }

    /** Queues password reset links for a set of administrator accounts. */
    public function sendPasswordResets(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'administrator_ids' => ['required', 'array', 'min:1'],
            'administrator_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $administrators = User::query()
            ->whereIn('id', $validated['administrator_ids'])
            ->where('role', User::ROLE_ADMIN)
            ->get();

        foreach ($administrators as $administrator) {
            $this->audit->recordUserChange(
                eventType: 'user.password_reset_sent',
                action: 'Sent Password Reset Link',
                description: sprintf('Password reset link sent to %s.', $administrator->email),
                subject: $administrator,
            );
        }

        $count = $administrators->count();

        return response()->json([
            'message' => sprintf(
                'Password reset links sent to %d administrator%s. Each link expires in 60 minutes.',
                $count,
                $count === 1 ? '' : 's'
            ),
            'affected' => $count,
        ]);
    }

    /** Access posture report: MFA coverage, dormancy and lockouts. */
    public function accessReport(): JsonResponse
    {
        $posture = $this->metrics->administratorPosture();

        return response()->json([
            'data' => [
                'snapshotDate' => now()->toDateString(),
                'total' => $posture['total'],
                'mfaEnabled' => $posture['mfa_enabled'],
                'mfaCoveragePercent' => $posture['mfa_coverage_percent'],
                'flaggedCount' => $posture['flagged_count'],
                'byTenant' => $posture['by_tenant'],
                'flagged' => collect($posture['flagged'])->map(fn (array $row) => [
                    'administrator' => new AdministratorResource($row['administrator']),
                    'flags' => $row['flags'],
                ]),
            ],
        ]);
    }
}
