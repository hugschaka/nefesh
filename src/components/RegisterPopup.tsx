'use client';

import { useState, FormEvent } from 'react';
import clsx from 'clsx';

interface Props {
  onClose: () => void;
  defaultRole?: 'student' | 'lecturer';
}

export default function RegisterPopup({ onClose, defaultRole = 'student' }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'lecturer'>(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/registrations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, college, password, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={done ? onClose : undefined}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#383838] px-6 py-4">
          <h2 className="text-lg font-bold text-white">הרשמה לאתר</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-6">
          {done ? (
            /* Thank you screen */
            <div className="py-6 text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h3 className="text-xl font-bold text-[#383838]">קיבלנו את ההרשמה שלך!</h3>
              <p className="text-[#666666] leading-relaxed">
                ברגעים הקרובים ישלח אליך מייל — בדוק את תיבת המייל שלך.
              </p>
              <p className="text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-right">
                <span className="block mb-1">⚠️ חשוב!</span>
                אם המייל הגיע לספאם — אנא סמן <strong>"זה לא ספאם"</strong> כדי שתוכל לקבל את פרטי ההרשמה.
              </p>
              <button onClick={onClose} className="btn-primary px-8 py-2.5 text-sm mt-2">
                סגירה
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="ישראל ישראלי"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                  אימייל <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  dir="ltr"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                  מספר טלפון <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  dir="ltr"
                  placeholder="050-0000000"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                  שם המכללה / מוסד הלימוד <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="input-field"
                  placeholder="מכללת..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                  אני נרשם כ <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {(['student', 'lecturer'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={clsx(
                        'flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors',
                        role === r
                          ? 'border-[#00b6e5] bg-[#00b6e5]/10 text-[#00b6e5]'
                          : 'border-gray-200 text-[#666666] hover:border-gray-300'
                      )}
                    >
                      {r === 'student' ? 'סטודנט' : 'מרצה'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                  סיסמה לכניסה לאתר <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    dir="ltr"
                    placeholder="לפחות 6 תווים"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00b6e5] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1 text-sm"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={clsx('btn-primary flex-1 text-sm', loading && 'opacity-60 cursor-not-allowed')}
                >
                  {loading ? 'שולח...' : 'שליחת בקשה'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
