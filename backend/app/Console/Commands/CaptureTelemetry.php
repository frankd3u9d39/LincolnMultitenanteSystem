<?php

namespace App\Console\Commands;

use App\Services\SuperAdmin\PlatformMetricsService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * GROUP 4: SuperAdmin Module - records the day's platform telemetry.
 *
 * Counts tenants, accounts, active users and storage from the live tables.
 * Infrastructure vitals (CPU, memory, latency) need an APM agent to measure,
 * so the command leaves those columns exactly as they are.
 */
class CaptureTelemetry extends Command
{
    protected $signature = 'telemetry:capture {--date= : Day to record, defaults to today}';

    protected $description = 'Record the platform telemetry snapshot for a day';

    public function handle(PlatformMetricsService $metrics): int
    {
        $date = $this->option('date') ? Carbon::parse($this->option('date')) : now();

        $row = $metrics->captureDailyTelemetry($date);

        $this->info(sprintf(
            'Telemetry for %s: %d active, %d pending, %d suspended schools; %d users active today.',
            $row->metric_date->toDateString(),
            $row->active_schools_count,
            $row->pending_schools_count,
            $row->suspended_schools_count,
            $row->daily_active_users
        ));

        return self::SUCCESS;
    }
}
