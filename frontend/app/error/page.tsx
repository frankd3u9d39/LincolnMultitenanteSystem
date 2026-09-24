'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ErrorPageContent } from '@/components/ui/ErrorPageContent';
import { ErrorCode } from '@/components/ui/ErrorCharacterDisplay';

function ErrorView() {
  const searchParams = useSearchParams();
  const rawCode = Number(searchParams.get('code') || '404');
  const validCodes: ErrorCode[] = [404, 500, 501, 403, 503, 419];
  const code: ErrorCode = validCodes.includes(rawCode as ErrorCode)
    ? (rawCode as ErrorCode)
    : 404;

  return <ErrorPageContent defaultCode={code} />;
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ErrorView />
    </Suspense>
  );
}
