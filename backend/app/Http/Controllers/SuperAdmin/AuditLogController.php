<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SuperAdmin\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * GROUP 4: SuperAdmin Module - security audit trail.
 *
 * Read-only by design: entries are written by AuditLogger as a side effect of
 * the actions they describe, and nothing here mutates them.
 */
class AuditLogController extends Controller
{
    /** Paginated, filterable audit trail. */
    public function index(Request $request): JsonResponse
    {
        $validated = $this->validateFilters($request);

        $logs = $this->query($validated)
            ->paginate($validated['per_page'] ?? 25)
            ->withQueryString();

        return AuditLogResource::collection($logs)
            ->additional(['meta' => ['severityCounts' => $this->severityCounts(), 'headline' => $this->headline()]])
            ->response();
    }

    /** Streams the filtered trail as CSV, so large exports do not buffer. */
    public function export(Request $request): StreamedResponse
    {
        $validated = $this->validateFilters($request);
        $query = $this->query($validated);
        $fileName = 'security_audit_log_'.now()->format('Y-m-d_Hi').'.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // BOM so Excel reads the UTF-8 content correctly.
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Timestamp', 'Event Type', 'Severity', 'Actor', 'Actor Email',
                'Actor Role', 'School', 'IP Address', 'Description', 'User Agent',
            ]);

            $query->chunk(500, function ($rows) use ($handle) {
                foreach ($rows as $log) {
                    fputcsv($handle, [
                        $log->created_at?->format('Y-m-d H:i:s'),
                        $log->event_type,
                        $log->severity,
                        $log->user?->name ?? 'System',
                        $log->user?->email,
                        $log->user?->role ?? 'system',
                        $log->school?->name ?? 'Platform-wide',
                        $log->ip_address,
                        $log->description,
                        $log->user_agent,
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /** @return array<string, mixed> */
    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'severity' => ['sometimes', 'string'],
            'event_group' => ['sometimes', 'string'],
            'school_id' => ['sometimes', 'integer', 'exists:schools,id'],
            'since' => ['sometimes', 'date'],
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:200'],
        ]);
    }

    /** @param  array<string, mixed>  $filters */
    private function query(array $filters)
    {
        return AuditLog::query()
            ->with(['user:id,name,email,role', 'school:id,name,code'])
            ->severity($filters['severity'] ?? null)
            ->eventGroup($filters['event_group'] ?? null)
            ->search($filters['search'] ?? null)
            ->since($filters['since'] ?? null)
            ->when(
                isset($filters['school_id']),
                fn ($query) => $query->where('school_id', $filters['school_id'])
            )
            ->orderByDesc('created_at');
    }

    /**
     * The three figures above the audit table.
     *
     * @return array<string, int>
     */
    private function headline(): array
    {
        return [
            'totalEvents' => AuditLog::query()->count(),
            // Critical events in the last day: lockouts, mass revocations, anomalies.
            'criticalLast24h' => AuditLog::query()
                ->where('severity', AuditLog::SEVERITY_CRITICAL)
                ->where('created_at', '>=', now()->subDay())
                ->count(),
            // Changes an operator made to tenants, accounts or configuration.
            'administrativeChanges' => AuditLog::query()
                ->where(function ($query) {
                    $query->where('event_type', 'like', 'tenant.%')
                        ->orWhere('event_type', 'like', 'user.%')
                        ->orWhere('event_type', 'like', 'platform.%');
                })
                ->count(),
        ];
    }

    /** @return array<string, int> */
    private function severityCounts(): array
    {
        $counts = AuditLog::query()
            ->select('severity', DB::raw('count(*) as total'))
            ->groupBy('severity')
            ->pluck('total', 'severity');

        return [
            'info' => (int) ($counts[AuditLog::SEVERITY_INFO] ?? 0),
            'warning' => (int) ($counts[AuditLog::SEVERITY_WARNING] ?? 0),
            'critical' => (int) ($counts[AuditLog::SEVERITY_CRITICAL] ?? 0),
        ];
    }
}
