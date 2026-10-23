'use client';

import React, { useEffect, useState, useRef, useId } from 'react';
import {
  listTeacherResultClasses,
  getTeacherClassResults,
  saveTeacherClassResults,
  uploadTeacherClassResultsCsv,
  getTeacherTemplateUrl,
  type TeacherResultClass,
  type TeacherResultSubject,
  type TeacherStudentScore,
} from '../services/api';

const TERMS = [
  'First Term 2025/2026',
  'Second Term 2025/2026',
  'Third Term 2025/2026',
];

type UploadType = 'combined' | 'ca' | 'exam';

interface EditableStudentScore {
  student_id: number;
  name: string;
  email: string;
  student_id_number: string;
  grade_level?: string;
  ca_score: string;
  exam_score: string;
  total_score: number | null;
  grade: string | null;
  remark: string;
  updated_at?: string | null;
  cbt_submission?: {
    id: number;
    status: string;
    submitted_at: string | null;
    file_path: string | null;
    pdf_url: string | null;
  } | null;
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
  const base = "px-2.5 py-1 rounded-lg text-[11px] font-black border whitespace-nowrap inline-flex items-center justify-center gap-1 shadow-xs";
  if (grade === 'A') return <span className={`${base} bg-emerald-50 text-emerald-800 border-emerald-200`}>A &bull; Distinction</span>;
  if (grade === 'B') return <span className={`${base} bg-blue-50 text-blue-800 border-blue-200`}>B &bull; Very Good</span>;
  if (grade === 'C') return <span className={`${base} bg-amber-50 text-amber-800 border-amber-200`}>C &bull; Credit</span>;
  if (grade === 'D') return <span className={`${base} bg-orange-50 text-orange-800 border-orange-200`}>D &bull; Pass</span>;
  if (grade === 'E') return <span className={`${base} bg-purple-50 text-purple-800 border-purple-200`}>E &bull; Fair</span>;
  if (grade === 'IP') return <span className={`${base} bg-zinc-100 text-zinc-700 border-zinc-300 font-bold`}>In Progress</span>;
  return <span className={`${base} bg-red-50 text-red-800 border-red-200`}>F &bull; Fail</span>;
};

