'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your institutional email or User ID.');
      return;
    }

    setIsLoading(true);

    // Simulate sending reset instructions
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-zinc-900">
      {/* Left Brand Panel - Crimson #B81D22 */}
      <aside className="w-full lg:w-[45%] xl:w-[42%] bg-[#B81D22] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#9E1519] relative overflow-hidden shrink-0">
        {/* Decorative Background Accents */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-black/20 blur-3xl" />

        {/* Top Header / Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-3 group">
            <img
              src="/lincoln-logo.png"
              alt="Lincoln College of Science Management & Technology"
              className="h-11 sm:h-12 w-auto object-contain brightness-0 invert"
            />
            <div className="h-7 w-px bg-white/30 shrink-0" />
            <span className="font-extrabold text-xs tracking-wider text-[#B81D22] bg-white px-2.5 py-1 rounded-md shadow-sm">
              SMTS
            </span>
          </Link>
        </div>

        {/* Middle Brand Welcome */}
        <div className="relative z-10 py-10 lg:py-16 hidden sm:block">
          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight text-white mb-4">
            Lincoln College of Science Management & Technology
          </h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-md">
            Self-service password recovery for authorized institutional personnel, students, and faculty.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-white/90">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span>Encrypted Recovery Token Delivery</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/90">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span>Institutional Identity Verification</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/90">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <span>Audit Logging & Multi-Tenant Security</span>
            </div>
          </div>
        </div>

        {/* Bottom Panel Info */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
          <span>Campus Portal • T-01</span>
          <span>&copy; {new Date().getFullYear()} Lincoln SMTS</span>
        </div>
      </aside>

      {/* Right Form Canvas - White */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-zinc-50/50">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10 shadow-xl shadow-zinc-200/50">
            {!isSubmitted ? (
              <>
                {/* Title */}
                <div className="mb-6 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                    Reset Password
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-zinc-500">
                    Enter your institutional email or User ID to receive password reset instructions.
                  </p>
                </div>

                {/* Error Message Display */}
                {errorMessage && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email / ID Input */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Institutional Email or ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@lincoln.edu or Student ID"
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#B81D22] focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 transition-colors"
                      />
                      <div className="pointer-events-none absolute right-3 top-2.5 text-zinc-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#B81D22] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#B81D22]/25 hover:bg-[#9E1519] focus:outline-none focus:ring-2 focus:ring-[#B81D22] focus:ring-offset-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Sending Instructions...</span>
                        </>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Back to Login Link */}
                <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B81D22] hover:text-[#9E1519] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </>
            ) : (
              /* Success Confirmation View */
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                  Check Your Inbox
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 mb-6 leading-relaxed">
                  If an account exists for <strong className="text-zinc-900">{email}</strong>, you will receive password reset instructions shortly.
                </p>

                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center rounded-xl bg-[#B81D22] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#B81D22]/20 hover:bg-[#9E1519] transition-all"
                  >
                    Return to Sign In
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    Try another email or ID
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security / Support Information */}
          <div className="mt-6 text-center text-xs text-zinc-500 space-y-1">
            <p>
              Protected by Lincoln College Multi-Tenant Security & Sanctum Auth.
            </p>
            <p>
              Still having trouble? Contact your Campus Administrator or IT Helpdesk.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
