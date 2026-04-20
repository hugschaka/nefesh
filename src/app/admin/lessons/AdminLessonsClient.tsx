'use client';

interface PendingJob {
  jobId: string;
  lessonId: string;
  lessonTitle: string;
  podcastUrl?: string;
  quizUrl?: string;
  presentationUrl?: string;
  rawPresentationUrl?: string;
  notebookUrl?: string;
  editRequest?: string;
  createdAt: number;
  lecturerId: string;
  lecturerEmail: string;
  lecturerName: string;
}

export default function AdminLessonsClient({ initialJobs }: { initialJobs: PendingJob[] }) {
  return (
    <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">

        <div>
          <h1 className="section-title mb-1">שיעורים הממתינים לאישור המנחה</h1>
          <p className="text-sm text-[#666666]">
            שיעורים שהבוט סיים לעבד אך המנחה טרם אישר לפרסום
          </p>
        </div>

        {initialJobs.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-[#666666]">כל השיעורים אושרו — אין המתנה כרגע.</p>
          </div>
        )}

        {initialJobs.map((job) => (
          <div key={job.jobId} className="rounded-2xl bg-white shadow-md p-6 space-y-4">

            {/* Title + badge */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-[#383838] text-lg">{job.lessonTitle}</h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  {new Date(job.createdAt).toLocaleDateString('he-IL', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                ממתין למנחה
              </span>
            </div>

            {/* Lecturer info */}
            <div className="rounded-xl bg-[#f3f3f3] px-4 py-3 flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-[#666666]">מנחה: </span>
                <span className="font-semibold text-[#383838]">
                  {job.lecturerName || 'לא ידוע'}
                </span>
              </div>
              {job.lecturerEmail && (
                <div>
                  <span className="text-[#666666]">מייל: </span>
                  <a
                    href={`mailto:${job.lecturerEmail}`}
                    className="font-semibold text-[#00b6e5] hover:underline"
                    dir="ltr"
                  >
                    {job.lecturerEmail}
                  </a>
                </div>
              )}
            </div>

            {/* Content links */}
            <div className="flex flex-wrap gap-2">
              {job.notebookUrl && (
                <a href={job.notebookUrl} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 rounded-lg border border-[#00b6e5] px-3 py-1.5 text-sm text-[#00b6e5] hover:bg-[#f0fbff] transition">
                  <span>🔗</span> Notebook
                </a>
              )}
              {(job.rawPresentationUrl || job.presentationUrl) &&
               (job.rawPresentationUrl || job.presentationUrl) !== job.notebookUrl && (
                <a href={job.rawPresentationUrl || job.presentationUrl} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 rounded-lg border border-[#00b6e5] px-3 py-1.5 text-sm text-[#00b6e5] hover:bg-[#f0fbff] transition">
                  <span>📊</span> מצגת
                </a>
              )}
              {job.podcastUrl && job.podcastUrl !== job.notebookUrl && (
                <a href={job.podcastUrl} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 rounded-lg border border-purple-300 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 transition">
                  <span>🎙️</span> פודקאסט
                </a>
              )}
              {job.quizUrl && job.quizUrl !== job.notebookUrl && (
                <a href={job.quizUrl} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 rounded-lg border border-green-300 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 transition">
                  <span>📝</span> בוחן
                </a>
              )}
            </div>

          </div>
        ))}
      </div>
    </main>
  );
}
