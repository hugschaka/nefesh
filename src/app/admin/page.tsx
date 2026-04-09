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

  // Fetch summary counts
  const [lessonsSnap, usersSnap, adsSnap] = await Promise.all([
    adminDb.collection('lessons').count().get(),
    adminDb.collection('users').count().get(),
    adminDb.collection('ads').count().get(),
  ]);

  return {
    totalLessons: lessonsSnap.data().count,
    totalUsers: usersSnap.data().count,
    totalAds: adsSnap.data().count,
  };
}

export default async function AdminDashboardPage() {
  const data = await getAdminData();
  if (!data) return <AdminLoginClient />;

  const { totalLessons, totalUsers, totalAds } = data;

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
