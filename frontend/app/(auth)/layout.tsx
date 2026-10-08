import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Lincoln SMTS',
  description: 'Lincoln College of Science Management & Technology - Institutional Login Portal',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col justify-between selection:bg-[#B81D22] selection:text-white">
      {children}
    </div>
  );
}
