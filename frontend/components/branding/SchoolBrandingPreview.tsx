'use client';

import React from 'react';
import Image from 'next/image';

interface SchoolBrandingPreviewProps {
  primaryColor: string;
  secondaryColor?: string;
  logoPreviewUrl?: string | null;
  schoolName?: string;
  badgeCode?: string;
  subtitle?: string;
}

/**
 * Visual Mockup of the Tenant Dashboard Top Header Banner
 * Matches the user's header banner: [School Logo] | [SMTS Badge]
 * with live dynamic color palette and logo preview.
 */
export function SchoolBrandingPreview({
  primaryColor,
  secondaryColor,
  logoPreviewUrl,
  schoolName = 'Lincoln College of Science Management & Technology',
  badgeCode = 'SMTS',
  subtitle = 'Live Dashboard Header Banner (Admin, Teacher & Student workspaces)',
}: SchoolBrandingPreviewProps) {
  const borderColor = secondaryColor || primaryColor;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          {subtitle}
        </span>
        <span
          className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white shadow-xs"
          style={{ backgroundColor: primaryColor }}
        >
          Active Preview
        </span>
      </div>

      {/* Header Banner Mockup */}
      <div
        className="rounded-2xl p-4 shadow-sm border transition-all duration-300 flex items-center justify-between overflow-hidden relative"
        style={{
          backgroundColor: primaryColor,
          borderColor: borderColor,
        }}
      >
        {/* Subtle decorative glow */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 pointer-events-none blur-xl bg-white"
        />

        <div className="flex items-center gap-3 overflow-hidden z-10">
          <div className="flex items-center gap-3 py-1">
            {logoPreviewUrl ? (
              // Custom Uploaded Logo
              <img
                src={logoPreviewUrl}
                alt={schoolName}
                className="h-10 w-auto object-contain max-w-[170px]"
              />
            ) : (
              // Default Lincoln Logo (White inverted)
              <Image
                src="/lincoln-logo.png"
                alt={schoolName}
                width={140}
                height={40}
                className="h-10 w-auto object-contain max-w-[170px] brightness-0 invert"
              />
            )}

            {/* Vertical Separator */}
            <div className="h-7 w-px bg-white/35 shrink-0" />

            {/* Institutional Badge Pill (SMTS) */}
            <span
              style={{ color: primaryColor }}
              className="font-extrabold text-xs tracking-wider bg-white px-2.5 py-1 rounded-md shadow-sm shrink-0"
            >
              {badgeCode}
            </span>
          </div>
        </div>

        {/* Right context info */}
        <div className="hidden sm:flex flex-col items-end text-right z-10 text-white/90">
          <span className="text-xs font-bold truncate max-w-[200px]">{schoolName}</span>
          <span className="text-[10px] text-white/70 font-mono uppercase">{badgeCode}-WORKSPACE</span>
        </div>
      </div>
    </div>
  );
}
