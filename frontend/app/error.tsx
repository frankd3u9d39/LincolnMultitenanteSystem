'use client';

import React from 'react';
import { ErrorPageContent } from '@/components/ui/ErrorPageContent';

export default function Error() {
  return <ErrorPageContent defaultCode={500} />;
}
