'use client';

import React, { useEffect, useState } from 'react';
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
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

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

  const handleSelectOption = (questionId: number, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleAutoSubmit = () => {
    if (activeExamInfo) {
      submitExam(activeExamInfo.id);
    }
  };

  const submitExam = async (examId: number) => {
    setSubmitting(true);
    try {
      const resp = await submitCbtExam({
        exam_id: examId,
        answers,
      });
      setExamResult(resp.result);
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
              <span className="font-bold text-white block mb-0.5">2. Enter Identity &amp; Code</span>
              <p className="text-[11px] text-zinc-400">Verify your Name, Student ID, and the Exam Access Code provided by your invigilator.</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-bold text-white block mb-0.5">3. Complete &amp; Submit</span>
              <p className="text-[11px] text-zinc-400">Answer multiple-choice questions before the timer expires. Scores are saved instantly.</p>
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
                      <Link
                        href="/student/results"
                        className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-bold transition-all shadow-sm block text-center"
                      >
                        View Graded Result &rarr;
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenVerify(exam)}
                        className="px-5 py-2.5 rounded-xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 flex items-center gap-2 w-full sm:w-auto justify-center"
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
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{verifyError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyAccess} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Student Full Name *
              </label>
              <input
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
                type="submit"
                disabled={verifying}
                className="w-full py-3.5 rounded-2xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] transition-all shadow-lg shadow-red-900/15 disabled:opacity-50"
              >
                {verifying ? 'Validating Examination Credentials…' : 'Authenticate & Unlock Exam Room →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 4. ACTIVE CBT EXAMINATION ROOM
  if (stage === 'exam' && activeExamInfo && activeQuestions.length > 0) {
    const currentQ = activeQuestions[currentQIndex];
    const isLastQ = currentQIndex === activeQuestions.length - 1;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Control Bar with Countdown Timer */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-900 font-mono text-[10px] font-bold">
                {activeExamInfo.courseCode}
              </span>
              <h2 className="font-black text-zinc-900 text-base">{activeExamInfo.courseName}</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Candidate: <strong>{formName}</strong> ({formIdNumber})
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono font-black text-lg ${
              timeLeft < 300
                ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                : 'bg-zinc-50 text-zinc-900 border-zinc-200'
            }`}>
              <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you ready to submit your exam? You have answered ${answeredCount} of ${activeQuestions.length} questions.`)) {
                  handleAutoSubmit();
                }
              }}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10"
            >
              {submitting ? 'Submitting…' : 'Submit Exam'}
            </button>
          </div>
        </div>

        {/* Question Navigator Pills */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-bold">Question Palette</span>
            <span>
              {answeredCount} / {activeQuestions.length} Answered
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeQuestions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentQIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-2'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Question Display */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <span className="text-xs font-black text-[#B81D22] uppercase tracking-wider">
              Question {currentQIndex + 1} of {activeQuestions.length}
            </span>
            <span className="text-xs text-zinc-400 font-mono">Weight: 6.0 Points</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-relaxed">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {Object.entries(currentQ.options).map(([optKey, optText]) => {
              const isSelected = answers[currentQ.id] === optKey;
              return (
                <button
                  key={optKey}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, optKey)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'border-[#B81D22] bg-red-50/50 shadow-sm'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isSelected ? 'bg-[#B81D22] text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}>
                    {optKey}
                  </span>
                  <span className="text-xs sm:text-sm text-zinc-800 font-medium pt-0.5 leading-relaxed">
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
            <button
              type="button"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50 disabled:opacity-40 transition-colors"
            >
              &larr; Previous Question
            </button>

            {isLastQ ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Submit your exam? You answered ${answeredCount} of ${activeQuestions.length} questions.`)) {
                    handleAutoSubmit();
                  }
                }}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10"
              >
                {submitting ? 'Submitting…' : 'Submit & Finish Exam'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentQIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                Next Question &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 5. EXAM COMPLETION & RESULT DISPLAY
  if (stage === 'result' && examResult) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              CBT Examination Completed
            </span>
            <h2 className="text-2xl font-black text-zinc-900 mt-2">
              Results Submitted Successfully
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Your test has been graded and recorded in your school academic dossier.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Exam Score</span>
              <span className="text-2xl font-black text-zinc-900">{examResult.examScore} / {examResult.examMax}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Total Score (CA + Exam)</span>
              <span className="text-2xl font-black text-[#B81D22]">{examResult.totalScore}%</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Grade Assigned</span>
              <span className="text-xl font-black text-emerald-700">{examResult.grade}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Academic Standing</span>
              <span className="text-sm font-bold text-zinc-700">{examResult.remark}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/student/results"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#B81D22] text-white text-xs font-black hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 text-center"
            >
              View Full Exam Results Slip &rarr;
            </Link>
            <button
              type="button"
              onClick={() => {
                setStage('list');
                loadExamList();
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-700 text-xs font-bold hover:bg-zinc-50"
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
