import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get('__session')?.value;
  if (!cookie) return false;
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

// GET — list all pending registrations
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  const snap = await adminDb
    .collection('registrations')
    .orderBy('createdAt', 'desc')
    .get();

  const registrations = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ registrations });
}

// PATCH — update role before approval
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  const { id, role } = await req.json();
  await adminDb.collection('registrations').doc(id).update({ role });
  return NextResponse.json({ ok: true });
}

// DELETE — reject/delete registration
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }
  const { id } = await req.json();
  await adminDb.collection('registrations').doc(id).delete();
  return NextResponse.json({ ok: true });
}

// POST — approve registration
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  const { id } = await req.json();

  const snap = await adminDb.collection('registrations').doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'הבקשה לא נמצאה' }, { status: 404 });
  }

  const reg = snap.data()!;

  // Create Firebase user — or fetch existing if already created on a prior attempt
  let uid: string;
  try {
    const user = await adminAuth.createUser({
      email: reg.email,
      password: reg.password,
      displayName: reg.name,
      emailVerified: false,
    });
    uid = user.uid;
  } catch (err: unknown) {
    const code = (err as any)?.errorInfo?.code ?? (err as any)?.code ?? '';
    if (code === 'auth/email-already-exists') {
      // User was created on a previous attempt — fetch their uid
      const existing = await adminAuth.getUserByEmail(reg.email);
      uid = existing.uid;
    } else {
      throw err;
    }
  }

  // Set role claim
  await adminAuth.setCustomUserClaims(uid, { role: reg.role });

  // Send approval email — use resend test domain if custom domain not verified
  const siteUrl = 'https://web-app-rho-gray.vercel.app';
  try {
    await resend.emails.send({
      from: 'נפש יהודי <onboarding@resend.dev>',
      to: reg.email,
      subject: 'אתר ההרצאות של נפש יהודי',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #383838;">
          <h2 style="color: #00b6e5;">ברוכים הבאים לנפש יהודי!</h2>
          <p>שלום ${reg.name},</p>
          <p>אישרנו את ההרשמה שלך. אתה יכול להיכנס דרך הלינק הזה:</p>
          <a
            href="${siteUrl}/"
            style="display:inline-block;background:#00b6e5;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:bold;margin-top:16px;"
          >
            כניסה לאתר
          </a>
          <p style="margin-top:20px;">כתובת המייל שלך: <strong>${reg.email}</strong></p>
          <p>הסיסמה שבחרת בעת ההרשמה.</p>
          <p style="margin-top:24px;">תהנה.</p>
          <p style="color:#666;margin-top:28px;font-size:12px;border-top:1px solid #eee;padding-top:12px;">
            נפש יהודי - מרכז ההרצאות והתכנים
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('[registrations approve] email failed:', emailErr);
    // Don't fail the whole approval if email fails — user is already created
  }

  // Delete the pending registration (removes stored password)
  await adminDb.collection('registrations').doc(id).delete();

  return NextResponse.json({ ok: true, uid });
}
