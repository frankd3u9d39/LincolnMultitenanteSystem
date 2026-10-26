<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResultsAndCbtTest extends TestCase
{
    use RefreshDatabase;

    private School $cbtSchool;

    private School $paperSchool;

    private User $superAdmin;

    private User $cbtAdmin;

    private User $cbtStudent;

    private SchoolClass $schoolClass;

    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. SuperAdmin
        $this->superAdmin = User::create([
            'name' => 'Super Admin Platform',
            'email' => 'superadmin@lincolnplatform.io',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_SUPERADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        // 2. School with CBT Enabled
        $this->cbtSchool = School::create([
            'name' => 'Lincoln Science Secondary School',
            'code' => 'LC-SSS-01',
            'slug' => 'lincoln-sss',
            'domain' => 'sss.lincoln.edu',
            'contact_email' => 'admin@sss.lincoln.edu',
            'status' => School::STATUS_ACTIVE,
            'cbt_enabled' => true,
            'academic_year_current' => 'First Term 2025/2026',
            'max_students' => 100,
            'max_teachers' => 20,
        ]);

        // 3. School without CBT (Paper-based only)
        $this->paperSchool = School::create([
            'name' => 'Lincoln Rural Primary School',
            'code' => 'LC-RPS-01',
            'slug' => 'lincoln-rps',
            'domain' => 'rps.lincoln.edu',
            'contact_email' => 'admin@rps.lincoln.edu',
            'status' => School::STATUS_ACTIVE,
            'cbt_enabled' => false,
            'academic_year_current' => 'First Term 2025/2026',
            'max_students' => 100,
            'max_teachers' => 20,
        ]);

        // 4. Admin for CBT School
        $this->cbtAdmin = User::create([
            'school_id' => $this->cbtSchool->id,
            'name' => 'Principal CBT',
            'email' => 'principal@sss.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        // 5. Student in CBT School
        $this->cbtStudent = User::create([
            'school_id' => $this->cbtSchool->id,
            'name' => 'Emeka Obi',
            'email' => 'emeka.obi@sss.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $studentProfile = Student::create([
            'user_id' => $this->cbtStudent->id,
            'student_id_number' => 'LC-STD-9901',
            'grade_level' => 'SS 2 Science',
            'guardian_name' => 'Dr. Obi',
            'guardian_phone' => '08012345678',
            'address' => '12 Victoria Island, Lagos',
        ]);

        $teacher = User::create([
            'school_id' => $this->cbtSchool->id,
            'name' => 'Mr. Okonjo Teacher',
            'email' => 'teacher@sss.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        // 6. Class & Course
        $this->schoolClass = SchoolClass::create([
            'name' => 'SS 2 Science Gold',
            'code' => 'SS2-SCI-A',
            'room' => 'Lab Block B',
            'teacher_id' => $teacher->id,
        ]);

        // Attach student to class
        $this->schoolClass->students()->attach($studentProfile->id);

        $this->course = Course::create([
            'school_id' => $this->cbtSchool->id,
            'name' => 'Further Mathematics',
            'code' => 'FMTH-201',
            'department' => 'Science',
            'credits' => 3,
        ]);

        $this->schoolClass->subjects()->attach($this->course->id);
    }

    public function test_superadmin_can_toggle_cbt_for_school(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->patchJson("/api/v1/superadmin/schools/{$this->paperSchool->id}/cbt", [
            'cbt_enabled' => true,
        ]);

        $response->assertOk();
        $response->assertJson([
            'data' => [
                'cbtEnabled' => true,
            ],
        ]);

        $this->assertTrue($this->paperSchool->fresh()->cbt_enabled);
    }

    public function test_paper_based_school_cannot_schedule_cbt_exams(): void
    {
        $paperAdmin = User::create([
            'school_id' => $this->paperSchool->id,
            'name' => 'Paper Principal',
            'email' => 'principal@rps.lincoln.edu',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->actingAs($paperAdmin);

        $response = $this->postJson('/api/v1/admin/examinations', [
            'courseCode' => 'ENG-101',
            'courseName' => 'Basic English',
            'title' => 'First Term Exam',
            'date' => now()->addDays(5)->toDateString(),
            'time' => '09:00 - 11:00',
            'venue' => 'Main Hall',
            'duration' => '2.0 Hours',
            'format' => 'CBT (Computer Based Test)',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('CBT examinations are disabled for this institution', $response->json('message'));
    }

    public function test_cbt_school_can_schedule_cbt_exam_with_access_code(): void
    {
        $this->actingAs($this->cbtAdmin);

        $response = $this->postJson('/api/v1/admin/examinations', [
            'courseCode' => $this->course->code,
            'courseName' => $this->course->name,
            'title' => 'SS2 CBT Physics Mock',
            'date' => now()->addDays(2)->toDateString(),
            'time' => '10:00 - 11:30',
            'venue' => 'Digital Computer Lab A',
            'duration' => '1.5 Hours',
            'format' => 'CBT (Computer Based Test)',
            'cbtAccessCode' => 'CBT-PHYS-2026',
        ]);

        $response->assertCreated();
        $response->assertJson([
            'data' => [
                'format' => 'CBT (Computer Based Test)',
                'cbtAccessCode' => 'CBT-PHYS-2026',
            ],
        ]);
    }

    public function test_admin_can_save_and_compute_class_ca_and_exam_scores(): void
    {
        $this->actingAs($this->cbtAdmin);

        // Fetch class results view
        $indexResponse = $this->getJson("/api/v1/admin/classes/{$this->schoolClass->id}/results?course_id={$this->course->id}");
        $indexResponse->assertOk();
        $indexResponse->assertJsonStructure([
            'class',
            'subjects',
            'term',
            'students',
        ]);

        // Submit CA = 32 and Exam = 54 (Total = 86 -> Grade A -> Distinction)
        $storeResponse = $this->postJson("/api/v1/admin/classes/{$this->schoolClass->id}/results", [
            'course_id' => $this->course->id,
            'term' => 'First Term 2025/2026',
            'results' => [
                [
                    'student_id' => $this->cbtStudent->id,
                    'ca_score' => 32.5,
                    'exam_score' => 54.0,
                ],
            ],
        ]);

        $storeResponse->assertOk();
        $storeResponse->assertJson([
            'saved_count' => 1,
        ]);

        // Verify in database
        $enrollment = Enrollment::where('school_id', $this->cbtSchool->id)
            ->where('student_id', $this->cbtStudent->id)
            ->where('course_id', $this->course->id)
            ->first();

        $this->assertNotNull($enrollment);
        $this->assertEquals(32.5, (float) $enrollment->ca_score);
        $this->assertEquals(54.0, (float) $enrollment->exam_score);
        $this->assertEquals(86.5, (float) $enrollment->score);
        $this->assertEquals('A', $enrollment->grade);
        $this->assertEquals('Distinction', $enrollment->remark);
    }

    public function test_admin_can_upload_csv_results(): void
    {
        $this->actingAs($this->cbtAdmin);

        $csvContent = "student_id,name,ca_score,exam_score\n";
        $csvContent .= "{$this->cbtStudent->id},\"Emeka Obi\",28.0,47.0\n";

        $file = UploadedFile::fake()->createWithContent('results.csv', $csvContent);

        $response = $this->postJson("/api/v1/admin/classes/{$this->schoolClass->id}/results/upload-csv", [
            'course_id' => $this->course->id,
            'term' => 'First Term 2025/2026',
            'file' => $file,
        ]);

        $response->assertOk();
        $response->assertJson([
            'saved_count' => 1,
        ]);

        // Verify total = 75 -> Grade A
        $enrollment = Enrollment::where('school_id', $this->cbtSchool->id)
            ->where('student_id', $this->cbtStudent->id)
            ->first();

        $this->assertEquals(28.0, (float) $enrollment->ca_score);
        $this->assertEquals(47.0, (float) $enrollment->exam_score);
        $this->assertEquals(75.0, (float) $enrollment->score);
        $this->assertEquals('A', $enrollment->grade);
    }

    public function test_admin_can_download_csv_template(): void
    {
        $this->actingAs($this->cbtAdmin);

        $response = $this->get("/api/v1/admin/classes/{$this->schoolClass->id}/results/csv-template?course_id={$this->course->id}&term=First+Term+2025%2F2026");

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('student_id_number,student_name,email,ca_score,exam_score,remark', $response->streamedContent());
    }

    public function test_admin_can_upload_csv_via_csv_upload_route(): void
    {
        $this->actingAs($this->cbtAdmin);

        $csvContent = "student_id_number,ca_score,exam_score,remark\n";
        $csvContent .= "LC-STD-9901,30.0,50.0,Distinction\n";

        $file = UploadedFile::fake()->createWithContent('results.csv', $csvContent);

        $response = $this->postJson("/api/v1/admin/classes/{$this->schoolClass->id}/results/csv-upload", [
            'course_id' => $this->course->id,
            'term' => 'First Term 2025/2026',
            'file' => $file,
        ]);

        $response->assertOk();
        $response->assertJson([
            'saved_count' => 1,
        ]);
    }

    public function test_student_dashboard_results_reflect_ca_and_exam(): void
    {
        // Pre-create enrollment with CA + Exam
        Enrollment::create([
            'school_id' => $this->cbtSchool->id,
            'student_id' => $this->cbtStudent->id,
            'course_id' => $this->course->id,
            'term' => 'First Term 2025/2026',
            'ca_score' => 30.0,
            'exam_score' => 50.0,
            'score' => 80.0,
            'grade' => 'A',
            'remark' => 'Distinction',
            'status' => Enrollment::STATUS_COMPLETED,
            'progress' => 100,
        ]);

        $this->actingAs($this->cbtStudent);

        $response = $this->getJson('/api/v1/student/results');
        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'summary' => ['cgpa', 'totalCredits', 'standing'],
                'history' => [
                    '*' => [
                        'term',
                        'tgpa',
                        'courses' => [
                            '*' => [
                                'id',
                                'name',
                                'code',
                                'ca_score',
                                'exam_score',
                                'score',
                                'grade',
                                'remark',
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $courses = $response->json('data.history.0.courses');
        $this->assertEquals(30.0, $courses[0]['ca_score']);
        $this->assertEquals(50.0, $courses[0]['exam_score']);
        $this->assertEquals(80.0, $courses[0]['score']);
        $this->assertEquals('A', $courses[0]['grade']);
        $this->assertEquals('Distinction', $courses[0]['remark']);
    }

    public function test_student_cbt_exam_workflow_with_access_code_and_submission(): void
    {
        // 1. Admin schedules a CBT Exam
        $exam = Assignment::create([
            'school_id' => $this->cbtSchool->id,
            'course_id' => $this->course->id,
            'teacher_id' => $this->cbtAdmin->id,
            'title' => 'First Term CBT Math Exam',
            'type' => 'Exam',
            'points' => 60,
            'due_at' => now()->addDays(1),
            'instructions' => json_encode([
                'format' => 'CBT (Computer Based Test)',
                'cbt_access_code' => 'MTH-ACCESS-77',
                'duration' => '45 Minutes',
                'status' => 'Scheduled',
            ]),
        ]);

        $this->actingAs($this->cbtStudent);

        // 2. Student lists CBT exams
        $listResponse = $this->getJson('/api/v1/student/cbt/exams');
        $listResponse->assertOk();
        $listResponse->assertJson([
            'cbt_enabled' => true,
        ]);

        // 3. Verification with wrong access code fails
        $failResponse = $this->postJson('/api/v1/student/cbt/verify-access', [
            'exam_id' => $exam->id,
            'student_name' => 'Emeka Obi',
            'student_id_number' => 'LC-STD-9901',
            'access_code' => 'WRONG-CODE',
        ]);
        $failResponse->assertStatus(422);

        // 4. Verification with valid access code succeeds and provides questions
        $verifyResponse = $this->postJson('/api/v1/student/cbt/verify-access', [
            'exam_id' => $exam->id,
            'student_name' => 'Emeka Obi',
            'student_id_number' => 'LC-STD-9901',
            'access_code' => 'MTH-ACCESS-77',
        ]);
        $verifyResponse->assertOk();
        $verifyResponse->assertJson([
            'verified' => true,
            'exam' => [
                'id' => $exam->id,
                'totalPoints' => 60,
            ],
        ]);
        $questions = $verifyResponse->json('questions');
        $this->assertNotEmpty($questions);

        // 5. Submit answers for grading
        $answers = [];
        foreach ($questions as $q) {
            $answers[$q['id']] = $q['correct_answer']; // answer all correctly
        }

        $submitResponse = $this->postJson('/api/v1/student/cbt/submit', [
            'exam_id' => $exam->id,
            'answers' => $answers,
        ]);

        $submitResponse->assertOk();
        $submitResponse->assertJson([
            'result' => [
                'status' => 'pending_teacher_marking',
                'hasSubmitted' => true,
                'totalQuestions' => count($questions),
            ],
        ]);

        // 6. Verification after submission blocks re-entry
        $reverify = $this->postJson('/api/v1/student/cbt/verify-access', [
            'exam_id' => $exam->id,
            'student_name' => 'Emeka Obi',
            'student_id_number' => 'LC-STD-9901',
            'access_code' => 'MTH-ACCESS-77',
        ]);
        $reverify->assertStatus(400);
    }
}
