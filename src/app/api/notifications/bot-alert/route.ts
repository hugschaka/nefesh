import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.BOT_API_SECRET || authHeader !== `Bearer ${process.env.BOT_API_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { to, title, message } = await req.json();
  if (!to || !title || !message) {
    return NextResponse.json({ error: 'to, title and message required' }, { status: 400 });
  }

  try {
    await sendMail({
      to,
      subject: title,
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#383838;">
          <h2 style="color:#00b6e5;">${title}</h2>
          <p style="white-space:pre-line;">${message}</p>
          <p style="color:#666;margin-top:28px;font-size:12px;border-top:1px solid #eee;padding-top:12px;">
            נפש יהודי - מרכז ההרצאות והתכנים
          </p>
        </div>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[bot-alert]', err);
    return NextResponse.json({ error: 'mail failed' }, { status: 500 });
  }
}
