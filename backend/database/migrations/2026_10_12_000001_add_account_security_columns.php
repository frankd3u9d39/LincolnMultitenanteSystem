<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Columns the SuperAdmin account area needs to be real rather than simulated:
 * administrator titles, per-user preferences, a TOTP secret with recovery
 * codes, temporary lockout, and device metadata on each session token.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('admin_role', 30)->nullable()->after('role')
                ->comment('principal_admin, deputy_admin, bursar or registrar');
            $table->json('preferences')->nullable()->after('avatar_url');
            $table->text('mfa_secret')->nullable()->after('mfa_enabled');
            $table->json('mfa_recovery_codes')->nullable()->after('mfa_secret');
            $table->timestamp('password_changed_at')->nullable()->after('mfa_recovery_codes');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('abilities');
            $table->string('user_agent', 500)->nullable()->after('ip_address');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['ip_address', 'user_agent']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'admin_role',
                'preferences',
                'mfa_secret',
                'mfa_recovery_codes',
                'password_changed_at',
                'locked_until',
            ]);
        });
    }
};
