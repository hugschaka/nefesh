import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

const ADMIN_EMAIL = 'danielrozner11@gmail.com';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.BOT_API_SECRET || authHeader !== `Bearer ${process.env.BOT_API_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { title, message } = await req.json();
  if (!title || !message) {
    return NextResponse.json({ error: 'title and message required' }, { status: 400 });
  }

  try {
    await sendMail({
      to: ADMIN_EMAIL,
      subject: title,
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#383838;">
          <h2 style="color:#00b6e5;">${title}</h2>
          <p style="white-space:pre-line;">${message}</p>
          <p style="color:#666;margin-top:28px;font-size:12px;border-top:1px solid #eee;padding-top:12px;">
            Zilberberg Bot — נפש יהודי
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
