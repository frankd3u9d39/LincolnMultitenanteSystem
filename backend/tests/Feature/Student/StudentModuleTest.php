<?php

namespace Tests\Feature\Student;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\Enrollment;
use App\Models\FeeItem;
use App\Models\School;
use App\Models\StudentNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * GROUP 1: Student Module - End-to-End Feature Tests
 *
 * Verifies student dashboard, course catalog enrollment, assignments submission,
 * timetable, attendance, results, fees payment, and notification interactions.
 */
class StudentModuleTest extends TestCase
{
    use RefreshDatabase;

    private School $school;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Lincoln University College',
            'code' => 'LC-UNI-01',
            'slug' => 'lincoln-uni',
            'domain' => 'uni.lincoln.edu',
            'contact_email' => 'admin@uni.lincoln.edu',
            'status' => School::STATUS_ACTIVE,
        ]);

        $this->student = User::create([
            'school_id' => $this->school->id,
            'name' => 'Miles Morales',
            'email' => 'miles@uni.lincoln.edu',
            'password' => Hash::make('secret123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
            'preferences' => [
                'notifications' => ['email' => true, 'sms' => false],
            ],
        ]);
    }

    public function test_guests_cannot_access_student_endpoints(): void
    {
        $this->getJson('/api/v1/student/dashboard')->assertUnauthorized();
        $this->getJson('/api/v1/student/courses')->assertUnauthorized();
    }

    public function test_teachers_cannot_access_student_endpoints(): void
    {
        $teacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Prof. Peter Parker',
            'email' => 'parker@uni.lincoln.edu',
            'password' => Hash::make('secret123'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->actingAs($teacher, 'sanctum')
            ->getJson('/api/v1/student/dashboard')
            ->assertForbidden();
    }

    public function test_student_dashboard_returns_overview(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'kpi' => ['gpa', 'attendance', 'assignmentsDue', 'unreadNotifications'],
                    'todaysClasses',
                    'recentGrades',
                    'upcomingDeadlines',
                ],
            ]);
    }

    public function test_student_can_view_courses_catalog_and_enroll(): void
    {
        $teacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Prof. Octavius',
            'email' => 'otto@uni.lincoln.edu',
            'password' => Hash::make('secret'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $course = Course::create([
            'school_id' => $this->school->id,
            'teacher_id' => $teacher->id,
            'name' => 'Biophysics of Spider Silk',
            'code' => 'BIO301',
            'credits' => 3,
            'capacity' => 20,
        ]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/courses/catalog')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/v1/student/courses/{$course->id}/enroll")
            ->assertCreated()
            ->assertJsonStructure(['data' => ['enrollmentId']]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/courses')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'BIO301');
    }

    public function test_student_can_view_assignments_and_submit(): void
    {
        $course = Course::create([
            'school_id' => $this->school->id,
            'name' => 'Quantum Mechanics',
            'code' => 'PHY401',
            'credits' => 4,
            'capacity' => 25,
        ]);

        Enrollment::create([
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_IN_PROGRESS,
        ]);

        $assignment = Assignment::create([
            'school_id' => $this->school->id,
            'course_id' => $course->id,
            'title' => 'Wave Equations Lab',
            'points' => 100,
            'type' => 'homework',
            'due_at' => now()->addDays(5),
        ]);

        $submission = AssignmentSubmission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $this->student->id,
            'status' => AssignmentSubmission::STATUS_PENDING,
        ]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/assignments')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/v1/student/assignments/{$submission->id}/submit", [
                'submissionText' => 'Here is my complete solution to Schrödinger equation.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'Submitted');

        $this->assertDatabaseHas('assignment_submissions', [
            'id' => $submission->id,
            'status' => AssignmentSubmission::STATUS_SUBMITTED,
        ]);
    }

    public function test_student_can_view_timetable_results_and_attendance(): void
    {
        $course = Course::create([
            'school_id' => $this->school->id,
            'name' => 'Data Structures',
            'code' => 'CS201',
            'credits' => 3,
            'capacity' => 40,
        ]);

        Enrollment::create([
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_IN_PROGRESS,
        ]);

        CourseSchedule::create([
            'course_id' => $course->id,
            'day_of_week' => 1,
            'starts_at' => '09:00',
            'ends_at' => '10:30',
            'location' => 'Lecture Hall A',
        ]);

        AttendanceRecord::create([
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'course_id' => $course->id,
            'date' => now()->toDateString(),
            'status' => 'present',
        ]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/timetable')
            ->assertOk()
            ->assertJsonStructure(['data']);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/attendance')
            ->assertOk()
            ->assertJsonStructure(['data' => ['overall', 'byCourse', 'recentLogs']]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/results')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_student_can_view_and_pay_fees(): void
    {
        $fee = FeeItem::create([
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'term' => 'Fall 2026',
            'description' => 'Tuition Installment 1',
            'amount' => 500.00,
            'due_date' => now()->addMonth(),
        ]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/fees')
            ->assertOk()
            ->assertJsonPath('data.summary.totalDue', 500);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/fees/outstanding')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/v1/student/fees/pay', [
                'feeItemIds' => [$fee->id],
                'method' => 'card',
            ])
            ->assertOk()
            ->assertJsonPath('data.amount', 500);

        $this->assertEquals(0, $fee->fresh()->outstanding());
    }

    public function test_student_can_manage_notifications_and_profile(): void
    {
        $notification = StudentNotification::create([
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'title' => 'Grade Posted',
            'message' => 'Your grade for Lab 1 has been uploaded.',
            'type' => 'academic',
            'is_read' => false,
        ]);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/v1/student/notifications/{$notification->id}/read")
            ->assertOk();

        $this->assertTrue((bool) $notification->fresh()->is_read);

        // Profile show and update
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/v1/student/profile')
            ->assertOk()
            ->assertJsonPath('data.name', 'Miles Morales');

        $this->actingAs($this->student, 'sanctum')
            ->putJson('/api/v1/student/profile', [
                'phone' => '+15559876543',
                'address' => 'Brooklyn, NY',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'saved');

        $this->assertEquals('+15559876543', $this->student->fresh()->phone);
    }
}
