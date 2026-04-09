import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import Navbar from '@/components/Navbar';
import AdminLessonsClient from './AdminLessonsClient';

async function getPendingJobs() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  
  if (!sessionCookie) return null;
  const [, role] = sessionCookie.split(':');
  if (role !== 'admin') return null;

  try {
    const snap = await adminDb
      .collection('jobs')
      .where('status', '==', 'pending_approval')
      .orderBy('createdAt', 'asc')
      .get();

    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        jobId: doc.id,
        lessonId: data.lessonId ?? '',
        lessonTitle: data.lessonTitle ?? '',
        podcastUrl: data.podcastUrl,
        quizUrl: data.quizUrl,
        presentationUrl: data.presentationUrl,
        rawPresentationUrl: data.rawPresentationUrl,
        notebookUrl: data.notebookUrl,
        createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
      };
    });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    return [];
  }
}

export default async function AdminLessonsPage() {
  const jobs = await getPendingJobs();

  if (!jobs) {
    return (
      <>
        <Navbar role="admin" />
        <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl bg-white p-12 text-center">
              <p className="text-2xl mb-3">🔒</p>
              <p className="text-[#666666]">לא מחובר או אין הרשאות</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar role="admin" />
      <AdminLessonsClient initialJobs={jobs} />
    </>
  );
}
