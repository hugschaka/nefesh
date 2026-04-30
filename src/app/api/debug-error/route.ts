import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  let body: { errorId?: string; context?: string; message?: string; stack?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const { errorId, context = '', message = '', stack = '' } = body;
  if (!errorId) return NextResponse.json({ ok: false });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await adminDb.collection('error_logs').doc(errorId).update({ status: 'unknown' });
    return NextResponse.json({ ok: false, reason: 'no api key' });
  }

  const prompt = `אתה מומחה בדיבאגינג של אפליקציית Next.js 14 + Firebase בשם "נפש יהודי".
Stack: Next.js App Router, Firebase Auth, Firestore, Gmail SMTP (nodemailer), Playwright automation bot.

שגיאה ב-context: ${context}
הודעה: ${message}
Stack trace: ${stack || 'לא זמין'}

בדיוק 3 משפטים בעברית: מה גרם לשגיאה, איזה קובץ כנראה אחראי, ומה התיקון המומלץ.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API ${res.status}`);

    const data = await res.json() as { content?: { type: string; text: string }[] };
    const diagnosis = data.content?.find((b) => b.type === 'text')?.text ?? '';

    await adminDb.collection('error_logs').doc(errorId).update({
      diagnosis,
      status: 'diagnosed',
      diagnosedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    await adminDb.collection('error_logs').doc(errorId).update({ status: 'unknown' }).catch(() => {});
    return NextResponse.json({ ok: false });
  }
}
