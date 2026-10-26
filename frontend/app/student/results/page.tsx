'use client';

import React, { useState, useEffect } from 'react';
import { getResults, type ResultsReport, type PupilPerformanceReport } from '@/modules/student/services/api';

export default function StudentResultsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [data, setData] = useState<ResultsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchResults = (term?: string) => {
    setLoading(true);
    setError(null);
    getResults(term)
      .then((res) => {
        setData(res);
        if (res.report?.selected_term && !selectedTerm) {
          setSelectedTerm(res.report.selected_term);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load results.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (mounted) {
      fetchResults(selectedTerm || undefined);
    }
  }, [mounted, selectedTerm]);

  if (!mounted || (loading && !data)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-3 border-zinc-200 border-t-[#0284C7] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-zinc-500">Loading your official performance report...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3 max-w-lg mx-auto my-12">
        <p className="text-sm font-bold text-red-900">{error}</p>
        <button
          onClick={() => fetchResults(selectedTerm || undefined)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const report: PupilPerformanceReport | undefined = data?.report;
  const termsList = report?.available_terms || (data?.history ? data.history.map((h) => h.term) : []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. Official Portal Header & Term Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Academic Performance Report
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
              Verified
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Automated term report card compiled from Continuous Assessment (C.A 1, C.A 2) and Terminal Examinations.
          </p>
        </div>

        {/* Term Switcher */}
        {termsList.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-600 whitespace-nowrap">Session / Term:</label>
            <select
              value={selectedTerm || report?.selected_term || ''}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="text-xs font-bold rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs"
            >
              {termsList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Official Administration Notice (Student cannot download; Admin only) */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs shadow-xs">
        <svg className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="space-y-0.5">
          <p className="font-bold text-amber-950">Official Institutional Transcript Notice</p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Per institutional examination guidelines, students can review their full report card directly on this portal. Stamped physical hardcopies and downloadable PDF transcripts are issued exclusively by the <strong>School Administration &amp; Registrar&apos;s Office</strong>.
          </p>
        </div>
      </div>

      {/* 3. PUPIL'S PERFORMANCE REPORT DOCUMENT (Matching Reference Document) */}
      <div className="bg-white border-2 border-zinc-300 rounded-2xl p-6 sm:p-10 shadow-lg text-zinc-900 font-sans space-y-6">
        
        {/* Document Header */}
        <div className="text-center space-y-1 pb-4 border-b border-zinc-200">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            {report?.school.name || 'Dukawuya Science Modal Primary School'}
          </h2>
          <p className="text-xs font-semibold text-zinc-600">
            MOTTO: {report?.school.motto || 'Education for Development'}
          </p>
          <p className="text-xs text-zinc-500">
            {report?.school.address || 'Dukawuya Opp. WTC Staff Quarters'}
          </p>
          <p className="text-[11px] text-zinc-400 font-mono">
            {report?.school.email || 'info@dukawuyaschools.edu.ng'} &bull; {report?.school.phone || '+234 803 123 4567'}
          </p>
          
          <div className="pt-3">
            <span className="inline-block px-4 py-1 text-sm font-black uppercase tracking-wider text-zinc-900 border-b-2 border-zinc-900">
              PUPIL&apos;S PERFORMANCE REPORT
            </span>
          </div>
        </div>

        {/* Pupil & Academic Meta Grid (2-Column Bordered Box) */}
        <div className="border border-zinc-300 rounded-xl overflow-hidden text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-300">
            {/* Left Column */}
            <div className="divide-y divide-zinc-200">
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Pupil&apos;s Name:</span>
                <span className="flex-1 px-3 py-2 font-semibold text-zinc-900 uppercase">{report?.meta.pupil_name || '—'}</span>
              </div>
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Admission No.:</span>
                <span className="flex-1 px-3 py-2 font-mono font-bold text-zinc-900">{report?.meta.admission_no || '—'}</span>
              </div>
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Class Name:</span>
                <span className="flex-1 px-3 py-2 font-semibold text-zinc-900 uppercase">{report?.meta.class_name || '—'}</span>
              </div>
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Academic Session:</span>
                <span className="flex-1 px-3 py-2 font-semibold text-zinc-900">{report?.meta.academic_session || '—'}</span>
              </div>
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Class Population:</span>
                <span className="flex-1 px-3 py-2 font-bold text-zinc-900">{report?.meta.class_population ?? '—'}</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="divide-y divide-zinc-200">
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Final Grade:</span>
                <span className="flex-1 px-3 py-2 font-black text-sm text-[#0284C7]">{report?.meta.final_grade || '—'}</span>
              </div>
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Final Position:</span>
                <span className="flex-1 px-3 py-2 font-black text-sm text-[#0284C7]">{report?.meta.final_position || '—'}</span>
              </div>
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Final Average:</span>
                <span className="flex-1 px-3 py-2 font-black text-zinc-900">{report?.meta.final_average !== undefined ? `${report.meta.final_average}%` : '—'}</span>
              </div>
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Class Average:</span>
                <span className="flex-1 px-3 py-2 font-bold text-zinc-800">{report?.meta.class_average !== undefined ? `${report.meta.class_average}%` : '—'}</span>
              </div>
              <div className="flex">
                <span className="w-36 px-3 py-2 font-bold text-zinc-700 bg-zinc-50/70 border-r border-zinc-200">Highest Avg.:</span>
                <span className="flex-1 px-3 py-2 font-bold text-emerald-700">{report?.meta.highest_average !== undefined ? `${report.meta.highest_average}%` : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Subject Results Table with Blue Header (#0284C7) */}
        <div className="overflow-x-auto rounded-xl border border-zinc-300">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0284C7] text-white font-black text-[11px] uppercase tracking-wider divide-x divide-sky-600">
                <th className="py-3 px-3.5">Subject</th>
                <th className="py-3 px-2 text-center whitespace-nowrap">
                  <div>C.A 1</div>
                  <div className="text-[9px] font-medium opacity-90">(20%)</div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap">
                  <div>C.A 2</div>
                  <div className="text-[9px] font-medium opacity-90">(20%)</div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap">
                  <div>Exam</div>
                  <div className="text-[9px] font-medium opacity-90">(60%)</div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap">
                  <div>Total</div>
                  <div className="text-[9px] font-medium opacity-90">(100%)</div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap">Grade</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {report?.subjects && report.subjects.length > 0 ? (
                report.subjects.map((sub, idx) => (
                  <tr key={sub.id} className={idx % 2 === 1 ? 'bg-zinc-50/60' : 'bg-white'}>
                    <td className="py-2.5 px-3.5 font-bold text-zinc-900 uppercase">
                      {sub.name}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold">
                      {sub.ca1 !== null ? sub.ca1 : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold">
                      {sub.ca2 !== null ? sub.ca2 : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold">
                      {sub.exam !== null ? sub.exam : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-black text-zinc-900">
                      {sub.total !== null ? `${sub.total}` : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-black">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                        sub.grade === 'A' ? 'text-emerald-800 bg-emerald-50' :
                        sub.grade === 'B' ? 'text-blue-800 bg-blue-50' :
                        sub.grade === 'C' ? 'text-amber-800 bg-amber-50' :
                        sub.grade === 'D' ? 'text-orange-800 bg-orange-50' :
                        'text-red-800 bg-red-50'
                      }`}>
                        {sub.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-[11px] text-zinc-700">
                      {sub.remark}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400 italic">
                    No examination records published for this session yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Grade Details Line */}
        <div className="text-[10px] sm:text-[11px] text-zinc-600 font-semibold bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
          <p className="leading-relaxed">
            <strong className="text-zinc-800">GRADE DETAILS:</strong> A =&gt; 70% and above =&gt; Excellent; B =&gt; 60.0% - 70.0% =&gt; Very Good; C =&gt; 50.0% - 60.0% =&gt; Good; D =&gt; 40.0% - 50.0% =&gt; Pass; E =&gt; 30.0% - 40.0% =&gt; Fail; F =&gt; 0.0% - 30.0% =&gt; Fail. <span className="font-bold ml-2">NO. OF SUBJECTS: {report?.subjects.length || 0}</span>
          </p>
        </div>

        {/* Behavioral Assessment Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-zinc-300 rounded-xl p-3 text-[11px]">
          {/* Table 1: Personal & Social */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <div className="bg-zinc-100 font-bold px-2.5 py-1.5 border-b border-zinc-200 text-zinc-700">
              Personal &amp; Social Development
            </div>
            <table className="w-full divide-y divide-zinc-200">
              <tbody>
                {report?.behavioral_traits.personal_social.map((t, i) => (
                  <tr key={i} className="hover:bg-zinc-50">
                    <td className="px-2.5 py-1 text-zinc-800 font-medium">{t.name}</td>
                    <td className="px-2.5 py-1 text-center font-bold font-mono text-[#0284C7] w-12 border-l border-zinc-200">
                      {t.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table 2: Practical Skills */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <div className="bg-zinc-100 font-bold px-2.5 py-1.5 border-b border-zinc-200 text-zinc-700">
              Practical &amp; Psychomotor Abilities
            </div>
            <table className="w-full divide-y divide-zinc-200">
              <tbody>
                {report?.behavioral_traits.practical_skills.map((t, i) => (
                  <tr key={i} className="hover:bg-zinc-50">
                    <td className="px-2.5 py-1 text-zinc-800 font-medium">{t.name}</td>
                    <td className="px-2.5 py-1 text-center font-bold font-mono text-[#0284C7] w-12 border-l border-zinc-200">
                      {t.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table 3: Rating Scale */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-zinc-100 font-bold px-2.5 py-1.5 border-b border-zinc-200 text-zinc-700">
              Assessment Rating Scale
            </div>
            <div className="p-2.5 space-y-1.5 flex-1 text-zinc-700 text-xs font-medium">
              {report?.behavioral_traits.rating_scale &&
                Object.entries(report.behavioral_traits.rating_scale).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-6 h-5 rounded bg-sky-50 text-[#0284C7] font-bold text-center text-xs leading-5 border border-sky-200">
                      {k}
                    </span>
                    <span>&mdash; {v}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Comments & Endorsements */}
        <div className="space-y-4 pt-2 text-xs">
          <div>
            <h4 className="font-bold text-zinc-900 mb-0.5">Comment:</h4>
            <p className="text-zinc-700 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-200 font-medium">
              {report?.comments.principal_comment || 'Very good performance, keep it up.'}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-zinc-900 mb-0.5">Class Teacher&apos;s Comment:</h4>
            <p className="text-zinc-700 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-200 font-medium">
              {report?.comments.teacher_comment || 'Nice performance, you should be proud of yourself.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200">
            <div>
              <p className="text-zinc-500 font-bold text-[11px]">Form Teacher&apos;s Name:</p>
              <p className="text-zinc-900 font-black text-sm uppercase mt-0.5">
                {report?.comments.form_teacher_name || 'ASIYA MUHAMMAD IDRIS'}
              </p>
            </div>

            <div>
              <p className="text-zinc-500 font-bold text-[11px]">Next Term Begins:</p>
              <p className="text-zinc-900 font-bold text-sm mt-0.5">
                {report?.comments.next_term_begins || 'Monday, May 4th, 2026'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-dashed border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-500 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Status: <strong className="text-zinc-800">Electronically Verified &amp; Endorsed</strong></span>
            </div>
            <div>
              <span>Signature &amp; Stamp: </span>
              <strong className="text-zinc-800">[Official Institutional Seal]</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
