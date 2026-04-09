import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb.collection('site_config').doc('announcements').get();
    return NextResponse.json({ data: snap.exists ? snap.data() : null });
  } catch (err) {
    console.error('[announcements/get]', err);
    return NextResponse.json({ error: 'שגיאה בטעינה' }, { status: 500 });
  }
}
