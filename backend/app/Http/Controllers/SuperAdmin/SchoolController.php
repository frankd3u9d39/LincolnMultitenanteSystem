<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreSchoolRequest;
use App\Http\Requests\SuperAdmin\UpdateStorageQuotaRequest;
use App\Http\Resources\SuperAdmin\SchoolResource;
use App\Models\School;
use App\Services\SuperAdmin\TenantProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * GROUP 4: SuperAdmin Module - tenant registry.
 *
 * Operates across every tenant boundary; no school_id scoping applies here.
 */
class SchoolController extends Controller
{
    public function __construct(private readonly TenantProvisioningService $provisioning) {}

    /** Paginated tenant registry with status filtering, search and sorting. */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string'],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort' => ['sometimes', 'string', 'in:name,students,storage,created'],
            'direction' => ['sometimes', 'string', 'in:asc,desc'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $direction = $validated['direction'] ?? 'desc';

        $query = School::query()
            ->with(['latestMetric', 'administrators'])
            ->status($validated['status'] ?? null)
            ->search($validated['search'] ?? null);

        $query = match ($validated['sort'] ?? 'storage') {
            'name' => $query->orderBy('name', $direction),
            'storage' => $query->orderBy('storage_used_mb', $direction),
            'created' => $query->orderBy('created_at', $direction),
            // Enrolment lives on the metrics snapshot, so sort through a subquery.
            'students' => $query->orderBy(
                School::query()
                    ->selectRaw('coalesce(max(student_count), 0)')
                    ->from('school_metrics')
                    ->whereColumn('school_metrics.school_id', 'schools.id'),
                $direction
            ),
            default => $query->orderBy('storage_used_mb', $direction),
        };

        $schools = $query->paginate($validated['per_page'] ?? 25)->withQueryString();

        return SchoolResource::collection($schools)
            ->additional(['meta' => ['filters' => $validated]])
            ->response();
    }

    /** Provisions a new tenant boundary and its principal administrator. */
    public function store(StoreSchoolRequest $request): JsonResponse
    {
        $result = $this->provisioning->provision($request->validated());

        return response()->json([
            'message' => sprintf(
                '%s provisioned as %s with a %d GB storage quota.',
                $result['school']->name,
                $result['school']->code,
                $result['school']->storage_limit_gb
            ),
            'data' => new SchoolResource($result['school']->load(['latestMetric', 'administrators'])),
        ], Response::HTTP_CREATED);
    }

    /** One tenant, with its metrics and administrator roster. */
    public function show(School $school): JsonResponse
    {
        return (new SchoolResource($school->load(['latestMetric', 'administrators'])))
            ->response();
    }

    /** Raises or lowers a tenant's storage ceiling. */
    public function updateQuota(UpdateStorageQuotaRequest $request, School $school): JsonResponse
    {
        try {
            $updated = $this->provisioning->changeStorageQuota(
                $school,
                $request->integer('storage_quota_gb')
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => ['storage_quota_gb' => [$exception->getMessage()]],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json([
            'message' => sprintf('%s storage quota set to %d GB.', $updated->name, $updated->storage_limit_gb),
            'data' => new SchoolResource($updated->load(['latestMetric', 'administrators'])),
        ]);
    }

    /** Suspends a tenant, blocking every sign-in inside that boundary. */
    public function suspend(Request $request, School $school): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        if ($school->isSuspended()) {
            return response()->json([
                'message' => 'This tenant is already suspended.',
            ], Response::HTTP_CONFLICT);
        }

        $updated = $this->provisioning->suspend($school, $validated['reason'] ?? null);

        return response()->json([
            'message' => sprintf('%s suspended. All campus sign-ins are now blocked.', $updated->name),
            'data' => new SchoolResource($updated->load(['latestMetric', 'administrators'])),
        ]);
    }

    /** Returns a suspended tenant to active service. */
    public function reinstate(School $school): JsonResponse
    {
        if (! $school->isSuspended()) {
            return response()->json([
                'message' => 'This tenant is not suspended.',
            ], Response::HTTP_CONFLICT);
        }

        $updated = $this->provisioning->reinstate($school);

        return response()->json([
            'message' => sprintf('%s reinstated. Campus portals are reachable again.', $updated->name),
            'data' => new SchoolResource($updated->load(['latestMetric', 'administrators'])),
        ]);
    }
}
