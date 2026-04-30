import Link from 'next/link';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import Navbar from '@/components/Navbar';
import AdminLoginClient from '../AdminLoginClient';

const TYPE_LABELS: Record<string, string> = {
  view: 'צפייה',
  podcast: 'פודקאסט',
  quiz: 'חידון',
  presentation: 'מצגת',
  notebook: 'מחברת',
};

async function getStudentData() {
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

  const [listResult, viewsSnap] = await Promise.all([
    adminAuth.listUsers(1000),
    adminDb.collection('lesson_views').get(),
  ]);

  const studentUsers = listResult.users.filter(
    (u) => (u.customClaims as Record<string, unknown> | undefined)?.role === 'student'
  );

  // Group views by studentId
  const viewsByStudent = new Map<string, { lessonId: string; lessonTitle: string; type: string; timestamp: number }[]>();
  for (const doc of viewsSnap.docs) {
    const d = doc.data();
    const sid = d.studentId as string;
    if (!sid) continue;
    if (!viewsByStudent.has(sid)) viewsByStudent.set(sid, []);
    const ts = d.timestamp instanceof Timestamp ? d.timestamp.toMillis() : 0;
    viewsByStudent.get(sid)!.push({
      lessonId: d.lessonId as string,
      lessonTitle: (d.lessonTitle as string) ?? '',
      type: (d.type as string) ?? 'view',
      timestamp: ts,
    });
  }

  // Sort each student's views by timestamp desc
  for (const arr of viewsByStudent.values()) {
    arr.sort((a, b) => b.timestamp - a.timestamp);
  }

  const students = studentUsers.map((user) => ({
    uid: user.uid,
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    views: viewsByStudent.get(user.uid) ?? [],
  }));

  return students.sort((a, b) => b.views.length - a.views.length);
}

export default async function AdminStudentsPage() {
  const students = await getStudentData();
  if (!students) return <AdminLoginClient />;

  return (
    <>
      <Navbar role="admin" />
      <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <Link href="/admin" className="text-sm text-[#666666] hover:text-[#00b6e5] transition-colors">
              ← חזרה ללוח בקרה
            </Link>
            <h1 className="section-title mt-2">סטודנטים רשומים</h1>
            <p className="text-sm text-[#666666] mt-1">{students.length} סטודנטים במערכת</p>
          </div>

          {students.length === 0 && (
            <div className="card p-16 text-center">
              <p className="text-5xl mb-4">🎓</p>
              <p className="text-lg font-semibold text-[#383838]">אין סטודנטים עדיין</p>
            </div>
          )}

          <div className="space-y-4">
            {students.map((s) => {
              const initials = s.displayName
                .split(' ')
                .map((w: string) => w[0])
                .slice(0, 2)
                .join('');

              const uniqueLessons = new Set(s.views.map((v) => v.lessonId)).size;

              return (
                <details key={s.uid} className="card p-5 group">
                  <summary className="flex cursor-pointer items-center gap-4 list-none">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c57ff] text-xs font-bold text-white shadow">
                      {initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#383838] truncate">
                        {s.displayName || '(ללא שם)'}
                      </div>
                      <div className="text-xs text-[#666666] truncate">{s.email}</div>
                    </div>
                    <div className="flex gap-4 text-center text-sm shrink-0">
                      <div>
                        <div className="font-bold text-[#383838]">{s.views.length}</div>
                        <div className="text-xs text-[#666666]">פעולות</div>
                      </div>
                      <div>
                        <div className="font-bold text-[#00b6e5]">{uniqueLessons}</div>
                        <div className="text-xs text-[#666666]">שיעורים</div>
                      </div>
                    </div>
                    <span className="text-[#666666] text-sm group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  {s.views.length > 0 ? (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-right text-xs text-[#666666]">
                            <th className="py-2 font-medium">שיעור</th>
                            <th className="py-2 font-medium">פעולה</th>
                            <th className="py-2 font-medium">תאריך</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.views.slice(0, 50).map((v, i) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="py-2 text-[#383838] max-w-[200px] truncate">{v.lessonTitle || v.lessonId}</td>
                              <td className="py-2">
                                <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-xs text-[#666666]">
                                  {TYPE_LABELS[v.type] ?? v.type}
                                </span>
                              </td>
                              <td className="py-2 text-[#666666] whitespace-nowrap">
                                {v.timestamp
                                  ? new Date(v.timestamp).toLocaleDateString('he-IL', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {s.views.length > 50 && (
                        <p className="mt-2 text-xs text-[#666666] text-center">
                          מוצגות 50 מתוך {s.views.length} פעולות
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[#666666]">טרם צפה בשיעורים.</p>
                  )}
                </details>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
