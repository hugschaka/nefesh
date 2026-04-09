import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// ── Helper: verify the caller is an admin ──────────────────────────────────
async function requireAdmin(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get('__session')?.value;
  if (!cookie) return false;
  // Cookie format: {firebaseSessionCookie}:{role}
  const colonIdx = cookie.lastIndexOf(':');
  if (colonIdx === -1) return false;
  const sessionCookie = cookie.substring(0, colonIdx);
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

// ── GET /api/admin/users — list all users ──────────────────────────────────
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  try {
    const result = await adminAuth.listUsers(1000);
    const users = result.users.map((u) => ({
      uid: u.uid,
      email: u.email ?? '',
      displayName: u.displayName ?? '',
      role: (u.customClaims?.role as string) ?? 'student',
      disabled: u.disabled,
      createdAt: u.metadata.creationTime,
    }));
    // Sort newest first
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ users });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return NextResponse.json({ error: 'שגיאה בטעינת המשתמשים' }, { status: 500 });
  }
}

// ── POST /api/admin/users — create user ───────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  const { email, password, role, displayName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'נדרשים אימייל וסיסמה' }, { status: 400 });
  }

  const allowedRoles = ['student', 'lecturer'];
  const finalRole = allowedRoles.includes(role) ? role : 'student';

  try {
    const user = await adminAuth.createUser({
      email,
      password,
      displayName: displayName ?? '',
      emailVerified: false,
    });
    await adminAuth.setCustomUserClaims(user.uid, { role: finalRole });
    return NextResponse.json({ uid: user.uid, role: finalRole });
  } catch (err: unknown) {
    console.error('[admin/users POST]', err);
    const message = err instanceof Error ? err.message : 'שגיאה ביצירת משתמש';
    if (message.includes('email-already-exists')) {
      return NextResponse.json({ error: 'כתובת האימייל כבר קיימת במערכת' }, { status: 409 });
    }
    return NextResponse.json({ error: 'שגיאה ביצירת המשתמש' }, { status: 500 });
  }
}

// ── PATCH /api/admin/users — change role ──────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  const { uid, role } = await req.json();

  if (!uid || !role) {
    return NextResponse.json({ error: 'חסרים uid או role' }, { status: 400 });
  }

  const allowedRoles = ['student', 'lecturer', 'admin'];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'תפקיד לא חוקי' }, { status: 400 });
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/users PATCH]', err);
    return NextResponse.json({ error: 'שגיאה בעדכון התפקיד' }, { status: 500 });
  }
}

// ── DELETE /api/admin/users — delete user ─────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  const { uid } = await req.json();

  if (!uid) {
    return NextResponse.json({ error: 'חסר uid' }, { status: 400 });
  }

  try {
    await adminAuth.deleteUser(uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/users DELETE]', err);
    return NextResponse.json({ error: 'שגיאה במחיקת המשתמש' }, { status: 500 });
  }
}
