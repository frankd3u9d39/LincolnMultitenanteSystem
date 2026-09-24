import React from 'react';
import { ErrorPageContent } from '@/components/ui/ErrorPageContent';

export const metadata = {
  title: '404 - Page Not Found | Lincoln SMTS',
};

export default function NotFound() {
  return <ErrorPageContent defaultCode={404} />;
}
