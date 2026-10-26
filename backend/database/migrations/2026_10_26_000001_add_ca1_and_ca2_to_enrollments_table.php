<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->decimal('ca1_score', 5, 2)->nullable()->after('progress');
            $table->decimal('ca2_score', 5, 2)->nullable()->after('ca1_score');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['ca1_score', 'ca2_score']);
        });
    }
};
