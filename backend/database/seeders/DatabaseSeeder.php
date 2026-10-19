<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Mock data and development credentials have been disabled.
        // To re-seed development fixtures in test environments only:
        // $this->call(SuperAdminDashboardSeeder::class);
        // $this->call(StudentModuleSeeder::class);
    }
}
