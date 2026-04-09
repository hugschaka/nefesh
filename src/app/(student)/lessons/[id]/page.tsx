'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import AdSlot from '@/components/AdSlot';
import type { Lesson } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  params: { id: string };
}

export default function LessonDetailPage({ params }: Props) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDoc(doc(db, 'lessons', params.id));
        if (!snap.exists() || !snap.data().isPublished) {
          setNotFound(true);
          return;
        }
        const raw = snap.data();
        setLesson({
          id: snap.id,
          ...raw,
          createdAt:
            raw.createdAt instanceof Timestamp ? raw.createdAt.toMillis() : raw.createdAt ?? 0,
          updatedAt:
            raw.updatedAt instanceof Timestamp ? raw.updatedAt.toMillis() : raw.updatedAt ?? 0,
        } as Lesson);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar role="student" />
        <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] flex items-center justify-center">
          <div className="text-[#666666] text-lg">טוען שיעור...</div>
        </main>
      </>
    );
  }

  if (notFound || !lesson) {
    return (
      <>
        <Navbar role="student" />
        <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-5xl">😕</p>
          <h1 className="text-2xl font-bold text-[#383838]">השיעור לא נמצא</h1>
          <p className="text-[#666666]">ייתכן שהשיעור הוסר או שאין לכם הרשאה לצפות בו.</p>
          <Link href="/lessons" className="btn-primary mt-2">
            חזרה לספרייה
          </Link>
        </main>
      </>
    );
  }

  const date = new Date(lesson.createdAt).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Navbar role="student" />
      <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-[#666666]">
            <Link href="/lessons" className="hover:text-[#00b6e5] transition-colors">
              ← ספריית שיעורים
            </Link>
          </nav>

          {/* Lesson card */}
          <article className="rounded-2xl bg-white shadow-md overflow-hidden">
            {/* Thumbnail */}
            {lesson.thumbnailUrl && (
              <div className="relative h-64 w-full bg-gray-100">
                <Image
                  src={lesson.thumbnailUrl}
                  alt={lesson.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            )}

            <div className="p-6 md:p-8">
              <h1
                className="mb-3 text-2xl font-extrabold text-[#383838] leading-tight"
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                {lesson.title}
              </h1>

              <div className="mb-4 flex items-center gap-4 text-sm text-[#666666]">
                {lesson.lecturerName && <span>מרצה: {lesson.lecturerName}</span>}
                <time dateTime={new Date(lesson.createdAt).toISOString()}>{date}</time>
              </div>

              {lesson.description && (
                <p className="mb-6 text-[#666666] leading-relaxed">{lesson.description}</p>
              )}

              {/* Media player / viewer */}
              <div className="mt-6 rounded-xl overflow-hidden bg-[#f3f3f3]">
                {lesson.fileType === 'mp4' && (
                  <video
                    src={lesson.fileUrl}
                    controls
                    className="w-full max-h-[480px]"
                    preload="metadata"
                  >
                    הדפדפן שלך אינו תומך בנגן וידאו.
                  </video>
                )}
                {lesson.fileType === 'mp3' && (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <p className="text-5xl">🎧</p>
                    <p className="font-semibold text-[#383838]">{lesson.title}</p>
                    <audio
                      src={lesson.fileUrl}
                      controls
                      className="w-full"
                      preload="metadata"
                    >
                      הדפדפן שלך אינו תומך בנגן אודיו.
                    </audio>
                  </div>
                )}
                {lesson.fileType === 'pdf' && (
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <p className="text-5xl">📄</p>
                    <p className="text-[#666666]">קובץ PDF זמין לצפייה והורדה:</p>
                    <a
                      href={lesson.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      פתח PDF
                    </a>
                  </div>
                )}
              </div>

              {/* ── Bot-generated content ── */}
              {(lesson.podcastUrl || lesson.quizUrl || lesson.presentationUrl) && (
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h2 className="mb-4 text-lg font-bold text-[#383838]">תכנים נוספים לשיעור זה</h2>
                  <div className="grid gap-3 sm:grid-cols-3">

                    {/* Podcast */}
                    {lesson.podcastUrl && (
                      <a
                        href={lesson.podcastUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 rounded-xl border border-[#00b6e5] bg-[#f0fbff] p-5 text-center transition hover:bg-[#e0f5ff]"
                      >
                        <span className="text-3xl">🎙️</span>
                        <span className="font-semibold text-[#383838]">פודקאסט</span>
                        <span className="text-xs text-[#666666]">האזינו לסיכום קולי</span>
                      </a>
                    )}

                    {/* Quiz / Study Guide */}
                    {lesson.quizUrl && (
                      <a
                        href={lesson.quizUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 rounded-xl border border-[#00b6e5] bg-[#f0fbff] p-5 text-center transition hover:bg-[#e0f5ff]"
                      >
                        <span className="text-3xl">📝</span>
                        <span className="font-semibold text-[#383838]">חידון ומדריך</span>
                        <span className="text-xs text-[#666666]">בחנו את עצמכם</span>
                      </a>
                    )}

                    {/* Presentation */}
                    {lesson.presentationUrl && (
                      <a
                        href={lesson.presentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 rounded-xl border border-[#00b6e5] bg-[#f0fbff] p-5 text-center transition hover:bg-[#e0f5ff]"
                      >
                        <span className="text-3xl">📊</span>
                        <span className="font-semibold text-[#383838]">מצגת</span>
                        <span className="text-xs text-[#666666]">הורידו את המצגת</span>
                      </a>
                    )}

                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Sidebar ad */}
          <div className="mt-8">
            <AdSlot position="bottom" />
          </div>
        </div>
      </main>

      <footer className="bg-[#3a3a3a] py-8 px-4 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} נפש יהודי - מרכז ההרצאות והתכנים — כל הזכויות שמורות</p>
      </footer>
    </>
  );
}
