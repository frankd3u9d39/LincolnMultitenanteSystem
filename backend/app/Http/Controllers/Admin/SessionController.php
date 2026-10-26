<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - Academic Sessions and Terms.
 */
class SessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;
        $currentYear = $school->academic_year_current ?? date('Y').'/'.(date('Y') + 1);

        $studentCount = User::where('school_id', $school->id)->where('role', User::ROLE_STUDENT)->count();

        $savedSessions = $this->getSavedSessions($school->id);

        if (empty($savedSessions)) {
            $savedSessions = [
                [
                    'id' => 1,
                    'year' => $currentYear,
                    'term' => 'Current Academic Session',
                    'startDate' => date('Y-09-01'),
                    'endDate' => date('Y-12-20'),
                    'status' => 'Ongoing',
                    'isCurrent' => true,
                    'enrolledStudents' => $studentCount,
                    'examPeriod' => 'TBD',
                ],
            ];
            $this->saveSessions($school->id, $savedSessions);
        } else {
            // Update live enrolled students count on current session
            foreach ($savedSessions as &$sess) {
                if (! empty($sess['isCurrent'])) {
                    $sess['enrolledStudents'] = $studentCount;
                }
            }
        }

        $currentSession = collect($savedSessions)->firstWhere('isCurrent', true) ?? ($savedSessions[0] ?? null);

        return response()->json([
            'data' => array_values($savedSessions),
            'currentSession' => $currentSession,
            'academicYear' => $currentYear,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'year' => ['required', 'string', 'max:20'],
            'term' => ['required', 'string', 'max:60'],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after:startDate'],
        ]);

        $savedSessions = $this->getSavedSessions($school->id);
        $newId = count($savedSessions) + 1;

        $newSession = [
            'id' => $newId,
            'year' => $data['year'],
            'term' => $data['term'],
            'startDate' => $data['startDate'],
            'endDate' => $data['endDate'],
            'status' => 'Upcoming',
            'isCurrent' => false,
            'enrolledStudents' => 0,
            'examPeriod' => 'TBD',
        ];

        $savedSessions[] = $newSession;
        $this->saveSessions($school->id, $savedSessions);

        return response()->json([
            'message' => 'Academic session created successfully.',
            'data' => $newSession,
        ], 201);
    }

    public function activate(Request $request, $id): JsonResponse
    {
        $school = $request->user()->school;
        $savedSessions = $this->getSavedSessions($school->id);

        $activatedYear = null;
        foreach ($savedSessions as &$s) {
            if ($s['id'] == $id) {
                $s['isCurrent'] = true;
                $s['status'] = 'Ongoing';
                $activatedYear = $s['year'];
            } else {
                $s['isCurrent'] = false;
                if ($s['status'] === 'Ongoing') {
                    $s['status'] = 'Completed';
                }
            }
        }

        if ($activatedYear) {
            $school->update(['academic_year_current' => $activatedYear]);
        }

        $this->saveSessions($school->id, $savedSessions);

        return response()->json([
            'message' => 'Academic session activated successfully.',
            'data' => array_values($savedSessions),
        ]);
    }

    private function getSavedSessions(int $schoolId): array
    {
        $setting = PlatformSetting::where('key_name', "school_{$schoolId}_sessions")->first();
        if (! $setting || ! $setting->value) {
            return [];
        }

        $decoded = json_decode($setting->value, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function saveSessions(int $schoolId, array $sessions): void
    {
        PlatformSetting::updateOrCreate(
            ['key_name' => "school_{$schoolId}_sessions"],
            [
                'category' => 'tenant',
                'display_name' => "School {$schoolId} Academic Sessions",
                'value' => json_encode($sessions),
                'data_type' => 'json',
                'description' => "Saved academic sessions for school ID {$schoolId}",
            ]
        );
    }
}
