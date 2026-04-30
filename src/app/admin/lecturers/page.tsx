import Link from 'next/link';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import Navbar from '@/components/Navbar';
import AdminLoginClient from '../AdminLoginClient';

const STATUS_COLORS: Record<string, string> = {
  pending_bot: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  published: 'bg-[#00b6e5]/10 text-[#00b6e5]',
  error: 'bg-red-100 text-red-700',
  edit_requested: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending_bot: 'ממתין לבוט',
  processing: 'בעיבוד',
  done: 'מוכן לאישור',
  published: 'פורסם',
  error: 'שגיאה',
  edit_requested: 'ממתין לעריכה',
};

async function getLecturerData() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) return null;

  const [firebaseSession, role] = sessionCookie.split(':');
  if (role !== 'admin') return null;

  try {
    await adminAuth.verifySessionCookie(firebaseSession, true);
  } catch {
    return null;
  }

  const listResult = await adminAuth.listUsers(1000);
  const lecturerUsers = listResult.users.filter(
    (u) => (u.customClaims as Record<string, unknown> | undefined)?.role === 'lecturer'
  );

  const lecturers = await Promise.all(
    lecturerUsers.map(async (user) => {
      const snap = await adminDb
        .collection('lessons')
        .where('lecturerId', '==', user.uid)
        .get();

      const lessons = snap.docs.map((d) => ({
        id: d.id,
        title: (d.data().title as string) ?? '',
        status: (d.data().status as string) ?? 'pending_bot',
        isPublished: (d.data().isPublished as boolean) ?? false,
      }));

      return {
        uid: user.uid,
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        lessons,
      };
    })
  );

  return lecturers.sort((a, b) => b.lessons.length - a.lessons.length);
}

export default async function AdminLecturersPage() {
  const lecturers = await getLecturerData();
  if (!lecturers) return <AdminLoginClient />;

  return (
    <>
      <Navbar role="admin" />
      <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <Link href="/admin" className="text-sm text-[#666666] hover:text-[#00b6e5] transition-colors">
              ← חזרה ללוח בקרה
            </Link>
            <h1 className="section-title mt-2">מרצים רשומים</h1>
            <p className="text-sm text-[#666666] mt-1">{lecturers.length} מרצים במערכת</p>
          </div>

          {lecturers.length === 0 && (
            <div className="card p-16 text-center">
              <p className="text-5xl mb-4">🎙️</p>
              <p className="text-lg font-semibold text-[#383838]">אין מרצים עדיין</p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lecturers.map((l) => {
              const published = l.lessons.filter((ls) => ls.isPublished).length;
              const initials = l.displayName
                .split(' ')
                .map((w: string) => w[0])
                .slice(0, 2)
                .join('');

              return (
                <div key={l.uid} className="card p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00b6e5] text-sm font-bold text-white shadow">
                      {initials || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[#383838] truncate">
                        {l.displayName || '(ללא שם)'}
                      </div>
                      <div className="text-xs text-[#666666] truncate">{l.email}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-center">
                    <div className="flex-1 rounded-lg bg-[#f3f3f3] py-2">
                      <div className="text-xl font-bold text-[#383838]">{l.lessons.length}</div>
                      <div className="text-xs text-[#666666]">שיעורים</div>
                    </div>
                    <div className="flex-1 rounded-lg bg-[#f3f3f3] py-2">
                      <div className="text-xl font-bold text-[#00b6e5]">{published}</div>
                      <div className="text-xs text-[#666666]">פורסמו</div>
                    </div>
                  </div>

                  {l.lessons.length > 0 ? (
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                      {l.lessons.map((ls) => {
                        const key = ls.isPublished ? 'published' : ls.status;
                        const statusLabel = STATUS_LABELS[key] ?? ls.status;
                        const statusColor = STATUS_COLORS[key] ?? 'bg-gray-100 text-gray-600';
                        return (
                          <li key={ls.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-[#383838] truncate flex-1">{ls.title}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#666666] text-center">טרם העלה שיעורים</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
