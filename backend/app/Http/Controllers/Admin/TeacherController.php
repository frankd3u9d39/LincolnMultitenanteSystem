<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * GROUP 3: Admin Module - the school's teaching staff roster.
 */
class TeacherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $teachers = User::where('school_id', $school->id)
            ->where('role', User::ROLE_TEACHER)
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            })
            ->orderBy('name')
            ->get();

        $classCounts = SchoolClass::whereIn('teacher_id', $teachers->pluck('id'))
            ->get()
            ->groupBy('teacher_id')
            ->map->count();

        return response()->json([
            'data' => $teachers->map(fn (User $t) => $this->payload($t, $classCounts->get($t->id, 0))),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = School::find($request->user()->school_id) ?? $request->user()->school;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        if ($school->max_teachers) {
            $currentCount = User::where('school_id', $school->id)->where('role', User::ROLE_TEACHER)->count();
            if ($currentCount >= $school->max_teachers) {
                return response()->json([
                    'message' => 'School teacher staff capacity has been reached (maximum '.$school->max_teachers.').',
                ], 422);
            }
        }

        $plainPassword = ! empty($data['password']) ? $data['password'] : 'Lincoln@123';

        $teacher = User::create([
            'school_id' => $school->id,
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($plainPassword),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
            'invited_at' => now(),
        ]);

        return response()->json(['data' => $this->payload($teacher, 0)], 201);
    }

    public function update(Request $request, User $teacher): JsonResponse
    {
        $this->authorizeOwn($request, $teacher);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'status' => ['sometimes', Rule::in([User::STATUS_ACTIVE, User::STATUS_INACTIVE, User::STATUS_SUSPENDED])],
        ]);

        $teacher->update($data);

        $classCount = SchoolClass::where('teacher_id', $teacher->id)->count();

        return response()->json(['data' => $this->payload($teacher->fresh(), $classCount)]);
    }

    public function destroy(Request $request, User $teacher): JsonResponse
    {
        $this->authorizeOwn($request, $teacher);

        $teacher->update(['status' => User::STATUS_INACTIVE]);

        return response()->json(['data' => ['status' => 'inactive']]);
    }

    private function authorizeOwn(Request $request, User $teacher): void
    {
        abort_unless(
            $teacher->role === User::ROLE_TEACHER && $teacher->school_id === $request->user()->school_id,
            404
        );
    }

    private function payload(User $t, int $classCount): array
    {
        return [
            'id' => $t->id,
            'name' => $t->name,
            'email' => $t->email,
            'phone' => $t->phone,
            'status' => $t->status,
            'classCount' => $classCount,
            'joinedAt' => $t->created_at->toDateString(),
        ];
    }
}
