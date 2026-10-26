'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  listClasses,
  listSubjects,
  getClassResults,
  saveClassResults,
  uploadClassResultsCsv,
  downloadClassResultsCsv,
  downloadStudentPerformanceReportPdf,
  downloadClassPerformanceReportsZip,
  type SchoolClassDto,
  type AdminSubject,
  type ClassResultsMeta,
} from '../services/api';

const TERMS = [
  'First Term 2025/2026',
  'Second Term 2025/2026',
  'Third Term 2025/2026',
];

interface EditableStudentScore {
  student_id: number;
  name: string;
  email: string;
  student_id_number: string;
  grade_level?: string;
  ca1_score: string;
  ca2_score: string;
  ca_score: string;
  exam_score: string;
  total_score: number | null;
  grade: string | null;
  remark: string;
  updated_at?: string | null;
}

function calculateGradeAndRemark(total: number | null): { grade: string | null; remark: string } {
  if (total === null || isNaN(total)) return { grade: null, remark: '' };
  if (total >= 75) return { grade: 'A', remark: 'Distinction' };
  if (total >= 65) return { grade: 'B', remark: 'Very Good' };
  if (total >= 50) return { grade: 'C', remark: 'Credit' };
  if (total >= 45) return { grade: 'D', remark: 'Pass' };
  if (total >= 40) return { grade: 'E', remark: 'Fair' };
  return { grade: 'F', remark: 'Fail' };
}

const getGradeBadge = (grade: string | null) => {
  if (!grade) return <span className="text-zinc-400 font-mono text-xs">—</span>;
  if (grade === 'A') return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">A (Distinction)</span>;
  if (grade === 'B') return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200">B (Very Good)</span>;
  if (grade === 'C') return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">C (Credit)</span>;
  if (grade === 'D') return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-orange-100 text-orange-800 border border-orange-200">D (Pass)</span>;
  if (grade === 'E') return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-200">E (Fair)</span>;
  return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-red-100 text-red-800 border border-red-200">F (Fail)</span>;
};

const getCompletionBadge = (status?: 'completed' | 'in_progress' | 'pending' | 'empty') => {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        All Scores Uploaded by Teacher
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        Partially Graded by Teacher
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
      Pending Teacher Upload
    </span>
  );
};

