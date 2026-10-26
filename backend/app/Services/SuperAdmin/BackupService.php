<?php

declare(strict_types=1);

namespace App\Services\SuperAdmin;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * GROUP 4: SuperAdmin Module - on-demand platform snapshot.
 *
 * Copies the SQLite database file into storage/app/backups. Other database
 * engines need their own dump tooling, so on those the service says so rather
 * than reporting a backup that never happened.
 */
class BackupService
{
    /**
     * @return array{ok: bool, message: string, file?: string, size_bytes?: int}
     */
    public function snapshot(?string $connectionName = null): array
    {
        $connection = DB::connection($connectionName);

        if ($connection->getDriverName() !== 'sqlite') {
            return [
                'ok' => false,
                'message' => sprintf(
                    'Snapshots of a %s database need an external dump job; none is configured.',
                    $connection->getDriverName()
                ),
            ];
        }

        $source = $connection->getDatabaseName();

        if ($source === ':memory:' || ! is_file($source)) {
            return ['ok' => false, 'message' => 'The database file could not be located for copying.'];
        }

        $directory = storage_path('app/backups');
        File::ensureDirectoryExists($directory);

        $name = 'snapshot_'.now()->format('Ymd_His').'.sqlite';
        $target = $directory.DIRECTORY_SEPARATOR.$name;

        if (! copy($source, $target)) {
            return ['ok' => false, 'message' => 'The snapshot could not be written to storage.'];
        }

        return [
            'ok' => true,
            'message' => 'Snapshot written.',
            'file' => $name,
            'size_bytes' => (int) filesize($target),
        ];
    }
}
