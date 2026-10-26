<?php

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('school_classes')) {
            Schema::table('school_classes', function (Blueprint $table) {
                if (! Schema::hasColumn('school_classes', 'school_id')) {
                    $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
                }
            });

            // Backfill existing classes from assigned teacher's school_id
            $classes = SchoolClass::whereNull('school_id')->get();
            $defaultSchool = School::first();

            foreach ($classes as $class) {
                $teacher = User::find($class->teacher_id);
                $schoolId = $teacher?->school_id ?? $defaultSchool?->id;
                if ($schoolId) {
                    $class->update(['school_id' => $schoolId]);
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('school_classes') && Schema::hasColumn('school_classes', 'school_id')) {
            Schema::table('school_classes', function (Blueprint $table) {
                $table->dropForeign(['school_id']);
                $table->dropColumn('school_id');
            });
        }
    }
};
