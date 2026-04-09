import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// POST /api/auth/session
// Body: { idToken: string }
// Verifies the Firebase ID token, reads the role custom claim,
// and stores a session cookie formatted as `{idToken}:{role}`.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body as { idToken?: string };

    if (!idToken) {
      return NextResponse.json({ error: 'idToken חסר' }, { status: 400 });
    }

    // Verify the token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken, true /* check revoked */);
    const role = (decodedToken.role as string) ?? 'student';
    const uid = decodedToken.uid;

    // Create a Firebase session cookie (7 days)
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days in ms
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // We embed the role in the cookie value so the Edge middleware can read it
    // without calling firebase-admin (which is Node-only).
    // Format: `{firebaseSessionCookie}:{role}`
    const cookieValue = `${sessionCookie}:${role}`;

    const response = NextResponse.json({ uid, role }, { status: 200 });

    response.cookies.set('__session', cookieValue, {
      maxAge: expiresIn / 1000, // seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    console.error('[session/POST]', err);
    const message = err instanceof Error ? err.message : 'שגיאה פנימית';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// DELETE /api/auth/session — logout
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('__session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  return response;
}
