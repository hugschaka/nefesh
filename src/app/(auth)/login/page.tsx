'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import clsx from 'clsx';
import Link from 'next/link';
import RegisterPopup from '@/components/RegisterPopup';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';
  const roleHint = searchParams.get('role'); // 'student' | 'lecturer' | null

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign in with Firebase client SDK
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      // 2. Exchange idToken for a session cookie (sets __session cookie with role)
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'שגיאה בכניסה למערכת');
      }

      const { role } = await res.json();

      // 3. Redirect based on role
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'lecturer') {
        router.push('/dashboard');
      } else {
        const target = from.startsWith('/student') ? from : '/lessons';
        router.push(target);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? translateFirebaseError(err.message) : 'שגיאה לא ידועה';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const title =
    roleHint === 'lecturer'
      ? 'כניסה למרצים'
      : roleHint === 'student'
      ? 'כניסה לתלמידים'
      : 'כניסה למערכת';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4">
      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-4">
            <span
              className="text-2xl font-extrabold text-[#383838]"
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              נפש יהודי - מרכז ההרצאות והתכנים
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-[#383838]">{title}</h1>
          <p className="mt-1 text-sm text-[#666666]">הזינו את פרטי ההתחברות שלכם</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#383838]">
              כתובת דוא&quot;ל
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="input-field"
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#383838]">
              סיסמה
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00b6e5] transition-colors"
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'btn-primary w-full py-3 text-base',
              loading && 'cursor-not-allowed opacity-60'
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> מתחבר...
              </span>
            ) : (
              'כניסה'
            )}
          </button>
        </form>

        {/* Register button */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setRegisterOpen(true)}
            className="text-sm text-[#00b6e5] hover:underline font-medium"
          >
            להרשמה
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-[#666666]">
          נתקלתם בבעיה?{' '}
          <SupportLink />
        </p>
      </div>

      {registerOpen && (
        <RegisterPopup
          onClose={() => setRegisterOpen(false)}
          defaultRole={roleHint === 'lecturer' ? 'lecturer' : 'student'}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Support link — client-side only to avoid SSR issues ──────────────────────
function SupportLink() {
  return (
    <button
      type="button"
      onClick={() => {
        const subject = encodeURIComponent('בקשת עזרה - נפש יהודי');
        window.location.href = `mailto:support@zilberberg.co.il?subject=${subject}`;
      }}
      className="text-[#00b6e5] hover:underline"
    >
      פנו לתמיכה
    </button>
  );
}

// ── Firebase error translation ────────────────────────────────────────────────
function translateFirebaseError(msg: string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
    return 'כתובת הדוא"ל או הסיסמה שגויים. נסו שנית.';
  }
  if (msg.includes('too-many-requests')) {
    return 'יותר מדי ניסיונות. נסו שוב מאוחר יותר.';
  }
  if (msg.includes('network-request-failed')) {
    return 'שגיאת רשת. בדקו את החיבור לאינטרנט.';
  }
  return 'שגיאה בכניסה למערכת. אנא נסו שנית.';
}