export function TeacherResultsView() {
  const [classes, setClasses] = useState<TeacherResultClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>(TERMS[0]);

  // Upload configuration
  const [uploadType, setUploadType] = useState<UploadType>('combined');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Score roster state
  const [scores, setScores] = useState<EditableStudentScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; errors?: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneId = useId();

  // Load teacher assigned classes
  useEffect(() => {
    let ignore = false;
    listTeacherResultClasses()
      .then((classList) => {
        if (ignore) return;
        setClasses(classList || []);
        if (classList && classList.length > 0) {
          const firstClass = classList[0];
          setSelectedClassId(String(firstClass.id));
          if (firstClass.subjects && firstClass.subjects.length > 0) {
            setSelectedCourseId(String(firstClass.subjects[0].id));
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          setFeedback({ type: 'error', message: 'Failed to load your assigned classes list.' });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // When class changes, adjust selected subject if necessary
  const currentClassObj = classes.find((c) => String(c.id) === selectedClassId);
  const currentSubjects: TeacherResultSubject[] = currentClassObj?.subjects || [];

  useEffect(() => {
    if (currentSubjects.length > 0) {
      const exists = currentSubjects.some((s) => String(s.id) === selectedCourseId);
      if (!exists) {
        setSelectedCourseId(String(currentSubjects[0].id));
      }
    } else {
      setSelectedCourseId('');
    }
  }, [selectedClassId, currentSubjects, selectedCourseId]);

  // Fetch results when class, subject, or term changes
  const loadClassResults = () => {
    if (!selectedClassId) return;

    setLoading(true);
    getTeacherClassResults(Number(selectedClassId), selectedCourseId ? Number(selectedCourseId) : undefined, selectedTerm)
      .then((data) => {
        if (data.selected_course_id && !selectedCourseId) {
          setSelectedCourseId(String(data.selected_course_id));
        }

        const mapped: EditableStudentScore[] = (data.students || []).map((s) => {
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
            ca_score: caStr,
            exam_score: examStr,
            total_score: total,
            grade,
            remark,
            updated_at: s.updated_at,
            cbt_submission: s.cbt_submission,
          };
        });
        setScores(mapped);
      })
      .catch((err) => {
        setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load class roster scores.' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadClassResults();
  }, [selectedClassId, selectedCourseId, selectedTerm]);

  // Score adjustments
  const handleScoreChange = (index: number, field: 'ca_score' | 'exam_score' | 'remark', value: string) => {
    setScores((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      if (field === 'ca_score' || field === 'exam_score') {
        const caNum = target.ca_score.trim() !== '' ? parseFloat(target.ca_score) : null;
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

  // Manual save for tweaks
  const handleSaveAll = async () => {
    if (!selectedClassId || !selectedCourseId) {
      setFeedback({ type: 'error', message: 'Please select both an assigned class and subject.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payloadResults = scores.map((s) => ({
      student_id: s.student_id,
      ca_score: s.ca_score.trim() !== '' ? parseFloat(s.ca_score) : null,
      exam_score: s.exam_score.trim() !== '' ? parseFloat(s.exam_score) : null,
      remark: s.remark.trim() || undefined,
    }));

    try {
      const res = await saveTeacherClassResults(Number(selectedClassId), {
        course_id: Number(selectedCourseId),
        term: selectedTerm,
        results: payloadResults,
      });

      setFeedback({
        type: 'success',
        message: `${res.message} Scores are published to student portals and ready for Admin retrieval!`,
      });
      loadClassResults();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save class results.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Download template
  const handleDownloadTemplate = (type: UploadType, format: 'pdf' | 'csv' = 'pdf') => {
    if (!selectedClassId || !selectedCourseId) {
      setFeedback({ type: 'error', message: 'Please select a class and a subject first.' });
      return;
    }
    const url = getTeacherTemplateUrl(Number(selectedClassId), Number(selectedCourseId), selectedTerm, type, format);
    const token = typeof window !== 'undefined'
      ? window.sessionStorage.getItem('lincoln.token') || window.localStorage.getItem('lincoln.token') || ''
      : '';

    fetch(url, {
      headers: {
        Accept: format === 'pdf' ? 'application/pdf' : 'text/csv',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not generate template');
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const selectedClass = classes.find((c) => String(c.id) === selectedClassId);
        const selectedSubject = currentSubjects.find((s) => String(s.id) === selectedCourseId);
        const ext = format === 'pdf' ? 'pdf' : 'csv';
        link.download = `${selectedClass?.name || 'Class'}_${selectedSubject?.code || 'Subject'}_${type.toUpperCase()}_Template.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => {
        setFeedback({ type: 'error', message: `Failed to download ${format.toUpperCase()} roster template.` });
      });
  };

  // File selection & drop handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFeedback(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFeedback(null);
    }
  };

  // Upload file action
  const handleExecuteFileUpload = async () => {
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Please select or drop a results file to upload.' });
      return;
    }

    if (!selectedClassId || !selectedCourseId) {
      setFeedback({ type: 'error', message: 'Please select an assigned class and subject.' });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const res = await uploadTeacherClassResultsCsv(
        Number(selectedClassId),
        Number(selectedCourseId),
        selectedTerm,
        selectedFile,
        uploadType
      );

      setFeedback({
        type: 'success',
        message: `${res.message} Students can now immediately view their marks on their student portals!`,
        errors: res.errors && res.errors.length > 0 ? res.errors : undefined,
      });

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload updated scores
      loadClassResults();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to process uploaded results file.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Export Broadsheet
  const handleExportBroadsheet = async (format: 'pdf' | 'csv' = 'pdf') => {
    const selectedClass = classes.find((c) => String(c.id) === selectedClassId);
    const selectedSubject = currentSubjects.find((s) => String(s.id) === selectedCourseId);
    const ext = format === 'pdf' ? 'pdf' : 'csv';
    const fileName = `${selectedClass?.name || 'Class'}_${selectedSubject?.code || 'Subject'}_${selectedTerm.replace(/\s+/g, '_')}_Broadsheet.${ext}`;

    const token = typeof window !== 'undefined'
      ? window.sessionStorage.getItem('lincoln.token') || window.localStorage.getItem('lincoln.token') || ''
      : '';
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

    try {
      const res = await fetch(
        `${baseUrl}/teacher/classes/${selectedClassId}/results/export?course_id=${selectedCourseId}&term=${encodeURIComponent(selectedTerm)}&format=${format}`,
        {
          headers: {
            Accept: format === 'pdf' ? 'application/pdf' : 'text/csv',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to export results broadsheet.' });
    }
  };

  // Metrics summary
  const assessedList = scores.filter((s) => s.total_score !== null);
  const totalCount = scores.length;
  const assessedCount = assessedList.length;
  const pendingCount = totalCount - assessedCount;
  const avgTotal = assessedCount > 0
    ? Math.round((assessedList.reduce((acc, curr) => acc + (curr.total_score ?? 0), 0) / assessedCount) * 10) / 10
    : 0;
  const passCount = assessedList.filter((s) => (s.total_score ?? 0) >= 40).length;
  const passRate = assessedCount > 0 ? `${Math.round((passCount / assessedCount) * 100)}%` : '0%';

  const currentSubjectObj = currentSubjects.find((s) => String(s.id) === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* 1. Classroom & Academic Context Selector */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">Class &amp; Subject Academic Context</h2>
              {currentClassObj?.is_form_master && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#B81D22] border border-red-200">
                  Form Master
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select your assigned class and subject to upload Test (CA) and Examination result files.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportBroadsheet('pdf')}
              disabled={scores.length === 0}
              className="px-3.5 py-2 rounded-xl bg-[#B81D22] hover:bg-[#9E1519] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
              title="Download official completed broadsheet in printable PDF format"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Download Broadsheet (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportBroadsheet('csv')}
              disabled={scores.length === 0}
              className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 active:scale-95"
              title="Download results in spreadsheet CSV format"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Assigned Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-300 bg-zinc-50/50 p-2.5 font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
            >
              {classes.length === 0 && <option value="">No Assigned Classes</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}){c.is_form_master ? ' — Form Master' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Subject / Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-300 bg-zinc-50/50 p-2.5 font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
            >
              {currentSubjects.length === 0 && <option value="">No Subjects Configured</option>}
              {currentSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}{s.is_my_subject ? ' (My Subject)' : ''}
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
      </div>

      {/* 2. HERO: Result File Upload Center */}
      <div className="bg-gradient-to-br from-white via-zinc-50 to-red-50/20 border-2 border-red-100 rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Decorative backdrop */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-red-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#B81D22] text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                    Upload Results File (Test &amp; Exam Score Sheet)
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Upload your student marks directly as a spreadsheet file (<span className="font-semibold text-zinc-800">.csv</span> or <span className="font-semibold text-zinc-800">.xlsx</span>). Marks are automatically mapped and visible on the student&apos;s portal immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Template Download Shortcuts arranged exactly per requested format */}
            <div className="flex flex-col gap-1.5 self-start md:self-auto shrink-0">
              {/* Row 1: Label + CA (Test) Template */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                  ROSTER TEMPLATES:
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('ca', 'pdf')}
                  className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-[#FAF5FF] hover:bg-purple-100/70 text-[#9333EA] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:shadow active:scale-95"
                  title="Download printable official CA (Test) score sheet in PDF format"
                >
                  <svg className="w-3.5 h-3.5 text-[#9333EA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>CA (Test) Template</span>
                </button>
              </div>

              {/* Row 2: Exam Template + Combined Template */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('exam', 'pdf')}
                  className="px-3.5 py-1.5 rounded-xl border border-blue-200 bg-[#F0F8FF] hover:bg-blue-100/70 text-[#0284C7] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:shadow active:scale-95"
                  title="Download printable official Terminal Exam score sheet in PDF format"
                >
                  <svg className="w-3.5 h-3.5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Exam Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('combined', 'pdf')}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-[#F0FDF4] hover:bg-emerald-100/70 text-[#059669] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:shadow active:scale-95"
                  title="Download printable official Combined score sheet in PDF format"
                >
                  <svg className="w-3.5 h-3.5 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Combined Template</span>
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 text-right pr-0.5">
                PDF format &bull; <button type="button" onClick={() => handleDownloadTemplate('combined', 'csv')} className="text-zinc-500 hover:text-zinc-800 underline font-medium">Download CSV for upload</button>
              </div>
            </div>
          </div>

          {/* Upload Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-zinc-200/60">
            <span className="text-xs font-bold text-zinc-700">What type of result file are you uploading?</span>
            <div className="inline-flex rounded-xl bg-zinc-200/70 p-1 gap-1">
              {[
                { id: 'combined' as const, label: 'Combined (Test & Exam)', desc: 'Scores CA + Exam together' },
                { id: 'ca' as const, label: 'Test / CA File Only', desc: 'Continuous assessment (40)' },
                { id: 'exam' as const, label: 'Terminal Exam File Only', desc: 'Terminal examination (70)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setUploadType(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    uploadType === m.id
                      ? 'bg-white text-[#B81D22] shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Drag & Drop Zone */}
          <div
            id={dropZoneId}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#B81D22] bg-red-50/50 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-zinc-300 hover:border-[#B81D22] bg-white hover:bg-zinc-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.txt,.tsv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-900">{selectedFile.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    File size: {(selectedFile.size / 1024).toFixed(1)} KB &bull; Target: {uploadType === 'combined' ? 'Combined Scores' : uploadType === 'ca' ? 'Continuous Assessment (CA)' : 'Terminal Exam'}
                  </p>
                </div>
                <p className="text-xs text-emerald-700 font-semibold">
                  File ready for processing! Click below to publish marks to students.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-red-50 text-[#B81D22]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">
                    Drag and drop your Test or Exam result file here, or <span className="text-[#B81D22] underline">browse files</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Accepts Microsoft Excel (<span className="font-semibold text-zinc-700">.xlsx</span>), Comma-Separated (<span className="font-semibold text-zinc-700">.csv</span>), or Tab-Delimited (<span className="font-semibold text-zinc-700">.tsv</span>) files.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 font-mono">student_id_number</span>
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 font-mono">ca_score</span>
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 font-mono">exam_score</span>
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 font-mono">remark</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          {selectedFile && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-200">
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Selected: <strong className="text-zinc-900">{selectedFile.name}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteFileUpload}
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-xl bg-[#B81D22] hover:bg-[#9E1519] text-white text-xs font-bold transition-all shadow-md shadow-red-900/10 flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Processing &amp; Publishing Marks...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Upload &amp; Publish Results Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold space-y-1.5 shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-bold">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-sm hover:opacity-75 font-bold"
            >
              &times;
            </button>
          </div>

          {feedback.errors && feedback.errors.length > 0 && (
            <div className="mt-2 pl-6 text-[11px] text-red-800 space-y-0.5">
              <p className="font-bold">File Processing Warnings:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {feedback.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 4. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Enrolled Students</p>
          <p className="text-2xl font-black text-zinc-900">{totalCount}</p>
          <p className="text-[10px] text-zinc-400 mt-1">{currentClassObj?.name || 'Class'}</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Assessed Marks</p>
          <p className="text-2xl font-black text-emerald-600">{assessedCount}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Scores submitted</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">Pending Marks</p>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Awaiting marks</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B81D22] mb-0.5">Class Average</p>
          <p className="text-2xl font-black text-[#B81D22]">{avgTotal > 0 ? `${avgTotal}%` : '—'}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Combined CA + Exam</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">Class Pass Rate</p>
          <p className="text-2xl font-black text-blue-600">{passRate}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Score &ge; 40% Pass</p>
        </div>
      </div>

      {/* 5. Live Broadsheet Table & Quick Score Editor */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-gradient-to-r from-zinc-50/90 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-zinc-900">
                Live Results Broadsheet &amp; Score Preview
              </h3>
              <span className="text-zinc-300 font-bold">&bull;</span>
              <span className="px-2.5 py-0.5 rounded-md bg-red-50 text-[#B81D22] border border-red-200 text-xs font-bold">
                {currentSubjectObj?.name || 'Subject'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Continuous Assessment (CA / 40) + Terminal Exam (70) = Total (100). All marks saved here are visible to students and downloadable by Admins.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handleExportBroadsheet('pdf')}
              className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Download official broadsheet in printable PDF format"
            >
              <svg className="w-3.5 h-3.5 text-[#B81D22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Download PDF Broadsheet</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || scores.length === 0}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-[#B81D22] text-white text-xs font-black transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {saving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Manual Edits</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 animate-pulse">Loading student scores roster...</div>
        ) : scores.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">No students registered in this class.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1180px]">
              <thead>
                <tr className="bg-zinc-50/90 border-b border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-3 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[190px]">Student Details</th>
                  <th className="py-3.5 px-3 w-32 whitespace-nowrap">Student ID</th>
                  <th className="py-3.5 px-3 w-44 text-center whitespace-nowrap">CBT Answer Script</th>
                  <th className="py-3.5 px-3 w-32 text-center whitespace-nowrap">CA / Test (40)</th>
                  <th className="py-3.5 px-3 w-32 text-center whitespace-nowrap">Exam (70)</th>
                  <th className="py-3.5 px-3 w-28 text-center whitespace-nowrap">Total (100)</th>
                  <th className="py-3.5 px-3 w-36 text-center whitespace-nowrap">Letter Grade</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
                {scores.map((s, idx) => (
                  <tr key={s.student_id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-3 text-zinc-400 font-mono text-[11px] text-center align-middle">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <p className="font-bold text-zinc-900 leading-snug">{s.name}</p>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{s.email}</p>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-xs text-zinc-700 align-middle whitespace-nowrap">
                      {s.student_id_number}
                    </td>
                    <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                      {s.cbt_submission?.pdf_url ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <a
                            href={s.cbt_submission.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100/90 text-[#B81D22] text-xs font-bold shadow-xs hover:shadow-sm transition-all whitespace-nowrap active:scale-95"
                            title="Download candidate answer script PDF for manual evaluation"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0 text-[#B81D22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Mark Script (PDF)</span>
                          </a>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap px-2 py-0.5 rounded ${
                              s.exam_score
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {s.exam_score ? 'Mark Uploaded' : 'Awaiting Mark'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic whitespace-nowrap">No CBT script</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        placeholder="0 - 40"
                        value={s.ca_score}
                        onChange={(e) => handleScoreChange(idx, 'ca_score', e.target.value)}
                        className="w-24 mx-auto px-2.5 py-1.5 text-xs text-center rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] font-bold text-zinc-900 shadow-2xs block"
                      />
                    </td>
                    <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max="70"
                        step="0.5"
                        placeholder="0 - 70"
                        value={s.exam_score}
                        onChange={(e) => handleScoreChange(idx, 'exam_score', e.target.value)}
                        className="w-24 mx-auto px-2.5 py-1.5 text-xs text-center rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] font-bold text-zinc-900 shadow-2xs block"
                      />
                    </td>
                    <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                      {s.total_score !== null ? (
                        <span
                          className={`font-mono font-black text-sm ${
                            s.total_score >= 40 ? 'text-zinc-900' : 'text-red-600'
                          }`}
                        >
                          {s.total_score}%
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                      {getGradeBadge(s.grade)}
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <input
                        type="text"
                        placeholder="Teacher remark / standing"
                        value={s.remark}
                        onChange={(e) => handleScoreChange(idx, 'remark', e.target.value)}
                        className="w-full min-w-[200px] px-3 py-1.5 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] text-zinc-800 placeholder:text-zinc-400 shadow-2xs"
                      />
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
