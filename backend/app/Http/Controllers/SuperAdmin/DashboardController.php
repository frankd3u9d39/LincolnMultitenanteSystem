<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SuperAdmin\AuditLogResource;
use App\Models\SystemAlert;
use App\Services\SuperAdmin\PlatformMetricsService;
use Illuminate\Http\JsonResponse;

/**
 * GROUP 4: SuperAdmin Module - platform overview.
 *
 * Returns the headline counters, the live security feed and infrastructure
 * vitals that the dashboard renders in one round trip.
 */
class DashboardController extends Controller
{
    public function __construct(private readonly PlatformMetricsService $metrics) {}

    public function index(): JsonResponse
    {
        $overview = $this->metrics->overview();

        return response()->json([
            'data' => [
                'tenants' => $overview['tenants'],
                'population' => $overview['population'],
                'storage' => $overview['storage'],
                'infrastructure' => $overview['infrastructure'],
                'recentActivity' => AuditLogResource::collection($this->metrics->recentActivity()),
                'alerts' => SystemAlert::query()->live()->latest()->limit(5)->get(['id', 'title', 'message', 'alert_type']),
            ],
        ]);
    }
}
