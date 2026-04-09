import { NextResponse } from 'next/server';

// DELETE /api/auth/logout
// Clears the __session cookie and redirects to /login
export async function DELETE() {
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  );

  response.cookies.set('__session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });

  return response;
}

// POST also accepted for HTML form submissions
export async function POST() {
  return DELETE();
}
