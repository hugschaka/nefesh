import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const BOT_BASE_URL = process.env.BOT_BASE_URL ?? 'http://localhost:3001';

// ─── POST /api/jobs ────────────────────────────────────────────────────────────
// Creates a lesson + job document in Firestore, then forwards the job to the
// automation bot. Returns { lessonId } on success.
// Body: { title: string; sourceDocUrls: string[] }
export async function POST(req: NextRequest) {
  // 1. Verify Firebase session cookie
  const rawCookie = req.cookies.get('__session')?.value;
  if (!rawCookie) {
    return NextResponse.json({ error: 'לא מחוברים' }, { status: 401 });
  }

  // Cookie format: {firebaseSessionCookie}:{role}
  const [firebaseSession] = rawCookie.split(':');

  let decodedToken: import('firebase-admin/auth').DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifySessionCookie(firebaseSession, true);
  } catch {
    return NextResponse.json({ error: 'סשן לא תקין' }, { status: 401 });
  }

  // 2. Enforce lecturer / admin role
  const role = decodedToken.role as string | undefined;
  if (role !== 'lecturer' && role !== 'admin') {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  // 3. Parse request body
  let body: { title: string; fileUrl?: string; fileType?: string; lecturerName?: string; sourceDocUrls?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה לא תקין' }, { status: 400 });
  }

  const { title, fileUrl, fileType, lecturerName } = body;
  const sourceDocUrls = body.sourceDocUrls ?? (fileUrl ? [fileUrl] : []);

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'כותרת השיעור חסרה' }, { status: 400 });
  }
  if (!fileUrl && sourceDocUrls.length === 0) {
    return NextResponse.json({ error: 'fileUrl חסר' }, { status: 400 });
  }

  const lecturerId = decodedToken.uid;
  const now = FieldValue.serverTimestamp();

  // 4. Create /lessons/{lessonId} document
  const lessonRef = adminDb.collection('lessons').doc();
  const lessonId = lessonRef.id;

  await lessonRef.set({
    id: lessonId,
    title: title.trim(),
    lecturerId,
    lecturerName: lecturerName ?? '',
    sourceDocUrls,
    fileUrl: fileUrl ?? sourceDocUrls[0] ?? '',
    fileType: fileType ?? 'pdf',
    isPublished: false,
    status: 'pending_bot',
    createdAt: now,
    updatedAt: now,
  });

  // 5. Create /jobs/{jobId} document
  const jobRef = adminDb.collection('jobs').doc();
  const jobId = jobRef.id;

  await jobRef.set({
    id: jobId,
    lessonId,
    lessonTitle: title.trim(),
    lecturerId,
    status: 'queued',
    progress: 0,
    progressLabel: 'ממתין לעיבוד',
    errorScreenshotUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  // 6. Forward job to the automation bot (best-effort — don't fail the request)
  try {
    const botRes = await fetch(`${BOT_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, lessonId, lecturerId, sourceDocUrls }),
    });

    if (!botRes.ok) {
      const errorText = await botRes.text().catch(() => 'unknown error');
      console.error(`[jobs] Bot returned ${botRes.status}: ${errorText}`);

      await Promise.all([
        lessonRef.update({ status: 'error', updatedAt: now }),
        jobRef.update({ status: 'error', progressLabel: 'שגיאת חיבור לבוט', updatedAt: now }),
      ]);

      return NextResponse.json(
        { lessonId, warning: 'הבוט לא זמין — העבודה נשמרה לניסיון מחדש' },
        { status: 202 }
      );
    }
  } catch (err) {
    console.error('[jobs] Failed to reach bot:', err);

    await Promise.all([
      lessonRef.update({ status: 'error', updatedAt: now }),
      jobRef.update({ status: 'error', progressLabel: 'שגיאת חיבור לבוט', updatedAt: now }),
    ]);

    return NextResponse.json(
      { lessonId, warning: 'הבוט לא נגיש — העבודה נשמרה לניסיון מחדש' },
      { status: 202 }
    );
  }

  // 7. Return new lesson ID
  return NextResponse.json({ lessonId, jobId }, { status: 201 });
}
