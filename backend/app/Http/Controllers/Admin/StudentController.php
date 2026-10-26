<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * GROUP 3: Admin Module - the school's student roster.
 *
 * A student is a `User` (role=student, scoped to this school) with an
 * optional `Student` record (grade level, ID number) that Group 2's class
 * rosters already reference.
 */
class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $students = User::where('school_id', $school->id)
            ->where('role', User::ROLE_STUDENT)
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            })
            ->with(['studentProfile.classes'])
            ->orderBy('name')
            ->paginate((int) $request->integer('per_page', 25));

        return response()->json([
            'data' => collect($students->items())->map(fn (User $u) => $this->payload($u)),
            'meta' => [
                'currentPage' => $students->currentPage(),
                'lastPage' => $students->lastPage(),
                'total' => $students->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = School::find($request->user()->school_id) ?? $request->user()->school;

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'classId' => ['nullable', 'integer', 'exists:school_classes,id'],
            'gradeLevel' => ['nullable', 'string', 'max:40'],
            'studentIdNumber' => ['nullable', 'string', 'max:40'],
        ]);

        if ($school->max_students) {
            $currentCount = User::where('school_id', $school->id)->where('role', User::ROLE_STUDENT)->count();
            if ($currentCount >= $school->max_students) {
                return response()->json([
                    'message' => 'School student enrollment capacity has been reached (maximum '.$school->max_students.').',
                ], 422);
            }
        }

        $plainPassword = ! empty($data['password']) ? $data['password'] : 'Lincoln@123';
        $schoolClass = ! empty($data['classId']) ? SchoolClass::find($data['classId']) : null;
        $gradeLevel = $schoolClass ? $schoolClass->name : ($data['gradeLevel'] ?? 'Unassigned');

        $user = DB::transaction(function () use ($data, $school, $plainPassword, $schoolClass, $gradeLevel) {
            $user = User::create([
                'school_id' => $school->id,
                'name' => $data['name'],
                'email' => strtolower($data['email']),
                'password' => Hash::make($plainPassword),
                'role' => User::ROLE_STUDENT,
                'status' => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
                'invited_at' => now(),
            ]);

            $studentProfile = Student::create([
                'user_id' => $user->id,
                'student_id_number' => $data['studentIdNumber'] ?? ('STU-'.str_pad((string) $user->id, 6, '0', STR_PAD_LEFT)),
                'grade_level' => $gradeLevel,
            ]);

            if ($schoolClass) {
                $studentProfile->classes()->attach($schoolClass->id);
            }

            return $user;
        });

        return response()->json(['data' => $this->payload($user->fresh('studentProfile.classes'))], 201);
    }

    public function update(Request $request, User $student): JsonResponse
    {
        $this->authorizeOwn($request, $student);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'status' => ['sometimes', Rule::in([User::STATUS_ACTIVE, User::STATUS_INACTIVE, User::STATUS_SUSPENDED])],
            'classId' => ['sometimes', 'nullable', 'integer', 'exists:school_classes,id'],
            'gradeLevel' => ['sometimes', 'nullable', 'string', 'max:40'],
        ]);

        $student->update(array_filter([
            'name' => $data['name'] ?? null,
            'status' => $data['status'] ?? null,
        ], fn ($v) => $v !== null));

        if ($student->studentProfile) {
            if (array_key_exists('classId', $data)) {
                $schoolClass = $data['classId'] ? SchoolClass::find($data['classId']) : null;
                $newGrade = $schoolClass ? $schoolClass->name : ($data['gradeLevel'] ?? 'Unassigned');
                $student->studentProfile->update(['grade_level' => $newGrade]);
                if ($schoolClass) {
                    $student->studentProfile->classes()->sync([$schoolClass->id]);
                } else {
                    $student->studentProfile->classes()->detach();
                }
            } elseif (array_key_exists('gradeLevel', $data)) {
                $student->studentProfile->update(['grade_level' => $data['gradeLevel']]);
            }
        }

        return response()->json(['data' => $this->payload($student->fresh('studentProfile.classes'))]);
    }

    public function destroy(Request $request, User $student): JsonResponse
    {
        $this->authorizeOwn($request, $student);

        $student->update(['status' => User::STATUS_INACTIVE]);

        return response()->json(['data' => ['status' => 'inactive']]);
    }

    private function authorizeOwn(Request $request, User $student): void
    {
        abort_unless(
            $student->role === User::ROLE_STUDENT && $student->school_id === $request->user()->school_id,
            404
        );
    }

    private function payload(User $u): array
    {
        $assignedClass = $u->studentProfile?->classes?->first();

        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'status' => $u->status,
            'classId' => $assignedClass?->id,
            'className' => $assignedClass?->name ?? $u->studentProfile?->grade_level,
            'gradeLevel' => $assignedClass?->name ?? $u->studentProfile?->grade_level,
            'studentIdNumber' => $u->studentProfile?->student_id_number,
            'joinedAt' => $u->created_at->toDateString(),
        ];
    }
}
