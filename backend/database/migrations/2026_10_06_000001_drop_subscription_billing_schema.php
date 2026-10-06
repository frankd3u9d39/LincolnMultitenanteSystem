<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The platform is free for every school, so subscription plans, billing cycles
 * and recurring revenue no longer model anything real.
 *
 * Per-school capacity ceilings survive as columns on `schools`: they guard
 * shared infrastructure rather than gating a paid plan.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Resource ceilings move onto the tenant itself.
        Schema::table('schools', function (Blueprint $table) {
            $table->unsignedInteger('max_students')->default(10000)->after('storage_limit_gb');
            $table->unsignedInteger('max_teachers')->default(800)->after('max_students');
            $table->unsignedInteger('max_file_upload_mb')->default(50)->after('max_teachers');
        });

        // Trialing is a billing state; those tenants become pending approval.
        DB::table('schools')->where('status', 'trialing')->update(['status' => 'pending_approval']);

        Schema::table('schools', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_id');
        });

        Schema::table('schools', function (Blueprint $table) {
            $table->enum('status', ['active', 'suspended', 'pending_approval', 'inactive'])
                ->default('active')
                ->change();
        });

        Schema::dropIfExists('school_subscriptions');
        Schema::dropIfExists('subscription_plans');

        // Telemetry keeps capacity signals and drops the revenue one.
        Schema::table('platform_telemetry', function (Blueprint $table) {
            $table->dropColumn(['mrr_amount', 'trial_schools_count']);
        });

        Schema::table('platform_telemetry', function (Blueprint $table) {
            $table->unsignedInteger('pending_schools_count')->default(0)->after('active_schools_count');
        });

        // Billing settings are meaningless on a free platform.
        DB::table('platform_settings')->where('category', 'billing')->delete();
    }

    public function down(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->string('description', 255)->nullable();
            $table->decimal('price_monthly', 10, 2)->default(0.00);
            $table->decimal('price_yearly', 10, 2)->default(0.00);
            $table->string('currency', 3)->default('NGN');
            $table->unsignedInteger('max_students')->default(500);
            $table->unsignedInteger('max_teachers')->default(50);
            $table->unsignedInteger('max_storage_gb')->default(20);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('school_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('yearly');
            $table->decimal('amount', 10, 2)->default(0.00);
            $table->string('currency', 3)->default('NGN');
            $table->enum('status', ['active', 'trialing', 'past_due', 'cancelled', 'expired'])->default('active')->index();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable()->index();
            $table->timestamp('trial_ends_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->string('payment_method', 50)->nullable()->default('credit_card');
            $table->string('invoice_reference', 100)->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::table('schools', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('status')->constrained('subscription_plans')->nullOnDelete();
            $table->dropColumn(['max_students', 'max_teachers', 'max_file_upload_mb']);
        });

        Schema::table('schools', function (Blueprint $table) {
            $table->enum('status', ['active', 'trialing', 'suspended', 'pending_approval', 'inactive'])
                ->default('active')
                ->change();
        });

        Schema::table('platform_telemetry', function (Blueprint $table) {
            $table->dropColumn('pending_schools_count');
        });

        Schema::table('platform_telemetry', function (Blueprint $table) {
            $table->unsignedInteger('trial_schools_count')->default(0)->after('active_schools_count');
            $table->decimal('mrr_amount', 12, 2)->default(0.00);
        });
    }
};
