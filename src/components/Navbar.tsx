'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import type { UserRole } from '@/lib/types';
import AnnouncementEditor from '@/components/AnnouncementEditor';

interface NavbarProps {
  role: UserRole | null;
}

export default function Navbar({ role }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  async function handleVerifyCode() {
    setVerifying(true);
    setCodeError(false);
    try {
      const res = await fetch('/api/editor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput }),
      });
      if (res.ok) {
        sessionStorage.setItem('editor_code', codeInput);
        setCodeModalOpen(false);
        setCodeInput('');
        setEditorOpen(true);
      } else {
        setCodeError(true);
      }
    } catch {
      setCodeError(true);
    } finally {
      setVerifying(false);
    }
  }

  const links = buildLinks(role);

  return (
    <>
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 shadow-md"
        style={{
          height: 'var(--nav-height)',
          backgroundColor: 'var(--color-dark)',
          minHeight: 'var(--nav-height)',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-extrabold text-white transition-opacity hover:opacity-80"
          style={{ fontFamily: 'var(--font-accent)' }}
        >
          נפש יהודי - מרכז ההרצאות והתכנים
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-gray-300 transition-colors hover:text-[#00b6e5]"
              >
                {link.label}
              </Link>
            </li>
          ))}

          {role ? (
            <li>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm text-white border-white/40 hover:border-[#00b6e5]"
              >
                התנתקות
              </button>
            </li>
          ) : null}

          {/* Editor access button — subtle pencil icon */}
          <li>
            <button
              onClick={() => setCodeModalOpen(true)}
              className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded"
              title="כניסת עורך"
              aria-label="כניסת עורך"
            >
              <PencilIcon />
            </button>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 p-2 sm:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="תפריט"
        >
          <span className={clsx('h-0.5 w-6 bg-white transition-transform', menuOpen && 'translate-y-2 rotate-45')} />
          <span className={clsx('h-0.5 w-6 bg-white transition-opacity', menuOpen && 'opacity-0')} />
          <span className={clsx('h-0.5 w-6 bg-white transition-transform', menuOpen && '-translate-y-2 -rotate-45')} />
        </button>

        {/* Mobile drawer */}
        {menuOpen && (
          <div
            className="absolute right-0 top-[70px] w-full bg-[#383838] px-6 py-4 shadow-xl sm:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <ul className="flex flex-col gap-4">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block text-base font-medium text-gray-200 hover:text-[#00b6e5]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {role ? (
                <li>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-right text-base font-medium text-gray-200 hover:text-[#00b6e5]"
                  >
                    התנתקות
                  </button>
                </li>
              ) : null}
              <li>
                <button
                  onClick={() => { setMenuOpen(false); setCodeModalOpen(true); }}
                  className="block w-full text-right text-sm text-gray-500 hover:text-gray-300"
                >
                  כניסת עורך
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* ── Code entry modal ── */}
      {codeModalOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
          onClick={() => { setCodeModalOpen(false); setCodeInput(''); setCodeError(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-lg font-bold text-[#383838]">
              כניסת עורך
            </h3>
            <input
              type="password"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              placeholder="הזינו את קוד הגישה"
              className={clsx(
                'input-field text-center tracking-widest',
                codeError && 'border-red-400 bg-red-50'
              )}
              dir="ltr"
              autoFocus
            />
            {codeError && (
              <p className="mt-2 text-center text-sm text-red-600">קוד שגוי. נסו שנית.</p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setCodeModalOpen(false); setCodeInput(''); setCodeError(false); }}
                className="btn-secondary flex-1 text-sm"
              >
                ביטול
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={verifying || !codeInput}
                className={clsx(
                  'btn-primary flex-1 text-sm',
                  (verifying || !codeInput) && 'opacity-60 cursor-not-allowed'
                )}
              >
                {verifying ? 'בודק...' : 'כניסה'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Announcement editor ── */}
      {editorOpen && <AnnouncementEditor onClose={() => setEditorOpen(false)} />}
    </>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function buildLinks(role: UserRole | null) {
  const base = [{ href: '/', label: 'דף הבית' }];

  if (!role) return base;

  if (role === 'student') {
    return [...base, { href: '/lessons', label: 'שיעורים' }];
  }

  if (role === 'lecturer') {
    return [
      ...base,
      { href: '/lessons', label: 'שיעורים' },
      { href: '/dashboard', label: 'לוח בקרה' },
    ];
  }

  if (role === 'admin') {
    return [
      ...base,
      { href: '/lessons', label: 'שיעורים' },
      { href: '/dashboard', label: 'לוח מרצה' },
      { href: '/admin', label: 'ניהול' },
      { href: '/admin/users', label: 'משתמשים' },
      { href: '/admin/ads', label: 'מודעות' },
    ];
  }

  return base;
}
