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
        Schema::create('school_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->date('metric_date');
            $table->unsignedInteger('student_count')->default(0);
            $table->unsignedInteger('teacher_count')->default(0);
            $table->unsignedInteger('admin_count')->default(0);
            $table->unsignedInteger('courses_count')->default(0);
            $table->unsignedInteger('classes_count')->default(0);
            $table->decimal('attendance_rate_percent', 5, 2)->default(0.00);
            $table->decimal('storage_used_mb', 10, 2)->default(0.00);
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'metric_date']);
            $table->index('metric_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_metrics');
    }
};
