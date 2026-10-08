'use client';

import React from 'react';
import Link from 'next/link';
import { ErrorCharacterDisplay, ErrorCode } from './ErrorCharacterDisplay';

export interface ErrorPageContentProps {
  defaultCode?: ErrorCode;
  error?: Error & { digest?: string };
  reset?: () => void;
}

const ERROR_NAMES: Record<ErrorCode, string> = {
  404: 'Page Not Found',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  403: 'Access Forbidden',
  503: 'Service Unavailable',
  419: 'Session Expired',
};

export function ErrorPageContent({
  defaultCode = 404,
}: ErrorPageContentProps) {
  const code = defaultCode in ERROR_NAMES ? defaultCode : 404;
  const errorName = ERROR_NAMES[code];

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">
        {/* Character Mascot */}
        <div className="w-full max-w-[280px] sm:max-w-[320px] flex justify-center">
          <ErrorCharacterDisplay code={code} />
        </div>

        {/* Error Code & Name */}
        <div className="space-y-2">
          <h1 className="text-6xl sm:text-7xl font-black text-[#B81D22] tracking-tight">
            {code}
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-zinc-800">
            {errorName}
          </p>
        </div>

        {/* Simple Return Button */}
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#B81D22] text-white text-sm font-semibold hover:bg-[#9E1519] transition-colors shadow-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
