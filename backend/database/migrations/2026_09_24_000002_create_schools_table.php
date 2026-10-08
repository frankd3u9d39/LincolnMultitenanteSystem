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
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('code', 50)->unique()->comment('Institutional identifier code');
            $table->string('slug', 100)->unique()->comment('Tenant subdomain/slug');
            $table->string('domain', 255)->nullable()->unique()->comment('Custom vanity domain');
            $table->string('contact_email', 255);
            $table->string('contact_phone', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('country', 100)->default('United Kingdom');
            $table->string('postal_code', 20)->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->enum('status', ['active', 'trialing', 'suspended', 'pending_approval', 'inactive'])->default('active')->index();
            $table->foreignId('plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->unsignedInteger('storage_limit_gb')->default(20);
            $table->decimal('storage_used_mb', 10, 2)->default(0.00);
            $table->string('academic_year_current', 20)->nullable()->default('2025/2026');
            $table->string('timezone', 50)->default('Europe/London');
            $table->string('currency', 3)->default('NGN');
            $table->timestamp('onboarded_at')->nullable()->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};
