'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { homePathFor, useAuth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace(homePathFor(user.role));
    }
  }, [status, user, router]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-[#B81D22] selection:text-white">

      {/* Main Navbar */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/lincoln-logo.png"
              alt="Lincoln College of Science Management & Technology"
              width={160}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
            <div className="h-6 w-px bg-zinc-200" />
            <span className="font-black text-xs tracking-wider text-[#B81D22] bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
              SMTS PLATFORM
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-[#B81D22] hover:bg-[#9E1519] text-white text-xs font-bold transition-all shadow-md shadow-red-900/10 flex items-center gap-2"
            >
              <span>Access Portal</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-zinc-200">
          {/* Background Image of Students with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/students-hero.jpg"
              alt="Lincoln Campus Students"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Multi-stop overlay ensuring crystal-clear text readability while showing campus students */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white/90 backdrop-blur-[1px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-tight max-w-4xl mx-auto drop-shadow-sm">
              Unified Campus Digital Ecosystem & Multi-Tenant Educational ERP
            </h1>

            <p className="mt-6 text-sm sm:text-base text-zinc-700 font-medium max-w-2xl mx-auto leading-relaxed">
              Empowering students, academic faculty, registrars, and campus administrators with strict data isolation, realtime academic governance, and institutional performance intelligence.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-[#B81D22] hover:bg-[#9E1519] text-white text-sm font-bold transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
              >
                <span>Access Institutional Portal</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </section>



        {/* Security & Multi-Tenancy Architecture Showcase */}
        <section className="bg-white border-t border-zinc-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="w-10 h-10 rounded-xl bg-[#B81D22]/10 text-[#B81D22] font-black text-sm flex items-center justify-center mb-3">
                  01
                </div>
                <h4 className="font-bold text-zinc-900 text-sm">Hardware-grade Multi-Tenancy</h4>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Every query is strictly bound by the authenticated user&apos;s <code className="font-mono bg-zinc-200 px-1 py-0.5 rounded text-[11px]">school_id</code>. Zero data leakage across institutional boundaries.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="w-10 h-10 rounded-xl bg-[#B81D22]/10 text-[#B81D22] font-black text-sm flex items-center justify-center mb-3">
                  02
                </div>
                <h4 className="font-bold text-zinc-900 text-sm">Decoupled REST & Next.js Core</h4>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  High-speed Next.js 16 App Router UI coupled to a hardened Laravel 11 REST API with Sanctum token security and TOTP multi-factor protection.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="w-10 h-10 rounded-xl bg-[#B81D22]/10 text-[#B81D22] font-black text-sm flex items-center justify-center mb-3">
                  03
                </div>
                <h4 className="font-bold text-zinc-900 text-sm">End-to-End Enterprise Compliance</h4>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Realtime audit trails, automated attendance warnings, fee billing receipts, and GPA grading transcript generators.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-10 border-t border-zinc-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white tracking-tight">Lincoln SMTS</span>
            <span>&bull;</span>
            <span>Lincoln College of Science Management & Technology</span>
          </div>
          <p className="text-zinc-500">
            &copy; 2026 Lincoln SMTS. All rights reserved. Multi-tenant educational architecture.
          </p>
        </div>
      </footer>
    </div>
  );
}
