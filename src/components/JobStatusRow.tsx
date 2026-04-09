'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import clsx from 'clsx';
import type { Job } from '@/lib/types';

interface JobStatusRowProps {
  jobId: string;
  initialJob: Job;
  onDone?: (job: Job) => void;
}

const STATUS_COLORS: Record<Job['status'], string> = {
  queued:           'bg-yellow-100 text-yellow-700',
  processing:       'bg-blue-100 text-blue-700',
  pending_approval: 'bg-purple-100 text-purple-700',
  published:        'bg-green-100 text-green-700',
  failed:           'bg-red-100 text-red-700',
  session_expired:  'bg-orange-100 text-orange-700',
  rejected:         'bg-gray-100 text-gray-600',
  error:            'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<Job['status'], string> = {
  queued:           'ממתין לעיבוד',
  processing:       'מעבד...',
  pending_approval: 'ממתין לאישור מנהל',
  published:        'פורסם ✓',
  failed:           'שגיאה',
  session_expired:  'פג תוקף הסשן',
  rejected:         'נדחה',
  error:            'שגיאה',
};

const ACTIVE_STATUSES: Job['status'][] = ['queued', 'processing'];
const DONE_STATUSES: Job['status'][] = ['pending_approval', 'published'];
const ERROR_STATUSES: Job['status'][] = ['failed', 'error', 'session_expired', 'rejected'];

export default function JobStatusRow({ jobId, initialJob, onDone }: JobStatusRowProps) {
  const [job, setJob] = useState<Job>(initialJob);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'jobs', jobId),
      (snapshot) => {
        if (snapshot.exists()) {
          const updated = { id: snapshot.id, ...snapshot.data() } as Job;
          setJob(updated);
          if (DONE_STATUSES.includes(updated.status)) onDone?.(updated);
        }
      },
      (err) => console.error('[JobStatusRow]', err)
    );
    return () => unsub();
  }, [jobId, onDone]);

  const createdAt = new Date(job.createdAt).toLocaleString('he-IL');
  const isActive = ACTIVE_STATUSES.includes(job.status);
  const isDone = DONE_STATUSES.includes(job.status);
  const isError = ERROR_STATUSES.includes(job.status);

  return (
    <div className={clsx(
      'rounded-xl border p-4 transition-shadow',
      isError  ? 'border-red-200 bg-red-50'   :
      isDone   ? 'border-green-200 bg-green-50' :
                 'border-gray-200 bg-white'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-[#383838] text-sm">{job.lessonTitle}</p>
          <p className="text-xs text-gray-400 mt-0.5">{createdAt}</p>
        </div>
        <span className={clsx('rounded-pill px-3 py-0.5 text-xs font-semibold shrink-0', STATUS_COLORS[job.status])}>
          {STATUS_LABELS[job.status]}
        </span>
      </div>

      {/* Progress bar */}
      {(isActive || isDone) && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{job.progressLabel || STATUS_LABELS[job.status]}</span>
            <span dir="ltr">{job.progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-500', isDone ? 'bg-green-500' : 'bg-[#00b6e5]')}
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pending approval */}
      {job.status === 'pending_approval' && (
        <p className="mt-2 text-xs text-purple-700 font-medium">
          ✓ הבוט סיים לעבד. המנהל יאשר את השיעור ויפורסם לתלמידים.
        </p>
      )}

      {/* Published */}
      {job.status === 'published' && (
        <p className="mt-2 text-xs text-green-600 font-medium">✓ השיעור פורסם ומוצג לתלמידים.</p>
      )}

      {/* Error */}
      {isError && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-red-600 font-medium">{job.progressLabel || 'אירעה שגיאה בעיבוד.'}</p>
          {job.status === 'session_expired' && (
            <p className="text-xs text-orange-700">הבוט יתחדש לאחר כניסה מחדש לחשבון Google.</p>
          )}
          {job.errorScreenshotUrl && (
            <a href={job.errorScreenshotUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-pill bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors">
              📷 צילום מסך של השגיאה
            </a>
          )}
        </div>
      )}
    </div>
  );
}
