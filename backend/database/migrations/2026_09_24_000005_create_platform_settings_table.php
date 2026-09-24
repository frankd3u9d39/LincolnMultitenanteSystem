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
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('category', 50)->default('general')->index()->comment('general, security, billing, telemetry');
            $table->string('key_name', 100)->unique();
            $table->string('display_name', 150);
            $table->text('value')->nullable();
            $table->enum('data_type', ['string', 'integer', 'boolean', 'json', 'text'])->default('string');
            $table->string('description', 255)->nullable();
            $table->boolean('is_encrypted')->default(false);
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
