'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { getGeneralSettings, updateGeneralSettings, GeneralSettingsData } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

function SettingsForm({
  settings,
  onReload,
}: {
  settings: GeneralSettingsData;
  onReload: () => void;
}) {
  const [minAttendance, setMinAttendance] = useState(settings.academic.minAttendanceThreshold);
  const [maxCredits, setMaxCredits] = useState(settings.academic.maxCourseLoadCredits);
  const [gracePeriod, setGracePeriod] = useState(settings.financial.lateFeeGracePeriodDays);
  const [allowDrop, setAllowDrop] = useState(settings.academic.allowSelfCourseDrop);
  const [allowPartial, setAllowPartial] = useState(settings.financial.allowPartialFeePayments);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateGeneralSettings({
        minAttendanceThreshold: minAttendance,
        maxCourseLoadCredits: maxCredits,
        lateFeeGracePeriodDays: gracePeriod,
        allowSelfCourseDrop: allowDrop,
        allowPartialFeePayments: allowPartial,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Institutional Configuration</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Configure academic policies, grading schemes, fee collection rules, and notification defaults.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>Preferences updated and active across your school boundary!</span>
          <span className="text-emerald-600">&check;</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Academic Policy Section */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-base font-bold text-zinc-900">Academic & Course Regulations</h2>
            <p className="text-xs text-zinc-500">Grading scales and student course thresholds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Grading Scale (Fixed)</label>
              <input
                type="text"
                disabled
                value={settings.academic.gradingScale}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Minimum Passing Grade</label>
              <input
                type="text"
                disabled
                value={settings.academic.minimumPassGrade}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Mandatory Attendance Threshold (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={minAttendance}
                onChange={(e) => setMinAttendance(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Students below this rate are flagged for debarment.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Max Semester Course Credits</label>
              <input
                type="number"
                min={12}
                max={36}
                value={maxCredits}
                onChange={(e) => setMaxCredits(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Upper credit limit per student per semester.</p>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowDrop}
                onChange={(e) => setAllowDrop(e.target.checked)}
                className="rounded border-zinc-300 text-[#B81D22] focus:ring-[#B81D22]"
              />
              <span className="text-xs font-bold text-zinc-800">Allow self-service course dropping within Add/Drop period</span>
            </label>
          </div>
        </div>

        {/* Financial Rules Section */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-base font-bold text-zinc-900">Financial & Fee Collection Rules</h2>
            <p className="text-xs text-zinc-500">Grace periods, payment structures, and billing rules.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Billing Currency</label>
              <input
                type="text"
                disabled
                value={settings.financial.currency}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Late Fee Grace Period (Days)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Number of days before unpaid fees incur penalty.</p>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPartial}
                onChange={(e) => setAllowPartial(e.target.checked)}
                className="rounded border-zinc-300 text-[#B81D22] focus:ring-[#B81D22]"
              />
              <span className="text-xs font-bold text-zinc-800">Enable partial installment payments for students</span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onReload}
            className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50"
          >
            Reset Changes
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminGeneralSettingsPage() {
  const { data, loading, error, reload } = useAsync((signal) => getGeneralSettings(signal), []);

  if (loading) {
    return <LoadingBlock rows={6} label="Loading institutional settings" />;
  }

  if (error || !data) {
    return <ErrorBlock message={error ?? 'Failed to load settings.'} onRetry={reload} />;
  }

  return <SettingsForm key={JSON.stringify(data)} settings={data} onReload={reload} />;
}
