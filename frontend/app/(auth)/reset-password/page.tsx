'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/services/api';
import { resetPassword } from '@/services/auth';

export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary for the page to stay statically prerenderable.
  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-50" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  // The emailed link carries the token and address in its query string.
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!token || !email) {
      setErrorMessage('This reset link is incomplete. Request a new one from the sign-in page.');
      return;
    }
    if (password.length < 10) {
      setErrorMessage('Choose a password of at least 10 characters.');
      return;
    }
    if (password !== confirmation) {
      setErrorMessage('The two passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ token, email, password, passwordConfirmation: confirmation });
      setDone(true);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'We could not reset your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#B81D22] focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 transition-colors';

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
        <Link href="/login" className="flex items-center gap-3 mb-6">
          <Image
            src="/lincoln-logo.png"
            alt="Lincoln College of Science Management & Technology"
            width={140}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {done ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Password updated</h1>
            <p className="text-sm text-zinc-600">
              Your password has been changed and every device was signed out. Sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#B81D22] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#B81D22]/25 hover:bg-[#9E1519] transition-all"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Choose a new password</h1>
              <p className="text-sm text-zinc-600 mt-1">{email ? `For ${email}` : 'Enter a new password for your account.'}</p>
            </div>

            {errorMessage && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#B81D22] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#B81D22]/25 hover:bg-[#9E1519] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating…' : 'Update password'}
            </button>

            <p className="text-center text-xs text-zinc-500">
              <Link href="/login" className="font-medium text-[#B81D22] hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
