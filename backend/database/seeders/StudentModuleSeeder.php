<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\Enrollment;
use App\Models\FeeItem;
use App\Models\FeePayment;
use App\Models\School;
use App\Models\StudentNotification;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * GROUP 1: Student Module - development fixtures.
 *
 * Builds one realistic student (with courses, assignments, attendance, fees
 * and notifications) inside the first active school, so the frontend has
 * real data to render instead of mocks.
 */
class StudentModuleSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::where('status', School::STATUS_ACTIVE)->first();

        if (! $school) {
            $this->command?->warn('No active school found; skipping student fixtures.');

            return;
        }

        $teacher = User::firstOrCreate(
            ['email' => 'dr.jenkins@lincolnplatform.io'],
            [
                'school_id' => $school->id,
                'name' => 'Dr. Sarah Jenkins',
                'password' => Hash::make('password'),
                'role' => User::ROLE_TEACHER,
                'status' => User::STATUS_ACTIVE,
                'password_changed_at' => now(),
            ]
        );

        $student = User::firstOrCreate(
            ['email' => 'liam.chen@student.lincolnplatform.io'],
            [
                'school_id' => $school->id,
                'name' => 'Liam Chen',
                'password' => Hash::make('password'),
                'role' => User::ROLE_STUDENT,
                'status' => User::STATUS_ACTIVE,
                'phone' => '+1 (555) 123-4567',
                'password_changed_at' => now(),
                'preferences' => [
                    'program' => 'B.S. Computer Science',
                    'dob' => '2005-08-14',
                    'address' => '123 Campus Drive, Apt 4B, University City, ST 12345',
                    'emergencyContact' => ['name' => 'Michael Chen', 'relation' => 'Father', 'phone' => '+1 (555) 987-6543'],
                ],
            ]
        );

        $courseDefs = [
            ['code' => 'PHY-401', 'name' => 'Advanced Physics', 'department' => 'Physics', 'credits' => 4, 'color' => 'bg-emerald-600', 'day' => 1, 'start' => '09:00', 'end' => '10:30', 'location' => 'Room 304, Science Block'],
            ['code' => 'MAT-302', 'name' => 'Calculus III', 'department' => 'Mathematics', 'credits' => 4, 'color' => 'bg-blue-600', 'day' => 1, 'start' => '11:00', 'end' => '12:30', 'location' => 'Hall B, Main Building'],
            ['code' => 'CSC-201', 'name' => 'Computer Science', 'department' => 'Computer Science', 'credits' => 3, 'color' => 'bg-indigo-600', 'day' => 1, 'start' => '14:00', 'end' => '16:00', 'location' => 'Lab 4, Tech Center'],
            ['code' => 'LIT-105', 'name' => 'English Literature', 'department' => 'Arts', 'credits' => 3, 'color' => 'bg-amber-600', 'day' => 2, 'start' => '10:00', 'end' => '11:30', 'location' => 'Room 102, Arts Wing'],
            ['code' => 'CHE-301', 'name' => 'Organic Chemistry', 'department' => 'Chemistry', 'credits' => 4, 'color' => 'bg-teal-600', 'day' => 4, 'start' => '13:00', 'end' => '16:00', 'location' => 'Chemistry Lab 2'],
        ];

        $courses = [];

        foreach ($courseDefs as $def) {
            $course = Course::firstOrCreate(
                ['school_id' => $school->id, 'code' => $def['code'], 'term' => 'Current Term'],
                [
                    'teacher_id' => $teacher->id,
                    'name' => $def['name'],
                    'department' => $def['department'],
                    'credits' => $def['credits'],
                    'color' => $def['color'],
                    'capacity' => 30,
                ]
            );

            CourseSchedule::firstOrCreate(
                ['course_id' => $course->id, 'day_of_week' => $def['day']],
                ['starts_at' => $def['start'], 'ends_at' => $def['end'], 'location' => $def['location'], 'type' => 'Lecture']
            );

            $courses[$def['code']] = $course;

            Enrollment::firstOrCreate(
                ['student_id' => $student->id, 'course_id' => $course->id, 'term' => 'Current Term'],
                ['school_id' => $school->id, 'status' => Enrollment::STATUS_IN_PROGRESS, 'progress' => rand(20, 90)]
            );
        }

        // An open course the student has not enrolled in, so the catalog has something to browse.
        Course::firstOrCreate(
            ['school_id' => $school->id, 'code' => 'CSC-301', 'term' => 'Current Term'],
            ['teacher_id' => $teacher->id, 'name' => 'Introduction to AI', 'department' => 'Computer Science', 'credits' => 4, 'color' => 'bg-indigo-600', 'capacity' => 30]
        );

        // A completed prior term, for GPA/results history.
        $priorCourses = [
            ['code' => 'MAT-201', 'name' => 'Calculus II', 'credits' => 4, 'grade' => 'A', 'score' => 94],
            ['code' => 'PHY-101', 'name' => 'Physics Mechanics', 'credits' => 4, 'grade' => 'A-', 'score' => 91],
            ['code' => 'CSC-101', 'name' => 'Introduction to Programming', 'credits' => 3, 'grade' => 'A', 'score' => 98],
        ];

        foreach ($priorCourses as $def) {
            $course = Course::firstOrCreate(
                ['school_id' => $school->id, 'code' => $def['code'], 'term' => 'Spring Semester 2026'],
                ['name' => $def['name'], 'credits' => $def['credits'], 'capacity' => 30]
            );

            Enrollment::firstOrCreate(
                ['student_id' => $student->id, 'course_id' => $course->id, 'term' => 'Spring Semester 2026'],
                ['school_id' => $school->id, 'status' => Enrollment::STATUS_COMPLETED, 'progress' => 100, 'grade' => $def['grade'], 'score' => $def['score']]
            );
        }

        // Assignments across the active courses, with a mix of pending/submitted/graded.
        $assignmentDefs = [
            ['course' => 'PHY-401', 'title' => 'Chapter 4: Thermodynamics Problem Set', 'type' => 'Homework', 'points' => 100, 'due' => now()->addDays(2), 'status' => 'pending'],
            ['course' => 'LIT-105', 'title' => 'Midterm Essay on Hamlet', 'type' => 'Essay', 'points' => 200, 'due' => now()->addDays(4), 'status' => 'pending'],
            ['course' => 'CSC-201', 'title' => 'Binary Trees Implementation', 'type' => 'Project', 'points' => 150, 'due' => now()->subDays(3), 'status' => 'pending'],
            ['course' => 'CHE-301', 'title' => 'Lab Report: Titration', 'type' => 'Lab', 'points' => 50, 'due' => now()->subDays(7), 'status' => 'submitted'],
            ['course' => 'MAT-302', 'title' => 'Limits and Continuity Quiz', 'type' => 'Quiz', 'points' => 20, 'due' => now()->subDays(10), 'status' => 'graded', 'score' => 18],
            ['course' => 'CSC-201', 'title' => 'Algorithm Complexity Analysis', 'type' => 'Assignment', 'points' => 100, 'due' => now()->addDays(1), 'status' => 'pending'],
        ];

        foreach ($assignmentDefs as $def) {
            $course = $courses[$def['course']];

            $assignment = Assignment::firstOrCreate(
                ['course_id' => $course->id, 'title' => $def['title']],
                ['school_id' => $school->id, 'type' => $def['type'], 'points' => $def['points'], 'due_at' => $def['due']]
            );

            AssignmentSubmission::firstOrCreate(
                ['assignment_id' => $assignment->id, 'student_id' => $student->id],
                [
                    'status' => $def['status'],
                    'submitted_at' => $def['status'] !== 'pending' ? $def['due']->copy()->subDay() : null,
                    'score' => $def['score'] ?? null,
                    'graded_at' => $def['status'] === 'graded' ? $def['due']->copy()->addDay() : null,
                ]
            );
        }

        // Attendance, last 15 school days per active course.
        foreach ($courses as $course) {
            for ($i = 15; $i >= 1; $i--) {
                $date = now()->subDays($i);

                if ($date->isWeekend()) {
                    continue;
                }

                $roll = rand(1, 100);
                $status = $roll <= 85 ? AttendanceRecord::STATUS_PRESENT : ($roll <= 93 ? AttendanceRecord::STATUS_LATE : AttendanceRecord::STATUS_ABSENT);

                AttendanceRecord::firstOrCreate(
                    ['course_id' => $course->id, 'student_id' => $student->id, 'date' => $date->toDateString()],
                    ['school_id' => $school->id, 'status' => $status]
                );
            }
        }

        // Fees for the current term.
        $feeDefs = [
            ['description' => 'Tuition Fee (Fall 2026)', 'amount' => 4500.00, 'paid' => 2500.00],
            ['description' => 'Lab Equipment Fee', 'amount' => 350.00, 'paid' => 0],
            ['description' => 'Library & Technology Fee', 'amount' => 100.00, 'paid' => 0],
            ['description' => 'Student Union Fee', 'amount' => 50.00, 'paid' => 50.00],
        ];

        foreach ($feeDefs as $def) {
            $item = FeeItem::firstOrCreate(
                ['student_id' => $student->id, 'term' => 'Fall 2026', 'description' => $def['description']],
                ['school_id' => $school->id, 'amount' => $def['amount'], 'paid_amount' => $def['paid'], 'due_date' => now()->addMonth()]
            );

            if ($def['paid'] > 0 && FeePayment::where('fee_item_id', $item->id)->doesntExist()) {
                FeePayment::create([
                    'school_id' => $school->id,
                    'student_id' => $student->id,
                    'fee_item_id' => $item->id,
                    'amount' => $def['paid'],
                    'method' => 'Credit Card (ends in 4242)',
                    'receipt_number' => '#REC-'.Str::upper(Str::random(6)),
                    'paid_at' => now()->subWeeks(2),
                ]);
            }
        }

        // Notifications.
        $notifDefs = [
            ['title' => 'Tuition Payment Due', 'message' => 'Your Fall 2026 tuition payment is due soon.', 'type' => 'Finance', 'read' => false],
            ['title' => 'Assignment Graded: Calculus III', 'message' => 'Prof. David Mercer has posted grades for "Limits and Continuity Quiz". You scored 18/20.', 'type' => 'Academic', 'read' => false],
            ['title' => 'Library Closure Notice', 'message' => 'The Main Library will be closed this weekend for system maintenance.', 'type' => 'Campus', 'read' => true],
            ['title' => 'Registration for Spring 2027', 'message' => 'Early registration for the Spring 2027 semester opens next week.', 'type' => 'Academic', 'read' => true],
        ];

        foreach ($notifDefs as $def) {
            StudentNotification::firstOrCreate(
                ['student_id' => $student->id, 'title' => $def['title']],
                ['school_id' => $school->id, 'message' => $def['message'], 'type' => $def['type'], 'is_read' => $def['read']]
            );
        }

        $this->command?->info("Student fixtures seeded for {$student->email} (password).");
    }
}
