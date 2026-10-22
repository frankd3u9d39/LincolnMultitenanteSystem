<?php

namespace Tests\Feature\Teacher;

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

class TeacherResultTest extends TestCase
{
    use RefreshDatabase;

    private School $school;
    private User $teacher;
    private User $otherTeacher;
    private User $admin;
    private SchoolClass $schoolClass;
    private Course $course;
    private User $studentUser;
    private Student $studentProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Lincoln Science Academy',
            'code' => 'LSA-001',
            'slug' => 'lincoln-science-academy',
            'domain' => 'lsa.lincoln.edu',
            'contact_email' => 'admin@lsa.lincoln.edu',
            'status' => School::STATUS_ACTIVE,
            'academic_year_current' => 'First Term 2025/2026',
        ]);

        $this->admin = User::create([
            'school_id' => $this->school->id,
            'name' => 'Principal Administrator',
            'email' => 'admin@lsa.lincoln.edu',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->teacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Dr. Paul Okonkwo',
            'email' => 'p.okonkwo@lsa.lincoln.edu',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->otherTeacher = User::create([
            'school_id' => $this->school->id,
            'name' => 'Mrs. Stella Adebayo',
            'email' => 's.adebayo@lsa.lincoln.edu',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->schoolClass = SchoolClass::create([
            'school_id' => $this->school->id,
            'name' => 'Grade 10 - Alpha',
            'code' => 'G10-ALPHA',
            'teacher_id' => $this->teacher->id,
        ]);

        $this->course = Course::create([
            'school_id' => $this->school->id,
            'code' => 'BIO101',
            'name' => 'General Biology',
            'teacher_id' => $this->teacher->id,
            'term' => 'First Term 2025/2026',
        ]);

        // Attach course to class
        $this->schoolClass->subjects()->attach($this->course->id, ['teacher_id' => $this->teacher->id]);

        $this->studentUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Chioma Obi',
            'email' => 'chioma@student.lincoln.edu',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->studentProfile = Student::create([
            'user_id' => $this->studentUser->id,
            'student_id_number' => 'LSA-STD-1001',
            'grade_level' => 'Grade 10',
        ]);

        $this->schoolClass->students()->attach($this->studentProfile->id);
    }

    public function test_teacher_can_fetch_assigned_classes_and_subjects_for_results(): void
    {
        $res = $this->actingAs($this->teacher, 'sanctum')
            ->getJson('/api/v1/teacher/results/classes');

        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Grade 10 - Alpha')
            ->assertJsonPath('data.0.is_form_master', true);
    }

    public function test_teacher_can_fetch_class_result_roster(): void
    {
        $res = $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/teacher/classes/{$this->schoolClass->id}/results?course_id={$this->course->id}");

        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('class.name', 'Grade 10 - Alpha')
            ->assertJsonCount(1, 'students')
            ->assertJsonPath('students.0.name', 'Chioma Obi')
            ->assertJsonPath('students.0.student_id_number', 'LSA-STD-1001');
    }

    public function test_teacher_can_store_ca_and_exam_scores(): void
    {
        $res = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/teacher/classes/{$this->schoolClass->id}/results", [
                'course_id' => $this->course->id,
                'term' => 'First Term 2025/2026',
                'results' => [
                    [
                        'student_id' => $this->studentUser->id,
                        'ca_score' => 28.5,
                        'exam_score' => 54.0,
                        'remark' => 'Excellent performance in genetics module',
                    ],
                ],
            ]);

        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('saved_count', 1);

        $this->assertDatabaseHas('enrollments', [
            'school_id' => $this->school->id,
            'student_id' => $this->studentUser->id,
            'course_id' => $this->course->id,
            'term' => 'First Term 2025/2026',
            'ca_score' => 28.5,
            'exam_score' => 54.0,
            'score' => 82.5,
            'grade' => 'A',
            'status' => Enrollment::STATUS_COMPLETED,
        ]);
    }

    public function test_teacher_can_upload_class_results_csv(): void
    {
        $csvContent = "student_id_number,ca_score,exam_score,remark\nLSA-STD-1001,35,50,Great job";
        $file = UploadedFile::fake()->createWithContent('biology_scores.csv', $csvContent);

        $res = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/teacher/classes/{$this->schoolClass->id}/results/upload-csv", [
                'course_id' => $this->course->id,
                'term' => 'First Term 2025/2026',
                'file' => $file,
            ]);

        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('saved_count', 1);

        $this->assertDatabaseHas('enrollments', [
            'school_id' => $this->school->id,
            'student_id' => $this->studentUser->id,
            'course_id' => $this->course->id,
            'ca_score' => 35,
            'exam_score' => 50,
            'score' => 85,
            'grade' => 'A',
        ]);
    }

    public function test_teacher_can_download_csv_template_and_export(): void
    {
        // 1. Download PDF Template
        $pdfTemplateRes = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/v1/teacher/classes/{$this->schoolClass->id}/results/csv-template?course_id={$this->course->id}&format=pdf");
        $pdfTemplateRes->assertOk();
        $this->assertStringContainsString('application/pdf', $pdfTemplateRes->headers->get('Content-Type'));

        // 2. Download CSV Template
        $csvTemplateRes = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/v1/teacher/classes/{$this->schoolClass->id}/results/csv-template?course_id={$this->course->id}&format=csv");
        $csvTemplateRes->assertOk();
        $this->assertStringContainsString('text/csv', $csvTemplateRes->headers->get('Content-Type'));

        // 3. Download PDF Broadsheet Export
        $pdfExportRes = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/v1/teacher/classes/{$this->schoolClass->id}/results/export?course_id={$this->course->id}&format=pdf");
        $pdfExportRes->assertOk();
        $this->assertStringContainsString('application/pdf', $pdfExportRes->headers->get('Content-Type'));

        // 4. Download CSV Broadsheet Export
        $csvExportRes = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/v1/teacher/classes/{$this->schoolClass->id}/results/export?course_id={$this->course->id}&format=csv");
        $csvExportRes->assertOk();
        $this->assertStringContainsString('text/csv', $csvExportRes->headers->get('Content-Type'));
    }

    public function test_admin_can_retrieve_and_download_teacher_uploaded_results(): void
    {
        // 1. Teacher uploads results
        Enrollment::create([
            'school_id' => $this->school->id,
            'student_id' => $this->studentUser->id,
            'course_id' => $this->course->id,
            'school_class_id' => $this->schoolClass->id,
            'term' => 'First Term 2025/2026',
            'ca_score' => 30,
            'exam_score' => 45,
            'score' => 75,
            'grade' => 'A',
            'remark' => 'Distinction',
            'status' => Enrollment::STATUS_COMPLETED,
        ]);

        // 2. Admin retrieves result overview with metadata
        $adminGet = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/admin/classes/{$this->schoolClass->id}/results?course_id={$this->course->id}");

        $adminGet->assertOk()
            ->assertJsonPath('class.name', 'Grade 10 - Alpha')
            ->assertJsonPath('meta.completion_status', 'completed')
            ->assertJsonPath('meta.graded_count', 1);

        // 3. Admin downloads the CSV broadsheet
        $adminExport = $this->actingAs($this->admin, 'sanctum')
            ->get("/api/v1/admin/classes/{$this->schoolClass->id}/results/export?course_id={$this->course->id}");

        $adminExport->assertOk();
        $this->assertStringContainsString('text/csv', $adminExport->headers->get('Content-Type'));
    }

    public function test_teacher_can_upload_test_ca_file_and_student_sees_it_immediately(): void
    {
        // 1. Teacher uploads Test (CA) file only
        $caCsv = "student_id_number,test_score,remark\nLSA-STD-1001,36,Continuous Assessment Midterm";
        $file = UploadedFile::fake()->createWithContent('ca_test_scores.csv', $caCsv);

        $uploadRes = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/teacher/classes/{$this->schoolClass->id}/results/upload-csv", [
                'course_id' => $this->course->id,
                'term' => 'First Term 2025/2026',
                'file' => $file,
            ]);

        $uploadRes->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('saved_count', 1);

        $this->assertDatabaseHas('enrollments', [
            'school_id' => $this->school->id,
            'student_id' => $this->studentUser->id,
            'course_id' => $this->course->id,
            'ca_score' => 36,
            'exam_score' => null,
            'score' => 36,
        ]);

        // 2. Aligned student logs in and immediately sees the Test (CA) result
        $studentRes = $this->actingAs($this->studentUser, 'sanctum')
            ->getJson('/api/v1/student/results');

        $studentRes->assertOk()
            ->assertJsonPath('data.history.0.courses.0.ca_score', 36)
            ->assertJsonPath('data.history.0.courses.0.exam_score', null)
            ->assertJsonPath('data.history.0.courses.0.name', 'General Biology');
    }

    public function test_teacher_can_upload_exam_file_afterwards_and_merges_with_test_score(): void
    {
        // 1. Pre-existing CA test score
        Enrollment::create([
            'school_id' => $this->school->id,
            'student_id' => $this->studentUser->id,
            'course_id' => $this->course->id,
            'school_class_id' => $this->schoolClass->id,
            'term' => 'First Term 2025/2026',
            'ca_score' => 32,
            'exam_score' => null,
            'score' => 32,
            'grade' => 'IP',
            'status' => Enrollment::STATUS_IN_PROGRESS,
            'progress' => 50,
        ]);

        // 2. Teacher uploads Exam file only
        $examCsv = "id_number,exam,remark\nLSA-STD-1001,52,Final Exam";
        $file = UploadedFile::fake()->createWithContent('exam_scores.csv', $examCsv);

        $uploadRes = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/teacher/classes/{$this->schoolClass->id}/results/upload-csv", [
                'course_id' => $this->course->id,
                'term' => 'First Term 2025/2026',
                'file' => $file,
            ]);

        $uploadRes->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('saved_count', 1);

        // 3. Database should now contain merged score: 32 (CA) + 52 (Exam) = 84 (Total), Grade A
        $this->assertDatabaseHas('enrollments', [
            'school_id' => $this->school->id,
            'student_id' => $this->studentUser->id,
            'course_id' => $this->course->id,
            'ca_score' => 32,
            'exam_score' => 52,
            'score' => 84,
            'grade' => 'A',
            'status' => Enrollment::STATUS_COMPLETED,
        ]);

        // 4. Student sees updated combined score in portal
        $studentRes = $this->actingAs($this->studentUser, 'sanctum')
            ->getJson('/api/v1/student/results');

        $studentRes->assertOk()
            ->assertJsonPath('data.history.0.courses.0.ca_score', 32)
            ->assertJsonPath('data.history.0.courses.0.exam_score', 52)
            ->assertJsonPath('data.history.0.courses.0.score', 84)
            ->assertJsonPath('data.history.0.courses.0.grade', 'A');
    }

    public function test_teacher_can_download_specific_templates_ca_and_exam(): void
    {
        // 1. CA Template in PDF format
        $caPdfRes = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/v1/teacher/classes/{$this->schoolClass->id}/results/csv-template?course_id={$this->course->id}&type=ca&format=pdf");
        $caPdfRes->assertOk();
        $this->assertStringContainsString('application/pdf', $caPdfRes->headers->get('Content-Type'));

        // 2. CA Template in CSV format
        $caCsvRes = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/v1/teacher/classes/{$this->schoolClass->id}/results/csv-template?course_id={$this->course->id}&type=ca&format=csv");
        $caCsvRes->assertOk();
        $this->assertStringContainsString('ca_score', $caCsvRes->streamedContent());

        // 3. Exam Template in PDF format
        $examPdfRes = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/v1/teacher/classes/{$this->schoolClass->id}/results/csv-template?course_id={$this->course->id}&type=exam&format=pdf");
        $examPdfRes->assertOk();
        $this->assertStringContainsString('application/pdf', $examPdfRes->headers->get('Content-Type'));

        // 4. Exam Template in CSV format
        $examCsvRes = $this->actingAs($this->teacher, 'sanctum')
            ->get("/api/v1/teacher/classes/{$this->schoolClass->id}/results/csv-template?course_id={$this->course->id}&type=exam&format=csv");
        $examCsvRes->assertOk();
        $this->assertStringContainsString('exam_score', $examCsvRes->streamedContent());
    }
}

