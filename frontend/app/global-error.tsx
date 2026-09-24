'use client';

import React from 'react';
import { ErrorPageContent } from '@/components/ui/ErrorPageContent';

export default function GlobalError() {
  return (
    <html lang="en">
      <body className="bg-white m-0 p-0">
        <ErrorPageContent defaultCode={500} />
      </body>
    </html>
  );
}
