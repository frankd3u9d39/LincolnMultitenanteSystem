<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Group 4: record the platform telemetry snapshot once a day, just before midnight.
Schedule::command('telemetry:capture')->dailyAt('23:55');
