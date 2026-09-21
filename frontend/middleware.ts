import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * LincolnMultitenanteSystem - Global Edge Middleware Placeholder
 * Handles route protection and tenant resolution.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
