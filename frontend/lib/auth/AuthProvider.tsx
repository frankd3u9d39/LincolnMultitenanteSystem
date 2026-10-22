'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UNAUTHENTICATED_EVENT } from '@/services/api/client';
import { AuthUser, fetchCurrentUser, login as loginRequest, logout as logoutRequest } from '@/services/auth';
import { clearSession, getToken, homePathFor, saveSession, SessionRole } from './session';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Why the session ended: the user chose to sign out, or the server ended it. */
  endedBy: 'user' | 'expired' | null;
  /** Signs in and returns the signed-in user. Throws ApiError / MfaRequiredError. */
  signIn: (email: string, password: string, options?: { code?: string; remember?: boolean }) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [endedBy, setEndedBy] = useState<'user' | 'expired' | null>(null);

  // Restore the session on first load by asking the server who the token belongs to.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      // Yield first so state is never set synchronously inside the effect body.
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      if (!getToken()) {
        setStatus('anonymous');
        return;
      }

      try {
        const current = await fetchCurrentUser();
        if (!cancelled) {
          setUser(current);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setStatus('anonymous');
        }
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  // Any API call that comes back 401 ends the session everywhere in the app.
  useEffect(() => {
    const onUnauthenticated = () => {
      setUser(null);
      setEndedBy('expired');
      setStatus('anonymous');
    };

    window.addEventListener(UNAUTHENTICATED_EVENT, onUnauthenticated);
    return () => window.removeEventListener(UNAUTHENTICATED_EVENT, onUnauthenticated);
  }, []);

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password, options = {}) => {
    const result = await loginRequest(email, password, options.code);
    saveSession(result.token, result.user.role, Boolean(options.remember));
    setUser(result.user);
    setStatus('authenticated');
    setEndedBy(null);
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest();
    clearSession();
    setUser(null);
    setEndedBy('user');
    setStatus('anonymous');
    router.replace('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const current = await fetchCurrentUser();
      setUser(current);
      return current;
    } catch {
      return null;
    }
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, status, endedBy, signIn, signOut, refreshUser, updateUser }),
    [user, status, endedBy, signIn, signOut, refreshUser, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}

/**
 * Renders its children only for a signed-in user holding the given role.
 * Signed-out visitors are sent to the sign-in page and returned afterwards;
 * signed-in users of another role are sent to their own dashboard.
 */
export function RequireAuth({ role, children }: { role: SessionRole; children: React.ReactNode }) {
  const { user, status, endedBy } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'anonymous') {
      // After choosing to sign out there is nothing to return to; only an expired
      // session or a direct visit should come back to the page that was requested.
      router.replace(endedBy === 'user' ? '/login' : `/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === 'authenticated' && user && user.role !== role) {
      router.replace(homePathFor(user.role));
    }
  }, [status, user, role, router, pathname, endedBy]);

  if (status !== 'authenticated' || !user || user.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <svg className="animate-spin w-5 h-5 text-[#B81D22]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Verifying your session…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
