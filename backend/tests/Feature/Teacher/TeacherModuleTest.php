<?php

namespace Tests\Feature\Teacher;

use App\Models\Assignment;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * GROUP 2: Teacher Module - End-to-End Feature Tests
 *
 * Verifies teacher dashboard, class roster access, attendance tracking,
 * assignment authoring, announcement management, and tenant/teacher boundary checks.
 */
class TeacherModuleTest extends TestCase
{
    use RefreshDatabase;

    private School $school;
    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Lincoln Institute of Science',
            'code' => 'LC-IOS-01',
            'slug' => 'lincoln-ios',
            'domain' => 'ios.lincoln.edu',
            'contact_email' => 'admin@ios.lincoln.edu',
            'status' => School::STATUS_ACTIVE,
        ]);

        $this->teacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Dr. Gregory House',
            'email' => 'house@ios.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_guests_cannot_access_teacher_endpoints(): void
    {
        $this->getJson('/api/v1/teacher/dashboard')->assertUnauthorized();
        $this->getJson('/api/v1/teacher/classes')->assertUnauthorized();
    }

    public function test_students_cannot_access_teacher_endpoints(): void
    {
        $student = User::create([
            'school_id' => $this->school->id,
            'name' => 'Student Bob',
            'email' => 'bob@ios.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/teacher/dashboard')
            ->assertForbidden();
    }

    public function test_teacher_dashboard_returns_metrics(): void
    {
        $class = SchoolClass::create([
            'name' => 'Diagnostics 101',
            'code' => 'DIA101',
            'room' => 'Room 221B',
            'teacher_id' => $this->teacher->id,
        ]);

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/teacher/dashboard')
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.total_classes', 1);
    }

    public function test_teacher_can_list_classes_and_roster(): void
    {
        $class = SchoolClass::create([
            'name' => 'Advanced Pharmacology',
            'code' => 'PHA301',
            'room' => 'Lab 1',
            'teacher_id' => $this->teacher->id,
        ]);

        $studentUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Cuddy Student',
            'email' => 'cuddy@ios.lincoln.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'student_id_number' => 'STU-007',
            'grade_level' => 'Senior',
        ]);

        $class->students()->attach($student->id);

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/teacher/classes')
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/teacher/classes/{$class->id}/students")
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.student_id_number', 'STU-007');
    }

    public function test_teacher_cannot_read_another_teachers_class_roster(): void
    {
        $otherTeacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Prof. Wilson',
            'email' => 'wilson@ios.lincoln.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $otherClass = SchoolClass::create([
            'name' => 'Oncology',
            'code' => 'ONC401',
            'teacher_id' => $otherTeacher->id,
        ]);

        // Accessing other teacher's class roster returns 404
        $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/teacher/classes/{$otherClass->id}/students")
            ->assertNotFound();
    }

    public function test_teacher_can_record_attendance(): void
    {
        $class = SchoolClass::create([
            'name' => 'Neurology 201',
            'code' => 'NEU201',
            'teacher_id' => $this->teacher->id,
        ]);

        $studentUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Foreman Student',
            'email' => 'foreman@ios.lincoln.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'student_id_number' => 'STU-008',
            'grade_level' => 'Junior',
        ]);

        $class->students()->attach($student->id);

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/teacher/attendance/classes')
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/teacher/attendance', [
                'school_class_id' => $class->id,
                'date' => '2026-10-15',
                'records' => [
                    [
                        'student_id' => $student->id,
                        'status' => 'Present',
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('attendances', [
            'school_class_id' => $class->id,
            'student_id' => $student->id,
            'date' => '2026-10-15',
            'status' => 'Present',
        ]);
    }

    public function test_teacher_can_manage_assignments(): void
    {
        $class = SchoolClass::create([
            'name' => 'Biochemistry',
            'code' => 'BCH201',
            'teacher_id' => $this->teacher->id,
        ]);

        $res = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/teacher/assignments', [
                'title' => 'Enzyme Kinetics Essay',
                'school_class_id' => $class->id,
                'due_date' => '2026-11-20',
                'total_marks' => 100,
                'instructions' => 'Provide references in APA format.',
            ])
            ->assertCreated()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.title', 'Enzyme Kinetics Essay');

        $assignmentId = $res->json('data.id');

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/teacher/assignments')
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/teacher/assignments/{$assignmentId}")
            ->assertOk()
            ->assertJsonPath('data.id', $assignmentId);

        $this->actingAs($this->teacher, 'sanctum')
            ->putJson("/api/v1/teacher/assignments/{$assignmentId}", [
                'title' => 'Enzyme Kinetics Essay (Revised)',
                'total_marks' => 80,
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Enzyme Kinetics Essay (Revised)');
    }

    public function test_teacher_can_post_and_list_announcements(): void
    {
        $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/v1/teacher/announcements', [
                'title' => 'Midterm Review Session',
                'content' => 'Review will take place in Room 221B at 4 PM.',
                'target_audience' => 'Students',
                'is_important' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.title', 'Midterm Review Session');

        $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/teacher/announcements')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
