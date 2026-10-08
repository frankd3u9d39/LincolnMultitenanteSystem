<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('platform_telemetry', function (Blueprint $table) {
            $table->id();
            $table->date('metric_date')->unique();
            $table->unsignedInteger('active_schools_count')->default(0);
            $table->unsignedInteger('trial_schools_count')->default(0);
            $table->unsignedInteger('suspended_schools_count')->default(0);
            $table->unsignedInteger('total_students_count')->default(0);
            $table->unsignedInteger('total_teachers_count')->default(0);
            $table->unsignedInteger('total_admins_count')->default(0);
            $table->unsignedInteger('daily_active_users')->default(0);
            $table->unsignedBigInteger('total_api_requests')->default(0);
            $table->decimal('avg_response_time_ms', 6, 2)->default(0.00);
            $table->decimal('server_cpu_percent', 5, 2)->default(0.00);
            $table->decimal('server_ram_percent', 5, 2)->default(0.00);
            $table->decimal('storage_used_gb', 10, 2)->default(0.00);
            $table->unsignedInteger('error_count')->default(0);
            $table->decimal('mrr_amount', 12, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_telemetry');
    }
};