export function ClassResultsView() {
  const [classes, setClasses] = useState<SchoolClassDto[]>([]);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>(TERMS[0]);

  const [scores, setScores] = useState<EditableStudentScore[]>([]);
  const [meta, setMeta] = useState<ClassResultsMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load classes and subjects on mount
  useEffect(() => {
    let ignore = false;
    Promise.all([listClasses(), listSubjects()])
      .then(([classList, subjectResp]) => {
        if (ignore) return;
        setClasses(classList || []);
        const subs = subjectResp?.data || [];
        setSubjects(subs);

        if (classList && classList.length > 0) {
          setSelectedClassId(String(classList[0].id));
        }
        // Default to "all" to automatically display composite multi-subject overview
        setSelectedCourseId('all');
      })
      .catch((err) => {
        if (!ignore) {
          setFeedback({ type: 'error', message: 'Failed to load initial class and subject lists.' });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch results whenever class, course, or term changes
  useEffect(() => {
    if (!selectedClassId) return;

    let ignore = false;
    setLoading(true);
    setFeedback(null);

    getClassResults(Number(selectedClassId), selectedCourseId ? Number(selectedCourseId) : undefined, selectedTerm)
      .then((data) => {
        if (ignore) return;
        if (data.selected_course_id && !selectedCourseId) {
          setSelectedCourseId(String(data.selected_course_id));
        }
        setMeta(data.meta || null);

        const mapped: EditableStudentScore[] = (data.students || []).map((s) => {
          const ca1Str = s.ca1_score !== null && s.ca1_score !== undefined ? String(s.ca1_score) : '';
          const ca2Str = s.ca2_score !== null && s.ca2_score !== undefined ? String(s.ca2_score) : '';
          const caStr = s.ca_score !== null && s.ca_score !== undefined ? String(s.ca_score) : '';
          const examStr = s.exam_score !== null && s.exam_score !== undefined ? String(s.exam_score) : '';
          const total = s.total_score !== null && s.total_score !== undefined ? s.total_score : null;
          const { grade, remark } = s.grade
            ? { grade: s.grade, remark: s.remark || '' }
            : calculateGradeAndRemark(total);

          return {
            student_id: s.student_id,
            name: s.name,
            email: s.email,
            student_id_number: s.student_id_number,
            grade_level: s.grade_level,
            ca1_score: ca1Str,
            ca2_score: ca2Str,
            ca_score: caStr,
            exam_score: examStr,
            total_score: total,
            grade,
            remark,
            updated_at: s.updated_at,
          };
        });
        setScores(mapped);
      })
      .catch((err) => {
        if (!ignore) {
          setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to retrieve class results from teachers.' });
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedClassId, selectedCourseId, selectedTerm]);

  const handleScoreChange = (index: number, field: 'ca1_score' | 'ca2_score' | 'ca_score' | 'exam_score' | 'remark', value: string) => {
    setScores((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      if (field === 'ca1_score' || field === 'ca2_score' || field === 'ca_score' || field === 'exam_score') {
        const ca1Num = target.ca1_score.trim() !== '' ? parseFloat(target.ca1_score) : null;
        const ca2Num = target.ca2_score.trim() !== '' ? parseFloat(target.ca2_score) : null;
        let caNum = target.ca_score.trim() !== '' ? parseFloat(target.ca_score) : null;

        if (ca1Num !== null || ca2Num !== null) {
          caNum = Math.round(((ca1Num ?? 0) + (ca2Num ?? 0)) * 100) / 100;
          target.ca_score = String(caNum);
        }

        const examNum = target.exam_score.trim() !== '' ? parseFloat(target.exam_score) : null;

        if (caNum !== null || examNum !== null) {
          const tot = Math.round(((caNum ?? 0) + (examNum ?? 0)) * 100) / 100;
          target.total_score = tot;
          const { grade, remark } = calculateGradeAndRemark(tot);
          target.grade = grade;
          if (!target.remark || target.remark === 'Distinction' || target.remark === 'Very Good' || target.remark === 'Credit' || target.remark === 'Pass' || target.remark === 'Fair' || target.remark === 'Fail') {
            target.remark = remark;
          }
        } else {
          target.total_score = null;
          target.grade = null;
        }
      }

      next[index] = target;
      return next;
    });
  };

  const handleSaveAll = async () => {
    if (!selectedClassId || !selectedCourseId) {
      setFeedback({ type: 'error', message: 'Please select both a class and a subject.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payloadResults = scores.map((s) => ({
      student_id: s.student_id,
      ca1_score: s.ca1_score.trim() !== '' ? parseFloat(s.ca1_score) : null,
      ca2_score: s.ca2_score.trim() !== '' ? parseFloat(s.ca2_score) : null,
      ca_score: s.ca_score.trim() !== '' ? parseFloat(s.ca_score) : null,
      exam_score: s.exam_score.trim() !== '' ? parseFloat(s.exam_score) : null,
      remark: s.remark.trim() || undefined,
    }));

    try {
      const res = await saveClassResults(Number(selectedClassId), {
        course_id: Number(selectedCourseId),
        term: selectedTerm,
        results: payloadResults,
      });

      setFeedback({
        type: 'success',
        message: `${res.message} Changes published successfully.`,
      });
      setEditMode(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save class results.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBroadsheet = async (format: 'pdf' | 'csv' = 'pdf') => {
    if (!selectedClassId) return;

    setDownloading(true);
    try {
      const selectedClass = classes.find((c) => String(c.id) === selectedClassId);
      const selectedSubject = subjects.find((s) => String(s.id) === selectedCourseId);
      const ext = format === 'pdf' ? 'pdf' : 'csv';
      const fileName = `${selectedClass?.name || 'Class'}_${selectedSubject?.code || 'Subject'}_${selectedTerm.replace(/\s+/g, '_')}_Official_Broadsheet.${ext}`;

      await downloadClassResultsCsv(
        Number(selectedClassId),
        selectedCourseId ? Number(selectedCourseId) : undefined,
        selectedTerm,
        fileName,
        format
      );

      setFeedback({
        type: 'success',
        message: `Results broadsheet (${format.toUpperCase()}) for ${selectedClass?.name || 'Class'} successfully downloaded!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to download results broadsheet.',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const selectedClass = classes.find((c) => String(c.id) === selectedClassId);
    const selectedSubject = subjects.find((s) => String(s.id) === selectedCourseId);
    const fileName = `${selectedClass?.name || 'Class'}_${selectedSubject?.code || 'Subject'}_${selectedTerm.replace(/\s+/g, '_')}_Template.csv`;

    const headers = ['student_id_number', 'student_name', 'email', 'ca_score', 'exam_score', 'remark'];
    const rows = scores.map((s) => [
      `"${s.student_id_number}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      '',
      '',
      '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedClassId || !selectedCourseId) {
      setFeedback({ type: 'error', message: 'Please select a class and a subject before uploading.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await uploadClassResultsCsv(Number(selectedClassId), Number(selectedCourseId), selectedTerm, file);
      setFeedback({
        type: 'success',
        message: res.message || 'Results file processed and updated successfully!',
      });
      // Refresh current results
      const data = await getClassResults(Number(selectedClassId), Number(selectedCourseId), selectedTerm);
      setMeta(data.meta || null);
      const mapped: EditableStudentScore[] = (data.students || []).map((s) => ({
        student_id: s.student_id,
        name: s.name,
        email: s.email,
        student_id_number: s.student_id_number,
        grade_level: s.grade_level,
        ca1_score: s.ca1_score !== null && s.ca1_score !== undefined ? String(s.ca1_score) : '',
        ca2_score: s.ca2_score !== null && s.ca2_score !== undefined ? String(s.ca2_score) : '',
        ca_score: s.ca_score !== null && s.ca_score !== undefined ? String(s.ca_score) : '',
        exam_score: s.exam_score !== null && s.exam_score !== undefined ? String(s.exam_score) : '',
        total_score: s.total_score,
        grade: s.grade,
        remark: s.remark || '',
        updated_at: s.updated_at,
      }));
      setScores(mapped);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to process CSV results file.',
      });
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentClassObj = classes.find((c) => String(c.id) === selectedClassId);
  const currentSubjectObj = subjects.find((s) => String(s.id) === selectedCourseId);

  // Analytics summary
  const assessedList = scores.filter((s) => s.total_score !== null);
  const totalCount = scores.length;
  const assessedCount = assessedList.length;
  const pendingCount = totalCount - assessedCount;
  const avgTotal = assessedCount > 0
    ? Math.round((assessedList.reduce((acc, curr) => acc + (curr.total_score ?? 0), 0) / assessedCount) * 10) / 10
    : 0;
  const passCount = assessedList.filter((s) => (s.total_score ?? 0) >= 40).length;
  const passRate = assessedCount > 0 ? `${Math.round((passCount / assessedCount) * 100)}%` : '0%';

  return (
    <div className="space-y-6">
      {/* Configuration & Selection Panel */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-zinc-900">Teacher Results Review &amp; Broadsheet Download</h2>
              {getCompletionBadge(meta?.completion_status)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Teachers assigned to each class record Continuous Assessment (CA) and Examination marks. As Admin, you can inspect and download the completed broadsheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Download Broadsheet (PDF) */}
            <button
              type="button"
              onClick={() => handleDownloadBroadsheet('pdf')}
              disabled={downloading || scores.length === 0}
              className="px-4 py-2 rounded-xl bg-[#B81D22] hover:bg-[#9E1519] text-white text-xs font-bold shadow-md shadow-red-900/10 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
              title="Download official broadsheet in PDF format"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>{downloading ? 'Generating PDF...' : 'Download Broadsheet (PDF)'}</span>
            </button>

            {/* Whole Class Reports ZIP Package (Folder) */}
            <button
              type="button"
              onClick={async () => {
                if (!selectedClassId) return;
                try {
                  setDownloadingZip(true);
                  await downloadClassPerformanceReportsZip(
                    Number(selectedClassId),
                    currentClassObj?.name,
                    selectedTerm
                  );
                } catch {
                  alert('Failed to download class report cards ZIP folder.');
                } finally {
                  setDownloadingZip(false);
                }
              }}
              disabled={downloadingZip || scores.length === 0}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-900/10 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              title="Download complete report cards for all students in this class in a ZIP folder"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>{downloadingZip ? 'Packaging Folder (ZIP)...' : 'Download Class Reports (ZIP)'}</span>
            </button>

            {/* CSV Export Option */}
            <button
              type="button"
              onClick={() => handleDownloadBroadsheet('csv')}
              disabled={downloading || scores.length === 0}
              className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 active:scale-95"
              title="Export broadsheet data as spreadsheet CSV"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>

            {/* Secondary Action: Download Template */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={scores.length === 0}
              className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Blank Template</span>
            </button>

            {/* Admin Override Toggle */}
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors ${
                editMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>{editMode ? 'Exit Admin Edit Mode' : 'Admin Override'}</span>
            </button>

            {editMode && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="px-3 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload Override CSV</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCsvFileUpload}
              accept=".csv,text/csv,text/plain"
              className="hidden"
            />
          </div>
        </div>

        {/* Dropdowns & Teacher Context */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-300 bg-zinc-50/50 p-2.5 font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
            >
              {classes.length === 0 && <option value="">No Classes Found</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Subject</label>
            <select
              value={selectedCourseId || 'all'}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-300 bg-zinc-50/50 p-2.5 font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
            >
              <option value="all">★ All Subjects (Composite Class Performance)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Academic Session / Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-300 bg-zinc-50/50 p-2.5 font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
            >
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assigned Teacher Information Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 text-xs">
          <div className="flex items-center gap-6 text-zinc-600">
            <div>
              <span className="text-zinc-400 font-medium">Assigned Subject Teacher: </span>
              <span className="font-bold text-zinc-900">{meta?.subject_teacher || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-zinc-400 font-medium">Class Form Master: </span>
              <span className="font-bold text-zinc-900">{meta?.form_master || 'Unassigned'}</span>
            </div>
          </div>
          {meta?.last_updated_at && (
            <div className="text-[11px] text-zinc-400">
              Last Teacher Update: <span className="font-semibold text-zinc-600">{new Date(meta.last_updated_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Enrolled Students</p>
          <p className="text-2xl font-black text-zinc-900">{totalCount}</p>
          <p className="text-[10px] text-zinc-400 mt-1">{currentClassObj?.name || 'Class'}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Teacher Graded</p>
          <p className="text-2xl font-black text-emerald-600">{assessedCount}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Submitted by teacher</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">Pending Teacher Upload</p>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Awaiting marks</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B81D22] mb-0.5">Class Average</p>
          <p className="text-2xl font-black text-[#B81D22]">{avgTotal > 0 ? `${avgTotal}%` : '—'}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Combined CA + Exam</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">Overall Pass Rate</p>
          <p className="text-2xl font-black text-blue-600">{passRate}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Score &ge; 40% Pass</p>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs hover:opacity-75 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Score BroadSheet — {currentClassObj?.name || 'Class'} ({selectedCourseId === 'all' || !selectedCourseId ? 'All Subjects Composite' : (currentSubjectObj?.name || 'Subject')})
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Reviewing results uploaded by Teacher ({meta?.subject_teacher || 'Assigned Instructor'}).
            </p>
          </div>

          {editMode && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || scores.length === 0}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-900/10 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Administrative Overrides'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500">Retrieving results submitted by teachers...</div>
        ) : scores.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">No students registered in this class.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-zinc-50/75 border-b border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 min-w-[180px]">Student Details</th>
                  <th className="py-3 px-3 font-mono">Student ID</th>
                  <th className="py-3 px-3 text-center w-24 whitespace-nowrap">1st CA (20)</th>
                  <th className="py-3 px-3 text-center w-24 whitespace-nowrap">2nd CA (20)</th>
                  <th className="py-3 px-3 text-center w-24 whitespace-nowrap">Total CA (40)</th>
                  <th className="py-3 px-3 text-center w-24 whitespace-nowrap">Exam (60)</th>
                  <th className="py-3 px-3 text-center w-24 whitespace-nowrap">Total (100)</th>
                  <th className="py-3 px-3 text-center w-28 whitespace-nowrap">Letter Grade</th>
                  <th className="py-3 px-4 min-w-[160px]">Teacher Remark</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Pupil Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
                {scores.map((s, idx) => (
                  <tr key={s.student_id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px] text-center">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-900">{s.name}</p>
                      <p className="text-[11px] text-zinc-400">{s.email}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[11px] text-zinc-600 whitespace-nowrap">
                      {s.student_id_number}
                    </td>

                    {/* 1st CA (20) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {editMode ? (
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={s.ca1_score}
                          onChange={(e) => handleScoreChange(idx, 'ca1_score', e.target.value)}
                          className="w-16 px-1.5 py-1 text-xs rounded border border-zinc-300 text-center font-bold"
                          placeholder="0-20"
                        />
                      ) : (
                        <span className="font-bold text-zinc-900">
                          {s.ca1_score !== '' ? s.ca1_score : <span className="text-zinc-300 font-mono">—</span>}
                        </span>
                      )}
                    </td>

                    {/* 2nd CA (20) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {editMode ? (
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={s.ca2_score}
                          onChange={(e) => handleScoreChange(idx, 'ca2_score', e.target.value)}
                          className="w-16 px-1.5 py-1 text-xs rounded border border-zinc-300 text-center font-bold"
                          placeholder="0-20"
                        />
                      ) : (
                        <span className="font-bold text-zinc-900">
                          {s.ca2_score !== '' ? s.ca2_score : <span className="text-zinc-300 font-mono">—</span>}
                        </span>
                      )}
                    </td>

                    {/* Total CA Score (40) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-mono font-black text-xs text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                        {s.ca_score !== '' ? `${s.ca_score}/40` : <span className="text-zinc-300 font-mono">—</span>}
                      </span>
                    </td>

                    {/* Exam Score */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {editMode ? (
                        <input
                          type="number"
                          min="0"
                          max="70"
                          step="0.5"
                          value={s.exam_score}
                          onChange={(e) => handleScoreChange(idx, 'exam_score', e.target.value)}
                          className="w-16 px-1.5 py-1 text-xs rounded border border-zinc-300 text-center font-bold"
                          placeholder="0-60"
                        />
                      ) : (
                        <span className="font-bold text-zinc-900">
                          {s.exam_score !== '' ? s.exam_score : <span className="text-zinc-300 font-mono">—</span>}
                        </span>
                      )}
                    </td>

                    {/* Total Score */}
                    <td className="py-3 px-3 text-center font-black text-sm whitespace-nowrap">
                      {s.total_score !== null ? (
                        <span className={s.total_score >= 40 ? 'text-zinc-900' : 'text-red-600'}>
                          {s.total_score}%
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Letter Grade */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">{getGradeBadge(s.grade)}</td>

                    {/* Remarks */}
                    <td className="py-3 px-4">
                      {editMode ? (
                        <input
                          type="text"
                          value={s.remark}
                          onChange={(e) => handleScoreChange(idx, 'remark', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-zinc-300"
                        />
                      ) : (
                        <span className="text-zinc-600 italic">
                          {s.remark || <span className="text-zinc-300 not-italic font-mono">—</span>}
                        </span>
                      )}
                    </td>

                    {/* Pupil Performance Report Download (Admin Exclusive) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => downloadStudentPerformanceReportPdf(s.student_id, s.name, selectedTerm)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284C7] text-xs font-bold border border-sky-200 transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Download official stamped Pupil's Performance Report PDF"
                      >
                        <svg className="w-3.5 h-3.5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Pupil Report (PDF)</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
