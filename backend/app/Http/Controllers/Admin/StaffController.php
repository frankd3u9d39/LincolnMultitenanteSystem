<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * GROUP 3: Admin Module - Administrative and Support Staff Directory.
 */
class StaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $staffUsers = User::where('school_id', $school->id)
            ->whereIn('role', [User::ROLE_ADMIN, User::ROLE_TEACHER])
            ->orderBy('name')
            ->get();

        $teacherIds = $staffUsers->where('role', User::ROLE_TEACHER)->pluck('id');
        $teacherDepts = Course::whereIn('teacher_id', $teacherIds)
            ->whereNotNull('department')
            ->pluck('department', 'teacher_id');

        $staffList = $staffUsers->map(function (User $u) use ($teacherDepts) {
            $department = 'General Administration';
            if ($u->role === User::ROLE_TEACHER) {
                $department = $teacherDepts->get($u->id) ?? 'Academic Faculty';
            }

            $roleTitle = $u->role === User::ROLE_ADMIN
                ? ($u->admin_role ?? 'School Administrator')
                : 'Faculty Teacher';

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'roleTitle' => $roleTitle,
                'department' => $department,
                'phone' => $u->phone ?? 'Not provided',
                'status' => ucfirst($u->status ?? 'active'),
                'joinedDate' => $u->created_at ? $u->created_at->toDateString() : now()->toDateString(),
            ];
        });

        $uniqueDeptsCount = $staffList->pluck('department')->unique()->count();

        return response()->json([
            'data' => $staffList->values(),
            'summary' => [
                'totalStaff' => $staffList->count(),
                'departments' => $uniqueDeptsCount,
                'activeCount' => $staffList->where('status', 'Active')->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'roleTitle' => ['required', 'string', 'max:100'],
            'department' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $plainPassword = ! empty($data['password']) ? $data['password'] : 'Lincoln@123';
        $isTeacher = str_contains(strtolower($data['roleTitle']), 'teacher') || str_contains(strtolower($data['roleTitle']), 'faculty');
        $role = $isTeacher ? User::ROLE_TEACHER : User::ROLE_ADMIN;

        $user = User::create([
            'school_id' => $school->id,
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? null,
            'role' => $role,
            'admin_role' => $data['roleTitle'],
            'password' => Hash::make($plainPassword),
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Staff member registered successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roleTitle' => $data['roleTitle'],
                'department' => $data['department'],
                'phone' => $user->phone ?? 'Not provided',
                'status' => 'Active',
                'joinedDate' => now()->toDateString(),
            ],
        ], 201);
    }
}
