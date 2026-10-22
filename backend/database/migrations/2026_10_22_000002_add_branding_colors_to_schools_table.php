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
        Schema::table('schools', function (Blueprint $table) {
            if (! Schema::hasColumn('schools', 'primary_color')) {
                $table->string('primary_color', 30)->default('#B81D22')->after('logo_url');
            }
            if (! Schema::hasColumn('schools', 'secondary_color')) {
                $table->string('secondary_color', 30)->default('#9E1519')->after('primary_color');
            }
            if (! Schema::hasColumn('schools', 'accent_color')) {
                $table->string('accent_color', 30)->default('#B81D22')->after('secondary_color');
            }
            if (! Schema::hasColumn('schools', 'theme_palette')) {
                $table->string('theme_palette', 50)->default('crimson')->after('accent_color');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['primary_color', 'secondary_color', 'accent_color', 'theme_palette']);
        });
    }
};
