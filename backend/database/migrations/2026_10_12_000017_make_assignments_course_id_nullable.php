<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Teacher-created assignments (Group 2) are keyed to `school_class_id`, not
 * the Student-module (Group 1) `course_id` the `assignments` table originally
 * required NOT NULL for every row. An assignment now needs one or the other,
 * so `course_id` becomes nullable instead of forcing every teacher-created
 * row to fake a course.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable(false)->change();
        });
    }
};
