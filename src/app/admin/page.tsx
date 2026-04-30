import Link from 'next/link';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import Navbar from '@/components/Navbar';
import AdminLoginClient from './AdminLoginClient';

async function getAdminData() {
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

  const [lessonsSnap, usersSnap, adsSnap, errorsSnap] = await Promise.all([
    adminDb.collection('lessons').count().get(),
    adminDb.collection('users').count().get(),
    adminDb.collection('ads').count().get(),
    adminDb.collection('error_logs').get(),
  ]);

  const errors = errorsSnap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        context: (data.context as string) ?? '',
        message: (data.message as string) ?? '',
        diagnosis: (data.diagnosis as string | null) ?? null,
        status: (data.status as string) ?? 'pending',
        timestamp: data.timestamp?.toMillis?.() ?? 0,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return {
    totalLessons: lessonsSnap.data().count,
    totalUsers: usersSnap.data().count,
    totalAds: adsSnap.data().count,
    recentErrors: errors,
  };
}

export default async function AdminDashboardPage() {
  const data = await getAdminData();
  if (!data) return <AdminLoginClient />;

  const { totalLessons, totalUsers, totalAds, recentErrors } = data;

  const summaryCards = [
    { label: 'סה"כ שיעורים', value: totalLessons, href: '/lessons', color: 'text-[#00b6e5]' },
    { label: 'סה"כ משתמשים', value: totalUsers, href: '#', color: 'text-[#1c57ff]' },
    { label: 'מודעות פעילות', value: totalAds, href: '/admin/ads', color: 'text-green-600' },
  ];

  const quickLinks = [
    { href: '/admin/lessons', label: 'אישור שיעורים', icon: '✅', desc: 'אשרו שיעורים שעובדו על ידי הבוט לפרסום' },
    { href: '/admin/ads', label: 'ניהול מודעות', icon: '📢', desc: 'הוספה, עריכה ומחיקה של מודעות' },
    { href: '/admin/users', label: 'ניהול משתמשים', icon: '👥', desc: 'הוספה, עריכה ומחיקה של משתמשים' },
  ];

  const previewLinks = [
    { href: '/lessons', label: 'תצוגת תלמיד', icon: '🎓', desc: 'כך נראה האתר לתלמיד שנכנס' },
    { href: '/dashboard', label: 'תצוגת מרצה', icon: '🎙️', desc: 'כך נראה האתר למרצה שנכנס' },
  ];

  return (
    <>
      <Navbar role="admin" />
      <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-10">
          <div>
            <h1 className="section-title mb-1">לוח בקרה ניהולי</h1>
            <p className="text-sm text-[#666666]">ברוכים הבאים, מנהל.</p>
          </div>

          {/* Summary */}
          <div className="grid gap-6 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <Link key={card.label} href={card.href} className="card p-6 text-center block">
                <div className={`text-4xl font-extrabold mb-1 ${card.color}`} style={{ fontFamily: 'var(--font-accent)' }}>
                  {card.value}
                </div>
                <div className="text-sm text-[#666666]">{card.label}</div>
              </Link>
            ))}
          </div>

          {/* Quick links */}
          <section>
            <h2 className="section-title mb-4">פעולות מהירות</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="card flex flex-col items-start p-5 gap-2 block">
                  <span className="text-3xl">{link.icon}</span>
                  <h3 className="font-bold text-[#383838] text-base">{link.label}</h3>
                  <p className="text-xs text-[#666666]">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent errors */}
          {recentErrors.length > 0 && (
            <section>
              <h2 className="section-title mb-4">שגיאות אחרונות</h2>
              <div className="space-y-3">
                {recentErrors.map((err) => (
                  <div key={err.id} className="card p-4 border-l-4 border-red-400">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            {err.context}
                          </span>
                          <span className="text-xs text-[#666666]">
                            {err.timestamp
                              ? new Date(err.timestamp).toLocaleString('he-IL')
                              : '—'}
                          </span>
                        </div>
                        <p className="text-sm text-[#383838] truncate">{err.message}</p>
                        {err.diagnosis && (
                          <p className="mt-2 text-xs text-[#666666] bg-[#f3f3f3] rounded-lg p-2 leading-relaxed">
                            🤖 {err.diagnosis}
                          </p>
                        )}
                        {!err.diagnosis && err.status === 'pending' && (
                          <p className="mt-1 text-xs text-[#666666]">🔄 מנתח...</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Preview mode */}
          <section>
            <h2 className="section-title mb-1">תצוגה מקדימה</h2>
            <p className="mb-4 text-sm text-[#666666]">צפו באתר כפי שמשתמשים רואים אותו</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {previewLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="card flex items-center gap-4 p-5 border-2 border-dashed border-[#00b6e5]/40 hover:border-[#00b6e5] transition-colors block"
                >
                  <span className="text-3xl">{link.icon}</span>
                  <div>
                    <h3 className="font-bold text-[#383838] text-base">{link.label}</h3>
                    <p className="text-xs text-[#666666]">{link.desc}</p>
                  </div>
                  <span className="mr-auto text-xs text-[#00b6e5] font-medium">צפה ←</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
