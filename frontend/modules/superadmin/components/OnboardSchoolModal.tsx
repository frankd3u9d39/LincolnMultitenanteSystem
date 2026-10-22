'use client';

import React, { useRef, useState, useEffect } from 'react';

import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';
import { DEFAULT_RESOURCE_LIMITS } from '../utils';
import { COLOR_PALETTES, ColorPalettePreset, getPalette } from '@/constants/branding';
import { SchoolBrandingPreview } from '@/components/branding/SchoolBrandingPreview';

export interface OnboardDraft {
  name: string;
  code: string;
  domain: string;
  city: string;
  storageQuotaGb: number;
  principalAdmin: string;
  principalEmail: string;
  password?: string;
  activateImmediately: boolean;
  cbtEnabled: boolean;
  logoFile?: File | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePalette: string;
}

interface OnboardSchoolModalProps {
  onClose: () => void;
  /** Resolves with field errors from the server when it rejects the draft, or nothing on success. */
  onProvision: (draft: OnboardDraft) => Promise<ProvisionErrors | void>;
  existingCodes: string[];
  existingDomains: string[];
  /** Used to suggest the next sequential tenant code. */
  nextSequence: number;
}

export type ProvisionErrors = Partial<Record<'name' | 'code' | 'domain' | 'city' | 'principalAdmin' | 'principalEmail' | 'password' | 'form', string>>;

type FieldErrors = ProvisionErrors;

