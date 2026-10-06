<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-factor enrolment is a first-class signal in the SuperAdmin access
 * report, so it is stored rather than inferred from email verification.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('mfa_enabled')->default(false)->after('status')->index();
            $table->timestamp('mfa_enrolled_at')->nullable()->after('mfa_enabled');
            $table->timestamp('invited_at')->nullable()->after('mfa_enrolled_at');
            $table->unsignedSmallInteger('failed_login_attempts')->default(0)->after('last_login_ip');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // SQLite rebuilds the table on a column drop and will choke on an
            // index that still references the departing column.
            $table->dropIndex(['mfa_enabled']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'mfa_enabled',
                'mfa_enrolled_at',
                'invited_at',
                'failed_login_attempts',
            ]);
        });
    }
};
