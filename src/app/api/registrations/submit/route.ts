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

  // Send immediate confirmation email
  try {
    await resend.emails.send({
      from: 'נפש יהודי <onboarding@resend.dev>',
      to: email,
      subject: 'קיבלנו את בקשת ההרשמה שלך — נפש יהודי',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #383838;">
          <h2 style="color: #00b6e5;">תודה על ההרשמה!</h2>
          <p>שלום ${name},</p>
          <p>המנהל בודק את פרטי ההרשמה שלך ויאשר בהקדם. תקבל מייל נוסף עם פרטי הכניסה לאחר האישור.</p>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px;margin-top:20px;">
            <p style="margin:0;font-weight:bold;color:#e65100;">⚠️ חשוב — אם מייל זה הגיע לספאם:</p>
            <p style="margin:8px 0 0;">אנא לחץ על <strong>"זה לא ספאם"</strong> כדי שמייל האישור יגיע ישירות לתיבת הדואר שלך.</p>
          </div>
          <p style="color:#666;margin-top:28px;font-size:12px;border-top:1px solid #eee;padding-top:12px;">
            נפש יהודי - מרכז ההרצאות והתכנים
          </p>
        </div>
      `,
    });
  } catch (e) {
    console.error('[registrations/submit] email failed:', e);
  }

  return NextResponse.json({ ok: true });
}
