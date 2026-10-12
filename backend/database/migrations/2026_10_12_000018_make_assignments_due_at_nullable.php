<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Same issue as course_id (see 2026_10_12_000017): Group 1 (Student)
 * assignments carry `due_at`, Group 2 (Teacher) assignments carry
 * `due_date`, and a row only ever has one or the other set.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dateTime('due_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dateTime('due_at')->nullable(false)->change();
        });
    }
};
