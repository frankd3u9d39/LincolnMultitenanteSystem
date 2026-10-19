<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                if (!Schema::hasColumn('attendances', 'course_id')) {
                    $table->foreignId('course_id')->nullable()->after('school_class_id')->constrained('courses')->nullOnDelete();
                }
                if (!Schema::hasColumn('attendances', 'teacher_id')) {
                    $table->foreignId('teacher_id')->nullable()->after('course_id')->constrained('users')->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                if (Schema::hasColumn('attendances', 'course_id')) {
                    $table->dropForeign(['course_id']);
                    $table->dropColumn('course_id');
                }
                if (Schema::hasColumn('attendances', 'teacher_id')) {
                    $table->dropForeign(['teacher_id']);
                    $table->dropColumn('teacher_id');
                }
            });
        }
    }
};