/** Derives an acronym-style tenant code prefix from the school name. */
function suggestPrefix(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => word.length > 2);
  if (words.length === 0) return '';
  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function OnboardSchoolModal({
  onClose,
  onProvision,
  existingCodes,
  existingDomains,
  nextSequence,
}: OnboardSchoolModalProps) {
  const [draft, setDraft] = useState<OnboardDraft>({
    name: '',
    code: '',
    domain: '',
    city: '',
    storageQuotaGb: DEFAULT_RESOURCE_LIMITS.storageQuotaGb,
    principalAdmin: '',
    principalEmail: '',
    password: '',
    activateImmediately: true,
    cbtEnabled: false,
    logoFile: null,
    logoUrl: null,
    primaryColor: '#B81D22',
    secondaryColor: '#9E1519',
    accentColor: '#B81D22',
    themePalette: 'crimson',
  });
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [customHex, setCustomHex] = useState('#B81D22');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const update = <K extends keyof OnboardDraft>(key: K, value: OnboardDraft[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      // Keep the tenant code in step with the name until the operator edits it directly.
      if (key === 'name' && !codeTouched) {
        const prefix = suggestPrefix(String(value));
        next.code = prefix ? `${prefix}-SMTS-${String(nextSequence).padStart(3, '0')}` : '';
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, form: 'Logo image must be smaller than 5MB.' }));
        return;
      }
      update('logoFile', file);
      const url = URL.createObjectURL(file);
      setLogoPreviewUrl(url);
    }
  };

  const handleClearLogo = () => {
    update('logoFile', null);
    update('logoUrl', null);
    setLogoPreviewUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSelectPalette = (preset: ColorPalettePreset) => {
    update('themePalette', preset.id);
    update('primaryColor', preset.primary);
    update('secondaryColor', preset.secondary);
    update('accentColor', preset.accent);
  };

  const handleCustomColor = (color: string) => {
    setCustomHex(color);
    update('themePalette', 'custom');
    update('primaryColor', color);
    update('secondaryColor', color);
    update('accentColor', color);
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const code = draft.code.trim().toUpperCase();
    const domain = draft.domain.trim().toLowerCase();
    const email = draft.principalEmail.trim().toLowerCase();

    if (draft.name.trim().length < 4) next.name = 'Enter the full registered school name.';
    if (!/^[A-Z]{2,6}-SMTS-\d{3}$/.test(code)) next.code = 'Use the format ABC-SMTS-001.';
    else if (existingCodes.includes(code)) next.code = 'This tenant code is already allocated.';
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) next.domain = 'Enter a valid domain, e.g. school.edu.ng.';
    else if (existingDomains.includes(domain)) next.domain = 'This domain is bound to another tenant.';
    if (draft.city.trim().length < 2) next.city = 'Enter the campus city.';
    if (draft.principalAdmin.trim().length < 3) next.principalAdmin = 'Name the principal administrator.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.principalEmail = 'Enter a valid administrator email.';
    if (draft.password && draft.password.length < 8) next.password = 'Enter at least 8 characters.';

    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const rejected = await onProvision({
      ...draft,
      name: draft.name.trim(),
      code: draft.code.trim().toUpperCase(),
      domain: draft.domain.trim().toLowerCase(),
      city: draft.city.trim(),
      principalAdmin: draft.principalAdmin.trim(),
      principalEmail: draft.principalEmail.trim().toLowerCase(),
      password: draft.password ? draft.password : undefined,
    });
    setSubmitting(false);

    if (rejected) {
      setErrors(rejected);
    }
  };

  const inputClass = (field: keyof FieldErrors) =>
    `w-full px-3 py-2 text-xs rounded-xl border bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
        : 'border-zinc-200 focus:ring-[#B81D22]/20 focus:border-[#B81D22]'
    }`;
  const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5';
  const errorClass = 'mt-1 text-[11px] font-semibold text-red-600';


  return (
    <form onSubmit={handleSubmit}>
      <ModalShell
        eyebrow="Tenant Provisioning"
        title="Onboard School"
        subtitle="Creates an isolated tenant boundary with its own database schema and storage bucket."
        onClose={onClose}
        widthClass="max-w-3xl"
        footer={
          <>
            <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
            <ModalPrimaryButton type="submit" disabled={submitting}>
              {submitting ? 'Provisioning…' : 'Provision Tenant'}
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {errors.form && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {errors.form}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="onboard-name">Registered School Name</label>
              <input
                ref={firstFieldRef}
                id="onboard-name"
                type="text"
                value={draft.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Riverside Institute of Technology"
                className={inputClass('name')}
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-code">Tenant Code</label>
              <input
                id="onboard-code"
                type="text"
                value={draft.code}
                onChange={(e) => {
                  setCodeTouched(true);
                  update('code', e.target.value.toUpperCase());
                }}
                placeholder="RIT-SMTS-022"
                className={`${inputClass('code')} font-mono`}
              />
              {errors.code ? (
                <p className={errorClass}>{errors.code}</p>
              ) : (
                <p className="mt-1 text-[11px] text-zinc-400">Suggested from the school name; edit to override.</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-domain">Primary Domain</label>
              <input
                id="onboard-domain"
                type="text"
                value={draft.domain}
                onChange={(e) => update('domain', e.target.value)}
                placeholder="riverside-tech.edu.ng"
                className={`${inputClass('domain')} font-mono`}
              />
              {errors.domain && <p className={errorClass}>{errors.domain}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-city">Campus City</label>
              <input
                id="onboard-city"
                type="text"
                value={draft.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Lagos"
                className={inputClass('city')}
              />
              {errors.city && <p className={errorClass}>{errors.city}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-admin">Principal Administrator</label>
              <input
                id="onboard-admin"
                type="text"
                value={draft.principalAdmin}
                onChange={(e) => update('principalAdmin', e.target.value)}
                placeholder="Dr. Ifeoma Balogun"
                className={inputClass('principalAdmin')}
              />
              {errors.principalAdmin && <p className={errorClass}>{errors.principalAdmin}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="onboard-email">Administrator Email</label>
              <input
                id="onboard-email"
                type="email"
                value={draft.principalEmail}
                onChange={(e) => update('principalEmail', e.target.value)}
                placeholder="i.balogun@riverside-tech.edu.ng"
                className={inputClass('principalEmail')}
              />
              {errors.principalEmail && <p className={errorClass}>{errors.principalEmail}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass} htmlFor="onboard-password" style={{ marginBottom: 0 }}>Administrator Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[11px] font-semibold text-[#B81D22] hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="onboard-password"
                type={showPassword ? 'text' : 'password'}
                value={draft.password || ''}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Enter password (e.g. password)"
                className={inputClass('password')}
              />
              {errors.password ? (
                <p className={errorClass}>{errors.password}</p>
              ) : (
                <p className="mt-1 text-[11px] text-zinc-400">Password for the admin to sign in (min. 8 characters).</p>
              )}
            </div>
          </div>

          {/* School Identity & Dashboard Branding */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <span>School Identity & Dashboard Branding</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-[#B81D22]">
                    Multi-Portal Theme
                  </span>
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  The uploaded logo and custom color palette will dynamically skin the Admin, Teacher, and Student portals for this institution.
                </p>
              </div>
            </div>

            {/* Live Header Banner Preview */}
            <SchoolBrandingPreview
              primaryColor={draft.primaryColor}
              secondaryColor={draft.secondaryColor}
              logoPreviewUrl={logoPreviewUrl}
              schoolName={draft.name || 'Sample Academy'}
              badgeCode={draft.code ? draft.code.split('-')[0] : 'SMTS'}
              subtitle="Live Tenant Header Preview"
            />

            {/* Logo Upload Zone */}
            <div>
              <label className={labelClass}>School Crest / Logo</label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-300 bg-white hover:border-[#B81D22] hover:bg-red-50/30 cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200 overflow-hidden">
                    {logoPreviewUrl ? (
                      <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-zinc-400 font-bold text-lg">🏫</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-800 truncate">
                      {draft.logoFile ? draft.logoFile.name : 'Upload Official School Crest / Logo'}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      PNG, JPG, SVG, or WebP up to 5MB. Transparent background recommended.
                    </p>
                  </div>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />

                {draft.logoFile && (
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    className="px-3 py-2 text-xs font-semibold text-red-600 bg-white rounded-xl border border-red-200 hover:bg-red-50 transition-colors shrink-0"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>

            {/* Dashboard Color Palette */}
            <div>
              <label className={labelClass}>Portal Color Palette</label>
              <p className="text-[11px] text-zinc-500 mb-2">
                Select a signature institutional color scheme or pick a custom brand color:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PALETTES.filter((p) => p.id !== 'custom').map((palette) => {
                  const isSelected = draft.themePalette === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => handleSelectPalette(palette)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-zinc-900 bg-white ring-2 ring-zinc-900/10 shadow-xs'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-black/10"
                        style={{ backgroundColor: palette.primary }}
                      />
                      <span className="text-xs font-medium text-zinc-800 truncate">
                        {palette.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Selector */}
              <div className="mt-3 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-zinc-200">
                <input
                  type="color"
                  value={draft.primaryColor}
                  onChange={(e) => handleCustomColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-zinc-700 block">Custom Institutional Color</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{draft.primaryColor.toUpperCase()}</span>
                </div>
                <input
                  type="text"
                  value={draft.primaryColor}
                  onChange={(e) => handleCustomColor(e.target.value)}
                  placeholder="#B81D22"
                  className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-zinc-200 text-center uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="onboard-quota">Storage Quota (GB)</label>
            <input
              id="onboard-quota"
              type="text"
              inputMode="numeric"
              value={draft.storageQuotaGb.toLocaleString()}
              onChange={(e) => update('storageQuotaGb', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
              className={`${inputClass('name')} max-w-xs`}
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Platform default is {DEFAULT_RESOURCE_LIMITS.storageQuotaGb} GB. The system is free to use — this is
              a capacity guard, not a price plan, and it can be raised later.
            </p>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3.5 cursor-pointer hover:bg-zinc-50/60 transition-colors">
            <input
              type="checkbox"
              checked={draft.activateImmediately}
              onChange={(e) => update('activateImmediately', e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0"
            />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-zinc-900">Activate without domain verification</span>
              <span className="block text-[11px] text-zinc-500 mt-0.5">
                The school goes live straight away. Left unticked, it stays pending until the domain is
                verified.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3.5 cursor-pointer hover:bg-zinc-50/60 transition-colors bg-zinc-50/50">
            <input
              type="checkbox"
              checked={draft.cbtEnabled}
              onChange={(e) => update('cbtEnabled', e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0"
            />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <span>Equipped for CBT (Computer-Based Testing)</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">CBT Facility</span>
              </span>
              <span className="block text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                Check this ONLY if the school has verified computer laboratory space, workstations, and network equipment to conduct Computer-Based Examinations.
                <strong className="block text-zinc-700 mt-0.5 font-medium">If unchecked: Examinations for this school remain strictly paper-based with no CBT online exam portal.</strong>
              </span>
            </span>
          </label>
        </div>
      </ModalShell>
    </form>
  );
}
