'use client';

import React from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { getSchoolReports } from '@/modules/admin/services/api';

export default function AdminReportsPage() {
  const { data, loading, error, reload } = useAsync((signal) => getSchoolReports(signal), []);

  if (loading) {
    return <LoadingBlock rows={6} label="Generating institutional intelligence report" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to generate school reports.'} onRetry={reload} />;
  }

  const { kpis, enrollmentTrend, departmentBreakdown, generatedAt } = data;

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Department,Students,Courses,Faculty,Budget Utilization']
        .concat(departmentBreakdown.map((d) => `"${d.name}",${d.students},${d.courses},${d.faculty},${d.budgetUtilization}`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lincoln_School_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Institutional Intelligence & Reports</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Holistic institutional report across admissions, financials, attendance, and departmental capacity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-mono">Generated {generatedAt}</span>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10"
          >
            Export CSV Dataset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Total Enrollment</p>
          <p className="text-3xl font-black tracking-tight text-zinc-900">{kpis.totalEnrollment}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Active student body</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Fee Recovery</p>
          <p className="text-3xl font-black tracking-tight text-emerald-600">{kpis.feeCollectionRate}</p>
          <p className="text-[10px] text-zinc-400 mt-2">{kpis.totalRevenue} collected</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Staff-Student Ratio</p>
          <p className="text-3xl font-black tracking-tight text-blue-600">{kpis.facultyRatio}</p>
          <p className="text-[10px] text-zinc-400 mt-2">{kpis.totalFaculty} professors & teachers</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Retention Rate</p>
          <p className="text-3xl font-black tracking-tight text-purple-600">{kpis.courseRetentionRate}</p>
          <p className="text-[10px] text-zinc-400 mt-2">Term-to-term persistence</p>
        </div>
      </div>

      {/* Enrollment & Revenue Growth Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Enrollment & Revenue Trajectory (Last 6 Months)</h2>
            <p className="text-xs text-zinc-500">Monthly student admissions alongside fee collections.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {enrollmentTrend.map((m) => (
            <div key={m.month} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 text-center">
              <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">{m.month}</span>
              <p className="text-lg font-black text-zinc-900 mt-1">{m.students}</p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">₦{(m.revenue / 1000).toFixed(0)}k</p>
            </div>
          ))}
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Departmental Operations Breakdown</h2>
          <p className="text-xs text-zinc-500">Student cohort size, active modules, and faculty resource allocation.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Department / Faculty</th>
                <th className="py-3 px-4 text-center">Active Students</th>
                <th className="py-3 px-4 text-center">Syllabus Courses</th>
                <th className="py-3 px-4 text-center">Faculty Assigned</th>
                <th className="py-3 px-4 text-center">Budget Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {departmentBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                    No departmental data recorded yet in the database. Create courses with assigned departments to see breakdowns.
                  </td>
                </tr>
              ) : (
                departmentBreakdown.map((dept) => (
                  <tr key={dept.name} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-900">{dept.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-zinc-800">{dept.students}</td>
                    <td className="py-3 px-4 text-center text-zinc-600">{dept.courses}</td>
                    <td className="py-3 px-4 text-center text-zinc-600">{dept.faculty}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">{dept.budgetUtilization}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
