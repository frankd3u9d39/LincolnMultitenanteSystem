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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->comment('NULL strictly for SuperAdmins; Foreign key for tenant users')->constrained('schools')->cascadeOnDelete();
            $table->enum('role', ['superadmin', 'admin', 'teacher', 'student'])->default('student')->after('password')->index();
            $table->string('phone', 50)->nullable()->after('role');
            $table->string('avatar_url', 500)->nullable()->after('phone');
            $table->enum('status', ['active', 'inactive', 'suspended', 'pending'])->default('active')->after('avatar_url')->index();
            $table->timestamp('last_login_at')->nullable()->after('status');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn([
                'school_id',
                'role',
                'phone',
                'avatar_url',
                'status',
                'last_login_at',
                'last_login_ip',
                'deleted_at',
            ]);
        });
    }
};
