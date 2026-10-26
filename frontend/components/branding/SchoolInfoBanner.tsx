'use client';

import React from 'react';
import Image from 'next/image';
import { resolveSchoolLogoUrl } from '@/constants/branding';

interface SchoolInfoBannerProps {
  schoolName?: string | null;
  schoolMotto?: string | null;
  schoolLogo?: string | null;
  schoolCode?: string | null;
  schoolAddress?: string | null;
  schoolEmail?: string | null;
  schoolPhone?: string | null;
  className?: string;
  variant?: 'card' | 'compact' | 'hero';
}

export function SchoolInfoBanner({
  schoolName,
  schoolMotto,
  schoolLogo,
  schoolCode,
  schoolAddress,
  schoolEmail,
  schoolPhone,
  className = '',
  variant = 'card',
}: SchoolInfoBannerProps) {
  const logoSrc = resolveSchoolLogoUrl(schoolLogo);
  const displayName = schoolName || 'Lincoln Educational Portal';

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-sm ${className}`}>
        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-200/60 p-1 flex-shrink-0 shadow-inner flex items-center justify-center">
          <Image
            src={logoSrc}
            alt={displayName}
            width={40}
            height={40}
            className="w-full h-full object-contain"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900 truncate tracking-tight">{displayName}</h2>
            {schoolCode && (
              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                {schoolCode}
              </span>
            )}
          </div>
          {schoolMotto && (
            <p className="text-xs text-zinc-500 italic truncate font-serif mt-0.5">&ldquo;{schoolMotto}&rdquo;</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white p-6 sm:p-8 shadow-xl border border-zinc-800 ${className}`}>
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-64 h-64 rounded-full bg-gradient-to-br from-red-600/10 to-red-900/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex-shrink-0 shadow-lg shadow-black/20 flex items-center justify-center">
            <Image
              src={logoSrc}
              alt={displayName}
              width={72}
              height={72}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                {displayName}
              </h1>
              {schoolCode && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider border border-white/10 backdrop-blur-md">
                  {schoolCode}
                </span>
              )}
            </div>
            {schoolMotto && (
              <p className="text-sm sm:text-base text-zinc-300 italic font-serif leading-relaxed">
                &ldquo;{schoolMotto}&rdquo;
              </p>
            )}
            {(schoolAddress || schoolEmail || schoolPhone) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 pt-1">
                {schoolAddress && <span>📍 {schoolAddress}</span>}
                {schoolEmail && <span>✉️ {schoolEmail}</span>}
                {schoolPhone && <span>📞 {schoolPhone}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white border border-zinc-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all ${className}`}>
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-zinc-50 to-zinc-100/60 border border-zinc-200/80 p-2 flex-shrink-0 shadow-sm flex items-center justify-center">
          <Image
            src={logoSrc}
            alt={displayName}
            width={56}
            height={56}
            className="w-full h-full object-contain"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight truncate">
              {displayName}
            </h2>
            {schoolCode && (
              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                {schoolCode}
              </span>
            )}
          </div>
          {schoolMotto && (
            <p className="text-xs sm:text-sm text-zinc-600 italic font-serif truncate">
              &ldquo;{schoolMotto}&rdquo;
            </p>
          )}
          {(schoolAddress || schoolEmail || schoolPhone) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500 mt-1.5 font-medium">
              {schoolAddress && <span className="truncate">📍 {schoolAddress}</span>}
              {schoolEmail && <span className="truncate">✉️ {schoolEmail}</span>}
              {schoolPhone && <span className="truncate">📞 {schoolPhone}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SchoolInfoBanner;
