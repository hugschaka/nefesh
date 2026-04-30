'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/logger';
import Link from 'next/link';

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError('StudentSegment', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f3f3] px-4 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <h1 className="text-xl font-bold text-[#383838] mb-2">שגיאה בטעינת השיעורים</h1>
      <p className="text-[#666666] mb-6 max-w-sm">אירעה שגיאה. נסו לרענן את הדף.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-[#00b6e5] px-5 py-2.5 text-white font-semibold hover:bg-[#009fcc] transition-colors"
        >
          נסה שוב
        </button>
        <Link href="/" className="rounded-full border border-gray-300 px-5 py-2.5 text-[#383838] hover:border-[#00b6e5] transition-colors">
          דף הבית
        </Link>
      </div>
    </div>
  );
}
