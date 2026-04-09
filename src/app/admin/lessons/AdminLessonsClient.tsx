'use client';

import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import clsx from 'clsx';

interface PendingJob {
  jobId: string;
  lessonId: string;
  lessonTitle: string;
  podcastUrl?: string;
  quizUrl?: string;
  presentationUrl?: string;
  rawPresentationUrl?: string;
  notebookUrl?: string;
  createdAt: number;
}

export default function AdminLessonsClient({ initialJobs }: { initialJobs: PendingJob[] }) {
  const [jobs, setJobs] = useState<PendingJob[]>(initialJobs);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  async function approve(job: PendingJob) {
    setActionInProgress(job.jobId);
    try {
      await Promise.all([
        updateDoc(doc(db, 'lessons', job.lessonId), {
          isPublished: true,
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'jobs', job.jobId), {
          status: 'published',
          progressLabel: 'פורסם',
          updatedAt: serverTimestamp(),
        }),
      ]);
      // Remove from list
      setJobs(jobs.filter(j => j.jobId !== job.jobId));
    } finally {
      setActionInProgress(null);
    }
  }

  async function reject(job: PendingJob) {
    setActionInProgress(job.jobId);
    try {
      await updateDoc(doc(db, 'jobs', job.jobId), {
        status: 'rejected',
        progressLabel: 'נדחה על ידי מנהל',
        updatedAt: serverTimestamp(),
      });
      // Remove from list
      setJobs(jobs.filter(j => j.jobId !== job.jobId));
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">

        <div>
          <h1 className="section-title mb-1">אישור שיעורים</h1>
          <p className="text-sm text-[#666666]">
            שיעורים שהבוט סיים לעבד וממתינים לאישורכם לפרסום
          </p>
        </div>

        {jobs.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-[#666666]">אין שיעורים הממתינים לאישור כרגע.</p>
          </div>
        )}

        {jobs.map((job) => (
          <div key={job.jobId} className="rounded-2xl bg-white shadow-md p-6 space-y-4">

            {/* Title + date */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-[#383838] text-lg">{job.lessonTitle}</h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  {new Date(job.createdAt).toLocaleDateString('he-IL', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                ממתין לאישור
              </span>
            </div>

            {/* Preview links */}
            <div className="flex flex-wrap gap-3">
              {job.notebookUrl && (
                <a
                  href={job.notebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[#00b6e5] px-3 py-1.5 text-sm text-[#00b6e5] hover:bg-[#f0fbff] transition"
                >
                  <span>🔗</span> פתח Notebook
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
              {job.rawPresentationUrl && (
                <a
                  href={job.rawPresentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition"
                >
                  <span>📑</span> מצגת מקורית
                </a>
              )}
            </div>

            {/* Approve / Reject */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => approve(job)}
                disabled={actionInProgress === job.jobId}
                className={clsx(
                  'btn-primary flex-1 py-2.5',
                  actionInProgress === job.jobId && 'opacity-60 cursor-not-allowed'
                )}
              >
                {actionInProgress === job.jobId ? 'מעבד...' : '✓ אשר ופרסם'}
              </button>
              <button
                onClick={() => reject(job)}
                disabled={actionInProgress === job.jobId}
                className={clsx(
                  'flex-1 rounded-pill border border-red-300 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition',
                  actionInProgress === job.jobId && 'opacity-60 cursor-not-allowed'
                )}
              >
                ✕ דחה
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
