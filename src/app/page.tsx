import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  return (
    <>
      <Navbar role={null} />

      {/* ── Hero ── */}
      <main className="flex flex-col">
        <section
          className="relative flex min-h-[calc(100vh-70px)] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#00b6e5]/10 via-white to-[#f3f3f3] px-4 text-center"
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#00b6e5]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#1c57ff]/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            {/* Badge */}
            <span className="mb-4 inline-block rounded-pill bg-[#00b6e5]/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#00b6e5]">
              פלטפורמת הלימוד המובילה
            </span>

            <h1
              className="mb-6 text-4xl font-extrabold leading-tight text-[#383838] sm:text-5xl lg:text-6xl"
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              נפש יהודי - מרכז ההרצאות והתכנים
              <br />
              <span className="text-[#00b6e5]">תורה ויהדות</span>
            </h1>

            <p className="mb-10 text-lg leading-relaxed text-[#666666] sm:text-xl">
              מאות שיעורים ברמה גבוהה בנושאי תורה, הלכה ומחשבת ישראל.
              <br />
              למדו בכל זמן, בכל מקום — בחינם.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/login?role=student" className="btn-primary text-base px-8 py-3">
                כניסה לתלמידים
              </Link>
              <Link href="/login?role=lecturer" className="btn-secondary text-base px-8 py-3">
                כניסה למרצים
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-[#f3f3f3] py-20 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="section-title mb-12 text-center">למה ללמוד אצלנו?</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="card p-6 text-center">
                  <div className="mb-4 text-4xl">{f.icon}</div>
                  <h3 className="mb-2 text-lg font-bold text-[#383838]">{f.title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bg-[#383838] py-16 px-4 text-white">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <div
                    className="mb-1 text-5xl font-extrabold text-[#00b6e5]"
                    style={{ fontFamily: 'var(--font-accent)' }}
                  >
                    {s.value}
                  </div>
                  <div className="text-sm text-gray-300">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-white py-20 px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="section-title mb-4">מוכנים להתחיל?</h2>
            <p className="mb-8 text-[#666666]">
              הצטרפו לאלפי לומדים ותיהנו מהתכנים הטובים ביותר.
            </p>
            <Link href="/login?role=student" className="btn-primary text-base px-10 py-3">
              כניסה לתלמידים
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#3a3a3a] py-10 px-4 text-center text-sm text-gray-400">
        <p className="mb-1 text-white font-semibold">נפש יהודי - מרכז ההרצאות והתכנים</p>
        <p>© {new Date().getFullYear()} כל הזכויות שמורות</p>
      </footer>
    </>
  );
}

const features = [
  {
    icon: '📚',
    title: 'תוכן איכותי',
    desc: 'שיעורים מוקלטים בעריכה מקצועית, זמינים לצפייה וקריאה בכל עת.',
  },
  {
    icon: '🎧',
    title: 'אודיו ווידאו',
    desc: 'האזינו בדרך, בנסיעה או בבית — בפורמטים שמתאימים לכם.',
  },
  {
    icon: '🔒',
    title: 'גישה מאובטחת',
    desc: 'תכנים מוגנים עם מערכת הרשאות מבוססת תפקיד ומאובטחת.',
  },
];

const stats = [
  { value: '500+', label: 'שיעורים' },
  { value: '12,000+', label: 'תלמידים' },
  { value: '50+', label: 'נושאים' },
];
