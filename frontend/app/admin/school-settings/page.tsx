'use client';

import React, { useEffect, useState } from 'react';
import { getSchoolSettings, updateSchoolSettings, type SchoolProfile } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';
import { LoadingBlock } from '@/modules/superadmin/components/LoadState';

export default function AdminSchoolSettingsPage() {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [form, setForm] = useState<Partial<SchoolProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

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

  if (loading) {
    return <LoadingBlock rows={6} label="Loading school settings" />;
  }

  if (!profile) {
    return <p className="text-sm text-red-700">{message || 'School settings are unavailable.'}</p>;
  }

  const field = (key: keyof SchoolProfile, label: string, type: string = 'text') => (
    <div>
      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={(form[key] as string) ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white"
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await updateSchoolSettings({
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
      setMessage('Saved.');
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof ApiError ? err.message : 'Could not save these changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-2 border-b border-zinc-200">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">School Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          {profile.name} &middot; {profile.code} &middot; capacity ceilings are managed by the platform operator
        </p>
      </div>

      {message && (
        <div className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('contactEmail', 'Contact Email', 'email')}
          {field('contactPhone', 'Contact Phone')}
          {field('address', 'Address')}
          {field('city', 'City')}
          {field('state', 'State / Region')}
          {field('country', 'Country')}
          {field('academicYearCurrent', 'Current Academic Year')}
          {field('timezone', 'Timezone')}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-[#B81D22] text-white text-sm font-bold hover:bg-[#9E1519] transition-colors shadow-md shadow-red-900/10 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}
