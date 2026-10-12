<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\SuperAdmin\PlatformMetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 4: SuperAdmin Module - platform telemetry reporting.
 *
 * The platform is free, so reporting covers capacity and engagement rather
 * than revenue.
 */
class ReportController extends Controller
{
    public function __construct(private readonly PlatformMetricsService $metrics) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'limit' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'range' => ['sometimes', 'string', 'in:7d,30d,quarter,ytd'],
        ]);

        return response()->json([
            'data' => [
                'overview' => $this->metrics->overview(),
                'campusSizeDistribution' => $this->metrics->campusSizeDistribution(),
                'tenants' => $this->metrics->tenantReport($validated['limit'] ?? 50),
                'telemetry' => $this->metrics->telemetry($validated['range'] ?? '7d'),
                'isolation' => $this->metrics->tenantIsolationCheck(),
            ],
        ]);
    }
}
