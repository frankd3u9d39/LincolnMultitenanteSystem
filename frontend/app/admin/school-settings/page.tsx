'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  getSchoolSettings,
  updateSchoolSettings,
  uploadSchoolLogo,
  deleteSchoolLogo,
  type SchoolProfile,
} from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';
import { LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { resolveSchoolLogoUrl } from '@/constants/branding';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function AdminSchoolSettingsPage() {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [form, setForm] = useState<Partial<SchoolProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Logo state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoRemoving, setLogoRemoving] = useState(false);

  useEffect(() => {
    getSchoolSettings()
      .then((data) => {
        setProfile(data);
        setForm(data);
      })
      .catch((err) => {
        setMessage(err instanceof ApiError ? err.message : 'Could not load school settings.');
        setIsError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setIsError(true);
      setMessage('Logo file size must not exceed 5MB.');
      return;
    }

    setLogoUploading(true);
    setMessage('');
    try {
      const res = await uploadSchoolLogo(file);
      const newLogoUrl = res.data.logoUrl;
      setProfile((prev) => (prev ? { ...prev, logoUrl: newLogoUrl } : null));
      setForm((prev) => ({ ...prev, logoUrl: newLogoUrl }));
      setIsError(false);
      setMessage('School logo uploaded successfully.');
      await refreshUser();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof ApiError ? err.message : 'Failed to upload school logo.');
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the school logo?')) return;

    setLogoRemoving(true);
    setMessage('');
    try {
      await deleteSchoolLogo();
      setProfile((prev) => (prev ? { ...prev, logoUrl: null } : null));
      setForm((prev) => ({ ...prev, logoUrl: null }));
      setIsError(false);
      setMessage('School logo removed.');
      await refreshUser();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof ApiError ? err.message : 'Failed to remove school logo.');
    } finally {
      setLogoRemoving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const updated = await updateSchoolSettings({
        name: form.name ?? undefined,
        motto: form.motto ?? undefined,
        contactEmail: form.contactEmail ?? undefined,
        contactPhone: form.contactPhone,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        academicYearCurrent: form.academicYearCurrent,
        timezone: form.timezone,
      });
      setProfile(updated);
      setForm(updated);
      setIsError(false);
      setMessage('School profile updated successfully. Changes are now live across all dashboards.');
      await refreshUser();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof ApiError ? err.message : 'Could not save these changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingBlock rows={6} label="Loading school settings" />;
  }

  if (!profile) {
    return <p className="text-sm text-red-700">{message || 'School settings are unavailable.'}</p>;
  }

  const currentLogoSrc = resolveSchoolLogoUrl(form.logoUrl ?? profile.logoUrl);

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-200">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">School Profile & Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Manage your institution&apos;s identity, official motto, contact details, and school crest. Updates reflect instantly across all student, teacher, and administrative portals.
        </p>
      </div>

      {/* Status banner */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
            isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{isError ? '⚠️' : '✅'}</span>
          <span>{message}</span>
        </div>
      )}

      {/* Live Preview Card */}
      <div className="rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6 shadow-xl border border-zinc-800">
        <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-3">Live Header Preview</p>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative w-20 h-20 rounded-2xl bg-white p-2 flex-shrink-0 shadow-md flex items-center justify-center">
            <Image
              src={currentLogoSrc}
              alt={form.name || 'School Crest'}
              width={72}
              height={72}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                {form.name || profile.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider border border-white/10">
                {profile.code}
              </span>
            </div>
            <p className="text-sm text-zinc-300 italic font-serif leading-relaxed">
              &ldquo;{form.motto || 'Knowledge, Integrity & Excellence'}&rdquo;
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-zinc-400 pt-1">
              {form.address && <span>📍 {form.address}</span>}
              {form.contactEmail && <span>✉️ {form.contactEmail}</span>}
              {form.contactPhone && <span>📞 {form.contactPhone}</span>}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Logo & Crest */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Institutional Crest & Logo</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Upload a high-resolution PNG or SVG logo. Displayed on dashboards, navigation bars, and PDF report cards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="relative w-24 h-24 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 p-2 flex items-center justify-center shadow-inner">
              <Image
                src={currentLogoSrc}
                alt="Current Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoSelect}
                className="hidden"
                id="school-logo-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm disabled:opacity-50"
              >
                {logoUploading ? 'Uploading...' : 'Upload New Logo'}
              </button>

              {(form.logoUrl || profile.logoUrl) && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={logoRemoving}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  {logoRemoving ? 'Removing...' : 'Remove Logo'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: School Identity */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Institution Identity</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Your official institution name and motto as they appear across the entire portal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Lincoln High School"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                School Motto / Slogan
              </label>
              <input
                type="text"
                value={form.motto ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, motto: e.target.value }))}
                placeholder="e.g. Excellence Through Knowledge & Integrity"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all font-medium"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Appears on PDF report cards, login screens, and portal banners.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Contact & Location */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Contact & Address</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Official school contact channels and physical address printed on report cards and documents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={form.contactEmail ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                placeholder="admin@school.edu.ng"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={form.contactPhone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Physical Address
              </label>
              <input
                type="text"
                value={form.address ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="e.g. Plot 104, Education District Avenue"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                value={form.city ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Abuja"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                State / Region
              </label>
              <input
                type="text"
                value={form.state ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                placeholder="e.g. FCT"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={form.country ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="e.g. Nigeria"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Current Academic Year
              </label>
              <input
                type="text"
                value={form.academicYearCurrent ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, academicYearCurrent: e.target.value }))}
                placeholder="e.g. 2025/2026"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <input
                type="text"
                value={form.timezone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                placeholder="e.g. Africa/Lagos"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 4: System Information (Read-only) */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-7 space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Subscription & Platform Ceilings</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              These quotas are provisioned and managed by the SuperAdmin platform operator.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80">
              <p className="text-[10px] font-bold uppercase text-zinc-400">School Code</p>
              <p className="text-sm font-black text-zinc-900 mt-0.5">{profile.code}</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Account Status</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700">
                {profile.status}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Max Students</p>
              <p className="text-sm font-black text-zinc-900 mt-0.5">{profile.maxStudents}</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Max Teachers</p>
              <p className="text-sm font-black text-zinc-900 mt-0.5">{profile.maxTeachers}</p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-[#B81D22] text-white text-sm font-bold hover:bg-[#9E1519] transition-all shadow-lg shadow-red-900/20 disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save School Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
