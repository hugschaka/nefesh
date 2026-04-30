import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  const rawCookie = req.cookies.get('__session')?.value;
  if (!rawCookie) return NextResponse.json({ ok: false });

  const [firebaseSession] = rawCookie.split(':');

  let uid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(firebaseSession, false);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ ok: false });
  }

  let body: { lessonId?: string; lessonTitle?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const { lessonId, lessonTitle, type = 'view' } = body;
  if (!lessonId) return NextResponse.json({ ok: false });

  try {
    await adminDb.collection('lesson_views').add({
      studentId: uid,
      lessonId,
      lessonTitle: lessonTitle ?? '',
      type,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch {
    // fire-and-forget — never break the page
  }

  return NextResponse.json({ ok: true });
}
