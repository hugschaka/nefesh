'use client';

import { useState, useEffect, FormEvent } from 'react';
import Navbar from '@/components/Navbar';
import clsx from 'clsx';

type Role = 'student' | 'lecturer' | 'admin';

interface PendingReg {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  role: 'student' | 'lecturer';
  createdAt: number;
}

interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  disabled: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<Role, string> = {
  student: 'תלמיד',
  lecturer: 'מרצה',
  admin: 'מנהל',
};

const ROLE_COLORS: Record<Role, string> = {
  student: 'bg-blue-100 text-blue-700',
  lecturer: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
};

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#';
  let p = '';
  for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [formRole, setFormRole] = useState<'student' | 'lecturer'>('student');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);

  // Role change
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pending registrations
  const [regs, setRegs] = useState<PendingReg[]>([]);
  const [regsLoading, setRegsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingRegId, setDeletingRegId] = useState<string | null>(null);
  const [regRoleChanging, setRegRoleChanging] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers(json.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינה');
    } finally {
      setLoading(false);
    }
  }

  async function loadRegs() {
    setRegsLoading(true);
    try {
      const res = await fetch('/api/admin/registrations');
      const json = await res.json();
      setRegs(json.registrations ?? []);
    } catch {
      setRegs([]);
    } finally {
      setRegsLoading(false);
    }
  }

  async function handleRegRoleChange(id: string, role: 'student' | 'lecturer') {
    setRegRoleChanging(id);
    try {
      await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      setRegs((prev) => prev.map((r) => r.id === id ? { ...r, role } : r));
    } finally {
      setRegRoleChanging(null);
    }
  }

  async function handleDeleteReg(id: string) {
    setDeletingRegId(id);
    try {
      await fetch('/api/admin/registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setRegs((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingRegId(null);
    }
  }

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (res.ok) {
        setRegs((prev) => prev.filter((r) => r.id !== id));
        await loadUsers();
      } else {
        alert('שגיאה: ' + (json.error ?? 'אישור נכשל'));
      }
    } catch {
      alert('שגיאת רשת — נסה שנית');
    } finally {
      setApprovingId(null);
    }
  }

  useEffect(() => { loadUsers(); loadRegs(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          role: formRole,
          displayName: formName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCreatedUser({ email: formEmail, password: formPassword });
      setFormEmail(''); setFormName(''); setFormPassword(''); setFormRole('student');
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'שגיאה ביצירה');
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(uid: string, role: Role) {
    setChangingRole(uid);
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role }),
      });
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, role } : u));
    } finally {
      setChangingRole(null);
    }
  }

  async function handleDelete(uid: string) {
    setDeleting(true);
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Navbar role="admin" />
      <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="section-title">ניהול משתמשים</h1>
              <p className="mt-1 text-sm text-[#666666]">
                {users.length} משתמשים רשומים
              </p>
            </div>
            <button onClick={() => { setShowForm(true); setCreatedUser(null); }} className="btn-primary text-sm">
              + משתמש חדש
            </button>
          </div>

          {/* Success banner after create */}
          {createdUser && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="font-semibold text-green-800 mb-2">✓ המשתמש נוצר בהצלחה</p>
              <p className="text-sm text-green-700">שלחו לו את פרטי הכניסה:</p>
              <div className="mt-2 rounded-lg bg-white border border-green-200 p-3 font-mono text-sm" dir="ltr">
                <div>Email: {createdUser.email}</div>
                <div>Password: {createdUser.password}</div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${createdUser.email}\nPassword: ${createdUser.password}`
                  );
                }}
                className="mt-2 text-xs text-green-700 underline hover:no-underline"
              >
                העתק ללוח
              </button>
            </div>
          )}

          {/* Create form modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between bg-[#383838] px-6 py-4 rounded-t-2xl">
                  <h2 className="text-lg font-bold text-white">יצירת משתמש חדש</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-white text-xl">✕</button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  {createError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {createError}
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                      שם (אופציונלי)
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="input-field"
                      placeholder="ישראל ישראלי"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                      כתובת דוא&quot;ל <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="input-field"
                      dir="ltr"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                      סיסמה <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPwd ? 'text' : 'password'}
                          required
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="input-field pl-10"
                          dir="ltr"
                          placeholder="לפחות 6 תווים"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00b6e5]"
                          tabIndex={-1}
                        >
                          {showPwd ? '🙈' : '👁'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setFormPassword(generatePassword()); setShowPwd(true); }}
                        className="btn-secondary text-xs px-3 py-2 whitespace-nowrap"
                      >
                        צור סיסמה
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#383838]">תפקיד</label>
                    <div className="flex gap-3">
                      {(['student', 'lecturer'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormRole(r)}
                          className={clsx(
                            'flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors',
                            formRole === r
                              ? 'border-[#00b6e5] bg-[#00b6e5]/10 text-[#00b6e5]'
                              : 'border-gray-200 text-[#666666] hover:border-gray-300'
                          )}
                        >
                          {ROLE_LABELS[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className={clsx('btn-primary flex-1 text-sm', creating && 'opacity-60 cursor-not-allowed')}
                    >
                      {creating ? 'יוצר...' : 'צור משתמש'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Pending registrations */}
          {(regsLoading || regs.length > 0) && (
            <section>
              <h2 className="section-title mb-4 flex items-center gap-2">
                בקשות הרשמה ממתינות
                {regs.length > 0 && (
                  <span className="rounded-full bg-orange-500 text-white text-xs font-bold px-2 py-0.5">
                    {regs.length}
                  </span>
                )}
              </h2>
              <div className="rounded-2xl bg-white shadow-md overflow-hidden">
                {regsLoading ? (
                  <div className="h-20 animate-pulse bg-gray-50" />
                ) : (
                  <div className="divide-y divide-gray-100">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-orange-50 text-xs font-semibold text-orange-700 uppercase tracking-wide">
                      <span>פרטים</span>
                      <span>מוסד</span>
                      <span>תפקיד</span>
                      <span></span>
                    </div>
                    {regs.map((reg) => (
                      <div key={reg.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-[#383838]">{reg.name}</p>
                          <p className="text-sm text-[#666666]" dir="ltr">{reg.email}</p>
                          <p className="text-xs text-gray-400">{reg.phone}</p>
                        </div>
                        <p className="text-sm text-[#666666] whitespace-nowrap">{reg.college}</p>
                        <select
                          value={reg.role}
                          disabled={regRoleChanging === reg.id}
                          onChange={(e) => handleRegRoleChange(reg.id, e.target.value as 'student' | 'lecturer')}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-[#383838] bg-white outline-none cursor-pointer hover:border-[#00b6e5] transition-colors disabled:opacity-50"
                        >
                          <option value="student">תלמיד</option>
                          <option value="lecturer">מרצה</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(reg.id)}
                            disabled={approvingId === reg.id}
                            className={clsx(
                              'rounded-pill bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors whitespace-nowrap',
                              approvingId === reg.id && 'opacity-60 cursor-not-allowed'
                            )}
                          >
                            {approvingId === reg.id ? 'מאשר...' : 'אישור'}
                          </button>
                          <button
                            onClick={() => handleDeleteReg(reg.id)}
                            disabled={deletingRegId === reg.id}
                            className={clsx(
                              'rounded-pill border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap',
                              deletingRegId === reg.id && 'opacity-60 cursor-not-allowed'
                            )}
                          >
                            {deletingRegId === reg.id ? '...' : 'מחק'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Users table */}
          <div className="rounded-2xl bg-white shadow-md overflow-hidden">
            {loading ? (
              <div className="space-y-px">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-gray-50 animate-pulse border-b border-gray-100" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-2">👥</p>
                <p className="text-[#666666]">אין משתמשים עדיין. צרו את הראשון!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-[#f3f3f3] text-xs font-semibold text-[#666666] uppercase tracking-wide">
                  <span>משתמש</span>
                  <span>תפקיד</span>
                  <span>שינוי תפקיד</span>
                  <span></span>
                </div>

                {users.map((user) => (
                  <div
                    key={user.uid}
                    className={clsx(
                      'grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4',
                      user.disabled && 'opacity-50'
                    )}
                  >
                    {/* Info */}
                    <div>
                      {user.displayName && (
                        <p className="text-sm font-semibold text-[#383838]">{user.displayName}</p>
                      )}
                      <p className={clsx('text-sm', user.displayName ? 'text-[#666666]' : 'font-semibold text-[#383838]')} dir="ltr">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>

                    {/* Role badge */}
                    <span className={clsx('rounded-pill px-2.5 py-1 text-xs font-medium whitespace-nowrap', ROLE_COLORS[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </span>

                    {/* Role selector */}
                    <select
                      value={user.role}
                      disabled={changingRole === user.uid}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as Role)}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-[#383838] bg-white outline-none cursor-pointer hover:border-[#00b6e5] transition-colors disabled:opacity-50"
                    >
                      <option value="student">תלמיד</option>
                      <option value="lecturer">מרצה</option>
                      <option value="admin">מנהל</option>
                    </select>

                    {/* Delete */}
                    <div>
                      {deleteConfirm === user.uid ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(user.uid)}
                            disabled={deleting}
                            className="rounded-pill bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {deleting ? '...' : 'אשר'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded-pill border border-gray-300 px-2.5 py-1.5 text-xs text-[#666666] hover:border-gray-400"
                          >
                            ביטול
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.uid)}
                          className="rounded-pill border border-gray-200 px-2.5 py-1.5 text-xs text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors"
                        >
                          מחיקה
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
