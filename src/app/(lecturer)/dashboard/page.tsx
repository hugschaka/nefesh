'use client';

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import JobStatusRow from '@/components/JobStatusRow';
import { UploadLessonSchema } from '@/lib/types';
import type { Job, Lesson } from '@/lib/types';
import clsx from 'clsx';

const ALLOWED_TYPES = [
  'application/pdf',
  'audio/mpeg',
  'video/mp4',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const ALLOWED_EXT = ['.pdf', '.mp3', '.mp4', '.docx', '.doc'];

function resolveFileType(mimeType: string): Lesson['fileType'] {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'audio/mpeg') return 'mp3';
  if (mimeType === 'video/mp4') return 'mp4';
  return 'pdf';
}

type UploadPhase = 'idle' | 'uploading' | 'processing';

function requestNotificationPermission() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function fireNotification(title: string, body: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

export default function LecturerDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [approvingJobId, setApprovingJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'jobs'),
      where('lecturerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          lessonId: raw.lessonId ?? '',
          lessonTitle: raw.lessonTitle ?? '',
          progress: raw.progress ?? 0,
          progressLabel: raw.progressLabel ?? '',
          status: raw.status ?? 'queued',
          errorScreenshotUrl: raw.errorScreenshotUrl,
          podcastUrl: raw.podcastUrl,
          quizUrl: raw.quizUrl,
          presentationUrl: raw.presentationUrl,
          rawPresentationUrl: raw.rawPresentationUrl,
          notebookUrl: raw.notebookUrl,
          createdAt:
            raw.createdAt instanceof Timestamp
              ? raw.createdAt.toMillis()
              : raw.createdAt ?? Date.now(),
          updatedAt:
            raw.updatedAt instanceof Timestamp
              ? raw.updatedAt.toMillis()
              : raw.updatedAt ?? Date.now(),
        } as Job;
      });
      setJobs(data);
    });

    return () => unsub();
  }, [user]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFormError(null);
    if (!selected) { setFile(null); return; }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFormError(`סוג קובץ לא נתמך. הותרים: ${ALLOWED_EXT.join(', ')}`);
      setFile(null);
      return;
    }

    const maxMb = 500;
    if (selected.size > maxMb * 1024 * 1024) {
      setFormError(`גודל הקובץ חייב להיות עד ${maxMb} MB.`);
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setDebugLog([]);

    const log = (msg: string) => {
      console.log('[Upload]', msg);
      setDebugLog((prev) => [...prev, msg]);
    };

    if (!user) {
      setFormError('לא מחוברים למערכת. אנא התחברו מחדש.');
      return;
    }

    log(`User: ${user.uid}`);

    const parsed = UploadLessonSchema.safeParse({ title });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'שגיאת אימות');
      return;
    }

    if (!file) {
      setFormError('נא לבחור קובץ להעלאה.');
      return;
    }

    log(`File: ${file.name} (${(file.size / 1024).toFixed(0)} KB, ${file.type})`);

    setUploadPhase('uploading');
    requestNotificationPermission();

    try {
      const fileType = resolveFileType(file.type);

      log('מאמת זהות...');
      const token = await user.getIdToken(true);
      log('אימות OK — מעלה...');

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `lessons/${user.uid}/${timestamp}_${safeName}`;
      const bucket = 'zilberberg-platform.firebasestorage.app';
      const encodedPath = encodeURIComponent(storagePath);
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodedPath}`;

      log(`POST → firebasestorage.googleapis.com`);
      const uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Firebase ${token}`,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResp.ok) {
        const errBody = await uploadResp.text().catch(() => '');
        log(`שגיאה ${uploadResp.status}: ${errBody.slice(0, 150)}`);
        throw new Error(`שגיאת העלאה: HTTP ${uploadResp.status}`);
      }

      const uploadData = await uploadResp.json();
      log('העלאה הושלמה!');
      setUploadProgress(100);

      const downloadToken = uploadData.downloadTokens;
      const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodedPath}?alt=media&token=${downloadToken}`;
      log('קיבלנו URL — יוצר שיעור...');

      setUploadPhase('processing');
      setUploadProgress(0);

      log('יוצר שיעור ו-job דרך השרת...');
      const createResp = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parsed.data.title,
          fileUrl,
          fileType,
          lecturerName: user.displayName ?? user.email ?? 'מרצה',
          sourceDocUrls: [fileUrl],
        }),
      });
      if (!createResp.ok) {
        const err = await createResp.json().catch(() => ({}));
        throw new Error(err.error || `שגיאת שרת ${createResp.status}`);
      }
      const { lessonId, jobId } = await createResp.json();
      log(`✓ שיעור: ${lessonId} | job: ${jobId}`);

      setTitle('');
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const code = (err as any)?.code ?? '';
      const msg = err instanceof Error ? err.message : String(err);
      log(`CAUGHT: code=${code} msg=${msg}`);
      setFormError(code ? `שגיאה (${code}): ${msg}` : msg || 'שגיאה בהעלאה. נסו שנית.');
      setUploadPhase('idle');
    }
  }

  function handleJobDone(job: Job) {
    if (job.status === 'pending_approval') {
      fireNotification('נפש יהודי', `השיעור "${job.lessonTitle}" עובד ✓ — ממתין לאישור שלך`);
    } else if (job.status === 'published') {
      fireNotification('נפש יהודי', `השיעור "${job.lessonTitle}" פורסם ומוצג לתלמידים 🎉`);
    }
  }

  async function approveLessonForPublishing(job: Job) {
    setApprovingJobId(job.id);
    try {
      await Promise.all([
        updateDoc(doc(db, 'lessons', job.lessonId), {
          isPublished: true,
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'jobs', job.id), {
          status: 'published',
          progressLabel: 'פורסם',
          updatedAt: serverTimestamp(),
        }),
      ]);
      fireNotification('נפש יהודי', `✓ השיעור "${job.lessonTitle}" פורסם בהצלחה!`);
      setJobs(jobs.filter(j => j.id !== job.id));
    } catch (err) {
      console.error('Approval error:', err);
      alert('שגיאה בהעלאת אישור');
    } finally {
      setApprovingJobId(null);
    }
  }

  async function rejectLesson(job: Job) {
    setApprovingJobId(job.id);
    try {
      await updateDoc(doc(db, 'jobs', job.id), {
        status: 'rejected',
        progressLabel: 'נדחה על ידי המרצה',
        updatedAt: serverTimestamp(),
      });
      setJobs(jobs.filter(j => j.id !== job.id));
    } catch (err) {
      console.error('Rejection error:', err);
      alert('שגיאה בדחיית הלימוד');
    } finally {
      setApprovingJobId(null);
    }
  }

  const activeJobs = jobs.filter((j) => ['queued', 'processing'].includes(j.status));
  const pendingApprovalJobs = jobs.filter((j) => j.status === 'pending_approval');
  const doneJobs = jobs.filter((j) => !['queued', 'processing', 'pending_approval'].includes(j.status));

  return (
    <>
      <Navbar role="lecturer" />
      <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-10">

          <div className="flex justify-end">
            <a
              href="/lessons"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-pill border-2 border-[#00b6e5] px-5 py-2 text-sm font-semibold text-[#00b6e5] transition hover:bg-[#00b6e5] hover:text-white"
            >
              <span>👁️</span> תצוגת תלמיד
            </a>
          </div>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h1 className="section-title mb-6">העלאת שיעור חדש</h1>

            {formError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {debugLog.length > 0 && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-mono text-gray-600 space-y-0.5 leading-5" dir="ltr">
                {debugLog.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            )}

            {uploadPhase === 'processing' && (
              <div className="mb-4 rounded-xl border border-[#00b6e5] bg-[#f0fbff] px-4 py-4 text-sm">
                <p className="font-semibold text-[#383838] mb-1">✓ הקובץ הועלה! הבוט מתחיל לעבד...</p>
                <p className="text-[#666666] text-xs leading-relaxed">
                  ניתן לעזוב את הדף ולחזור מאוחר יותר — תקבלו התראה בדפדפן כשהעיבוד יסתיים.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="lesson-title" className="mb-1.5 block text-sm font-medium text-[#383838]">
                  כותרת השיעור <span className="text-red-500">*</span>
                </label>
                <input
                  id="lesson-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="לדוגמה: פרשת השבוע — בראשית"
                  className="input-field"
                  maxLength={120}
                  required
                  disabled={uploadPhase !== 'idle'}
                />
                <p className="mt-1 text-right text-xs text-gray-400">{title.length}/120</p>
              </div>

              <div>
                <label htmlFor="lesson-file" className="mb-1.5 block text-sm font-medium text-[#383838]">
                  קובץ <span className="text-red-500">*</span>{' '}
                  <span className="text-xs text-gray-400">(PDF, Word, MP3, MP4 — עד 500 MB)</span>
                </label>
                <input
                  ref={fileInputRef}
                  id="lesson-file"
                  type="file"
                  accept=".pdf,.mp3,.mp4,.docx,.doc,audio/mpeg,video/mp4,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={handleFileChange}
                  className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 file:mr-4 file:cursor-pointer file:rounded-pill file:border-0 file:bg-[#00b6e5] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#1c57ff]"
                  required
                  disabled={uploadPhase !== 'idle'}
                />
                {file && (
                  <p className="mt-1 text-xs text-gray-500">
                    נבחר: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
              </div>

              {uploadPhase === 'uploading' && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>מעלה קובץ לשרת...</span>
                    <span dir="ltr">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#00b6e5] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadPhase !== 'idle'}
                className={clsx('btn-primary w-full py-3 text-base', uploadPhase !== 'idle' && 'cursor-not-allowed opacity-60')}
              >
                {uploadPhase === 'uploading' ? `מעלה... ${uploadProgress}%` : uploadPhase === 'processing' ? 'מעבד...' : 'העלאה ושליחה לעיבוד'}
              </button>
            </form>
          </section>

          {activeJobs.length > 0 && (
            <section>
              <h2 className="section-title mb-4">שיעורים בעיבוד</h2>
              <div className="space-y-3">
                {activeJobs.map((job) => (
                  <JobStatusRow key={job.id} jobId={job.id} initialJob={job} onDone={handleJobDone} />
                ))}
              </div>
            </section>
          )}

          {/* PENDING APPROVAL — Lecturer approves before publishing */}
          {pendingApprovalJobs.length > 0 && (
            <section>
              <h2 className="section-title mb-4">שיעורים מוכנים לאישור שלך</h2>
              <p className="text-sm text-[#666666] mb-4">הבוט סיים לעבד את השיעורים — בדוק אותם ואשר לפרסום</p>
              <div className="space-y-3">
                {pendingApprovalJobs.map((job) => (
                  <div key={job.id} className="rounded-2xl bg-white shadow-md p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-bold text-[#383838] text-lg">{job.lessonTitle}</h2>
                        <p className="text-xs text-[#666666] mt-0.5">
                          {new Date(job.createdAt).toLocaleDateString('he-IL', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        מוכן לאישור
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {job.notebookUrl && (
                        <a
                          href={job.notebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-[#00b6e5] px-3 py-1.5 text-sm text-[#00b6e5] hover:bg-[#f0fbff] transition"
                        >
                          <span>🔗</span> צפה בNotebook
                        </a>
                      )}
                      {job.presentationUrl && (
                        <a
                          href={job.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-[#00b6e5] px-3 py-1.5 text-sm text-[#00b6e5] hover:bg-[#f0fbff] transition"
                        >
                          <span>📊</span> צפה במצגת (מסוננת)
                        </a>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => approveLessonForPublishing(job)}
                        disabled={approvingJobId === job.id}
                        className={clsx(
                          'btn-primary flex-1 py-2.5',
                          approvingJobId === job.id && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        {approvingJobId === job.id ? 'מעבד...' : '✓ אשר ופרסם'}
                      </button>
                      <button
                        onClick={() => rejectLesson(job)}
                        disabled={approvingJobId === job.id}
                        className={clsx(
                          'flex-1 rounded-pill border border-red-300 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition',
                          approvingJobId === job.id && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        ✕ דחה
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {doneJobs.length > 0 && (
            <section>
              <h2 className="section-title mb-4">היסטוריית עיבוד</h2>
              <div className="space-y-3">
                {doneJobs.map((job) => (
                  <JobStatusRow key={job.id} jobId={job.id} initialJob={job} onDone={handleJobDone} />
                ))}
              </div>
            </section>
          )}

          {jobs.length === 0 && uploadPhase === 'idle' && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-[#666666]">עדיין לא הועלו שיעורים. העלו את הראשון!</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
