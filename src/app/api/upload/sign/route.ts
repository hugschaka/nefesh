import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase-admin';

const ALLOWED_TYPES = [
  'application/pdf',
  'audio/mpeg',
  'video/mp4',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export async function POST(req: NextRequest) {
  // 1. Verify auth
  const rawCookie = req.cookies.get('__session')?.value;
  if (!rawCookie) return NextResponse.json({ error: 'לא מחוברים' }, { status: 401 });

  const [firebaseSession] = rawCookie.split(':');
  let decodedToken: import('firebase-admin/auth').DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifySessionCookie(firebaseSession, true);
  } catch {
    return NextResponse.json({ error: 'סשן לא תקין' }, { status: 401 });
  }

  const role = decodedToken.role as string | undefined;
  if (role !== 'lecturer' && role !== 'admin') {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  // 2. Parse body
  let body: { fileName: string; contentType: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה לא תקין' }, { status: 400 });
  }

  const { fileName, contentType } = body;
  if (!fileName || !contentType) {
    return NextResponse.json({ error: 'fileName ו-contentType נדרשים' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'סוג קובץ לא נתמך' }, { status: 400 });
  }

  // 3. Build storage path
  const uid = decodedToken.uid;
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `lessons/${uid}/${timestamp}_${safeName}`;

  // 4. Generate signed URLs
  const bucket = adminStorage.bucket();
  const file = bucket.file(storagePath);

  const [writeUrl] = await file.getSignedUrl({
    action: 'write',
    version: 'v2',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  const [readUrl] = await file.getSignedUrl({
    action: 'read',
    expires: '2030-01-01',
  });

  return NextResponse.json({ writeUrl, readUrl, storagePath });
}
