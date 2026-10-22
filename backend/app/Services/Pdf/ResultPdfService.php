<?php

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
            'ca' => 'CONTINUOUS ASSESSMENT (TEST / CA) ROSTER SHEET',
            'exam' => 'TERMINAL EXAMINATION ROSTER SCORE SHEET',
            default => 'COMBINED ASSESSMENT & EXAMINATION ROSTER SHEET',
        };

        $maxScoreText = match ($type) {
            'ca' => 'Assessment Scope: Continuous Assessment (Maximum: 40 Marks)',
            'exam' => 'Assessment Scope: Terminal Examination (Maximum: 70 Marks)',
            default => 'Assessment Scope: CA (40 Marks) + Terminal Examination (70 Marks) = Total (100 Marks)',
        };

        $pdf->setDocumentHeader(
            schoolName: $schoolName,
            title: $typeTitle,
            className: $schoolClass->name . ' (' . $schoolClass->code . ')',
            subjectName: $course ? ($course->code . ' - ' . $course->name) : 'All Enrolled Subjects',
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

        if ($type === 'ca') {
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
            $pdf->Cell(36, 8, 'Student ID Number', 1, 0, 'L', true);
            $pdf->Cell(65, 8, 'Student Full Name', 1, 0, 'L', true);
            $pdf->Cell(32, 8, 'CA / Test (40)', 1, 0, 'C', true);
            $pdf->Cell(32, 8, 'Exam (70)', 1, 0, 'C', true);
            $pdf->Cell(32, 8, 'Total (100)', 1, 0, 'C', true);
            $pdf->Cell(20, 8, 'Grade', 1, 0, 'C', true);
            $pdf->Cell(46, 8, 'Remarks', 1, 1, 'L', true);
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

            if ($type === 'ca') {
                $pdf->Cell(10, 7.5, (string) $sn, 1, 0, 'C', true);
                $pdf->Cell(38, 7.5, $idNum, 1, 0, 'L', true);
                $pdf->Cell(62, 7.5, $this->sanitizeText($name), 1, 0, 'L', true);
                $pdf->Cell(35, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(41, 7.5, '', 1, 1, 'L', true);
            } elseif ($type === 'exam') {
                $pdf->Cell(10, 7.5, (string) $sn, 1, 0, 'C', true);
                $pdf->Cell(38, 7.5, $idNum, 1, 0, 'L', true);
                $pdf->Cell(62, 7.5, $this->sanitizeText($name), 1, 0, 'L', true);
                $pdf->Cell(35, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(41, 7.5, '', 1, 1, 'L', true);
            } else {
                $pdf->Cell(10, 7.5, (string) $sn, 1, 0, 'C', true);
                $pdf->Cell(36, 7.5, $idNum, 1, 0, 'L', true);
                $pdf->Cell(65, 7.5, $this->sanitizeText($name), 1, 0, 'L', true);
                $pdf->Cell(32, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(32, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(32, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(20, 7.5, '', 1, 0, 'C', true);
                $pdf->Cell(46, 7.5, '', 1, 1, 'L', true);
            }

            $fill = !$fill;
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
            className: $schoolClass->name . ' (' . $schoolClass->code . ')',
            subjectName: $course ? ($course->code . ' - ' . $course->name) : 'Subject Broadsheet',
            term: $term,
            teacherName: $teacherName ?? ($schoolClass->teacher?->name ?? 'Subject Teacher'),
            subInfo: 'Continuous Assessment (CA / 40) + Terminal Exam (70) = Total (100) | Grading Scale: WAEC/NECO Standard'
        );

        $pdf->AddPage();

        // Table Header
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->SetFillColor(184, 29, 34); // Crimson
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetDrawColor(180, 180, 180);

        // Landscape Width: 297 - 24 = 273mm
        $pdf->Cell(10, 8, 'S/N', 1, 0, 'C', true);
        $pdf->Cell(36, 8, 'Student ID Number', 1, 0, 'L', true);
        $pdf->Cell(65, 8, 'Student Full Name', 1, 0, 'L', true);
        $pdf->Cell(28, 8, 'CA (40)', 1, 0, 'C', true);
        $pdf->Cell(28, 8, 'Exam (70)', 1, 0, 'C', true);
        $pdf->Cell(28, 8, 'Total (100)', 1, 0, 'C', true);
        $pdf->Cell(22, 8, 'Grade', 1, 0, 'C', true);
        $pdf->Cell(56, 8, 'Official Remarks', 1, 1, 'L', true);

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

            $caText = ($enrollment && $enrollment->ca_score !== null) ? number_format((float) $enrollment->ca_score, 1) : '-';
            $examText = ($enrollment && $enrollment->exam_score !== null) ? number_format((float) $enrollment->exam_score, 1) : '-';
            $totalText = ($enrollment && $enrollment->score !== null) ? number_format((float) $enrollment->score, 1) : '-';
            $gradeText = ($enrollment && $enrollment->grade) ? $enrollment->grade : '-';
            $remarkText = ($enrollment && $enrollment->remark) ? $enrollment->remark : '-';

            $pdf->Cell(10, 7.5, (string) $sn, 1, 0, 'C', true);
            $pdf->Cell(36, 7.5, $idNum, 1, 0, 'L', true);
            $pdf->Cell(65, 7.5, $this->sanitizeText($name), 1, 0, 'L', true);
            $pdf->Cell(28, 7.5, $caText, 1, 0, 'C', true);
            $pdf->Cell(28, 7.5, $examText, 1, 0, 'C', true);

            // Highlight total score
            $pdf->SetFont('Arial', 'B', 8);
            $pdf->Cell(28, 7.5, $totalText, 1, 0, 'C', true);
            $pdf->Cell(22, 7.5, $gradeText, 1, 0, 'C', true);
            $pdf->SetFont('Arial', '', 8);

            $pdf->Cell(56, 7.5, $this->sanitizeText($remarkText), 1, 1, 'L', true);

            $fill = !$fill;
            $sn++;
        }

        // Signatures
        $pdf->Ln(6);
        $this->renderSignatures($pdf, 'L');

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
        if ($str === null) return '';
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
        $this->Cell($colWidth, 5, 'Class: ' . $this->className, 0, 0, 'L');
        $this->Cell($colWidth, 5, 'Subject: ' . $this->subjectName, 0, 0, 'L');
        $this->Cell($colWidth, 5, 'Session: ' . $this->term, 0, 0, 'L');
        $this->Cell($colWidth, 5, 'Teacher: ' . $this->teacherName, 0, 1, 'L');

        $this->Ln(3);
    }

    public function Footer(): void
    {
        $this->SetY(-14);
        $this->SetFont('Arial', 'I', 7.5);
        $this->SetTextColor(130, 130, 130);

        $pageWidth = $this->GetPageWidth() - 24;
        $this->Cell($pageWidth / 2, 8, 'Generated via Lincoln SMTS Platform &bull; ' . date('d M Y, H:i'), 0, 0, 'L');
        $this->Cell($pageWidth / 2, 8, 'Page ' . $this->PageNo() . ' of {nb}', 0, 0, 'R');
    }
}
