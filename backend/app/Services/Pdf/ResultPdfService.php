<?php

declare(strict_types=1);

namespace App\Services\Pdf;

use App\Models\Course;
use App\Models\SchoolClass;
use Illuminate\Support\Collection;

if (! class_exists('FPDF')) {
    if (file_exists(base_path('vendor/setasign/fpdf/fpdf.php'))) {
        require_once base_path('vendor/setasign/fpdf/fpdf.php');
    }
}

/**
 * Service to generate official PDF Score Sheet Templates and Broadsheets
 * for Lincoln Multitenant Educational System.
 */
class ResultPdfService
{
    /**
     * Generates a printable PDF template for offline scoring.
     * $type can be: 'ca' (Test only), 'exam' (Exam only), or 'combined' (both).
     */
    public function generateTemplatePdf(
        SchoolClass $schoolClass,
        ?Course $course,
        string $term,
        string $type,
        Collection|array $students,
        ?string $teacherName = null
    ): string {
        $orientation = ($type === 'combined') ? 'L' : 'P';
        $pdf = new LincolnPdf($orientation, 'mm', 'A4');
        $pdf->AliasNbPages();
        $pdf->SetMargins(12, 12, 12);
        $pdf->SetAutoPageBreak(true, 18);

        $school = $schoolClass->school;
        $schoolName = $school?->name ?? 'Lincoln College of Science Management & Technology';

        $typeTitle = match ($type) {
            '1ca', 'ca1' => 'CONTINUOUS ASSESSMENT (1ST CA / TEST 1) ROSTER SHEET',
            '2ca', 'ca2' => 'CONTINUOUS ASSESSMENT (2ND CA / TEST 2) ROSTER SHEET',
            'ca' => 'CONTINUOUS ASSESSMENT (TEST / CA) ROSTER SHEET',
            'exam' => 'TERMINAL EXAMINATION ROSTER SCORE SHEET',
            default => 'COMBINED ASSESSMENT & EXAMINATION ROSTER SHEET',
        };

        $maxScoreText = match ($type) {
            '1ca', 'ca1' => 'Assessment Scope: 1st Continuous Assessment (Maximum: 20 Marks)',
            '2ca', 'ca2' => 'Assessment Scope: 2nd Continuous Assessment (Maximum: 20 Marks)',
            'ca' => 'Assessment Scope: Continuous Assessment (Maximum: 40 Marks)',
            'exam' => 'Assessment Scope: Terminal Examination (Maximum: 70 Marks)',
            default => 'Assessment Scope: 1st CA (20 Marks) + 2nd CA (20 Marks) + Terminal Examination (70 Marks) = Total (100 Marks)',
        };

        $pdf->setDocumentHeader(
            schoolName: $schoolName,
            title: $typeTitle,
            className: $schoolClass->name.' ('.$schoolClass->code.')',
            subjectName: $course ? ($course->code.' - '.$course->name) : 'All Enrolled Subjects',
            term: $term,
            teacherName: $teacherName ?? ($schoolClass->teacher?->name ?? 'Subject Teacher'),
            subInfo: $maxScoreText
        );

        $pdf->AddPage();

        // Table Header
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->SetFillColor(184, 29, 34); // Lincoln Crimson
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetDrawColor(180, 180, 180);

        if ($type === '1ca' || $type === 'ca1') {
            $pdf->Cell(10, 8, 'S/N', 1, 0, 'C', true);
            $pdf->Cell(38, 8, 'Student ID Number', 1, 0, 'L', true);
            $pdf->Cell(62, 8, 'Student Full Name', 1, 0, 'L', true);
            $pdf->Cell(35, 8, '1st CA / Test (/20)', 1, 0, 'C', true);
            $pdf->Cell(41, 8, 'Teacher Remark / Signature', 1, 1, 'L', true);
        } elseif ($type === '2ca' || $type === 'ca2') {
            $pdf->Cell(10, 8, 'S/N', 1, 0, 'C', true);
            $pdf->Cell(38, 8, 'Student ID Number', 1, 0, 'L', true);
            $pdf->Cell(62, 8, 'Student Full Name', 1, 0, 'L', true);
            $pdf->Cell(35, 8, '2nd CA / Test (/20)', 1, 0, 'C', true);
            $pdf->Cell(41, 8, 'Teacher Remark / Signature', 1, 1, 'L', true);
        } elseif ($type === 'ca') {
            $pdf->Cell(10, 8, 'S/N', 1, 0, 'C', true);
            $pdf->Cell(38, 8, 'Student ID Number', 1, 0, 'L', true);
            $pdf->Cell(62, 8, 'Student Full Name', 1, 0, 'L', true);
            $pdf->Cell(35, 8, 'CA / Test (/40)', 1, 0, 'C', true);
            $pdf->Cell(41, 8, 'Teacher Remark / Signature', 1, 1, 'L', true);
        } elseif ($type === 'exam') {
            $pdf->Cell(10, 8, 'S/N', 1, 0, 'C', true);
            $pdf->Cell(38, 8, 'Student ID Number', 1, 0, 'L', true);
            $pdf->Cell(62, 8, 'Student Full Name', 1, 0, 'L', true);
            $pdf->Cell(35, 8, 'Exam Score (/70)', 1, 0, 'C', true);
            $pdf->Cell(41, 8, 'Teacher Remark / Signature', 1, 1, 'L', true);
        } else {
            // Combined - Landscape (Width: 297 - 24 = 273mm)
            $pdf->Cell(10, 8, 'S/N', 1, 0, 'C', true);
            $pdf->Cell(34, 8, 'Student ID Number', 1, 0, 'L', true);
            $pdf->Cell(55, 8, 'Student Full Name', 1, 0, 'L', true);
            $pdf->Cell(24, 8, '1st CA (20)', 1, 0, 'C', true);
            $pdf->Cell(24, 8, '2nd CA (20)', 1, 0, 'C', true);
            $pdf->Cell(26, 8, 'Total CA (40)', 1, 0, 'C', true);
            $pdf->Cell(26, 8, 'Exam (70)', 1, 0, 'C', true);
            $pdf->Cell(26, 8, 'Total (100)', 1, 0, 'C', true);
            $pdf->Cell(18, 8, 'Grade', 1, 0, 'C', true);
            $pdf->Cell(30, 8, 'Remarks', 1, 1, 'L', true);
        }

        // Table Rows
        $pdf->SetFont('Arial', '', 8);
        $pdf->SetTextColor(40, 40, 40);

        $sn = 1;
        $fill = false;
        foreach ($students as $student) {
            $pdf->SetFillColor($fill ? 248 : 255, $fill ? 249 : 255, $fill ? 250 : 255);

            $idNum = is_array($student) ? ($student['student_id_number'] ?? '') : ($student->student_id_number ?? '');
            $name = is_array($student) ? ($student['name'] ?? '') : ($student->user?->name ?? 'Student');

            if ($type === '1ca' || $type === 'ca1' || $type === '2ca' || $type === 'ca2' || $type === 'ca' || $type === 'exam') {
                $pdf->Cell(10, 7.5, (string) $sn, 1, 0, 'C', true);
                $pdf->Cell(38, 7.5, $idNum, 1, 0, 'L', true);
                $pdf->Cell(62, 7.5, $this->sanitizeText($name), 1, 0, 'L', true);
                $pdf->Cell(35, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(41, 7.5, '', 1, 1, 'L', true);
            } else {
                $pdf->Cell(10, 7.5, (string) $sn, 1, 0, 'C', true);
                $pdf->Cell(34, 7.5, $idNum, 1, 0, 'L', true);
                $pdf->Cell(55, 7.5, $this->sanitizeText($name), 1, 0, 'L', true);
                $pdf->Cell(24, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(24, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(26, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(26, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(26, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(18, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(30, 7.5, '', 1, 1, 'L', true);
            }

            $fill = ! $fill;
            $sn++;
        }

        // Signatures & Endorsements
        $pdf->Ln(6);
        $this->renderSignatures($pdf, $orientation);

        return $pdf->Output('S');
    }

    /**
     * Generates a completed PDF Broadsheet with student scores and grades filled in.
     */
    public function generateBroadsheetPdf(
        SchoolClass $schoolClass,
        ?Course $course,
        string $term,
        Collection|array $students,
        Collection $enrollments,
        ?string $teacherName = null
    ): string {
        $pdf = new LincolnPdf('L', 'mm', 'A4');
        $pdf->AliasNbPages();
        $pdf->SetMargins(12, 12, 12);
        $pdf->SetAutoPageBreak(true, 18);

        $school = $schoolClass->school;
        $schoolName = $school?->name ?? 'Lincoln College of Science Management & Technology';

        $pdf->setDocumentHeader(
            schoolName: $schoolName,
            title: 'OFFICIAL CLASS RESULTS & ACADEMIC BROADSHEET',
            className: $schoolClass->name.' ('.$schoolClass->code.')',
            subjectName: $course ? ($course->code.' - '.$course->name) : 'Subject Broadsheet',
            term: $term,
            teacherName: $teacherName ?? ($schoolClass->teacher?->name ?? 'Subject Teacher'),
            subInfo: 'Continuous Assessment (1st CA: 20, 2nd CA: 20 | Total CA: 40) + Terminal Exam (70) = Total (100) | Grading Scale: WAEC/NECO Standard'
        );

        $pdf->AddPage();

        // Table Header
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->SetFillColor(184, 29, 34); // Crimson
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetDrawColor(180, 180, 180);

        // Landscape Width: 297 - 24 = 273mm
        $pdf->Cell(10, 8, 'S/N', 1, 0, 'C', true);
        $pdf->Cell(34, 8, 'Student ID Number', 1, 0, 'L', true);
        $pdf->Cell(55, 8, 'Student Full Name', 1, 0, 'L', true);
        $pdf->Cell(24, 8, '1st CA (20)', 1, 0, 'C', true);
        $pdf->Cell(24, 8, '2nd CA (20)', 1, 0, 'C', true);
        $pdf->Cell(26, 8, 'Total CA (40)', 1, 0, 'C', true);
        $pdf->Cell(26, 8, 'Exam (70)', 1, 0, 'C', true);
        $pdf->Cell(26, 8, 'Total (100)', 1, 0, 'C', true);
        $pdf->Cell(18, 8, 'Grade', 1, 0, 'C', true);
        $pdf->Cell(30, 8, 'Official Remarks', 1, 1, 'L', true);

        // Rows
        $pdf->SetFont('Arial', '', 8);
        $pdf->SetTextColor(40, 40, 40);

        $sn = 1;
        $fill = false;
        foreach ($students as $student) {
            $pdf->SetFillColor($fill ? 248 : 255, $fill ? 249 : 255, $fill ? 250 : 255);

            $userId = is_array($student) ? ($student['student_id'] ?? null) : ($student->user_id ?? $student->id);
            $idNum = is_array($student) ? ($student['student_id_number'] ?? '') : ($student->student_id_number ?? '');
            $name = is_array($student) ? ($student['name'] ?? '') : ($student->user?->name ?? 'Student');

            $enrollment = $userId ? $enrollments->get($userId) : null;

            $ca1Text = ($enrollment && $enrollment->ca1_score !== null) ? number_format((float) $enrollment->ca1_score, 1) : '-';
            $ca2Text = ($enrollment && $enrollment->ca2_score !== null) ? number_format((float) $enrollment->ca2_score, 1) : '-';
            $caText = ($enrollment && $enrollment->ca_score !== null) ? number_format((float) $enrollment->ca_score, 1) : '-';
            $examText = ($enrollment && $enrollment->exam_score !== null) ? number_format((float) $enrollment->exam_score, 1) : '-';
            $totalText = ($enrollment && $enrollment->score !== null) ? number_format((float) $enrollment->score, 1) : '-';
            $gradeText = ($enrollment && $enrollment->grade) ? $enrollment->grade : '-';
            $remarkText = ($enrollment && $enrollment->remark) ? $enrollment->remark : '-';

            $pdf->Cell(10, 7.5, (string) $sn, 1, 0, 'C', true);
            $pdf->Cell(34, 7.5, $idNum, 1, 0, 'L', true);
            $pdf->Cell(55, 7.5, $this->sanitizeText($name), 1, 0, 'L', true);
            $pdf->Cell(24, 7.5, $ca1Text, 1, 0, 'C', true);
            $pdf->Cell(24, 7.5, $ca2Text, 1, 0, 'C', true);
            $pdf->Cell(26, 7.5, $caText, 1, 0, 'C', true);
            $pdf->Cell(26, 7.5, $examText, 1, 0, 'C', true);

            // Highlight total score
            $pdf->SetFont('Arial', 'B', 8);
            $pdf->Cell(26, 7.5, $totalText, 1, 0, 'C', true);
            $pdf->Cell(18, 7.5, $gradeText, 1, 0, 'C', true);
            $pdf->SetFont('Arial', '', 8);

            $pdf->Cell(30, 7.5, $this->sanitizeText($remarkText), 1, 1, 'L', true);

            $fill = ! $fill;
            $sn++;
        }

        // Signatures
        $pdf->Ln(6);
        $this->renderSignatures($pdf, 'L');

        return $pdf->Output('S');
    }

    /**
     * Generates official Pupil's Performance Report PDF matching the institutional reference document.
     */
    public function generatePupilPerformanceReportPdf(array $data): string
    {
        $pdf = new \FPDF('P', 'mm', 'A4');
        $pdf->AliasNbPages();
        $pdf->SetMargins(12, 10, 12);
        $pdf->SetAutoPageBreak(true, 10);
        $pdf->AddPage();

        $school = $data['school'] ?? [];
        $meta = $data['meta'] ?? [];
        $subjects = $data['subjects'] ?? [];
        $behavioral = $data['behavioral_traits'] ?? [];
        $comments = $data['comments'] ?? [];

        // 1. School Header & Logo
        $logoUrl = $school['logo_url'] ?? null;
        $logoRendered = false;

        if ($logoUrl) {
            $normalizedPath = ltrim(parse_url($logoUrl, PHP_URL_PATH) ?: $logoUrl, '/');
            $candidates = [
                public_path($normalizedPath),
                storage_path('app/public/'.$normalizedPath),
                base_path('public/'.$normalizedPath),
            ];

            foreach ($candidates as $cand) {
                if (file_exists($cand) && is_file($cand)) {
                    try {
                        // Place logo on top-left of the header: X=14mm, Y=10mm, width=18mm
                        $pdf->Image($cand, 14, 10, 18);
                        $logoRendered = true;
                        break;
                    } catch (\Throwable $e) {
                        // Ignore image rendering error if corrupted and continue with text
                    }
                }
            }
        }

        $pdf->SetFont('Arial', 'B', 14);
        $pdf->SetTextColor(20, 20, 20);
        $pdf->Cell(0, 6, $this->sanitizeText($school['name'] ?? 'Leaders Academy'), 0, 1, 'C');

        $pdf->SetFont('Arial', '', 7.5);
        $pdf->SetTextColor(70, 70, 70);
        $pdf->Cell(0, 4, 'MOTTO: '.$this->sanitizeText($school['motto'] ?? 'Education for Excellence & Leadership'), 0, 1, 'C');
        $pdf->Cell(0, 4, $this->sanitizeText($school['address'] ?? 'Plot 14 Airport Road, G.R.A, Kano, Nigeria'), 0, 1, 'C');
        $pdf->Cell(0, 3.5, $this->sanitizeText(($school['email'] ?? 'info@school.edu.ng').' | '.($school['phone'] ?? '+234 800 000 0000')), 0, 1, 'C');

        $pdf->Ln(2);
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->SetTextColor(30, 30, 30);
        $pdf->Cell(0, 5, "PUPIL'S PERFORMANCE REPORT", 0, 1, 'C');
        $pdf->Ln(2);

        // 2. Student Meta Table (186mm width)
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->SetTextColor(40, 40, 40);
        $pdf->SetFillColor(255, 255, 255);

        $rowHeight = 5.2;
        $metaRows = [
            ["Pupil's Name:", $meta['pupil_name'] ?? '', 'Final Grade:', $meta['final_grade'] ?? '—'],
            ['Admission No.:', $meta['admission_no'] ?? '', 'Final Position:', $meta['final_position'] ?? '—'],
            ['Class Name:', $meta['class_name'] ?? '', 'Final Average:', (string) ($meta['final_average'] ?? '—')],
            ['Academic Session:', $meta['academic_session'] ?? '', 'Class Average:', (string) ($meta['class_average'] ?? '—')],
            ['Class Population:', (string) ($meta['class_population'] ?? '—'), 'Highest Avg.:', (string) ($meta['highest_average'] ?? '—')],
        ];

        foreach ($metaRows as $row) {
            $pdf->SetFont('Arial', 'B', 8);
            $pdf->Cell(34, $rowHeight, '  '.$row[0], 1, 0, 'L');
            $pdf->SetFont('Arial', '', 8);
            $pdf->Cell(59, $rowHeight, '  '.$this->sanitizeText((string) $row[1]), 1, 0, 'L');

            $pdf->SetFont('Arial', 'B', 8);
            $pdf->Cell(34, $rowHeight, '  '.$row[2], 1, 0, 'L');
            $pdf->SetFont('Arial', '', 8);
            $pdf->Cell(59, $rowHeight, '  '.$this->sanitizeText((string) $row[3]), 1, 1, 'L');
        }

        $pdf->Ln(3);

        // 3. Subject Results Table (Blue Header Banner #0284C7)
        $pdf->SetFillColor(2, 132, 199);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('Arial', 'B', 7.5);

        $pdf->Cell(56, 7, 'SUBJECT', 1, 0, 'L', true);
        $pdf->Cell(22, 7, 'C.A 1 (20%)', 1, 0, 'C', true);
        $pdf->Cell(22, 7, 'C.A 2 (20%)', 1, 0, 'C', true);
        $pdf->Cell(22, 7, 'Exam (60%)', 1, 0, 'C', true);
        $pdf->Cell(22, 7, 'TOTAL (100%)', 1, 0, 'C', true);
        $pdf->Cell(18, 7, 'GRADE', 1, 0, 'C', true);
        $pdf->Cell(24, 7, 'REMARKS', 1, 1, 'C', true);

        // Rows
        $pdf->SetFont('Arial', '', 7.5);
        $pdf->SetTextColor(30, 30, 30);
        $fill = false;

        foreach ($subjects as $s) {
            $pdf->SetFillColor($fill ? 248 : 255, $fill ? 250 : 255, $fill ? 252 : 255);

            $ca1Text = $s['ca1'] !== null ? (string) $s['ca1'] : '—';
            $ca2Text = $s['ca2'] !== null ? (string) $s['ca2'] : '—';
            $examText = $s['exam'] !== null ? (string) $s['exam'] : '—';
            $totalText = $s['total'] !== null ? (string) $s['total'] : '—';
            $gradeText = $s['grade'] ?? '—';
            $remarkText = $s['remark'] ?? '—';

            $pdf->Cell(56, 5.4, ' '.$this->sanitizeText($s['name']), 1, 0, 'L', true);
            $pdf->Cell(22, 5.4, $ca1Text, 1, 0, 'C', true);
            $pdf->Cell(22, 5.4, $ca2Text, 1, 0, 'C', true);
            $pdf->Cell(22, 5.4, $examText, 1, 0, 'C', true);

            $pdf->SetFont('Arial', 'B', 7.5);
            $pdf->Cell(22, 5.4, $totalText, 1, 0, 'C', true);
            $pdf->Cell(18, 5.4, $gradeText, 1, 0, 'C', true);
            $pdf->SetFont('Arial', '', 7.5);

            $pdf->Cell(24, 5.4, $this->sanitizeText($remarkText), 1, 1, 'C', true);

            $fill = ! $fill;
        }

        // 4. Grade Details Line
        $pdf->Ln(2);
        $pdf->SetFont('Arial', 'I', 6.5);
        $pdf->SetTextColor(60, 60, 60);
        $pdf->Cell(0, 4, $this->sanitizeText($data['grade_details'] ?? '').' NO. OF SUBJECTS: '.count($subjects), 0, 1, 'L');
        $pdf->Ln(2);

        // 5. Behavioral Assessment Grid (3 columns: 62mm, 62mm, 62mm)
        $personal = $behavioral['personal_social'] ?? [];
        $practical = $behavioral['practical_skills'] ?? [];
        $scale = $behavioral['rating_scale'] ?? [];

        $pdf->SetFont('Arial', '', 7);
        $pdf->SetTextColor(30, 30, 30);

        $maxRows = max(count($personal), count($practical), count($scale));
        $scaleKeys = array_keys($scale);
        $scaleValues = array_values($scale);

        for ($i = 0; $i < $maxRows; $i++) {
            // Col 1: Personal & Social
            if (isset($personal[$i])) {
                $pdf->Cell(44, 4.3, ' '.$this->sanitizeText($personal[$i]['name']), 1, 0, 'L');
                $pdf->Cell(18, 4.3, $personal[$i]['rating'], 1, 0, 'C');
            } else {
                $pdf->Cell(62, 4.3, '', 0, 0);
            }

            // Col 2: Practical Skills
            if (isset($practical[$i])) {
                $pdf->Cell(44, 4.3, ' '.$this->sanitizeText($practical[$i]['name']), 1, 0, 'L');
                $pdf->Cell(18, 4.3, $practical[$i]['rating'], 1, 0, 'C');
            } else {
                $pdf->Cell(62, 4.3, '', 0, 0);
            }

            // Col 3: Scale
            if (isset($scaleKeys[$i])) {
                $pdf->Cell(62, 4.3, ' '.$scaleKeys[$i].' - '.$scaleValues[$i], 1, 1, 'L');
            } else {
                $pdf->Cell(62, 4.3, '', 0, 1);
            }
        }

        $pdf->Ln(2.5);

        // 6. Comments & Endorsement
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->Cell(0, 4, 'Comment:', 0, 1, 'L');
        $pdf->SetFont('Arial', '', 8);
        $pdf->Cell(0, 4, $this->sanitizeText($comments['principal_comment'] ?? 'Very good performance, keep it up.'), 0, 1, 'L');
        $pdf->Ln(1);

        $pdf->SetFont('Arial', 'B', 8);
        $pdf->Cell(0, 4, "Class Teacher's Comment:", 0, 1, 'L');
        $pdf->SetFont('Arial', '', 8);
        $pdf->Cell(0, 4, $this->sanitizeText($comments['teacher_comment'] ?? 'Nice performance, you should be proud of yourself.'), 0, 1, 'L');
        $pdf->Ln(1);

        $pdf->SetFont('Arial', 'B', 8);
        $pdf->Cell(0, 4, "Form Teacher's Name:", 0, 1, 'L');
        $pdf->SetFont('Arial', '', 8);
        $pdf->Cell(0, 4, $this->sanitizeText($comments['form_teacher_name'] ?? 'ASIYA MUHAMMAD IDRIS'), 0, 1, 'L');
        $pdf->Ln(1);

        $pdf->SetFont('Arial', 'B', 8);
        $pdf->Cell(0, 4, 'Next Term Begins: '.$this->sanitizeText($comments['next_term_begins'] ?? 'Monday, May 4th, 2026'), 0, 1, 'L');
        $pdf->Ln(1);

        $pdf->SetFont('Arial', 'B', 8);
        $pdf->Cell(0, 4, 'Signature/Stamp: [Signed & Official School Stamp]', 0, 1, 'L');

        return $pdf->Output('S');
    }

    private function renderSignatures(\FPDF $pdf, string $orientation): void
    {
        $pdf->SetFont('Arial', 'I', 7.5);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(0, 5, 'Grading Key: A (75-100% Distinction) | B (65-74% Very Good) | C (50-64% Credit) | D (45-49% Pass) | E (40-44% Fair) | F (0-39% Fail)', 0, 1, 'C');
        $pdf->Ln(4);

        $pdf->SetFont('Arial', 'B', 8);
        $pdf->SetTextColor(50, 50, 50);

        if ($orientation === 'L') {
            $pdf->Cell(85, 4, '___________________________________', 0, 0, 'C');
            $pdf->Cell(95, 4, '___________________________________', 0, 0, 'C');
            $pdf->Cell(85, 4, '___________________________________', 0, 1, 'C');

            $pdf->Cell(85, 5, 'Subject Teacher Signature & Date', 0, 0, 'C');
            $pdf->Cell(95, 5, 'Form Master / Head of Department', 0, 0, 'C');
            $pdf->Cell(85, 5, 'Principal / Academic Registrar Stamp', 0, 1, 'C');
        } else {
            $pdf->Cell(90, 4, '___________________________________', 0, 0, 'C');
            $pdf->Cell(96, 4, '___________________________________', 0, 1, 'C');

            $pdf->Cell(90, 5, 'Subject Teacher Signature & Date', 0, 0, 'C');
            $pdf->Cell(96, 5, 'Principal / Registrar Official Stamp', 0, 1, 'C');
        }
    }

    private function sanitizeText(?string $str): string
    {
        if ($str === null) {
            return '';
        }

        return iconv('UTF-8', 'windows-1252//TRANSLIT', $str) ?: $str;
    }
}

/**
 * Extended FPDF subclass for Lincoln institutional layout.
 */
class LincolnPdf extends \FPDF
{
    private string $schoolName = '';

    private string $docTitle = '';

    private string $className = '';

    private string $subjectName = '';

    private string $term = '';

    private string $teacherName = '';

    private string $subInfo = '';

    public function setDocumentHeader(
        string $schoolName,
        string $title,
        string $className,
        string $subjectName,
        string $term,
        string $teacherName,
        string $subInfo
    ): void {
        $this->schoolName = $schoolName;
        $this->docTitle = $title;
        $this->className = $className;
        $this->subjectName = $subjectName;
        $this->term = $term;
        $this->teacherName = $teacherName;
        $this->subInfo = $subInfo;
    }

    public function Header(): void
    {
        // Top accent line
        $this->SetFillColor(184, 29, 34); // Crimson
        $this->Rect(12, 10, $this->GetPageWidth() - 24, 2, 'F');

        $this->Ln(3);
        $this->SetFont('Arial', 'B', 14);
        $this->SetTextColor(184, 29, 34);
        $this->Cell(0, 6, strtoupper($this->schoolName), 0, 1, 'C');

        $this->SetFont('Arial', 'B', 10);
        $this->SetTextColor(40, 40, 40);
        $this->Cell(0, 5, $this->docTitle, 0, 1, 'C');

        $this->SetFont('Arial', '', 8);
        $this->SetTextColor(100, 100, 100);
        $this->Cell(0, 4, $this->subInfo, 0, 1, 'C');

        // Metadata box
        $this->Ln(2);
        $this->SetFillColor(245, 246, 248);
        $this->SetDrawColor(215, 220, 225);
        $this->Rect(12, $this->GetY(), $this->GetPageWidth() - 24, 9, 'DF');

        $this->SetY($this->GetY() + 1.5);
        $this->SetFont('Arial', 'B', 8);
        $this->SetTextColor(50, 50, 50);

        $colWidth = ($this->GetPageWidth() - 24) / 4;
        $this->Cell($colWidth, 5, 'Class: '.$this->className, 0, 0, 'L');
        $this->Cell($colWidth, 5, 'Subject: '.$this->subjectName, 0, 0, 'L');
        $this->Cell($colWidth, 5, 'Session: '.$this->term, 0, 0, 'L');
        $this->Cell($colWidth, 5, 'Teacher: '.$this->teacherName, 0, 1, 'L');

        $this->Ln(3);
    }

    public function Footer(): void
    {
        $this->SetY(-14);
        $this->SetFont('Arial', 'I', 7.5);
        $this->SetTextColor(130, 130, 130);

        $pageWidth = $this->GetPageWidth() - 24;
        $this->Cell($pageWidth / 2, 8, 'Generated via Lincoln SMTS Platform &bull; '.date('d M Y, H:i'), 0, 0, 'L');
        $this->Cell($pageWidth / 2, 8, 'Page '.$this->PageNo().' of {nb}', 0, 0, 'R');
    }
}
