<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('code');
            $table->string('name');
            $table->string('department')->nullable();
            $table->unsignedTinyInteger('credits')->default(3);
            $table->string('term')->default('Current Term');
            $table->unsignedInteger('capacity')->default(30);
            $table->string('color')->default('bg-blue-600');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'code', 'term']);
        });

        Schema::create('course_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('day_of_week'); // 1 = Monday .. 5 = Friday
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('location')->nullable();
            $table->string('type')->default('Lecture'); // Lecture, Lab, Seminar, Tutorial
            $table->timestamps();
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('term')->default('Current Term');
            $table->string('status')->default('in_progress'); // in_progress, completed, withdrawn
            $table->unsignedTinyInteger('progress')->default(0);
            $table->string('grade')->nullable();
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'course_id', 'term']);
        });

        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type')->default('Homework'); // Homework, Essay, Project, Lab, Quiz, Assignment
            $table->unsignedInteger('points')->default(100);
            $table->text('instructions')->nullable();
            $table->dateTime('due_at');
            $table->timestamps();
        });

        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, submitted, graded, overdue
            $table->text('submission_text')->nullable();
            $table->string('file_path')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->unsignedInteger('score')->nullable();
            $table->text('feedback')->nullable();
            $table->dateTime('graded_at')->nullable();
            $table->timestamps();

            $table->unique(['assignment_id', 'student_id']);
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->string('status'); // present, absent, late
            $table->timestamps();

            $table->unique(['course_id', 'student_id', 'date']);
        });

        Schema::create('fee_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('term')->default('Current Term');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->date('due_date');
            $table->boolean('required')->default(true);
            $table->timestamps();
        });

        Schema::create('fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('fee_item_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('method')->default('Card');
            $table->string('receipt_number')->unique();
            $table->timestamp('paid_at');
            $table->timestamps();
        });

        Schema::create('student_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('Campus'); // Academic, Finance, Campus, Warning
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_notifications');
        Schema::dropIfExists('fee_payments');
        Schema::dropIfExists('fee_items');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('course_schedules');
        Schema::dropIfExists('courses');
    }
};
