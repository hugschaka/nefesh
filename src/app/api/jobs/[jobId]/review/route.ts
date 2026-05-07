import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

async function getCallerUid(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get('__session')?.value;
  if (!cookie) return null;
  const colonIdx = cookie.lastIndexOf(':');
  if (colonIdx === -1) return null;
  const sessionCookie = cookie.substring(0, colonIdx);
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

// POST /api/jobs/[jobId]/review
// body: { action: 'approve' } | { action: 'edit-request', details: string }
export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const uid = await getCallerUid(req);
  if (!uid) return NextResponse.json({ error: 'לא מחוברים' }, { status: 401 });

  const jobRef = adminDb.collection('jobs').doc(params.jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) return NextResponse.json({ error: 'Job לא נמצא' }, { status: 404 });

  const job = jobSnap.data()!;

  // Verify caller is the lecturer who owns this job (or admin)
  const caller = await adminAuth.getUser(uid);
  const callerRole = (caller.customClaims as any)?.role;
  const isAdmin = callerRole === 'admin';
  const isOwner = job.lecturerId === uid;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  }

  const body = await req.json();
  const { action, details } = body as { action: string; details?: string };

  if (action === 'approve') {
    await Promise.all([
      adminDb.collection('lessons').doc(job.lessonId).update({
        isPublished: true,
        updatedAt: FieldValue.serverTimestamp(),
      }),
      jobRef.update({
        status: 'published',
        progressLabel: 'פורסם',
        editRequest: null,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);
    return NextResponse.json({ ok: true, action: 'approved' });
  }

  if (action === 'edit-request') {
    if (!details?.trim()) {
      return NextResponse.json({ error: 'נדרש פירוט לבקשת עריכה' }, { status: 400 });
    }
    await Promise.all([
      jobRef.update({
        status: 'edit_requested',
        progressLabel: 'ממתין לעריכה',
        editRequest: details.trim(),
        // Clear old product URLs — bot will re-generate
        presentationUrl: null,
        rawPresentationUrl: null,
        mindMapUrl: null,
        quizUrl: null,
        updatedAt: FieldValue.serverTimestamp(),
      }),
      adminDb.collection('lessons').doc(job.lessonId).update({
        isPublished: false,
        status: 'edit_requested',
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);
    return NextResponse.json({ ok: true, action: 'edit-request' });
  }

  return NextResponse.json({ error: 'פעולה לא תקינה' }, { status: 400 });
}
