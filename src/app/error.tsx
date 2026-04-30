'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError('GlobalErrorBoundary', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f3f3] px-4 text-center">
      <p className="text-5xl mb-4">😕</p>
      <h1 className="text-2xl font-bold text-[#383838] mb-2">משהו השתבש</h1>
      <p className="text-[#666666] mb-6 max-w-sm">
        אירעה שגיאה בלתי צפויה. הצוות שלנו קיבל עדכון אוטומטי.
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-[#00b6e5] px-6 py-3 text-white font-semibold hover:bg-[#009fcc] transition-colors"
      >
        רענון הדף
      </button>
    </div>
  );
}
