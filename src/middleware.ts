import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/lessons/:path*', '/dashboard/:path*', '/admin/:path*'],
};

/**
 * Route protection based on JWT role claim stored in __session cookie.
 * The actual token verification happens via the /api/auth/session route
 * and sets a signed cookie. Here we do a lightweight check by calling
 * the admin SDK edge-compatible verify from an API helper.
 *
 * Because firebase-admin is Node-only (not Edge Runtime), the middleware
 * uses a lightweight cookie presence check and delegates full verification
 * to the server components / API routes themselves.
 *
 * For production hardening, move to a JWT-only verify approach (e.g. jose).
 */
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  // No session cookie → redirect to login immediately
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode the role from the cookie header we set at session creation.
  // The cookie value is `idToken:role` (set by /api/auth/session).
  // Full cryptographic verification is done inside each Server Component.
  const parts = session.split(':');
  const role = parts[1] as string | undefined;

  const isStudent = role === 'student' || role === 'lecturer' || role === 'admin';
  const isLecturer = role === 'lecturer' || role === 'admin';
  const isAdmin = role === 'admin';

  if (pathname.startsWith('/admin') && !isAdmin) {
    // /admin root handles its own auth (shows login form)
    if (pathname === '/admin') return NextResponse.next();
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (pathname.startsWith('/dashboard') && !isLecturer) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/lessons') && !isStudent) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
