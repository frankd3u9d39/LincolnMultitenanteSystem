<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * GROUP 3: Admin Module - End-to-End Feature Tests
 *
 * Verifies school-level administrative operations, role gating,
 * tenant quota boundaries, and multi-tenant isolation.
 */
class AdminModuleTest extends TestCase
{
    use RefreshDatabase;

    private School $school;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Lincoln Science & Tech Academy',
            'code' => 'LC-STA-01',
            'slug' => 'lincoln-sta',
            'domain' => 'sta.lincoln.edu',
            'contact_email' => 'admin@sta.lincoln.edu',
            'status' => School::STATUS_ACTIVE,
            'max_students' => 10,
            'max_teachers' => 5,
        ]);

        $this->admin = User::create([
            'school_id' => $this->school->id,
            'name' => 'Principal Vance',
            'email' => 'principal.vance@sta.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_guests_cannot_access_admin_endpoints(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
        $this->getJson('/api/v1/admin/students')->assertUnauthorized();
    }

    public function test_students_and_teachers_are_forbidden(): void
    {
        $teacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Prof. Higgins',
            'email' => 'higgins@sta.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->actingAs($teacher, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertForbidden();

        $student = User::create([
            'school_id' => $this->school->id,
            'name' => 'Student Jane',
            'email' => 'jane@sta.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertForbidden();
    }

    public function test_admin_dashboard_returns_school_stats(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.school.name', 'Lincoln Science & Tech Academy')
            ->assertJsonPath('data.school.code', 'LC-STA-01')
            ->assertJsonPath('data.counts.students', 0)
            ->assertJsonPath('data.counts.teachers', 0);
    }

    public function test_admin_can_list_and_create_students(): void
    {
        $res = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/students', [
                'name' => 'Sarah Connor',
                'email' => 'sarah.connor@sta.lincoln.edu',
                'gradeLevel' => 'Grade 11',
                'studentIdNumber' => 'STU-1001',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Sarah Connor')
            ->assertJsonPath('data.gradeLevel', 'Grade 11');

        $this->assertDatabaseHas('users', [
            'email' => 'sarah.connor@sta.lincoln.edu',
            'role' => User::ROLE_STUDENT,
            'school_id' => $this->school->id,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/students')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_cannot_exceed_student_quota(): void
    {
        $this->school->update(['max_students' => 1]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/students', [
                'name' => 'First Student',
                'email' => 'student1@sta.lincoln.edu',
            ])
            ->assertCreated();

        // Second student attempt should breach quota
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/students', [
                'name' => 'Second Student',
                'email' => 'student2@sta.lincoln.edu',
            ])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'School student enrollment capacity has been reached (maximum 1).']);
    }

    public function test_admin_can_update_and_deactivate_student(): void
    {
        $studentUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'John Doe',
            'email' => 'johndoe@sta.lincoln.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        Student::create([
            'user_id' => $studentUser->id,
            'student_id_number' => 'STU-999',
            'grade_level' => 'Grade 10',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/students/{$studentUser->id}", [
                'name' => 'Johnathon Doe',
                'gradeLevel' => 'Grade 11',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Johnathon Doe')
            ->assertJsonPath('data.gradeLevel', 'Grade 11');

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/students/{$studentUser->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('users', [
            'id' => $studentUser->id,
            'status' => User::STATUS_INACTIVE,
        ]);
    }

    public function test_admin_can_list_create_and_quota_check_teachers(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/teachers', [
                'name' => 'Alan Turing',
                'email' => 'turing@sta.lincoln.edu',
                'phone' => '+1234567890',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Alan Turing');

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/teachers')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Check quota ceiling
        $this->school->update(['max_teachers' => 1]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/teachers', [
                'name' => 'Ada Lovelace',
                'email' => 'lovelace@sta.lincoln.edu',
            ])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'School teacher staff capacity has been reached (maximum 1).']);
    }

    public function test_admin_can_manage_classes_and_courses(): void
    {
        $teacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Dr. Robert',
            'email' => 'robert@sta.lincoln.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        // Class
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/classes', [
                'name' => 'AP Physics 1',
                'code' => 'PHY101',
                'room' => 'Lab 3B',
                'schedule' => 'Mon/Wed 10:00 AM',
                'teacherId' => $teacher->id,
            ])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['id']]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/classes')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Course
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/courses', [
                'code' => 'CS101',
                'name' => 'Introduction to Computing',
                'department' => 'Computer Science',
                'credits' => 4,
                'term' => 'Fall 2026',
                'capacity' => 30,
                'teacherId' => $teacher->id,
            ])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['id']]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/courses')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_manage_fees_and_announcements(): void
    {
        $studentUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Student Alex',
            'email' => 'alex@sta.lincoln.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        // Fee Item
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/fees', [
                'studentId' => $studentUser->id,
                'term' => 'Fall 2026',
                'description' => 'Tuition Fee 1st Term',
                'amount' => 1250.00,
                'dueDate' => '2026-11-01',
            ])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['id']]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/fees')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Announcement
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/announcements', [
                'title' => 'Campus Reopening Notice',
                'content' => 'Classes will resume on Monday at 8 AM.',
                'audience' => 'All',
                'important' => true,
            ])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['id']]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/announcements')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_update_school_settings(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/school-settings')
            ->assertOk()
            ->assertJsonPath('data.name', 'Lincoln Science & Tech Academy');

        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/v1/admin/school-settings', [
                'city' => 'Metropolis',
                'contactPhone' => '+15551234567',
                'academicYearCurrent' => '2026-2027',
            ])
            ->assertOk()
            ->assertJsonPath('data.city', 'Metropolis')
            ->assertJsonPath('data.contactPhone', '+15551234567');

        $this->assertEquals('Metropolis', $this->school->fresh()->city);
    }

    public function test_tenant_isolation_prevents_cross_school_access(): void
    {
        $otherSchool = School::create([
            'name' => 'Foreign Academy',
            'code' => 'FOREIGN-01',
            'slug' => 'foreign-academy',
            'domain' => 'foreign.edu',
            'contact_email' => 'admin@foreign.edu',
            'status' => School::STATUS_ACTIVE,
        ]);

        $otherStudent = User::create([
            'school_id' => $otherSchool->id,
            'name' => 'Foreign Student',
            'email' => 'foreign.student@foreign.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        // Trying to update or delete a student belonging to another school must 404
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/admin/students/{$otherStudent->id}", [
                'name' => 'Hacked Name',
            ])
            ->assertNotFound();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/students/{$otherStudent->id}")
            ->assertNotFound();
    }

    public function test_admin_can_manage_departments_and_subjects(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/departments')
            ->assertOk()
            ->assertJsonStructure(['data', 'summary']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/departments', [
                'name' => 'Biotechnology & Genetics',
                'code' => 'BIOT',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Biotechnology & Genetics');

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/subjects')
            ->assertOk()
            ->assertJsonStructure(['data', 'summary']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/subjects', [
                'code' => 'BIO101',
                'name' => 'Cellular Biology',
                'department' => 'Biotechnology',
                'credits' => 3,
                'type' => 'Core',
            ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'BIO101');
    }

    public function test_admin_can_view_sessions_attendance_exams_results_reports_and_staff(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/sessions')
            ->assertOk()
            ->assertJsonStructure(['data', 'currentSession']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/attendance')
            ->assertOk()
            ->assertJsonStructure(['summary', 'classRosters', 'flaggedStudents']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/examinations')
            ->assertOk()
            ->assertJsonStructure(['data', 'summary']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/results')
            ->assertOk()
            ->assertJsonStructure(['summary', 'gpaDistribution', 'rankings']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/reports')
            ->assertOk()
            ->assertJsonStructure(['kpis', 'enrollmentTrend', 'departmentBreakdown']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/staff')
            ->assertOk()
            ->assertJsonStructure(['data', 'summary']);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/settings')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }
}
