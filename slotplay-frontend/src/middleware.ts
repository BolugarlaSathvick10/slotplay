/**
 * middleware.ts  (Next.js route middleware — runs on the Edge)
 *
 * Enforces authentication for protected route groups.
 * Redirects unauthenticated users to /login with the intended URL
 * encoded as a `returnUrl` query param so they're sent back after login.
 *
 * Route protection rules:
 *   /dashboard/*     — requires any authenticated user
 *   /bookings/*      — requires any authenticated user
 *   /profile/*       — requires any authenticated user
 *   /owner/*         — requires owner or admin role
 *   /admin/*         — requires admin role
 *
 * NOTE: Role enforcement here is a lightweight first layer.
 * The backend API still performs full role checks on every request.
 *
 * Session verification is done via a lightweight /api/auth/me fetch.
 * The session cookie is forwarded automatically by the browser.
 */

import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/bookings', '/profile', '/payment'];
const OWNER_PATHS = ['/owner'];
const ADMIN_PATHS = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth =
    PROTECTED_PATHS.some((p) => pathname.startsWith(p)) ||
    OWNER_PATHS.some((p) => pathname.startsWith(p)) ||
    ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Check session by calling the backend /api/auth/me endpoint
  // The session cookie is forwarded automatically
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Not authenticated — redirect to login with returnUrl
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const data = await response.json();
    const role: string = data?.data?.role ?? 'user';

    // Role-based path guards
    if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (
      OWNER_PATHS.some((p) => pathname.startsWith(p)) &&
      role !== 'owner' &&
      role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch {
    // If the auth check itself fails (API down), redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/profile/:path*',
    '/payment/:path*',
    '/owner/:path*',
    '/admin/:path*',
  ],
};
