<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignId('school_class_id')->nullable()->after('course_id')->constrained('school_classes')->nullOnDelete();
            $table->decimal('ca_score', 5, 2)->nullable()->after('progress');
            $table->decimal('exam_score', 5, 2)->nullable()->after('ca_score');
            $table->string('remark', 50)->nullable()->after('grade');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['school_class_id']);
            $table->dropColumn(['school_class_id', 'ca_score', 'exam_score', 'remark']);
        });
    }
};
