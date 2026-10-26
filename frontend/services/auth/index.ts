// Service Facade: auth
// Sign-in, session lookup and password recovery against /api/v1/auth.

import { api, ApiError } from '@/services/api/client';
import type { SessionRole } from '@/lib/auth/session';

export interface SchoolTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePalette: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: SessionRole;
  schoolId: number | null;
  schoolName: string | null;
  schoolCode: string | null;
  schoolLogo?: string | null;
  schoolMotto?: string | null;
  schoolAddress?: string | null;
  schoolEmail?: string | null;
  schoolPhone?: string | null;
  schoolTheme?: SchoolTheme | null;
  mfaEnabled: boolean;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

/** Thrown when the account needs a second factor before it can sign in. */
export class MfaRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MfaRequiredError';
  }
}

export async function login(email: string, password: string, code?: string): Promise<LoginResult> {
  try {
    return await api<LoginResult>('/auth/login', {
      method: 'POST',
      public: true,
      body: { email, password, ...(code ? { code } : {}), device_name: 'web' },
    });
  } catch (error) {
    if (error instanceof ApiError && error.data.mfa_required === true) {
      throw new MfaRequiredError(error.message);
    }
    throw error;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const result = await api<{ user: AuthUser }>('/auth/me');
  return result.user;
}

export async function logout(): Promise<void> {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch {
    // The local session is cleared regardless; a failed call must not trap the user.
  }
}

export async function requestPasswordReset(email: string): Promise<string> {
  const result = await api<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    public: true,
    body: { email },
  });
  return result.message;
}

export async function resetPassword(input: {
  token: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}): Promise<string> {
  const result = await api<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    public: true,
    body: {
      token: input.token,
      email: input.email,
      password: input.password,
      password_confirmation: input.passwordConfirmation,
    },
  });
  return result.message;
}
