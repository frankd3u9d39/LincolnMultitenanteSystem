/**
 * Browser-side session storage.
 *
 * The bearer token lives in localStorage ("remember me") or sessionStorage
 * (cleared when the tab closes). A small cookie carries only the user's role so
 * the edge middleware can bounce signed-out visitors before a page renders.
 * That cookie is a convenience, not a credential: every API call is still
 * authorised by the token on the server.
 */

const TOKEN_KEY = 'lincoln.token';
const ROLE_COOKIE = 'lincoln_role';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export type SessionRole = 'superadmin' | 'admin' | 'teacher' | 'student';

function readFrom(storage: () => Storage): string | null {
  try {
    return storage().getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return readFrom(() => window.sessionStorage) ?? readFrom(() => window.localStorage);
}

export function saveSession(token: string, role: SessionRole, remember: boolean): void {
  clearSession();

  try {
    (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // Storage can be blocked (private mode); the in-memory session still works
    // for this page load, and the user is asked to sign in again next time.
  }

  document.cookie = `${ROLE_COOKIE}=${role}; path=/; SameSite=Lax${remember ? `; Max-Age=${THIRTY_DAYS}` : ''}`;
}

export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }

  document.cookie = `${ROLE_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}

/** Where a signed-in user of the given role lands. */
export function homePathFor(role: SessionRole): string {
  return `/${role}/dashboard`;
}

/** Only same-site relative paths are honoured, so a crafted link cannot bounce users elsewhere. */
export function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return null;
  }

  return next;
}
