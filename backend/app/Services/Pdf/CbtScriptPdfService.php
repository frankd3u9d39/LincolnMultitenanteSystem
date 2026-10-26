<?php

declare(strict_types=1);

namespace App\Services\Pdf;

use App\Models\Assignment;
use App\Models\User;

if (! class_exists('FPDF')) {
    if (file_exists(base_path('vendor/setasign/fpdf/fpdf.php'))) {
        require_once base_path('vendor/setasign/fpdf/fpdf.php');
    }
}

/**
 * Service to generate professional CBT Candidate Answer Script PDFs
 * delivered to teachers for manual marking and evaluation.
 */
class CbtScriptPdfService
{
    /**
     * Generates a candidate's CBT answer script as a PDF and saves it to disk.
     * Returns the absolute and relative file paths.
     */
    public function generateCandidateScriptPdf(
        Assignment $assignment,
        User $student,
        array $questions,
        array $answers,
        ?string $reason = null
    ): array {
        $school = $assignment->school;
        $schoolName = $school?->name ?? 'Lincoln College of Science Management & Technology';

        $studentProfile = $student->studentProfile;
        $studentIdNumber = $studentProfile?->student_id_number ?? ('LC-STD-'.str_pad((string) $student->id, 4, '0', STR_PAD_LEFT));

        $pdf = new CbtPdf('P', 'mm', 'A4');
        $pdf->AliasNbPages();
        $pdf->SetMargins(12, 12, 12);
        $pdf->SetAutoPageBreak(true, 18);

        $courseCode = $assignment->course?->code ?? 'CBT';
        $courseName = $assignment->course?->name ?? 'Examination Subject';

        $pdf->setDocumentHeader(
            schoolName: $schoolName,
            examTitle: $assignment->title,
            courseInfo: "{$courseCode} - {$courseName}",
            studentName: $student->name,
            studentIdNumber: $studentIdNumber,
            submissionTime: now()->format('d M Y, h:i A'),
            reason: $reason
        );

        $pdf->AddPage();

        // Security / Submission Mode Banner
        if ($reason && stripos($reason, 'Standard') === false) {
            $pdf->SetFillColor(254, 242, 242);
            $pdf->SetDrawColor(248, 113, 113);
            $pdf->SetTextColor(185, 28, 28);
            $pdf->SetFont('Arial', 'B', 8);
            $pdf->Cell(0, 7, $this->sanitizeText("! SECURITY NOTICE: Auto-submitted due to exit attempt: {$reason}"), 1, 1, 'L', true);
            $pdf->Ln(2);
        }

        // Section header for Question Responses
        $pdf->SetFillColor(30, 41, 59);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->Cell(0, 7, '  CANDIDATE RESPONSES FOR TEACHER EVALUATION & MARKING', 0, 1, 'L', true);
        $pdf->Ln(2);

        $answeredCount = 0;
        foreach ($questions as $idx => $q) {
            $qNum = $idx + 1;
            $qId = $q['id'];
            $selectedOpt = $answers[$qId] ?? null;
            if ($selectedOpt !== null && $selectedOpt !== '') {
                $answeredCount++;
            }

            $optText = '';
            if ($selectedOpt && isset($q['options'][$selectedOpt])) {
                $optText = $q['options'][$selectedOpt];
            }

            // Question header line
            $pdf->SetFillColor(241, 245, 249);
            $pdf->SetDrawColor(203, 213, 225);
            $pdf->SetTextColor(30, 41, 59);
            $pdf->SetFont('Arial', 'B', 8.5);
            $pdf->Cell(140, 6, "  Question {$qNum} of ".count($questions), 'LTB', 0, 'L', true);
            $pdf->SetFont('Arial', '', 8);
            $pdf->SetTextColor(100, 116, 139);
            $pdf->Cell(0, 6, 'Mark Weight: 6.0 Marks  ', 'RTB', 1, 'R', true);

            // Question Text
            $pdf->SetTextColor(15, 23, 42);
            $pdf->SetFont('Arial', '', 8.5);
            $pdf->MultiCell(0, 5, $this->sanitizeText($q['question']), 'LR', 'L');

            // Candidate answer line
            $pdf->SetFont('Arial', 'B', 8.5);
            if ($selectedOpt) {
                $pdf->SetTextColor(21, 128, 61); // Green
                $pdf->Cell(45, 6, "  Candidate Selection: [ Option {$selectedOpt} ]", 'L', 0, 'L');
                $pdf->SetFont('Arial', '', 8);
                $pdf->SetTextColor(51, 65, 85);
                $pdf->Cell(0, 6, $this->sanitizeText('- '.substr($optText, 0, 85)), 'R', 1, 'L');
            } else {
                $pdf->SetTextColor(185, 28, 28); // Red
                $pdf->Cell(0, 6, '  Candidate Selection: [ No answer selected / Left Blank ]', 'LR', 1, 'L');
            }

            // Teacher marking line
            $pdf->SetFillColor(250, 250, 250);
            $pdf->SetTextColor(71, 85, 105);
            $pdf->SetFont('Arial', 'I', 7.5);
            $pdf->Cell(95, 6, '  Teacher Mark Awarded: [ _____ / 6.0 Marks ]', 'LBR', 0, 'L', true);
            $pdf->Cell(0, 6, 'Examiner Remarks: _____________________________________', 'LBR', 1, 'L', true);

            $pdf->Ln(2);
        }

        // Teacher Final Sign-off Box
        $pdf->Ln(3);
        $pdf->SetFillColor(248, 250, 252);
        $pdf->SetDrawColor(180, 29, 34); // Crimson
        $pdf->SetTextColor(180, 29, 34);
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->Cell(0, 6, '  TEACHER MARKING ENDORSEMENT & SCORE UPLOAD SUMMARY', 1, 1, 'L', true);

        $pdf->SetTextColor(30, 41, 59);
        $pdf->SetFont('Arial', 'B', 8.5);
        $pdf->Cell(95, 7, '  Total Examination Score Awarded (Max 60): ________', 'LR', 0, 'L');
        $pdf->Cell(0, 7, 'Continuous Assessment (CA) Score (Max 40): ________', 'LR', 1, 'L');

        $pdf->Cell(95, 7, '  Teacher Overall Grade (A / B / C / D / E / F): ________', 'LR', 0, 'L');
        $pdf->Cell(0, 7, 'Teacher Standing Remark (e.g. Distinction, Credit): ________', 'LR', 1, 'L');

        $pdf->Cell(0, 7, '  Subject Teacher Full Name: ___________________________________________________________', 'LR', 1, 'L');

        $pdf->Cell(95, 8, '  Subject Teacher Signature: _______________________', 'LBR', 0, 'L');
        $pdf->Cell(0, 8, 'Date Evaluated & Uploaded: _______________________', 'LBR', 1, 'L');

        // Ensure target directory exists
        $uploadDir = public_path('uploads/cbt_submissions');
        if (! file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filename = sprintf(
            'cbt_script_exam_%d_student_%d_%s.pdf',
            $assignment->id,
            $student->id,
            time()
        );

        $absolutePath = $uploadDir.DIRECTORY_SEPARATOR.$filename;
        $relativePath = 'uploads/cbt_submissions/'.$filename;

        $pdf->Output('F', $absolutePath);

        return [
            'absolute_path' => $absolutePath,
            'relative_path' => $relativePath,
            'filename' => $filename,
            'answered_count' => $answeredCount,
            'total_questions' => count($questions),
        ];
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
 * Custom FPDF layout for CBT answer scripts.
 */
class CbtPdf extends \FPDF
{
    private string $schoolName = '';

    private string $examTitle = '';

    private string $courseInfo = '';

    private string $studentName = '';

    private string $studentIdNumber = '';

    private string $submissionTime = '';

    private ?string $reason = null;

    public function setDocumentHeader(
        string $schoolName,
        string $examTitle,
        string $courseInfo,
        string $studentName,
        string $studentIdNumber,
        string $submissionTime,
        ?string $reason = null
    ): void {
        $this->schoolName = $schoolName;
        $this->examTitle = $examTitle;
        $this->courseInfo = $courseInfo;
        $this->studentName = $studentName;
        $this->studentIdNumber = $studentIdNumber;
        $this->submissionTime = $submissionTime;
        $this->reason = $reason;
    }

    public function Header(): void
    {
        // Top crimson bar
        $this->SetFillColor(184, 29, 34);
        $this->Rect(12, 10, $this->GetPageWidth() - 24, 2, 'F');

        $this->Ln(2);
        $this->SetFont('Arial', 'B', 13);
        $this->SetTextColor(184, 29, 34);
        $this->Cell(0, 6, strtoupper($this->schoolName), 0, 1, 'C');

        $this->SetFont('Arial', 'B', 10);
        $this->SetTextColor(30, 41, 59);
        $this->Cell(0, 5, 'CBT CANDIDATE EXAMINATION ANSWER SCRIPT', 0, 1, 'C');

        $this->SetFont('Arial', 'I', 8);
        $this->SetTextColor(100, 116, 139);
        $this->Cell(0, 4, 'Transmitted for Teacher Manual Marking, Score Verification & Result Upload', 0, 1, 'C');

        // Meta Box
        $this->Ln(2);
        $this->SetFillColor(248, 250, 252);
        $this->SetDrawColor(226, 232, 240);
        $this->Rect(12, $this->GetY(), $this->GetPageWidth() - 24, 12, 'DF');

        $this->SetY($this->GetY() + 1.5);
        $this->SetFont('Arial', 'B', 8);
        $this->SetTextColor(30, 41, 59);

        $width = ($this->GetPageWidth() - 24) / 3;
        $this->Cell($width, 4.5, 'Candidate: '.$this->studentName, 0, 0, 'L');
        $this->Cell($width, 4.5, 'Student ID: '.$this->studentIdNumber, 0, 0, 'L');
        $this->Cell($width, 4.5, 'Subject: '.$this->courseInfo, 0, 1, 'L');

        $this->SetFont('Arial', '', 7.5);
        $this->SetTextColor(71, 85, 105);
        $this->Cell($width, 4.5, 'Exam: '.substr($this->examTitle, 0, 32), 0, 0, 'L');
        $this->Cell($width, 4.5, 'Submitted: '.$this->submissionTime, 0, 0, 'L');
        $this->Cell($width, 4.5, 'Status: Pending Teacher Marking', 0, 1, 'L');

        $this->Ln(3);
    }

    public function Footer(): void
    {
        $this->SetY(-14);
        $this->SetFont('Arial', 'I', 7.5);
        $this->SetTextColor(148, 163, 184);

        $pageWidth = $this->GetPageWidth() - 24;
        $this->Cell($pageWidth / 2, 8, 'Lincoln SMTS Examination Submissions System &bull; '.date('d M Y, H:i'), 0, 0, 'L');
        $this->Cell($pageWidth / 2, 8, 'Page '.$this->PageNo().' of {nb}', 0, 0, 'R');
    }
}
