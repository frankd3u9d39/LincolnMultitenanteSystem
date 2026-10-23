'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  listCbtExams,
  verifyCbtAccess,
  submitCbtExam,
  type CbtExamListItem,
  type CbtQuestion,
  type CbtSubmitResponse,
} from '@/modules/student/services/api';

type CbtStage = 'list' | 'verify' | 'exam' | 'result';

export default function StudentCbtPage() {
  const [stage, setStage] = useState<CbtStage>('list');
  const [loading, setLoading] = useState(true);
  const [cbtEnabled, setCbtEnabled] = useState(true);
  const [disabledMsg, setDisabledMsg] = useState('');
  const [exams, setExams] = useState<CbtExamListItem[]>([]);
  const [defaultStudent, setDefaultStudent] = useState<{ name: string; email: string; student_id_number: string }>({
    name: '',
    email: '',
    student_id_number: '',
  });

  // Selected exam for verification
  const [selectedExam, setSelectedExam] = useState<CbtExamListItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formIdNumber, setFormIdNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Active exam room state
  const [activeQuestions, setActiveQuestions] = useState<CbtQuestion[]>([]);
  const [activeExamInfo, setActiveExamInfo] = useState<{
    id: number;
    title: string;
    courseCode: string;
    courseName: string;
    durationMinutes: number;
    totalPoints: number;
  } | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<CbtSubmitResponse['result'] | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSubmitReason, setAutoSubmitReason] = useState<string | null>(null);

  // Synchronized refs to prevent stale closures during anti-cheat event handling
  const hasSubmittedRef = useRef(false);
  const answersRef = useRef(answers);
  const activeExamInfoRef = useRef(activeExamInfo);
  const gracePeriodEndRef = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    activeExamInfoRef.current = activeExamInfo;
  }, [activeExamInfo]);

  useEffect(() => {
    loadExamList();
  }, []);

  const loadExamList = async () => {
    setLoading(true);
    try {
      const resp = await listCbtExams();
      setCbtEnabled(resp.cbt_enabled);
      setDisabledMsg(resp.message || '');
      setExams(resp.exams || []);
      if (resp.student) {
        setDefaultStudent(resp.student);
        setFormName(resp.student.name || '');
        setFormIdNumber(resp.student.student_id_number || '');
      }
    } catch {
      setCbtEnabled(false);
      setDisabledMsg('Could not load examination schedule.');
    } finally {
      setLoading(false);
    }
  };

  // Timer effect when in exam stage
  useEffect(() => {
    if (stage !== 'exam') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('Exam time limit expired.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  // Anti-Cheat & Screen Lock System (hides sidebar/nav, locks screen, auto-submits on exit)
  useEffect(() => {
    if (stage !== 'exam' || !activeExamInfo) return;

    // 1. Hide sidebar & navbar by attaching class to body
    document.body.classList.add('cbt-exam-active');

    // 2. Set 2.5s grace period so initial paint and fullscreen transition don't trigger false positives
    gracePeriodEndRef.current = Date.now() + 2500;
    hasSubmittedRef.current = false;

    // Helper: auto-submit handler
    const onExitAttempt = (reason: string) => {
      if (Date.now() < gracePeriodEndRef.current) return;
      if (hasSubmittedRef.current) return;
      console.warn('CBT Anti-Cheat triggered:', reason);
      submitExam(activeExamInfo.id, answersRef.current, reason);
    };

    // 3. Monitor Fullscreen exit
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && Date.now() >= gracePeriodEndRef.current) {
        onExitAttempt('Fullscreen mode was exited (Screen Lock Broken).');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // 4. Monitor Tab Switch / Window Minimize (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && Date.now() >= gracePeriodEndRef.current) {
        onExitAttempt('Navigated away, switched browser tab, or minimized window.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Monitor Window Blur (loss of focus to another window or monitor)
    const handleWindowBlur = () => {
      if (Date.now() >= gracePeriodEndRef.current) {
        onExitAttempt('Examination window lost focus or switched application.');
      }
    };
    window.addEventListener('blur', handleWindowBlur);

    // 6. Monitor Page Exit / Reload (beforeunload)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      onExitAttempt('Attempted to reload or close examination page.');
      e.preventDefault();
      e.returnValue = 'Leaving will submit your examination immediately.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 7. Prevent Browser Back/Forward navigation (popstate)
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      onExitAttempt('Attempted browser back/forward navigation.');
    };
    window.addEventListener('popstate', handlePopState);

    // 8. Block shortcut keys that allow exiting or cheating (F11, F12, Escape, Ctrl+W, Ctrl+C, Ctrl+V, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Block Escape key (triggers auto-submit if pressed)
      if (e.key === 'Escape') {
        e.preventDefault();
        onExitAttempt('Pressed Escape key to exit locked screen.');
        return;
      }

      // Block Fullscreen, DevTools, Printing, Reload, Copy/Paste, Window controls
      if (
        e.key === 'F11' ||
        e.key === 'F12' ||
        (e.ctrlKey && ['c', 'v', 'x', 'r', 'w', 't', 'n', 'p', 'u'].includes(key)) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    // 9. Block Right Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.body.classList.remove('cbt-exam-active');
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [stage, activeExamInfo]);

  const handleOpenVerify = (exam: CbtExamListItem) => {
    setSelectedExam(exam);
    setAccessCode('');
    setVerifyError('');
    setStage('verify');
  };

  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    setVerifying(true);
    setVerifyError('');

    try {
      const resp = await verifyCbtAccess({
        exam_id: selectedExam.id,
        student_name: formName.trim(),
        student_id_number: formIdNumber.trim(),
        access_code: accessCode.trim(),
      });

      if (resp.verified && resp.questions && resp.questions.length > 0) {
        setActiveQuestions(resp.questions);
        setActiveExamInfo(resp.exam || null);
        setTimeLeft((resp.exam?.durationMinutes || 45) * 60);
        setCurrentQIndex(0);
        setAnswers({});
        hasSubmittedRef.current = false;
        answersRef.current = {};
        setAutoSubmitReason(null);

        // Request browser Fullscreen Mode during this user click gesture
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
          }
        } catch (err) {
          console.warn('Fullscreen request blocked or unsupported:', err);
        }

        setStage('exam');
      } else {
        setVerifyError(resp.message || 'Could not verify exam access.');
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Invalid Exam Access Code. Please verify with your exam supervisor.');
    } finally {
      setVerifying(false);
    }
  };

  const requestFullscreenLock = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const handleSelectOption = (questionId: number, optionKey: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: optionKey };
      answersRef.current = updated;
      return updated;
    });
  };

  const handleAutoSubmit = (reason?: string) => {
    if (activeExamInfo) {
      submitExam(activeExamInfo.id, answersRef.current, reason || 'Exam Timer Expired');
    }
  };

  const submitExam = async (examId: number, currentAnswers?: Record<number, string>, reason?: string) => {
    if (hasSubmittedRef.current && submitting) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);

    // Clean up fullscreen and body lock class
    document.body.classList.remove('cbt-exam-active');
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }

    try {
      const resp = await submitCbtExam({
        exam_id: examId,
        answers: currentAnswers || answersRef.current || {},
        reason: reason || 'Standard Exam Completion',
      });
      setExamResult(resp.result);
      if (reason) {
        setAutoSubmitReason(reason);
      }
      setStage('result');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. PAPER-BASED NOTICE (WHEN CBT IS DISABLED FOR THE SCHOOL)
  if (!loading && !cbtEnabled) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-800">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              Paper-Based Testing Institution
            </span>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-3">
              CBT Testing Not Available
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-lg mx-auto mt-2 leading-relaxed">
              {disabledMsg || 'Your school is registered as Paper-Based. All tests and examinations are conducted on written physical paper scripts in assigned examination halls.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-left max-w-md mx-auto space-y-2">
            <h4 className="text-xs font-bold text-zinc-900">Need exam timetables or past results?</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Check your class timetable for exam halls, dates, and times, or view your published Continuous Assessment and Exam scores under Exam Results.
            </p>
            <div className="flex gap-2 pt-2">
              <Link
                href="/student/timetable"
                className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 text-zinc-800 text-xs font-bold hover:bg-zinc-100"
              >
                View Timetable
              </Link>
              <Link
                href="/student/results"
                className="px-3 py-1.5 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519]"
              >
                View Exam Results
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CBT EXAM LIST STAGE
  if (stage === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Computer-Based Testing (CBT) Portal</h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Secure online examinations portal for continuous assessments and terminal examinations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              CBT System Online
            </span>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-3xl p-6 text-white shadow-xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Official Exam Room Protocol</span>
              <h2 className="text-lg font-black mt-0.5">How to Start Your CBT Examination</h2>
            </div>
            <span className="text-2xl">🖥️</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-zinc-300">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-bold text-white block mb-0.5">1. Select Scheduled Exam</span>
              <p className="text-[11px] text-zinc-400">Choose the active exam session from the list below.</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-bold text-white block mb-0.5">2. Locked Screen Authentication</span>
              <p className="text-[11px] text-zinc-400">Enter Access Code. The exam hall will enter locked full-screen mode with navigation disabled.</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-bold text-white block mb-0.5">3. Strict Anti-Cheat Policy</span>
              <p className="text-[11px] text-zinc-400">Exiting full-screen, switching tabs, or leaving the window will auto-submit your test immediately.</p>
            </div>
          </div>
        </div>

        {/* Exams Table / Cards */}
        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 text-sm">Scheduled CBT Examinations</h3>
            <span className="text-xs text-zinc-500 font-mono">{exams.length} Sessions Available</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs animate-pulse">
              Loading available CBT examination papers…
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs space-y-2">
              <p className="font-semibold text-zinc-800">No scheduled CBT examinations at this moment.</p>
              <p className="text-zinc-400">Your school administrator or teachers will announce when your next online test is scheduled.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {exams.map((exam) => (
                <div key={exam.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-mono text-[10px] font-bold">
                        {exam.courseCode}
                      </span>
                      <h4 className="text-base font-bold text-zinc-900">{exam.courseName}</h4>
                      {exam.hasSubmitted && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Submitted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 font-medium">{exam.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 pt-1 font-mono">
                      <span>📅 {exam.date}</span>
                      <span>⏰ {exam.time}</span>
                      <span>⏳ Duration: {exam.duration}</span>
                    </div>
                  </div>

                  <div>
                    {exam.hasSubmitted ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {exam.scriptPdfUrl && (
                          <a
                            href={exam.scriptPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            title="Download official candidate answer script"
                          >
                            <span>📄 View Script (PDF)</span>
                          </a>
                        )}
                        <span className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black text-center">
                          Awaiting Teacher Marking
                        </span>
                      </div>
                    ) : (
                      <button
                        id="cbt-start-exam-btn"
                        type="button"
                        onClick={() => handleOpenVerify(exam)}
                        className="px-5 py-2.5 rounded-xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
                      >
                        <span>Start Examination</span>
                        <span>&rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. EXAM AUTHENTICATION / ACCESS CODE FORM
  if (stage === 'verify') {
    return (
      <div className="max-w-xl mx-auto py-6 space-y-6">
        <button
          id="cbt-back-to-list-btn"
          type="button"
          onClick={() => setStage('list')}
          className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5"
        >
          &larr; Back to Examinations List
        </button>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#B81D22]">Examination Entry Authentication</span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 mt-1">
              {selectedExam?.courseName} ({selectedExam?.courseCode})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">{selectedExam?.title}</p>
          </div>

          {verifyError && (
            <div id="cbt-verify-error" className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{verifyError}</span>
            </div>
          )}

          {/* Security Notice Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <span>⚠️</span>
              <span>Screen Lock Notice</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Once authenticated, the examination room will enter <strong>locked full-screen mode</strong>. The navigation bar and sidebar will be removed. <strong>If you switch tabs, minimize the window, exit full-screen, or leave this page, your examination will be automatically submitted immediately.</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyAccess} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Student Full Name *
              </label>
              <input
                id="cbt-student-name-input"
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter your registered full name"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-medium focus:outline-none focus:border-[#B81D22] bg-zinc-50/50"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Pre-filled from your student session; verify accuracy.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Student ID / Registration Number *
              </label>
              <input
                id="cbt-student-id-input"
                type="text"
                required
                value={formIdNumber}
                onChange={(e) => setFormIdNumber(e.target.value.toUpperCase())}
                placeholder="e.g. LC-STD-0089"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-mono font-bold focus:outline-none focus:border-[#B81D22] bg-zinc-50/50"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Institutional identifier assigned to your student profile.</p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-emerald-950 uppercase tracking-wide">
                  SuperAdmin / Admin Exam Access Code *
                </label>
                <span className="text-[10px] font-bold text-emerald-700">Required</span>
              </div>
              <input
                id="cbt-access-code-input"
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. CBT-84210"
                className="w-full px-4 py-3 rounded-xl border border-emerald-300 bg-white font-mono font-black text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Enter the official authorization access code issued by your Examination Invigilator or platform SuperAdmin for this session.
              </p>
            </div>

            <div className="pt-2">
              <button
                id="cbt-verify-submit-btn"
                type="submit"
                disabled={verifying}
                className="w-full py-3.5 rounded-2xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] transition-all shadow-lg shadow-red-900/15 disabled:opacity-50 cursor-pointer"
              >
                {verifying ? 'Validating Examination Credentials…' : 'Authenticate & Lock Screen into Exam Room →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 4. ACTIVE CBT EXAMINATION ROOM - LOCKED KIOSK MODE (NO SIDEBAR, NO NAVBAR)
  if (stage === 'exam' && activeExamInfo && activeQuestions.length > 0) {
    const currentQ = activeQuestions[currentQIndex];
    const isLastQ = currentQIndex === activeQuestions.length - 1;
    const answeredCount = Object.keys(answers).length;

    return (
      <div
        id="cbt-locked-exam-hall"
        className="fixed inset-0 z-[99999] w-screen h-screen bg-zinc-950 text-white flex flex-col overflow-hidden select-none"
        style={{ margin: 0, padding: 0 }}
      >
        {/* High-Security Top Control Bar */}
        <header className="px-5 py-3.5 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800/90 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B81D22] text-white flex items-center justify-center font-black text-sm shadow-md">
              CBT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 font-mono text-[10px] font-bold border border-zinc-700">
                  {activeExamInfo.courseCode}
                </span>
                <h2 className="font-black text-white text-sm sm:text-base tracking-tight">
                  {activeExamInfo.courseName}
                </h2>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Candidate: <span className="text-zinc-200 font-bold">{formName}</span> ({formIdNumber})
              </p>
            </div>
          </div>

          {/* Security Status Indicator & Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Screen Locked • Anti-Cheat Active</span>
            </div>

            {!isFullscreen && (
              <button
                type="button"
                onClick={requestFullscreenLock}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer animate-pulse"
                title="Click to re-engage full screen lock"
              >
                🔒 Lock Fullscreen
              </button>
            )}

            {/* Countdown Timer */}
            <div
              id="cbt-timer"
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono font-black text-base sm:text-lg ${
                timeLeft < 300
                  ? 'bg-red-950/80 text-red-400 border-red-500/60 animate-pulse'
                  : 'bg-zinc-800 text-zinc-100 border-zinc-700'
              }`}
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTimer(timeLeft)}</span>
            </div>

            {/* Submit Exam Button */}
            <button
              id="cbt-submit-exam-top-btn"
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Exam'}
            </button>
          </div>
        </header>

        {/* Security Warning Bar */}
        <div className="bg-red-950/70 border-b border-red-900/50 px-4 py-1.5 text-center text-[11px] text-red-200 font-medium flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          <span>
            Anti-Cheat Enforcement: Leaving this locked window, switching tabs, or exiting full-screen will trigger <strong>instant automatic submission</strong>.
          </span>
        </div>

        {/* Exam Body (Main Layout with Question Palette & Active Question) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
          <div className="max-w-4xl w-full space-y-5">
            {/* Question Navigator Palette */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2.5">
                <span className="font-bold text-zinc-200">Question Palette</span>
                <span id="cbt-answered-count" className="font-mono text-zinc-400">
                  {answeredCount} / {activeQuestions.length} Answered
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeQuestions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = idx === currentQIndex;
                  return (
                    <button
                      id={`cbt-palette-q-${idx + 1}`}
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-white text-zinc-950 ring-2 ring-white ring-offset-2 ring-offset-zinc-950'
                          : isAnswered
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Content Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span id="cbt-current-question-header" className="text-xs font-black text-red-400 uppercase tracking-wider">
                  Question {currentQIndex + 1} of {activeQuestions.length}
                </span>
                <span className="text-xs text-zinc-400 font-mono">Weight: 6.0 Points</span>
              </div>

              <h3 id="cbt-question-text" className="text-base sm:text-lg font-bold text-zinc-100 leading-relaxed">
                {currentQ.question}
              </h3>

              {/* Multiple Choice Options */}
              <div className="space-y-3 pt-2">
                {Object.entries(currentQ.options).map(([optKey, optText]) => {
                  const isSelected = answers[currentQ.id] === optKey;
                  return (
                    <button
                      id={`cbt-option-${optKey.toLowerCase()}`}
                      key={optKey}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, optKey)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'border-red-500 bg-red-950/40 shadow-md ring-1 ring-red-500/50'
                          : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected ? 'bg-[#B81D22] text-white shadow-sm' : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {optKey}
                      </span>
                      <span className="text-xs sm:text-sm text-zinc-200 font-medium pt-0.5 leading-relaxed">
                        {optText}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                <button
                  id="cbt-prev-btn"
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  &larr; Previous Question
                </button>

                {isLastQ ? (
                  <button
                    id="cbt-submit-exam-finish-btn"
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/20 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit & Finish Exam'}
                  </button>
                ) : (
                  <button
                    id="cbt-next-btn"
                    type="button"
                    onClick={() => setCurrentQIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                    className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-black hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    Next Question &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <footer className="px-6 py-2.5 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 shrink-0 font-mono">
          <span>Candidate: {formName}</span>
          <span className="hidden sm:inline">Kiosk Examination Mode • Tab switching &amp; window exit disabled</span>
          <span>{answeredCount}/{activeQuestions.length} Saved</span>
        </footer>

        {/* In-App Submission Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-white">
              <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center text-xl font-black mx-auto">
                !
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-white">Confirm Exam Submission</h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Are you ready to submit your exam? You have answered <strong>{answeredCount}</strong> of <strong>{activeQuestions.length}</strong> questions.
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Once submitted, your answers will be compiled into an official PDF Answer Script and delivered to your course teacher for manual evaluation. Scores will only be published after your teacher marks and uploads the results.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="cbt-cancel-submit-modal-btn"
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-bold text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                >
                  Continue Test
                </button>
                <button
                  id="cbt-confirm-submit-modal-btn"
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleAutoSubmit('Manual Candidate Submission');
                  }}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] disabled:opacity-50 cursor-pointer shadow-md shadow-red-900/20"
                >
                  {submitting ? 'Submitting…' : 'Yes, Submit Exam'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. EXAM COMPLETION & AWAITING TEACHER MARKING DISPLAY (NO SYSTEM SCORES SHOWN)
  if (stage === 'result' && examResult) {
    const candidateName = examResult.candidate?.name || formName;
    const candidateId = examResult.candidate?.student_id_number || formIdNumber;
    const courseTitle = examResult.candidate?.course || activeExamInfo?.courseName || 'Examination Subject';

    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
            ✓
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Submitted &bull; Awaiting Teacher Marking
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-2.5 tracking-tight">
              Examination Submitted
            </h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
              Your answers have been securely compiled into an official Candidate Answer Script (PDF) and forwarded to your course teacher for manual evaluation and score upload.
            </p>
          </div>

          {/* Auto-Submit Notice (if triggered by anti-cheat exit) */}
          {autoSubmitReason && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left space-y-1">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>Security Notice: Automatic Submission Triggered</span>
              </div>
              <p className="text-xs text-red-700 font-medium">
                <strong>Trigger:</strong> {autoSubmitReason}
              </p>
              <p className="text-[11px] text-red-600/90 leading-relaxed">
                The locked examination session detected an exit attempt. In compliance with examination rules, your completed questions were immediately locked and submitted to your teacher for manual marking.
              </p>
            </div>
          )}

          {/* Candidate Submission Metadata */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 text-left space-y-3">
            <div className="border-b border-zinc-200 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Candidate Submission Slip</span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Transmitted to Teacher
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Candidate Name</span>
                <span className="font-bold text-zinc-900">{candidateName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Student ID Number</span>
                <span className="font-mono font-bold text-zinc-900">{candidateId}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Subject / Course</span>
                <span className="font-semibold text-zinc-800">{courseTitle}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-400 block">Submission Timestamp</span>
                <span className="text-zinc-700 font-mono text-[11px]">
                  {examResult.submittedAt ? new Date(examResult.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                </span>
              </div>
              <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-zinc-200/60">
                <span className="text-[11px] text-zinc-600 font-medium">Questions Completed</span>
                <span className="font-mono font-black text-xs text-zinc-900 bg-white px-2.5 py-1 rounded-md border border-zinc-200">
                  {examResult.answeredCount} of {examResult.totalQuestions} Questions Answered
                </span>
              </div>
            </div>
          </div>

          {/* Teacher Evaluation Policy Explainer */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left flex items-start gap-3">
            <span className="text-xl">📋</span>
            <div className="text-[11px] text-amber-950 space-y-1">
              <p className="font-bold">Official Teacher Grading Protocol:</p>
              <p className="text-amber-900 leading-relaxed">
                In accordance with academic standards, student scores are <strong>not calculated automatically</strong> by this system. Your course teacher will download your submitted PDF answer script, mark each response manually, and upload the finalized marks. Your score, total marks, and terminal grade will appear under your <strong>Exam Results</strong> once uploaded by your teacher.
              </p>
            </div>
          </div>

          {/* Candidate PDF Script Download */}
          {examResult.pdfUrl && (
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#B81D22] flex items-center justify-center text-lg font-bold shrink-0">
                  📄
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Candidate Answer Script (PDF)</h4>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {examResult.pdfFilename || 'cbt_candidate_script.pdf'}
                  </p>
                </div>
              </div>
              <a
                id="cbt-download-script-pdf-btn"
                href={examResult.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 hover:bg-[#B81D22] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Script PDF</span>
              </a>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              id="cbt-view-results-slip-btn"
              href="/student/results"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm text-center"
            >
              Go to Exam Results &rarr;
            </Link>
            <button
              id="cbt-return-to-portal-btn"
              type="button"
              onClick={() => {
                setStage('list');
                loadExamList();
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 cursor-pointer"
            >
              Return to CBT Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
