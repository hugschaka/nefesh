import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { sendMail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'כתובת מייל חסרה' }, { status: 400 });
  }

  try {
    const resetLink = await adminAuth.generatePasswordResetLink(email.trim());
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-app-rho-gray.vercel.app';

    await sendMail({
      to: email.trim(),
      subject: 'איפוס סיסמה — נפש יהודי',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #383838;">
          <div style="text-align:center; margin-bottom:24px;">
            <h1 style="color:#00b6e5; font-size:24px; margin:0;">נפש יהודי</h1>
            <p style="color:#666; font-size:13px; margin:4px 0 0;">מרכז ההרצאות והתכנים</p>
          </div>
          <h2 style="font-size:18px; color:#383838;">איפוס סיסמה</h2>
          <p>שלום,</p>
          <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור להגדרת סיסמה חדשה:</p>
          <div style="text-align:center; margin:28px 0;">
            <a href="${resetLink}"
               style="display:inline-block;background:#00b6e5;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:bold;font-size:15px;">
              איפוס סיסמה
            </a>
          </div>
          <p style="color:#888; font-size:13px;">הקישור תקף ל-24 שעות. אם לא ביקשת לאפס את הסיסמה, אפשר להתעלם ממייל זה.</p>
          <hr style="border:none;border-top:1px solid #eee; margin:24px 0;"/>
          <p style="color:#aaa; font-size:11px; text-align:center;">
            נפש יהודי — <a href="${siteUrl}" style="color:#00b6e5;">${siteUrl}</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string; errorInfo?: { code: string } }).code
      ?? (err as { errorInfo?: { code: string } }).errorInfo?.code
      ?? '';
    // Never reveal whether an email address is registered
    const isUserMissing =
      code.includes('user-not-found') ||
      msg.includes('USER_NOT_FOUND') ||
      msg.includes('user-not-found') ||
      msg.includes('no user record') ||
      msg.includes('INVALID_EMAIL') ||
      msg.includes('EMAIL_NOT_FOUND');
    if (isUserMissing) {
      return NextResponse.json({ ok: true });
    }
    console.error('[reset-password]', msg);
    return NextResponse.json({ error: 'שגיאה בשליחת המייל. נסו שוב.' }, { status: 500 });
  }
}
