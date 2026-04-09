import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { code, data } = await req.json();

  if (!process.env.EDITOR_CODE || code !== process.env.EDITOR_CODE) {
    return NextResponse.json({ error: 'קוד שגוי' }, { status: 403 });
  }

  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
  }

  try {
    await adminDb.collection('site_config').doc('announcements').set(data, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[announcements/update]', err);
    return NextResponse.json({ error: 'שגיאה בשמירה' }, { status: 500 });
  }
}
