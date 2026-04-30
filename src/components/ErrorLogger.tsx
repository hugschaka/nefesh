'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/logger';

export default function ErrorLogger() {
  useEffect(() => {
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      logError('UnhandledRejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    }
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return null;
}
