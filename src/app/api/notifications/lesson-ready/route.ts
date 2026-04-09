import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Verify bot secret
  const authHeader = req.headers.get('authorization');
  if (!process.env.BOT_API_SECRET || authHeader !== `Bearer ${process.env.BOT_API_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { lessonId, lecturerId } = await req.json();
  if (!lessonId || !lecturerId) {
    return NextResponse.json({ error: 'חסרים פרמטרים' }, { status: 400 });
  }

  try {
    // Get lesson details
    const lessonSnap = await adminDb.collection('lessons').doc(lessonId).get();
    if (!lessonSnap.exists) {
      return NextResponse.json({ error: 'שיעור לא נמצא' }, { status: 404 });
    }
    const lesson = lessonSnap.data()!;

    // Get lecturer email
    const user = await adminAuth.getUser(lecturerId);
    const email = user.email;
    if (!email) {
      return NextResponse.json({ error: 'אין כתובת מייל' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-app-rho-gray.vercel.app';

    await resend.emails.send({
      from: 'נפש יהודי <noreply@zilberberg.co.il>',
      to: email,
      subject: `הקבצים לשיעור "${lesson.title}" מוכנים`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #383838;">
          <h2 style="color: #00b6e5;">הקבצים שלך מוכנים!</h2>
          <p>שלום,</p>
          <p>הקבצים עבור השיעור <strong>"${lesson.title}"</strong> הוכנו בהצלחה ומוכנים לצפייה.</p>
          <a
            href="${siteUrl}/lessons/${lessonId}"
            style="display:inline-block;background:#00b6e5;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:bold;margin-top:16px;"
          >
            לצפייה בשיעור
          </a>
          <p style="color:#666;margin-top:28px;font-size:12px;border-top:1px solid #eee;padding-top:12px;">
            נפש יהודי - מרכז ההרצאות והתכנים
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[lesson-ready]', err);
    return NextResponse.json({ error: 'שגיאה בשליחת מייל' }, { status: 500 });
  }
}
