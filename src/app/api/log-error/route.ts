import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  let body: { context?: string; message?: string; stack?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const { context = 'unknown', message = '', stack } = body;

  let errorId: string;
  try {
    const ref = adminDb.collection('error_logs').doc();
    errorId = ref.id;
    await ref.set({
      id: errorId,
      context,
      message,
      stack: stack ?? null,
      diagnosis: null,
      status: 'pending',
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch {
    return NextResponse.json({ ok: false });
  }

  // Non-blocking AI diagnosis
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  fetch(`${siteUrl}/api/debug-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ errorId, context, message, stack }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, errorId });
}
