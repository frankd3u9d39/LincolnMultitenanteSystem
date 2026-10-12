import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * LincolnMultitenanteSystem - edge route guard.
 *
 * Bounces signed-out visitors away from the role areas before a page renders.
 * It only reads the role cookie the sign-in flow sets, so it is a convenience:
 * the API still authorises every request with the bearer token, and the client
 * guard (RequireAuth) re-checks the session against the server.
 */
const ROLE_AREAS = ['superadmin', 'admin', 'teacher', 'student'] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = ROLE_AREAS.find((role) => pathname === `/${role}` || pathname.startsWith(`/${role}/`));

  if (!area) {
    return NextResponse.next();
  }

  const role = request.cookies.get('lincoln_role')?.value;

  if (!role) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (role !== area && (ROLE_AREAS as readonly string[]).includes(role)) {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\..*).*)'],
};
