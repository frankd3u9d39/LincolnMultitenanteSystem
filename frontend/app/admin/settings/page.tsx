'use client';

import React, { useRef, useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import {
  getGeneralSettings,
  updateGeneralSettings,
  uploadSchoolLogo,
  deleteSchoolLogo,
  GeneralSettingsData,
} from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';
import { COLOR_PALETTES, ColorPalettePreset, resolveSchoolLogoUrl } from '@/constants/branding';
import { SchoolBrandingPreview } from '@/components/branding/SchoolBrandingPreview';
import { useAuth } from '@/lib/auth/AuthProvider';

function SettingsForm({
  settings,
  onReload,
}: {
  settings: GeneralSettingsData;
  onReload: () => void;
}) {
  const { refreshUser, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Portal Branding State
  const [logoUrl, setLogoUrl] = useState<string | null>(settings.portalBranding?.logoUrl ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    settings.portalBranding?.logoUrl ? resolveSchoolLogoUrl(settings.portalBranding.logoUrl) : null
  );
  const [primaryColor, setPrimaryColor] = useState(settings.portalBranding?.primaryColor ?? '#B81D22');
  const [secondaryColor, setSecondaryColor] = useState(settings.portalBranding?.secondaryColor ?? '#9E1519');
  const [accentColor, setAccentColor] = useState(settings.portalBranding?.accentColor ?? '#B81D22');
  const [themePalette, setThemePalette] = useState(settings.portalBranding?.themePalette ?? 'crimson');

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoRemoving, setLogoRemoving] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Academic & Financial State
  const [minAttendance, setMinAttendance] = useState(settings.academic.minAttendanceThreshold);
  const [maxCredits, setMaxCredits] = useState(settings.academic.maxCourseLoadCredits);
  const [gracePeriod, setGracePeriod] = useState(settings.financial.lateFeeGracePeriodDays);
  const [allowDrop, setAllowDrop] = useState(settings.academic.allowSelfCourseDrop);
  const [allowPartial, setAllowPartial] = useState(settings.financial.allowPartialFeePayments);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setLogoFeedback({ type: 'error', message: 'Logo file size must not exceed 5MB.' });
      return;
    }
    setLogoFeedback(null);
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadLogoNow = async () => {
    if (!logoFile) return;
    setLogoUploading(true);
    setLogoFeedback(null);
    try {
      const res = await uploadSchoolLogo(logoFile);
      setLogoUrl(res.data.logoUrl);
      setLogoPreviewUrl(resolveSchoolLogoUrl(res.data.logoUrl));
      setLogoFile(null);
      setLogoFeedback({ type: 'success', message: 'School logo uploaded and activated successfully!' });
      await refreshUser();
      setTimeout(() => setLogoFeedback(null), 4000);
    } catch (err: any) {
      setLogoFeedback({
        type: 'error',
        message: err instanceof ApiError ? (err.fieldError('logo') || err.message) : 'Failed to upload logo.',
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm('Reset school logo to the default Lincoln branding?')) return;
    setLogoRemoving(true);
    setLogoFeedback(null);
    try {
      await deleteSchoolLogo();
      setLogoUrl(null);
      setLogoPreviewUrl(null);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLogoFeedback({ type: 'success', message: 'Custom logo removed. Default branding restored.' });
      await refreshUser();
      setTimeout(() => setLogoFeedback(null), 4000);
    } catch (err: any) {
      setLogoFeedback({ type: 'error', message: err instanceof ApiError ? err.message : 'Failed to remove logo.' });
    } finally {
      setLogoRemoving(false);
    }
  };

  const handleSelectPalette = (preset: ColorPalettePreset) => {
    setThemePalette(preset.id);
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    updateUser({
      schoolTheme: {
        primaryColor: preset.primary,
        secondaryColor: preset.secondary,
        accentColor: preset.accent,
        themePalette: preset.id,
      },
    });
  };

  const handleCustomColor = (color: string) => {
    setThemePalette('custom');
    setPrimaryColor(color);
    setSecondaryColor(color);
    setAccentColor(color);
    updateUser({
      schoolTheme: {
        primaryColor: color,
        secondaryColor: color,
        accentColor: color,
        themePalette: 'custom',
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      let currentLogoUrl = logoUrl;
      if (logoFile) {
        const res = await uploadSchoolLogo(logoFile);
        currentLogoUrl = res.data.logoUrl;
        setLogoUrl(currentLogoUrl);
        setLogoPreviewUrl(resolveSchoolLogoUrl(currentLogoUrl));
        setLogoFile(null);
      }

      await updateGeneralSettings({
        minAttendanceThreshold: minAttendance,
        maxCourseLoadCredits: maxCredits,
        lateFeeGracePeriodDays: gracePeriod,
        allowSelfCourseDrop: allowDrop,
        allowPartialFeePayments: allowPartial,
        primaryColor,
        secondaryColor,
        accentColor,
        themePalette,
        logoUrl: currentLogoUrl ?? undefined,
      });

      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err: any) {
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
            Customize your school logo, portal dashboard color palette, academic policies, and financial rules.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <span>School branding and institutional preferences updated successfully! Changes reflect across all dashboards.</span>
          <span className="text-emerald-600 font-black">&check;</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Identity & Dashboard Branding */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">School Identity & Dashboard Theme</h2>
                <span
                  className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Live Theme
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Upload your official school logo and select your signature color theme. These choices apply across all Admin, Teacher, and Student portals.
              </p>
            </div>
          </div>

          {/* Real-time Header Banner Mockup */}
          <SchoolBrandingPreview
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoPreviewUrl={logoPreviewUrl}
            schoolName={settings.portalBranding?.schoolName || 'Lincoln College'}
            badgeCode={settings.portalBranding?.campusCode ? settings.portalBranding.campusCode.split('-')[0] : 'SMTS'}
            subtitle="Live Dashboard Header Preview"
          />

          {logoFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                logoFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span>{logoFeedback.message}</span>
              <button
                type="button"
                onClick={() => setLogoFeedback(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100"
              >
                &times;
              </button>
            </div>
          )}

          {/* Logo Upload & Controls */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">Official School Crest / Logo</label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-400 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shrink-0 border border-zinc-200 shadow-xs overflow-hidden">
                  {logoPreviewUrl ? (
                    <img src={logoPreviewUrl} alt="School Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl">🏫</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-800 truncate">
                    {logoFile ? logoFile.name : logoUrl ? 'Custom School Logo Active' : 'Default Lincoln Crest Active'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Click to browse files (PNG, JPG, SVG, WebP up to 5MB). Transparent background recommended.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoSelect}
                className="hidden"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {logoFile && (
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={handleUploadLogoNow}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoUploading ? 'Uploading...' : 'Apply Logo Now'}
                  </button>
                )}

                {(logoUrl || logoFile) && (
                  <button
                    type="button"
                    disabled={logoRemoving}
                    onClick={handleDeleteLogo}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 text-xs font-semibold text-red-600 bg-white rounded-xl border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {logoRemoving ? 'Resetting...' : 'Reset to Default'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Dashboard Color Palette</label>
            <p className="text-[11px] text-zinc-500 mb-2.5">
              Choose an institutional palette or enter a custom hex color code. This theme skins all workspaces in your school:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COLOR_PALETTES.filter((p) => p.id !== 'custom').map((palette) => {
                const isSelected = themePalette === palette.id;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => handleSelectPalette(palette)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-zinc-900 bg-white ring-2 ring-zinc-900/10 shadow-xs'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-black/10"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-zinc-800 block truncate">
                        {palette.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Selector */}
            <div className="mt-3 flex items-center gap-3 bg-zinc-50/60 p-3 rounded-xl border border-zinc-200">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => handleCustomColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-zinc-800 block">Custom Institutional Color</span>
                <span className="text-[11px] text-zinc-400 font-mono">{primaryColor.toUpperCase()}</span>
              </div>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => handleCustomColor(e.target.value)}
                placeholder="#B81D22"
                className="w-28 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-zinc-200 text-center uppercase bg-white focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

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
            onClick={async () => {
              await refreshUser();
              onReload();
            }}
            className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50"
          >
            Reset Changes
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
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
