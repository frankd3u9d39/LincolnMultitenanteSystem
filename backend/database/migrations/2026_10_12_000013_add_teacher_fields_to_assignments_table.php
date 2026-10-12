<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('assignments')) {
            Schema::table('assignments', function (Blueprint $table) {
                if (!Schema::hasColumn('assignments', 'school_class_id')) {
                    $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->cascadeOnDelete();
                }
                if (!Schema::hasColumn('assignments', 'teacher_id')) {
                    $table->foreignId('teacher_id')->nullable()->constrained('users')->cascadeOnDelete();
                }
                if (!Schema::hasColumn('assignments', 'due_date')) {
                    $table->date('due_date')->nullable();
                }
                if (!Schema::hasColumn('assignments', 'total_marks')) {
                    $table->integer('total_marks')->nullable()->default(100);
                }
            });
        } else {
            Schema::create('assignments', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('instructions')->nullable();
                $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->cascadeOnDelete();
                $table->foreignId('teacher_id')->nullable()->constrained('users')->cascadeOnDelete();
                $table->date('due_date')->nullable();
                $table->integer('total_marks')->nullable()->default(100);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('assignments')) {
            Schema::table('assignments', function (Blueprint $table) {
                $columnsToDrop = [];
                if (Schema::hasColumn('assignments', 'school_class_id')) {
                    $table->dropForeign(['school_class_id']);
                    $columnsToDrop[] = 'school_class_id';
                }
                if (Schema::hasColumn('assignments', 'teacher_id')) {
                    $table->dropForeign(['teacher_id']);
                    $columnsToDrop[] = 'teacher_id';
                }
                if (Schema::hasColumn('assignments', 'due_date')) {
                    $columnsToDrop[] = 'due_date';
                }
                if (Schema::hasColumn('assignments', 'total_marks')) {
                    $columnsToDrop[] = 'total_marks';
                }
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }
};
