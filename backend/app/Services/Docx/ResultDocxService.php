<?php

namespace App\Services\Docx;

use App\Models\Course;
use App\Models\SchoolClass;
use Illuminate\Support\Collection;
use ZipArchive;

class ResultDocxService
{
    /**
     * Generates a beautifully styled, landscape Word document (.docx) score sheet template.
     */
    public function generateTemplateDocx(
        SchoolClass $schoolClass,
        ?Course $course,
        string $term,
        string $type,
        Collection|array $students,
        ?string $teacherName = null
    ): string {
        $school = $schoolClass->school;
        $schoolName = $school?->name ?? 'Lincoln International School';
        $schoolMotto = $school?->motto ?? 'Excellence, Character and Innovation';
        $schoolAddress = $school?->address ?? 'Lincoln Academic Campus';
        $schoolContact = trim(($school?->email ?? '').' | '.($school?->phone ?? ''), ' |');

        $className = $schoolClass->name;
        $courseTitle = $course ? "{$course->name} ({$course->code})" : 'All Registered Subjects';
        $teacherStr = $teacherName ?: ($schoolClass->teacher?->name ?? 'Subject Teacher');

        $typeLabel = match (strtolower($type)) {
            '1ca', 'ca1' => '1st Continuous Assessment (1CA - Max 20%)',
            '2ca', 'ca2' => '2nd Continuous Assessment (2CA - Max 20%)',
            'ca' => 'Continuous Assessment (Test - Max 40%)',
            'exam' => 'Terminal Examination (Exam - Max 60%)',
            default => 'Combined Assessment & Examination Score Sheet',
        };

        $rowsXml = '';
        $index = 1;
        foreach ($students as $student) {
            $studentName = is_array($student) ? ($student['name'] ?? 'Student') : ($student->user?->name ?? 'Student');
            $studentIdNum = is_array($student) ? ($student['student_id_number'] ?? '—') : ($student->student_id_number ?? '—');

            $safeName = htmlspecialchars($studentName, ENT_XML1, 'UTF-8');
            $safeId = htmlspecialchars($studentIdNum, ENT_XML1, 'UTF-8');

            $rowBg = ($index % 2 === 0) ? 'F9FAFB' : 'FFFFFF';

            $rowsXml .= '
            <w:tr>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="600" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="18"/><w:color w:val="6B7280"/></w:rPr><w:t>'.$index.'</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3200" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr><w:t>'.$safeName.'</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="1800" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:b/><w:sz w:val="18"/><w:color w:val="374151"/></w:rPr><w:t>'.$safeId.'</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="1100" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="1100" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="1300" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="1300" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="1300" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="2500" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="'.$rowBg.'"/>
                        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="100" w:type="dxa"/></w:tcMar>
                    </w:tcPr>
                    <w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="0"/></w:pPr></w:p>
                </w:tc>
            </w:tr>';
            $index++;
        }

        $documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <w:body>
        <!-- Header -->
        <w:p>
            <w:pPr>
                <w:jc w:val="center"/>
                <w:spacing w:before="0" w:after="60"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
                    <w:b/>
                    <w:sz w:val="36"/>
                    <w:color w:val="B81D22"/>
                </w:rPr>
                <w:t>'.htmlspecialchars($schoolName, ENT_XML1, 'UTF-8').'</w:t>
            </w:r>
        </w:p>

        <w:p>
            <w:pPr>
                <w:jc w:val="center"/>
                <w:spacing w:before="0" w:after="40"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
                    <w:i/>
                    <w:sz w:val="20"/>
                    <w:color w:val="4B5563"/>
                </w:rPr>
                <w:t>MOTTO: '.htmlspecialchars($schoolMotto, ENT_XML1, 'UTF-8').'</w:t>
            </w:r>
        </w:p>

        <w:p>
            <w:pPr>
                <w:jc w:val="center"/>
                <w:spacing w:before="0" w:after="160"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
                    <w:sz w:val="18"/>
                    <w:color w:val="6B7280"/>
                </w:rPr>
                <w:t>'.htmlspecialchars($schoolAddress, ENT_XML1, 'UTF-8').' | '.htmlspecialchars($schoolContact, ENT_XML1, 'UTF-8').'</w:t>
            </w:r>
        </w:p>

        <!-- Document Title -->
        <w:p>
            <w:pPr>
                <w:jc w:val="center"/>
                <w:spacing w:before="80" w:after="160"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
                    <w:b/>
                    <w:sz w:val="26"/>
                    <w:color w:val="111827"/>
                </w:rPr>
                <w:t>OFFICIAL RESULT ROSTER TEMPLATE</w:t>
            </w:r>
        </w:p>

        <!-- Meta Summary Grid -->
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="14200" w:type="dxa"/>
                <w:jc w:val="center"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                    <w:left w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                    <w:right w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                    <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="7100" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F3F4F6"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="374151"/></w:rPr><w:t>Class: </w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr><w:t>'.htmlspecialchars($className, ENT_XML1, 'UTF-8').'</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="7100" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F3F4F6"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="374151"/></w:rPr><w:t>Subject: </w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr><w:t>'.htmlspecialchars($courseTitle, ENT_XML1, 'UTF-8').'</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="7100" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="374151"/></w:rPr><w:t>Academic Session: </w:t></w:r><w:r><w:rPr><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr><w:t>'.htmlspecialchars($term, ENT_XML1, 'UTF-8').'</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="7100" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="374151"/></w:rPr><w:t>Assigned Teacher: </w:t></w:r><w:r><w:rPr><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr><w:t>'.htmlspecialchars($teacherStr, ENT_XML1, 'UTF-8').'</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
        </w:tbl>

        <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="17"/><w:color w:val="6B7280"/></w:rPr><w:t>Instruction: Record candidate test scores (1CA max 20, 2CA max 20, Total CA max 40) and terminal examination scores (Exam max 60). Once completed, you may upload this score sheet directly via CSV or spreadsheet.</w:t></w:r></w:p>

        <!-- Scores Table with Sky Blue Header #0284C7 -->
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="14200" w:type="dxa"/>
                <w:jc w:val="center"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>
                    <w:left w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>
                    <w:bottom w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>
                    <w:right w:val="single" w:sz="6" w:space="0" w:color="D1D5DB"/>
                    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                    <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:color w:val="FFFFFF"/></w:rPr><w:t>#</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="3200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/><w:left w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:color w:val="FFFFFF"/></w:rPr><w:t>PUPIL FULL NAME</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="1800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:color w:val="FFFFFF"/></w:rPr><w:t>ADMISSION NO.</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="1100" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="17"/><w:color w:val="FFFFFF"/></w:rPr><w:t>C.A 1 (20%)</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="1100" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="17"/><w:color w:val="FFFFFF"/></w:rPr><w:t>C.A 2 (20%)</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="1300" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="17"/><w:color w:val="FFFFFF"/></w:rPr><w:t>TOTAL CA (40%)</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="1300" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="17"/><w:color w:val="FFFFFF"/></w:rPr><w:t>EXAM (60%)</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="1300" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="17"/><w:color w:val="FFFFFF"/></w:rPr><w:t>TOTAL (100%)</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="2500" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0284C7"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/><w:left w:w="100" w:type="dxa"/></w:tcMar></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="18"/><w:color w:val="FFFFFF"/></w:rPr><w:t>REMARKS</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
            '.$rowsXml.'
        </w:tbl>

        <!-- Sign-off Block -->
        <w:p><w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr></w:p>
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="14200" w:type="dxa"/>
                <w:jc w:val="center"/>
                <w:tblBorders>
                    <w:top w:val="none"/>
                    <w:left w:val="none"/>
                    <w:bottom w:val="none"/>
                    <w:right w:val="none"/>
                    <w:insideH w:val="none"/>
                    <w:insideV w:val="none"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="7100" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:sz w:val="19"/></w:rPr><w:t>Subject Teacher Signature &amp; Date: _______________________________</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="7100" w:type="dxa"/></w:tcPr>
                    <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="19"/></w:rPr><w:t>Principal / Head Teacher Stamp: _______________________________</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
        </w:tbl>

        <!-- Landscape Section Properties (A4 Landscape: 16838 x 11906 dxa) -->
        <w:sectPr>
            <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
            <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/>
        </w:sectPr>
    </w:body>
</w:document>';

        return $this->createDocxZip($documentXml);
    }

    /**
     * Packages XML documents into a valid .docx ZIP archive in memory.
     */
    protected function createDocxZip(string $documentXml): string
    {
        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>';

        $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>';

        $tempFile = tempnam(sys_get_temp_dir(), 'lincoln_docx_');
        $zip = new ZipArchive;

        if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Failed to initialize ZipArchive for DOCX document.');
        }

        $zip->addFromString('[Content_Types].xml', $contentTypes);
        $zip->addFromString('_rels/.rels', $rels);
        $zip->addFromString('word/document.xml', $documentXml);
        $zip->close();

        $content = file_get_contents($tempFile);
        @unlink($tempFile);

        return $content;
    }
}
