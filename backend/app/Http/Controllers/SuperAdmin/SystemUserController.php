<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SuperAdmin\SystemUserResource;
use App\Models\AuditLog;
use App\Models\School;
use App\Models\User;
use App\Services\SuperAdmin\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * GROUP 4: SuperAdmin Module - cross-tenant identity directory.
 *
 * Reads every account on the platform regardless of tenant, and handles the
 * session revocation controls the directory exposes.
 */
class SystemUserController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** Paginated directory of every account across all tenants. */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['sometimes', 'string'],
            'status' => ['sometimes', 'string'],
            'school_code' => ['sometimes', 'string'],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $users = User::query()
            ->with('school:id,name,code')
            ->role($validated['role'] ?? null)
            ->status($validated['status'] ?? null)
            ->tenant($validated['school_code'] ?? null)
            ->search($validated['search'] ?? null)
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 25)
            ->withQueryString();

        return SystemUserResource::collection($users)
            ->additional(['meta' => ['roleCounts' => $this->roleCounts(), 'tenants' => $this->tenantOptions()]])
            ->response();
    }

    /** One account record. */
    public function show(User $user): JsonResponse
    {
        return (new SystemUserResource($user->load('school')))->response();
    }

    /** Revokes every active session held by one account. */
    public function revokeSessions(User $user): JsonResponse
    {
        $user->tokens()->delete();

        $this->audit->recordUserChange(
            eventType: 'auth.sessions_revoked',
            action: 'Revoked Account Sessions',
            description: sprintf('Active sessions revoked for %s.', $user->email),
            subject: $user,
            severity: AuditLog::SEVERITY_WARNING,
        );

        return response()->json([
            'message' => sprintf('Active sessions revoked for %s. They must sign in again.', $user->name),
        ]);
    }

    /**
     * Revokes every session on the platform, including the caller's own other
     * devices. The current access token is preserved so the operator is not
     * locked out of the action they just performed.
     */
    public function revokeAllSessions(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()?->currentAccessToken()?->id;

        $revoked = DB::table('personal_access_tokens')
            ->when($currentTokenId, fn ($query) => $query->where('id', '!=', $currentTokenId))
            ->delete();

        $this->audit->record(
            eventType: 'auth.all_sessions_revoked',
            action: 'Revoked All Platform Sessions',
            description: sprintf('Revoked %d active session(s) across every tenant.', $revoked),
            severity: AuditLog::SEVERITY_CRITICAL,
        );

        return response()->json([
            'message' => sprintf(
                'Revoked %d active session%s across every tenant. Users must sign in again.',
                $revoked,
                $revoked === 1 ? '' : 's'
            ),
            'revoked' => $revoked,
        ]);
    }

    /** @return array<string, int> */
    private function roleCounts(): array
    {
        $counts = User::query()
            ->select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');

        return [
            'superadmin' => (int) ($counts[User::ROLE_SUPERADMIN] ?? 0),
            'admin' => (int) ($counts[User::ROLE_ADMIN] ?? 0),
            'teacher' => (int) ($counts[User::ROLE_TEACHER] ?? 0),
            'student' => (int) ($counts[User::ROLE_STUDENT] ?? 0),
        ];
    }

    /** @return array<int, array<string, string>> */
    private function tenantOptions(): array
    {
        return School::query()
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn (School $school) => ['code' => $school->code, 'name' => $school->name])
            ->all();
    }
}
