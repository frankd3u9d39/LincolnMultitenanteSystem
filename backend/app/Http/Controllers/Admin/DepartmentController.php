<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - Academic Departments management.
 */
class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        // Custom-created departments saved in database
        $savedDepts = $this->getSavedDepartments($school->id);

        // Existing departments from school courses
        $courseDepts = Course::where('school_id', $school->id)
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->distinct()
            ->pluck('department')
            ->all();

        // Merge all distinct department names
        $allDeptNames = collect(array_merge($courseDepts, array_keys($savedDepts)))
            ->filter()
            ->unique()
            ->values();

        $teachers = User::where('school_id', $school->id)
            ->where('role', User::ROLE_TEACHER)
            ->get();

        $data = $allDeptNames->map(function ($name, $index) use ($school, $teachers, $savedDepts) {
            $courses = Course::where('school_id', $school->id)
                ->where('department', $name)
                ->get();

            $courseIds = $courses->pluck('id');
            $studentCount = Enrollment::whereIn('course_id', $courseIds)
                ->where('status', '!=', Enrollment::STATUS_WITHDRAWN)
                ->distinct('student_id')
                ->count('student_id');

            $facultyCount = $courses->pluck('teacher_id')->filter()->unique()->count();

            $saved = $savedDepts[$name] ?? null;
            $code = $saved['code'] ?? strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name), 0, 4));
            $head = $saved['head'] ?? 'Unassigned';

            return [
                'id' => $index + 1,
                'name' => $name,
                'code' => $code,
                'head' => $head,
                'headEmail' => null,
                'coursesCount' => $courses->count(),
                'facultyCount' => $facultyCount,
                'studentsCount' => $studentCount,
                'status' => 'Active',
            ];
        });

        return response()->json([
            'data' => $data->values(),
            'summary' => [
                'totalDepartments' => $data->count(),
                'totalCourses' => Course::where('school_id', $school->id)->count(),
                'totalFaculty' => $teachers->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:10'],
            'head' => ['nullable', 'string', 'max:120'],
        ]);

        $saved = $this->getSavedDepartments($school->id);
        $saved[$data['name']] = [
            'name' => $data['name'],
            'code' => strtoupper($data['code']),
            'head' => $data['head'] ?? 'Unassigned',
        ];

        $this->saveDepartments($school->id, $saved);

        return response()->json([
            'message' => 'Department created successfully.',
            'data' => [
                'id' => count($saved),
                'name' => $data['name'],
                'code' => strtoupper($data['code']),
                'head' => $data['head'] ?? 'Unassigned',
                'coursesCount' => 0,
                'facultyCount' => 0,
                'studentsCount' => 0,
                'status' => 'Active',
            ],
        ], 201);
    }

    private function getSavedDepartments(int $schoolId): array
    {
        $setting = PlatformSetting::where('key_name', "school_{$schoolId}_departments")->first();
        if (! $setting || ! $setting->value) {
            return [];
        }

        $decoded = json_decode($setting->value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function saveDepartments(int $schoolId, array $departments): void
    {
        PlatformSetting::updateOrCreate(
            ['key_name' => "school_{$schoolId}_departments"],
            [
                'category' => 'tenant',
                'display_name' => "School {$schoolId} Departments",
                'value' => json_encode($departments),
                'data_type' => 'json',
                'description' => "Saved academic departments for school ID {$schoolId}",
            ]
        );
    }
}
