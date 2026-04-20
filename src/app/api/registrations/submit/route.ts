import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, phone, college, password, role } = await req.json();

  if (!name || !email || !phone || !college || !password) {
    return NextResponse.json({ error: 'כל השדות חובה' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' }, { status: 400 });
  }

  // Check for duplicate pending registration
  const existing = await adminDb
    .collection('registrations')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: 'כבר קיימת בקשת הרשמה עם כתובת מייל זו' }, { status: 409 });
  }

  await adminDb.collection('registrations').add({
    name,
    email,
    phone,
    college,
    password, // temporary — deleted on approval
    role: role === 'lecturer' ? 'lecturer' : 'student',
    createdAt: Date.now(),
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-app-rho-gray.vercel.app';
  const adminEmail = 'danielrozner11@gmail.com';

  // Send admin notification (works on Resend sandbox since it's the account owner's email)
  try {
    await resend.emails.send({
      from: 'נפש יהודי <onboarding@resend.dev>',
      to: adminEmail,
      subject: 'משתמש חדש מבקש להירשם לנפש יהודי',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #383838;">
          <h2 style="color: #00b6e5;">בקשת הרשמה חדשה</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr><td style="padding:8px;font-weight:bold;width:120px;">שם:</td><td style="padding:8px;">${name}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">אימייל:</td><td style="padding:8px;" dir="ltr">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">טלפון:</td><td style="padding:8px;" dir="ltr">${phone}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:8px;font-weight:bold;">מוסד:</td><td style="padding:8px;">${college}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">תפקיד:</td><td style="padding:8px;">${role === 'lecturer' ? 'מרצה' : 'סטודנט'}</td></tr>
          </table>
          <a href="${siteUrl}/admin/users"
             style="display:inline-block;background:#00b6e5;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:bold;margin-top:20px;">
            לאישור בלוח הניהול
          </a>
          <p style="color:#666;margin-top:28px;font-size:12px;border-top:1px solid #eee;padding-top:12px;">
            נפש יהודי - מרכז ההרצאות והתכנים
          </p>
        </div>
      `,
    });
  } catch (e) {
    console.error('[registrations/submit] admin email failed:', e);
  }

  // Send confirmation to registrant (may fail on Resend sandbox for non-owner emails)
  try {
    await resend.emails.send({
      from: 'נפש יהודי <onboarding@resend.dev>',
      to: email,
      subject: 'קיבלנו את בקשת ההרשמה שלך — נפש יהודי',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #383838;">
          <h2 style="color: #00b6e5;">ההרשמה שלך התקבלה!</h2>
          <p>שלום ${name},</p>
          <p>הבקשה שלך נשלחה לבדיקה. כשהמנהל יאשר אותה תקבל מייל עם קישור לכניסה לאתר.</p>
          <a href="${siteUrl}/login"
             style="display:inline-block;background:#00b6e5;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:bold;margin-top:16px;">
            דף הכניסה
          </a>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px;margin-top:20px;">
            <p style="margin:0;font-weight:bold;color:#e65100;">⚠️ חשוב — בדוק בספאם!</p>
            <p style="margin:8px 0 0;">אם מייל האישור יגיע לתיקיית ספאם, אנא לחץ על <strong>"זה לא ספאם"</strong> כדי שתמשיך לקבל עדכונים.</p>
          </div>
          <p style="color:#666;margin-top:28px;font-size:12px;border-top:1px solid #eee;padding-top:12px;">
            נפש יהודי - מרכז ההרצאות והתכנים
          </p>
        </div>
      `,
    });
  } catch (e) {
    console.error('[registrations/submit] user email failed:', e);
  }

  return NextResponse.json({ ok: true });
}
