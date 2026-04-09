'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import LessonCard from '@/components/LessonCard';
import AdSlot from '@/components/AdSlot';
import type { Lesson } from '@/lib/types';

function groupByLecturer(lessons: Lesson[]): { name: string; lessons: Lesson[] }[] {
  const map = new Map<string, { name: string; lessons: Lesson[] }>();
  for (const l of lessons) {
    const key = l.lecturerId;
    if (!map.has(key)) map.set(key, { name: l.lecturerName ?? 'מרצה', lessons: [] });
    map.get(key)!.lessons.push(l);
  }
  return Array.from(map.values());
}

function LecturerAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('');
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00b6e5] text-sm font-bold text-white shadow">
      {initials}
    </div>
  );
}

export default function StudentLessonsPage() {
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchLessons() {
      try {
        const q = query(
          collection(db, 'lessons'),
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setAllLessons(
          snap.docs.map((d) => {
            const raw = d.data();
            return {
              id: d.id,
              title: raw.title ?? '',
              description: raw.description ?? '',
              fileUrl: raw.fileUrl ?? '',
              fileType: raw.fileType ?? 'pdf',
              thumbnailUrl: raw.thumbnailUrl,
              lecturerId: raw.lecturerId ?? '',
              lecturerName: raw.lecturerName,
              isPublished: true,
              status: raw.status ?? 'done',
              notebookUrl: raw.notebookUrl,
              podcastUrl: raw.podcastUrl,
              quizUrl: raw.quizUrl,
              presentationUrl: raw.presentationUrl,
              rawPresentationUrl: raw.rawPresentationUrl,
              createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toMillis() : raw.createdAt ?? 0,
              updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt.toMillis() : raw.updatedAt ?? 0,
            } as Lesson;
          })
        );
      } catch (err) {
        console.error('[StudentLessons]', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLessons();
  }, []);

  const filtered =
    search.trim() === ''
      ? allLessons
      : allLessons.filter(
          (l) =>
            l.title.includes(search) ||
            (l.lecturerName ?? '').includes(search) ||
            (l.description ?? '').includes(search)
        );

  const groups = groupByLecturer(filtered);

  return (
    <>
      <Navbar role="student" />

      <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3]">
        {/* Top ad */}
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <div className="mx-auto max-w-6xl">
            <AdSlot position="top" />
          </div>
        </div>

        {/* Hero header */}
        <div className="bg-white border-b border-gray-100 px-4 py-10">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-1 text-3xl font-extrabold text-[#383838]" style={{ fontFamily: 'var(--font-accent)' }}>
              ספריית השיעורים
            </h1>
            <p className="mb-6 text-sm text-[#666666]">
              {loading ? '...' : `${allLessons.length} שיעורים זמינים`}
            </p>
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 end-3 flex items-center text-gray-400 pointer-events-none text-sm">🔍</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם שיעור או מרצה..."
                className="input-field pe-9"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-6xl px-4 py-10 space-y-14">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-10">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
                  </div>
                  <div className="flex gap-5">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="w-64 shrink-0 rounded-2xl bg-white shadow-md overflow-hidden animate-pulse">
                        <div className="h-40 bg-gray-200" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-semibold text-[#383838] mb-1">לא נמצאו שיעורים</p>
              <p className="text-sm text-[#666666]">
                {search ? 'נסו חיפוש אחר.' : 'אין שיעורים פורסמו עדיין.'}
              </p>
            </div>
          )}

          {/* Groups */}
          {!loading &&
            groups.map((group) => (
              <section key={group.name}>
                {/* Lecturer header */}
                <div className="mb-5 flex items-center gap-3">
                  <LecturerAvatar name={group.name} />
                  <div>
                    <h2 className="text-lg font-bold text-[#383838]" style={{ fontFamily: 'var(--font-accent)' }}>
                      {group.name}
                    </h2>
                    <p className="text-xs text-[#666666]">{group.lessons.length} שיעורים</p>
                  </div>
                </div>

                {/* Horizontal scroll */}
                <div
                  className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth
                    [&::-webkit-scrollbar]:h-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-[#00b6e5]/40"
                >
                  {group.lessons.map((lesson) => (
                    <div key={lesson.id} className="w-64 shrink-0 snap-start">
                      <LessonCard lesson={lesson} />
                    </div>
                  ))}
                </div>
              </section>
            ))}

          <div className="mt-4">
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
