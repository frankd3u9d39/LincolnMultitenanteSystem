<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CbtEndToEndTest extends TestCase
{
    use RefreshDatabase;

    private School $school;
    private User $superAdmin;
    private User $admin;
    private User $teacher;
    private User $student;
    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Setup a school initially with CBT disabled
        $this->school = School::create([
            'name' => 'St. Jude International Academy',
            'code' => 'STJ-SMTS-001',
            'slug' => 'st-jude-academy',
            'domain' => 'stjude.edu.ng',
            'contact_email' => 'admin@stjude.edu.ng',
            'status' => School::STATUS_ACTIVE,
            'cbt_enabled' => false,
            'academic_year_current' => 'First Term 2025/2026',
        ]);

        $this->superAdmin = User::create([
            'name' => 'Platform SuperAdmin',
            'email' => 'superadmin@lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_SUPERADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->admin = User::create([
            'school_id' => $this->school->id,
            'name' => 'Principal Administrator',
            'email' => 'principal@stjude.edu.ng',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->teacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Mr. Aliyu Mathematics',
            'email' => 'aliyu@stjude.edu.ng',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->student = User::create([
            'school_id' => $this->school->id,
            'name' => 'Chinedu Eze',
            'email' => 'chinedu@stjude.edu.ng',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->course = Course::create([
            'school_id' => $this->school->id,
            'teacher_id' => $this->teacher->id,
            'code' => 'MTH-101',
            'name' => 'Advanced Pure Mathematics',
            'credits' => 3,
            'term' => 'First Term 2025/2026',
            'capacity' => 45,
        ]);

        // Student has an initial continuous assessment score of 28/40
        Enrollment::create([
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'course_id' => $this->course->id,
            'term' => 'First Term 2025/2026',
            'ca_score' => 28.0,
            'exam_score' => null,
            'score' => 28.0,
            'grade' => 'F',
            'remark' => 'Incomplete (Pending Exam)',
            'status' => Enrollment::STATUS_IN_PROGRESS,
            'progress' => 50,
        ]);
    }

    public function test_full_cbt_lifecycle_end_to_end(): void
    {
        // -------------------------------------------------------------
        // STEP 1: Paper-Based School State
        // -------------------------------------------------------------
        // While school CBT is disabled, student should be notified:
        $resp = $this->actingAs($this->student, 'sanctum')->getJson('/api/v1/student/cbt/exams');
        $resp->assertOk()
            ->assertJsonPath('cbt_enabled', false)
            ->assertJsonPath('exams', []);

        // Admin trying to schedule CBT while disabled should be rejected:
        $adminScheduleFail = $this->actingAs($this->admin, 'sanctum')->postJson('/api/v1/admin/examinations', [
            'courseCode' => 'MTH-101',
            'courseName' => 'Advanced Pure Mathematics',
            'title' => 'First Term Final CBT Math Exam',
            'date' => now()->addDays(2)->toDateString(),
            'time' => '09:00 - 10:30',
            'venue' => 'Computer Lab A',
            'invigilator' => 'Mr. Aliyu',
            'format' => 'CBT (Computer Based Test)',
            'duration' => '45 Minutes',
            'cbtAccessCode' => 'MTH-SECURE-99',
        ]);
        $adminScheduleFail->assertStatus(422)
            ->assertJsonPath('message', 'CBT examinations are disabled for this institution. The platform SuperAdmin registered this school as Paper-Based Only due to computer facility capacity.');

        // -------------------------------------------------------------
        // STEP 2: SuperAdmin enables CBT for the School
        // -------------------------------------------------------------
        $cbtEnableResp = $this->actingAs($this->superAdmin, 'sanctum')->patchJson("/api/v1/superadmin/schools/{$this->school->id}/cbt", [
            'cbt_enabled' => true,
        ]);
        $cbtEnableResp->assertOk()
            ->assertJsonPath('data.cbtEnabled', true);

        $this->assertTrue($this->school->fresh()->cbt_enabled);

        // -------------------------------------------------------------
        // STEP 3: Admin schedules the CBT Examination with Access Code
        // -------------------------------------------------------------
        $this->admin->refresh();
        $adminScheduleOk = $this->actingAs($this->admin, 'sanctum')->postJson('/api/v1/admin/examinations', [
            'courseCode' => 'MTH-101',
            'courseName' => 'Advanced Pure Mathematics',
            'title' => 'First Term Final CBT Math Exam',
            'date' => now()->addDays(2)->toDateString(),
            'time' => '09:00 - 10:30',
            'venue' => 'Computer Lab A',
            'invigilator' => 'Mr. Aliyu',
            'format' => 'CBT (Computer Based Test)',
            'duration' => '45 Minutes',
            'cbtAccessCode' => 'MTH-SECURE-99',
        ]);

        $adminScheduleOk->assertCreated()
            ->assertJsonPath('data.title', 'First Term Final CBT Math Exam')
            ->assertJsonPath('data.cbtAccessCode', 'MTH-SECURE-99')
            ->assertJsonPath('data.format', 'CBT (Computer Based Test)');

        $examId = $adminScheduleOk->json('data.id');
        $this->assertNotNull($examId);

        // -------------------------------------------------------------
        // STEP 4: Student views CBT Schedule
        // -------------------------------------------------------------
        $studentListResp = $this->actingAs($this->student, 'sanctum')->getJson('/api/v1/student/cbt/exams');
        $studentListResp->assertOk()
            ->assertJsonPath('cbt_enabled', true)
            ->assertJsonCount(1, 'exams')
            ->assertJsonPath('exams.0.id', $examId)
            ->assertJsonPath('exams.0.title', 'First Term Final CBT Math Exam')
            ->assertJsonPath('exams.0.hasSubmitted', false)
            ->assertJsonPath('exams.0.status', 'Scheduled');

        // -------------------------------------------------------------
        // STEP 5: Student attempts verification with invalid access code
        // -------------------------------------------------------------
        $invalidVerify = $this->actingAs($this->student, 'sanctum')->postJson('/api/v1/student/cbt/verify-access', [
            'exam_id' => $examId,
            'student_name' => 'Chinedu Eze',
            'student_id_number' => 'LC-STD-0001',
            'access_code' => 'WRONG-CODE-123',
        ]);
        $invalidVerify->assertStatus(422)
            ->assertJsonPath('verified', false);

        // -------------------------------------------------------------
        // STEP 6: Student enters correct access code -> Enters CBT Hall
        // -------------------------------------------------------------
        $validVerify = $this->actingAs($this->student, 'sanctum')->postJson('/api/v1/student/cbt/verify-access', [
            'exam_id' => $examId,
            'student_name' => 'Chinedu Eze',
            'student_id_number' => 'LC-STD-0001',
            'access_code' => 'MTH-SECURE-99',
        ]);
        $validVerify->assertOk()
            ->assertJsonPath('verified', true)
            ->assertJsonPath('exam.id', $examId)
            ->assertJsonPath('exam.totalPoints', 60);

        $questions = $validVerify->json('questions');
        $this->assertCount(10, $questions);

        // -------------------------------------------------------------
        // STEP 7: Student answers 8 questions correctly and 2 incorrectly
        // -------------------------------------------------------------
        // 8 out of 10 correct = 80% of 60 marks = 48.0 marks on Exam!
        $answers = [];
        foreach ($questions as $index => $q) {
            if ($index < 8) {
                $answers[$q['id']] = $q['correct_answer']; // Correct (8 questions)
            } else {
                $answers[$q['id']] = 'D'; // Intentionally incorrect for last 2
            }
        }

        $submitResp = $this->actingAs($this->student, 'sanctum')->postJson('/api/v1/student/cbt/submit', [
            'exam_id' => $examId,
            'answers' => $answers,
        ]);

        $submitResp->assertOk()
            ->assertJsonPath('result.correctCount', 8)
            ->assertJsonPath('result.totalQuestions', 10)
            ->assertJsonPath('result.examScore', 48)
            ->assertJsonPath('result.examMax', 60);

        // -------------------------------------------------------------
        // STEP 8: Auto-Graded Result is Merged with Continuous Assessment
        // -------------------------------------------------------------
        // CA score = 28.0 + Exam score = 48.0 => Total = 76.0 => Grade 'A' (Distinction)!
        $submitResp->assertJsonPath('result.totalScore', 76)
            ->assertJsonPath('result.grade', 'A')
            ->assertJsonPath('result.remark', 'Distinction');

        // Check the database directly:
        $enrollment = Enrollment::where('school_id', $this->school->id)
            ->where('student_id', $this->student->id)
            ->where('course_id', $this->course->id)
            ->first();

        $this->assertNotNull($enrollment);
        $this->assertEquals(28.0, $enrollment->ca_score);
        $this->assertEquals(48.0, $enrollment->exam_score);
        $this->assertEquals(76.0, $enrollment->score);
        $this->assertEquals('A', $enrollment->grade);
        $this->assertEquals('Distinction', $enrollment->remark);

        // -------------------------------------------------------------
        // STEP 9: Student Academic Report Card reflects CBT Result
        // -------------------------------------------------------------
        $studentResults = $this->actingAs($this->student, 'sanctum')->getJson('/api/v1/student/results');
        $studentResults->assertOk();

        $history = $studentResults->json('data.history');
        $this->assertNotEmpty($history);
        $courses = $history[0]['courses'];
        $this->assertNotEmpty($courses);
        $mathCourse = collect($courses)->firstWhere('code', 'MTH-101');
        $this->assertNotNull($mathCourse);
        $this->assertEquals(28.0, $mathCourse['ca_score']);
        $this->assertEquals(48.0, $mathCourse['exam_score']);
        $this->assertEquals(76.0, $mathCourse['score']);
        $this->assertEquals('A', $mathCourse['grade']);
        $this->assertEquals('Distinction', $mathCourse['remark']);

        // -------------------------------------------------------------
        // STEP 10: Re-entry Protection
        // -------------------------------------------------------------
        // Attempting to verify access code again must be blocked with 400
        $reVerify = $this->actingAs($this->student, 'sanctum')->postJson('/api/v1/student/cbt/verify-access', [
            'exam_id' => $examId,
            'student_name' => 'Chinedu Eze',
            'student_id_number' => 'LC-STD-0001',
            'access_code' => 'MTH-SECURE-99',
        ]);
        $reVerify->assertStatus(400)
            ->assertJsonPath('verified', false);

        // Exam list now shows status 'Completed' and hasSubmitted = true
        $reList = $this->actingAs($this->student, 'sanctum')->getJson('/api/v1/student/cbt/exams');
        $reList->assertOk()
            ->assertJsonPath('exams.0.hasSubmitted', true)
            ->assertJsonPath('exams.0.status', 'Completed');
    }
}
